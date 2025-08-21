"use client"

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import CourseCreationForm from '../../components/CourseCreationForm';

export default function EditCoursePage() {
  const { currentUser, loading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId;
  
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  useEffect(() => {
    const fetchCourse = async () => {
      if (!currentUser || !courseId) return;
      
      try {
        const response = await fetch(`/api/instructor/courses/${courseId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCourse(data.course);
        } else if (response.status === 404) {
          router.push('/instructor/courses');
        } else {
          throw new Error('Failed to fetch course details');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching course details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser && currentUser.role === 'instructor') {
      fetchCourse();
    } else if (!loading && (!currentUser || currentUser.role !== 'instructor')) {
      router.push('/auth');
    }
  }, [currentUser, loading, courseId, router]);

  const handleUpdateCourse = async (courseData) => {
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(courseData),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/instructor/courses/${courseId}`);
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update course');
      }
    } catch (err) {
      console.error('Error updating course:', err);
      throw err;
    }
  };

  if (loading || isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border-l-4 border-red-500 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return <div className="container mx-auto px-4 py-8">Course not found</div>;
  }

  return <CourseCreationForm initialData={course} onSubmit={handleUpdateCourse} isEditing={true} />;
}