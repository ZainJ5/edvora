import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/moongose';
import Course from '@/models/course';
import Teacher from '@/models/instructor';

async function verifyInstructorCourse(token, courseId) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
  if (decoded.role !== 'instructor') {
    return { error: 'Forbidden', status: 403 };
  }
  
  await dbConnect();
  
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
    const { fromIndex, toIndex } = await request.json();
    
    if (!course.lectures || 
        fromIndex < 0 || fromIndex >= course.lectures.length || 
        toIndex < 0 || toIndex >= course.lectures.length) {
      return NextResponse.json({ error: 'Invalid lecture indices' }, { status: 400 });
    }
    
    const lectures = [...course.lectures];
    const [movedLecture] = lectures.splice(fromIndex, 1);
    lectures.splice(toIndex, 0, movedLecture);
    
    course.lectures = lectures;
    await course.save();
    
    return NextResponse.json({ 
      message: 'Lectures reordered successfully',
      lectures: course.lectures
    });
  } catch (error) {
    console.error('Error in lectures reorder PUT:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
