import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  FaStar, 
  FaRegStar, 
  FaStarHalfAlt, 
  FaUsers, 
  FaArrowLeft,
  FaRegCalendarAlt,
  FaCheck
} from 'react-icons/fa';

const renderStars = (rating) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(<FaStar key={i} className="text-yellow-500" />);
    } else if (i === fullStars && hasHalfStar) {
      stars.push(<FaStarHalfAlt key={i} className="text-yellow-500" />);
    } else {
      stars.push(<FaRegStar key={i} className="text-yellow-500" />);
    }
  }
  
  return stars;
};

const CourseHeader = ({ course, isEnrolled }) => {
  return (
    <div className="bg-[#f2f6fd] border-b border-gray-200">
      <div className="container mx-auto px-4 py- md:py-8">
        <div className="mb-8">
          <Link 
            href="/courses"
            className="text-gray-600 hover:text-[#0b4c8b] flex items-center text-sm font-medium transition-colors"
          >
            <FaArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start">
          <div className="md:col-span-7">
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="bg-[#0b4c8b]/10 text-[#0b4c8b] text-xs px-3 py-1 rounded-full font-medium">
                {course.category || "General"}
              </span>
              <span className="bg-[#0b4c8b]/10 text-[#0b4c8b] text-xs px-3 py-1 rounded-full font-medium">
                {course.level}
              </span>
              {isEnrolled && (
                <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium flex items-center">
                  <FaCheck className="mr-1" size={10} /> Enrolled
                </span>
              )}
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">{course.title}</h1>
            
            <p className="text-gray-600 text-lg mb-6 leading-relaxed line-clamp-2 overflow-hidden">
              {course.description || "Enhance your skills with this comprehensive course."}
            </p>
            
            <div className="flex flex-wrap items-center text-sm text-gray-600 gap-x-6 gap-y-3 mb-8">
              <div className="flex items-center">
                <div className="flex mr-2">
                  {renderStars(course.rating || 4.5)}
                </div>
                <span className="font-medium">({course.rating?.toFixed(1) || "4.5"})</span>
              </div>
              <div className="flex items-center">
                <FaUsers className="mr-2 text-gray-500" />
                <span>{course.totalEnrollments || 0} students</span>
              </div>
              <div className="flex items-center">
                <FaRegCalendarAlt className="mr-2 text-gray-500" />
                <span>Last updated {new Date(course.updatedAt || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="flex items-center">
              {course.instructor ? (
                <div className="flex items-center">
                  <div className="bg-white rounded-full h-10 w-10 flex items-center justify-center mr-3 border border-gray-200 overflow-hidden">
                    {course.instructor.avatar ? (
                      <Image
                        src={course.instructor.avatar}
                        alt={course.instructor.name}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-[#0b4c8b] font-bold">
                        {course.instructor.name ? course.instructor.name.charAt(0).toUpperCase() : 'I'}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-700 text-sm">
                      Created by <span className="font-semibold text-gray-900">{course.instructor.name || "Instructor"}</span>
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          
          <div className="md:col-span-5">
            <div className="relative aspect-video overflow-hidden rounded-xl shadow-lg border border-gray-200">
              {course.thumbnail ? (
                <Image 
                  src={course.thumbnail}
                  alt={course.title}
                  fill
                  priority
                  className="object-cover"
                />
              ) : (
                <div className="bg-gradient-to-br from-[#0b4c8b] to-[#0b4c8b]/80 h-full flex items-center justify-center">
                  <h3 className="text-xl font-bold text-white px-4 text-center">{course.title}</h3>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseHeader;