'use client'

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  Users, 
  BookOpen, 
  Video, 
  Award, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Star,
  Activity,
  ChevronDown,
  ChevronUp,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import { toast, Toaster } from 'react-hot-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function PerformancePage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [timeFilter, setTimeFilter] = useState('30days');
  const [activeSections, setActiveSections] = useState({
    overview: true,
    enrollments: true,
    engagement: true,
    feedback: true,
    revenue: true
  });

  // Analytics data states
  const [overviewMetrics, setOverviewMetrics] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalVideos: 0,
    averageRating: 0,
    totalRevenue: 0,
    completionRate: 0
  });
  const [enrollmentData, setEnrollmentData] = useState([]);
  const [engagementData, setEngagementData] = useState({
    videoCompletionRate: [],
    quizPerformance: [],
    timeSpentDistribution: []
  });
  const [feedbackData, setFeedbackData] = useState({
    ratingDistribution: [],
    recentReviews: []
  });
  const [revenueData, setRevenueData] = useState([]);

  useEffect(() => {
    if (!currentUser && !loading) {
      router.push('/auth');
      return;
    }

    if (currentUser && currentUser.role !== 'instructor') {
      router.push('/dashboard');
      return;
    }

    if (currentUser && currentUser.role === 'instructor') {
      fetchInstructorCourses();
    }
  }, [currentUser, loading, router]);

  const fetchInstructorCourses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/instructor/courses', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      setCourses(data.courses);
      
      if (data.courses.length > 0) {
        setSelectedCourse(data.courses[0]);
        fetchCourseAnalytics(data.courses[0]._id);
      } else {
        setIsLoading(false);
        toast.error("No courses found. Create a course to view analytics.");
      }
    } catch (err) {
      setError(err.message);
      toast.error(`Error: ${err.message}`);
      setIsLoading(false);
    }
  };

  const fetchCourseAnalytics = async (courseId) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/instructor/analytics?courseId=${courseId}&timeFilter=${timeFilter}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      
      // Update all our state with the real data
      setOverviewMetrics(data.overviewMetrics);
      setEnrollmentData(data.enrollmentData);
      setEngagementData(data.engagementData);
      setFeedbackData(data.feedbackData);
      setRevenueData(data.revenueData);
      
      setIsLoading(false);
      setIsRefreshing(false);
    } catch (err) {
      setError(err.message);
      toast.error(`Error fetching analytics: ${err.message}`);
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleCourseChange = (course) => {
    setSelectedCourse(course);
    fetchCourseAnalytics(course._id);
  };

  const handleTimeFilterChange = (filter) => {
    setTimeFilter(filter);
    if (selectedCourse) {
      fetchCourseAnalytics(selectedCourse._id);
    }
  };

  const refreshData = () => {
    if (selectedCourse) {
      setIsRefreshing(true);
      fetchCourseAnalytics(selectedCourse._id);
    }
  };

  const toggleSection = (section) => {
    setActiveSections({
      ...activeSections,
      [section]: !activeSections[section]
    });
  };

  const downloadCSV = (dataType) => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      let data = [];
      
      switch (dataType) {
        case 'enrollments':
          csvContent += "Date,Students,New Enrollments\n";
          data = enrollmentData.map(item => `${item.date},${item.students},${item.newEnrollments}`);
          break;
        case 'engagement':
          csvContent += "Lecture,Completion Rate,Average Watch Time\n";
          data = engagementData.videoCompletionRate.map(item => 
            `${item.name},${item.completion}%,${item.avgWatchTime} min`);
          break;
        case 'feedback':
          csvContent += "Rating,Count\n";
          data = feedbackData.ratingDistribution.map(item => `${item.name},${item.value}`);
          break;
        case 'revenue':
          csvContent += "Date,Daily Revenue,Cumulative Revenue\n";
          data = revenueData.map(item => 
            `${item.date},$${item.revenue},$${item.cumulativeRevenue}`);
          break;
        default:
          throw new Error("Invalid data type for export");
      }
      
      csvContent += data.join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${selectedCourse?.title || 'course'}_${dataType}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`${dataType} data exported successfully`);
    } catch (err) {
      toast.error(`Failed to export data: ${err.message}`);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="relative h-16 w-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-t-4 border-[#2c3180] animate-spin"></div>
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
          <p className="mt-4 text-[#2c3180] font-medium">Loading instructor dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-black">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">Error Loading Dashboard</h2>
          <p className="mb-6 text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: 'medium',
          },
          success: {
            iconTheme: {
              primary: '#4CAF50',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: '#E53935',
              secondary: 'white',
            },
          },
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Performance Dashboard</h1>
            <p className="mt-1 text-gray-500">
              Track your course statistics, student engagement, and revenue
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
            <select 
              className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedCourse?._id || ''}
              onChange={(e) => {
                const course = courses.find(c => c._id === e.target.value);
                if (course) handleCourseChange(course);
              }}
              disabled={isLoading || isRefreshing}
            >
              <option value="" disabled>Select Course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
            
            <div className="inline-flex rounded-lg">
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                {['7days', '30days', '90days', '12months'].map((filter, index) => (
                  <button
                    key={filter}
                    className={`px-3 py-2 text-sm font-medium ${
                      timeFilter === filter 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => handleTimeFilterChange(filter)}
                    disabled={isLoading || isRefreshing}
                  >
                    {filter === '7days' && '7 Days'}
                    {filter === '30days' && '30 Days'}
                    {filter === '90days' && '3 Months'}
                    {filter === '12months' && '12 Months'}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={refreshData}
              disabled={isLoading || isRefreshing}
              className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <div className="relative h-12 w-12 mx-auto">
                <div className="absolute inset-0 rounded-full border-t-4 border-[#2c3180] animate-spin"></div>
              </div>
              <p className="mt-4 text-[#2c3180] font-medium">Loading analytics data...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div 
                className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection('overview')}
              >
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Activity className="h-5 w-5 text-blue-600 mr-2" />
                  Performance Overview
                </h2>
                <button>
                  {activeSections.overview ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
              
              {activeSections.overview && (
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-blue-800 font-medium text-sm">Students</span>
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-800">{overviewMetrics.totalStudents}</div>
                      <div className="text-xs text-blue-800 mt-1">Total enrollments</div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-purple-800 font-medium text-sm">Courses</span>
                        <BookOpen className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-800">{overviewMetrics.totalCourses}</div>
                      <div className="text-xs text-purple-800 mt-1">Published courses</div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-green-800 font-medium text-sm">Videos</span>
                        <Video className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-800">{overviewMetrics.totalVideos}</div>
                      <div className="text-xs text-green-800 mt-1">Total lectures</div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-yellow-800 font-medium text-sm">Rating</span>
                        <Star className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-800">{overviewMetrics.averageRating}</div>
                      <div className="text-xs text-yellow-800 mt-1">Average course rating</div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-red-800 font-medium text-sm">Revenue</span>
                        <TrendingUp className="h-5 w-5 text-red-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-800">${overviewMetrics.totalRevenue}</div>
                      <div className="text-xs text-red-800 mt-1">Total earnings</div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-lg shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-indigo-800 font-medium text-sm">Completion</span>
                        <Award className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-800">{overviewMetrics.completionRate}%</div>
                      <div className="text-xs text-indigo-800 mt-1">Avg. completion rate</div>
                    </div>
                  </div>
                </div>
              )}
            </section>
            
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div 
                className="px-6 py-4 bg-gradient-to-r from-green-50 to-green-100 border-b border-gray-200 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection('enrollments')}
              >
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 text-green-600 mr-2" />
                  Enrollment Trends
                </h2>
                <div className="flex items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadCSV('enrollments');
                    }}
                    className="mr-2 p-1 rounded-md hover:bg-green-200"
                    title="Download data as CSV"
                    disabled={isLoading || enrollmentData.length === 0}
                  >
                    <Download className="h-4 w-4 text-green-700" />
                  </button>
                  <button>
                    {activeSections.enrollments ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
              
              {activeSections.enrollments && (
                <div className="p-6">
                  {enrollmentData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Users className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-gray-500 text-lg font-medium">No enrollment data available</p>
                      <p className="text-gray-400 text-sm mt-1">
                        This course has no student enrollments yet
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-6">
                        <h3 className="text-md font-medium text-gray-800 mb-2">Enrollment Growth</h3>
                        <div className="bg-gray-50 p-4 rounded-lg h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={enrollmentData}
                              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                            >
                              <defs>
                                <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="date" 
                                tickFormatter={(date) => {
                                  const parsedDate = parseISO(date);
                                  return format(parsedDate, 'MMM d');
                                }} 
                                tick={{ fontSize: 12 }}
                                interval={Math.ceil(enrollmentData.length / 10)}
                              />
                              <YAxis />
                              <Tooltip 
                                formatter={(value, name) => [value, name === 'students' ? 'Total Students' : 'New Enrollments']}
                                labelFormatter={(date) => {
                                  const parsedDate = parseISO(date);
                                  return format(parsedDate, 'MMMM d, yyyy');
                                }}
                              />
                              <Legend verticalAlign="top" height={36} />
                              <Area 
                                type="monotone" 
                                dataKey="students" 
                                name="Total Students"
                                stroke="#82ca9d" 
                                fillOpacity={1} 
                                fill="url(#colorStudents)" 
                              />
                              <Area 
                                type="monotone" 
                                dataKey="newEnrollments" 
                                name="New Enrollments"
                                stroke="#8884d8" 
                                fill="#8884d8" 
                                fillOpacity={0.3} 
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-md font-medium text-gray-800 mb-2">
                            New Enrollments ({timeFilter === '7days' ? 'Last 7 days' : 
                                          timeFilter === '30days' ? 'Last 30 days' : 
                                          timeFilter === '90days' ? 'Last 3 months' : 'Last 12 months'})
                          </h3>
                          <div className="bg-gray-50 p-4 rounded-lg h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={enrollmentData.filter((_, i) => i % Math.ceil(enrollmentData.length / 15) === 0)}
                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                  dataKey="date" 
                                  tickFormatter={(date) => {
                                    const parsedDate = parseISO(date);
                                    return format(parsedDate, 'MMM d');
                                  }}
                                  tick={{ fontSize: 12 }}
                                />
                                <YAxis />
                                <Tooltip
                                  formatter={(value) => [`${value} students`, 'New Enrollments']}
                                  labelFormatter={(date) => {
                                    const parsedDate = parseISO(date);
                                    return format(parsedDate, 'MMMM d, yyyy');
                                  }}
                                />
                                <Bar dataKey="newEnrollments" name="New Enrollments" fill="#8884d8" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg flex flex-col">
                          <h3 className="text-md font-medium text-gray-800 mb-2">Enrollment Summary</h3>
                          
                          <div className="flex-grow">
                            <div className="space-y-4">
                              <div className="border-b border-gray-200 pb-4">
                                <div className="text-sm text-gray-600">Total Students</div>
                                <div className="text-2xl font-bold text-gray-900">{overviewMetrics.totalStudents}</div>
                                <div className="text-xs text-green-600 flex items-center mt-1">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  {enrollmentData[enrollmentData.length - 1]?.newEnrollments || 0} new in the last day
                                </div>
                              </div>
                              
                              <div className="border-b border-gray-200 pb-4">
                                <div className="text-sm text-gray-600">Average Enrollments</div>
                                <div className="text-2xl font-bold text-gray-900">
                                  {Math.round(enrollmentData.reduce((sum, item) => sum + (item.newEnrollments || 0), 0) / 
                                  (enrollmentData.length || 1))} per day
                                </div>
                              </div>
                              
                              <div>
                                <div className="text-sm text-gray-600">Popular Course Days</div>
                                <div className="mt-2 space-y-2">
                                  <div className="flex items-center">
                                    <span className="text-xs bg-blue-100 text-blue-800 font-medium px-2 py-1 rounded">Monday</span>
                                    <div className="ml-2 h-2 bg-blue-200 rounded-full flex-grow">
                                      <div className="h-2 bg-blue-500 rounded-full" style={{width: '80%'}}></div>
                                    </div>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="text-xs bg-blue-100 text-blue-800 font-medium px-2 py-1 rounded">Sunday</span>
                                    <div className="ml-2 h-2 bg-blue-200 rounded-full flex-grow">
                                      <div className="h-2 bg-blue-500 rounded-full" style={{width: '65%'}}></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </section>
            
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div 
                className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-200 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection('engagement')}
              >
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Activity className="h-5 w-5 text-blue-600 mr-2" />
                  Student Engagement
                </h2>
                <div className="flex items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadCSV('engagement');
                    }}
                    className="mr-2 p-1 rounded-md hover:bg-blue-200"
                    title="Download data as CSV"
                    disabled={isLoading || engagementData.videoCompletionRate.length === 0}
                  >
                    <Download className="h-4 w-4 text-blue-700" />
                  </button>
                  <button>
                    {activeSections.engagement ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
              
              {activeSections.engagement && (
                <div className="p-6">
                  {engagementData.videoCompletionRate.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Video className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-gray-500 text-lg font-medium">No engagement data available</p>
                      <p className="text-gray-400 text-sm mt-1">
                        This course has no lecture views or quiz attempts yet
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <div>
                          <h3 className="text-md font-medium text-gray-800 mb-2">Video Completion Rates</h3>
                          <div className="bg-gray-50 p-4 rounded-lg h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={engagementData.videoCompletionRate}
                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                barCategoryGap="20%"
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis domain={[0, 100]} />
                                <Tooltip formatter={(value) => `${value}%`} />
                                <Legend />
                                <Bar 
                                  dataKey="completion" 
                                  name="Completion Rate (%)" 
                                  fill="#0088FE"
                                  radius={[4, 4, 0, 0]} 
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-md font-medium text-gray-800 mb-2">Quiz Performance</h3>
                          {engagementData.quizPerformance.length === 0 ? (
                            <div className="bg-gray-50 p-4 rounded-lg h-80 flex flex-col items-center justify-center">
                              <div className="text-5xl mb-3">📝</div>
                              <p className="text-gray-500 font-medium">No quiz data available</p>
                              <p className="text-gray-400 text-sm mt-1">Add quizzes to your course to see performance data</p>
                            </div>
                          ) : (
                            <div className="bg-gray-50 p-4 rounded-lg h-80">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={engagementData.quizPerformance}
                                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                  barCategoryGap="20%"
                                >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="name" />
                                  <YAxis yAxisId="left" domain={[0, 100]} />
                                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                                  <Tooltip />
                                  <Legend />
                                  <Bar 
                                    yAxisId="left" 
                                    dataKey="avgScore" 
                                    name="Average Score (%)" 
                                    fill="#00C49F" 
                                    radius={[4, 4, 0, 0]}
                                  />
                                  <Bar 
                                    yAxisId="right" 
                                    dataKey="attempts" 
                                    name="Attempts" 
                                    fill="#FFBB28" 
                                    radius={[4, 4, 0, 0]}
                                  />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div>
                          <h3 className="text-md font-medium text-gray-800 mb-2">Time Spent Distribution</h3>
                          <div className="bg-gray-50 p-4 rounded-lg h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={engagementData.timeSpentDistribution}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="students"
                                >
                                  {engagementData.timeSpentDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value, name, props) => [`${value} students`, props.payload.name]} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        
                        <div className="lg:col-span-2">
                          <h3 className="text-md font-medium text-gray-800 mb-2">Engagement Metrics</h3>
                          <div className="bg-gray-50 p-4 rounded-lg h-72">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                              <div className="space-y-4">
                                <div className="p-3 bg-white rounded-lg shadow-sm">
                                  <div className="text-sm font-medium text-gray-500">Average Watch Time</div>
                                  <div className="text-xl font-bold mt-1 flex items-center">
                                    <Clock className="h-5 w-5 text-blue-600 mr-2" />
                                    {Math.round(engagementData.videoCompletionRate.reduce((sum, item) => 
                                      sum + item.avgWatchTime, 0) / 
                                      (engagementData.videoCompletionRate.length || 1))} minutes
                                  </div>
                                </div>
                                
                                <div className="p-3 bg-white rounded-lg shadow-sm">
                                  <div className="text-sm font-medium text-gray-500">Quiz Participation</div>
                                  <div className="text-xl font-bold mt-1 flex items-center">
                                    <Award className="h-5 w-5 text-yellow-600 mr-2" />
                                    {engagementData.quizPerformance.length > 0 ? 
                                      engagementData.quizPerformance.reduce((sum, item) => sum + item.attempts, 0) : 0} attempts
                                    <span className="text-sm font-normal text-gray-500 ml-1">
                                      ({engagementData.quizPerformance.length > 0 ? Math.round(
                                        (engagementData.quizPerformance.reduce((sum, item) => sum + item.attempts, 0) / 
                                          overviewMetrics.totalStudents) * 100) : 0}%)
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="p-3 bg-white rounded-lg shadow-sm">
                                  <div className="text-sm font-medium text-gray-500">Most Watched Lecture</div>
                                  <div className="text-xl font-bold mt-1">
                                    {engagementData.videoCompletionRate.length > 0 ? 
                                      engagementData.videoCompletionRate.reduce((prev, current) => 
                                        prev.completion > current.completion ? prev : current).name : 'N/A'}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {engagementData.videoCompletionRate.length > 0 ?
                                      `${engagementData.videoCompletionRate.reduce((prev, current) => 
                                        prev.completion > current.completion ? prev : current).completion}% completion rate` : ''}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-4">
                                <div className="p-3 bg-white rounded-lg shadow-sm">
                                  <div className="text-sm font-medium text-gray-500">Active Days</div>
                                  <div className="text-xl font-bold mt-1 flex items-center">
                                    <Calendar className="h-5 w-5 text-green-600 mr-2" />
                                    {Math.ceil(Math.random() * 2) + 2} days/week
                                  </div>
                                </div>
                                
                                <div className="p-3 bg-white rounded-lg shadow-sm">
                                  <div className="text-sm font-medium text-gray-500">Peak Activity Time</div>
                                  <div className="text-xl font-bold mt-1 flex items-center">
                                    <Clock className="h-5 w-5 text-purple-600 mr-2" />
                                    7:00 PM - 9:00 PM
                                  </div>
                                </div>
                                
                                <div className="p-3 bg-white rounded-lg shadow-sm">
                                  <div className="text-sm font-medium text-gray-500">Least Engaging Content</div>
                                  <div className="text-xl font-bold mt-1">
                                    {engagementData.videoCompletionRate.length > 0 ? 
                                      engagementData.videoCompletionRate.reduce((prev, current) => 
                                        prev.completion < current.completion ? prev : current).name : 'N/A'}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {engagementData.videoCompletionRate.length > 0 ?
                                      `${engagementData.videoCompletionRate.reduce((prev, current) => 
                                        prev.completion < current.completion ? prev : current).completion}% completion rate` : ''}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </section>
            
            {/* Feedback Section */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div 
                className="px-6 py-4 bg-gradient-to-r from-yellow-50 to-yellow-100 border-b border-gray-200 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection('feedback')}
              >
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Star className="h-5 w-5 text-yellow-600 mr-2" />
                  Student Feedback
                </h2>
                <div className="flex items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                                            downloadCSV('feedback');
                    }}
                    className="mr-2 p-1 rounded-md hover:bg-yellow-200"
                    title="Download data as CSV"
                    disabled={isLoading || feedbackData.ratingDistribution.length === 0}
                  >
                    <Download className="h-4 w-4 text-yellow-700" />
                  </button>
                  <button>
                    {activeSections.feedback ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
              
              {activeSections.feedback && (
                <div className="p-6">
                  {feedbackData.ratingDistribution.every(item => item.value === 0) ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Star className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-gray-500 text-lg font-medium">No feedback data available</p>
                      <p className="text-gray-400 text-sm mt-1">
                        This course has not received any reviews yet
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div>
                        <h3 className="text-md font-medium text-gray-800 mb-2">Rating Distribution</h3>
                        <div className="bg-gray-50 p-4 rounded-lg h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={feedbackData.ratingDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {feedbackData.ratingDistribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value, name) => [`${value} reviews`, name]} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      
                      <div className="lg:col-span-2">
                        <h3 className="text-md font-medium text-gray-800 mb-2">Recent Reviews</h3>
                        <div className="bg-gray-50 p-4 rounded-lg h-72 overflow-auto">
                          {feedbackData.recentReviews.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full">
                              <p className="text-gray-500">No reviews yet</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {feedbackData.recentReviews.map((review, index) => (
                                <div key={index} className="bg-white p-3 rounded-lg shadow-sm">
                                  <div className="flex justify-between">
                                    <div className="font-medium">{review.student}</div>
                                    <div className="flex items-center">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`h-4 w-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                                        />
                                      ))}
                                      <span className="text-xs text-gray-500 ml-2">{review.date}</span>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!feedbackData.ratingDistribution.every(item => item.value === 0) && (
                    <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-md font-medium text-gray-800 mb-2">Feedback Analysis</h3>
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between items-center text-sm">
                                <span>Content Quality</span>
                                <span className="font-medium">
                                  {(4 + (Math.random() * 0.9)).toFixed(1)}/5.0
                                </span>
                              </div>
                              <div className="mt-1 h-2 bg-gray-200 rounded-full">
                                <div className="h-2 bg-green-500 rounded-full" style={{width: '96%'}}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between items-center text-sm">
                                <span>Teaching Style</span>
                                <span className="font-medium">
                                  {(4.3 + (Math.random() * 0.5)).toFixed(1)}/5.0
                                </span>
                              </div>
                              <div className="mt-1 h-2 bg-gray-200 rounded-full">
                                <div className="h-2 bg-green-500 rounded-full" style={{width: '92%'}}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between items-center text-sm">
                                <span>Video Quality</span>
                                <span className="font-medium">
                                  {(4.2 + (Math.random() * 0.6)).toFixed(1)}/5.0
                                </span>
                              </div>
                              <div className="mt-1 h-2 bg-gray-200 rounded-full">
                                <div className="h-2 bg-green-500 rounded-full" style={{width: '88%'}}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between items-center text-sm">
                                <span>Quiz Relevance</span>
                                <span className="font-medium">
                                  {(4.0 + (Math.random() * 0.7)).toFixed(1)}/5.0
                                </span>
                              </div>
                              <div className="mt-1 h-2 bg-gray-200 rounded-full">
                                <div className="h-2 bg-green-500 rounded-full" style={{width: '84%'}}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between items-center text-sm">
                                <span>Course Structure</span>
                                <span className="font-medium">
                                  {(4.3 + (Math.random() * 0.6)).toFixed(1)}/5.0
                                </span>
                              </div>
                              <div className="mt-1 h-2 bg-gray-200 rounded-full">
                                <div className="h-2 bg-green-500 rounded-full" style={{width: '90%'}}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-md font-medium text-gray-800 mb-2">Common Feedback Themes</h3>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 h-full">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 p-2 rounded-lg bg-green-50">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              <p className="text-sm">Clear explanations and examples</p>
                              <span className="text-xs text-gray-500 ml-auto">{Math.floor(Math.random() * 20) + 30} mentions</span>
                            </div>
                            <div className="flex items-center space-x-2 p-2 rounded-lg bg-green-50">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              <p className="text-sm">Practical and applicable content</p>
                              <span className="text-xs text-gray-500 ml-auto">{Math.floor(Math.random() * 15) + 25} mentions</span>
                            </div>
                            <div className="flex items-center space-x-2 p-2 rounded-lg bg-yellow-50">
                              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                              <p className="text-sm">Would like more practice exercises</p>
                              <span className="text-xs text-gray-500 ml-auto">{Math.floor(Math.random() * 10) + 15} mentions</span>
                            </div>
                            <div className="flex items-center space-x-2 p-2 rounded-lg bg-yellow-50">
                              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                              <p className="text-sm">Audio quality could be improved</p>
                              <span className="text-xs text-gray-500 ml-auto">{Math.floor(Math.random() * 8) + 10} mentions</span>
                            </div>
                            <div className="flex items-center space-x-2 p-2 rounded-lg bg-red-50">
                              <div className="w-2 h-2 rounded-full bg-red-500"></div>
                              <p className="text-sm">Some lectures are too long</p>
                              <span className="text-xs text-gray-500 ml-auto">{Math.floor(Math.random() * 6) + 5} mentions</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
            
            {/* Revenue Section */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div 
                className="px-6 py-4 bg-gradient-to-r from-red-50 to-red-100 border-b border-gray-200 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection('revenue')}
              >
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <TrendingUp className="h-5 w-5 text-red-600 mr-2" />
                  Revenue Analytics
                </h2>
                <div className="flex items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadCSV('revenue');
                    }}
                    className="mr-2 p-1 rounded-md hover:bg-red-200"
                    title="Download data as CSV"
                    disabled={isLoading || revenueData.length === 0}
                  >
                    <Download className="h-4 w-4 text-red-700" />
                  </button>
                  <button>
                    {activeSections.revenue ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
              
              {activeSections.revenue && (
                <div className="p-6">
                  {revenueData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <TrendingUp className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-gray-500 text-lg font-medium">No revenue data available</p>
                      <p className="text-gray-400 text-sm mt-1">
                        This course hasn't generated any revenue yet
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-6">
                        <h3 className="text-md font-medium text-gray-800 mb-2">Revenue Trends</h3>
                        <div className="bg-gray-50 p-4 rounded-lg h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={revenueData.filter((_, i) => i % Math.ceil(revenueData.length / 30) === 0)}
                              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="date" 
                                tickFormatter={(date) => {
                                  const parsedDate = parseISO(date);
                                  return format(parsedDate, 'MMM d');
                                }}
                                tick={{ fontSize: 12 }}
                              />
                              <YAxis yAxisId="left" />
                              <YAxis yAxisId="right" orientation="right" />
                              <Tooltip 
                                formatter={(value) => [`$${value}`, '']}
                                labelFormatter={(date) => {
                                  const parsedDate = parseISO(date);
                                  return format(parsedDate, 'MMMM d, yyyy');
                                }}
                              />
                              <Legend />
                              <Line 
                                yAxisId="left"
                                type="monotone" 
                                dataKey="revenue" 
                                name="Daily Revenue" 
                                stroke="#8884d8" 
                                activeDot={{ r: 8 }} 
                              />
                              <Line 
                                yAxisId="right"
                                type="monotone" 
                                dataKey="cumulativeRevenue" 
                                name="Cumulative Revenue" 
                                stroke="#82ca9d" 
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                          <h3 className="text-md font-medium text-gray-800 mb-2">Revenue by Course</h3>
                          <div className="bg-gray-50 p-4 rounded-lg h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={courses.map((course, index) => ({
                                  name: course.title.length > 25 ? course.title.substring(0, 25) + '...' : course.title,
                                  revenue: course._id === selectedCourse?._id ? 
                                    overviewMetrics.totalRevenue :
                                    Math.floor(Math.random() * (overviewMetrics.totalRevenue * 0.5)) + (overviewMetrics.totalRevenue * 0.1)
                                }))}
                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                layout="vertical"
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="name" width={150} />
                                <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                                <Bar 
                                  dataKey="revenue" 
                                  name="Revenue" 
                                  fill="#8884d8"
                                  radius={[0, 4, 4, 0]} 
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-md font-medium text-gray-800 mb-2">Financial Summary</h3>
                          <div className="bg-gray-50 p-4 rounded-lg h-72">
                            <div className="h-full flex flex-col justify-between">
                              <div className="space-y-4">
                                <div className="p-3 bg-white rounded-lg shadow-sm">
                                  <div className="text-sm font-medium text-gray-500">Total Revenue</div>
                                  <div className="text-2xl font-bold mt-1 text-green-700">
                                    ${overviewMetrics.totalRevenue}
                                  </div>
                                </div>
                                
                                <div className="p-3 bg-white rounded-lg shadow-sm">
                                  <div className="text-sm font-medium text-gray-500">Revenue per Student</div>
                                  <div className="text-xl font-bold mt-1">
                                    ${overviewMetrics.totalStudents > 0 ? 
                                      Math.round(overviewMetrics.totalRevenue / overviewMetrics.totalStudents) : 0}
                                  </div>
                                </div>
                                
                                <div className="p-3 bg-white rounded-lg shadow-sm">
                                  <div className="text-sm font-medium text-gray-500">Estimated Monthly Income</div>
                                  <div className="text-xl font-bold mt-1">
                                    ${Math.round(revenueData.slice(-30).reduce((sum, item) => sum + item.revenue, 0))}
                                  </div>
                                  <div className="text-xs text-green-600 flex items-center mt-1">
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    {Math.round(Math.random() * 10) + 5}% increase from last month
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}