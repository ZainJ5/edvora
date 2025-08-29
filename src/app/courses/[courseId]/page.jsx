"use client"

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CourseHeader from '../components/CourseHeader';
import CourseContent from '../components/CourseContent';
import CourseEnrollment from '../components/CourseEnrollment';
import { useAuth } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import Image from 'next/image';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function CourseDetailPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId;

  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/courses/${courseId}`);

        if (!response.ok) {
          throw new Error(response.status === 404 ? 'Course not found' : 'Failed to fetch course details');
        }

        const data = await response.json();
        setCourse(data.course);
      } catch (err) {
        console.error('Error fetching course details:', err);
        setError(err.message);
        toast.error(err.message || 'Failed to load course');
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId) {
      fetchCourseDetails();
    }
  }, [courseId]);

  useEffect(() => {
    const checkEnrollment = async () => {
      if (!currentUser || !courseId) return;

      try {
        setCheckingEnrollment(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/check-enrollment/${courseId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setIsEnrolled(data.enrolled);
        }
      } catch (err) {
        console.error('Error checking enrollment:', err);
      } finally {
        setCheckingEnrollment(false);
      }
    };

    if (!authLoading) {
      checkEnrollment();
    }
  }, [courseId, currentUser, authLoading]);

  const handleEnroll = async () => {
    if (!currentUser) {
      toast.error('You must be logged in to enroll in this course');
      router.push('/auth?redirect=' + encodeURIComponent(`/courses/${courseId}`));
      return;
    }

    try {
      toast.loading('Processing your enrollment...', { id: 'enrolling' });
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (data.requiresPayment) {
        setClientSecret(data.clientSecret);
        setShowCheckout(true);
        toast.dismiss('enrolling');
        toast.success('Please complete the payment to enroll');
      } else if (data.enrolled) {
        setIsEnrolled(true);
        toast.dismiss('enrolling');
        toast.success('Successfully enrolled in the course!');
      } else {
        toast.dismiss('enrolling');
        toast.error(data.error || 'Enrollment failed. Please try again.');
      }
    } catch (err) {
      console.error('Error enrolling in course:', err);
      toast.dismiss('enrolling');
      toast.error('Failed to enroll in course. Please try again.');
    }
  };

  const handleCheckoutSuccess = () => {
    setShowCheckout(false);
    setIsEnrolled(true);
    toast.success('Payment successful! You are now enrolled.');
  };

  if (isLoading || checkingEnrollment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="relative h-16 w-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-t-4 border-[#2c3180] animate-spin"></div>
            <div className="absolute inset-0 flex items-center mx-auto justify-center">
              <Image
                src="/logo-1.png"
                alt="Edvora"
                width={32}
                height={32}
                className="rounded-md bg-white"
              />
            </div>
          </div>
          <p className="mt-4 text-[#2c3180] font-medium">Loading Courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 px-4 md:px-6 min-h-[60vh] flex items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="bg-red-100 p-2 rounded-full">
                <FaExclamationTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-800">Error</h3>
            </div>
            <p className="mt-4 text-gray-600">Course not found</p>
          </div>
          <div className="px-6 py-4 bg-gray-50">
            <Link
              href={'/courses'}
              className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md 
              transition-colors duration-200 flex items-center justify-center"
            >
              <FaArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="py-10 px-4 md:px-6 min-h-[60vh] flex items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="bg-red-100 p-2 rounded-full">
                <FaExclamationTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-800">Error</h3>
            </div>
            <p className="mt-4 text-gray-600">Course not found</p>
          </div>
          <div className="px-6 py-4 bg-gray-50">
            <Link
              href={'/courses'}
              className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md 
              transition-colors duration-200 flex items-center justify-center"
            >
              <FaArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: 'medium',
          },
          success: {
            iconTheme: {
              primary: '#4CAF50',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: '#E53935',
              secondary: 'white',
            },
          },
        }}
      />

      <CourseHeader course={course} isEnrolled={isEnrolled} />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <CourseContent
              course={course}
              isEnrolled={isEnrolled}
            />
          </div>

          <div className="lg:col-span-1">
            {showCheckout && clientSecret ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CourseEnrollment
                  course={course}
                  isEnrolled={isEnrolled}
                  onEnroll={handleEnroll}
                  showCheckout={showCheckout}
                  clientSecret={clientSecret}
                  onCheckoutSuccess={handleCheckoutSuccess}
                  courseId={courseId}
                />
              </Elements>
            ) : (
              <CourseEnrollment
                course={course}
                isEnrolled={isEnrolled}
                onEnroll={handleEnroll}
                showCheckout={showCheckout}
                courseId={courseId}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}