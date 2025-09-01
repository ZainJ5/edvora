'use client'

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  FaPlayCircle, 
  FaListUl, 
  FaArrowLeft, 
  FaCheck,
  FaRegCheckCircle,
  FaRegCircle,
  FaRobot,
  FaChevronLeft,
  FaChevronRight,
  FaQuestionCircle,
  FaFileAlt,
  FaFilePdf,
  FaFileDownload,
  FaTimes,
  FaBars,
  FaCheckCircle,
  FaUnlockAlt,
  FaCommentDots,
  FaCertificate,
  FaTrophy,
  FaLock,
  FaGraduationCap,
  FaBookmark,
  FaExclamationCircle,
  FaPaperPlane,
  FaRegUser,
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import Quiz from '../../components/Quiz'; 
import Notes from '../../components/Notes';
import InstructorChat from '../../components/InstructorChat';
import LectureQuestions from '../../components/LectureQuestions';
import dynamic from 'next/dynamic';
import AILearning from '../../components/AILearning'
import { useAuth } from '../../../../context/AuthContext'; 
import jsPDF from 'jspdf';

const CourseLearn = () => {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId; 
  const { currentUser, loading: authLoading } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [currentLectureIndex, setCurrentLectureIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('video');
  const [completedLectures, setCompletedLectures] = useState([]);
  const [completedQuizzes, setCompletedQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showSidebarMobile, setShowSidebarMobile] = useState(false);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [showCourseCompletionModal, setShowCourseCompletionModal] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);
  
  const videoRef = useRef(null);
  const progressUpdateTimeoutRef = useRef(null);
  const courseCompletionThreshold = 100;

  useEffect(() => {
    return () => {
      if (progressUpdateTimeoutRef.current) {
        clearTimeout(progressUpdateTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (courseId && !authLoading && currentUser) {
      fetchCourseData();
      checkEnrollment();
    }
  }, [courseId, authLoading, currentUser]);

  useEffect(() => {
    if (course && course.lectures && course.lectures.length > 0) {
      calculateProgress();
    }
  }, [completedLectures, completedQuizzes, course]);

  useEffect(() => {
    if (progress >= courseCompletionThreshold) {
      const allLecturesCompleted = course?.lectures?.every(lecture => 
        completedLectures.includes(lecture._id)
      );
      
      if (allLecturesCompleted && !showCourseCompletionModal) {
        setShowCourseCompletionModal(true);
      }
    }
  }, [progress, course, completedLectures, completedQuizzes]);

  const checkEnrollment = async () => {
    if (!currentUser || !courseId) return;

    try {
      setCheckingEnrollment(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/check-enrollment/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIsEnrolled(data.enrolled);
      } else {
        throw new Error('Enrollment check failed');
      }
    } catch (err) {
      console.error('Error checking enrollment:', err);
      setError('Failed to verify enrollment. Please try again.');
    } finally {
      setCheckingEnrollment(false);
    }
  };

  const calculateProgress = () => {
    if (!course || !course.lectures) return;
    
    const totalLectures = course.lectures.length;
    
    const totalItems = totalLectures || 1; 
    
    const validCompletedLectures = completedLectures.filter(id => id);
    
    const completedItems = validCompletedLectures.length;
    const progressPercentage = (completedItems / totalItems) * 100;
    
    const newProgress = Math.min(Math.round(progressPercentage), 100);
    setProgress(newProgress);
    
    if (progressUpdateTimeoutRef.current) {
      clearTimeout(progressUpdateTimeoutRef.current);
    }
    
    progressUpdateTimeoutRef.current = setTimeout(() => {
      updateProgressOnServer(validCompletedLectures, [], newProgress);
    }, 1000);
  };

  const fetchCourseData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/courses/${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch course data');
      }
      
      const data = await response.json();
      setCourse(data.course);
      console.log("Course in main page:", data.course);
      const progressResponse = await fetch(`/api/courses/${courseId}/progress`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        
        if (progressData.courseProgress) {
          const validLectures = (progressData.courseProgress.completedLectures || [])
            .filter(id => id && typeof id === 'string');
          
          const validQuizzes = (progressData.courseProgress.completedQuizzes || [])
            .filter(id => id && typeof id === 'string');
          
          setCompletedLectures(validLectures);
          setCompletedQuizzes(validQuizzes);
          
          if (data.course && data.course.lectures && data.course.lectures.length > 0) {
            const lastLectureIndex = findLastLectureIndex(data.course.lectures, validLectures);
            setCurrentLectureIndex(lastLectureIndex);
            
            if (lastLectureIndex < data.course.lectures.length) {
              const currentLecture = data.course.lectures[lastLectureIndex];
              setVideoCompleted(validLectures.includes(currentLecture._id));
            }
          }
        }
      }
      
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const findLastLectureIndex = (lectures, completedLectureIds) => {
    if (!completedLectureIds || completedLectureIds.length === 0) return 0;
    
    let furthestIndex = -1;
    
    lectures.forEach((lecture, index) => {
      if (completedLectureIds.includes(lecture._id)) {
        furthestIndex = index;
      }
    });
    
    if (furthestIndex !== -1) {
      if (furthestIndex < lectures.length - 1) {
        return furthestIndex + 1;
      }
      return furthestIndex;
    }
    
    return 0;
  };

  const handleLectureClick = (index) => {
    if (index > 0) {
      const prevLectureId = course.lectures[index-1]._id;
      if (!completedLectures.includes(prevLectureId)) {
        toast.error("Please complete the previous lecture first");
        return;
      }
    }
    
    setCurrentLectureIndex(index);
    setActiveTab('video');
    setVideoCompleted(completedLectures.includes(course.lectures[index]._id));
    
    if (window.innerWidth < 768) {
      setShowSidebarMobile(false);
    }
  };

  const handleVideoEnd = async () => {
    if (!currentLecture) return;
    
    const lectureId = currentLecture._id;
    
    if (!completedLectures.includes(lectureId)) {
      const updatedCompletedLectures = [...completedLectures, lectureId];
      setCompletedLectures(updatedCompletedLectures);
      
      const validCompletedQuizzes = completedQuizzes.filter(id => id);
      updateProgressOnServer(updatedCompletedLectures, validCompletedQuizzes);
    }

    setVideoCompleted(true);
    
    if (currentLecture.quizzes && currentLecture.quizzes.length > 0) {
      setActiveTab('quiz');
    }
  };

  const handleMarkLectureComplete = async () => {
    if (!currentLecture) return;
    
    const lectureId = currentLecture._id;
    
    setUpdatingProgress(true);
    
    try {
      if (!completedLectures.includes(lectureId)) {
        const updatedCompletedLectures = [...completedLectures, lectureId];
        setCompletedLectures(updatedCompletedLectures);
        
        const validCompletedQuizzes = completedQuizzes.filter(id => id);
        await updateProgressOnServer(updatedCompletedLectures, validCompletedQuizzes);
        
        toast.success("Lecture marked as completed!");
      }

      setVideoCompleted(true);
      
      if (currentLecture.quizzes && currentLecture.quizzes.length > 0) {
        setActiveTab('quiz');
      }
    } catch (err) {
      console.error("Error marking lecture complete:", err);
      toast.error("Failed to mark lecture as completed. Please try again.");
    } finally {
      setUpdatingProgress(false);
    }
  };

  const handleQuizCompletion = (passed, quizId) => {
    if (!quizId) {
      console.error("Invalid quiz ID");
      return;
    }
    
    if (passed) {
      
      const currentLectureId = currentLecture._id;
      let updatedCompletedLectures = [...completedLectures];
      
      if (!updatedCompletedLectures.includes(currentLectureId)) {
        updatedCompletedLectures.push(currentLectureId);
        setCompletedLectures(updatedCompletedLectures);
      }
      
      if (!completedQuizzes.includes(quizId)) {
        const updatedCompletedQuizzes = [...completedQuizzes, quizId];
        setCompletedQuizzes(updatedCompletedQuizzes);
        
        updateProgressOnServer(updatedCompletedLectures, updatedCompletedQuizzes);
      }
      
      toast.success('Quiz completed successfully! You can now proceed to the next lecture.');
      setActiveTab('video');
      
      if (currentLectureIndex < course.lectures.length - 1) {
        setCurrentLectureIndex(currentLectureIndex + 1);
        setVideoCompleted(false);
      }
    } else {
      toast.error('Please try the quiz again to proceed to the next lecture.');
    }
  };

  const handleCourseCertificate = () => {
    if (!currentUser || !course) return;

    toast.success("Generating your certificate...");
    
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(10, 77, 124); 
    doc.text('Certificate of Completion', 105, 40, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`This certifies that`, 105, 70, { align: 'center' });
    doc.setFontSize(20);
    doc.text(`${currentUser.name}`, 105, 85, { align: 'center' });
    doc.setFontSize(16);
    doc.text(`has successfully completed the course`, 105, 100, { align: 'center' });
    doc.setFontSize(20);
    doc.text(`${course.title}`, 105, 115, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(10, 77, 124); 
    doc.text(`Issued on: ${new Date().toLocaleDateString()}`, 105, 140, { align: 'center' });    
    doc.setDrawColor(10, 77, 124); 
    doc.setLineWidth(1);
    doc.rect(20, 20, 170, 160);
    doc.setLineWidth(0.5);
    doc.line(20, 60, 190, 60);
    doc.line(20, 170, 190, 170);

    doc.save(`Certificate_${course.title.replace(/\s/g, '_')}.pdf`);
    
    toast.success("Certificate downloaded successfully!");
  };

  const updateProgressOnServer = async (lectureIds, quizIds, currentProgress = null) => {
    try {
      const token = localStorage.getItem('token');
      
      const validLectureIds = Array.isArray(lectureIds) 
        ? lectureIds.filter(id => id && typeof id === 'string')
        : [];
        
      const validQuizIds = Array.isArray(quizIds)
        ? quizIds.filter(id => id && typeof id === 'string')
        : [];
      
      let progressValue = currentProgress;
      if (progressValue === null && course && course.lectures) {
        const totalLectures = course.lectures.length;
        
        const totalItems = totalLectures || 1;
        const completedItems = validLectureIds.length;
        progressValue = Math.min(Math.round((completedItems / totalItems) * 100), 100);
      }
      
      const response = await fetch(`/api/courses/${courseId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          completedLectures: validLectureIds,
          completedQuizzes: validQuizIds,
          progress: progressValue
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update progress');
      }
    } catch (err) {
      console.error("Error updating progress:", err);
      toast.error('Failed to sync your progress. We\'ll try again later.');
    }
  };

  const handleNextLecture = () => {
    if (currentLectureIndex < course.lectures.length - 1) {
      const currentLectureId = course.lectures[currentLectureIndex]._id;
      
      if (!completedLectures.includes(currentLectureId)) {
        toast.error("Please complete the current lecture first");
        return;
      }
      
      setCurrentLectureIndex(currentLectureIndex + 1);
      setActiveTab('video');
      setVideoCompleted(completedLectures.includes(course.lectures[currentLectureIndex + 1]._id));
    }
  };

  const handlePreviousLecture = () => {
    if (currentLectureIndex > 0) {
      setCurrentLectureIndex(currentLectureIndex - 1);
      setActiveTab('video');
      setVideoCompleted(completedLectures.includes(course.lectures[currentLectureIndex - 1]._id));
    }
  };

  const handleDownloadResource = (resource) => {
    const link = document.createElement('a');
    link.href = resource.fileUrl;
    link.download = resource.title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Downloading ${resource.title}`);
  };

  if (authLoading || loading || checkingEnrollment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="relative h-16 w-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-t-4 border-[#0A4D7C] animate-spin"></div>
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
          <p className="mt-4 text-black font-medium">Loading Courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 px-4 md:px-6 min-h-[60vh] flex items-center">
        <div
          className="max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="bg-red-100 p-2 rounded-full">
                <FaExclamationCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-black">Error</h3>
            </div>
            <p className="mt-4 text-gray-600">Course not found</p>
          </div>
          <div className="px-6 py-4 bg-gray-50">
            <button
              onClick={() => router.push('/courses')}
              className="w-full py-2 px-4 bg-[#0A4D7C] hover:bg-[#083d63] text-white font-medium rounded-md 
              transition-colors duration-200 flex items-center justify-center"
            >
              <FaArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  if (!isEnrolled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full border border-gray-200">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100">
            <FaLock className="w-8 h-8 text-[#0A4D7C]" />
          </div>
          <h1 className="text-2xl font-bold text-center text-black mb-2">Access Denied</h1>
          <p className="text-gray-600 text-center mb-6">You are not enrolled in this course. Please enroll to access the content.</p>
          <button 
            onClick={() => router.push('/courses')}
            className="w-full px-4 py-3 bg-[#0A4D7C] text-white rounded-lg hover:bg-[#083d63] transition-all duration-300 font-medium shadow-md"
          >
            Enroll Now
          </button>
        </div>
      </div>
    );
  }

  const currentLecture = course.lectures[currentLectureIndex];
  const isLectureCompleted = currentLecture && completedLectures.includes(currentLecture._id);

  const hasQuiz = currentLecture && currentLecture.quizzes && currentLecture.quizzes.length > 0;
  const quizId = hasQuiz ? currentLecture.quizzes[0] : null;
  const isQuizCompleted = hasQuiz && completedQuizzes.includes(quizId);

  return (
    <>
      <div className="flex flex-col min-h-screen text-gray-800 bg-white">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            <button 
              onClick={() => router.push('/courses')}
              className="mr-4 text-gray-600 hover:text-black transition-colors duration-300 rounded-full p-2 hover:bg-gray-100"
            >
              <FaArrowLeft className="text-lg" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-black tracking-tight">{course.title}</h1>
              <p className="text-sm text-gray-500">Lecture {currentLectureIndex + 1} of {course.lectures.length}</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            {progress >= 100 ? (
              <div className="flex items-center text-green-500">
                <FaTrophy className="text-green-500 mr-2" />
                <span className="font-medium">Course Completed!</span>
              </div>
            ) : null}
            
            {progress >= courseCompletionThreshold && (
              <button
                onClick={() => setShowCourseCompletionModal(true)}
                className="flex items-center px-4 py-2 bg-[#0A4D7C] text-white rounded-lg hover:bg-[#083d63] transition-all duration-300 font-medium text-sm shadow-md"
              >
                <FaCertificate className="mr-2" /> Get Certificate
              </button>
            )}
            
            <button 
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-all duration-300"
              aria-label="Toggle course content"
            >
              {showSidebar ? <FaTimes /> : <FaListUl />}
            </button>
          </div>
          
          <div className="flex md:hidden items-center space-x-3">
            <button 
              onClick={() => setShowSidebarMobile(!showSidebarMobile)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
              aria-label="Menu"
            >
              <FaBars />
            </button>
          </div>
        </div>
        
        <div className="flex">
          {/* Mobile Sidebar */}
          {showSidebarMobile && (
            <div className="fixed inset-0 bg-black bg-opacity-60 z-30 md:hidden backdrop-blur-sm transition-all duration-300">
              <div className="absolute right-0 top-0 h-full w-4/5 max-w-xs bg-white shadow-2xl transform transition-transform duration-300">
                <div className="p-4 flex justify-between items-center border-b border-gray-200">
                  <h2 className="font-semibold text-black">Course Content</h2>
                  <button 
                    onClick={() => setShowSidebarMobile(false)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                    aria-label="Close menu"
                  >
                    <FaTimes />
                  </button>
                </div>
                
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-black">Your Progress</span>
                    <span className="text-sm font-medium text-[#0A4D7C]">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-[#0A4D7C]"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="overflow-y-auto h-full pb-32">
                  {course.lectures.map((lecture, index) => {
                    const lectureId = lecture._id;
                    const isCompleted = completedLectures.includes(lectureId);
                    const hasLectureQuiz = lecture.quizzes && lecture.quizzes.length > 0;
                    const lectureQuizId = hasLectureQuiz ? lecture.quizzes[0] : null;
                    const isQuizDone = hasLectureQuiz ? completedQuizzes.includes(lectureQuizId) : true;
                    const isLocked = index > 0 && 
                      (!completedLectures.includes(course.lectures[index-1]._id));
                    
                    return (
                      <div 
                        key={lecture._id || index}
                        onClick={() => !isLocked && handleLectureClick(index)}
                        className={`px-4 py-3 border-b border-gray-200 cursor-pointer transition-all duration-300 ${
                          isLocked ? 'opacity-60 cursor-not-allowed bg-gray-50' : 
                          currentLectureIndex === index ? 'bg-[#0A4D7C] text-white' : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className="mr-3 flex-shrink-0">
                            {isCompleted ? (
                              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                <FaRegCheckCircle className="text-green-500 text-sm" />
                              </div>
                            ) : isLocked ? (
                              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                <FaLock className="text-gray-400 text-xs" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-500">{index+1}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              isLocked ? 'text-gray-400' : currentLectureIndex === index ? 'text-white' : 'text-black'
                            }`}>
                              {lecture.title}
                            </p>
                            <p className={`text-xs ${currentLectureIndex === index ? 'text-gray-200' : 'text-gray-500'} flex items-center mt-1`}>
                              <FaPlayCircle className="mr-1 text-xs" />
                              <span>{lecture.duration || '5'} min</span>
                              {hasLectureQuiz && (
                                <span className="ml-2 flex items-center">
                                  • <FaQuestionCircle className="mx-1 text-xs" /> Quiz 
                                  {isQuizDone && <FaCheckCircle className="ml-1 text-green-500 text-xs" />}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          
          {/* Desktop Sidebar */}
          {showSidebar && (
            <div className="hidden md:block w-80 border-r border-gray-200 bg-white overflow-y-auto shadow-md">
              <div className="p-5 border-b border-gray-200">
                <h2 className="font-semibold text-black text-lg">Course Content</h2>
                <div className="mt-3 flex items-center text-sm">
                  <FaPlayCircle className="text-gray-500 mr-2" />
                  <span className="text-gray-500">{course.lectures.length} lectures</span>
                  <span className="mx-2 text-gray-300">•</span>
                  <span className="text-gray-500">{course.duration || '45'} min total</span>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-black">Your Progress</span>
                    <span className="text-sm font-medium text-[#0A4D7C]">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-[#0A4D7C]"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="py-2">
                {course.lectures.map((lecture, index) => {
                  const lectureId = lecture._id;
                  const isCompleted = completedLectures.includes(lectureId);
                  const hasLectureQuiz = lecture.quizzes && lecture.quizzes.length > 0;
                  const lectureQuizId = hasLectureQuiz ? lecture.quizzes[0] : null;
                  const isQuizDone = hasLectureQuiz ? completedQuizzes.includes(lectureQuizId) : true;
                  const isLocked = index > 0 && 
                    (!completedLectures.includes(course.lectures[index-1]._id));
                  
                  return (
                    <div 
                      key={lecture._id || index}
                      onClick={() => !isLocked && handleLectureClick(index)}
                      className={`px-5 py-3 border-b border-gray-200 cursor-pointer transition-all duration-300 ${
                        isLocked ? 'opacity-70 cursor-not-allowed' : ''
                      } ${currentLectureIndex === index ? 'bg-[#0A4D7C] text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 mr-3">
                          {isCompleted ? (
                            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                              <FaCheckCircle className="text-green-500" />
                            </div>
                          ) : isLocked ? (
                            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                              <FaLock className="text-gray-400" />
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-full border-2 border-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-500">{index+1}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${isLocked ? 'text-gray-400' : currentLectureIndex === index ? 'text-white' : 'text-black'}`}>
                            {lecture.title}
                          </p>
                          <div className={`flex items-center mt-1 text-xs ${currentLectureIndex === index ? 'text-gray-200' : 'text-gray-500'}`}>
                            <FaPlayCircle className="mr-1" />
                            <span>{lecture.duration || '5'} min</span>
                            
                            {hasLectureQuiz && (
                              <span className="ml-3 flex items-center">
                                <FaQuestionCircle className="mr-1" />
                                <span>Quiz</span>
                                {isQuizDone && <FaCheckCircle className="ml-1 text-green-500" />}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {isLocked && (
                          <div className="ml-2 text-gray-400">
                            <FaLock />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Main Content Area */}
          <div className="flex-1 pb-16">
            {currentLecture && (
              <div className="flex flex-col h-full">
                {/* Video Container */}
                <div className="bg-black relative shadow-lg">
                  {activeTab === 'video' && (
                    <div className="w-full aspect-video">
                      <video 
                        ref={videoRef}
                        src={currentLecture.videoUrl || "/sample-video.mp4"} 
                        controls 
                        className="w-full h-full"
                        poster={currentLecture.thumbnail || course.thumbnail}
                        onEnded={handleVideoEnd}
                      />
                    </div>
                  )}
                  {activeTab === 'aiLearning' && (
                    <div className="w-full aspect-video bg-gradient-to-b from-gray-100 to-white flex items-center justify-center">
                      <AILearning course={course} currentLecture={currentLecture} />
                    </div>
                  )}
                </div>
                
                <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto w-full">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-black">{currentLecture.title}</h2>
                    <p className="text-sm text-gray-500 mt-1">Lecture {currentLectureIndex + 1} of {course.lectures.length}</p>
                  </div>
                  
                  {/* Status Bar */}
                  <div className="mb-8">
                    {isLectureCompleted ? (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 flex items-center shadow-sm">
                        <div className="bg-green-100 p-3 rounded-full mr-4">
                          <FaCheckCircle className="text-green-500 text-2xl" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-black text-lg">
                            Lecture Completed
                          </h3>
                          <p className="text-gray-600 mt-1">
                            {hasQuiz && !isQuizCompleted ? 
                              "Great work! You've completed this lecture. Ready to test your knowledge with a quiz?" : 
                              "You've mastered this content. Feel free to continue to the next lecture."}
                          </p>
                        </div>
                        {hasQuiz && !isQuizCompleted && (
                          <button
                            onClick={() => setActiveTab('quiz')}
                            className="px-5 py-3 bg-[#0A4D7C] text-white rounded-lg hover:bg-[#083d63] transition-colors duration-300 font-medium whitespace-nowrap ml-4 shadow-md"
                          >
                            <FaQuestionCircle className="inline mr-2" /> Take Quiz
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="bg-gray-100 p-3 rounded-full mr-4">
                              <FaBookmark className="text-[#0A4D7C] text-2xl" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-black text-lg">
                                Mark This Lecture as Complete
                              </h3>
                              <p className="text-gray-600 mt-1">
                                Click the button to mark this lecture as completed and continue your learning journey
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={handleMarkLectureComplete}
                            disabled={updatingProgress}
                            className={`px-6 py-3 bg-[#0A4D7C] text-white rounded-lg hover:bg-[#083d63] transition-colors duration-300 font-medium ml-4 shadow-md ${
                              updatingProgress ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                          >
                            {updatingProgress ? (
                              <span className="flex items-center">
                                <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                                Processing...
                              </span>
                            ) : (
                              <>
                                <FaCheck className="inline mr-2" /> Mark Complete
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Tabs */}
                  <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto">
                      <button
                        onClick={() => setActiveTab('video')}
                        className={`px-1 py-3 text-md font-medium border-b-2 transition-colors duration-300 ${
                          activeTab === 'video'
                            ? 'border-[#0A4D7C] text-[#0A4D7C]'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Video Content
                      </button>
                      <button
                        onClick={() => setActiveTab('aiLearning')}
                        className={`px-1 py-3 text-md font-medium border-b-2 flex items-center transition-colors duration-300 ${
                          activeTab === 'aiLearning'
                            ? 'border-[#0A4D7C] text-[#0A4D7C]'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <FaRobot className="mr-2" /> AI Learning
                      </button>
                      <button
                        onClick={() => setActiveTab('summary')}
                        className={`px-1 py-3 text-md font-medium border-b-2 flex items-center transition-colors duration-300 ${
                          activeTab === 'summary'
                            ? 'border-[#0A4D7C] text-[#0A4D7C]'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <FaRobot className="mr-2" /> AI Summary
                      </button>
                      <button
                        onClick={() => setActiveTab('notes')}
                        className={`px-1 py-3 text-md font-medium border-b-2 transition-colors duration-300 ${
                          activeTab === 'notes'
                            ? 'border-[#0A4D7C] text-[#0A4D7C]'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        My Notes
                      </button>
                      <button
                        onClick={() => setActiveTab('resources')}
                        className={`px-1 py-3 text-md font-medium border-b-2 transition-colors duration-300 ${
                          activeTab === 'resources'
                            ? 'border-[#0A4D7C] text-[#0A4D7C]'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Resources
                      </button>
                      <button
                        onClick={() => setActiveTab('chat')}
                        className={`px-1 py-3 text-md font-medium border-b-2 flex items-center transition-colors duration-300 ${
                          activeTab === 'chat'
                            ? 'border-[#0A4D7C] text-[#0A4D7C]'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <FaCommentDots className="mr-2" /> Instructor Chat
                      </button>
                      <button
                        onClick={() => setActiveTab('questions')}
                        className={`px-1 py-3 text-md font-medium border-b-2 flex items-center transition-colors duration-300 ${
                          activeTab === 'questions'
                            ? 'border-[#0A4D7C] text-[#0A4D7C]'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <FaQuestionCircle className="mr-2" /> Q&A
                      </button>
                      <button
                        onClick={() => setActiveTab('quiz')}
                        className={`px-1 py-3 text-md font-medium border-b-2 flex items-center transition-colors duration-300 ${
                          activeTab === 'quiz'
                            ? 'border-[#0A4D7C] text-[#0A4D7C]'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <FaQuestionCircle className="mr-2" /> Quiz
                      </button>
                    </nav>
                  </div>
                  
                  {/* Tab Content */}
                  <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                    {activeTab === 'video' && (
                      <div className="prose max-w-none text-gray-700">
                        {currentLecture.transcript && (
                          <div className="mt-4">
                            <h4 className="text-lg font-medium text-black mb-3">Lecture Transcript</h4>
                            <div className="mt-2 p-4 bg-gray-50 rounded-lg text-gray-600 max-h-96 overflow-y-auto border border-gray-200 shadow-inner">
                              {currentLecture.transcript}
                            </div>
                          </div>
                        )}
                        
                        {!isLectureCompleted && (
                          <div className="mt-8 pt-6 border-t border-gray-200">
                            <button
                              onClick={handleMarkLectureComplete}
                              disabled={updatingProgress}
                              className={`px-6 py-3 bg-[#0A4D7C] text-white rounded-lg hover:bg-[#083d63] transition-colors duration-300 flex items-center shadow-md ${
                                updatingProgress ? 'opacity-70 cursor-not-allowed' : ''
                              }`}
                            >
                              {updatingProgress ? (
                                <span className="flex items-center">
                                  <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                                  Marking lecture as complete...
                                </span>
                              ) : (
                                <>
                                  <FaCheck className="mr-2" /> Mark Lecture as Complete
                                </>
                              )}
                            </button>
                          </div>
                        )}
                        
                        {hasQuiz && isLectureCompleted && !isQuizCompleted && (
                          <div className="mt-8 pt-6 border-t border-gray-200">
                            <button
                              onClick={() => setActiveTab('quiz')}
                              className="px-6 py-3 bg-[#0A4D7C] text-white rounded-lg hover:bg-[#083d63] transition-colors duration-300 flex items-center shadow-md"
                            >
                              <FaQuestionCircle className="mr-2" />
                              Take Quiz Now
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {activeTab === 'summary' && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                        <div className="flex items-center mb-4">
                          <div className="bg-gray-100 p-2 rounded-full">
                            <FaRobot className="text-[#0A4D7C] text-xl" />
                          </div>
                          <h3 className="text-xl font-semibold text-black ml-3">AI-Generated Summary</h3>
                        </div>
                        
                        {currentLecture.aiSummary ? (
                          <div className="bg-white rounded-lg p-5 shadow-inner border border-gray-200">
                            <h4 className="font-medium text-black mb-3 text-lg">Key Points:</h4>
                            <p className="text-gray-600 leading-relaxed">{currentLecture.aiSummary}</p>
                          </div>
                        ) : (
                          <div className="bg-white rounded-lg p-5 shadow-inner border border-gray-200">
                            <p className="text-gray-500">No AI summary is available for this lecture yet.</p>
                          </div>
                        )}
                        
                        {!isLectureCompleted && (
                          <div className="mt-6 pt-4 border-t border-gray-200">
                            <button
                              onClick={handleMarkLectureComplete}
                              disabled={updatingProgress}
                              className={`px-6 py-3 bg-[#0A4D7C] text-white rounded-lg hover:bg-[#083d63] transition-colors duration-300 flex items-center shadow-md ${
                                updatingProgress ? 'opacity-70 cursor-not-allowed' : ''
                              }`}
                            >
                              {updatingProgress ? (
                                <span className="flex items-center">
                                  <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                                  Marking...
                                </span>
                              ) : (
                                <>
                                  <FaCheck className="mr-2" /> Mark Lecture as Complete
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {activeTab === 'notes' && (
                      <div>
                        <Notes 
                          courseId={courseId}
                          lectureId={currentLecture._id}
                          lectureTitle={currentLecture.title}
                        />
                        
                        {!isLectureCompleted && (
                          <div className="mt-8 pt-6 border-t border-gray-200">
                            <button
                              onClick={handleMarkLectureComplete}
                              disabled={updatingProgress}
                              className={`px-6 py-3 bg-[#0A4D7C] text-white rounded-lg hover:bg-[#083d63] transition-colors duration-300 flex items-center shadow-md ${
                                updatingProgress ? 'opacity-70 cursor-not-allowed' : ''
                              }`}
                            >
                              {updatingProgress ? (
                                <span className="flex items-center">
                                  <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                                  Marking...
                                </span>
                              ) : (
                                <>
                                  <FaCheck className="mr-2" /> Mark Lecture as Complete
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {activeTab === 'resources' && (
                      <div>
                        <h3 className="text-xl font-semibold text-black mb-4">Lecture Resources</h3>
                        {currentLecture.resources && currentLecture.resources.length > 0 ? (
                          <div className="grid gap-4">
                            {currentLecture.resources.map((resource, index) => (
                              <div 
                                key={index}
                                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-300 shadow-sm"
                              >
                                <div className="bg-gray-50 p-3 rounded-lg mr-4 text-[#0A4D7C]">
                                  {resource.fileType === 'pdf' ? <FaFilePdf className="text-2xl" /> : <FaFileAlt className="text-2xl" />}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-black">{resource.title}</p>
                                  <p className="text-sm text-gray-500 mt-1">
                                    {resource.fileType.toUpperCase()} • {resource.fileSize || '2.5 MB'}
                                  </p>
                                </div>
                                <button 
                                  onClick={() => handleDownloadResource(resource)}
                                  className="ml-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-300 flex items-center shadow-sm"
                                  title="Download"
                                >
                                  <FaFileDownload className="mr-2" /> Download
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-5 bg-gray-50 rounded-lg text-center border border-gray-200 shadow-inner">
                            <p className="text-gray-500">No downloadable resources are available for this lecture.</p>
                          </div>
                        )}
                        
                        {!isLectureCompleted && (
                          <div className="mt-8 pt-6 border-t border-gray-200">
                            <button
                              onClick={handleMarkLectureComplete}
                              disabled={updatingProgress}
                              className={`px-6 py-3 bg-[#0A4D7C] text-white rounded-lg hover:bg-[#083d63] transition-colors duration-300 flex items-center shadow-md ${
                                updatingProgress ? 'opacity-70 cursor-not-allowed' : ''
                              }`}
                            >
                              {updatingProgress ? (
                                <span className="flex items-center">
                                  <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                                  Marking...
                                </span>
                              ) : (
                                <>
                                  <FaCheck className="mr-2" /> Mark Lecture as Complete
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'chat' && (
                      <InstructorChat courseId={courseId} course={course} lectureId={currentLecture._id} />
                    )}

                    {activeTab === 'questions' && (
                      <LectureQuestions courseId={courseId} lectureId={currentLecture._id} currentUser={currentUser} />
                    )}

                    {activeTab === 'quiz' && (
                      <>
                        {!isLectureCompleted ? (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 flex items-center shadow-sm">
                            <div className="bg-gray-100 p-3 rounded-full mr-4">
                              <FaExclamationCircle className="text-[#0A4D7C] text-2xl" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-black text-lg">
                                Complete Lecture First
                              </h3>
                              <p className="text-gray-600 mt-1">
                                Please watch the video and mark the lecture as complete before taking the quiz.
                              </p>
                            </div>
                            <button
                              onClick={handleMarkLectureComplete}
                              disabled={updatingProgress}
                              className={`px-5 py-3 bg-[#0A4D7C] text-white rounded-lg hover:bg-[#083d63] transition-colors duration-300 font-medium whitespace-nowrap ml-4 shadow-md ${
                                updatingProgress ? 'opacity-70 cursor-not-allowed' : ''
                              }`}
                            >
                              {updatingProgress ? (
                                <span className="flex items-center">
                                  <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                                  Marking...
                                </span>
                              ) : (
                                <>
                                  <FaCheck className="inline mr-2" /> Mark Complete
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <Quiz 
                            quiz={{
                              lectureId: currentLecture._id,
                              courseId: courseId,
                              quizId: currentLecture.quizzes && currentLecture.quizzes.length > 0 
                                ? currentLecture.quizzes[0]
                                : null,
                              lectureTitle: currentLecture.title,
                              transcript: currentLecture.transcript || '',
                              aiSummary: currentLecture.aiSummary || ''
                            }}
                            onComplete={handleQuizCompletion}
                            onBack={() => setActiveTab('video')}
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                <div className="mt-auto border-t border-gray-200 p-5 bg-white shadow-md">
                  <div className="max-w-5xl mx-auto flex justify-between">
                    <button
                      onClick={handlePreviousLecture}
                      disabled={currentLectureIndex === 0}
                      className={`flex items-center px-5 py-3 rounded-lg transition-colors duration-300 ${
                        currentLectureIndex === 0
                          ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                          : 'text-[#0A4D7C] bg-gray-100 hover:bg-gray-200'
                      } shadow-sm`}
                    >
                      <FaChevronLeft className="mr-2" />
                      Previous Lecture
                    </button>
                    <button
                      onClick={handleNextLecture}
                      disabled={currentLectureIndex === course.lectures.length - 1 || !isLectureCompleted}
                      className={`flex items-center px-5 py-3 rounded-lg transition-colors duration-300 ${
                        currentLectureIndex === course.lectures.length - 1 || !isLectureCompleted
                          ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                          : 'text-white bg-[#0A4D7C] hover:bg-[#083d63] shadow-md'
                      }`}
                    >
                      Next Lecture
                      <FaChevronRight className="ml-2" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    
    {/* Course Completion Modal */}
    {showCourseCompletionModal && (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg p-6 md:p-8 transform transition-all duration-300">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-5">
              <FaTrophy className="text-4xl text-[#0A4D7C]" />
            </div>
            <h2 className="text-2xl font-bold text-black">Congratulations!</h2>
            <p className="text-gray-600 mt-2">
              You've successfully completed the course "{course.title}"
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-5 mb-6 border border-gray-200 shadow-inner">
            <div className="flex justify-between items-center mb-3">
              <span className="text-black font-medium">Your Achievement</span>
              <span className="text-[#0A4D7C] font-bold">{progress}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden mb-4">
              <div 
                className="h-full rounded-full bg-[#0A4D7C]"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              You've completed {completedLectures.length} lectures.
            </p>
          </div>
          
          <div className="grid gap-4 mb-6">
            <button
              onClick={handleCourseCertificate}
              className="flex items-center justify-center px-5 py-3 bg-[#0A4D7C] text-white rounded-lg hover:bg-[#083d63] transition-colors duration-300 font-medium shadow-md"
            >
              <FaCertificate className="mr-2" /> Get Your Certificate
            </button>
            
            <button
              onClick={() => router.push('/courses')}
              className="flex items-center justify-center px-5 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-300 font-medium shadow-sm"
            >
              <FaGraduationCap className="mr-2" /> Explore More Courses
            </button>
          </div>
          
          <div className="text-center">
            <button
              onClick={() => setShowCourseCompletionModal(false)}
              className="text-gray-500 hover:text-black text-sm font-medium transition-colors duration-300"
            >
              Continue Learning
            </button>
          </div>
        </div>
      </div>
    )}
  </>
);
};

export default CourseLearn;