"use client"

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const SignupForm = ({ onSwitch }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user', 
  });
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  const { register, loading } = useAuth();

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (!passwordRegex.test(formData.password)) {
      errors.password = 'Password must be at least 8 characters with at least one uppercase letter, one lowercase letter, and one number';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (!termsAccepted) {
      errors.terms = 'You must accept the terms and conditions';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: null });
    }
  };

  const handleRoleChange = (role) => {
    setFormData({ ...formData, role });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    const userData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role
    };
    
    const { success, error } = await register(userData);
    
    if (success) {
      toast.success('Account created successfully!');
      setRegistrationSuccess(true);
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'user',
      });
      setTermsAccepted(false);
      
      setTimeout(() => {
        setRegistrationSuccess(false);
        onSwitch();
      }, 3000);
    } else {
      toast.error(error || 'Registration failed. Please try again.');
    }
  };

  const passwordStrength = () => {
    if (!formData.password) return 0;
    
    let score = 0;
    
    if (formData.password.length >= 8) score += 1;
    if (/[A-Z]/.test(formData.password)) score += 1;
    if (/[a-z]/.test(formData.password)) score += 1;
    if (/[0-9]/.test(formData.password)) score += 1;
    if (/[^A-Za-z0-9]/.test(formData.password)) score += 1;
    
    return score;
  };

  const getPasswordStrengthText = () => {
    const strength = passwordStrength();
    if (strength === 0) return '';
    if (strength <= 2) return 'Weak';
    if (strength <= 4) return 'Moderate';
    return 'Strong';
  };

  const getPasswordStrengthColor = () => {
    const strength = passwordStrength();
    if (strength <= 2) return 'bg-red-500';
    if (strength <= 4) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  if (registrationSuccess) {
    return (
      <div className="rounded-md bg-emerald-50 p-4 text-center">
        <div className="flex justify-center">
          <CheckCircle className="h-6 w-6 text-emerald-500" />
        </div>
        <div className="mt-2">
          <h3 className="text-sm font-medium text-emerald-800">Registration successful!</h3>
          <p className="mt-1.5 text-sm text-emerald-700">
            Your account has been created. Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
          Full name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          autoComplete="name"
          className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 text-sm transition-all duration-200"
          value={formData.name}
          onChange={handleChange}
          placeholder="John Doe"
        />
        {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
      </div>
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
          Email address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          autoComplete="email"
          className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 text-sm transition-all duration-200"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@example.com"
        />
        {formErrors.email && <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          I want to:
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div 
            onClick={() => handleRoleChange('user')}
            className={`flex flex-col items-center p-2 border rounded-lg cursor-pointer transition-all duration-200 shadow-sm ${
              formData.role === 'user' 
                ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500' 
                : 'border-slate-200 hover:border-indigo-400 hover:shadow-md'
            }`}
          >
            <div className="font-semibold text-center text-black text-sm">Learn</div>
            <div className="text-xs text-slate-500 mt-0.5">Take courses</div>
          </div>
          
          <div 
            onClick={() => handleRoleChange('instructor')}
            className={`flex flex-col items-center p-2 border rounded-lg cursor-pointer transition-all duration-200 shadow-sm ${
              formData.role === 'instructor' 
                ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500' 
                : 'border-slate-200 hover:border-indigo-400 hover:shadow-md'
            }`}
          >
            <div className="font-semibold text-center text-black text-sm">Teach</div>
            <div className="text-xs text-slate-500 mt-0.5">Create courses</div>
          </div>
        </div>
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            autoComplete="new-password"
            className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 text-sm transition-all duration-200"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            tabIndex="-1"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-slate-400" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4 text-slate-400" aria-hidden="true" />
            )}
          </button>
        </div>
        
        {formData.password && (
          <div className="mt-1">
            <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`} 
                style={{ width: `${(passwordStrength() / 5) * 100}%` }}
              />
            </div>
            <p className="mt-0.5 text-xs text-slate-600 flex justify-between">
              <span>Password strength: <span className="font-medium">{getPasswordStrengthText()}</span></span>
              <span>{passwordStrength()} / 5</span>
            </p>
          </div>
        )}
        
        {formErrors.password && <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>}
      </div>
      
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
          Confirm password
        </label>
        <input
          type={showPassword ? "text" : "password"}
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 text-sm transition-all duration-200"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="••••••••"
        />
        {formErrors.confirmPassword && <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>}
      </div>
      
      <div className="flex items-start mt-2">
        <div className="flex items-center h-5">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-slate-300 rounded"
            checked={termsAccepted}
            onChange={() => {
              setTermsAccepted(!termsAccepted);
              if (formErrors.terms) {
                setFormErrors({ ...formErrors, terms: null });
              }
            }}
          />
        </div>
        <div className="ml-2 text-sm">
          <label htmlFor="terms" className="text-slate-700">
            I agree to the <a href="#terms" className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors">Terms of Service</a> and <a href="#privacy" className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors">Privacy Policy</a>
          </label>
          {formErrors.terms && <p className="mt-1 text-sm text-red-600">{formErrors.terms}</p>}
        </div>
      </div>
      
      <div className="pt-1">
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-all duration-200"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Account...
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </div>
    </form>
  );
};

export default SignupForm;