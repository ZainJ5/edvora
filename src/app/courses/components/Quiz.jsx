'use client'

import { useState, useEffect } from 'react';
import { FaArrowLeft, FaCheck, FaTimes, FaQuestionCircle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const Quiz = ({ quiz, onComplete, onBack }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("QUIZ IS:",quiz)
    const loadQuiz = async () => {
      setLoading(true);
      try {
        if (quiz.quizId) {
          await fetchQuiz(quiz.quizId);
        } else {
          await generateQuiz();
        }
      } catch (err) {
        console.error("Error loading quiz:", err);
        setError("Failed to load quiz. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    loadQuiz();
  }, [quiz.quizId]);

  const fetchQuiz = async (quizId) => {
    console.log("Quiz id is:",quizId)
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/quizzes/${quizId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch quiz');
      }
      
      const data = await response.json();
      setQuizData(data.quiz);
    } catch (err) {
      console.error("Error fetching quiz:", err);
      toast.error('Failed to load quiz. Generating a new one...');
      await generateQuiz();
    }
  };

  const generateQuiz = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const context = {
        lectureTitle: quiz.lectureTitle,
        transcript: quiz.transcript || '',
        aiSummary: quiz.aiSummary || '',
      };
      
      const aiResponse = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          message: `Generate a quiz with 5 multiple-choice questions based on this lecture: 
            Title: ${context.lectureTitle}
            Summary: ${context.aiSummary}
            Transcript: ${context.transcript}
            
            Format the response as a JSON object with this structure:
            {
              "title": "Quiz title",
              "description": "Brief description",
              "questions": [
                {
                  "questionText": "Question text",
                  "options": ["Option A", "Option B", "Option C", "Option D"],
                  "correctAnswer": 0,
                  "explanation": "Explanation of the answer"
                }
              ]
            }
            Make sure the questions are relevant to the lecture content.`
        })
      });
      
      if (!aiResponse.ok) {
        throw new Error('Failed to generate quiz');
      }
      
      const aiData = await aiResponse.json();
      
      let quizData;
      try {
        quizData = typeof aiData.answer === 'string' ? JSON.parse(aiData.answer) : aiData.answer;
      } catch (e) {
        throw new Error('Failed to parse AI response');
      }
      
      const saveResponse = await fetch(`/api/courses/${quiz.courseId}/lectures/${quiz.lectureId}/quizzes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...quizData,
          aiGenerated: true,
          course: quiz.courseId,
          lecture: quiz.lectureId
        })
      });
      
      if (!saveResponse.ok) {
        throw new Error('Failed to save generated quiz');
      }
      
      const savedQuiz = await saveResponse.json();
      setQuizData(savedQuiz.quiz);
      
    } catch (err) {
      console.error("Error generating quiz:", err);
      setQuizData(getFallbackQuiz(quiz.lectureTitle));
    }
  };

  const getFallbackQuiz = (lectureTitle) => {
    const isHtmlLecture = lectureTitle.toLowerCase().includes('html');
    
    return {
      _id: `fallback_quiz_${Date.now()}`,
      title: `Quiz for ${lectureTitle}`,
      description: "Test your understanding of the lecture",
      questions: [
        {
          questionText: `What is the main topic of "${lectureTitle}"?`,
          options: isHtmlLecture ? 
            ["HTML Basics", "CSS Styling", "JavaScript Programming", "Web Development"] :
            ["Web Development", "Digital Marketing", "Content Creation", "Programming Fundamentals"],
          correctAnswer: isHtmlLecture ? 0 : 3,
          explanation: `The lecture primarily focuses on ${isHtmlLecture ? "HTML basics and structure" : "fundamental programming concepts"}.`
        },
        {
          questionText: isHtmlLecture ? 
            "What does HTML stand for?" : 
            "What is the primary purpose of this lecture?",
          options: isHtmlLecture ? 
            ["Hypertext Markup Language", "High Tech Modern Language", "Hypertext Modern Layout", "High Text Machine Language"] :
            ["Entertainment", "Teaching new concepts", "Reviewing past material", "Testing student knowledge"],
          correctAnswer: isHtmlLecture ? 0 : 1,
          explanation: isHtmlLecture ? 
            "HTML stands for Hypertext Markup Language." : 
            "The primary purpose of this lecture is to teach new concepts to students."
        },
        {
          questionText: isHtmlLecture ?
            "Which type of language is HTML?" :
            "How would you best describe the content of this lecture?",
          options: isHtmlLecture ?
            ["Programming Language", "Markup Language", "Scripting Language", "Query Language"] :
            ["Theoretical", "Practical", "Historical", "Fictional"],
          correctAnswer: isHtmlLecture ? 1 : 1,
          explanation: isHtmlLecture ?
            "HTML is a markup language, not a programming language." :
            "The lecture focuses on practical applications rather than just theory."
        }
      ]
    };
  };

  const handleOptionSelect = (questionIndex, optionIndex) => {
    if (submitted) return;
    setSelectedOptions({
      ...selectedOptions,
      [questionIndex]: optionIndex
    });
  };

  const handleSubmit = () => {
    if (!quizData || !quizData.questions) return;
    
    if (Object.keys(selectedOptions).length < quizData.questions.length) {
      toast.error('Please answer all questions before submitting');
      return;
    }

    let correctAnswers = 0;
    quizData.questions.forEach((question, index) => {
      if (selectedOptions[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const finalScore = Math.round((correctAnswers / quizData.questions.length) * 100);
    setScore(finalScore);
    setSubmitted(true);
    setShowResults(true);

    saveQuizAttempt(finalScore);
  };

  const saveQuizAttempt = async (finalScore) => {
    if (!quizData || !quizData._id) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/quizzes/${quizData._id}/attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          score: finalScore,
          answers: selectedOptions
        })
      });
    } catch (err) {
      console.error('Failed to save quiz attempt:', err);
    }
  };

  const handleNext = () => {
    if (!quizData || !quizData.questions) return;
    
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleFinish = () => {
    onComplete(score >= 60, quizData._id);
  };

  const handleRetry = () => {
    setSelectedOptions({});
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setSubmitted(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-4xl mx-auto p-8">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2c3180] mb-4"></div>
          <h3 className="text-xl font-medium text-[#2c3180]">Loading Quiz...</h3>
          <p className="text-gray-600 mt-2 text-center">
            We're preparing your quiz. This will only take a moment.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-4xl mx-auto p-8">
        <div className="flex flex-col items-center justify-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-medium text-red-600">Error Loading Quiz</h3>
          <p className="text-gray-600 mt-2 text-center">{error}</p>
          <div className="mt-6 flex space-x-4">
            <button 
              onClick={onBack}
              className="px-4 py-2 border border-[#2c3180] text-[#2c3180] rounded-md hover:bg-[#2c3180] hover:bg-opacity-10"
            >
              Return to Lecture
            </button>
            <button 
              onClick={() => generateQuiz()}
              className="px-4 py-2 bg-[#2c3180] text-white rounded-md hover:bg-opacity-90"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!quizData || !quizData.questions) return null;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-4xl mx-auto">
      <div className="bg-[#2c3180] text-white p-4 md:p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">{quizData.title}</h2>
            <p className="mt-1 text-blue-100">{quizData.description || 'Test your knowledge from this lecture'}</p>
          </div>
          <button 
            onClick={onBack}
            className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white"
          >
            <FaArrowLeft />
          </button>
        </div>
        
        {!showResults && (
          <div className="mt-4 flex items-center">
            <div className="bg-white bg-opacity-20 h-2 flex-1 rounded-full overflow-hidden">
              <div 
                className="bg-white h-2 rounded-full" 
                style={{ width: `${((currentQuestionIndex + 1) / quizData.questions.length) * 100}%` }}
              ></div>
            </div>
            <span className="ml-3 text-sm">
              Question {currentQuestionIndex + 1} of {quizData.questions.length}
            </span>
          </div>
        )}
      </div>
      
      <div className="p-4 md:p-6">
        {!showResults ? (
          <div>
            <h3 className="text-lg md:text-xl font-medium text-gray-800 mb-4">
              {quizData.questions[currentQuestionIndex].questionText}
            </h3>
            
            <div className="space-y-3 mb-6">
              {quizData.questions[currentQuestionIndex].options.map((option, optionIndex) => (
                <div 
                  key={optionIndex}
                  onClick={() => handleOptionSelect(currentQuestionIndex, optionIndex)}
                  className={`p-3 border rounded-lg cursor-pointer hover:border-[#2c3180] flex items-center
                    ${selectedOptions[currentQuestionIndex] === optionIndex 
                      ? 'bg-[#2c3180] bg-opacity-10 border-[#2c3180]' 
                      : 'border-gray-200'}`}
                >
                  <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center
                    ${selectedOptions[currentQuestionIndex] === optionIndex 
                      ? 'bg-[#2c3180] border-[#2c3180]' 
                      : 'border-gray-300'}`}
                  >
                    {selectedOptions[currentQuestionIndex] === optionIndex && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className={selectedOptions[currentQuestionIndex] === optionIndex ? 'text-[#2c3180] font-medium' : ''}>
                    {option}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between mt-6">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className={`px-4 py-2 rounded-md ${
                  currentQuestionIndex === 0
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Previous
              </button>
              
              {currentQuestionIndex < quizData.questions.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-[#2c3180] text-white rounded-md hover:bg-opacity-90"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-[#2c3180] text-white rounded-md hover:bg-opacity-90"
                >
                  Submit Quiz
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center mb-6">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4
                ${score >= 60 ? 'bg-green-100' : 'bg-red-100'}`}
              >
                <span className={`text-3xl font-bold ${score >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                  {score}%
                </span>
              </div>
              <h3 className="text-xl font-bold">
                {score >= 60 ? 'Congratulations!' : 'Try Again'}
              </h3>
              <p className="text-gray-600">
                {score >= 60 
                  ? 'You passed the quiz. You can now proceed to the next lecture.' 
                  : 'You need to score at least 60% to pass this quiz and proceed to the next lecture.'}
              </p>
            </div>
            
            <div className="space-y-4 mb-6">
              {quizData.questions.map((question, index) => {
                const isCorrect = selectedOptions[index] === question.correctAnswer;
                
                return (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border ${
                      isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className={`p-1 rounded-full ${isCorrect ? 'text-green-600' : 'text-red-600'} mr-2 mt-0.5`}>
                        {isCorrect ? <FaCheck /> : <FaTimes />}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">{question.questionText}</h4>
                        <div className="mt-2">
                          <p className="text-sm">
                            <span className="font-medium">Your answer: </span> 
                            {question.options[selectedOptions[index]]}
                          </p>
                          {!isCorrect && (
                            <p className="text-sm mt-1">
                              <span className="font-medium">Correct answer: </span> 
                              {question.options[question.correctAnswer]}
                            </p>
                          )}
                          {question.explanation && (
                            <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-sm">
                              <span className="font-medium">Explanation: </span>
                              {question.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-between mt-6">
              {score < 60 ? (
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-[#2c3180] text-white rounded-md hover:bg-opacity-90"
                >
                  Retry Quiz
                </button>
              ) : (
                <button
                  onClick={onBack}
                  className="px-4 py-2 border border-[#2c3180] text-[#2c3180] rounded-md hover:bg-[#2c3180] hover:bg-opacity-10"
                >
                  Back to Lecture
                </button>
              )}
              
              <button
                onClick={handleFinish}
                disabled={score < 60}
                className={`px-4 py-2 rounded-md ${
                  score >= 60
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {score >= 60 ? 'Continue to Next Lecture' : 'Complete Quiz to Continue'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;