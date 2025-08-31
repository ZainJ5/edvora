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
            Make sure the questions are relevant to the lecture content. Respond with only the JSON object and nothing else. Do not include any markdown or code fences.`
        })
      });
      
      if (!aiResponse.ok) {
        throw new Error('Failed to generate quiz');
      }
      
      const aiData = await aiResponse.json();
      
      let quizData;
      try {
        let answer = typeof aiData.answer === 'string' ? aiData.answer.trim() : JSON.stringify(aiData.answer);
        // Strip potential code fences
        answer = answer.replace(/^```json\s*/s, '').replace(/\s*```$/s, '').trim();
        quizData = JSON.parse(answer);
      } catch (e) {
        console.error('Failed to parse AI response:', aiData.answer);
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
      <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-3xl mx-auto p-8 border border-gray-100">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0A4D7C]"></div>
          <h3 className="text-xl font-semibold text-[#0A4D7C]">Preparing Your Quiz</h3>
          <p className="text-gray-500 text-center max-w-md">
            We're loading the questions based on the lecture content. This should only take a moment.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-3xl mx-auto p-8 border border-gray-100">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="bg-red-50 p-4 rounded-full">
            <FaExclamationCircle className="text-red-500 text-3xl" />
          </div>
          <h3 className="text-xl font-semibold text-red-600">Error Loading Quiz</h3>
          <p className="text-gray-500 text-center max-w-md">{error}</p>
          <div className="mt-6 flex space-x-4">
            <button 
              onClick={onBack}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
            >
              Return to Lecture
            </button>
            <button 
              onClick={() => generateQuiz()}
              className="px-6 py-3 bg-[#0A4D7C] text-white rounded-lg hover:bg-[#083d63] transition-colors duration-200 font-medium"
            >
              Retry Loading
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!quizData || !quizData.questions) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-3xl mx-auto border border-gray-100">
      <div className="bg-[#0A4D7C] text-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{quizData.title}</h2>
            <p className="mt-1 text-blue-100 text-sm">{quizData.description || 'Test your understanding of the lecture content'}</p>
          </div>
          <button 
            onClick={onBack}
            className="p-2 rounded-full hover:bg-white/10 transition-colors duration-200"
            aria-label="Back to lecture"
          >
            <FaArrowLeft className="text-lg" />
          </button>
        </div>
        
        {!showResults && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-100">Progress</span>
              <span className="text-sm font-medium">
                {currentQuestionIndex + 1} / {quizData.questions.length}
              </span>
            </div>
            <div className="bg-white/20 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-white h-full rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / quizData.questions.length) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-6">
        {!showResults ? (
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-6 leading-tight">
              {quizData.questions[currentQuestionIndex].questionText}
            </h3>
            
            <div className="space-y-3 mb-8">
              {quizData.questions[currentQuestionIndex].options.map((option, optionIndex) => (
                <div 
                  key={optionIndex}
                  onClick={() => handleOptionSelect(currentQuestionIndex, optionIndex)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 flex items-center
                    ${selectedOptions[currentQuestionIndex] === optionIndex 
                      ? 'border-[#0A4D7C] bg-[#0A4D7C]/5 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center transition-colors duration-200
                    ${selectedOptions[currentQuestionIndex] === optionIndex 
                      ? 'border-[#0A4D7C] bg-[#0A4D7C]' 
                      : 'border-gray-300'}`}
                  >
                    {selectedOptions[currentQuestionIndex] === optionIndex && (
                      <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className={`text-gray-700 font-medium ${selectedOptions[currentQuestionIndex] === optionIndex ? 'text-[#0A4D7C]' : ''}`}>
                    {option}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors duration-200
                  ${currentQuestionIndex === 0
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}
              >
                Previous
              </button>
              
              {currentQuestionIndex < quizData.questions.length - 1 ? (
                <button
                  onClick={handleNext}
                  disabled={selectedOptions[currentQuestionIndex] === undefined}
                  className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors duration-200
                    ${selectedOptions[currentQuestionIndex] === undefined
                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                      : 'text-white bg-[#0A4D7C] hover:bg-[#083d63]'}`}
                >
                  Next Question
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={Object.keys(selectedOptions).length < quizData.questions.length}
                  className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors duration-200
                    ${Object.keys(selectedOptions).length < quizData.questions.length
                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                      : 'text-white bg-[#FFA500] hover:bg-[#e69500]'}`}
                >
                  Submit Quiz
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 shadow-md
                ${score >= 60 ? 'bg-green-50' : 'bg-red-50'}`}
              >
                <span className={`text-4xl font-bold ${score >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                  {score}%
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {score >= 60 ? 'Well Done!' : 'Needs Improvement'}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {score >= 60 
                  ? 'You\'ve passed the quiz and can proceed to the next lecture.' 
                  : 'A score of at least 60% is required to pass and unlock the next lecture.'}
              </p>
            </div>
            
            <div className="space-y-6 mb-8">
              {quizData.questions.map((question, index) => {
                const isCorrect = selectedOptions[index] === question.correctAnswer;
                
                return (
                  <div 
                    key={index}
                    className={`p-5 rounded-lg border shadow-sm transition-all duration-200
                      ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`flex-shrink-0 p-2 rounded-full ${isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {isCorrect ? <FaCheck className="text-xl" /> : <FaTimes className="text-xl" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 mb-3">{question.questionText}</h4>
                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="font-medium text-gray-600">Your answer: </span> 
                            <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                              {question.options[selectedOptions[index]]}
                            </span>
                          </p>
                          {!isCorrect && (
                            <p>
                              <span className="font-medium text-gray-600">Correct answer: </span> 
                              <span className="text-green-600">{question.options[question.correctAnswer]}</span>
                            </p>
                          )}
                          {question.explanation && (
                            <p className="mt-3 pt-3 border-t border-gray-200 text-gray-500 italic">
                              {question.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              {score < 60 ? (
                <button
                  onClick={handleRetry}
                  className="px-6 py-3 bg-[#FFA500] text-white rounded-lg hover:bg-[#e69500] transition-colors duration-200 font-medium"
                >
                  Retry Quiz
                </button>
              ) : (
                <button
                  onClick={onBack}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
                >
                  Back to Lecture
                </button>
              )}
              
              <button
                onClick={handleFinish}
                disabled={score < 60}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors duration-200
                  ${score >= 60
                    ? 'bg-[#0A4D7C] text-white hover:bg-[#083d63]'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              >
                {score >= 60 ? 'Proceed to Next Lecture' : 'Complete Quiz to Proceed'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;