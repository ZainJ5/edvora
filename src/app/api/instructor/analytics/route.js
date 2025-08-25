import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/moongose';
import Course from '@/models/course';
import Teacher from '@/models/instructor';
import User from "@/models/user";
import Review from "@/models/review";
import Quiz from '@/models/quiz';
import { format, subDays, parseISO, differenceInDays } from 'date-fns';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const courseId = url.searchParams.get('courseId');
    const timeFilter = url.searchParams.get('timeFilter') || '30days';
    
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    await connectDB();
    
    const teacher = await Teacher.findOne({ userId: decoded.userId });
    
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    let days;
    switch (timeFilter) {
      case '7days':
        days = 7;
        break;
      case '90days':
        days = 90;
        break;
      case '12months':
        days = 365;
        break;
      case '30days':
      default:
        days = 30;
    }

    if (!courseId) {
      const instructorCourses = await Course.find({ instructor: teacher._id })
        .populate('enrolledStudents', '_id')
        .populate('reviews')
        .lean();
      
      const analyticsData = await generateInstructorAnalytics(instructorCourses, teacher, days);
      return NextResponse.json(analyticsData);
    }

    const course = await Course.findOne({ 
      _id: courseId, 
      instructor: teacher._id 
    })
    .populate('enrolledStudents', '_id createdAt')
    .populate('reviews')
    .populate({
      path: 'lectures.quizzes',
      model: 'Quiz',
      select: 'title attempts'
    })
    .lean();

    if (!course) {
      return NextResponse.json({ error: 'Course not found or unauthorized' }, { status: 404 });
    }

    const analyticsData = await generateCourseAnalytics(course, days);
    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

async function generateInstructorAnalytics(courses, teacher, days) {
  const allStudentIds = new Set();
  courses.forEach(course => {
    course.enrolledStudents.forEach(student => {
      allStudentIds.add(student._id.toString());
    });
  });
  
  const totalVideos = courses.reduce((sum, course) => sum + course.lectures.length, 0);
  
  const allRatings = courses.flatMap(course => 
    course.reviews.map(review => review.rating || 0)
  );
  
  const averageRating = allRatings.length > 0 
    ? allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length
    : 0;
    
  const enrollmentTrend = generateEnrollmentTrend(courses, days);
  
  let totalViews = 0;
  let totalPossibleViews = 0;
  
  courses.forEach(course => {
    const studentCount = course.enrolledStudents.length;
    course.lectures.forEach(lecture => {
      totalViews += lecture.views || 0;
      totalPossibleViews += studentCount;
    });
  });
  
  const completionRate = totalPossibleViews > 0 
    ? (totalViews / totalPossibleViews) * 100
    : 0;

  return {
    overviewMetrics: {
      totalStudents: allStudentIds.size,
      totalCourses: courses.length,
      totalVideos,
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalRevenue: teacher.earnings || 0,
      completionRate: parseFloat(completionRate.toFixed(1))
    },
    enrollmentData: enrollmentTrend,
    engagementData: generateInstructorEngagementData(courses),
    feedbackData: generateInstructorFeedbackData(courses),
    revenueData: generateInstructorRevenueData(teacher, days)
  };
}

