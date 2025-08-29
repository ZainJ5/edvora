"use client"

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaStar, FaUserGraduate, FaClock, FaLayerGroup, FaTag, FaChalkboardTeacher } from 'react-icons/fa';
import { motion } from 'framer-motion';

const CourseCard = ({ course, categoryColors, levelBadgeColors }) => {
  const instructorName = course.instructorName || "Instructor";
  
  const discountPercentage = course.originalPrice && course.price < course.originalPrice
    ? Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)
    : null;
    console.log("Course:",course)
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-xl shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300 flex flex-col h-full border border-gray-200/50 max-w-xs"
    >
      <div className="h-40 relative overflow-hidden">
        {course.thumbnail ? (
          <Image 
            src={course.thumbnail}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-[#2c3180] to-[#1a1e4e]">
            <span className="text-white font-medium">No thumbnail</span>
          </div>
        )}
        
        {discountPercentage && (
          <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md">
            {discountPercentage}% OFF
          </div>
        )}
      </div>
      
      <div className="p-5 flex-1 flex flex-col">
        <div className="mb-3 flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-[#2c3180] transition-colors">
              {course.title}
            </h3>
            
            {course.rating > 0 && (
              <div className="flex items-center ml-2 shrink-0">
                <FaStar className="text-yellow-400 mr-1" size={14} />
                <span className="text-sm font-medium text-gray-700">{course.rating?.toFixed(1)}</span>
              </div>
            )}
          </div>
          
          <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
            {course.description || "No description provided."}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
          {course.category && (
            <div className="flex items-center">
              <FaTag className="mr-2 text-gray-400" size={14} />
              <span className="font-medium" style={{color: categoryColors[course.category]?.replace('bg-', 'text-') || 'text-gray-500'}}>
                {course.category}
              </span>
            </div>
          )}
          
          {course.level && (
            <div className="flex items-center">
              <FaLayerGroup className="mr-2 text-gray-400" size={14} />
              <span className="font-medium">{course.level}</span>
            </div>
          )}
          
          {course.duration && (
            <div className="flex items-center">
              <FaClock className="mr-2 text-gray-400" size={14} />
              <span className="font-medium">{course.duration} hrs</span>
            </div>
          )}
          
          {course.totalEnrollments !== undefined && (
            <div className="flex items-center">
              <FaUserGraduate className="mr-2 text-gray-400" size={14} />
              <span className="font-medium">{course.totalEnrollments.toLocaleString()}</span>
            </div>
          )}
        </div>
        
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-700 flex items-center font-medium">
              <FaChalkboardTeacher className="w-5 h-5 text-[#2c3180] mr-2" size={16} />
              Instructor: {instructorName}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="font-bold text-lg text-gray-900">
                {course.price > 0 ? `$${course.price?.toFixed(2)}` : "Free"}
              </span>
              {course.originalPrice && course.originalPrice > course.price && (
                <span className="text-sm text-gray-400 line-through">${course.originalPrice.toFixed(2)}</span>
              )}
            </div>
            
            <Link 
              href={`/courses/${course._id}`}
              className="bg-[#2c3180] hover:bg-[#1a1e4e] text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-semibold"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CourseCard;