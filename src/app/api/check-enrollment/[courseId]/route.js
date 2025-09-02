import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/moongose';
import Course from '../../../../models/course';
import Teacher from '@/models/instructor';
import jwt from 'jsonwebtoken';

const verifyToken = (request) => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch (error) {
    return null;
  }
};

export async function GET(request, { params }) {
  try {
    const { courseId } = await params;
    
    const token = request.headers.get('Authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ enrolled: false }, { status: 200 });
    }
    
    const payload = verifyToken(request);
    if (!payload) {
      return NextResponse.json({ enrolled: false }, { status: 200 });
    }
    
    const userId = payload.userId;
    
    await connectDB();
    
    const course = await Course.findById(courseId);
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    const isEnrolled = course.enrolledStudents.includes(userId);
    
    return NextResponse.json({ enrolled: isEnrolled }, { status: 200 });
  } catch (error) {
    console.error('Error checking enrollment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}