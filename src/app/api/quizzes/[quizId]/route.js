import { NextResponse } from 'next/server';
import connectDB from '@/lib/moongose';
import Quiz from '@/models/quiz';
import jwt from 'jsonwebtoken';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { quizId } = params;
    
    const authorization = request.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const token = authorization.split(' ')[1];
    
    try {
      jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }
    
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return NextResponse.json({ success: false, error: 'Quiz not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, quiz }, { status: 200 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch quiz' 
    }, { status: 500 });
  }
}