import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  FaChevronDown,
  FaChevronUp,
  FaLock,
  FaUnlock,
  FaPlayCircle,
  FaFileAlt,
  FaUsers,
  FaStar,
  FaRegStar,
  FaStarHalfAlt,
  FaUserGraduate,
  FaClock,
  FaBook,
  FaDownload,
  FaClipboardCheck,
  FaShieldAlt,
  FaSort
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const CourseContent = ({ course, isEnrolled }) => {
  const [expandedSections, setExpandedSections] = useState({});
  const [activeTab, setActiveTab] = useState('curriculum');
  const [localReviews, setLocalReviews] = useState([]);
  const [topReviews, setTopReviews] = useState([]);
  const [localRating, setLocalRating] = useState(Number(course.rating) || 0);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Fetch reviews for the course when component mounts
  useEffect(() => {
    if (activeTab === 'reviews') {
      fetchCourseReviews();
    }
  }, [activeTab]);
  
  const fetchCourseReviews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/courses/${course._id}/reviews`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setLocalReviews(data.reviews || []);
        
        // Sort reviews by rating and get top 3
        const sortedReviews = [...(data.reviews || [])].sort((a, b) => b.rating - a.rating);
        setTopReviews(sortedReviews.slice(0, 3));
        
        // Check if current user has already reviewed
        setUserHasReviewed(data.userHasReviewed || false);
        
        // Update local rating
        setLocalRating(Number(data.avgRating) || 0);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const expandAll = () => {
    const allSectionIds = course.lectures?.map((_, idx) => `lecture-${idx}`) || [];
    const allExpanded = allSectionIds.every(id => expandedSections[id]);
    
    setExpandedSections(
      allSectionIds.reduce((acc, id) => {
        acc[id] = !allExpanded;
        return acc;
      }, {})
    );
  };

  const renderStars = (rating) => {
    const stars = [];
    const numRating = Number(rating) || 0;
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 >= 0.5;
    
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

  const handleAddReview = async () => {
    if (newRating === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login to add review');
      
      const res = await fetch(`/api/courses/${course._id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating: newRating, comment: newComment })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add review');
      }
      
      const addedReview = await res.json();
      
      // Update local state
      setLocalReviews([...localReviews, addedReview]);
      setUserHasReviewed(true);
      
      // Recalculate top reviews
      const updatedReviews = [...localReviews, addedReview];
      const sortedReviews = [...updatedReviews].sort((a, b) => b.rating - a.rating);
      setTopReviews(sortedReviews.slice(0, 3));
      
      // Update local rating
      const newCount = localReviews.length + 1;
      const newAvg = ((Number(localRating) * localReviews.length) + newRating) / newCount;
      setLocalRating(Number(newAvg.toFixed(1)));
      
      setNewRating(0);
      setNewComment('');
      toast.success('Review added successfully');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const tabVariants = {
    active: { borderColor: '#0b4c8b', color: '#0b4c8b', transition: { duration: 0.3 } },
    inactive: { borderColor: 'transparent', color: '#4B5563', transition: { duration: 0.3 } }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      <div className="border-b border-gray-200 bg-gradient-to-r from-white to-[#f8fafc]">
        <div className="flex overflow-x-auto scrollbar-hide">
          {['curriculum', 'overview', 'instructor', 'reviews'].map(tab => (
            <motion.button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-8 py-4 text-base font-semibold border-b-2 flex-shrink-0"
              initial="inactive"
              animate={activeTab === tab ? "active" : "inactive"}
              variants={tabVariants}
              whileHover={{ color: '#0b4c8b', borderColor: '#E2E8F0' }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </motion.button>
          ))}
        </div>
      </div>
      
      <div className="p-8">
        {activeTab === 'curriculum' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Course Content</h2>
                <p className="text-gray-500 mt-1">
                  {course.lectures?.length || 0} lectures • {course.duration}h total length
                </p>
              </div>
              <button 
                onClick={expandAll}
                className="flex items-center gap-2 text-[#0b4c8b] hover:text-[#0b4c8b]/80 text-sm font-medium px-4 py-2 border border-[#0b4c8b]/20 rounded-md hover:bg-[#0b4c8b]/5 transition-all"
              >
                {Object.keys(expandedSections).length === (course.lectures?.length || 0) ? (
                  <>
                    <FaChevronUp size={14} />
                    <span>Collapse all</span>
                  </>
                ) : (
                  <>
                    <FaChevronDown size={14} />
                    <span>Expand all</span>
                  </>
                )}
              </button>
            </div>
            
            {course.lectures && course.lectures.length > 0 ? (
              <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 overflow-hidden">
                {course.lectures.map((lecture, index) => (
                  <div key={index} className="bg-white">
                    <button
                      onClick={() => toggleSection(`lecture-${index}`)}
                      className="py-5 px-6 w-full flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center">
                        <div className="mr-4 bg-[#0b4c8b]/10 text-[#0b4c8b] h-10 w-10 rounded-full flex items-center justify-center font-medium text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{lecture.title}</h3>
                          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                            <span>{Array.isArray(lecture.resources) ? lecture.resources.length : 0} resources</span>
                            {lecture.aiSummary && (
                              <span className="flex items-center gap-1">
                                <FaBook className="text-[#0b4c8b] text-xs" />
                                AI summary
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-100 rounded-full p-2 transition-transform duration-300" style={{
                        transform: expandedSections[`lecture-${index}`] ? 'rotate(180deg)' : 'rotate(0deg)'
                      }}>
                        <FaChevronDown className="text-gray-500" />
                      </div>
                    </button>
                    
                    {expandedSections[`lecture-${index}`] && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                        className="px-6 pb-5 pt-2 bg-gray-50"
                      >
                        <ul className="space-y-3">
                          <li className="flex items-center justify-between text-sm py-2 px-4 bg-white rounded-md shadow-sm">
                            <div className="flex items-center">
                              <div className="mr-3 text-gray-500">
                                {isEnrolled ? (
                                  <FaUnlock className="text-green-600" />
                                ) : (
                                  <FaLock className="text-gray-400" />
                                )}
                              </div>
                              <div className="flex items-center">
                                <FaPlayCircle className="text-[#0b4c8b] mr-2" />
                                <span className={!isEnrolled ? "text-gray-400" : "text-gray-800 font-medium"}>
                                  {lecture.title} (Video)
                                </span>
                              </div>
                            </div>
                            {!isEnrolled ? (
                              <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full font-medium">
                                Preview locked
                              </span>
                            ) : (
                              <span className="bg-[#0b4c8b]/10 text-[#0b4c8b] text-xs px-3 py-1 rounded-full font-medium">
                                Watch now
                              </span>
                            )}
                          </li>
                          
                          {Array.isArray(lecture.resources) && lecture.resources.length > 0 && 
                            lecture.resources.map((resource, resourceIdx) => (
                              <li key={resourceIdx} className="flex items-center justify-between text-sm py-2 px-4 bg-white rounded-md shadow-sm">
                                <div className="flex items-center">
                                  <div className="mr-3 text-gray-500">
                                    {isEnrolled ? (
                                      <FaUnlock className="text-green-600" />
                                    ) : (
                                      <FaLock className="text-gray-400" />
                                    )}
                                  </div>
                                  <div className="flex items-center">
                                    <FaFileAlt className="text-gray-500 mr-2" />
                                    <span className={!isEnrolled ? "text-gray-400" : "text-gray-800 font-medium"}>
                                      {resource.title}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full font-medium capitalize">
                                    {resource.fileType}
                                  </span>
                                  {isEnrolled && (
                                    <button className="text-[#0b4c8b] hover:text-[#0b4c8b]/80">
                                      <FaDownload />
                                    </button>
                                  )}
                                </div>
                              </li>
                            ))
                          }
                          
                          {lecture.aiSummary && (
                            <li className="flex items-start text-sm py-3 px-4 bg-white rounded-md shadow-sm">
                              <div className="mr-3 text-gray-500 mt-1">
                                {isEnrolled ? (
                                  <FaUnlock className="text-green-600" />
                                ) : (
                                  <FaLock className="text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center mb-2">
                                  <FaBook className="text-[#0b4c8b] mr-2" />
                                  <span className="font-semibold text-gray-900">AI Summary</span>
                                </div>
                                <p className={`text-sm rounded-md bg-[#f8fafc] p-3 border border-gray-100 ${!isEnrolled ? "text-gray-400" : "text-gray-600"}`}>
                                  {isEnrolled ? lecture.aiSummary : "Enroll to view the AI-generated summary that helps you understand key concepts quickly."}
                                </p>
                              </div>
                            </li>
                          )}
                          
                          {Array.isArray(lecture.quizzes) && lecture.quizzes.length > 0 && (
                            <li className="flex items-center justify-between text-sm py-2 px-4 bg-white rounded-md shadow-sm">
                              <div className="flex items-center">
                                <div className="mr-3 text-gray-500">
                                  {isEnrolled ? (
                                    <FaUnlock className="text-green-600" />
                                  ) : (
                                    <FaLock className="text-gray-400" />
                                  )}
                                </div>
                                <div className="flex items-center">
                                  <FaClipboardCheck className="text-[#0b4c8b] mr-2" />
                                  <span className={!isEnrolled ? "text-gray-400" : "text-gray-800 font-medium"}>
                                    Quiz: {lecture.title}
                                  </span>
                                </div>
                              </div>
                              <span className="bg-[#0b4c8b]/10 text-[#0b4c8b] text-xs px-3 py-1 rounded-full font-medium">
                                Assessment
                              </span>
                            </li>
                          )}
                        </ul>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <div className="bg-gray-100 inline-flex p-4 rounded-full mb-4">
                  <FaPlayCircle className="text-gray-500 text-3xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Course content coming soon</h3>
                <p className="text-gray-500">Lecture content will be available soon.</p>
              </div>
            )}
            
            {!isEnrolled && (
              <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-start">
                  <div className="bg-yellow-100 p-3 rounded-full mr-4 flex-shrink-0">
                    <FaLock className="text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="text-yellow-800 font-semibold mb-2">Full course content is locked</h4>
                    <p className="text-yellow-700 mb-4">Enroll in this course to access all lectures, resources, and assignments.</p>
                    <button className="bg-[#0b4c8b] hover:bg-[#0b4c8b]/90 text-white font-medium py-2 px-6 rounded-md transition-colors shadow-sm">
                      Enroll Now
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">About this course</h2>
            <div className="prose max-w-none text-gray-600 mb-8 leading-relaxed bg-gray-50 p-6 rounded-lg">
              {course.description ? (
                <p className="whitespace-pre-line">{course.description}</p>
              ) : (
                <p className="text-gray-500 italic">No description provided for this course.</p>
              )}
            </div>
            
            {/* <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-5">What you'll learn</h3>
              {course.learningOutcomes && course.learningOutcomes.length > 0 ? (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {course.learningOutcomes.map((outcome, index) => (
                    <li key={index} className="flex items-start bg-[#f8fafc] p-3 rounded-md">
                      <svg className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">{outcome}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-gray-500 italic">Learning outcomes for this course will be available soon.</p>
                </div>
              )}
            </div> */}
            
            <h3 className="text-xl font-semibold text-gray-900 mb-5">Course Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-[#f8fafc] to-[#0b4c8b]/5 p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="bg-[#0b4c8b]/10 inline-flex p-3 rounded-full mb-3">
                  <FaUsers className="text-[#0b4c8b]" />
                </div>
                <div className="text-3xl font-bold text-[#0b4c8b]">{course.totalEnrollments || 0}</div>
                <div className="text-sm text-gray-600 font-medium mt-1">Students</div>
              </div>
              
              <div className="bg-gradient-to-br from-[#f8fafc] to-[#0b4c8b]/5 p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="bg-[#0b4c8b]/10 inline-flex p-3 rounded-full mb-3">
                  <FaPlayCircle className="text-[#0b4c8b]" />
                </div>
                <div className="text-3xl font-bold text-[#0b4c8b]">{course.lectures?.length || 0}</div>
                <div className="text-sm text-gray-600 font-medium mt-1">Lectures</div>
              </div>
              
              <div className="bg-gradient-to-br from-[#f8fafc] to-[#0b4c8b]/5 p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="bg-[#0b4c8b]/10 inline-flex p-3 rounded-full mb-3">
                  <FaStar className="text-[#0b4c8b]" />
                </div>
                <div className="text-3xl font-bold text-[#0b4c8b]">
                  {typeof localRating === 'number' ? localRating.toFixed(1) : 'N/A'}
                </div>
                <div className="text-sm text-gray-600 font-medium mt-1">Rating</div>
              </div>
              
              <div className="bg-gradient-to-br from-[#f8fafc] to-[#0b4c8b]/5 p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="bg-[#0b4c8b]/10 inline-flex p-3 rounded-full mb-3">
                  <FaClock className="text-[#0b4c8b]" />
                </div>
                <div className="text-3xl font-bold text-[#0b4c8b]">{course.duration || 0}</div>
                <div className="text-sm text-gray-600 font-medium mt-1">Hours</div>
              </div>
            </div>

            {course.category && (
              <div className="flex flex-wrap items-center gap-3 mt-8">
                <span className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium">
                  Category: {course.category}
                </span>
                <span className="bg-[#0b4c8b]/10 text-[#0b4c8b] px-4 py-2 rounded-full text-sm font-medium">
                  Level: {course.level || 'All Levels'}
                </span>
                <span className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium">
                  Last updated: {new Date(course.updatedAt || Date.now()).toLocaleDateString()}
                </span>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'instructor' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Meet Your Instructor</h2>
            
            {course.instructor ? (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="md:flex">
                  <div className="md:w-1/3 bg-gradient-to-br from-[#0b4c8b]/5 to-[#0b4c8b]/15 p-8 flex items-center justify-center">
                    <div className="text-center">
                      <div className="bg-white rounded-full h-36 w-36 mx-auto shadow-md border border-gray-200 flex items-center justify-center mb-4 overflow-hidden">
                        {course.instructor.avatar ? (
                          <Image
                            src={course.instructor.avatar}
                            alt={course.instructor.name}
                            width={144}
                            height={144}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-[#0b4c8b] font-bold text-4xl">
                            {course.instructor.name ? course.instructor.name.charAt(0).toUpperCase() : 'I'}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-xl text-gray-900">{course.instructor.name || 'Instructor'}</h3>
                      {course.instructor.expertise && course.instructor.expertise.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-2 mt-3">
                          {course.instructor.expertise.map((skill, idx) => (
                            <span key={idx} className="bg-[#0b4c8b]/10 text-[#0b4c8b] text-xs px-3 py-1 rounded-full">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="mt-4 flex justify-center space-x-3">
                        {course.instructor.socialLinks?.github && (
                          <a href={course.instructor.socialLinks.github} target="_blank" rel="noopener noreferrer" 
                             className="text-gray-600 hover:text-[#0b4c8b]">
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                            </svg>
                          </a>
                        )}
                        {course.instructor.socialLinks?.linkedin && (
                          <a href={course.instructor.socialLinks.linkedin} target="_blank" rel="noopener noreferrer"
                             className="text-gray-600 hover:text-[#0b4c8b]">
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="md:w-2/3 p-8">
                    <div className="prose max-w-none">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <FaUserGraduate className="mr-2 text-[#0b4c8b]" /> 
                        About the Instructor
                      </h3>
                      <div className="bg-[#f8fafc] p-5 rounded-lg border border-gray-100 mb-6">
                        <p className="text-gray-700 leading-relaxed">{course.instructor.bio || 'Information about the instructor will be available soon.'}</p>
                      </div>
                      
                      {course.instructor.experience && (
                        <div>
                          <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                            <FaShieldAlt className="mr-2 text-[#0b4c8b]" />
                            Experience
                          </h4>
                          <div className="bg-[#f8fafc] p-5 rounded-lg border border-gray-100">
                            <p className="text-gray-700 leading-relaxed">{course.instructor.experience}</p>
                          </div>
                        </div>
                      )}

                      {course.instructor.credentials && course.instructor.credentials.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-base font-semibold text-gray-900 mb-3">Credentials</h4>
                          <ul className="space-y-2">
                            {course.instructor.credentials.map((credential, idx) => (
                              <li key={idx} className="flex items-start bg-[#f8fafc] p-3 rounded-md">
                                <svg className="h-5 w-5 text-[#0b4c8b] mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{credential}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <div className="bg-gray-100 inline-flex p-4 rounded-full mb-4">
                  <FaUserGraduate className="text-gray-500 text-3xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Instructor information coming soon</h3>
                <p className="text-gray-500">Details about your instructor will be available shortly.</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'reviews' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Student Reviews</h2>
              <div className="flex items-center">
                <div className="flex items-center text-yellow-500 mr-2">
                  {renderStars(localRating)}
                </div>
                <span className="text-gray-700 font-medium">
                  ({typeof localRating === 'number' ? localRating.toFixed(1) : 'N/A'})
                </span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0b4c8b]"></div>
              </div>
            ) : (
              <>
                <div className="mb-6 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">Top Reviews</h3>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 mr-2">Total Reviews: {localReviews.length}</span>
                  </div>
                </div>
                
                {topReviews && topReviews.length > 0 ? (
                  <div className="space-y-6 mb-8">
                    {topReviews.map((review, idx) => (
                      <div key={idx} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center">
                            <div className="bg-[#0b4c8b]/10 text-[#0b4c8b] rounded-full h-12 w-12 flex items-center justify-center mr-3 font-semibold">
                              {review.userName?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{review.userName || 'Anonymous'}</p>
                              <p className="text-xs text-gray-500">{formatDate(review.date)}</p>
                            </div>
                          </div>
                          <div className="flex items-center text-yellow-500">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                        <p className="text-gray-600 leading-relaxed bg-[#f8fafc] p-4 rounded-md border border-gray-100">
                          {review.comment || 'No comment provided.'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-8 text-center mb-8">
                    <div className="bg-gray-100 inline-flex p-4 rounded-full mb-4">
                      <FaStar className="text-gray-500 text-3xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No reviews yet</h3>
                    <p className="text-gray-500">Be the first to leave a review after enrolling in this course.</p>
                  </div>
                )}

                {/* Only show the review input field if the user is enrolled AND hasn't already reviewed */}
                {isEnrolled && !userHasReviewed ? (
                  <div className="mt-8 border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave a Review</h3>
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Rate this course:</p>
                        <div className="flex space-x-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              className="text-2xl focus:outline-none transition-transform hover:scale-110"
                              onClick={() => setNewRating(star)}
                            >
                              <FaStar
                                className={star <= newRating ? 'text-yellow-500' : 'text-gray-300'}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="mb-4">
                        <label htmlFor="reviewComment" className="block text-sm font-medium text-gray-700 mb-1">
                          Your review:
                        </label>
                        <textarea
                          id="reviewComment"
                          className="w-full p-3 border border-gray-300 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b4c8b] focus:border-transparent resize-none"
                          rows={4}
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Share your experience with this course..."
                        />
                      </div>
                      <button
                        onClick={handleAddReview}
                        disabled={submitting || newRating === 0}
                        className={`py-2 px-6 rounded-lg text-white font-medium transition-all ${
                          submitting || newRating === 0 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-[#0b4c8b] hover:bg-[#0b4c8b]/90 shadow-sm hover:shadow'
                        }`}
                      >
                        {submitting ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </div>
                  </div>
                ) : isEnrolled && userHasReviewed ? (
                  <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-center">
                    <p className="text-green-700">
                      Thank you for submitting your review! Your feedback helps other students make informed decisions.
                    </p>
                  </div>
                ) : null}
                
                {localReviews.length > 3 && (
                  <button
                    onClick={() => {
                      // Toggle between showing top 3 vs all reviews
                      if (topReviews.length <= 3) {
                        setTopReviews([...localReviews]);
                      } else {
                        setTopReviews(localReviews.slice(0, 3));
                      }
                    }}
                    className="mt-4 text-[#0b4c8b] hover:text-[#0b4c8b]/80 text-sm font-medium flex items-center"
                  >
                    {topReviews.length <= 3 ? (
                      <>
                        Show all {localReviews.length} reviews
                        <FaChevronDown className="ml-1" />
                      </>
                    ) : (
                      <>
                        Show less
                        <FaChevronUp className="ml-1" />
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CourseContent;