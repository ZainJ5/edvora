"use client"

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, File, FilePlus, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LectureForm({ onSubmit, onCancel, initialData = null }) {
  const [lectureData, setLectureData] = useState(initialData || {
    title: '',
    videoUrl: '',
    thumbnail: '',
    resources: []
  });
  
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [resourceData, setResourceData] = useState({
    title: '',
    fileType: 'pdf'
  });
  const [resourceFile, setResourceFile] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLectureData({
      ...lectureData,
      [name]: value
    });
  };

  const handleVideoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleThumbnailChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setThumbnailFile(e.target.files[0]);
      
      const previewUrl = URL.createObjectURL(e.target.files[0]);
      setLectureData({
        ...lectureData,
        thumbnailPreview: previewUrl
      });
    }
  };

  const handleResourceChange = (e) => {
    const { name, value } = e.target;
    setResourceData({
      ...resourceData,
      [name]: value
    });
  };

  const handleResourceFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setResourceFile(e.target.files[0]);
      
      const fileName = e.target.files[0].name;
      const fileExtension = fileName.split('.').pop().toLowerCase();
      
      let fileType = 'pdf';
      if (['doc', 'docx'].includes(fileExtension)) {
        fileType = 'doc';
      } else if (['ppt', 'pptx'].includes(fileExtension)) {
        fileType = 'ppt';
      } else if (['zip', 'rar'].includes(fileExtension)) {
        fileType = 'zip';
      }
      
      setResourceData({
        ...resourceData,
        fileType
      });
    }
  };

  const addResource = (e) => {
    e.preventDefault();
    if (!resourceData.title || !resourceFile) {
      setError('Resource title and file are required');
      toast.error('Resource title and file are required');
      return;
    }
    
    setLectureData({
      ...lectureData,
      resources: [...lectureData.resources, { 
        ...resourceData, 
        file: resourceFile,
        fileName: resourceFile.name
      }]
    });
    
    setResourceData({
      title: '',
      fileType: 'pdf'
    });
    setResourceFile(null);
    
    const fileInput = document.getElementById('resourceFile');
    if (fileInput) fileInput.value = '';
    
    setError('');
    toast.success('Resource added successfully');
  };

  const removeResource = (index) => {
    const updatedResources = [...lectureData.resources];
    updatedResources.splice(index, 1);
    setLectureData({
      ...lectureData,
      resources: updatedResources
    });
    toast.success('Resource removed');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lectureData.title) {
      setError('Lecture title is required');
      toast.error('Lecture title is required');
      return;
    }
    
    if (!videoFile && !lectureData.videoUrl) {
      setError('Video file is required');
      toast.error('Video file is required');
      return;
    }
    
    const formData = new FormData();
    formData.append('title', lectureData.title);
    
    if (videoFile) {
      formData.append('videoFile', videoFile);
    } else if (lectureData.videoUrl) {
      formData.append('videoUrl', lectureData.videoUrl);
    }
    
    if (thumbnailFile) {
      formData.append('thumbnailFile', thumbnailFile);
    } else if (lectureData.thumbnail) {
      formData.append('thumbnail', lectureData.thumbnail);
    }
    
    lectureData.resources.forEach((resource, index) => {
      if (resource.file) {
        formData.append('resourceFiles', resource.file);
        formData.append(`resourceTitle_${index}`, resource.title);
        formData.append(`resourceType_${index}`, resource.fileType);
      }
    });
    
    const resourcesWithoutFiles = lectureData.resources.filter(r => !r.file && r.fileUrl);
    if (resourcesWithoutFiles.length > 0) {
      formData.append('resourcesData', JSON.stringify(resourcesWithoutFiles));
    }
    
    try {
      await onSubmit(formData);
    } catch (error) {
      toast.error(error.message || 'Failed to save lecture');
    }
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 24 
      } 
    },
    exit: { 
      opacity: 0, 
      y: 20,
      transition: { 
        duration: 0.2 
      } 
    }
  };

  return (
    <motion.div 
      className="relative bg-white rounded-xl shadow-lg border border-gray-100"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={formVariants}
    >
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-xl">
        <h2 className="text-xl font-semibold text-white">
          {initialData ? 'Edit Lecture' : 'Add New Lecture'}
        </h2>
        <button 
          onClick={onCancel}
          className="text-white hover:bg-blue-800 p-2 rounded-full transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="p-6">
        <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="title">
                Lecture Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={lectureData.title}
                onChange={handleChange}
                className="block w-full px-4 py-3 border border-gray-300 text-black rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                placeholder="Enter a descriptive title for your lecture"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="videoFile">
                Lecture Video <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex justify-center px-6 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="space-y-2 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="videoFile" className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                      <span>Upload a video file</span>
                      <input 
                        id="videoFile" 
                        name="videoFile" 
                        type="file" 
                        accept="video/*"
                        className="sr-only" 
                        onChange={handleVideoChange}
                        required={!lectureData.videoUrl}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">MP4, MOV, AVI up to 1GB</p>
                </div>
              </div>
              {videoFile && (
                <motion.p 
                  className="mt-2 text-sm text-green-600 flex items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <File size={16} className="mr-1" /> Selected: {videoFile.name}
                </motion.p>
              )}
              {lectureData.videoUrl && !videoFile && (
                <p className="mt-2 text-sm text-blue-600 flex items-center">
                  <File size={16} className="mr-1" /> Current: {lectureData.videoUrl}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="thumbnailFile">
                Lecture Thumbnail
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="mt-1 flex justify-center px-6 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="space-y-2 text-center">
                    <Upload className="mx-auto h-10 w-10 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="thumbnailFile" className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                        <span>Upload a thumbnail</span>
                        <input 
                          id="thumbnailFile" 
                          name="thumbnailFile" 
                          type="file" 
                          accept="image/*"
                          className="sr-only" 
                          onChange={handleThumbnailChange}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-center">
                  {(lectureData.thumbnailPreview || lectureData.thumbnail) && (
                    <motion.div 
                      className="relative"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                      <img 
                        src={lectureData.thumbnailPreview || lectureData.thumbnail} 
                        alt="Thumbnail preview" 
                        className="max-h-40 rounded-lg shadow-md object-contain"
                      />
                      <div className="mt-2 text-center text-xs text-gray-500">
                        {thumbnailFile ? 'New thumbnail preview' : 'Current thumbnail'}
                      </div>
                    </motion.div>
                  )}
                  
                  {!lectureData.thumbnailPreview && !lectureData.thumbnail && (
                    <div className="text-center text-gray-400">
                      <p>No thumbnail selected</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Resources</h3>
              
              {lectureData.resources.length > 0 && (
                <motion.div 
                  className="mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Added Resources</h4>
                  <ul className="border border-gray-200 rounded-lg divide-y divide-gray-200 overflow-hidden">
                    {lectureData.resources.map((resource, index) => (
                      <motion.li 
                        key={index} 
                        className="px-4 py-3 flex justify-between items-center text-sm bg-white hover:bg-gray-50 transition-colors"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div>
                          <p className="font-medium text-gray-900">{resource.title}</p>
                          <p className="text-gray-500">Type: {resource.fileType.toUpperCase()}</p>
                          <p className="text-blue-500 truncate max-w-md text-xs">
                            {resource.fileName || resource.fileUrl || 'File selected for upload'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeResource(index)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-full transition-colors"
                          aria-label="Remove resource"
                        >
                          <X size={16} />
                        </button>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}
              
              <motion.div 
                className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Resource</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="resourceTitle">
                      Resource Title
                    </label>
                    <input
                      type="text"
                      id="resourceTitle"
                      name="title"
                      value={resourceData.title}
                      onChange={handleResourceChange}
                      className="block w-full px-3 py-2 border border-gray-300 text-black rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="E.g., Exercise Files, Lecture Notes"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="resourceFile">
                      Resource File
                    </label>
                    <div className="mt-1 flex justify-center px-6 py-4 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="space-y-1 text-center">
                        <FilePlus className="mx-auto h-8 w-8 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label htmlFor="resourceFile" className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                            <span>Upload a file</span>
                            <input 
                              id="resourceFile" 
                              name="resourceFile" 
                              type="file"
                              className="sr-only" 
                              onChange={handleResourceFileChange}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                    {resourceFile && (
                      <p className="mt-2 text-xs text-green-600">Selected file: {resourceFile.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="resourceType">
                      Resource Type
                    </label>
                    <select
                      id="resourceType"
                      name="fileType"
                      value={resourceData.fileType}
                      onChange={handleResourceChange}
                      className="block w-full px-3 py-2 border border-gray-300 text-black rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="pdf">PDF</option>
                      <option value="doc">Document</option>
                      <option value="ppt">Presentation</option>
                      <option value="zip">ZIP Archive</option>
                      <option value="link">External Link</option>
                    </select>
                  </div>
                  
                  <motion.button
                    type="button"
                    onClick={addResource}
                    className="inline-flex items-center justify-center w-full px-4 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors cursor-pointer shadow-sm"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <FilePlus size={16} className="mr-1.5" />
                    Add Resource
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>
          
          <div className="mt-8 flex items-center justify-end space-x-4 border-t border-gray-200 pt-6">
            <motion.button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 transition-colors cursor-pointer"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              className="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer shadow-md"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              {initialData ? 'Update Lecture' : 'Add Lecture'}
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}