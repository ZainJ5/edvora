import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/moongose';
import Teacher from '@/models/instructor';
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

export async function POST(request) {
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

    const body = await request.json();
    const { bio, expertise } = body;

    if (!bio || !expertise || expertise.length === 0) {
      return NextResponse.json(
        { error: 'Bio and at least one area of expertise are required' },
        { status: 400 }
      );
    }

    let teacher = await Teacher.findOne({ userId: decoded.userId });

    if (teacher) {
      teacher.bio = bio;
      teacher.expertise = expertise;
      teacher.profileCompleted = true;
      await teacher.save();
    } else {
      teacher = new Teacher({
        userId: decoded.userId,
        bio,
        expertise,
        profileCompleted: true
      });
      await teacher.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Teacher profile completed successfully',
      teacher
    });
  } catch (error) {
    console.error('Error completing teacher profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
