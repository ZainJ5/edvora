"use client"

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import CourseCreationForm from './components/CourseCreationForm';
import CourseCard from './components/CourseCard';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import ConfirmationDialog from './components/ConfirmationDialog';

export default function CoursesPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  
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

  const handleCreateCourse = async (courseData) => {
    try {
      const response = await fetch('/api/instructor/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(courseData),
      });

      if (response.ok) {
        const data = await response.json();
        setCourses([...courses, data.course]);
        setShowCourseForm(false);
        router.push(`/instructor/courses/${data.course._id}`);
        toast.success('Course created successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create course');
      }
    } catch (err) {
      toast.error(`Error creating course: ${err.message}`);
      console.error('Error creating course:', err);
      throw err;
    }
  };

  const handleUpdateCourse = async (courseData) => {
    try {
      const response = await fetch(`/api/instructor/courses/${editingCourse._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(courseData),
      });

      if (response.ok) {
        const data = await response.json();
        setCourses(courses.map(course => 
          course._id === data.course._id ? data.course : course
        ));
        setEditingCourse(null);
        router.push(`/instructor/courses/${data.course._id}`);
        toast.success('Course updated successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update course');
      }
    } catch (err) {
      toast.error(`Error updating course: ${err.message}`);
      console.error('Error updating course:', err);
      throw err;
    }
  };

  const handleDeleteCourse = async (courseId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Course',
      message: 'Are you sure you want to delete this course? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/instructor/courses/${courseId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          });

          if (response.ok) {
            setCourses(courses.filter(course => course._id !== courseId));
            toast.success('Course deleted successfully');
          } else {
            const errorData = await response.json();
            setError(errorData.error || 'Failed to delete course');
            toast.error(errorData.error || 'Failed to delete course');
          }
        } catch (err) {
          setError(err.message);
          toast.error(`Error: ${err.message}`);
          console.error('Error deleting course:', err);
        }
      }
    });
  };

  const handleEditClick = (course) => {
    setEditingCourse(course);
    router.push(`/instructor/courses/edit/${course._id}`);
  };

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-[#6c7aff] border-t-transparent animate-spin"></div>
          <p className="mt-4 text-[#6c7aff] font-medium">Loading your courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
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
        <div className="mb-8 border-b border-gray-200 pb-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Courses</h1>
              <p className="mt-2 text-sm text-gray-500">Manage your course content, materials, and student progress</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/instructor/courses/new')}
              className="mt-4 sm:mt-0 inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-[#6c7aff] hover:bg-[#5d6aed] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6c7aff] cursor-pointer"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Course
            </motion.button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md mb-6" role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {courses.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100 max-w-2xl mx-auto"
          >
            <div className="mx-auto w-20 h-20 bg-[#eef0ff] rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-[#6c7aff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">No Courses Yet</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">You haven't created any courses yet. Get started by creating your first course and share your expertise with eager learners!</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/instructor/courses/new')}
              className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-[#6c7aff] hover:bg-[#5d6aed] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6c7aff] cursor-pointer"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Your First Course
            </motion.button>
          </motion.div>
        ) : (
          <div>
            <div className="mb-6">
              <p className="text-sm text-gray-500">Displaying {courses.length} course{courses.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course, index) => (
                <motion.div
                  key={course._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="h-full"
                >
                  <CourseCard 
                    course={course}
                    isManageable={true}
                    onEditClick={handleEditClick}
                    onDeleteClick={handleDeleteCourse}
                    blueTheme="#6c7aff"
                    className="h-full cursor-pointer hover:shadow-lg transition-all duration-300"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}
        
        <ConfirmationDialog 
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onClose={() => setConfirmDialog({...confirmDialog, isOpen: false})}
          variant="danger"
        />
      </div>
    </div>
  );
}