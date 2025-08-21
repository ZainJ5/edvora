"use client"

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { currentUser, logout, loading } = useAuth();
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-xl font-bold text-blue-600">
              Edvora
            </Link>
            <Link 
              href="/courses" 
              className={`${pathname.startsWith('/courses') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            >
              Courses
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {!loading && (
              <>
                {currentUser ? (
                  <>
                    {currentUser.role === 'instructor' && (
                      <Link 
                        href="/instructor/dashboard" 
                        className={`${pathname.startsWith('/instructor') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                      >
                        Instructor Dashboard
                      </Link>
                    )}
                    {currentUser.role === 'user' && (
                      <Link 
                        href="/user/dashboard" 
                        className={`${pathname.startsWith('/user') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                      >
                        My Dashboard
                      </Link>
                    )}
                    <button 
                      onClick={logout}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link 
                    href="/auth" 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  >
                    Login / Register
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
