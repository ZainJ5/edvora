"use client"

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import LectureForm from '@/app/components/LectureForm';

export default function CourseContent() {
  const { currentUser, loading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId;
  
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [showLectureForm, setShowLectureForm] = useState(false);
  const [editingLecture, setEditingLecture] = useState(null);
  const [editingLectureIndex, setEditingLectureIndex] = useState(null);
  
  useEffect(() => {
    const fetchCourse = async () => {
      if (!currentUser || !courseId) return;
      
      try {
        const response = await fetch(`/api/instructor/courses/${courseId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCourse(data.course);
        } else if (response.status === 404) {
          router.push('/instructor/courses');
        } else {
          throw new Error('Failed to fetch course details');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching course details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser && currentUser.role === 'instructor') {
      fetchCourse();
    } else if (!loading && (!currentUser || currentUser.role !== 'instructor')) {
      router.push('/auth');
    }
  }, [currentUser, loading, courseId, router]);

  const handleAddLecture = async (lectureData) => {
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/lectures`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: lectureData, 
      });

      if (response.ok) {
        const data = await response.json();
        setCourse({
          ...course,
          lectures: [...(course.lectures || []), data.lecture]
        });
        setShowLectureForm(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add lecture');
      }
    } catch (err) {
      console.error('Error adding lecture:', err);
      throw err;
    }
  };

  const handleUpdateLecture = async (lectureData) => {
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/lectures/${editingLectureIndex}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: lectureData, 
      });

      if (response.ok) {
        const data = await response.json();
        const updatedLectures = [...course.lectures];
        updatedLectures[editingLectureIndex] = data.lecture;
        
        setCourse({
          ...course,
          lectures: updatedLectures
        });
        
        setEditingLecture(null);
        setEditingLectureIndex(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update lecture');
      }
    } catch (err) {
      console.error('Error updating lecture:', err);
      throw err;
    }
  };

  const handleDeleteLecture = async (index) => {
    if (!window.confirm('Are you sure you want to delete this lecture? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/lectures/${index}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const updatedLectures = [...course.lectures];
        updatedLectures.splice(index, 1);
        
        setCourse({
          ...course,
          lectures: updatedLectures
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete lecture');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error deleting lecture:', err);
    }
  };

  const handleMoveLecture = async (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/lectures/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          fromIndex,
          toIndex
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCourse({
          ...course,
          lectures: data.lectures
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to reorder lectures');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error reordering lectures:', err);
    }
  };

  const handleEditLecture = (lecture, index) => {
    setEditingLecture(lecture);
    setEditingLectureIndex(index);
  };

  const togglePublishStatus = async () => {
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/publish`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          isPublished: !course.isPublished
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCourse({
          ...course,
          isPublished: data.isPublished
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update publishing status');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error updating publishing status:', err);
    }
  };

  if (loading || isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!course) {
    return <div className="container mx-auto px-4 py-8">Course not found</div>;
  }

  return (
    <div className="container mx-auto px-4 text-black py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="text-gray-600 mt-1">
            {course.isPublished ? (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Published</span>
            ) : (
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Draft</span>
            )}
          </p>
        </div>
        <div className="mt-4 md:mt-0 space-x-2">
          <button
            onClick={togglePublishStatus}
            className={`py-2 px-4 rounded font-medium ${
              course.isPublished 
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {course.isPublished ? 'Unpublish Course' : 'Publish Course'}
          </button>
          <button
            onClick={() => router.push('/instructor/courses')}
            className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded font-medium"
          >
            Back to Courses
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Course Content</h2>
          <button
            onClick={() => setShowLectureForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded font-medium"
          >
            Add Lecture
          </button>
        </div>
        
        {(!course.lectures || course.lectures.length === 0) ? (
          <div className="text-center py-6">
            <p className="text-gray-500 mb-4">This course has no lectures yet.</p>
            <button
              onClick={() => setShowLectureForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded font-medium"
            >
              Add Your First Lecture
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {course.lectures.map((lecture, index) => (
              <div key={index} className="py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg">{index + 1}. {lecture.title}</h3>
                    {lecture.duration && (
                      <p className="text-sm text-gray-500">Duration: {lecture.duration} minutes</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditLecture(lecture, index)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteLecture(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {lecture.resources && lecture.resources.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-600">Resources ({lecture.resources.length}):</p>
                    <ul className="text-sm text-gray-500 ml-4 list-disc">
                      {lecture.resources.map((resource, resIndex) => (
                        <li key={resIndex}>{resource.title}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Course Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="font-medium">Category</p>
            <p className="text-gray-600">{course.category || 'Not specified'}</p>
          </div>
          <div>
            <p className="font-medium">Level</p>
            <p className="text-gray-600">{course.level}</p>
          </div>
          <div>
            <p className="font-medium">Price</p>
            <p className="text-gray-600">${course.price.toFixed(2)}</p>
          </div>
          <div>
            <p className="font-medium">Tags</p>
            <div className="flex flex-wrap gap-1">
              {course.tags && course.tags.length > 0 ? (
                course.tags.map((tag, index) => (
                  <span key={index} className="bg-gray-200 px-2 py-1 text-xs rounded-full text-gray-700">
                    {tag}
                  </span>
                ))
              ) : (
                <p className="text-gray-600">No tags</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <p className="font-medium">Description</p>
          <p className="text-gray-600">{course.description || 'No description provided.'}</p>
        </div>
      </div>
      
      {showLectureForm && (
        <LectureForm 
          onSubmit={handleAddLecture} 
          onCancel={() => setShowLectureForm(false)}
        />
      )}
      
      {editingLecture && (
        <LectureForm 
          initialData={editingLecture}
          onSubmit={handleUpdateLecture} 
          onCancel={() => {
            setEditingLecture(null);
            setEditingLectureIndex(null);
          }}
        />
      )}
    </div>
  );
}
