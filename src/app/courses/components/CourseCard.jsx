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

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-xl shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300 flex flex-col h-full border border-gray-200/50 max-w-xs"
    >
      <div className="h-48 relative overflow-hidden">
        {course.thumbnail ? (
          <Image 
            src={course.thumbnail}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-[#2c3180] to-[#235d96]">
            <span className="text-white font-medium">No thumbnail</span>
          </div>
        )}
        
        {discountPercentage && (
          <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            {discountPercentage}% OFF
          </div>
        )}
        
        {course.rating > 0 && (
          <div className="absolute bottom-4 left-4 flex items-center bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
            <FaStar className="text-yellow-500 mr-1.5" size={14} />
            <span className="text-sm font-semibold text-gray-800">{course.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <div className="mb-3">
          <h3 className="text-lg font-bold text-gray-900">
            {course.title}
          </h3>
        </div>
        
        <p className="text-gray-600 text-sm mb-5 line-clamp-2 leading-relaxed">
          {course.description || "No description provided."}
        </p>
        
        <div className="grid grid-cols-2 gap-y-3 text-sm mb-4">
          <div className="flex items-center">
            <FaUserGraduate className="mr-2 text-[#235d96]" size={14} />
            <span className="font-medium text-gray-700">{course.totalEnrollments?.toLocaleString() || 0} students</span>
          </div>
          
          <div className="flex items-center justify-end">
            <FaLayerGroup className="mr-2 text-[#235d96]" size={14} />
            <span className="font-medium text-gray-700">{course.level || "All Levels"}</span>
          </div>
          
          <div className="flex items-center">
            <FaClock className="mr-2 text-[#235d96]" size={14} />
            <span className="font-medium text-gray-700">{course.duration || "0"} hours</span>
          </div>
          
          <div className="flex items-center justify-end">
            <FaTag className="mr-2 text-[#235d96]" size={14} />
            <span className="font-medium text-gray-700">{course.category || "Uncategorized"}</span>
          </div>
        </div>
        
        <div className="flex items-center mb-4">
          <FaChalkboardTeacher className="w-4 h-4 text-[#235d96] mr-2" />
          <span className="text-sm text-gray-700 font-medium">
            Instructor: {instructorName}
          </span>
        </div>
        
        <div className="mt-auto pt-4 border-t border-gray-200">
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
              className="bg-[#0a5299] hover:bg-[#235d96] text-white px-5 py-2 rounded-lg transition-colors duration-300 text-sm font-semibold shadow-sm hover:shadow-md"
            >
              View Course
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CourseCard;