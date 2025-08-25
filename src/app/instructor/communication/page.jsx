'use client'

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast, Toaster } from 'react-hot-toast';
import { 
  MessageSquare, 
  Users, 
  Video, 
  Clock, 
  Send, 
  Search, 
  MoreVertical, 
  User,
  MessageCircle,
  HelpCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Edit2,
  CheckCircle,
  XCircle,
  Filter,
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

export default function CommunicationPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('questions');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const chatEndRef = useRef(null);
  
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [coursesWithQuestions, setCoursesWithQuestions] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [questionFilter, setQuestionFilter] = useState('all'); 
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [searchStudent, setSearchStudent] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);

  const [videoSoonFeatures, setVideoSoonFeatures] = useState([
    { title: "HD Video Conferencing", description: "Schedule and host one-to-one or group video calls with your students", icon: "🎥" },
    { title: "Screen Sharing", description: "Share your screen to demonstrate concepts in real-time", icon: "🖥️" },
    { title: "Interactive Whiteboard", description: "Collaborate on a digital whiteboard during calls", icon: "🖌️" },
    { title: "Recording", description: "Record sessions for students who couldn't attend live", icon: "⏺️" },
    { title: "Virtual Office Hours", description: "Set up regular office hours for student questions", icon: "⏰" }
  ]);

  useEffect(() => {
    if (!currentUser && !loading) {
      router.push('/auth');
      return;
    }

    if (currentUser && currentUser.role !== 'instructor') {
      router.push('/dashboard');
      return;
    }

    if (currentUser && currentUser.role === 'instructor') {
      if (activeTab === 'questions') {
        fetchQuestions();
      } else if (activeTab === 'chat') {
        fetchStudents();
      }
    }
  }, [currentUser, loading, activeTab, router]);

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

  const fetchQuestions = async () => {
    try {
      setLoadingQuestions(true);
      const response = await fetch('/api/instructor/questions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }

      const data = await response.json();
      
      const courses = {};
      data.questions.forEach(question => {
        if (!courses[question.course.title]) {
          courses[question.course.title] = {
            id: question.course._id,
            title: question.course.title,
            count: 1
          };
        } else {
          courses[question.course.title].count += 1;
        }
      });
      
      setCoursesWithQuestions(Object.values(courses));
      setQuestions(data.questions);
      setLoadingQuestions(false);
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      toast.error(`Error: ${err.message}`);
      setLoadingQuestions(false);
      setIsLoading(false);
    }
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
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      toast.error(`Error: ${err.message}`);
      setLoadingChat(false);
      setIsLoading(false);
    }
  };

  const handleQuestionSelect = (question) => {
    setSelectedQuestion(question);
    setReplyText('');
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    
    if (!replyText.trim() || !selectedQuestion) return;
    
    try {
      const response = await fetch(`/api/instructor/questions/${selectedQuestion._id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ text: replyText }),
      });

      if (!response.ok) {
        throw new Error('Failed to post reply');
      }

      toast.success('Reply posted successfully!');
      setReplyText('');
      fetchQuestions(); 
    } catch (err) {
      toast.error(`Error: ${err.message}`);
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

  const filteredQuestions = questions.filter(question => {
    if (selectedCourse !== 'all' && question.course._id !== selectedCourse) {
      return false;
    }
    
    if (questionFilter === 'answered' && question.answers.length === 0) {
      return false;
    }
    if (questionFilter === 'unanswered' && question.answers.length > 0) {
      return false;
    }
    
    return true;
  });

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
    (student.email && student.email.toLowerCase().includes(searchStudent.toLowerCase()))
  );

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              onClick={() => {
                setActiveTab('questions');
                if (questions.length === 0) fetchQuestions();
              }}
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
              onClick={() => {
                setActiveTab('chat');
                if (students.length === 0) fetchStudents();
              }}
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

        {activeTab === 'questions' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Student Questions</h2>
                  <button 
                    onClick={fetchQuestions}
                    className={`p-1 rounded hover:bg-blue-200 ${loadingQuestions ? 'animate-spin' : ''}`}
                    disabled={loadingQuestions}
                  >
                    <RefreshCw className="h-4 w-4 text-blue-600" />
                  </button>
                </div>
                <div className="mt-3 flex items-center space-x-2">
                  <div className="flex-grow">
                    <select
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                    >
                      <option value="all">All Courses</option>
                      {coursesWithQuestions.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title} ({course.count})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <select
                      className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      value={questionFilter}
                      onChange={(e) => setQuestionFilter(e.target.value)}
                    >
                      <option value="all">All</option>
                      <option value="answered">Answered</option>
                      <option value="unanswered">Unanswered</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="overflow-y-auto" style={{ maxHeight: '70vh' }}>
                {loadingQuestions ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : filteredQuestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <HelpCircle className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg font-medium">No questions found</p>
                    <p className="text-gray-400 text-sm mt-1">
                      {questionFilter !== 'all' 
                        ? `No ${questionFilter} questions in the selected course.` 
                        : "Students haven't asked any questions yet."}
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {filteredQuestions.map((question) => (
                      <li 
                        key={question._id}
                        onClick={() => handleQuestionSelect(question)}
                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedQuestion?._id === question._id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mt-1">
                            {question.askedBy.profilePicture ? (
                              <Image
                                src={question.askedBy.profilePicture}
                                alt={question.askedBy.name}
                                width={36}
                                height={36}
                                className="rounded-full"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600" />
                              </div>
                            )}
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">
                                {question.askedBy.name}
                              </p>
                              <div className="flex items-center">
                                {question.answers.length > 0 ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Answered
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Waiting
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-500 line-clamp-2">{question.text}</p>
                            <div className="mt-1 flex items-center">
                              <span className="text-xs text-gray-400">
                                {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
                              </span>
                              <span className="mx-1 text-gray-300">•</span>
                              <span className="text-xs text-gray-400">{question.course.title}</span>
                              <span className="mx-1 text-gray-300">•</span>
                              <span className="text-xs text-gray-400">
                                Lecture: {question.lecture.title.substring(0, 15)}
                                {question.lecture.title.length > 15 ? '...' : ''}
                              </span>
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
              {!selectedQuestion ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                  <div className="text-6xl mb-4">👈</div>
                  <h3 className="text-xl font-medium text-gray-700 mb-2">Select a question</h3>
                  <p className="text-gray-500 max-w-md">
                    Choose a question from the list to view details and reply to the student
                  </p>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <button 
                        onClick={() => setSelectedQuestion(null)}
                        className="md:hidden p-1 rounded-full hover:bg-gray-200"
                      >
                        <ArrowLeft className="h-5 w-5 text-gray-500" />
                      </button>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Question from {selectedQuestion.askedBy.name}</h2>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <span>{selectedQuestion.course.title}</span>
                          <span className="mx-1.5">•</span>
                          <span>{selectedQuestion.lecture.title}</span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {selectedQuestion.answers.length > 0 ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-4 w-4 mr-1.5" />
                            Answered
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                            <Clock className="h-4 w-4 mr-1.5" />
                            Awaiting Reply
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1 overflow-y-auto" style={{ maxHeight: '60vh' }}>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          {selectedQuestion.askedBy.profilePicture ? (
                            <Image
                              src={selectedQuestion.askedBy.profilePicture}
                              alt={selectedQuestion.askedBy.name}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {selectedQuestion.askedBy.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(selectedQuestion.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">{selectedQuestion.text}</p>
                        </div>
                      </div>
                    </div>
                    
                    {selectedQuestion.answers.length > 0 && (
                      <div className="mt-6 space-y-4">
                        <h3 className="text-sm font-medium text-gray-700">Replies</h3>
                        {selectedQuestion.answers.map((answer) => (
                          <div key={answer._id} className="bg-white border border-gray-200 p-4 rounded-lg">
                            <div className="flex items-start">
                              <div className="flex-shrink-0 mt-1">
                                {answer.answeredBy.profilePicture ? (
                                  <Image
                                    src={answer.answeredBy.profilePicture}
                                    alt={answer.answeredBy.name}
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
                              <div className="ml-3 flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-gray-900">
                                    {answer.answeredBy.name}
                                    {answer.answeredBy._id === selectedQuestion.course.instructor && (
                                      <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                                        Instructor
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
                                  </p>
                                </div>
                                <p className="text-sm text-gray-700 mt-1">{answer.text}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <form onSubmit={handleReplySubmit} className="flex items-center space-x-3">
                      <div className="flex-1">
                        <textarea
                          placeholder="Type your reply..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          rows={2}
                          required
                        ></textarea>
                      </div>
                      <button
                        type="submit"
                        disabled={!replyText.trim()}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <Send className="h-5 w-5 mr-2" />
                        Reply
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
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
        )}

        {activeTab === 'video' && (
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
        )}
      </div>
    </div>
  );
}