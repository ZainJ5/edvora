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

export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    const courseId = params.courseid;
    const lectureIndex = parseInt(params.lectureid);
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const result = await verifyInstructorCourse(token, courseId);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    const { course } = result;
    
    if (!course.lectures || lectureIndex < 0 || lectureIndex >= course.lectures.length) {
      return NextResponse.json({ error: 'Lecture not found' }, { status: 404 });
    }
    
    const currentLecture = course.lectures[lectureIndex];
    
    const clonedRequest = request.clone();
    const { fields, files } = await parseFormData(clonedRequest);
    
    const publicDir = path.join(process.cwd(), 'public');
    const lecturesDir = path.join(publicDir, 'lectures', courseId);
    const resourcesDir = path.join(publicDir, 'resources', courseId);
    
    ensureDirectoryExists(lecturesDir);
    ensureDirectoryExists(resourcesDir);
    
    const updatedLecture = {
      title: fields.title ? fields.title[0] : currentLecture.title,
      transcript: fields.transcript ? fields.transcript[0] : currentLecture.transcript || '',
      videoUrl: currentLecture.videoUrl,
      resources: [...(currentLecture.resources || [])] 
    };
    
    if (files.videoFile && files.videoFile[0]) {
      const videoFile = files.videoFile[0];
      const uniqueFilename = generateUniqueFilename(videoFile.name);
      const videoPath = path.join(lecturesDir, uniqueFilename);
      
      await saveFile(videoFile, videoPath);
      
      const relativePath = `/lectures/${courseId}/${uniqueFilename}`;
      updatedLecture.videoUrl = relativePath;
    } else if (fields.videoUrl && fields.videoUrl[0]) {
      updatedLecture.videoUrl = fields.videoUrl[0];
    }
    
    if (fields.resourcesData && fields.resourcesData[0]) {
      try {
        const resourcesData = JSON.parse(fields.resourcesData[0]);
        if (fields.replaceResources && fields.replaceResources[0] === 'true') {
          updatedLecture.resources = resourcesData;
        } else {
          const existingUrls = new Set(updatedLecture.resources.map(r => r.fileUrl));
          resourcesData.forEach(resource => {
            if (!existingUrls.has(resource.fileUrl)) {
              updatedLecture.resources.push(resource);
            }
          });
        }
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
          
        updatedLecture.resources.push({
          title: resourceTitle,
          fileUrl: relativePath,
          fileType
        });
      }
    }
    
    if (fields.removeResourceIndices && fields.removeResourceIndices[0]) {
      try {
        const indicesToRemove = JSON.parse(fields.removeResourceIndices[0]);
        if (Array.isArray(indicesToRemove)) {
          updatedLecture.resources = updatedLecture.resources.filter((_, index) => 
            !indicesToRemove.includes(index)
          );
        }
      } catch (error) {
        console.error('Error parsing resource indices to remove:', error);
      }
    }
    
    if (!updatedLecture.title) {
      return NextResponse.json({ 
        error: 'Lecture title is required' 
      }, { status: 400 });
    }
    
    if (!updatedLecture.videoUrl) {
      return NextResponse.json({ 
        error: 'Video content is required' 
      }, { status: 400 });
    }
    
    course.lectures[lectureIndex] = updatedLecture;
    await course.save();
    
    return NextResponse.json({ 
      message: 'Lecture updated successfully',
      lecture: updatedLecture
    });
  } catch (error) {
    console.error('Error in instructor lecture PUT:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    const courseId = params.courseid;
    const lectureIndex = parseInt(params.lectureid);
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const result = await verifyInstructorCourse(token, courseId);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    const { course } = result;
    
    if (!course.lectures || lectureIndex < 0 || lectureIndex >= course.lectures.length) {
      return NextResponse.json({ error: 'Lecture not found' }, { status: 404 });
    }
    
    // Optional: Delete the physical files associated with this lecture
    // This would require additional code to track and remove the files
    
    course.lectures.splice(lectureIndex, 1);
    await course.save();
    
    return NextResponse.json({ 
      message: 'Lecture deleted successfully'
    });
  } catch (error) {
    console.error('Error in instructor lecture DELETE:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};