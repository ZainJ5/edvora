"use client"

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UserDashboard() {
  const { currentUser, loading, logout } = useAuth();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      
      try {
        const response = await fetch('/api/user/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserData(data.user);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to fetch user data');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to fetch user data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser && currentUser.role === 'user') {
      fetchUserData();
    } else if (!loading && (!currentUser || currentUser.role !== 'user')) {
      router.push('/auth');
    }
  }, [currentUser, loading, router]);

  if (loading || isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <p>{error}</p>
        </div>
        <button
          onClick={() => router.push('/auth')}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="container text-black mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">User Dashboard</h1>
      
      {userData && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Welcome, {userData.createdAt}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Email: {userData.email}</p>
              <p className="text-gray-600">Member since: {new Date(userData.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-3">My Courses</h3>
          <p className="text-gray-500 mb-3">View courses you're enrolled in</p>
          <Link 
            href="/user/courses"
            className="block w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-center"
          >
            View My Courses
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-3">Browse Courses</h3>
          <p className="text-gray-500 mb-3">Discover new courses to learn from</p>
          <Link 
            href="/courses"
            className="block w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 text-center"
          >
            Browse Courses
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-3">Account Settings</h3>
          <p className="text-gray-500 mb-3">Update your profile information</p>
          <Link 
            href="/user/settings"
            className="block w-full py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-center mb-2"
          >
            Account Settings
          </Link>
          <button 
            onClick={logout}
            className="block w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 text-center"
          >
            Logout
          </button>
        </div>
      </div>
      
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
        <p className="text-gray-500">No recent activity to show</p>
      </div>
    </div>
  );
}
