import { NextResponse } from 'next/server';
import connectDB from '@/lib/moongose';
import Course from '@/models/course';
import Teacher from '@/models/instructor';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '3');
    
    await connectDB();
    
    const query = { 
      isPublished: true, 
      category: 'AI' 
    };
    
    const courses = await Course.find(query)
      .select('_id title description thumbnail price originalPrice level rating totalEnrollments createdAt duration instructor')
      .sort({ rating: -1, totalEnrollments: -1 }) 
      .limit(limit)
      .lean();
    
    const instructorIds = courses.map(course => course.instructor).filter(Boolean);
    
    const teachers = await Teacher.find({ _id: { $in: instructorIds } })
      .populate('userId', 'name')
      .lean();
    
    const instructorMap = {};
    teachers.forEach(teacher => {
      instructorMap[teacher._id.toString()] = teacher;
    });
    
    const processedCourses = courses.map(course => {
      const instructorId = course.instructor ? course.instructor.toString() : null;
      const instructor = instructorId ? instructorMap[instructorId] : null;
      
      return {
        ...course,
        instructorName: instructor && instructor.userId ? instructor.userId.name : 'Instructor'
      };
    });
    
    return NextResponse.json({ 
      courses: processedCourses,
      success: true 
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch AI courses' },
      { status: 500 }
    );
  }
}