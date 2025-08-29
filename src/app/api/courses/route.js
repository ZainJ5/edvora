import { NextResponse } from 'next/server';
import connectDB from '@/lib/moongose';
import Course from '@/models/course';
import User from '@/models/user';
import Teacher from '@/models/instructor';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const category = searchParams.get('category');
    const level = searchParams.get('level');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sortBy') || 'newest';
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;
    
    const query = { isPublished: true };
    
    if (category) {
      query.category = category;
    }
    
    if (level) {
      query.level = level;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      
      if (minPrice) {
        query.price.$gte = Number(minPrice);
      }
      
      if (maxPrice) {
        query.price.$lte = Number(maxPrice);
      }
    }
    
    let sortOptions = {};
    
    switch (sortBy) {
      case 'price_low':
        sortOptions = { price: 1 };
        break;
      case 'price_high':
        sortOptions = { price: -1 };
        break;
      case 'rating':
        sortOptions = { rating: -1 };
        break;
      case 'popularity':
        sortOptions = { totalEnrollments: -1 };
        break;
      case 'newest':
      default:
        sortOptions = { createdAt: -1 };
    }
    
    await connectDB();
    
    const totalCourses = await Course.countDocuments(query);
    
    const courses = await Course.find(query)
      .select('title description thumbnail price originalPrice level category tags rating totalEnrollments createdAt duration instructor')
      .sort(sortOptions)
      .skip(skip)
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
      pagination: {
        total: totalCourses,
        page,
        limit,
        pages: Math.ceil(totalCourses / limit)
      },
      success: true 
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}