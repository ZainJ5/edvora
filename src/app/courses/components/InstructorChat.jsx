'use client'

import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { database } from '../../../lib/firebase';
import { 
  ref, 
  onValue, 
  off, 
  push, 
  set, 
  serverTimestamp,
  get 
} from 'firebase/database';
import { useAuth } from '../../../context/AuthContext';

const InstructorChat = ({ courseId, lectureId, course }) => {
  const { currentUser } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [instructor, setInstructor] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const setupInstructor = async () => {
      try {
        setLoading(true);
        
        if (course && course.instructor) {
          const instructorData = {
            userId: course.instructor.userId._id,  
            name: course.instructor.name,
            profilePicture: course.instructor.profilePicture || null
          };
          
          setInstructor(instructorData);
          if (currentUser && instructorData) {
            initializeChat(currentUser, instructorData);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error setting up instructor data:', error);
        toast.error('Could not load chat. Please try again later.');
        setLoading(false);
      }
    };

    if (currentUser && courseId) {
      setupInstructor();
    } else {
      setLoading(false);
    }

    return () => {
      if (currentUser && instructor) {
        const chatParticipants = [currentUser.userId, instructor.userId].sort();
        const chatId = `chat_${chatParticipants[0]}_${chatParticipants[1]}`;
        off(ref(database, `chats/${chatId}/messages`));
        off(ref(database, `users/${instructor.userId}/status`));
      }
    };
  }, [courseId, currentUser, course]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeChat = (user, instructor) => {
    if (!database || !user || !instructor) return;
    
    const chatParticipants = [user.userId, instructor.userId].sort();
    const chatId = `chat_${chatParticipants[0]}_${chatParticipants[1]}`;

    const chatRef = ref(database, `chats/${chatId}`);
    
    get(chatRef).then((snapshot) => {
      if (!snapshot.exists()) {
        set(ref(database, `chats/${chatId}/metadata`), {
          participants: {
            [user.userId]: {
              name: user.name,
              role: 'student'
            },
            [instructor.userId]: {
              name: instructor.name,
              role: 'instructor'
            }
          },
          courseId: courseId,
          createdAt: serverTimestamp()
        });
      }
    });
    
    onValue(ref(database, `chats/${chatId}/messages`), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messageList = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value
        })).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        
        setMessages(messageList);
        
        Object.entries(data).forEach(([key, value]) => {
          if (value.senderId === instructor.userId && !value.read) {
            set(ref(database, `chats/${chatId}/messages/${key}/read`), true);
          }
        });
      } else {
        setMessages([]);
      }
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!message.trim() || !currentUser || !instructor || !database) return;
    
    try {
      const chatParticipants = [currentUser.userId, instructor.userId].sort();
      const chatId = `chat_${chatParticipants[0]}_${chatParticipants[1]}`;
      
      const messagesRef = ref(database, `chats/${chatId}/messages`);
      const newMessageRef = push(messagesRef);
      
      set(newMessageRef, {
        senderId: currentUser.userId,
        senderName: currentUser.name,
        senderRole: 'student',
        receiverId: instructor.userId,
        text: message,
        timestamp: serverTimestamp(),
        read: false,
        lectureId: lectureId,
        courseId: courseId
      });
      
      set(ref(database, `chats/${chatId}/metadata/lastMessage`), {
        text: message,
        timestamp: serverTimestamp(),
        senderId: currentUser.userId
      });
      
      set(ref(database, `notifications/${instructor.userId}/unread/${Date.now()}`), {
        type: 'chat',
        senderId: currentUser.userId,
        senderName: currentUser.name,
        message: message,
        courseId: courseId,
        lectureId: lectureId,
        timestamp: serverTimestamp(),
        read: false
      });
      
      setMessage('');
    } catch (err) {
      toast.error(`Error sending message: ${err.message}`);
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="w-full h-96 flex flex-col rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 p-4 border-b border-gray-400">
          <h3 className="font-medium text-gray-700">Chat with Instructor</h3>
        </div>
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-gray-500 text-sm">Loading conversation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="w-full h-96 flex flex-col rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 p-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-700">Chat with Instructor</h3>
        </div>
        <div className="flex-1 flex items-center justify-center bg-white p-4">
          <div className="text-center">
            <p className="text-gray-700 mb-2">Please log in to chat with the instructor</p>
            <p className="text-gray-500 text-sm">You need to be logged in to use the chat feature.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-96 flex flex-col rounded-lg border border-gray-200 overflow-hidden">
      {/* Header - Simple with just the name */}
      <div className="bg-gray-50 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-700">
            {instructor ? instructor.name : 'Instructor Chat'}
          </h3>
        </div>
      </div>
      
      {/* Messages - Clean and simple */}
      <div className="flex-1 overflow-y-auto p-4 bg-white">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <p className="text-gray-500">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isCurrentUser = msg.senderId === currentUser?.userId;
              
              return (
                <div 
                  key={msg.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="max-w-[75%]">
                    <div 
                      className={`p-3 rounded-lg ${
                        isCurrentUser 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 ml-1">
                      {formatMessageTime(msg.timestamp)}
                      {msg.read && isCurrentUser && (
                        <span className="ml-1">✓</span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Message Input - Clean and simple */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <form onSubmit={handleSendMessage} className="flex items-center">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:border-blue-400 text-sm"
            disabled={!instructor}
          />
          <button
            type="submit"
            disabled={!message.trim() || !instructor}
            className={`ml-2 bg-blue-500 text-white p-2 rounded-full ${
              !message.trim() || !instructor ? 'opacity-50' : 'hover:bg-blue-600'
            }`}
          >
            <FaPaperPlane className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default InstructorChat;