import React, { useState } from 'react';
import { PlusIcon, TrashIcon, HelpCircleIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react';

export default function QuizForm({ onSubmit, onCancel }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([
    { questionText: '', options: ['', ''], correctAnswer: 0, explanation: '' }
  ]);
  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    
    if (!title.trim()) {
      errors.title = 'Quiz title is required';
    }
    
    const questionErrors = [];
    questions.forEach((question, qIndex) => {
      const qErrors = {};
      
      if (!question.questionText.trim()) {
        qErrors.questionText = 'Question text is required';
      }
      
      const optionErrors = question.options.map(opt => !opt.trim() ? 'Option text is required' : '');
      if (optionErrors.some(err => err)) {
        qErrors.options = optionErrors;
      }
      
      if (Object.keys(qErrors).length > 0) {
        questionErrors[qIndex] = qErrors;
      }
    });
    
    if (questionErrors.length > 0) {
      errors.questions = questionErrors;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const addQuestion = () => {
    setQuestions([
      ...questions, 
      { questionText: '', options: ['', ''], correctAnswer: 0, explanation: '' }
    ]);
  };

  const removeQuestion = (index) => {
    if (questions.length > 1) {
      const newQuestions = [...questions];
      newQuestions.splice(index, 1);
      setQuestions(newQuestions);
      
      // Also remove any errors for this question
      if (formErrors.questions) {
        const newQuestionErrors = [...formErrors.questions];
        newQuestionErrors.splice(index, 1);
        setFormErrors({
          ...formErrors,
          questions: newQuestionErrors.length > 0 ? newQuestionErrors : undefined
        });
      }
    }
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
    
    // Clear the error for this field if it exists
    if (formErrors.questions?.[index]?.[field]) {
      const newErrors = {...formErrors};
      delete newErrors.questions[index][field];
      setFormErrors(newErrors);
    }
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
    
    // Clear the error for this option if it exists
    if (formErrors.questions?.[questionIndex]?.options?.[optionIndex]) {
      const newErrors = {...formErrors};
      newErrors.questions[questionIndex].options[optionIndex] = '';
      setFormErrors(newErrors);
    }
  };

  const addOption = (questionIndex) => {
    const newQuestions = [...questions];
    if (newQuestions[questionIndex].options.length < 5) {
      newQuestions[questionIndex].options.push('');
      setQuestions(newQuestions);
    }
  };

  const removeOption = (questionIndex, optionIndex) => {
    const newQuestions = [...questions];
    if (newQuestions[questionIndex].options.length > 2) {
      newQuestions[questionIndex].options.splice(optionIndex, 1);
      
      if (newQuestions[questionIndex].correctAnswer === optionIndex) {
        newQuestions[questionIndex].correctAnswer = 0;
      } else if (newQuestions[questionIndex].correctAnswer > optionIndex) {
        newQuestions[questionIndex].correctAnswer--;
      }
      
      setQuestions(newQuestions);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({ title, description, questions });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Quiz Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (formErrors.title) {
              setFormErrors({...formErrors, title: undefined});
            }
          }}
          className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm 
            ${formErrors.title ? 'border-red-300' : 'border-gray-300'}`}
          required
        />
        {formErrors.title && (
          <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description <span className="text-gray-400 text-xs">(optional)</span>
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          rows="2"
          placeholder="Brief description of this quiz"
        />
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Questions</h3>
          <button
            type="button"
            onClick={addQuestion}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-1" /> Add Question
          </button>
        </div>
        
        <div className="space-y-6">
          {questions.map((question, qIndex) => (
            <div 
              key={qIndex} 
              className={`border rounded-lg overflow-hidden ${
                formErrors.questions?.[qIndex] 
                  ? 'border-red-200 bg-red-50' 
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="bg-white p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-900">Question {qIndex + 1}</h4>
                  {questions.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => removeQuestion(qIndex)}
                      className="text-gray-400 hover:text-red-600 focus:outline-none"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question Text
                  </label>
                  <input
                    type="text"
                    value={question.questionText}
                    onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                    className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm 
                      ${formErrors.questions?.[qIndex]?.questionText ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="Enter your question here"
                    required
                  />
                  {formErrors.questions?.[qIndex]?.questionText && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.questions[qIndex].questionText}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Answer Options
                  </label>
                  <div className="space-y-3">
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center space-x-2">
                        <div className="flex-shrink-0">
                          <input
                            type="radio"
                            id={`q${qIndex}_option${oIndex}`}
                            name={`q${qIndex}_correct`}
                            checked={question.correctAnswer === oIndex}
                            onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div className="flex-grow">
                          <div className="relative rounded-md">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                              className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-10
                                ${formErrors.questions?.[qIndex]?.options?.[oIndex] ? 'border-red-300' : 'border-gray-300'}`}
                              placeholder={`Option ${oIndex + 1}`}
                              required
                            />
                            {question.correctAnswer === oIndex && (
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                              </div>
                            )}
                          </div>
                          {formErrors.questions?.[qIndex]?.options?.[oIndex] && (
                            <p className="mt-1 text-xs text-red-600">{formErrors.questions[qIndex].options[oIndex]}</p>
                          )}
                        </div>
                        {question.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(qIndex, oIndex)}
                            className="text-gray-400 hover:text-red-600 focus:outline-none"
                          >
                            <XCircleIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {question.options.length < 5 && (
                    <button
                      type="button"
                      onClick={() => addOption(qIndex)}
                      className="mt-2 inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <PlusIcon className="h-3 w-3 mr-1" /> Add Option
                    </button>
                  )}
                </div>
                
                <div>
                  <div className="flex items-center">
                    <label htmlFor={`explanation-${qIndex}`} className="block text-sm font-medium text-gray-700">
                      Explanation
                    </label>
                    <div className="ml-1 text-gray-400 hover:text-gray-500" title="Provide feedback that explains the correct answer">
                      <HelpCircleIcon className="h-4 w-4" />
                    </div>
                  </div>
                  <textarea
                    id={`explanation-${qIndex}`}
                    value={question.explanation}
                    onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    rows="2"
                    placeholder="Explain why the correct answer is right (optional)"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Create Quiz
        </button>
      </div>
    </form>
  );
}