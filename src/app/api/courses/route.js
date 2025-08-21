import { NextResponse } from 'next/server';
import connectDB from '@/lib/moongose';
import Course from '@/models/course';
import Teacher from '@/models/instructor';


export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const level = searchParams.get('level');
    const search = searchParams.get('search');
    
    let query = { isPublished: true };
    
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
    
    // Execute query
    const courses = await Course.find(query)
      .select('title description category tags price level thumbnail rating instructor')
      .populate({
        path: 'instructor',
        select: 'bio userId',
        populate: {
          path: 'userId',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 });
    
    // Format response
    const formattedCourses = courses.map(course => {
      const instructorName = course.instructor?.userId?.name || 'Unknown Instructor';
      
      return {
        _id: course._id,
        title: course.title,
        description: course.description,
        category: course.category,
        tags: course.tags,
        price: course.price,
        level: course.level,
        thumbnail: course.thumbnail,
        rating: course.rating,
        instructorName
      };
    });
    
    return NextResponse.json({ success: true, courses: formattedCourses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
