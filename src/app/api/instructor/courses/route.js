import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/moongose';
import Course from '@/models/course';
import Teacher from '@/models/instructor';

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
    
    const newCourse = new Course({
      ...courseData,
      instructor: teacher._id,
      lectures: [],
      enrolledStudents: [],
      totalEnrollments: 0,
      rating: 0,
      reviews: []
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
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
