'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const AICourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchAICourses = async () => {
      try {
        const response = await fetch('/api/ai-courses');
        const data = await response.json();
        
        if (data.success) {
          setCourses(data.courses);
        }
      } catch (error) {
        console.error('Failed to fetch AI courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAICourses();
  }, []);

  const handleCourseClick = (courseId) => {
    router.push(`/courses/${courseId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-5xl font-bold text-gray-900 mb-2"
        >
          Popular AI Courses
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 animate-pulse rounded-lg h-96"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="bg-gray-50 text-black py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-2"
          >
            Popular AI Courses
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg md:text-xl text-gray-600 mb-6"
          >
            Explore cutting-edge AI courses to advance your tech career
          </motion.p>
          
          <div className="flex justify-end">
            <Link href="/courses?category=AI" className="text-blue-600 hover:underline">
              View All
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courses.length > 0 ? (
            courses.map((course) => (
              <div 
                key={course._id} 
                className="bg-white border rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => handleCourseClick(course._id)}
              >
                <div className="relative h-48 w-full">
                  <Image
                    src={course.thumbnail }
                    alt={course.title}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                
                <div className="p-4">
                  <h3 className="text-xl font-bold mb-2 line-clamp-2">{course.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{course.instructorName}</p>
                  <p className="text-sm text-gray-700 mb-4 line-clamp-2">{course.description}</p>
                  
                  <div className="flex items-center mb-2">
                    <div className="flex items-center mr-2">
                      <span className="text-yellow-500 mr-1">★</span>
                      <span className="font-medium">{course.rating?.toFixed(1) || 'N/A'}</span>
                    </div>
                    <span className="text-gray-500 text-sm">
                      • {course.totalEnrollments || 0} students
                    </span>
                  </div>
                  
                  <div className="flex items-center mt-3">
                    <span className="font-bold text-lg">${course.price?.toFixed(2)}</span>
                    {course.originalPrice && course.originalPrice > course.price && (
                      <span className="text-gray-500 line-through ml-2">${course.originalPrice?.toFixed(2)}</span>
                    )}
                    <button className="ml-auto bg-[#235d96] text-white px-4 py-1.5 rounded hover:bg-[#235d96] transition">
                      View Details
                    </button>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {course.level || 'All Levels'}
                    </span>
                    {course.duration && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {course.duration} total hours
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-10">
              <p>No AI courses found. Check back later!</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AICourses;