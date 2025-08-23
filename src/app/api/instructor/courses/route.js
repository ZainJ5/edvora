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

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    await connectDB();
    
    const teacher = await Teacher.findOne({ userId: decoded.userId });
    
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }
    
    const courses = await Course.find({ instructor: teacher._id });
    
    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Error in instructor courses GET:', error);    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    await connectDB();
    
    const teacher = await Teacher.findOne({ userId: decoded.userId });
    
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }
    
    const courseData = await request.json();
    
    if (!courseData.title) {
      return NextResponse.json({ error: 'Course title is required' }, { status: 400 });
    }
    if (!courseData.description) {
      return NextResponse.json({ error: 'Course description is required' }, { status: 400 });
    }
    if (!courseData.category) {
      return NextResponse.json({ error: 'Course category is required' }, { status: 400 });
    }
    if (!courseData.duration || courseData.duration < 1) {
      return NextResponse.json({ error: 'Course duration must be at least 1 hour' }, { status: 400 });
    }
    
    if (!courseData.thumbnail) {
      return NextResponse.json({ error: 'Course thumbnail is required' }, { status: 400 });
    }
    
    const publicDir = path.join(process.cwd(), 'public');
    const thumbnailsDir = path.join(publicDir, 'thumbnails');
    ensureDirectoryExists(thumbnailsDir);
    
    const uniqueFilename = generateUniqueFilename('thumbnail.jpg');
    const thumbnailPath = path.join(thumbnailsDir, uniqueFilename);
    
    try {
      saveBase64Image(courseData.thumbnail, thumbnailPath);
    } catch (imageError) {
      return NextResponse.json({ error: imageError.message }, { status: 400 });
    }
    
    const relativeThumbnailPath = `/thumbnails/${uniqueFilename}`;
    
    const newCourse = new Course({
      title: courseData.title,
      description: courseData.description,
      category: courseData.category,
      tags: courseData.tags || [],
      price: courseData.price || 0,
      level: courseData.level || "Beginner",
      duration: courseData.duration,
      instructor: teacher._id,
      thumbnail: relativeThumbnailPath,
      lectures: [],
      enrolledStudents: [],
      totalEnrollments: 0,
      rating: 0,
      reviews: [],
      isPublished: false
    });
    
    await newCourse.save();
    
    teacher.courses.push(newCourse._id);
    teacher.totalCourses = teacher.courses.length;
    await teacher.save();
    
    return NextResponse.json({ 
      message: 'Course created successfully',
      course: newCourse
    }, { status: 201 });
  } catch (error) {
    console.error('Error in instructor courses POST:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}