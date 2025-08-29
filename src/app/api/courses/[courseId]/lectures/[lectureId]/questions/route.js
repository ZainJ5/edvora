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

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { courseId, lectureId } = await params;
    
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    
    const course = await Course.findById(courseId)
      .populate({
        path: 'lectures.questions.askedBy',
        select: 'name email'
      })
      .populate({
        path: 'lectures.questions.answers.answeredBy',
        select: 'name email'
      });
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    const lecture = course.lectures.id(lectureId);
    if (!lecture) {
      return NextResponse.json({ error: 'Lecture not found' }, { status: 404 });
    }
    
    const questions = lecture.questions.map(q => ({
      _id: q._id,
      text: q.text,
      createdAt: q.createdAt,
      askedBy: q.askedBy ? {
        _id: q.askedBy._id,
        name: q.askedBy.name,
        email: q.askedBy.email,
      } : null,
      answers: q.answers.map(a => ({
        _id: a._id,
        text: a.text,
        createdAt: a.createdAt,
        answeredBy: a.answeredBy ? {
          _id: a.answeredBy._id,
          name: a.answeredBy.name,
          email: a.answeredBy.email,
        } : null
      }))
    }));
    
    return NextResponse.json({ success: true, questions });
  } catch (error) {
    console.error('Error fetching lecture questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    await connectDB();
    const { courseId, lectureId } = await params;
    
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    
    const userId = authResult.userId;
    
    const { text } = await request.json();
    
    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Question text is required' }, { status: 400 });
    }
    
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    const lecture = course.lectures.id(lectureId);
    if (!lecture) {
      return NextResponse.json({ error: 'Lecture not found' }, { status: 404 });
    }
    
    const newQuestion = {
      askedBy: userId,
      text,
      createdAt: new Date(),
      answers: []
    };
    
    lecture.questions.push(newQuestion);
    await course.save();
    
    const updatedCourse = await Course.findById(courseId)
      .populate({
        path: 'lectures.questions.askedBy',
        select: 'name email'
      });
    
    const updatedLecture = updatedCourse.lectures.id(lectureId);
    const savedQuestion = updatedLecture.questions[updatedLecture.questions.length - 1];
    
    const questionResponse = {
      _id: savedQuestion._id,
      text: savedQuestion.text,
      createdAt: savedQuestion.createdAt,
      askedBy: savedQuestion.askedBy ? {
        _id: savedQuestion.askedBy._id,
        name: savedQuestion.askedBy.name,
        email: savedQuestion.askedBy.email,
      } : null,
      answers: []
    };
    
    return NextResponse.json({ 
      success: true, 
      question: questionResponse 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}