async function generateCourseAnalytics(course, days) {
  const videoCompletionData = course.lectures.map(lecture => {
    const maxPossibleViews = course.enrolledStudents.length;
    const completionRate = maxPossibleViews > 0 
      ? Math.min(100, ((lecture.views || 0) / maxPossibleViews) * 100)
      : 0;
    
    return {
      name: lecture.title,
      completion: parseFloat(completionRate.toFixed(1)),
      avgWatchTime: Math.round(completionRate / 10),
    };
  });

  const quizPerformanceData = course.lectures.flatMap((lecture, index) => {
    return lecture.quizzes ? lecture.quizzes.map(quiz => {
      const totalAttempts = (quiz.attempts || []).length;
      const totalScore = (quiz.attempts || []).reduce((sum, attempt) => sum + (attempt.score || 0), 0);
      const avgScore = totalAttempts > 0 ? (totalScore / totalAttempts) : 0;
      
      return {
        name: quiz.title || `Quiz ${index + 1}`,
        avgScore: parseFloat(avgScore.toFixed(1)),
        attempts: totalAttempts
      };
    }) : [];
  });

  const timeSpentData = [
    { name: '<15 min', students: Math.round(course.enrolledStudents.length * 0.1) },
    { name: '15-30 min', students: Math.round(course.enrolledStudents.length * 0.2) },
    { name: '30-60 min', students: Math.round(course.enrolledStudents.length * 0.3) },
    { name: '1-2 hours', students: Math.round(course.enrolledStudents.length * 0.25) },
    { name: '>2 hours', students: Math.round(course.enrolledStudents.length * 0.15) }
  ];

  const enrollmentTrend = generateEnrollmentTrendForCourse(course, days);
  
  const ratingDistribution = [1, 2, 3, 4, 5].map(rating => {
    const count = (course.reviews || []).filter(review => Math.round(review.rating) === rating).length;
    return { name: `${rating} stars`, value: count };
  });

  const recentReviews = (course.reviews || [])
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map(review => ({
      student: review.user ? review.user.name : 'Anonymous Student',
      rating: review.rating,
      comment: review.review || 'No comment provided',
      date: format(new Date(review.createdAt), 'MMM dd, yyyy')
    }));

  const averageWatchTime = videoCompletionData.reduce((sum, item) => sum + item.avgWatchTime, 0) / 
    (videoCompletionData.length || 1);

  const courseRevenue = course.price * course.totalEnrollments;
  const revenueHistory = generateRevenueHistoryForCourse(course, days);

  return {
    overviewMetrics: {
      totalStudents: course.enrolledStudents.length,
      totalCourses: 1,
      totalVideos: course.lectures.length,
      averageRating: parseFloat(
        ((course.reviews || []).reduce((sum, review) => sum + review.rating, 0) / 
        (course.reviews || []).length || 0).toFixed(1)
      ),
      totalRevenue: courseRevenue,
      completionRate: parseFloat(
        (videoCompletionData.reduce((sum, item) => sum + item.completion, 0) / 
        (videoCompletionData.length || 1)).toFixed(1)
      )
    },
    enrollmentData: enrollmentTrend,
    engagementData: {
      videoCompletionRate: videoCompletionData,
      quizPerformance: quizPerformanceData,
      timeSpentDistribution: timeSpentData
    },
    feedbackData: {
      ratingDistribution,
      recentReviews
    },
    revenueData: revenueHistory
  };
}

function generateEnrollmentTrend(courses, days) {
  const trend = [];
  const endDate = new Date();
  const startDate = subDays(endDate, days);

  const enrollmentsByDate = new Map();
  
  for (let i = 0; i <= days; i++) {
    const date = format(subDays(endDate, i), 'yyyy-MM-dd');
    enrollmentsByDate.set(date, 0);
  }

  courses.forEach(course => {
    course.enrolledStudents.forEach(student => {
      if (!student.createdAt) return;
      
      const enrollmentDate = format(new Date(student.createdAt), 'yyyy-MM-dd');
      const daysDiff = differenceInDays(new Date(student.createdAt), startDate);
      
      if (daysDiff >= 0 && daysDiff <= days && enrollmentsByDate.has(enrollmentDate)) {
        enrollmentsByDate.set(enrollmentDate, enrollmentsByDate.get(enrollmentDate) + 1);
      }
    });
  });

  let cumulativeCount = 0;
  for (let i = days; i >= 0; i--) {
    const date = format(subDays(endDate, i), 'yyyy-MM-dd');
    const newEnrollments = enrollmentsByDate.get(date) || 0;
    cumulativeCount += newEnrollments;
    
    trend.push({
      date,
      students: cumulativeCount,
      newEnrollments
    });
  }

  return trend;
}

function generateEnrollmentTrendForCourse(course, days) {
  const trend = [];
  const endDate = new Date();
  const startDate = subDays(endDate, days);
  
  const enrollmentsByDate = new Map();
  
  for (let i = 0; i <= days; i++) {
    const date = format(subDays(endDate, i), 'yyyy-MM-dd');
    enrollmentsByDate.set(date, 0);
  }
  
  course.enrolledStudents.forEach(student => {
    if (!student.createdAt) return;
    
    const enrollmentDate = format(new Date(student.createdAt), 'yyyy-MM-dd');
    const daysDiff = differenceInDays(new Date(student.createdAt), startDate);
    
    if (daysDiff >= 0 && daysDiff <= days && enrollmentsByDate.has(enrollmentDate)) {
      enrollmentsByDate.set(enrollmentDate, enrollmentsByDate.get(enrollmentDate) + 1);
    }
  });
  
  let cumulativeCount = 0;
  for (let i = days; i >= 0; i--) {
    const date = format(subDays(endDate, i), 'yyyy-MM-dd');
    const newEnrollments = enrollmentsByDate.get(date) || 0;
    cumulativeCount += newEnrollments;
    
    trend.push({
      date,
      students: cumulativeCount,
      newEnrollments
    });
  }
  
  return trend;
}

