import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function CourseCard({ course, isManageable = false, onEditClick, onDeleteClick, blueTheme = "#6673f2", className = "" }) {
  const thumbnailUrl = course.thumbnail;

  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden flex flex-col ${className}`}>
      <div className="relative h-48 w-full">
        <Image
          src={thumbnailUrl}
          alt={course.title}
          fill
          style={{ objectFit: 'cover' }}
          className="transition-opacity duration-500 ease-in-out"
        />
        {course.isPublished === false ? (
          <div className="absolute top-0 right-0 bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-1 m-2 rounded">
            Draft
          </div>
        ) : (
          <div className="absolute top-0 right-0 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 m-2 rounded">
            Published
          </div>
        )}
        <div className="absolute bottom-0 left-0 bg-gray-900 bg-opacity-70 text-white text-xs font-medium px-2.5 py-1 m-2 rounded">
          {course.level || "Beginner"}
        </div>
      </div>

      <div className="p-6 flex-grow flex flex-col">
        <Link href={`/instructor/courses/${course._id}`} className="no-underline">
          <h3 className="font-bold text-xl text-gray-800 mb-2 line-clamp-2  transition-colors cursor-pointer">
            {course.title}
          </h3>
        </Link>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
          {course.description || "No description available for this course."}
        </p>

        <div className="mt-auto">
          <div className="grid grid-cols-2 gap-3 text-sm text-gray-500 mb-4">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{course.duration}h</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>{course.lectures?.length || 0} lectures</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>{course.totalEnrollments || 0} students</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span>{course.category || "Uncategorized"}</span>
            </div>
          </div>

          {isManageable ? (
            <div className="flex space-x-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onEditClick(course)}
                style={{ backgroundColor: blueTheme }}
                className="flex-1 flex justify-center items-center py-2 px-3 rounded-md text-white text-sm font-medium transition-all duration-200 hover:opacity-90 cursor-pointer"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </motion.button>
              <Link 
                href={`/instructor/courses/${course._id}`} 
                className="flex-1 flex justify-center items-center py-2 px-3 border border-gray-300 rounded-md text-gray-700 text-sm font-medium bg-white hover:bg-gray-50 transition-all duration-200 cursor-pointer"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View
              </Link>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onDeleteClick(course._id)}
                className="p-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 cursor-pointer"
              >
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </motion.button>
            </div>
          ) : (
            <Link 
              href={`/courses/${course._id}`} 
              className="w-full flex justify-center items-center py-2 px-3 rounded-md text-white text-sm font-medium transition-all duration-200 hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: blueTheme }}
            >
              View Course
            </Link>
          )}
        </div>
      </div>
      
      {/* {course.price > 0 ? (
        <div className="absolute top-0 left-0 bg-white px-3 py-1 m-2 rounded-full shadow-sm">
          <span className="font-semibold text-gray-900">${course.price.toFixed(2)}</span>
        </div>
      ) : (
        <div className="absolute top-0 left-0 bg-[#eef0ff] px-3 py-1 m-2 rounded-full shadow-sm">
          <span className="font-semibold text-[#6c7aff]">Free</span>
        </div>
      )} */}
    </div>
  );
}