"use client"

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import TeacherProfileForm from '@/app/components/InstructorProfileForm';
import { useRouter } from 'next/navigation';

export default function InstructorDashboard() {
  const { currentUser, loading } = useAuth();
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [teacherData, setTeacherData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkTeacherProfile = async () => {
      if (!currentUser) return;
      
      try {
        const response = await fetch('/api/instructor/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setTeacherData(data.teacher);
          
          if (!data.teacher || !data.teacher.profileCompleted) {
            setShowProfileForm(true);
          }
        } else if (response.status === 404) {
          setShowProfileForm(true);
        }
      } catch (error) {
        console.error('Error checking teacher profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser && currentUser.role === 'instructor') {
      checkTeacherProfile();
    } else if (!loading && (!currentUser || currentUser.role !== 'instructor')) {
      router.push('/auth');
    }
  }, [currentUser, loading, router]);

  const handleProfileComplete = () => {
    setShowProfileForm(false);
    
    const fetchTeacherProfile = async () => {
      try {
        const response = await fetch('/api/instructor/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setTeacherData(data.teacher);
          if (data.teacher && !data.teacher.profileCompleted) {
            console.warn('Profile marked as incomplete despite submission');
          }
        }
      } catch (error) {
        console.error('Error fetching updated teacher profile:', error);
      }
    };
    
    fetchTeacherProfile();
  };

  if (loading || isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto text-black px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Instructor Dashboard</h1>
      
      {teacherData && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Welcome, {currentUser?.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Total Students: {teacherData.totalStudents}</p>
              <p className="text-gray-600">Total Courses: {teacherData.totalCourses}</p>
            </div>
            <div>
              <p className="text-gray-600">Rating: {teacherData.rating.toFixed(1)}</p>
              <p className="text-gray-600">Earnings: ${teacherData.earnings.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <button 
              onClick={() => router.push('/instructor/courses')}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Manage Courses
            </button>
            <button 
              onClick={() => router.push('/instructor/courses')}
              className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Create New Course
            </button>
            <button className="w-full py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700">
              Manage Students
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
          <p className="text-gray-500">No recent activity</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-3">Upcoming Deadlines</h3>
          <p className="text-gray-500">No upcoming deadlines</p>
        </div>
      </div>
      
      {showProfileForm && (
        <TeacherProfileForm 
          onComplete={handleProfileComplete} 
        />
      )}
    </div>
  );
}
