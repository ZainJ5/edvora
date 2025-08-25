'use client'

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Toaster } from 'react-hot-toast';
import { HelpCircle, MessageCircle, Video } from 'lucide-react';
import QuestionsComponent from './components/QuestionsComponent';
import ChatComponent from './components/ChatComponent';
import VideoCallComponent from './components/VideoCallComponent';

export default function CommunicationPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('questions');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentUser && !loading) {
      router.push('/auth');
      return;
    }

    if (currentUser && currentUser.role !== 'instructor') {
      router.push('/');
      return;
    }
    
    setIsLoading(false);
  }, [currentUser, loading, router]);

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
          <p className="mt-4 text-[#2c3180] font-medium">Loading communication center...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-black">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">Error Loading Communication Center</h2>
          <p className="mb-6 text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black pb-12">
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

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Communication Center</h1>
          <p className="mt-1 text-gray-500">
            Manage your interactions with students across all your courses
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="flex border-b border-gray-200">
            <button
              className={`flex items-center py-4 px-6 focus:outline-none ${
                activeTab === 'questions'
                  ? 'text-blue-600 border-b-2 border-blue-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('questions')}
            >
              <HelpCircle className="h-5 w-5 mr-2" />
              Student Questions
            </button>
            <button
              className={`flex items-center py-4 px-6 focus:outline-none ${
                activeTab === 'chat'
                  ? 'text-blue-600 border-b-2 border-blue-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('chat')}
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Live Chat
            </button>
            <button
              className={`flex items-center py-4 px-6 focus:outline-none ${
                activeTab === 'video'
                  ? 'text-blue-600 border-b-2 border-blue-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('video')}
            >
              <Video className="h-5 w-5 mr-2" />
              Video Call
              <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                Coming Soon
              </span>
            </button>
          </div>
        </div>

        {activeTab === 'questions' && <QuestionsComponent currentUser={currentUser} />}
        {activeTab === 'chat' && <ChatComponent currentUser={currentUser} />}
        {activeTab === 'video' && <VideoCallComponent />}
      </div>
    </div>
  );
}