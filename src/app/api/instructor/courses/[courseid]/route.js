import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/moongose';
import Course from '@/models/course';
import Teacher from '@/models/instructor';

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
    const courseId = params.courseid; 
    
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
    const courseId = params.courseid; 
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const result = await verifyInstructorCourse(token, courseId);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    const { course } = result;
    const updateData = await request.json();
    
    if (!updateData.title) {
      return NextResponse.json({ error: 'Course title is required' }, { status: 400 });
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
    const courseId = params.courseid; 
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const result = await verifyInstructorCourse(token, courseId);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    const { teacher, course } = result;
    
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
