import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/moongose';
import Course from '@/models/course';
import Teacher from '@/models/instructor';
import fs from 'fs';
import path from 'path';

const ensureDirectoryExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
  return directory;
};

const generateUniqueFilename = (originalFilename = 'image.jpg') => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = path.extname(originalFilename) || '.jpg';
  const baseName = path.basename(originalFilename, extension);
  return `${baseName}_${timestamp}_${randomString}${extension}`;
};

const saveBase64Image = (base64String, destinationPath) => {
  try {
    if (!base64String || !base64String.includes('base64')) {
      throw new Error('Invalid base64 image format');
    }
    
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(destinationPath, buffer);
    return destinationPath;
  } catch (error) {
    console.error('Error saving image:', error);
    throw new Error('Failed to save thumbnail image');
  }
};

async function verifyInstructorCourse(token, courseId) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
  if (decoded.role !== 'instructor') {
    return { error: 'Forbidden', status: 403 };
  }
  
  await connectDB();
  
  const teacher = await Teacher.findOne({ userId: decoded.userId });
  
  if (!teacher) {
    return { error: 'Teacher profile not found', status: 404 };
  }
  
  const course = await Course.findById(courseId);
  
  if (!course) {
    return { error: 'Course not found', status: 404 };
  }
  
  if (course.instructor.toString() !== teacher._id.toString()) {
    return { error: 'You do not have permission to access this course', status: 403 };
  }
  
  return { teacher, course };
}

export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    const courseId = await params.courseid; 
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const result = await verifyInstructorCourse(token, courseId);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    return NextResponse.json({ course: result.course });
  } catch (error) {
    console.error('Error in instructor course GET:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    const courseId = await params.courseid; 
    console.log("Request Object is:",request)
    console.log("Params Object is:",params)
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const result = await verifyInstructorCourse(token, courseId);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    const { course } = result;
    const updateData = await request.json();
    console.log("Data is:",updateData)
    
    if (!updateData.title) {
      return NextResponse.json({ error: 'Course title is required' }, { status: 400 });
    }
    
    if (!updateData.description) {
      return NextResponse.json({ error: 'Course description is required' }, { status: 400 });
    }
    
    if (!updateData.category) {
      return NextResponse.json({ error: 'Course category is required' }, { status: 400 });
    }
    
    if (!updateData.duration || updateData.duration < 1) {
      return NextResponse.json({ error: 'Course duration must be at least 1 hour' }, { status: 400 });
    }
    
    if (!updateData.thumbnail) {
      return NextResponse.json({ error: 'Course thumbnail is required' }, { status: 400 });
    }
    
    if (updateData.thumbnail && updateData.thumbnail.includes('base64')) {
      const publicDir = path.join(process.cwd(), 'public');
      const thumbnailsDir = path.join(publicDir, 'thumbnails');
      ensureDirectoryExists(thumbnailsDir);
      
      const uniqueFilename = generateUniqueFilename('thumbnail.jpg');
      const thumbnailPath = path.join(thumbnailsDir, uniqueFilename);
      
      try {
        saveBase64Image(updateData.thumbnail, thumbnailPath);
        
        if (course.thumbnail && course.thumbnail !== updateData.thumbnail) {
          const oldThumbnailPath = path.join(publicDir, course.thumbnail);
          if (fs.existsSync(oldThumbnailPath)) {
            fs.unlinkSync(oldThumbnailPath);
          }
        }
        
        updateData.thumbnail = `/thumbnails/${uniqueFilename}`;
      } catch (imageError) {
        return NextResponse.json({ error: imageError.message }, { status: 400 });
      }
    }
    
    Object.keys(updateData).forEach(key => {
      if (key !== '_id' && key !== 'instructor' && key !== 'enrolledStudents' && 
          key !== 'totalEnrollments' && key !== 'rating' && key !== 'reviews') {
        course[key] = updateData[key];
      }
    });
    
    await course.save();
    
    return NextResponse.json({ 
      message: 'Course updated successfully',
      course
    });
  } catch (error) {
    console.error('Error in instructor course PUT:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    const courseId = await params.courseid; 
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const result = await verifyInstructorCourse(token, courseId);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    const { teacher, course } = result;
    
    if (course.thumbnail) {
      const publicDir = path.join(process.cwd(), 'public');
      const thumbnailPath = path.join(publicDir, course.thumbnail);
      
      if (fs.existsSync(thumbnailPath)) {
        try {
          fs.unlinkSync(thumbnailPath);
        } catch (fileError) {
          console.error('Error deleting thumbnail file:', fileError);
        }
      }
    }
    
    teacher.courses = teacher.courses.filter(id => id.toString() !== courseId);
    teacher.totalCourses = teacher.courses.length;
    await teacher.save();
    
    await Course.findByIdAndDelete(courseId);
    
    return NextResponse.json({ 
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Error in instructor course DELETE:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}