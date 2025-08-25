import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/moongose';
import Quiz from '@/models/quiz';
import Course from '@/models/course';
import Teacher from '@/models/instructor';

export async function POST(request) {
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
    
    const { title, description, questions, courseId, lectureId } = await request.json();
    
    if (!title) {
      return NextResponse.json({ error: 'Quiz title is required' }, { status: 400 });
    }
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'Quiz must have at least one question' }, { status: 400 });
    }
    
    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }
    
    const course = await Course.findById(courseId);
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    if (course.instructor.toString() !== teacher._id.toString()) {
      return NextResponse.json({ 
        error: 'You do not have permission to add quizzes to this course' 
      }, { status: 403 });
    }
    
    const lectureIndex = course.lectures.findIndex(
      lecture => lecture._id.toString() === lectureId
    );
    
    if (lectureIndex === -1) {
      return NextResponse.json({ error: 'Lecture not found in this course' }, { status: 404 });
    }
    
    const quiz = new Quiz({
      title,
      description,
      course: courseId,
      lecture: lectureId,
      questions,
      createdBy: teacher._id,
      aiGenerated: false
    });
    
    await quiz.save();
    
    course.lectures[lectureIndex].quizzes = [
      ...course.lectures[lectureIndex].quizzes || [],
      quiz._id
    ];
    
    await course.save();
    
    return NextResponse.json({
      message: 'Quiz created successfully',
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        questions: quiz.questions.length
      }
    });
  } catch (error) {
    console.error('Error creating quiz:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    const url = new URL(request.url);
    const lectureId = url.searchParams.get('lectureId');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectDB();
    
    if (lectureId) {
      const quizzes = await Quiz.find({ lecture: lectureId })
        .select('title description createdAt');
      
      return NextResponse.json({ quizzes });
    } else {
      return NextResponse.json({ error: 'Lecture ID is required' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}