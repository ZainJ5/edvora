"use client"

import React from 'react';
import CourseCreationForm from '../components/CourseCreationForm';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function NewCoursePage() {
  const router = useRouter();
  const { currentUser, loading } = useAuth();

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
        router.push(`/instructor/courses/${data.course._id}`);
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create course');
      }
    } catch (err) {
      console.error('Error creating course:', err);
      throw err;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!currentUser || currentUser.role !== 'instructor') {
    router.push('/auth');
    return null;
  }

  return (
    <CourseCreationForm onSubmit={handleCreateCourse} />
  );
}