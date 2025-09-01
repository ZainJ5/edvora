"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import { FaRegUser, FaPaperPlane, FaReply, FaTimes } from "react-icons/fa";
import { MdOutlineForum } from "react-icons/md";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const LectureQuestions = ({ courseId, lectureId }) => {
  const { currentUser } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const questionContainerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      fetchQuestions();
    }
  }, [lectureId, currentUser]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/courses/${courseId}/lectures/${lectureId}/questions`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }
      
      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load questions.');
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!newQuestion.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/courses/${courseId}/lectures/${lectureId}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: newQuestion })
      });
      
      if (!response.ok) {
        throw new Error('Failed to post question');
      }
      
      const data = await response.json();
      setQuestions([...questions, data.question]);
      setNewQuestion('');
      toast.success('Question posted successfully!');
      
      if (questionContainerRef.current) {
        questionContainerRef.current.scrollTop = questionContainerRef.current.scrollHeight;
      }
    } catch (err) {
      toast.error('Failed to post question.');
    }
  };

  const handleAnswerQuestion = async (questionId) => {
    if (!replyText.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/courses/${courseId}/lectures/${lectureId}/questions/${questionId}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: replyText })
      });
      
      if (!response.ok) {
        throw new Error('Failed to post answer');
      }
      
      const data = await response.json();
      
      setQuestions(questions.map(q => 
        q._id === questionId 
          ? { ...q, answers: [...q.answers, data.answer] }
          : q
      ));
      
      setReplyText('');
      setReplyingTo(null);
      toast.success('Answer posted successfully!');
    } catch (err) {
      toast.error('Failed to post answer.');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const startReply = (questionId) => {
    setReplyingTo(questionId);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyText('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5d6aed]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12zm-1-5a1 1 0 112 0v4a1 1 0 11-2 0v-4zm1-7a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isInstructor = currentUser?.role === 'instructor';

  return (
    <div className="bg-white">
      <div className="flex items-center mb-6">
        <MdOutlineForum className="text-2xl text-[#314d7c] mr-3" />
        <h3 className="text-xl font-semibold text-[#314d7c]">
          Lecture Discussion
        </h3>
        <span className="ml-auto bg-[#f0f3ff] text-[#314d7c] px-3 py-1 rounded-full text-sm">
          {questions.length} {questions.length === 1 ? 'question' : 'questions'}
        </span>
      </div>
      
      <div 
        ref={questionContainerRef} 
        className="space-y-5 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar mb-6"
      >
        {questions.length > 0 ? (
          questions.map((q) => (
            <motion.div 
              key={q._id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#f9fafb] p-5 rounded-2xl border border-[#d1d3e0]/30 shadow-sm"
            >
              <div className="flex items-center mb-3">
               
                  <div className="h-8 w-8 rounded-full bg-[#5d6aed]/10 flex items-center justify-center mr-2">
                    <FaRegUser className="text-[#5d6aed]" />
                  </div>
                <span className="font-medium text-[#314d7c]">{q.askedBy.name || 'Anonymous'}</span>
                <span className="text-xs text-[#94a3b8] ml-auto">{formatDate(q.createdAt)}</span>
              </div>
              
              <p className="text-[#334155] mb-4 ml-10">{q.text}</p>
              
              <div className="ml-10 space-y-3 mt-2">
                {q.answers && q.answers.length > 0 && (
                  <div className="space-y-3 mt-4 pt-3 border-t border-[#d1d3e0]/20">
                    <h4 className="font-medium text-[#475569] text-sm">
                      Answers ({q.answers.length})
                    </h4>
                    {q.answers.map((a) => (
                      <motion.div 
                        key={a._id} 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white p-4 rounded-xl border border-[#d1d3e0]/30"
                      >
                        <div className="flex items-center mb-2">
                            <div className="h-7 w-7 rounded-full bg-[#2c3180]/10 flex items-center justify-center mr-2">
                              <FaRegUser className="text-[#314d7c] text-xs" />
                            </div>
                          <div>
                            <span className="font-medium text-[#314d7c] text-sm">{a.answeredBy?.name || 'Instructor'}</span>
                            <span className="ml-2 bg-[#5d6aed]/10 text-[#5d6aed] text-xs px-2 py-0.5 rounded-full">
                              Instructor
                            </span>
                          </div>
                          <span className="text-xs text-[#94a3b8] ml-auto">{formatDate(a.createdAt)}</span>
                        </div>
                        <p className="text-[#475569] ml-9 text-sm">{a.text}</p>
                      </motion.div>
                    ))}
                  </div>
                )}
                
                {replyingTo === q._id ? (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3"
                  >
                    <div className="flex items-center mb-2">
                      <span className="text-sm text-[#5d6aed]">Your response</span>
                      <button 
                        onClick={cancelReply}
                        className="ml-auto text-[#94a3b8] hover:text-[#475569] transition-colors"
                      >
                        <FaTimes />
                      </button>
                    </div>
                    <div className="flex">
                      <input
                        ref={inputRef}
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write your answer..."
                        className="flex-1 border border-[#d1d3e0] rounded-l-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#5d6aed] bg-white text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && handleAnswerQuestion(q._id)}
                      />
                      <button
                        onClick={() => handleAnswerQuestion(q._id)}
                        className="bg-[#2c3180] text-white px-4 py-2 rounded-r-lg hover:bg-[#2c3180]/90 transition-colors duration-300"
                      >
                        <FaPaperPlane className="text-sm" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  isInstructor && (
                    <button
                      onClick={() => startReply(q._id)}
                      className="inline-flex items-center text-sm text-[#5d6aed] hover:text-[#314d7c] transition-colors mt-1"
                    >
                      <FaReply className="mr-1" />
                      Reply
                    </button>
                  )
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 bg-[#f9fafb] rounded-2xl border border-dashed border-[#d1d3e0]">
            <MdOutlineForum className="mx-auto text-4xl text-[#d1d3e0] mb-3" />
            <p className="text-[#94a3b8] mb-2">No questions yet for this lecture.</p>
            <p className="text-sm text-[#94a3b8]">Be the first to start the discussion!</p>
          </div>
        )}
      </div>
      
      <div className="pt-4 border-t border-[#e0e5f2]">
        <h4 className="font-medium text-[#475569] mb-3">Ask a Question</h4>
        <div className="flex">
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="What would you like to ask about this lecture?"
            className="flex-1 border border-[#d1d3e0] rounded-l-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#5d6aed] bg-[#f9fafb]"
            onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
          />
          <button
            onClick={handleAskQuestion}
            className="bg-gradient-to-r from-[#2c3180] to-[#5d6aed] text-white px-6 py-3 rounded-r-xl hover:opacity-90 transition-opacity duration-300 flex items-center"
          >
            <FaPaperPlane className="mr-2" />
            Ask
          </button>
        </div>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default LectureQuestions;