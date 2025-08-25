'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { toast, Toaster } from 'react-hot-toast';
import QuizForm from '../components/QuizForm';
import { PlusCircle, Book, Clipboard, AlertCircle, Check, X } from 'lucide-react';

export default function InstructorQuizPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [error, setError] = useState("");
  const [showQuizForm, setShowQuizForm] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!currentUser) return;

      try {
        const response = await fetch('/api/instructor/courses', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCourses(data.courses);
        } else {
          throw new Error('Failed to fetch courses');
        }
      } catch (err) {
        setError(err.message);
        toast.error(`Error fetching courses: ${err.message}`);
        console.error('Error fetching courses:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser && currentUser.role === 'instructor') {
      fetchCourses();
    } else if (!loading && (!currentUser || currentUser.role !== 'instructor')) {
      router.push('/auth');
    }
  }, [currentUser, loading, router]);

  const fetchLectures = async (courseId) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/instructor/courses/${courseId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLectures(data.course.lectures || []);
        setSelectedCourse(data.course);
      } else {
        throw new Error('Failed to fetch course details');
      }
    } catch (err) {
      setError(err.message);
      toast.error(`Error fetching lectures: ${err.message}`);
      console.error('Error fetching lectures:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCourseSelect = (course) => {
    fetchLectures(course._id);
  };

  const handleLectureSelect = (lecture) => {
    setSelectedLecture(lecture);
    setShowQuizForm(true);
  };

  const handleQuizSubmit = async (quizData) => {
    const loadingToast = toast.loading('Creating quiz...');
    try {
      const response = await fetch('/api/instructor/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...quizData,
          courseId: selectedCourse._id,
          lectureId: selectedLecture._id
        }),
      });

      if (response.ok) {
        toast.dismiss(loadingToast);
        toast.success('Quiz created successfully!', {
          icon: <Check className="h-5 w-5 text-green-500" />,
        });
        setShowQuizForm(false);
        
        fetchLectures(selectedCourse._id);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create quiz');
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(`Error creating quiz: ${err.message}`, {
        icon: <X className="h-5 w-5 text-red-500" />,
      });
      console.error('Error creating quiz:', err);
    }
  };

  if (loading) {
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
          <p className="mt-4 text-[#2c3180] font-medium">Loading instructor dashboard...</p>
        </div>
      </div>
    );
  }

  if (isLoading && !loading) {
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
          <p className="mt-4 text-[#2c3180] font-medium">Loading course data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
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
            duration: 3000,
            iconTheme: {
              primary: '#4CAF50',
              secondary: 'white',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#E53935',
              secondary: 'white',
            },
          },
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Quizzes</h1>
          <p className="text-gray-600">Create and manage quizzes for your courses</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-200">
              <div className="flex items-center">
                <Book className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Your Courses</h2>
              </div>
            </div>
            
            <div className="p-4">
              {courses.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                    <Book className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-gray-500 mb-2">No courses found</p>
                  <a href="/instructor/courses/create" className="text-blue-600 text-sm font-medium hover:underline">
                    Create your first course
                  </a>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {courses.map((course) => (
                    <li 
                      key={course._id}
                      className={`py-3 px-2 rounded-md cursor-pointer transition-colors ${
                        selectedCourse?._id === course._id 
                          ? 'bg-blue-50 border-l-4 border-blue-500'
                          : 'hover:bg-gray-50 border-l-4 border-transparent'
                      }`}
                      onClick={() => handleCourseSelect(course)}
                    >
                      <div className="font-medium text-gray-900">{course.title}</div>
                      <div className="text-sm text-gray-500 mt-1 flex items-center">
                        <span className="inline-block px-2 py-1 bg-gray-100 rounded-full text-xs">
                          {course.category}
                        </span>
                        <span className="ml-2 text-xs">
                          {course.lectures?.length || 0} lectures
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-green-100 border-b border-gray-200">
              <div className="flex items-center">
                <Clipboard className="h-5 w-5 text-green-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedCourse ? `Lectures in ${selectedCourse.title}` : 'Course Lectures'}
                </h2>
              </div>
            </div>
            
            <div className="p-4">
              {!selectedCourse ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Clipboard className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500">Please select a course to view lectures</p>
                </div>
              ) : lectures.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Clipboard className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-2">No lectures found in this course</p>
                  <a href={`/instructor/courses/${selectedCourse._id}/edit`} className="text-blue-600 text-sm font-medium hover:underline">
                    Add lectures to this course
                  </a>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {lectures.map((lecture) => (
                    <li 
                      key={lecture._id}
                      className={`py-3 px-2 rounded-md transition-colors ${
                        selectedLecture?._id === lecture._id 
                          ? 'bg-green-50 border-l-4 border-green-500'
                          : 'hover:bg-gray-50 border-l-4 border-transparent'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{lecture.title}</div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                          {lecture.quizzes?.length || 0} quizzes
                        </span>
                        <button 
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                          onClick={() => handleLectureSelect(lecture)}
                        >
                          <PlusCircle className="h-4 w-4 mr-1" />
                          Create Quiz
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Quiz Creation Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-purple-100 border-b border-gray-200">
              <div className="flex items-center">
                <div className="h-5 w-5 text-purple-600 mr-2">
                  {showQuizForm ? '✏️' : '📝'}
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {showQuizForm && selectedLecture
                    ? `Create Quiz for: ${selectedLecture.title}`
                    : 'Quiz Creation'
                  }
                </h2>
              </div>
            </div>
            
            <div className="p-4">
              {!showQuizForm ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <span className="text-2xl">📝</span>
                  </div>
                  <p className="text-gray-500">Select a lecture to create a quiz</p>
                  {selectedCourse && (
                    <p className="text-sm text-gray-400 mt-2">
                      Quizzes help students test their knowledge
                    </p>
                  )}
                </div>
              ) : (
                <QuizForm 
                  onSubmit={handleQuizSubmit}
                  onCancel={() => setShowQuizForm(false)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}