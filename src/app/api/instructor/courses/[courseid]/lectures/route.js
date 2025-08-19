import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/moongose';
import Course from '@/models/course';
import Teacher from '@/models/instructor';
import fs from 'fs';
import path from 'path';

const ensureDirectoryExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
  return directory;
};

const saveFile = async (file, destinationPath) => {
  const buffer = await file.arrayBuffer();
  const fileBuffer = Buffer.from(buffer);
  fs.writeFileSync(destinationPath, fileBuffer);
  return destinationPath;
};

const generateUniqueFilename = (originalFilename) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = path.extname(originalFilename);
  const baseName = path.basename(originalFilename, extension);
  return `${baseName}_${timestamp}_${randomString}${extension}`;
};

async function parseFormData(request) {
  const formData = await request.formData();
  const fields = {};
  const files = {};

  for (const [name, value] of formData.entries()) {
    if (value instanceof File) {
      if (!files[name]) {
        files[name] = [];
      }
      files[name].push(value);
    } else {
      if (!fields[name]) {
        fields[name] = [];
      }
      fields[name].push(value);
    }
  }

  return { fields, files };
}

async function verifyInstructorCourse(token, courseId) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
  if (decoded.role !== 'instructor') {
    return { error: 'Forbidden', status: 403 };
  }
  
  await connectDB();
  
  const teacher = await Teacher.findOne({ userId: decoded.userId });
  
  if (!teacher) {
    return { error: 'Teacher profile not found', status: 404 };
  }
  
  const course = await Course.findById(courseId);
  
  if (!course) {
    return { error: 'Course not found', status: 404 };
  }
  
  if (course.instructor.toString() !== teacher._id.toString()) {
    return { error: 'You do not have permission to access this course', status: 403 };
  }
  
  return { teacher, course };
}

export async function POST(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    const courseId = params.courseid;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const result = await verifyInstructorCourse(token, courseId);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    const { course } = result;
    
    const contentType = request.headers.get('content-type') || '';
    let fields, files;
    
    try {
      if (contentType.includes('multipart/form-data')) {
        const clonedRequest = request.clone();
        const formData = await parseFormData(clonedRequest);
        fields = formData.fields;
        files = formData.files;
      } else if (contentType.includes('application/json')) {
        // For JSON data
        const jsonData = await request.json();
        fields = {};
        files = {};
        
        for (const [key, value] of Object.entries(jsonData)) {
          if (Array.isArray(value)) {
            fields[key] = value;
          } else {
            fields[key] = [value];
          }
        }
      } else {
        return NextResponse.json({ 
          error: 'Unsupported content type. Use multipart/form-data or application/json'
        }, { status: 400 });
      }
    } catch (error) {
      console.error('Error parsing request data:', error);
      return NextResponse.json({ 
        error: 'Error parsing request data: ' + error.message
      }, { status: 400 });
    }
    
    const publicDir = path.join(process.cwd(), 'public');
    const lecturesDir = path.join(publicDir, 'lectures', courseId);
    const resourcesDir = path.join(publicDir, 'resources', courseId);
    
    ensureDirectoryExists(lecturesDir);
    ensureDirectoryExists(resourcesDir);
    
    const lectureData = {
      title: fields.title ? fields.title[0] : '',
      transcript: fields.transcript ? fields.transcript[0] : '',
      resources: []
    };
    
    if (files.videoFile && files.videoFile[0]) {
      const videoFile = files.videoFile[0];
      const uniqueFilename = generateUniqueFilename(videoFile.name);
      const videoPath = path.join(lecturesDir, uniqueFilename);
      
      await saveFile(videoFile, videoPath);
      
      const relativePath = `/lectures/${courseId}/${uniqueFilename}`;
      lectureData.videoUrl = relativePath;
    } else if (fields.videoUrl && fields.videoUrl[0]) {
      lectureData.videoUrl = fields.videoUrl[0];
    } else {
      return NextResponse.json({ 
        error: 'Video file is required' 
      }, { status: 400 });
    }
    
    if (fields.resourcesData && fields.resourcesData[0]) {
      try {
        const resourcesData = JSON.parse(fields.resourcesData[0]);
        lectureData.resources = resourcesData;
      } catch (error) {
        console.error('Error parsing resources data:', error);
      }
    }
    
    if (files.resourceFiles) {
      const resourceFiles = Array.isArray(files.resourceFiles) ? files.resourceFiles : [files.resourceFiles];
      
      for (let i = 0; i < resourceFiles.length; i++) {
        const resourceFile = resourceFiles[i];
        const uniqueFilename = generateUniqueFilename(resourceFile.name);
        const resourcePath = path.join(resourcesDir, uniqueFilename);
        
        await saveFile(resourceFile, resourcePath);
        
        const fileExtension = resourceFile.name.split('.').pop().toLowerCase();
        let fileType = 'pdf';
        
        if (['doc', 'docx'].includes(fileExtension)) {
          fileType = 'doc';
        } else if (['ppt', 'pptx'].includes(fileExtension)) {
          fileType = 'ppt';
        } else if (['zip', 'rar'].includes(fileExtension)) {
          fileType = 'zip';
        }
        
        const resourceTitle = fields[`resourceTitle_${i}`] ? 
          fields[`resourceTitle_${i}`][0] : 
          `Resource ${i + 1}`;
        
        const relativePath = `/resources/${courseId}/${uniqueFilename}`;
          
        lectureData.resources.push({
          title: resourceTitle,
          fileUrl: relativePath,
          fileType
        });
      }
    }
    
    if (!lectureData.title) {
      return NextResponse.json({ 
        error: 'Lecture title is required' 
      }, { status: 400 });
    }
    
    if (!lectureData.videoUrl) {
      return NextResponse.json({ 
        error: 'Video content is required' 
      }, { status: 400 });
    }
    
    if (!course.lectures) {
      course.lectures = [];
    }
    
    course.lectures.push(lectureData);
    await course.save();
    
    return NextResponse.json({ 
      message: 'Lecture added successfully',
      lecture: lectureData
    }, { status: 201 });
  } catch (error) {
    console.error('Error in instructor lectures POST:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};