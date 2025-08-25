import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/moongose';
import Course from '@/models/course';
import Teacher from '@/models/instructor';
import fs from 'fs';
import path from 'path';
import { SpeechConfig, AudioConfig, SpeechRecognizer, ResultReason } from 'microsoft-cognitiveservices-speech-sdk';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
      if (!files[name]) files[name] = [];
      files[name].push(value);
    } else {
      if (!fields[name]) fields[name] = [];
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

async function extractAudioFromVideo(videoPath, audioPath) {
  try {
    const command = `ffmpeg -i "${videoPath}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${audioPath}"`;
    await execAsync(command);
    return true;
  } catch (error) {
    console.error('Error extracting audio:', error);
    return false;
  }
}

async function transcribeAudio(audioPath) {
  return new Promise((resolve, reject) => {
    try {
      if (!fs.existsSync(audioPath) || fs.statSync(audioPath).size === 0) {
        return reject(new Error('Audio file is missing or empty'));
      }

      const audioData = fs.readFileSync(audioPath);
      const speechConfig = SpeechConfig.fromSubscription(
        process.env.AZURE_SPEECH_KEY, 
        process.env.AZURE_SPEECH_REGION
      );
      
      speechConfig.speechRecognitionLanguage = "en-US";
      const audioConfig = AudioConfig.fromWavFileInput(audioData);
      const recognizer = new SpeechRecognizer(speechConfig, audioConfig);
      
      let transcript = '';
      
      const timeout = setTimeout(() => {
        console.log('Transcription timed out after 5 minutes');
        recognizer.stopContinuousRecognitionAsync();
        resolve(transcript.trim() || "Transcription timed out");
      }, 5 * 60 * 1000);
      
      recognizer.recognized = (s, e) => {
        if (e.result.reason === ResultReason.RecognizedSpeech) {
          transcript += e.result.text + " ";
          console.log("Recognized text:", e.result.text);
        }
      };
      
      recognizer.canceled = (s, e) => {
        clearTimeout(timeout);
        console.log(`Transcription canceled: ${e.errorCode} - ${e.errorDetails}`);
        recognizer.stopContinuousRecognitionAsync();
        resolve(transcript.trim() || `Transcription canceled: ${e.errorDetails}`);
      };
      
      recognizer.sessionStopped = (s, e) => {
        clearTimeout(timeout);
        console.log('Transcription completed via session stop');
        recognizer.stopContinuousRecognitionAsync();
        resolve(transcript.trim());
      };

      recognizer.recognizing = (s, e) => {
        console.log(`Recognition in progress: ${e.result.text}`);
      };

      recognizer.startContinuousRecognitionAsync(
        () => console.log('Transcription started'),
        (err) => {
          clearTimeout(timeout);
          console.error('Error starting transcription:', err);
          reject(err);
        }
      );

      setTimeout(() => {
        recognizer.stopContinuousRecognitionAsync(
          () => {
            console.log('Forced transcription stop after 180 seconds');
            clearTimeout(timeout);
            resolve(transcript.trim() || "Partial transcription (forced stop)");
          },
          (err) => {
            console.error('Error stopping forced transcription:', err);
            clearTimeout(timeout);
            reject(err);
          }
        );
      }, 180 * 1000);  //Transcription for maximun 3min
    } catch (error) {
      console.error('Transcription setup error:', error);
      reject(error);
    }
  });
}

async function generateAISummary(transcript) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: `Please provide a concise summary of this lecture transcript: ${transcript}`
      })
    });
    
    if (!response.ok) {
      throw new Error(`AI Summary API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.answer;
  } catch (error) {
    console.error('Error generating AI summary:', error);
    return null;
  }
}

export async function POST(request, context) {
  try {
    const { params } = context;
    const courseId = await params.courseid;
    
    const token = request.headers.get('authorization')?.split(' ')[1];
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
        const formData = await parseFormData(request.clone());
        fields = formData.fields;
        files = formData.files;
      } else if (contentType.includes('application/json')) {
        const jsonData = await request.json();
        fields = {};
        files = {};
        
        for (const [key, value] of Object.entries(jsonData)) {
          fields[key] = Array.isArray(value) ? value : [value];
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
    const thumbnailsDir = path.join(publicDir, 'thumbnails', courseId);
    const resourcesDir = path.join(publicDir, 'resources', courseId);
    const tempDir = path.join(publicDir, 'temp');
    
    ensureDirectoryExists(lecturesDir);
    ensureDirectoryExists(thumbnailsDir);
    ensureDirectoryExists(resourcesDir);
    ensureDirectoryExists(tempDir);
    
    const lectureData = {
      title: fields.title ? fields.title[0] : '',
      views: 0,
      resources: []
    };
    
    let videoFullPath = '';
    
    if (files.videoFile && files.videoFile[0]) {
      const videoFile = files.videoFile[0];
      const uniqueFilename = generateUniqueFilename(videoFile.name);
      const videoPath = path.join(lecturesDir, uniqueFilename);
      
      await saveFile(videoFile, videoPath);
      videoFullPath = videoPath;
      
      const relativePath = `/lectures/${courseId}/${uniqueFilename}`;
      lectureData.videoUrl = relativePath;
    } else if (fields.videoUrl && fields.videoUrl[0]) {
      lectureData.videoUrl = fields.videoUrl[0];
    } else {
      return NextResponse.json({ 
        error: 'Video file is required' 
      }, { status: 400 });
    }
    
    if (files.thumbnailFile && files.thumbnailFile[0]) {
      const thumbnailFile = files.thumbnailFile[0];
      const uniqueFilename = generateUniqueFilename(thumbnailFile.name);
      const thumbnailPath = path.join(thumbnailsDir, uniqueFilename);
      
      await saveFile(thumbnailFile, thumbnailPath);
      
      const relativePath = `/thumbnails/${courseId}/${uniqueFilename}`;
      lectureData.thumbnail = relativePath;
    } else if (fields.thumbnail && fields.thumbnail[0]) {
      lectureData.thumbnail = fields.thumbnail[0];
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
        
        const resourceType = fields[`resourceType_${i}`] ?
          fields[`resourceType_${i}`][0] :
          fileType;
          
        const relativePath = `/resources/${courseId}/${uniqueFilename}`;
          
        lectureData.resources.push({
          title: resourceTitle,
          fileUrl: relativePath,
          fileType: resourceType
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
    
    const lectureIndex = course.lectures.length;
    course.lectures.push(lectureData);
    await course.save();
    
    if (videoFullPath) {
      (async () => {
        try {
          console.log('Starting transcription process');
          const audioPath = path.join(tempDir, `audio_${Date.now()}.wav`);
          const audioExtracted = await extractAudioFromVideo(videoFullPath, audioPath);
          
          if (audioExtracted) {
            if (!fs.existsSync(audioPath) || fs.statSync(audioPath).size === 0) {
              console.error('Audio file is missing or empty after extraction');
              return;
            }
            
            console.log(`Audio extracted successfully: ${audioPath}`);
            console.log(`Audio file size: ${fs.statSync(audioPath).size} bytes`);
            
            const transcript = await transcribeAudio(audioPath);
            console.log(`Transcription result: ${transcript.substring(0, 100)}...`);
            
            // Generate AI summary from transcript
            const aiSummary = await generateAISummary(transcript);
            console.log(`AI Summary generated: ${aiSummary?.substring(0, 100)}...`);
            
            await connectDB();
            const updatedCourse = await Course.findById(courseId);
            if (updatedCourse && updatedCourse.lectures && updatedCourse.lectures[lectureIndex]) {
              updatedCourse.lectures[lectureIndex].transcript = transcript;
              
              if (aiSummary) {
                updatedCourse.lectures[lectureIndex].aiSummary = aiSummary;
              }
              
              await updatedCourse.save();
              console.log('Lecture updated with transcription and AI summary');
            }
            
            try {
              fs.unlinkSync(audioPath);
              console.log('Temporary audio file deleted');
            } catch (cleanupError) {
              console.error('Error deleting temporary file:', cleanupError);
            }
          } else {
            console.log('Audio extraction failed, skipping transcription');
          }
        } catch (error) {
          console.error('Transcription background process error:', error);
        }
      })().catch(err => console.error('Background transcription error:', err));
    }
    
    const responseData = { ...lectureData };

    return NextResponse.json({ 
      message: 'Lecture added successfully. Transcription and AI summary processing in background.',
      lecture: responseData
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