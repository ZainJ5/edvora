import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/moongose';
import Course from '../../../../../models/course';
import User from '../../../../../models/user';
import Stripe from 'stripe';
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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request, { params }) {
  try {
    const { courseId } = params;
    const body = await request.json();
    const { paymentIntentId } = body;
    
    const token = request.headers.get('Authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const payload = verifyToken(request);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const userId = payload.userId;
    
    await connectDB();
    
    const course = await Course.findById(courseId);
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    if (course.enrolledStudents.includes(userId)) {
      return NextResponse.json({ 
        message: 'Already enrolled in this course',
        enrolled: true 
      }, { status: 200 });
    }
    
    if (course.price > 0 && !paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(course.price * 100), 
        currency: 'usd',
        metadata: {
          courseId,
          userId
        }
      });
      
      return NextResponse.json({ 
        requiresPayment: true,
        clientSecret: paymentIntent.client_secret 
      }, { status: 200 });
    }
    
    course.enrolledStudents.push(userId);
    course.totalEnrollments += 1;
    await course.save();
    
    await User.findByIdAndUpdate(userId, {
      $addToSet: { enrolledCourses: courseId }
    });
    
    return NextResponse.json({ 
      message: 'Successfully enrolled in the course',
      enrolled: true
    }, { status: 200 });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}