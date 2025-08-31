import connectDB from '../../../../../../../lib/moongose';
import Quiz from '@/models/quiz';
import Course from '@/models/course';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error('Invalid token:', err.message);
    return null;
  }
}

export async function POST(req, { params }) {
  try {
    await connectDB();
    
    const { courseId, lectureId } = params;
    const quizData = await req.json();
    
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const course = await Course.findById(courseId);
    if (!course) {
      return Response.json({ error: 'Course not found' }, { status: 404 });
    }
    
    const newQuiz = new Quiz({
      title: quizData.title,
      description: quizData.description,
      course: courseId,
      lecture: lectureId,
      questions: quizData.questions,
      createdBy: course.instructor,
      aiGenerated: quizData.aiGenerated || false,
    });
    
    await newQuiz.save();
    
    const lectureIndex = course.lectures.findIndex(
      lecture => lecture._id.toString() === lectureId
    );
    
    if (lectureIndex >= 0) {
      if (!course.lectures[lectureIndex].quizzes) {
        course.lectures[lectureIndex].quizzes = [];
      }
      course.lectures[lectureIndex].quizzes.push(newQuiz._id);
      await course.save();
    }
    
    return Response.json({ success: true, quiz: newQuiz });
  } catch (error) {
    console.error('Error creating quiz:', error);
    return Response.json({ error: 'Failed to create quiz' }, { status: 500 });
  }
}
