"use client"

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function CourseDetailPage() {
  const { currentUser, loading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId;
  
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  
  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const response = await fetch(`/api/courses/${courseId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Course not found');
          } else {
            throw new Error('Failed to fetch course details');
          }
        }
        
        const data = await response.json();
        setCourse(data.course);
      } catch (err) {
        console.error('Error fetching course details:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId) {
      fetchCourseDetails();
    }
  }, [courseId]);

  const handleEnroll = async () => {
    if (!currentUser) {
      router.push('/auth?redirect=' + encodeURIComponent(`/courses/${courseId}`));
      return;
    }
    
    setEnrolling(true);
    
    try {
      // Enrollment logic would go here
      // For now just show an alert
      alert('Enrollment functionality will be implemented soon!');
    } catch (err) {
      console.error('Error enrolling in course:', err);
      setError('Failed to enroll in course. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <p className="text-xl text-gray-600">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Error: {error}</p>
        </div>
        <Link 
          href="/courses"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Back to Courses
        </Link>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <p>Course not found</p>
        </div>
        <Link 
          href="/courses"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="container text-black mx-auto px-4 py-8">
      <div className="mb-6">
        <Link 
          href="/courses"
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Courses
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="relative h-64 md:h-96 bg-gray-200">
          {course.thumbnail ? (
            <Image 
              src={course.thumbnail}
              alt={course.title}
              fill
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-300">
              <span className="text-gray-500 text-xl">No thumbnail</span>
            </div>
          )}
        </div>
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800 mb-2 md:mb-0">{course.title}</h1>
            <div className="flex items-center">
              <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full mr-2">{course.level}</span>
              <div className="flex items-center text-yellow-500">
                <span className="mr-1 text-lg">★</span>
                <span className="font-bold">{course.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {course.tags && course.tags.map((tag, index) => (
              <span key={index} className="bg-gray-200 px-2 py-1 text-sm rounded-full text-gray-700">
                {tag}
              </span>
            ))}
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">About this course</h2>
            <p className="text-gray-700 whitespace-pre-line">{course.description || "No description provided."}</p>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Instructor</h2>
            {course.instructor ? (
              <div className="flex items-start">
                <div className="bg-gray-200 rounded-full h-12 w-12 flex items-center justify-center mr-3">
                  <span className="text-gray-600 font-bold">{course.instructor.name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="font-medium">{course.instructor.name}</h3>
                  {course.instructor.expertise && course.instructor.expertise.length > 0 && (
                    <p className="text-sm text-gray-600">
                      {course.instructor.expertise.join(', ')}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mt-1 line-clamp-3">{course.instructor.bio}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">Instructor information not available</p>
            )}
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Course Content</h2>
            <p className="text-gray-600 mb-2">{course.lectures?.length || 0} lectures</p>
            
            {course.lectures && course.lectures.length > 0 ? (
              <div className="border rounded-lg divide-y">
                {course.lectures.map((lecture, index) => (
                  <div key={index} className="p-3 hover:bg-gray-50">
                    <div className="flex items-start">
                      <div className="text-gray-500 mr-3">{index + 1}.</div>
                      <div>
                        <h3 className="font-medium">{lecture.title}</h3>
                        {lecture.resources > 0 && (
                          <p className="text-sm text-gray-600">{lecture.resources} resources</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No lectures available</p>
            )}
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center bg-gray-100 p-4 rounded-lg">
            <div>
              <div className="text-2xl font-bold text-gray-800 mb-1">${course.price.toFixed(2)}</div>
              <p className="text-gray-600 text-sm">Enrolled Students: {course.totalEnrollments}</p>
            </div>
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              className={`mt-4 md:mt-0 w-full md:w-auto px-6 py-3 rounded-lg font-medium ${
                enrolling
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {enrolling ? 'Processing...' : 'Enroll Now'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Reviews</h2>
        
        {course.reviews && course.reviews.length > 0 ? (
          <div className="divide-y">
            {course.reviews.map((review) => (
              <div key={review.id} className="py-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <div className="bg-gray-200 rounded-full h-8 w-8 flex items-center justify-center mr-2">
                      <span className="text-gray-600 font-bold">{review.userName.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium">{review.userName}</p>
                      <p className="text-xs text-gray-500">{new Date(review.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-yellow-500">
                    <span className="mr-1">★</span>
                    <span>{review.rating.toFixed(1)}</span>
                  </div>
                </div>
                <p className="text-gray-700">{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No reviews yet</p>
        )}
      </div>
    </div>
  );
}
