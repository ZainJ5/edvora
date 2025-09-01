import { NextResponse } from 'next/server';
import connectDB from '@/lib/moongose';
import Course from '@/models/course';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json({ success: true, results: [] });
    }

    await connectDB();
    
    const courses = await Course.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ],
      isPublished: true
    })
    .select('_id title thumbnail category level')
    .limit(5)
    .lean();
    
    return NextResponse.json({ 
      success: true,
      results: courses
    });
    
  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search courses' },
      { status: 500 }
    );
  }
}