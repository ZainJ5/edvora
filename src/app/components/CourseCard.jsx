"use client"

import React from 'react';
import Link from 'next/link';

export default function CourseCard({ course, isManageable = false, onEditClick, onDeleteClick }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-5">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-semibold mb-2 text-gray-800">{course.title}</h3>
          {course.isPublished ? (
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Published</span>
          ) : (
            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Draft</span>
          )}
        </div>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{course.description || "No description provided."}</p>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {course.tags && course.tags.map((tag, index) => (
            <span key={index} className="bg-gray-200 px-2 py-1 text-xs rounded-full text-gray-700">
              {tag}
            </span>
          ))}
        </div>
        
        <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
          <span>Level: {course.level}</span>
          <span className="font-bold text-gray-700">${course.price.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>{course.lectures?.length || 0} lectures</span>
          <span>{course.enrolledStudents?.length || 0} students</span>
        </div>
      </div>
      
      {isManageable && (
        <div className="bg-gray-100 p-3 flex justify-between">
          <Link 
            href={`/instructor/courses/${course._id}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Manage Content
          </Link>
          <div className="flex space-x-3">
            <button 
              onClick={() => onEditClick(course)}
              className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              Edit
            </button>
            <button 
              onClick={() => onDeleteClick(course._id)}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
