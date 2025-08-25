"use client"

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import LoginForm from '../components/LoginForm';
import SignupForm from '../components/SignupForm';
import { Toaster } from 'react-hot-toast';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

const AuthPage = () => {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'login';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [mounted, setMounted] = useState(false);
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    
    if (currentUser && !loading) {
      redirectUser(currentUser.role);
    }
  }, [currentUser, loading]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && (tab === 'login' || tab === 'signup')) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const redirectUser = (role) => {
    if (role === 'instructor') {
      router.push('/instructor/dashboard');
    } else if (role === 'admin') {
      router.push('/admin');
    } else if(role === 'user'){
      router.push('/');
    }
  };

  const leftImage = activeTab === 'login' ? '/login-img.jpg' : '/signup-img.jpg';

  return (
    <div className={`bg-white flex ${inter.className}`}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '6px',
            padding: '10px 14px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: '#4CAF50',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: '#E53935',
              secondary: 'white',
            },
          },
        }}
      />
      
      <div className="hidden md:flex md:w-[50%]  bg-white relative items-center justify-center">
        <div className="relative w-full h-full  flex items-center justify-center">
          <div className="relative w-[100%] aspect-[16/9]">
            <Image 
              src={leftImage}
              alt="Authentication" 
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 40vw"
            />
          </div>
        </div>
        <div className="absolute bottom-3 left-0 right-0 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Edvora. All rights reserved.
        </div>
      </div>
      
      <div className="w-full md:w-[40%] m-auto flex items-center justify-center px-2 py-8 md:px-4 bg-white">
        <div className="w-full">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2" style={{ fontWeight: 800 }}>
              {activeTab === 'login' ? 'Welcome back' : 'Get started'}
            </h2>
            <p className="text-slate-600 text-sm font-medium">
              {activeTab === 'login' 
                ? 'Sign in to continue your learning journey' 
                : 'Create an account to access premium courses'}
            </p>
          </div>
          
          <div className="flex border-b border-slate-200 mb-8">
            <TabButton 
              active={activeTab === 'login'} 
              onClick={() => {
                setActiveTab('login');
                router.push('/auth?tab=login', { scroll: false });
              }}
              label="Sign In"
            />
            <TabButton 
              active={activeTab === 'signup'} 
              onClick={() => {
                setActiveTab('signup');
                router.push('/auth?tab=signup', { scroll: false });
              }}
              label="Sign Up"
            />
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'login' ? (
                <LoginForm />
              ) : (
                <SignupForm onSwitch={() => setActiveTab('login')} />
              )}
            </motion.div>
          </AnimatePresence>
          
          <div className="mt-8 text-center">
            <p className="text-slate-600 text-sm">
              {activeTab === 'login' ? "New to Edvora? " : "Already have an account? "}
              <button
                onClick={() => {
                  const newTab = activeTab === 'login' ? 'signup' : 'login';
                  setActiveTab(newTab);
                  router.push(`/auth?tab=${newTab}`, { scroll: false });
                }}
                className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                {activeTab === 'login' ? 'Create an account' : 'Sign in'}
              </button>
            </p>
          </div>
          
          <div className="mt-8 text-center text-xs text-slate-500 md:hidden">
            © {new Date().getFullYear()} Edvora. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`flex-1 py-3 font-semibold text-sm transition-all duration-300 border-b-2 ${
      active
        ? 'border-indigo-600 text-indigo-600'
        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
    }`}
  >
    {label}
  </button>
);

export default AuthPage;