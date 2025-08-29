import { NextResponse } from 'next/server';
import connectDB from '@/lib/moongose';
import User from '@/models/user';
import Course from '@/models/course';
import jwt from 'jsonwebtoken';

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { courseId } = params;
    
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
    
    let courseProgress = null;
    
    if (user.courseProgress && user.courseProgress.length > 0) {
      courseProgress = user.courseProgress.find(
        p => p.course.toString() === courseId
      );
    }
    
    return NextResponse.json({ 
      success: true,
      courseProgress
    }, { status: 200 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch progress data' 
    }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    await connectDB();
    
    const { courseId } = params;
    const { completedLectures, completedQuizzes, progress } = await request.json();
    
    console.log("Received progress data:", { completedLectures, completedQuizzes, progress });
    
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
    
    if (!Array.isArray(completedLectures) || !Array.isArray(completedQuizzes)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid data format: completedLectures and completedQuizzes must be arrays' 
      }, { status: 400 });
    }
    
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    
    if (!user.courseProgress) {
      user.courseProgress = [];
    }
    
    const validCompletedLectures = completedLectures.filter(id => id && typeof id === 'string');
    const validCompletedQuizzes = completedQuizzes.filter(id => id && typeof id === 'string');
    
    console.log("Validated data:", { 
      validCompletedLectures, 
      validCompletedQuizzes,
      validCompletedLecturesLength: validCompletedLectures.length,
      validCompletedQuizzesLength: validCompletedQuizzes.length
    });
    
    const existingProgressIndex = user.courseProgress.findIndex(
      p => p.course.toString() === courseId
    );
    
    const validProgress = Math.min(Math.max(0, progress || 0), 100);
    
    if (existingProgressIndex >= 0) {
      user.courseProgress[existingProgressIndex].completedLectures = validCompletedLectures;
      user.courseProgress[existingProgressIndex].completedQuizzes = validCompletedQuizzes;
      user.courseProgress[existingProgressIndex].progress = validProgress;
      user.courseProgress[existingProgressIndex].lastAccessed = new Date();
    } else {
      user.courseProgress.push({
        course: courseId,
        completedLectures: validCompletedLectures,
        completedQuizzes: validCompletedQuizzes,
        progress: validProgress,
        lastAccessed: new Date()
      });
    }
    
    await user.save();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Progress updated successfully',
      courseProgress: existingProgressIndex >= 0 
        ? user.courseProgress[existingProgressIndex] 
        : user.courseProgress[user.courseProgress.length - 1]
    }, { status: 200 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update progress' 
    }, { status: 500 });
  }
}