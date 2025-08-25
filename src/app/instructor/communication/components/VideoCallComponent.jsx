'use client'

import React, { useState } from 'react';
import { Video } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function VideoCallComponent() {
  const [videoSoonFeatures] = useState([
    { title: "HD Video Conferencing", description: "Schedule and host one-to-one or group video calls with your students", icon: "🎥" },
    { title: "Screen Sharing", description: "Share your screen to demonstrate concepts in real-time", icon: "🖥️" },
    { title: "Interactive Whiteboard", description: "Collaborate on a digital whiteboard during calls", icon: "🖌️" },
    { title: "Recording", description: "Record sessions for students who couldn't attend live", icon: "⏺️" },
    { title: "Virtual Office Hours", description: "Set up regular office hours for student questions", icon: "⏰" }
  ]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-purple-50 to-purple-100 border-b border-gray-200">
        <div className="flex items-center">
          <Video className="h-6 w-6 text-purple-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Video Calls</h2>
          <span className="ml-3 inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
            Coming Soon
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-purple-100 rounded-full mb-4">
            <Video className="h-12 w-12 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Video Calls Coming Soon</h3>
          <p className="text-gray-500 max-w-lg mx-auto">
            We're working on bringing you a seamless video conferencing experience to connect with your students in real-time.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videoSoonFeatures.map((feature, index) => (
            <div key={index} className="bg-white p-5 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">{feature.title}</h3>
              <p className="text-gray-500 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-10 text-center">
          <p className="text-gray-500 mb-4">Want to be notified when video calls are available?</p>
          <button
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            onClick={() => toast.success('You will be notified when video calls are available!')}
          >
            Get Early Access
          </button>
        </div>
      </div>
    </div>
  );
}