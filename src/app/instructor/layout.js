'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { 
  FaChartPie, 
  FaBook,
  FaSignOutAlt,
  FaBell,
  FaBars,
  FaUserCircle,
  FaCog,
  FaChevronDown,
  FaCommentDots,
  FaChartBar,
  FaToolbox,
  FaQuestionCircle,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { Inter } from 'next/font/google';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  
  const profileRef = useRef(null);
  const notificationsRef = useRef(null);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.push('/auth');
      return;
    }
    
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
      
      const decoded = JSON.parse(jsonPayload);
      
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        router.push('/auth');
      } else {
        setUser(decoded);
        setLoading(false);
      }
    } catch (error) {
      console.error('Token error:', error);
      localStorage.removeItem('token');
      router.push('/auth');
    }
  }, [router]);
  
  const menuItems = [
    { icon: <FaChartPie />, label: 'Dashboard', href: '/instructor/dashboard' },
    { icon: <FaBook />, label: 'Courses', href: '/instructor/courses' },
    { icon: <FaToolbox />, label: 'Quiz', href: '/instructor/quiz' },
    { icon: <FaCommentDots />, label: 'Communication', href: '/instructor/communication' },
    { icon: <FaChartBar />, label: 'Performance', href: '/instructor/performance' },
    { icon: <FaQuestionCircle />, label: 'Resources', href: '/instructor/resources' }
  ];
  
  const handleLogoutClick = () => {
    setLogoutDialogOpen(true);
  };
  
  const handleLogoutConfirm = () => {
    setLogoutDialogOpen(false);
    logout(); 
  };
  
  const handleLogoutCancel = () => {
    setLogoutDialogOpen(false);
  };
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="relative h-16 w-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-t-4 border-[#2c3180] animate-spin"></div>
            <div className="absolute inset-0 flex items-center mx-auto justify-center">
              <Image
                src="/logo-1.png"
                alt="Edvora"
                width={32}
                height={32}
                className="rounded-md bg-white"
              />
            </div>
          </div>
          <p className="mt-4 text-[#2c3180] font-medium">Loading instructor dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden bg-white ${inter.className}`}>
      <div 
        className={`fixed inset-y-0 left-0 z-30 flex flex-col transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-16' : 'w-64 shadow-2xl'
        } bg-[#2c3180] text-white`}
        onMouseEnter={() => setIsSidebarCollapsed(false)}
        onMouseLeave={() => setIsSidebarCollapsed(true)}
      >
        <div className="flex items-center h-16 px-4 border-b border-[#4a4f9e]">
          {isSidebarCollapsed ? (
            <div className="flex items-center justify-center w-full">
              <div className="flex-shrink-0">
                <Image
                  src="/logo-1.png"
                  alt="Edvora"
                  width={32}
                  height={32}
                  className="rounded-md bg-white"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Image
                  src="/logo-1.png"
                  alt="Edvora"
                  width={32}
                  height={32}
                  className="rounded-md bg-white"
                />
              </div>
              <div className="font-semibold text-lg tracking-tight">Edvora</div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#4a4f9e] scrollbar-track-transparent py-2">
          <nav className="px-2 space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center w-full px-3 py-2.5 transition-colors duration-200 rounded-md ${
                    isActive
                      ? 'bg-[#4a4f9e] text-white'
                      : 'text-[#d1d3e0] hover:bg-[#4a4f9e] hover:text-white'
                  }`}
                >
                  <div className={`text-lg ${isSidebarCollapsed ? 'mx-auto' : 'mr-3'}`}>
                    {item.icon}
                  </div>
                  {!isSidebarCollapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="flex flex-col flex-1 ml-16 transition-all duration-300">
        <header className="bg-white h-16 flex items-center px-6 shadow-sm border-b border-gray-100">
          <div className="flex-1 flex items-center">
            {/* You can use pathname to display current page title */}
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative" ref={notificationsRef}>
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-gray-600 hover:text-[#2c3180] hover:bg-[#2c3180]/5 rounded-full transition-all relative"
              >
                <FaBell className="h-5 w-5" />
                <span className="absolute top-1 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-1 ring-white"></span>
              </button>
              
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl py-2 border border-gray-100 z-50 ring-1 ring-gray-100/50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-900">Notifications</h4>
                  </div>
                  <ul className="max-h-64 overflow-y-auto">
                    <li className="px-4 py-3 hover:bg-gray-50 text-sm border-b border-gray-50 transition-colors">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                          <div className="h-8 w-8 bg-[#2c3180]/10 rounded-full flex items-center justify-center">
                            <FaUserCircle className="h-4 w-4 text-[#2c3180]" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">New student enrolled</p>
                          <p className="text-xs text-gray-500 mt-1">5 minutes ago</p>
                        </div>
                      </div>
                    </li>
                    <li className="px-4 py-3 hover:bg-gray-50 text-sm border-b border-gray-50 transition-colors">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                          <div className="h-8 w-8 bg-orange-50 rounded-full flex items-center justify-center">
                            <FaBook className="h-4 w-4 text-orange-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">Assignment deadline approaching</p>
                          <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                        </div>
                      </div>
                    </li>
                  </ul>
                  <div className="px-4 py-2 border-t border-gray-100 text-center">
                    <button className="text-xs text-[#2c3180] hover:text-[#2c3180]/80 font-medium transition-colors">View all</button>
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2 hover:bg-[#2c3180]/5 transition-all py-2 px-3 rounded-full"
              >
                <div className="w-8 h-8 bg-[#2c3180] rounded-full flex items-center justify-center text-white font-medium">
                  {user?.name?.charAt(0).toUpperCase() || 'I'}
                </div>
              </button>
              
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl py-2 border border-gray-100 z-50 ring-1 ring-gray-100/50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.username || 'Instructor'}</p>
                    <p className="text-xs text-gray-500">{user?.email || 'instructor@edvora.com'}</p>
                  </div>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors">
                    <FaUserCircle className="mr-3 text-gray-500" /> Profile
                  </button>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors">
                    <FaCog className="mr-3 text-gray-500" /> Settings
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button 
                    onClick={handleLogoutClick}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                  >
                    <FaSignOutAlt className="mr-3 text-gray-500" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 px-8 py-6">
          {children} 
        </main>
      </div>
      
      {logoutDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden ring-1 ring-gray-100/50">
            <div className="px-6 py-5">
              <h3 className="text-lg font-medium text-gray-900">Sign Out</h3>
              <p className="mt-2 text-sm text-gray-600">Are you sure you want to sign out? Any unsaved changes will be lost.</p>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={handleLogoutCancel}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2c3180] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="px-4 py-2 bg-[#2c3180] rounded-md text-sm font-medium text-white hover:bg-[#2c3180]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2c3180] transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}