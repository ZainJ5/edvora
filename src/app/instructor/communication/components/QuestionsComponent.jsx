'use client'

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { 
  RefreshCw, 
  HelpCircle, 
  User, 
  Clock, 
  CheckCircle, 
  ArrowLeft,
  Send
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function QuestionsComponent({ currentUser }) {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [coursesWithQuestions, setCoursesWithQuestions] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [questionFilter, setQuestionFilter] = useState('all'); 
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

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
    } catch (err) {
      toast.error(`Error: ${err.message}`);
      setLoadingQuestions(false);
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

  return (
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
  );
}