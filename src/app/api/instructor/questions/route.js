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
    
    if (!courses || courses.length === 0) {
      return NextResponse.json({ questions: [] });
    }
    
    const courseIds = courses.map(course => course._id);
    
    const questions = [];
    
    courses.forEach(course => {
      course.lectures.forEach(lecture => {
        if (lecture.questions && lecture.questions.length > 0) {
          lecture.questions.forEach(question => {
            questions.push({
              _id: question._id,
              text: question.text,
              askedBy: question.askedBy,
              createdAt: question.createdAt,
              answers: question.answers || [],
              course: {
                _id: course._id,
                title: course.title,
                instructor: course.instructor
              },
              lecture: {
                _id: lecture._id,
                title: lecture.title
              }
            });
          });
        }
      });
    });
    
    questions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error fetching instructor questions:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}