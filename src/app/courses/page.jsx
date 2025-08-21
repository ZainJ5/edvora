"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FaSearch, FaFilter, FaStar, FaRegClock, FaUserGraduate, FaTags } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    level: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (filters.category) queryParams.append('category', filters.category);
        if (filters.level) queryParams.append('level', filters.level);
        if (filters.search) queryParams.append('search', filters.search);
        
        const response = await fetch(`/api/courses?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch courses');
        }
        
        const data = await response.json();
        setCourses(data.courses);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
  };

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const categoryColors = {
    "Web Development": "bg-blue-500",
    "Mobile Development": "bg-green-500",
    "Data Science": "bg-purple-500",
    "AI/ML": "bg-red-500",
    "Business": "bg-amber-500",
    "Design": "bg-indigo-500"
  };

  const levelBadgeColors = {
    "Beginner": "bg-emerald-100 text-emerald-800",
    "Intermediate": "bg-blue-100 text-blue-800",
    "Advanced": "bg-purple-100 text-purple-800",
  };

  if (isLoading) {
    return (
      <div className="py-10 px-4 md:px-6">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border-t-4 border-purple-600 animate-spin"></div>
            <div className="absolute inset-3 rounded-full border-2 border-purple-100"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading your courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 px-4 md:px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="bg-red-100 p-2 rounded-full">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-800">Error Loading Courses</h3>
            </div>
            <p className="mt-4 text-gray-600">{error}</p>
          </div>
          <div className="px-6 py-4 bg-gray-50">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors duration-200 flex items-center justify-center"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="py-10 px-4 md:px-6">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 font-playfair">Browse Courses</h1>
            <p className="text-gray-600">Discover top-quality courses to enhance your skills</p>
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <FaFilter className="text-gray-600" />
            <span className="text-sm font-medium">Filters</span>
          </button>
        </div>
        
        <motion.div 
          initial="hidden"
          animate={showFilters ? "visible" : "hidden"}
          variants={{
            visible: { height: 'auto', opacity: 1 },
            hidden: { height: 0, opacity: 0 }
          }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="bg-white rounded-xl shadow-md p-5 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-1 md:col-span-1">
                <form onSubmit={handleSearchSubmit} className="flex">
                  <div className="relative flex-grow">
                    <input
                      type="text"
                      name="search"
                      value={filters.search}
                      onChange={handleFilterChange}
                      placeholder="Search courses..."
                      className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                  <button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-r-lg transition-colors duration-200"
                  >
                    Search
                  </button>
                </form>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Mobile Development">Mobile Development</option>
                  <option value="Data Science">Data Science</option>
                  <option value="AI/ML">AI/ML</option>
                  <option value="Business">Business</option>
                  <option value="Design">Design</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                <select
                  name="level"
                  value={filters.level}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">All Levels</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
              <button 
                onClick={() => setFilters({ category: '', level: '', search: '' })}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                Clear filters
              </button>
              <span className="text-sm text-gray-500">
                {courses.length} {courses.length === 1 ? 'course' : 'courses'} found
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
      
      {courses.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-md p-8 text-center"
        >
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No courses found</h2>
            <p className="text-gray-500 mb-6">We couldn't find any courses matching your criteria.</p>
            <button
              onClick={() => setFilters({ category: '', level: '', search: '' })}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors duration-200"
            >
              Clear Filters
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {courses.map((course) => (
            <motion.div 
              key={course._id} 
              variants={fadeIn}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full transform hover:-translate-y-1 transition-transform duration-300"
            >
              <div className="h-48 bg-gray-200 relative">
                {course.thumbnail ? (
                  <Image 
                    src={course.thumbnail}
                    alt={course.title}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gradient-to-r from-purple-100 to-blue-100">
                    <span className="text-gray-400 font-medium">No thumbnail</span>
                  </div>
                )}
                {course.category && (
                  <div className={`absolute top-3 left-3 ${categoryColors[course.category] || "bg-gray-500"} text-white text-xs px-2 py-1 rounded`}>
                    {course.category}
                  </div>
                )}
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="mb-3">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-gray-800 font-playfair line-clamp-2">{course.title}</h3>
                    <span className={`${levelBadgeColors[course.level] || "bg-gray-100 text-gray-800"} text-xs px-2 py-1 rounded-full ml-2 whitespace-nowrap`}>
                      {course.level}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{course.description || "No description provided."}</p>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {course.tags && course.tags.slice(0,3).map((tag, index) => (
                    <span key={index} className="bg-gray-100 px-2 py-0.5 text-xs rounded-full text-gray-700 flex items-center">
                      <FaTags className="mr-1 text-gray-400" size={10} />
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="mt-auto pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-600 flex items-center">
                      <FaUserGraduate className="mr-1 text-gray-400" size={14} />
                      {course.instructorName}
                    </span>
                    
                    <div className="flex items-center">
                      <FaStar className="text-yellow-400 mr-1" size={14} />
                      <span className="text-sm font-medium">{course.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg text-gray-900">${course.price.toFixed(2)}</span>
                    <Link 
                      href={`/courses/${course._id}`}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors duration-200 text-sm font-medium"
                    >
                      View Course
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}