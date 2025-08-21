"use client"

import React, { useState } from 'react';

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
      
      // Create a preview URL for the thumbnail
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
      
      // Auto-detect file type based on file extension
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
      return;
    }
    
    // Store file object and metadata together
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
    
    // Reset file input
    const fileInput = document.getElementById('resourceFile');
    if (fileInput) fileInput.value = '';
    
    setError('');
  };

  const removeResource = (index) => {
    const updatedResources = [...lectureData.resources];
    updatedResources.splice(index, 1);
    setLectureData({
      ...lectureData,
      resources: updatedResources
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lectureData.title) {
      setError('Lecture title is required');
      return;
    }
    
    if (!videoFile && !lectureData.videoUrl) {
      setError('Video file is required');
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
    
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">{initialData ? 'Edit Lecture' : 'Add New Lecture'}</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
              Lecture Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={lectureData.title}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="videoFile">
              Lecture Video *
            </label>
            <input
              type="file"
              id="videoFile"
              accept="video/*"
              onChange={handleVideoChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required={!lectureData.videoUrl}
            />
            {videoFile && (
              <p className="mt-2 text-sm text-green-600">Selected file: {videoFile.name}</p>
            )}
            {lectureData.videoUrl && !videoFile && (
              <p className="mt-2 text-sm text-blue-600">Current video: {lectureData.videoUrl}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="thumbnailFile">
              Lecture Thumbnail
            </label>
            <input
              type="file"
              id="thumbnailFile"
              accept="image/*"
              onChange={handleThumbnailChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            {thumbnailFile && (
              <p className="mt-2 text-sm text-green-600">Selected file: {thumbnailFile.name}</p>
            )}
            {lectureData.thumbnailPreview && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-1">Preview:</p>
                <img 
                  src={lectureData.thumbnailPreview} 
                  alt="Thumbnail preview" 
                  className="h-20 object-contain border rounded"
                />
              </div>
            )}
            {lectureData.thumbnail && !thumbnailFile && (
              <div className="mt-2">
                <p className="text-sm text-blue-600">Current thumbnail</p>
                <img 
                  src={lectureData.thumbnail} 
                  alt="Current thumbnail" 
                  className="h-20 object-contain border rounded mt-1"
                />
              </div>
            )}
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Resources</h3>
            
            {lectureData.resources.length > 0 && (
              <div className="mb-4">
                <h4 className="text-md font-medium mb-2">Added Resources</h4>
                <ul className="border rounded divide-y">
                  {lectureData.resources.map((resource, index) => (
                    <li key={index} className="p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{resource.title}</p>
                        <p className="text-sm text-gray-500">Type: {resource.fileType}</p>
                        <p className="text-sm text-blue-500 truncate">
                          {resource.fileName || resource.fileUrl || 'File selected for upload'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeResource(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="border rounded p-4">
              <h4 className="text-md font-medium mb-2">Add New Resource</h4>
              
              <div className="mb-3">
                <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="resourceTitle">
                  Resource Title
                </label>
                <input
                  type="text"
                  id="resourceTitle"
                  name="title"
                  value={resourceData.title}
                  onChange={handleResourceChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              
              <div className="mb-3">
                <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="resourceFile">
                  Resource File
                </label>
                <input
                  type="file"
                  id="resourceFile"
                  onChange={handleResourceFileChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
                {resourceFile && (
                  <p className="mt-1 text-sm text-green-600">Selected file: {resourceFile.name}</p>
                )}
              </div>
              
              <div className="mb-3">
                <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="resourceType">
                  Resource Type
                </label>
                <select
                  id="resourceType"
                  name="fileType"
                  value={resourceData.fileType}
                  onChange={handleResourceChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="pdf">PDF</option>
                  <option value="doc">Document</option>
                  <option value="ppt">Presentation</option>
                  <option value="zip">ZIP Archive</option>
                  <option value="link">External Link</option>
                </select>
              </div>
              
              <button
                type="button"
                onClick={addResource}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline"
              >
                Add Resource
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              {initialData ? 'Update Lecture' : 'Add Lecture'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}