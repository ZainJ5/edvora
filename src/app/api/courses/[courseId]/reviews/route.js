import { NextResponse } from 'next/server';
import connectDB from '@/lib/moongose'; 
import Course from '@/models/course';
import User from '@/models/user';
import Review from '@/models/review';
import jwt from 'jsonwebtoken';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const courseId = await params.courseId;

    const reviews = await Review.find({ courseId }).sort({ createdAt: -1 });
    
    const processedReviews = await Promise.all(reviews.map(async (review) => {
      const user = await User.findById(review.userId);
      return {
        id: review._id,
        userName: user?.name || 'Anonymous',
        date: review.createdAt,
        rating: review.rating,
        comment: review.comment
      };
    }));

    const avgRating = reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;
      
    let userHasReviewed = false;
    
    const authorization = request.headers.get('authorization');
    if (authorization) {
      const token = authorization.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        
        const existingReview = await Review.findOne({ courseId, userId });
        userHasReviewed = !!existingReview;
      } catch (err) {
        console.error("Token verification error:", err);
      }
    }

    return NextResponse.json({ 
      reviews: processedReviews, 
      avgRating, 
      userHasReviewed 
    }, { status: 200 });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch reviews' 
    }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    await connectDB();

    const { rating, comment } = await request.json();
    const courseId = await params.courseId;

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

    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    if (!course.enrolledStudents.includes(userId)) {
      return NextResponse.json({ success: false, error: 'Not enrolled in this course' }, { status: 403 });
    }

    const existingReview = await Review.findOne({ courseId, userId });
    if (existingReview) {
      return NextResponse.json({ success: false, error: 'Already reviewed' }, { status: 400 });
    }

    const review = new Review({
      courseId,
      userId,
      rating,
      comment
    });
    await review.save();

    const reviews = await Review.find({ courseId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Course.findByIdAndUpdate(courseId, { rating: avgRating.toFixed(1) });

    const user = await User.findById(userId);

    const responseReview = {
      userName: user.name || 'Anonymous',
      date: review.createdAt,
      rating,
      comment
    };

    return NextResponse.json(responseReview, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to add review' }, { status: 500 });
  }
}