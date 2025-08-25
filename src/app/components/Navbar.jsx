"use client"

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { Search, ChevronDown, ShoppingCart, Bell, Menu, X, UserCircle } from 'lucide-react';

export default function Navbar() {
  const { currentUser, logout, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const profileButtonRef = useRef(null);
  const categoryMenuRef = useRef(null);
  const categoryButtonRef = useRef(null);

  const categories = [
    { value: "Web Development", label: "Web Development" },
    { value: "Mobile Development", label: "Mobile Development" },
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
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current && 
        !profileMenuRef.current.contains(event.target) &&
        profileButtonRef.current && 
        !profileButtonRef.current.contains(event.target)
      ) {
        setShowProfileMenu(false);
      }
      
      if (
        categoryMenuRef.current && 
        !categoryMenuRef.current.contains(event.target) &&
        categoryButtonRef.current && 
        !categoryButtonRef.current.contains(event.target)
      ) {
        setShowCategoryMenu(false);
      }
    };

    setShowMobileMenu(false);

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [pathname, profileMenuRef, profileButtonRef, categoryMenuRef, categoryButtonRef]);

  if (pathname.startsWith('/instructor/dashboard')) {
    return null;
  }

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <div className="flex items-center lg:hidden mr-4">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                aria-expanded="false"
              >
                <span className="sr-only">{showMobileMenu ? 'Close menu' : 'Open menu'}</span>
                {showMobileMenu ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
            
            <Link href="/" className="flex-shrink-0 flex items-center">
              <div className="relative h-12 w-40 sm:w-48">
                <Image 
                  src="/logo-2.png" 
                  alt="Edvora" 
                  fill
                  priority
                  style={{ objectFit: 'contain' }}
                  className="transition-opacity duration-300 hover:opacity-90"
                />
              </div>
            </Link>

            <div className="hidden lg:ml-8 lg:flex lg:items-center lg:space-x-1">
              <div className="relative">
                <button 
                  ref={categoryButtonRef}
                  onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                  className="flex items-center px-4 py-2 rounded-md text-gray-800 hover:text-blue-600 hover:bg-blue-50 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                >
                  <span>Explore</span>
                  <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${showCategoryMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showCategoryMenu && (
                  <div 
                    ref={categoryMenuRef}
                    className="absolute left-0 top-full mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50 max-h-[70vh] overflow-y-auto"
                    style={{ 
                      animation: 'fadeIn 0.2s ease-out forwards',
                      transformOrigin: 'top left'
                    }}
                  >
                    <div className="grid grid-cols-1 gap-1">
                      {categories.map((category) => (
                        <Link 
                          key={category.value}
                          href={`/courses/${category.value.toLowerCase().replace(/\s+/g, '-')}`} 
                          className="px-4 py-2 text-gray-800 hover:bg-blue-50 hover:text-blue-700 flex items-center transition-colors duration-150"
                        >
                          {category.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <Link 
                href="/courses" 
                className="px-4 py-2 rounded-md text-gray-800 hover:text-blue-600 hover:bg-blue-50 font-medium transition-all duration-200"
              >
                All Courses
              </Link>
              
              <Link 
                href="/pricing" 
                className="px-4 py-2 rounded-md text-gray-800 hover:text-blue-600 hover:bg-blue-50 font-medium transition-all duration-200"
              >
                Plans & Pricing
              </Link>
              
              <Link 
                href="/teach" 
                className="px-4 py-2 rounded-md text-gray-800 hover:text-blue-600 hover:bg-blue-50 font-medium transition-all duration-200"
              >
                Teach on Edvora
              </Link>
            </div>
          </div>
          
          <div className="hidden md:flex items-center justify-center flex-1 max-w-lg mx-4">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-full leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                  placeholder="Search for courses, topics, or skills"
                  type="search"
                />
              </div>
            </form>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button className="p-2 rounded-full text-gray-700 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 relative">
              <ShoppingCart className="h-6 w-6" />
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-blue-600 rounded-full">
                0
              </span>
            </button>
            
            {!loading && (
              <>
                {currentUser ? (
                  <div className="flex items-center">
                    <button className="p-2 rounded-full text-gray-700 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 relative">
                      <Bell className="h-6 w-6" />
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                        2
                      </span>
                    </button>
                    
                    <div className="relative ml-2">
                      <button
                        ref={profileButtonRef}
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center space-x-2 px-2 py-1.5 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                        aria-expanded={showProfileMenu ? 'true' : 'false'}
                      >
                        <div className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 flex items-center justify-center text-white font-semibold shadow-md">
                          {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <ChevronDown className={`hidden sm:block h-4 w-4 text-gray-600 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {showProfileMenu && (
                        <div 
                          ref={profileMenuRef}
                          className="absolute right-0 mt-2 w-64 rounded-lg shadow-xl bg-white border border-gray-100 py-1 z-50"
                          style={{ 
                            animation: 'fadeIn 0.2s ease-out forwards',
                            transformOrigin: 'top right'
                          }}
                        >
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {currentUser.name || 'User'}
                            </p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {currentUser.email}
                            </p>
                          </div>
                          
                          {currentUser.role === 'instructor' && (
                            <Link 
                              href="/instructor/dashboard" 
                              className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                            >
                              <span className="mr-2 h-5 w-5 text-gray-500 flex-shrink-0">📊</span>
                              Instructor Dashboard
                            </Link>
                          )}
                          
                          {currentUser.role === 'user' && (
                            <>
                              <Link 
                                href="/user/dashboard" 
                                className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                              >
                                <span className="mr-2 h-5 w-5 text-gray-500 flex-shrink-0">📊</span>
                                My Dashboard
                              </Link>
                              <Link 
                                href="/user/enrolled-courses" 
                                className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                              >
                                <span className="mr-2 h-5 w-5 text-gray-500 flex-shrink-0">🎓</span>
                                My Courses
                              </Link>
                            </>
                          )}
                          
                          <Link 
                            href="/user/profile" 
                            className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <span className="mr-2 h-5 w-5 text-gray-500 flex-shrink-0">⚙️</span>
                            Profile Settings
                          </Link>
                          
                          <div className="border-t border-gray-100 mt-1">
                            <button
                              onClick={logout}
                              className="flex items-center w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                            >
                              <span className="mr-2 h-5 w-5 text-red-500 flex-shrink-0">🚪</span>
                              Sign Out
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 ml-2">
                    <Link 
                      href="/auth?tab=login" 
                      className="hidden sm:inline-block text-gray-800 hover:text-blue-600 px-4 py-2 font-medium rounded-md border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                    >
                      Log In
                    </Link>
                    <Link 
                      href="/auth?tab=signup" 
                      className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 font-medium rounded-md shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="sm:hidden px-4 pb-4">
        <form onSubmit={handleSearch} className="w-full">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search courses"
              type="search"
            />
          </div>
        </form>
      </div>

      {showMobileMenu && (
        <div className="lg:hidden bg-white shadow-xl border-t border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <div className="px-3 py-2 font-medium text-gray-600">
              Browse Categories
            </div>
            <div className="pl-3 space-y-1">
              {categories.slice(0, 6).map((category) => (
                <Link
                  key={category.value}
                  href={`/courses/${category.value.toLowerCase().replace(/\s+/g, '-')}`}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50"
                >
                  {category.label}
                </Link>
              ))}
              <Link
                href="/categories"
                className="block px-3 py-2 rounded-md text-base font-medium text-blue-600"
              >
                View All Categories →
              </Link>
            </div>
            
            <hr className="my-2 border-gray-100" />
            
            <Link
              href="/courses"
              className="block px-3 py-2.5 rounded-md text-base font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50"
            >
              All Courses
            </Link>
            <Link
              href="/pricing"
              className="block px-3 py-2.5 rounded-md text-base font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50"
            >
              Plans & Pricing
            </Link>
            <Link
              href="/teach"
              className="block px-3 py-2.5 rounded-md text-base font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50"
            >
              Teach on Edvora
            </Link>
            
            {!currentUser && (
              <>
                <hr className="my-2 border-gray-100" />
                <Link
                  href="/auth?tab=login"
                  className="block px-3 py-2.5 rounded-md text-base font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50"
                >
                  Log In
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </nav>
  );
}