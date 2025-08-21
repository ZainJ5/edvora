'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  FaChartPie, 
  FaBook,
  FaSignOutAlt,
  FaBell,
  FaSearch,
  FaBars,
  FaTimes,
  FaAngleRight,
  FaUserCircle,
  FaCog,
  FaChevronDown
} from 'react-icons/fa';
import Dashboard from './dashboard/page';
import CoursesPage from './courses/page';

export default function AdminLayout() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeComponent, setActiveComponent] = useState('dashboard');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
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
    { icon: <FaChartPie className="h-5 w-5" />, label: 'Dashboard', id: 'dashboard' },
    { icon: <FaBook className="h-5 w-5" />, label: 'Courses', id: 'courses' }
  ];
  
  const handleMenuClick = (menuId) => {
    setActiveComponent(menuId);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };
  
  const handleLogoutClick = () => {
    setLogoutDialogOpen(true);
  };
  
  const handleLogoutConfirm = () => {
    localStorage.removeItem('token');
    setLogoutDialogOpen(false);
    router.push('/auth');
  };
  
  const handleLogoutCancel = () => {
    setLogoutDialogOpen(false);
  };
  
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const results = [
      ...menuItems
        .filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
        .map(item => ({
          type: 'menu',
          id: item.id,
          label: item.label,
          icon: item.icon
        })),
    ].filter(item => item.label.toLowerCase().includes(query.toLowerCase()));
    
    setSearchResults(results);
    setShowSearchResults(true);
  };
  
  const handleSearchResultClick = (result) => {
    if (result.type === 'menu') {
      setActiveComponent(result.id);
    }
    
    setSearchQuery('');
    setShowSearchResults(false);
  };
  
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSearchResults(false);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="relative h-24 w-24">
            <div className="absolute inset-0 rounded-full border-t-4 border-blue-600 animate-spin"></div>
            <div className="absolute inset-3 rounded-full border-2 border-gray-200"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Image src="/logo.jpg" alt="AutoHub" width={40} height={40} className="rounded-full" />
            </div>
          </div>
          <p className="mt-6 text-gray-700 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const renderComponent = () => {
    switch (activeComponent) {
      case 'dashboard':
        return <Dashboard />;
      case 'courses':
        return <CoursesPage />;
      default:
        return <Dashboard />;
    }
  };
  
  return (
    <>
      <style jsx global>{`
        /* Custom scrollbar styles */
        .sidebar-scroll::-webkit-scrollbar {
          width: 5px;
        }
        
        .sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        
        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .sidebar-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }
      `}</style>
      
      <div className="flex h-screen bg-gray-50 text-gray-800 overflow-hidden">
        <div 
          className={`bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white w-72 fixed inset-y-0 left-0 z-30 transition-all duration-300 transform flex flex-col ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:relative md:translate-x-0 shadow-xl`}
        >
          <div className="p-6 flex items-center justify-between border-b border-gray-700/50 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="bg-white rounded-lg p-1.5 shadow-lg">
                <Image src="/logo.jpg" alt="AutoHub" width={36} height={36} className="rounded" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-wide text-white">AutoHub</span>
                <p className="text-xs text-blue-300 mt-0.5">Admin Portal</p>
              </div>
            </div>
            <button
              className="md:hidden text-gray-400 hover:text-white transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 flex flex-col min-h-0">
            <nav className="flex-1 overflow-y-auto sidebar-scroll">
              <div className="px-6 pt-8 pb-3">
                <p className="text-xs uppercase tracking-widest text-gray-400 font-medium ml-2 mb-2">Main Navigation</p>
              </div>
              <ul className="space-y-2 px-3 pb-24">
                {menuItems.map((item) => (
                  <li key={item.id}>
                    <button 
                      onClick={() => handleMenuClick(item.id)}
                      className={`flex w-full items-center py-3.5 px-4 text-gray-300 hover:bg-gray-700/50 rounded-lg transition-all duration-200 group ${
                        activeComponent === item.id 
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md' 
                          : ''
                      }`}
                    >
                      <span className={`mr-3 ${
                        activeComponent === item.id 
                          ? 'text-white' 
                          : 'text-gray-400 group-hover:text-gray-200'
                      }`}>
                        {item.icon}
                      </span>
                      <span className="font-medium">{item.label}</span>
                      {activeComponent === item.id && (
                        <span className="ml-auto">
                          <FaAngleRight className="h-4 w-4" />
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          
          <div className="p-6 border-t border-gray-700/50 flex-shrink-0">
            <button 
              onClick={handleLogoutClick}
              className="flex items-center justify-center text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg font-medium cursor-pointer hover:from-red-600 hover:to-red-700 transition-all duration-200 w-full py-2.5 px-4 shadow-lg"
            >
              <FaSignOutAlt className="mr-2" /> 
              <span>Sign out</span>
            </button>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white shadow-sm z-20 border-b border-gray-200">
            <div className="px-6 py-3 flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="md:hidden mr-3 text-gray-600 hover:text-gray-900 focus:outline-none"
                >
                  <FaBars className="h-5 w-5" />
                </button>
                
                <div className="relative" onClick={e => e.stopPropagation()}>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="py-2 pl-10 pr-4 block w-full sm:w-64 md:w-80 bg-gray-100 border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  
                  {showSearchResults && searchQuery.trim() !== '' && (
                    <div className="absolute left-0 right-0 mt-2 bg-white rounded-lg shadow-lg max-h-96 overflow-y-auto border border-gray-200 z-50">
                      {searchResults.length > 0 ? (
                        <ul>
                          {searchResults.map((result, index) => (
                            <li key={`${result.type}-${result.id}-${index}`}>
                              <button
                                onClick={() => handleSearchResultClick(result)}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center border-b border-gray-100 last:border-0"
                              >
                                <span className="mr-3 text-gray-500 flex-shrink-0">{result.icon}</span>
                                <div>
                                  <p className="text-sm font-medium text-gray-800">{result.label}</p>
                                  <p className="text-xs text-gray-500 capitalize">{result.type}</p>
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-600">No results found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">              
                <div className="relative">
                  <button 
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center space-x-3 bg-gray-100 hover:bg-gray-200 transition-colors py-2 px-3 rounded-lg focus:outline-none"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold shadow-md border-2 border-white">
                      {user?.username?.charAt(0).toUpperCase() || 'Z'}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="font-medium text-sm text-gray-900">admin</p>
                      <p className="text-xs text-gray-500">{user?.role || 'Administrator'}</p>
                    </div>
                    <FaChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 border border-gray-200 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{user?.username || 'zahrajamshaid'}</p>
                        <p className="text-xs text-gray-500">{user?.email || 'admin@ahmedzai.com'}</p>
                      </div>
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                        <FaUserCircle className="mr-3 text-gray-500" /> View Profile
                      </button>
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                        <FaCog className="mr-3 text-gray-500" /> Settings
                      </button>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button 
                        onClick={handleLogoutClick}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <FaSignOutAlt className="mr-3" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-2 bg-gray-50 border-t border-gray-100 flex items-center text-sm">
              <span className="text-blue-600 font-medium">AutoHub</span>
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-gray-600 font-medium capitalize">{activeComponent}</span>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
              {renderComponent()}
            </div>
          </main>
          
          <footer className="bg-white border-t border-gray-200 px-6 py-4">
            <div className="flex justify-between items-center text-sm">
              <div className="text-gray-600 font-medium">
                © {new Date().getFullYear()} AutoHub Admin Portal. All rights reserved.
              </div>
              <div className="text-gray-500">
                Version 1.2.0
              </div>
            </div>
          </footer>
        </div>
        
        {logoutDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden transform transition-all">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Confirm Sign Out</h3>
              </div>
              <div className="px-6 py-4">
                <p className="text-gray-700">Are you sure you want to sign out of your account? Any unsaved changes may be lost.</p>
              </div>
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
                <button
                  onClick={handleLogoutCancel}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogoutConfirm}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 rounded-lg text-white font-medium hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}