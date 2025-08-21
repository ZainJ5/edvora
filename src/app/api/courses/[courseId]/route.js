import { NextResponse } from 'next/server';
import connectDB from '@/lib/moongose';
import mongoose from "mongoose"
import Course from '@/models/course';
import Teacher from '@/models/instructor';
import Review from '@/models/review';

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
      })
      .populate({
        path: 'reviews',
        model: Review,
        select: 'rating comment user createdAt',
        populate: {
          path: 'user',
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
      rating: course.rating,
      totalEnrollments: course.totalEnrollments,
      instructor: instructorData,
      lectures: course.lectures.map(lecture => ({
        title: lecture.title,
        thumbnail: lecture.thumbnail,
        resources: lecture.resources ? lecture.resources.length : 0,
        // Don't include video URL for security purposes
      })),
      reviews: course.reviews.map(review => ({
        id: review._id,
        rating: review.rating,
        comment: review.comment,
        userName: review.user?.name || 'Anonymous',
        date: review.createdAt
      })),
      createdAt: course.createdAt,
      updatedAt: course.updatedAt
    };
    
    return NextResponse.json({ success: true, course: courseData });
  } catch (error) {
    console.error('Error fetching course details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
