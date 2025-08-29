'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Loader2, X, ChevronDown, Share2, ThumbsUp, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const LEARNING_CATEGORIES = [
  { id: 'programming', label: 'Programming' },
  { id: 'mathematics', label: 'Mathematics' },
  { id: 'science', label: 'Science' },
  { id: 'history', label: 'History' },
  { id: 'languages', label: 'Languages' },
  { id: 'business', label: 'Business' },
];

const QUICK_QUERIES = [
  { id: 'recommend', text: 'Recommend courses' },
  { id: 'explain', text: 'Explain a concept' },
  { id: 'quiz', text: 'Take a quiz' },
  { id: 'tips', text: 'Study tips' },
];

const PRIMARY_COLOR = "from-[#0D3B66] to-[#0A2C4E]"; // Dark blue gradient
const ACCENT_COLOR = "#F4A300"; // Orange (matches cap)

const MessageContent = ({ content }) => (
  <div className="prose prose-sm max-w-none text-gray-800">
    <ReactMarkdown 
      components={{
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  </div>
);

const sendAIMessage = async (message) => {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch response');
  }
  
  const data = await res.json();
  return data.answer || 'No answer found';
};

const EdvoraAIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Hello! I'm your Edvora AI learning assistant. I can help you find courses, explain concepts, recommend study materials, quiz you, and more. What would you like to learn today?", 
      isBot: true,
      timestamp: new Date().toISOString(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [minimized, setMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setUnreadCount(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, messages]);

  useEffect(() => {
    if (!isOpen && messages.length > 0 && messages[messages.length - 1].isBot) {
      setUnreadCount(prev => prev + 1);
    }
  }, [messages, isOpen]);

  const simulateTyping = (text) => {
    setIsTyping(true);
    const typingDuration = Math.min(2000, Math.max(800, text.length * 20));
    
    return new Promise(resolve => {
      setTimeout(() => {
        setIsTyping(false);
        resolve();
      }, typingDuration);
    });
  };

  const handleSendMessage = async () => {
    if (message.trim()) {
      const userMessage = { 
        id: messages.length + 1, 
        text: message, 
        isBot: false,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      setMessage("");
      setIsLoading(true);
      setApiError(null);

      try {
        const aiResponseText = await sendAIMessage(message);
        
        await simulateTyping(aiResponseText);
        
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          text: aiResponseText,
          isBot: true,
          timestamp: new Date().toISOString(),
        }]);
      } catch (error) {
        console.error('Error:', error);
        setApiError(error.message || "Connection error");
        
        await simulateTyping("I apologize, but I encountered an error. Please try again.");
        
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          text: "I apologize, but I encountered an error. Please try again.",
          isBot: true,
          timestamp: new Date().toISOString(),
          isError: true
        }]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleQuickQuery = (query) => {
    setMessage(query);
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const handleCategorySelect = (category) => {
    handleQuickQuery(`Recommend courses in ${category.label.toLowerCase()}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleMinimize = () => {
    setMinimized(!minimized);
  };

  const clearChat = () => {
    setMessages([
      { 
        id: 1, 
        text: "Chat has been reset. How can I help with your learning today?", 
        isBot: true,
        timestamp: new Date().toISOString(),
      }
    ]);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 text-black font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg shadow-xl w-96 mb-4 overflow-scroll hide-scrollbar"
            style={{ 
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              maxHeight: minimized ? '60px' : '80vh',
            }}
          >
            <div className={`bg-gradient-to-r ${PRIMARY_COLOR} text-white p-3 border-b border-gray-200`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400' : isTyping ? 'bg-orange-300 animate-pulse' : apiError ? 'bg-red-500' : 'bg-orange-500'}`}></div>
                  <h3 className="font-semibold">
                    Edvora AI Assistant
                    {apiError && <span className="ml-2 text-xs text-red-200">⚠️ Connection Issue</span>}
                  </h3>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={toggleMinimize}
                    className="p-1 hover:bg-[#0A2C4E] rounded"
                    aria-label={minimized ? "Expand chat" : "Minimize chat"}
                  >
                    <ChevronDown className="h-4 w-4" style={{ transform: minimized ? 'rotate(180deg)' : 'none' }} />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-[#0A2C4E] rounded"
                    aria-label="Close chat"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {!minimized && (
              <>
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex overflow-x-auto hide-scrollbar">
                  {LEARNING_CATEGORIES.map(category => (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category)}
                      className="px-3 py-1 text-xs rounded-full bg-white border border-gray-200 mr-2 hover:bg-[#F4A30020] hover:border-[#F4A300] hover:text-[#0D3B66] whitespace-nowrap transition-colors"
                    >
                      {category.label}
                    </button>
                  ))}
                </div>

                {apiError && (
                  <div className="px-4 py-2 bg-red-50 text-red-800 text-xs border-b border-red-100">
                    <div className="flex items-center">
                      <div className="mr-2 text-red-500">⚠️</div>
                      <div>
                        <p className="font-medium">Connection issue</p>
                        <p>{apiError}. Please try again later.</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="h-[calc(80vh-230px)] min-h-[300px] overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className="flex flex-col max-w-[80%]">
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            msg.isBot
                              ? msg.isError 
                                ? 'bg-red-50 text-red-800 border border-red-100' 
                                : 'bg-white shadow-sm border border-gray-100 text-gray-800'
                              : 'bg-[#0D3B66] text-white'
                          }`}
                        >
                          <MessageContent content={msg.text} />
                        </div>
                        
                        <div 
                          className={`text-xs mt-1 ${
                            msg.isBot ? 'text-left text-gray-500' : 'text-right text-gray-400'
                          }`}
                        >
                          {!msg.isBot && (
                            <span className="ml-1">✓</span>
                          )}
                        </div>
                        
                        {msg.isBot && !msg.isError && (
                          <div className="flex space-x-2 mt-1">
                            <button className="text-gray-400 hover:text-gray-600 text-xs flex items-center">
                              <ThumbsUp className="h-3 w-3 mr-1" /> Helpful
                            </button>
                            <button className="text-gray-400 hover:text-gray-600 text-xs flex items-center">
                              <Share2 className="h-3 w-3 mr-1" /> Share
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-white shadow-sm border border-gray-100">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {isLoading && !isTyping && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-white shadow-sm border border-gray-100 text-gray-500 flex items-center">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm">Processing your request...</span>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Quick Questions:</p>
                  <div className="flex overflow-x-auto pb-2 hide-scrollbar">
                    {QUICK_QUERIES.map(query => (
                      <button
                        key={query.id}
                        onClick={() => handleQuickQuery(query.text)}
                        className="px-3 py-1.5 text-xs whitespace-nowrap rounded-lg mr-2 bg-white border border-gray-200 text-gray-700 hover:bg-[#F4A30020] hover:border-[#F4A300] hover:text-[#0D3B66]"
                      >
                        {query.text}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 border-t border-gray-200 bg-white">
                  <div className="flex items-center">
                    <div className="flex-1 relative">
                      <input
                        ref={inputRef}
                        type="text"
                        placeholder="Ask about courses, concepts, or topics..."
                        className="w-full rounded-l-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F4A300] bg-gray-100 text-gray-900 placeholder-gray-500"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                      />
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={isLoading || !message.trim()}
                      className={`p-3 rounded-r-lg transition-colors ${
                        isLoading || !message.trim()
                          ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                          : 'bg-[#F4A300] hover:bg-[#e59400] text-white'
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  
                  <div className="flex justify-between mt-2 px-1 text-xs text-gray-500">
                    <button 
                      onClick={clearChat}
                      className="hover:text-[#0D3B66] flex items-center"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" /> Clear chat
                    </button>
                    <span>Edvora AI - Powering your learning journey</span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-gradient-to-r ${PRIMARY_COLOR} text-white rounded-full p-4 shadow-lg flex items-center justify-center relative`}
        style={{ 
          boxShadow: '0 10px 25px -5px rgba(13, 59, 102, 0.5), 0 10px 10px -5px rgba(13, 59, 102, 0.2)',
        }}
      >
        <MessageCircle className="h-6 w-6" />
        
        {!isOpen && unreadCount > 0 && (
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -top-2 -right-2 bg-[#F4A300] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold"
          >
            {unreadCount}
          </motion.div>
        )}
      </motion.button>
    </div>
  );
};

export default EdvoraAIChatbot;
