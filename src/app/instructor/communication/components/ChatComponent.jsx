'use client'

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { 
  Users, 
  User, 
  Search, 
  Send, 
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { database } from '@/lib/firebase';
import { 
  ref, 
  onValue, 
  off, 
  push, 
  set, 
  serverTimestamp,
  get 
} from 'firebase/database';

export default function ChatComponent({ currentUser }) {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [searchStudent, setSearchStudent] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent && currentUser && database) {
      const chatParticipants = [currentUser.userId, selectedStudent.userId].sort();
      const chatId = `chat_${chatParticipants[0]}_${chatParticipants[1]}`;
      const chatRef = ref(database, `chats/${chatId}`);
      
      get(chatRef).then((snapshot) => {
        if (!snapshot.exists()) {
          set(ref(database, `chats/${chatId}/metadata`), {
            participants: {
              [currentUser.userId]: {
                name: currentUser.name,
                role: 'instructor'
              },
              [selectedStudent.userId]: {
                name: selectedStudent.name,
                role: 'student'
              }
            },
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
          
          setChatMessages(messageList);
          setTimeout(() => {
            scrollToBottom();
          }, 100);
        } else {
          setChatMessages([]);
        }
      });
      
      return () => {
        off(ref(database, `chats/${chatId}/messages`));
      };
    }
  }, [selectedStudent, currentUser]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchStudents = async () => {
    try {
      setLoadingChat(true);
      const response = await fetch('/api/instructor/chat', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      setStudents(data.students);
      setLoadingChat(false);
    } catch (err) {
      toast.error(`Error: ${err.message}`);
      setLoadingChat(false);
    }
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setMessageText('');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!messageText.trim() || !selectedStudent || !currentUser || !database) return;
    
    try {
      const chatParticipants = [currentUser.userId, selectedStudent.userId].sort();
      const chatId = `chat_${chatParticipants[0]}_${chatParticipants[1]}`;
      
      const messagesRef = ref(database, `chats/${chatId}/messages`);
      const newMessageRef = push(messagesRef);
      
      set(newMessageRef, {
        senderId: currentUser.userId,
        senderName: currentUser.name,
        senderRole: 'instructor',
        receiverId: selectedStudent.userId,
        text: messageText,
        timestamp: serverTimestamp(),
        read: false
      });
      
      set(ref(database, `chats/${chatId}/metadata/lastMessage`), {
        text: messageText,
        timestamp: serverTimestamp(),
        senderId: currentUser.userId
      });
      
      setMessageText('');
    } catch (err) {
      toast.error(`Error sending message: ${err.message}`);
    }
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
    (student.email && student.email.toLowerCase().includes(searchStudent.toLowerCase()))
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Enrolled Students</h2>
            <button 
              onClick={fetchStudents}
              className={`p-1 rounded hover:bg-green-200 ${loadingChat ? 'animate-spin' : ''}`}
              disabled={loadingChat}
            >
              <RefreshCw className="h-4 w-4 text-green-600" />
            </button>
          </div>
          <div className="mt-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search students..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="w-full pr-8 pl-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: '70vh' }}>
          {loadingChat ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Users className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg font-medium">No students found</p>
              <p className="text-gray-400 text-sm mt-1">
                {searchStudent 
                  ? "No students match your search" 
                  : "You don't have any enrolled students yet"}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <li 
                  key={student.userId}
                  onClick={() => handleStudentSelect(student)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedStudent?.userId === student.userId ? 'bg-green-50' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {student.profilePicture ? (
                        <Image
                          src={student.profilePicture}
                          alt={student.name}
                          width={48}
                          height={48}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                          <User className="h-6 w-6 text-green-600" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {student.name}
                        </p>
                        {student.lastActive && (
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(student.lastActive), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {student.enrolledCourses && student.enrolledCourses.map((course, idx) => (
                          <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            {course.title.length > 20 ? course.title.substring(0, 20) + '...' : course.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {!selectedStudent ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="text-6xl mb-4">👈</div>
            <h3 className="text-xl font-medium text-gray-700 mb-2">Select a student to chat</h3>
            <p className="text-gray-500 max-w-md">
              Choose a student from your enrolled list to start a conversation
            </p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <button 
                  onClick={() => setSelectedStudent(null)}
                  className="md:hidden p-1 rounded-full hover:bg-gray-200 mr-2"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-500" />
                </button>
                <div className="flex-shrink-0">
                  {selectedStudent.profilePicture ? (
                    <Image
                      src={selectedStudent.profilePicture}
                      alt={selectedStudent.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-green-600" />
                    </div>
                  )}
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">{selectedStudent.name}</h3>
                  <p className="text-sm text-gray-500">
                    {selectedStudent.enrolledCourses && selectedStudent.enrolledCourses.length > 0 
                      ? `Enrolled in ${selectedStudent.enrolledCourses.length} course${selectedStudent.enrolledCourses.length > 1 ? 's' : ''}`
                      : 'Student'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '60vh' }}>
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="text-4xl mb-3">💬</div>
                  <p className="text-gray-500">No messages yet</p>
                  <p className="text-sm text-gray-400 mt-1">Start the conversation!</p>
                </div>
              ) : (
                chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.senderId === currentUser.userId ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md rounded-lg px-4 py-2 ${
                        message.senderId === currentUser.userId
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      {message.timestamp && (
                        <p className={`text-xs mt-1 ${
                          message.senderId === currentUser.userId
                            ? 'text-blue-200'
                            : 'text-gray-500'
                        }`}>
                          {new Date(message.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit'
                          })}
                          {message.read && message.senderId === currentUser.userId && (
                            <span className="ml-1">✓</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200 bg-white">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="w-full border-gray-300 rounded-full shadow-sm focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className="inline-flex items-center p-3 border border-transparent rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}