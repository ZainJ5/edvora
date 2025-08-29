import { NextResponse } from 'next/server';
import connectDB from '@/lib/moongose';
import Quiz from '@/models/quiz';
import User from '@/models/user';
import jwt from 'jsonwebtoken';

export async function POST(request, { params }) {
  try {
    await connectDB();
    const { quizId } = params;
    const { score, answers } = await request.json();
    
    const authorization = request.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const token = authorization.split(' ')[1];
    
    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch (err) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return NextResponse.json({ success: false, error: 'Quiz not found' }, { status: 404 });
    }
    
    const attempt = {
      student: userId,
      score,
      submittedAt: new Date()
    };
    
    quiz.attempts.push(attempt);
    await quiz.save();
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to save quiz attempt' 
    }, { status: 500 });
  }
}