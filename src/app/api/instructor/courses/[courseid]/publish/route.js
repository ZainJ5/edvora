import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/moongose';
import Course from '@/models/course';
import Teacher from '@/models/instructor';

export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    const courseId = params.courseid; 
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
    
    const course = await Course.findById(courseId);
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    if (course.instructor.toString() !== teacher._id.toString()) {
      return NextResponse.json({ error: 'You do not have permission to access this course' }, { status: 403 });
    }
    
    const { isPublished } = await request.json();
    
    if (isPublished && (!course.lectures || course.lectures.length === 0)) {
      return NextResponse.json({ 
        error: 'Cannot publish a course without any lectures' 
      }, { status: 400 });
    }
    
    course.isPublished = isPublished;
    await course.save();
    
    return NextResponse.json({ 
      message: isPublished ? 'Course published successfully' : 'Course unpublished successfully',
      isPublished: course.isPublished
    });
  } catch (error) {
    console.error('Error in course publish PUT:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
