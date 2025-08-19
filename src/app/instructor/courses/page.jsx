"use client"

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import CourseForm from '@/app/components/CourseForm';
import CourseCard from '@/app/components/CourseCard';

export default function CoursesPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  
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
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create course');
      }
    } catch (err) {
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
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update course');
      }
    } catch (err) {
      console.error('Error updating course:', err);
      throw err;
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        setCourses(courses.filter(course => course._id !== courseId));
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete course');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error deleting course:', err);
    }
  };

  const handleEditClick = (course) => {
    setEditingCourse(course);
  };

  if (loading || isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Courses</h1>
        <button
          onClick={() => setShowCourseForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Create New Course
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      {courses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">No Courses Yet</h2>
          <p className="text-gray-600 mb-4">You haven't created any courses yet. Get started by creating your first course!</p>
          <button
            onClick={() => setShowCourseForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Create Your First Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <CourseCard 
              key={course._id} 
              course={course}
              isManageable={true}
              onEditClick={handleEditClick}
              onDeleteClick={handleDeleteCourse}
            />
          ))}
        </div>
      )}
      
      {showCourseForm && (
        <CourseForm 
          onSubmit={handleCreateCourse} 
          onCancel={() => setShowCourseForm(false)}
        />
      )}
      
      {editingCourse && (
        <CourseForm 
          initialData={editingCourse}
          onSubmit={handleUpdateCourse} 
          onCancel={() => setEditingCourse(null)}
          isEditing={true}
        />
      )}
    </div>
  );
}
