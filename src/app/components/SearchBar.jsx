"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function SearchBar({ variant = 'desktop' }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const router = useRouter();
  const isMobile = variant === 'mobile';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        fetchSearchResults();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const fetchSearchResults = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.results);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/courses?search=${encodeURIComponent(searchTerm)}`);
      setSearchTerm('');
      setShowResults(false);
    }
  };

  const handleResultClick = (courseId) => {
    router.push(`/courses/${courseId}`);
    setSearchTerm('');
    setShowResults(false);
  };

  const placeholder = isMobile ? 'Search courses' : 'Search for courses, topics, or skills';

  const inputClassName = isMobile 
    ? 'block w-full pl-10 pr-3 py-2.5 border text-black border-gray-300 rounded-full leading-5 bg-gray-50 focus:border-[#0A4D7C]/30 transition-all duration-200'
    : 'block w-full pl-10 pr-4 py-2.5 border text-black border-gray-300 rounded-full leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:placeholder-gray-500 focus:border-[#0A4D7C]/30 transition-all duration-200 text-sm font-medium';

  const iconClassName = isMobile 
    ? `h-5 w-5 transition-colors duration-300 text-black`
    : `h-5 w-5 transition-colors duration-300 ${searchFocused ? 'text-[#0A4D7C]' : 'text-gray-500'}`;

  return (
    <div className="relative w-full" ref={searchRef}>
      <form onSubmit={handleSearch} className="w-full">
        <div className={`relative rounded-full transition-all duration-300 ${searchFocused ? 'shadow-md ring-2 ring-[#0A4D7C]/30' : 'shadow-sm'}`}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className={iconClassName} />
          </div>
          <input
            className={inputClassName}
            placeholder={placeholder}
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => {
              setSearchFocused(true);
              if (searchResults.length > 0) setShowResults(true);
            }}
            onBlur={() => setSearchFocused(false)}
          />
        </div>
      </form>

      {showResults && searchResults.length > 0 && (
        <div className="absolute z-20 mt-2 w-full rounded-lg bg-white shadow-lg border border-gray-200 max-h-96 overflow-auto transition-all duration-200 ease-in-out">
          <ul className="divide-y divide-gray-100">
            {searchResults.map((course) => (
              <li 
                key={course._id}
                className="cursor-pointer hover:bg-blue-50 transition-colors duration-150"
                onClick={() => handleResultClick(course._id)}
              >
                <div className="flex items-center p-4">
                  <div className="w-16 h-12 mr-4 relative flex-shrink-0 overflow-hidden rounded-md border border-gray-100 shadow-sm">
                    <Image 
                      src={course.thumbnail || '/images/placeholder-course.jpg'}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 mb-1">{course.title}</p>
                    <div className="flex items-center">
                      {course.level && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                          {course.level}
                        </span>
                      )}
                      {course.category && (
                        <span className="text-xs font-medium text-gray-600">
                          {course.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
            <li className="p-3 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
              <Link 
                href={`/courses?search=${encodeURIComponent(searchTerm)}`} 
                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                See all results
              </Link>
            </li>
          </ul>
        </div>
      )}

      {isLoading && searchTerm.trim().length >= 2 && (
        <div className="absolute z-20 mt-2 w-full rounded-lg bg-white shadow-lg border border-gray-200 p-5 text-center">
          <div className="flex justify-center items-center space-x-2">
            <div className="h-2.5 w-2.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="h-2.5 w-2.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="h-2.5 w-2.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      )}

      {showResults && searchTerm.trim().length >= 2 && searchResults.length === 0 && !isLoading && (
        <div className="absolute z-20 mt-2 w-full rounded-lg bg-white shadow-lg border border-gray-200 p-5 text-center">
          <p className="text-sm text-gray-600">No courses found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
}