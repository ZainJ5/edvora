import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/moongose';
import Teacher from '@/models/teacher';
import User from '@/models/user';

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

export async function GET(request) {
  try {
    await connectDB();

    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'instructor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const teacher = await Teacher.findOne({ userId: decoded.userId });
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, teacher });
  } catch (error) {
    console.error('Error getting teacher profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
