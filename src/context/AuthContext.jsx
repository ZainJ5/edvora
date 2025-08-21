"use client"

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));
            
            if (payload.exp * 1000 > Date.now()) {
              setCurrentUser({
                userId: payload.userId,
                name: payload.name,
                email: payload.email,
                role: payload.role
              });
               
              if (window.location.pathname === '/auth') {
                if (payload.role === 'instructor') {
                  router.push('/instructor/dashboard');
                } else if (payload.role === 'admin') {
                  router.push('/admin');
                } else if(payload.role === 'user') {
                  router.push('/user/dashboard');
                }
              }
            } else {
              localStorage.removeItem('token');
            }
          } catch (err) {
            console.error('Failed to parse token:', err);
            localStorage.removeItem('token');
          }
        }
      } catch (err) {
        console.error('Auth check error:', err);
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();
  }, [router]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      
      const base64Url = data.token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      
      const userInfo = {
        userId: payload.userId,
        role: payload.role
      };
      
      setCurrentUser(userInfo);
      
      if (userInfo.role === 'instructor') {
        router.push('/instructor/dashboard');
      } else if (userInfo.role === 'admin') {
        router.push('/admin');
      } else if(userInfo.role === 'user') {
        router.push('/user/dashboard');
      }

      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      return { success: true, user: data.user };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    router.push('/auth');
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};