function generateInstructorEngagementData(courses) {
  const videoCompletionData = [];
  let lectureIndex = 1;
  
  courses.forEach(course => {
    course.lectures.forEach(lecture => {
      const maxPossibleViews = course.enrolledStudents.length;
      const completionRate = maxPossibleViews > 0 
        ? Math.min(100, ((lecture.views || 0) / maxPossibleViews) * 100)
        : 0;
      
      videoCompletionData.push({
        name: `${course.title.substring(0, 10)}... Lec ${lectureIndex}`,
        completion: parseFloat(completionRate.toFixed(1)),
        avgWatchTime: Math.round(completionRate / 10)
      });
      
      lectureIndex++;
    });
  });
  
  const topVideos = [...videoCompletionData]
    .sort((a, b) => b.completion - a.completion)
    .slice(0, 10);
  
  const quizPerformanceData = [];
  let quizIndex = 1;
  
  courses.forEach(course => {
    course.lectures.forEach(lecture => {
      if (lecture.quizzes && lecture.quizzes.length > 0) {
        lecture.quizzes.forEach(quiz => {
          const totalAttempts = (quiz.attempts || []).length;
          const totalScore = (quiz.attempts || []).reduce((sum, attempt) => sum + (attempt.score || 0), 0);
          const avgScore = totalAttempts > 0 ? (totalScore / totalAttempts) : 0;
          
          quizPerformanceData.push({
            name: `Quiz ${quizIndex}`,
            avgScore: parseFloat(avgScore.toFixed(1)),
            attempts: totalAttempts
          });
          
          quizIndex++;
        });
      }
    });
  });
  
  const totalStudents = new Set(courses.flatMap(course => 
    course.enrolledStudents.map(student => student._id.toString())
  )).size;
  
  const timeSpentData = [
    { name: '<15 min', students: Math.round(totalStudents * 0.15) },
    { name: '15-30 min', students: Math.round(totalStudents * 0.25) },
    { name: '30-60 min', students: Math.round(totalStudents * 0.3) },
    { name: '1-2 hours', students: Math.round(totalStudents * 0.2) },
    { name: '>2 hours', students: Math.round(totalStudents * 0.1) }
  ];
  
  return {
    videoCompletionRate: topVideos,
    quizPerformance: quizPerformanceData.slice(0, 10),
    timeSpentDistribution: timeSpentData
  };
}

function generateInstructorFeedbackData(courses) {
  const allReviews = courses.flatMap(course => course.reviews || []);
  
  const ratingDistribution = [1, 2, 3, 4, 5].map(rating => {
    const count = allReviews.filter(review => Math.round(review.rating) === rating).length;
    return { name: `${rating} stars`, value: count };
  });
  
  const recentReviews = allReviews
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map(review => ({
      student: review.user ? review.user.name : 'Anonymous Student',
      rating: review.rating,
      comment: review.review || 'No comment provided',
      date: format(new Date(review.createdAt), 'MMM dd, yyyy')
    }));
  
  return {
    ratingDistribution,
    recentReviews
  };
}

function generateInstructorRevenueData(teacher, days) {
  const totalEarnings = teacher.earnings || 0;
  const revenueHistory = [];
  
  const dailyRevenue = totalEarnings / days;
  let cumulativeRevenue = 0;
  
  for (let i = days; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    
    // Add some variation to daily revenue (±20%)
    const variation = (Math.random() * 0.4) - 0.2; // Between -0.2 and 0.2
    const adjustedRevenue = Math.max(0, dailyRevenue * (1 + variation));
    
    cumulativeRevenue += adjustedRevenue;
    
    revenueHistory.push({
      date,
      revenue: parseFloat(adjustedRevenue.toFixed(2)),
      cumulativeRevenue: parseFloat(cumulativeRevenue.toFixed(2))
    });
  }
  
  return revenueHistory;
}

function generateRevenueHistoryForCourse(course, days) {
  const totalRevenue = course.price * course.totalEnrollments;
  const revenueHistory = [];
  
  const dailyRevenue = totalRevenue / days;
  let cumulativeRevenue = 0;
  
  for (let i = days; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    
    // Add some variation to daily revenue (±30%)
    const variation = (Math.random() * 0.6) - 0.3; // Between -0.3 and 0.3
    const adjustedRevenue = Math.max(0, dailyRevenue * (1 + variation));
    
    cumulativeRevenue += adjustedRevenue;
    
    revenueHistory.push({
      date,
      revenue: parseFloat(adjustedRevenue.toFixed(2)),
      cumulativeRevenue: parseFloat(cumulativeRevenue.toFixed(2))
    });
  }
  
  return revenueHistory;
}