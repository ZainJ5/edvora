"use client"

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { 
  FaStar, 
  FaRegStar, 
  FaStarHalfAlt, 
  FaRegClock, 
  FaUserGraduate, 
  FaUsers, 
  FaPlayCircle, 
  FaFileDownload, 
  FaArrowLeft,
  FaCertificate,
  FaChevronDown,
  FaChevronUp,
  FaRegCalendarAlt
} from 'react-icons/fa';

export default function CourseDetailPage() {
  const { currentUser, loading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId;
  
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  
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

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<FaStar key={i} className="text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className="text-yellow-400" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-yellow-400" />);
      }
    }
    
    return stars;
  };

  if (isLoading) {
    return (
      <div className="py-10 px-4 md:px-6">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border-t-4 border-purple-600 animate-spin"></div>
            <div className="absolute inset-3 rounded-full border-2 border-purple-100"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 px-4 md:px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="bg-red-100 p-2 rounded-full">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-800">Error Loading Course</h3>
            </div>
            <p className="mt-4 text-gray-600">{error}</p>
          </div>
          <div className="px-6 py-4 bg-gray-50">
            <Link 
              href="/courses"
              className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors duration-200 flex items-center justify-center"
            >
              <FaArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="py-10 px-4 md:px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-2 rounded-full">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-800">Course Not Found</h3>
            </div>
            <p className="mt-4 text-gray-600">The course you are looking for could not be found.</p>
          </div>
          <div className="px-6 py-4 bg-gray-50">
            <Link 
              href="/courses"
              className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors duration-200 flex items-center justify-center"
            >
              <FaArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 md:px-6">
      <div className="mb-6">
        <Link 
          href="/courses"
          className="text-purple-600 hover:text-purple-800 flex items-center font-medium"
        >
          <FaArrowLeft className="h-4 w-4 mr-1" />
          Back to Courses
        </Link>
      </div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-8"
      >
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="relative h-64 md:h-80 lg:h-96 bg-gradient-to-r from-purple-50 to-indigo-50">
            {course.thumbnail ? (
              <Image 
                src={course.thumbnail}
                alt={course.title}
                fill
                priority
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="bg-purple-100 p-4 inline-flex rounded-full mb-4">
                    <FaPlayCircle size={40} className="text-purple-600" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-700">{course.title}</h3>
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-30"></div>
            <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
              <div className="bg-black bg-opacity-50 backdrop-blur-sm p-4 md:p-6 rounded-xl max-w-3xl">
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`${course.category ? 'bg-purple-500' : 'bg-gray-500'} text-white text-xs px-2 py-1 rounded`}>
                    {course.category || "General"}
                  </span>
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    {course.level}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold font-playfair mb-2">{course.title}</h1>
                <div className="flex flex-wrap items-center text-sm text-gray-100 gap-4 md:gap-6">
                  <div className="flex items-center">
                    <div className="flex mr-1">
                      {renderStars(course.rating)}
                    </div>
                    <span className="font-medium">({course.rating.toFixed(1)})</span>
                  </div>
                  <div className="flex items-center">
                    <FaUsers className="mr-1" />
                    <span>{course.totalEnrollments} students</span>
                  </div>
                  <div className="flex items-center">
                    <FaRegCalendarAlt className="mr-1" />
                    <span>Last updated {new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 p-6">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 font-playfair">About this course</h2>
                <div className="prose max-w-none text-gray-700">
                  {course.description ? (
                    <p className="whitespace-pre-line">{course.description}</p>
                  ) : (
                    <p className="text-gray-500 italic">No description provided for this course.</p>
                  )}
                </div>
              </div>
              
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 font-playfair">What you'll learn</h2>
                {course.learningOutcomes && course.learningOutcomes.length > 0 ? (
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {course.learningOutcomes.map((outcome, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700">{outcome}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-500 italic">Learning outcomes for this course will be available soon.</p>
                  </div>
                )}
              </div>
              
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 font-playfair">Instructor</h2>
                {course.instructor ? (
                  <div className="flex items-start p-5 bg-gray-50 rounded-lg">
                    <div className="bg-purple-100 rounded-full h-16 w-16 flex items-center justify-center mr-4">
                      {course.instructor.avatar ? (
                        <Image
                          src={course.instructor.avatar}
                          alt={course.instructor.name}
                          width={64}
                          height={64}
                          className="rounded-full"
                        />
                      ) : (
                        <span className="text-purple-600 font-bold text-2xl">
                          {course.instructor.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{course.instructor.name}</h3>
                      {course.instructor.expertise && course.instructor.expertise.length > 0 && (
                        <p className="text-sm text-gray-600 mb-2">
                          {course.instructor.expertise.join(' • ')}
                        </p>
                      )}
                      <p className="text-gray-700">{course.instructor.bio}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-500 italic">Instructor information not available</p>
                  </div>
                )}
              </div>
              
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 font-playfair">Course Content</h2>
                <div className="mb-3 flex justify-between items-center">
                  <p className="text-gray-600">{course.lectures?.length || 0} lectures • {course.totalDuration || "0h 0m"} total length</p>
                  <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                    Expand all sections
                  </button>
                </div>
                
                {course.lectures && course.lectures.length > 0 ? (
                  <div className="border rounded-lg divide-y">
                    {course.lectures.map((lecture, index) => (
                      <div key={index} className="bg-white">
                        <button
                          onClick={() => toggleSection(`lecture-${index}`)}
                          className="p-4 w-full flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center">
                            <div className="mr-3 text-gray-500 font-medium">
                              {index + 1}.
                            </div>
                            <div className="text-left">
                              <h3 className="font-medium text-gray-900">{lecture.title}</h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {lecture.duration || "0m"} • {lecture.resources} resources
                              </p>
                            </div>
                          </div>
                          <div>
                            {expandedSections[`lecture-${index}`] ? (
                              <FaChevronUp className="text-gray-500" />
                            ) : (
                              <FaChevronDown className="text-gray-500" />
                            )}
                          </div>
                        </button>
                        
                        {expandedSections[`lecture-${index}`] && (
                          <div className="px-4 pb-4 pt-1">
                            <ul className="border-t pt-2 space-y-2">
                              {lecture.lessons && lecture.lessons.map((lesson, lessonIdx) => (
                                <li key={lessonIdx} className="flex items-center justify-between text-sm py-2">
                                  <div className="flex items-center">
                                    <FaPlayCircle className="text-gray-400 mr-2" />
                                    <span>{lesson.title}</span>
                                  </div>
                                  <span className="text-gray-500">{lesson.duration || "0m"}</span>
                                </li>
                              ))}
                              {lecture.materials && lecture.materials.map((material, materialIdx) => (
                                <li key={materialIdx} className="flex items-center justify-between text-sm py-2">
                                  <div className="flex items-center">
                                    <FaFileDownload className="text-gray-400 mr-2" />
                                    <span>{material.title}</span>
                                  </div>
                                  <span className="text-gray-500">{material.type}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-500 italic">Lecture content will be available soon.</p>
                  </div>
                )}
              </div>
              
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 font-playfair">Student Reviews</h2>
                
                {course.reviews && course.reviews.length > 0 ? (
                  <div className="space-y-6">
                    {course.reviews.map((review) => (
                      <div key={review.id} className="bg-white border border-gray-100 rounded-lg p-5">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center">
                            <div className="bg-gray-100 rounded-full h-10 w-10 flex items-center justify-center mr-3">
                              <span className="text-gray-600 font-medium">{review.userName.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{review.userName}</p>
                              <p className="text-xs text-gray-500">{new Date(review.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center text-yellow-400">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-gray-500 italic">No reviews yet for this course</p>
                    <p className="text-gray-500 text-sm mt-2">Be the first to review after enrollment</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6">
              <div className="sticky top-6">
                <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                  <div className="p-6">
                    <div className="text-center mb-4">
                      <div className="text-3xl font-bold text-gray-900 mb-1">${course.price.toFixed(2)}</div>
                      {course.originalPrice && course.originalPrice > course.price && (
                        <div className="flex items-center justify-center">
                          <span className="text-lg text-gray-400 line-through mr-2">${course.originalPrice.toFixed(2)}</span>
                          <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
                            {Math.round((1 - course.price / course.originalPrice) * 100)}% off
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className={`w-full py-3 px-4 rounded-lg font-medium text-white mb-4 ${
                        enrolling
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-700 transition-colors duration-200'
                      }`}
                    >
                      {enrolling ? 'Processing...' : 'Enroll Now'}
                    </button>
                    
                    <p className="text-center text-sm text-gray-500 mb-6">30-Day Money-Back Guarantee</p>
                    
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">This course includes:</h3>
                      <ul className="space-y-3">
                        <li className="flex items-center text-sm text-gray-700">
                          <FaPlayCircle className="text-gray-400 mr-3" />
                          <span>{course.lectures?.length || 0} lectures</span>
                        </li>
                        <li className="flex items-center text-sm text-gray-700">
                          <FaFileDownload className="text-gray-400 mr-3" />
                          <span>{course.resources || 0} downloadable resources</span>
                        </li>
                        <li className="flex items-center text-sm text-gray-700">
                          <FaRegClock className="text-gray-400 mr-3" />
                          <span>Full lifetime access</span>
                        </li>
                        <li className="flex items-center text-sm text-gray-700">
                          <FaCertificate className="text-gray-400 mr-3" />
                          <span>Certificate of completion</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 text-center">
                  <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                    Share this course
                  </button>
                  <p className="mt-4 text-xs text-gray-500">
                    By enrolling, you agree to our Terms of Use and Privacy Policy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}