import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/moongose';
import Course from '@/models/course';
import Teacher from '@/models/instructor';
import User from '@/models/user';

export async function GET(request) {
  try {
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
    
    const courses = await Course.find({ instructor: teacher._id })
      .populate({
        path: 'enrolledStudents',
        model: 'User',
        select: 'name email profilePicture lastLogin'
      });
    
    if (!courses || courses.length === 0) {
      return NextResponse.json({ students: [] });
    }
    
    const studentsMap = new Map();
    
    courses.forEach(course => {
      if (course.enrolledStudents && course.enrolledStudents.length > 0) {
        course.enrolledStudents.forEach(student => {
          if (!studentsMap.has(student._id.toString())) {
            studentsMap.set(student._id.toString(), {
              userId: student._id,
              name: student.name,
              email: student.email,
              profilePicture: student.profilePicture,
              lastActive: student.lastLogin,
              enrolledCourses: [{
                _id: course._id,
                title: course.title
              }]
            });
          } else {
            const existingStudent = studentsMap.get(student._id.toString());
            existingStudent.enrolledCourses.push({
              _id: course._id,
              title: course.title
            });
          }
        });
      }
    });
    
    const students = Array.from(studentsMap.values());
    
    students.sort((a, b) => a.name.localeCompare(b.name));
    
    return NextResponse.json({ students });
  } catch (error) {
    console.error('Error fetching students for chat:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}