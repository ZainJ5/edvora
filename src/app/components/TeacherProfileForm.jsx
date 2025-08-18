"use client"

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const TeacherProfileForm = ({ onComplete, onCancel }) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    bio: '',
    expertise: [''],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleExpertiseChange = (index, value) => {
    const updatedExpertise = [...formData.expertise];
    updatedExpertise[index] = value;
    setFormData((prev) => ({
      ...prev,
      expertise: updatedExpertise,
    }));
  };

  const addExpertiseField = () => {
    setFormData((prev) => ({
      ...prev,
      expertise: [...prev.expertise, ''],
    }));
  };

  const removeExpertiseField = (index) => {
    if (formData.expertise.length > 1) {
      const updatedExpertise = [...formData.expertise];
      updatedExpertise.splice(index, 1);
      setFormData((prev) => ({
        ...prev,
        expertise: updatedExpertise,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Filter out empty expertise values
    const filteredExpertise = formData.expertise.filter(item => item.trim() !== '');
    
    if (filteredExpertise.length === 0) {
      setError('Please provide at least one area of expertise');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/teacher/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          bio: formData.bio,
          expertise: filteredExpertise,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete profile');
      }

      if (onComplete) onComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-black mb-6">Complete Your Teacher Profile</h2>
        <p className="text-gray-600 mb-6">
          Before you can start creating courses, please complete your teacher profile.
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="bio" className="block text-black font-medium mb-2">
              Bio (Tell us about yourself)
            </label>
            <textarea
              id="bio"
              name="bio"
              rows="4"
              required
              value={formData.bio}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Share your background, teaching experience, and expertise..."
            ></textarea>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Areas of Expertise
            </label>
            {formData.expertise.map((item, index) => (
              <div key={index} className="flex mb-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleExpertiseChange(index, e.target.value)}
                  className="flex-grow px-3 py-2 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Web Development, Data Science, etc."
                  required
                />
                <button
                  type="button"
                  onClick={() => removeExpertiseField(index)}
                  disabled={formData.expertise.length <= 1}
                  className={`ml-2 px-3 py-2 rounded-md ${
                    formData.expertise.length <= 1
                      ? 'bg-gray-300 text-gray-50 cursor-not-allowed'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addExpertiseField}
              className="mt-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              + Add Another Expertise
            </button>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 bg-blue-600 text-white rounded-md ${
                loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
              }`}
            >
              {loading ? 'Saving...' : 'Complete Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherProfileForm;
