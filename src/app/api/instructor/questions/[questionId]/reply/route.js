import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/moongose';
import Course from '@/models/course';
import Teacher from '@/models/instructor';
import mongoose from 'mongoose';

export async function POST(request, { params }) {
  try {
    const { questionId } = params;
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
    
    const { text } = await request.json();
    
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Reply text is required' }, { status: 400 });
    }
    
    const course = await Course.findOne({
      instructor: teacher._id,
      'lectures.questions._id': new mongoose.Types.ObjectId(questionId)
    });
    
    if (!course) {
      return NextResponse.json({ error: 'Question not found or unauthorized' }, { status: 404 });
    }
    
    let lectureIndex = -1;
    let questionIndex = -1;
    
    for (let i = 0; i < course.lectures.length; i++) {
      const lecture = course.lectures[i];
      if (lecture.questions) {
        for (let j = 0; j < lecture.questions.length; j++) {
          if (lecture.questions[j]._id.toString() === questionId) {
            lectureIndex = i;
            questionIndex = j;
            break;
          }
        }
        if (lectureIndex !== -1) break;
      }
    }
    
    if (lectureIndex === -1 || questionIndex === -1) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    
    const answer = {
      answeredBy: {
        _id: teacher._id,
        name: decoded.name,
        profilePicture: decoded.profilePicture || ''
      },
      text,
      createdAt: new Date()
    };
    
    course.lectures[lectureIndex].questions[questionIndex].answers.push(answer);
    
    await course.save();
    
    return NextResponse.json({ 
      message: 'Reply posted successfully',
      answer
    });
  } catch (error) {
    console.error('Error replying to question:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}