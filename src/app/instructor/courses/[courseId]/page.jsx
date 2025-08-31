"use client"

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import LectureForm from '@/app/components/LectureForm';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Video, Clock, ArrowLeft, ChevronUp, ChevronDown, Tags, Layers, DollarSign, Book, Award } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import ConfirmationDialog from '@/app/instructor/courses/components/ConfirmationDialog';
import Image from 'next/image';

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
  const [activeSection, setActiveSection] = useState('content'); 
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [lectureToDelete, setLectureToDelete] = useState(null);
  
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
        toast.error(err.message || 'Failed to fetch course details');
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
        toast.success('Lecture added successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add lecture');
      }
    } catch (err) {
      console.error('Error adding lecture:', err);
      toast.error(err.message || 'Failed to add lecture');
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
        toast.success('Lecture updated successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update lecture');
      }
    } catch (err) {
      console.error('Error updating lecture:', err);
      toast.error(err.message || 'Failed to update lecture');
      throw err;
    }
  };

  const handleDeleteLecture = (index) => {
    setLectureToDelete(index);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteLecture = async () => {
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/lectures/${lectureToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const updatedLectures = [...course.lectures];
        updatedLectures.splice(lectureToDelete, 1);
        
        setCourse({
          ...course,
          lectures: updatedLectures
        });
        toast.success('Lecture deleted successfully');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete lecture');
        toast.error(errorData.error || 'Failed to delete lecture');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Error deleting lecture');
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
        toast.success('Lecture order updated');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to reorder lectures');
        toast.error(errorData.error || 'Failed to reorder lectures');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Error reordering lectures');
      console.error('Error reordering lectures:', err);
    }
  };

  const handleEditLecture = (lecture, index) => {
    setEditingLecture(lecture);
    setEditingLectureIndex(index);
    setShowLectureForm(true);
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
        toast.success(data.isPublished ? 'Course published successfully' : 'Course unpublished successfully');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update publishing status');
        toast.error(errorData.error || 'Failed to update publishing status');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Error updating publishing status');
      console.error('Error updating publishing status:', err);
    }
  };

  const closeForm = () => {
    setShowLectureForm(false);
    setEditingLecture(null);
    setEditingLectureIndex(null);
  };

  if (loading || isLoading) {
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
            <p className="mt-4 text-[#2c3180] font-medium">Loading...</p>
          </div>
        </div>
      );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="bg-gray-50 rounded-xl p-10 shadow-sm border border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Course Not Found</h2>
          <p className="text-gray-500 mb-6">The course you're looking for doesn't exist or you don't have access to it.</p>
          <button 
            onClick={() => router.push('/instructor/courses')}
            className="inline-flex items-center px-5 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} className="mr-2" /> Back to Courses
          </button>
        </div>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDeleteLecture}
        title="Delete Lecture"
        message="Are you sure you want to delete this lecture? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{course.title}</h1>
            <div className="mt-2 flex items-center">
              {course.isPublished ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Published
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Draft
                </span>
              )}
              <span className="mx-2 text-gray-300">•</span>
              <span className="text-sm text-gray-500">
                {course.lectures?.length || 0} {course.lectures?.length === 1 ? 'lecture' : 'lectures'}
              </span>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <motion.button
              onClick={togglePublishStatus}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer shadow-sm ${
                course.isPublished 
                  ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200' 
                  : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
              }`}
            >
              {course.isPublished ? 'Unpublish Course' : 'Publish Course'}
            </motion.button>
            <motion.button
              onClick={() => router.push('/instructor/courses')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200 shadow-sm"
            >
              <ArrowLeft size={16} className="mr-1.5" /> Back to Courses
            </motion.button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left sidebar */}
          <motion.div 
            className="lg:col-span-3"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <nav className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
              <button 
                onClick={() => setActiveSection('content')}
                className={`w-full flex items-center justify-between px-4 py-3 text-left border-b border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer ${activeSection === 'content' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
              >
                <div className="flex items-center">
                  <Layers className="mr-3 h-5 w-5" />
                  <span className="font-medium">Course Content</span>
                </div>
                {activeSection === 'content' && <ChevronUp className="h-5 w-5" />}
              </button>

              <button 
                onClick={() => setActiveSection('details')}
                className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-blue-50 transition-colors cursor-pointer ${activeSection === 'details' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
              >
                <div className="flex items-center">
                  <Book className="mr-3 h-5 w-5" />
                  <span className="font-medium">Course Details</span>
                </div>
                {activeSection === 'details' && <ChevronUp className="h-5 w-5" />}
              </button>
            </nav>

            <div className="mt-6">
              <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Course Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Publication</span>
                    <span className={`text-xs font-medium ${course.isPublished ? 'text-green-600' : 'text-yellow-600'}`}>
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Lectures</span>
                    <span className="text-xs font-medium text-gray-700">{course.lectures?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main content area */}
          <div className="lg:col-span-9">
            {/* Course Content Tab */}
            <AnimatePresence mode="wait">
              {activeSection === 'content' && (
                <motion.div 
                  key="content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100"
                >
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-gray-900">Course Content</h2>
                      {!showLectureForm && (
                        <motion.button
                          onClick={() => setShowLectureForm(true)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer shadow-sm"
                        >
                          <Plus size={16} className="mr-1.5" /> Add Lecture
                        </motion.button>
                      )}
                    </div>
                    
                    {(!course.lectures || course.lectures.length === 0) && !showLectureForm ? (
                      <motion.div 
                        className="mt-6 flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Video className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No lectures yet</h3>
                        <p className="text-gray-500 text-sm mb-4 max-w-md text-center">
                          Add your first lecture to start building your course content. Students will be able to access these lectures when they enroll.
                        </p>
                        <motion.button
                          onClick={() => setShowLectureForm(true)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="inline-flex items-center px-5 py-2.5 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer shadow-sm"
                        >
                          <Plus size={18} className="mr-2" /> Add Your First Lecture
                        </motion.button>
                      </motion.div>
                    ) : (
                      <AnimatePresence>
                        {!showLectureForm && course.lectures && course.lectures.length > 0 && (
                          <motion.div 
                            className="mt-6 bg-white rounded-lg border border-gray-200 divide-y divide-gray-200 overflow-hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                          >
                            {course.lectures.map((lecture, index) => (
                              <motion.div 
                                key={index} 
                                className="group hover:bg-blue-50 transition-colors"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                              >
                                <div className="flex justify-between items-center p-4">
                                  <div className="flex items-start">
                                    <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 text-blue-600 font-medium text-sm mr-4">
                                      {index + 1}
                                    </div>
                                    <div>
                                      <h3 className="text-base font-medium text-gray-900">{lecture.title}</h3>
                                      <div className="mt-1 flex items-center">
                                        <Video size={14} className="text-gray-400 mr-1" />
                                        <span className="text-xs text-gray-500">
                                          {lecture.duration ? `${lecture.duration} min` : 'Video lecture'}
                                        </span>
                                        {lecture.resources?.length > 0 && (
                                          <>
                                            <span className="mx-2 text-gray-300">•</span>
                                            <span className="text-xs text-gray-500">
                                              {lecture.resources.length} {lecture.resources.length === 1 ? 'resource' : 'resources'}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                                    {index > 0 && (
                                      <motion.button 
                                        onClick={() => handleMoveLecture(index, index - 1)}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full cursor-pointer transition-colors"
                                        aria-label="Move up"
                                      >
                                        <ChevronUp size={16} />
                                      </motion.button>
                                    )}
                                    {index < course.lectures.length - 1 && (
                                      <motion.button 
                                        onClick={() => handleMoveLecture(index, index + 1)}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full cursor-pointer transition-colors"
                                        aria-label="Move down"
                                      >
                                        <ChevronDown size={16} />
                                      </motion.button>
                                    )}
                                    <motion.button 
                                      onClick={() => handleEditLecture(lecture, index)}
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full cursor-pointer transition-colors"
                                      aria-label="Edit lecture"
                                    >
                                      <Edit size={16} />
                                    </motion.button>
                                    <motion.button 
                                      onClick={() => handleDeleteLecture(index)}
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full cursor-pointer transition-colors"
                                      aria-label="Delete lecture"
                                    >
                                      <Trash2 size={16} />
                                    </motion.button>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}

                    <AnimatePresence>
                      {showLectureForm && (
                        <motion.div 
                          className="mt-6"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        >
                          <LectureForm 
                            onSubmit={editingLecture ? handleUpdateLecture : handleAddLecture} 
                            onCancel={closeForm}
                            initialData={editingLecture}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {/* Course Details Tab */}
              {activeSection === 'details' && (
                <motion.div 
                  key="details"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100"
                >
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Course Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div>
                          <div className="flex items-center mb-2">
                            <Tags className="w-5 h-5 text-gray-500 mr-2" />
                            <h3 className="text-sm font-medium text-gray-700">Category</h3>
                          </div>
                          <p className="text-sm text-gray-600">{course.category || 'Not specified'}</p>
                        </div>
                        
                        <div>
                          <div className="flex items-center mb-2">
                            <Award className="w-5 h-5 text-gray-500 mr-2" />
                            <h3 className="text-sm font-medium text-gray-700">Level</h3>
                          </div>
                          <p className="text-sm text-gray-600">{course.level}</p>
                        </div>
                        
                        <div>
                          <div className="flex items-center mb-2">
                            <DollarSign className="w-5 h-5 text-gray-500 mr-2" />
                            <h3 className="text-sm font-medium text-gray-700">Price</h3>
                          </div>
                          <p className="text-sm text-gray-600">${course.price.toFixed(2)}</p>
                        </div>
                        
                        <div>
                          <div className="flex items-center mb-2">
                            <Clock className="w-5 h-5 text-gray-500 mr-2" />
                            <h3 className="text-sm font-medium text-gray-700">Duration</h3>
                          </div>
                          <p className="text-sm text-gray-600">
                            {course.totalDuration ? `${course.totalDuration} minutes` : 'Not specified'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <div>
                          <div className="flex items-center mb-2">
                            <Tags className="w-5 h-5 text-gray-500 mr-2" />
                            <h3 className="text-sm font-medium text-gray-700">Tags</h3>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {course.tags && course.tags.length > 0 ? (
                              course.tags.map((tag, index) => (
                                <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <p className="text-sm text-gray-600">No tags</p>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center mb-2">
                            <Book className="w-5 h-5 text-gray-500 mr-2" />
                            <h3 className="text-sm font-medium text-gray-700">Description</h3>
                          </div>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">{course.description || 'No description provided.'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-8 border-t border-gray-200 pt-6">
                      <motion.button
                        onClick={() => router.push(`/instructor/courses/edit/${courseId}`)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer border border-gray-200"
                      >
                        <Edit size={16} className="mr-1.5" /> Edit Course Details
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}