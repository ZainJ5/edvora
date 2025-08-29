import { NextResponse } from 'next/server';
import connectDB from '@/lib/moongose';
import Course from '@/models/course';
import User from '@/models/user';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function verifyAuth(request) {
  try {
    const headersList = headers();
    const authorization = request.headers.get('authorization') || headersList.get('authorization');
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return { success: false, error: 'Unauthorized', status: 401 };
    }
    
    const token = authorization.split(' ')[1];
    
    if (!token) {
      return { success: false, error: 'Unauthorized', status: 401 };
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.exp * 1000 < Date.now()) {
      return { success: false, error: 'Token expired', status: 401 };
    }
    
    return { 
      success: true, 
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email,
      name: decoded.name
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { success: false, error: 'Invalid token', status: 401 };
  }
}

export async function POST(request, { params }) {
  try {
    await connectDB();
    const { courseId, lectureId, questionId } = await params;
    
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    
    const userId = authResult.userId;
    
    if (authResult.role !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { text } = await request.json();
    
    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Answer text is required' }, { status: 400 });
    }
    
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    if (course.instructor.toString() !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const lecture = course.lectures.id(lectureId);
    if (!lecture) {
      return NextResponse.json({ error: 'Lecture not found' }, { status: 404 });
    }
    
    const question = lecture.questions.id(questionId);
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    
    const newAnswer = {
      answeredBy: userId,
      text,
      createdAt: new Date()
    };
    
    question.answers.push(newAnswer);
    await course.save();
    
    const updatedCourse = await Course.findById(courseId)
      .populate({
        path: 'lectures.questions.answers.answeredBy',
        select: 'name email'
      });
    
    const updatedLecture = updatedCourse.lectures.id(lectureId);
    const updatedQuestion = updatedLecture.questions.id(questionId);
    const savedAnswer = updatedQuestion.answers[updatedQuestion.answers.length - 1];
    
    const answerResponse = {
      _id: savedAnswer._id,
      text: savedAnswer.text,
      createdAt: savedAnswer.createdAt,
      answeredBy: savedAnswer.answeredBy ? {
        _id: savedAnswer.answeredBy._id,
        name: savedAnswer.answeredBy.name,
        email: savedAnswer.answeredBy.email,
      } : null
    };
    
    return NextResponse.json({ 
      success: true, 
      answer: answerResponse 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating answer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}