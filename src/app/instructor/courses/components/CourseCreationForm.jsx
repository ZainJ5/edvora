"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { 
  FiArrowLeft, FiArrowRight, FiCheck, FiUpload, FiDollarSign, 
  FiClock, FiBookOpen, FiTag, FiX, FiInfo, FiGrid 
} from 'react-icons/fi';

export default function CourseCreationForm({ initialData, onSubmit, isEditing = false }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [previewImage, setPreviewImage] = useState(null);
  const [tagInput, setTagInput] = useState("");

  const totalSteps = 4;
  
  const [courseData, setCourseData] = useState(initialData || {
    title: "",
    description: "",
    category: "",
    tags: [],
    price: 0,
    level: "Beginner",
    thumbnail: "",
    duration: "", 
  });

  useEffect(() => {
    if (isEditing && courseData.thumbnail && courseData.thumbnail !== "") {
      setPreviewImage(courseData.thumbnail);
    }
  }, [isEditing, courseData.thumbnail]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setCourseData({
      ...courseData,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
    });
  };

  const handleTagAdd = (e) => {
    e.preventDefault();
    if (tagInput.trim() && !courseData.tags.includes(tagInput.trim())) {
      setCourseData({
        ...courseData,
        tags: [...courseData.tags, tagInput.trim()]
      });
      setTagInput("");
    }
  };

  const handleTagRemove = (tagToRemove) => {
    setCourseData({
      ...courseData,
      tags: courseData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setCourseData({
          ...courseData,
          thumbnail: reader.result // In production, this would be the URL from your server
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return courseData.title.trim() !== "" && courseData.category !== "" && courseData.duration >= 1;
      case 2:
        return courseData.description.trim() !== "";
      case 3:
        return true; 
      case 4:
        return courseData.thumbnail !== "" && courseData.thumbnail !== null; 
      default:
        return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canProceed()) {
      setError("Please upload a thumbnail to proceed.");
      return;
    }
    setLoading(true);
    setError("");
    
    try {
      await onSubmit(courseData);
      router.push('/instructor/courses');
    } catch (err) {
      setError(err.message || "Failed to save course");
      setLoading(false);
    }
  };

  const categories = [
    { value: "Web Development", label: "Web Development" },
    { value: "Mobile Development", label: "Mobile Development" },
    { value: "AI", label: "AI" },
    { value: "Data Science", label: "Data Science" },
    { value: "Programming", label: "Programming" },
    { value: "Machine Learning", label: "Machine Learning" },
    { value: "Business", label: "Business" },
    { value: "Marketing", label: "Marketing" },
    { value: "Design", label: "Design" },
    { value: "Photography", label: "Photography" },
    { value: "Music", label: "Music" },
    { value: "Lifestyle", label: "Lifestyle" },
    { value: "Health & Fitness", label: "Health & Fitness" },
    { value: "Personal Development", label: "Personal Development" },
    { value: "Other", label: "Other" }
  ];

  const pageVariants = {
    initial: { opacity: 0, x: 100 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -100 }
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5
  };

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="space-y-6"
          >
            <h2 className="text-2xl font-semibold text-gray-800">Basic Information</h2>
            <p className="text-gray-600">Let's start with the fundamental details about your course.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="title">
                  Course Title <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={courseData.title}
                  onChange={handleChange}
                  placeholder="e.g. Complete Web Development Bootcamp"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#5d6aed] focus:border-transparent transition-all"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">Choose a specific, descriptive title to attract students.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="category">
                    Category <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="category"
                      name="category"
                      value={courseData.category}
                      onChange={handleChange}
                      className="appearance-none w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#5d6aed] focus:border-transparent transition-all pr-10"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <FiGrid className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="level">
                    Difficulty Level <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="level"
                      name="level"
                      value={courseData.level}
                      onChange={handleChange}
                      className="appearance-none w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#5d6aed] focus:border-transparent transition-all pr-10"
                    >
                      <option value="Beginner">Beginner - No prior knowledge required</option>
                      <option value="Intermediate">Intermediate - Basic knowledge required</option>
                      <option value="Advanced">Advanced - Comprehensive knowledge required</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <FiBookOpen className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="duration">
                  Duration (hours) <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="duration"
                    name="duration"
                    value={courseData.duration}
                    onChange={handleChange}
                    placeholder="e.g. 10"
                    min="1"
                    step="1"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#5d6aed] focus:border-transparent transition-all pl-10"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <FiClock className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-500">Estimated duration in hours.</p>
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="space-y-6"
          >
            <h2 className="text-2xl font-semibold text-gray-800">Course Description</h2>
            <p className="text-gray-600">Provide detailed information about what students will learn.</p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
                Description <span className="text-red-600">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={courseData.description}
                onChange={handleChange}
                placeholder="Write a compelling description of your course..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#5d6aed] focus:border-transparent transition-all h-64 resize-none"
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                Include what students will learn, requirements, target audience, and course structure.
                A good description is typically 200-1000 words.
              </p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg flex items-start space-x-3">
              <div className="text-blue-500 flex-shrink-0 mt-1">
                <FiInfo className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-800">Tips for a Great Description</h4>
                <ul className="mt-1 text-sm text-blue-700 list-disc list-inside space-y-1">
                  <li>Clearly outline the learning outcomes</li>
                  <li>Explain who should take this course</li>
                  <li>Highlight what makes your course unique</li>
                  <li>Use sections and formatting to improve readability</li>
                </ul>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="space-y-6"
          >
            <h2 className="text-2xl font-semibold text-gray-800">Pricing & Tags</h2>
            <p className="text-gray-600">Set your course price and add relevant tags to help students find your course.</p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="price">
                Course Price ($)
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={courseData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#5d6aed] focus:border-transparent transition-all pl-10"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FiDollarSign className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Set to 0 for a free course.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="tags">
                Course Tags
              </label>
              <div className="flex mb-2">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    id="tagInput"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag and press Enter or Add"
                    className="w-full px-4 py-3 rounded-l-lg border border-gray-300 focus:ring-2 focus:ring-[#5d6aed] focus:border-transparent transition-all pl-10"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleTagAdd(e);
                      }
                    }}
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <FiTag className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <button
                  onClick={handleTagAdd}
                  className="bg-[#5d6aed] hover:bg-[#5d6aed]/90 text-white font-medium py-3 px-4 rounded-r-lg transition-all"
                  type="button"
                >
                  Add
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-3">
                {courseData.tags.length === 0 ? (
                  <p className="text-sm italic text-gray-500">No tags added yet</p>
                ) : (
                  courseData.tags.map((tag, index) => (
                    <div key={index} className="bg-[#5d6aed]/10 text-[#5d6aed] px-3 py-1 rounded-full flex items-center border border-[#5d6aed]/20 group hover:bg-[#5d6aed]/20 transition-all">
                      <span className="text-sm">{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleTagRemove(tag)}
                        className="ml-1.5 text-[#5d6aed]/60 group-hover:text-[#5d6aed] focus:outline-none transition-colors"
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Add relevant tags to improve discoverability (e.g. javascript, web design, marketing).
              </p>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step4"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="space-y-6"
          >
            <h2 className="text-2xl font-semibold text-gray-800">Course Thumbnail</h2>
            <p className="text-gray-600">Add an attractive thumbnail to make your course stand out. <span className="text-red-600">*</span></p>
            
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-full max-w-lg aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
                {previewImage && previewImage !== "" ? (
                  <div className="relative w-full h-full">
                    <Image 
                      src={previewImage}
                      alt="Course thumbnail preview"
                      fill 
                      style={{ objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewImage(null);
                        setCourseData({
                          ...courseData,
                          thumbnail: ""
                        });
                      }}
                      className="absolute top-2 right-2 bg-white p-1 rounded-full shadow-md hover:bg-red-50 transition-colors"
                    >
                      <FiX className="h-5 w-5 text-red-500" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <FiUpload className="h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-gray-500">Recommended size: 1280x720 pixels (16:9 ratio)</p>
                    <p className="text-sm text-gray-400 mt-1">JPG, PNG or GIF, 5MB maximum</p>
                  </div>
                )}
              </div>
              
              <label className="bg-[#5d6aed] hover:bg-[#5d6aed]/90 text-white font-medium py-3 px-6 rounded-lg transition-all flex items-center justify-center cursor-pointer">
                <FiUpload className="mr-2" /> {previewImage ? 'Change Thumbnail' : 'Upload Thumbnail'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              
              <div className="bg-amber-50 p-4 rounded-lg w-full max-w-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0 text-amber-500">
                    <FiInfo className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-amber-800">Why thumbnails matter</h4>
                    <p className="mt-1 text-sm text-amber-700">
                      Courses with professional thumbnails get up to 75% more clicks and enrollments.
                      Choose an image that clearly represents your course content.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const progress = (step / totalSteps) * 100;

  return (
    <div className="min-h-screen text-black py-2">
      <div className="mx-auto">
        <div className="mb-8 px-4">
          <button 
            onClick={() => router.push('/instructor/courses')}
            className="flex items-center text-gray-600 hover:text-gray-900 cursor-pointer transition-colors mb-6"
          >
            <FiArrowLeft className="mr-2" /> Back to courses
          </button>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {isEditing ? 'Edit Course' : 'Create New Course'}
          </h1>
          <p className="text-gray-600">
            {isEditing 
              ? 'Update your course information to keep it relevant and engaging.'
              : 'Fill in the details below to create your new course.'}
          </p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden">
          <div className="h-1 w-full bg-gray-200">
            <motion.div 
              className="h-full bg-[#5d6aed]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            ></motion.div>
          </div>
          
          <div className="flex justify-between px-4 sm:px-8 py-4 border-b">
            {Array.from({ length: totalSteps }).map((_, index) => {
              const stepNum = index + 1;
              const isActive = step === stepNum;
              const isCompleted = step > stepNum;
              
              return (
                <button
                  key={stepNum}
                  onClick={() => {
                    if (stepNum <= step) {
                      setStep(stepNum);
                    }
                  }}
                  className={`
                    flex flex-col items-center justify-center sm:flex-row sm:justify-start
                    ${stepNum <= step ? 'cursor-pointer' : 'cursor-not-allowed'}
                    ${isActive ? 'text-[#5d6aed]' : isCompleted ? 'text-gray-600' : 'text-gray-400'}
                  `}
                  disabled={stepNum > step}
                >
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center 
                    ${isActive ? 'bg-[#5d6aed]/10 text-[#5d6aed] border-2 border-[#5d6aed]' : 
                      isCompleted ? 'bg-[#5d6aed] text-white' : 'bg-gray-200 text-gray-500'}
                    transition-all duration-200
                  `}>
                    {isCompleted ? <FiCheck /> : stepNum}
                  </div>
                  <span className="mt-1 sm:ml-2 text-xs sm:text-sm font-medium hidden sm:block">
                    {stepNum === 1 && 'Basic Info'}
                    {stepNum === 2 && 'Description'}
                    {stepNum === 3 && 'Pricing & Tags'}
                    {stepNum === 4 && 'Thumbnail'}
                  </span>
                </button>
              );
            })}
          </div>
          
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 m-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="p-6 md:p-8">
              <AnimatePresence mode="wait">
                {renderStepContent()}
              </AnimatePresence>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className={`px-6 py-2.5 border border-gray-300 rounded-lg  flex items-center 
                  ${step === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer text-gray-700'}`}
                disabled={step === 1}
              >
                <FiArrowLeft className="mr-2" /> Previous
              </button>
              
              <div>
                {step < totalSteps ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!canProceed()}
                    className={`px-6 py-2.5 bg-[#5d6aed] text-white rounded-lg  flex items-center
                      ${canProceed() ? 'hover:bg-[#5d6aed]/90 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                  >
                    Next <FiArrowRight className="ml-2" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading || !canProceed()}
                    className={`px-6 py-2.5 bg-[#5d6aed] text-white rounded-lg flex items-center ${loading || !canProceed() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#5d6aed]/90'}`}
                  >
                    {loading ? 'Saving...' : (isEditing ? 'Update Course' : 'Create Course')}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}