import { NextResponse } from 'next/server';
import connectDB from '@/lib/moongose';
import Course from '@/models/course';

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const courseId = params.courseId;
    
    const course = await Course.findById(courseId)
      .populate({
        path: 'instructor',
        select: 'bio expertise userId',
        populate: {
          path: 'userId',
          select: 'name'
        }
      });
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    if (!course.isPublished) {
      return NextResponse.json({ error: 'This course is not available' }, { status: 403 });
    }
    
    const instructorData = course.instructor ? {
      id: course.instructor._id,
      userId: course.instructor.userId,
      name: course.instructor.userId?.name || 'Unknown Instructor',
      bio: course.instructor.bio || '',
      expertise: course.instructor.expertise || []
    } : null;
    
    const courseData = {
      _id: course._id,
      title: course.title,
      description: course.description,
      category: course.category,
      tags: course.tags,
      price: course.price,
      level: course.level,
      thumbnail: course.thumbnail,
      duration: course.duration,
      rating: course.rating,
      totalEnrollments: course.totalEnrollments,
      instructor: instructorData,
      lectures: course.lectures.map(lecture => ({
        _id: lecture._id, // Include the lecture ID
        title: lecture.title,
        videoUrl: lecture.videoUrl,
        thumbnail: lecture.thumbnail,
        views: lecture.views,
        transcript: lecture.transcript,
        aiSummary: lecture.aiSummary,
        resources: lecture.resources ? lecture.resources.map(resource => ({
          _id: resource._id, // Include resource ID too
          title: resource.title,
          fileUrl: resource.fileUrl,
          fileType: resource.fileType
        })) : [],
        quizzes: lecture.quizzes,
        questions: lecture.questions.map(question => ({
          id: question._id,
          askedBy: question.askedBy,
          text: question.text,
          createdAt: question.createdAt,
          answers: question.answers.map(answer => ({
            id: answer._id,
            answeredBy: answer.answeredBy,
            text: answer.text,
            createdAt: answer.createdAt
          }))
        }))
      })),
      aiGeneratedSummary: course.aiGeneratedSummary,
      aiGeneratedQuizzes: course.aiGeneratedQuizzes,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt
    };
    
    return NextResponse.json({ success: true, course: courseData });
  } catch (error) {
    console.error('Error fetching course details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}