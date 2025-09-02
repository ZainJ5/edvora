"use client";

import { useEffect, useRef, useState } from 'react';
import { TalkingHead } from '../../../lib/talkinghead/modules/talkinghead.mjs';

export default function AILearning({ course, currentLecture }) {
  const containerRef = useRef(null);
  const headRef = useRef(null);
  const audioContextRef = useRef(null);
  const [teachingScript, setTeachingScript] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scriptLoading, setScriptLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSegment, setCurrentSegment] = useState(0);
  const scriptSegmentsRef = useRef([]);
  
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
      });
    }
    
    if (!headRef.current && containerRef.current) {
      const init = async () => {
        try {
          while (containerRef.current.firstChild) {
            containerRef.current.removeChild(containerRef.current.firstChild);
          }
          
          const head = new TalkingHead(containerRef.current, {
            ttsEndpoint: {
              fetchTTS: async () => ({ audio: new ArrayBuffer(0), words: [] })
            },
            ttsCustomFetch: true,
            mixerGainSpeech: 5, 
            cameraView: 'upper',
            lipsyncModules: [],
            useManualLipSync: true 
          });
          
          await head.showAvatar({
            url: '/avatar/brunette.glb', 
            body: 'F',
            avatarMood: 'neutral', 
          });
          
          headRef.current = head;
          
          if (currentLecture) {
            generateTeachingScript();
          }
        } catch (err) {
          console.error('Avatar initialization error:', err);
          setError('Failed to initialize avatar: ' + err.message);
        }
      };
      
      init();
    }
    
    return () => {
      if (headRef.current) {
        if (typeof headRef.current.dispose === 'function') {
          headRef.current.dispose();
        }
        headRef.current = null;
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [currentLecture]);

  useEffect(() => {
    if (teachingScript) {
      prepareScriptSegments();
    }
  }, [teachingScript]);

  useEffect(() => {
    if (scriptSegmentsRef.current.length > 0 && !isPlaying && !isLoading) {
      const timer = setTimeout(() => {
        handlePlayPause();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [scriptSegmentsRef.current.length]);

  const prepareScriptSegments = () => {
    const segments = teachingScript
      .split(/(?<=[.!?])\s+/)
      .filter(segment => segment.trim().length > 0)
      .map(segment => segment.trim());
    
    scriptSegmentsRef.current = segments;
    setCurrentSegment(0);
  };

  const azureToOculus = {
    0: 'sil', // silence
    1: 'E',   // ae ax ah
    2: 'aa',  // aa
    3: 'aa',  // ao
    4: 'E',   // eh ey
    5: 'E',   // er
    6: 'I',   // ih iy
    7: 'U',   // uh uw
    8: 'O',   // ow
    9: 'aa',  // aw
    10: 'O',  // oy
    11: 'aa', // ay
    12: 'kk', // k g ng h
    13: 'RR', // r
    14: 'nn', // l n
    15: 'SS', // s z
    16: 'CH', // sh ch jh zh
    17: 'TH', // th dh
    18: 'FF', // f v
    19: 'DD', // d t n
    20: 'PP', // b p m
    21: 'PP', // w
  };

  const visemeIntensity = {
    'sil': 0.0,
    'PP': 0.8,
    'FF': 0.7,
    'TH': 0.6,
    'DD': 0.6,
    'kk': 0.7,
    'CH': 0.7,
    'SS': 0.6,
    'nn': 0.4,
    'RR': 0.5,
    'aa': 0.9,
    'E': 0.7,
    'I': 0.6,
    'O': 0.8,
    'U': 0.7
  };

  const generateTeachingScript = async () => {
    setScriptLoading(true);
    setError(null);
    
    try {
      const prompt = `
        You are an expert AI teacher. Create an engaging 3-5 minute teaching script based on this lecture content.
        Use a conversational, friendly tone and present the material in a clear, structured way.
        Format the script as if you're teaching directly to the student, with natural pauses and transitions.
        
        LECTURE TITLE: ${currentLecture?.title || 'Lecture'}
        
        TRANSCRIPT: ${currentLecture?.transcript || 'No transcript available'}
        
        SUMMARY: ${currentLecture?.aiSummary || 'No summary available'}
        
        Create a teaching script that explains the concepts, provides examples, and engages the student.
        Structure your response as a complete teaching script only, without any prefatory text.
      `;
      
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: prompt })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate teaching script');
      }
      
      const data = await response.json();
      setTeachingScript(data.answer);
    } catch (err) {
      console.error('Error generating teaching script:', err);
      setError('Failed to generate teaching script. Please try again.');
    } finally {
      setScriptLoading(false);
    }
  };

  const speakSegment = async (segmentText) => {
    if (!segmentText || !headRef.current) return false;
    setError(null);
    setIsLoading(true);
    setIsPlaying(true);

    try {
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const response = await fetch('/api/azure-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: segmentText,
          voice: 'en-US-JennyNeural'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'TTS API failed');
      }

      const { audio: base64Audio, visemes } = await response.json();

      if (!base64Audio) {
        throw new Error('No audio data received');
      }

      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const audioArrayBuffer = bytes.buffer;

      const audioBuffer = await audioContextRef.current.decodeAudioData(audioArrayBuffer);
      
      if (!visemes || visemes.length === 0) {
        throw new Error('No viseme data received');
      }

      const sortedVisemes = [...visemes].sort((a, b) => a.audioOffset - b.audioOffset);
      const times = sortedVisemes.map(v => v.audioOffset / 10000000);
      
      const visemeStrings = sortedVisemes.map(v => azureToOculus[v.visemeId] || 'sil');
      
      const durations = [];
      for (let i = 0; i < times.length - 1; i++) {
        durations.push(Math.max(0.05, times[i + 1] - times[i]));
      }
      durations.push(0.1);

      const mouthOpenValues = visemeStrings.map(viseme => {
        switch(viseme) {
          case 'aa': return 0.8;  // Wide open
          case 'E':  return 0.6;  // Medium open
          case 'I':  return 0.4;  // Slightly open
          case 'O':  return 0.7;  // Round open
          case 'U':  return 0.5;  // Round slightly open
          case 'PP': return 0.2;  // Lips pressed
          case 'FF': return 0.3;  // Teeth on lip
          case 'TH': return 0.3;  // Tongue between teeth
          case 'DD': return 0.3;  // Tongue tip up
          case 'kk': return 0.4;  // Back of tongue up
          case 'CH': return 0.4;  // Lips forward
          case 'SS': return 0.3;  // Teeth together
          case 'nn': return 0.2;  // Tongue up
          case 'RR': return 0.3;  // Tongue curled
          case 'sil': return 0.0; // Closed
          default: return 0.1;    // Default slight opening
        }
      });
      
      const totalDuration = audioBuffer.duration;
      let startTime = Date.now();
      const progressInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const currentProgress = Math.min(100, (elapsed / totalDuration) * 100);
        setProgress(currentProgress);
        
        if (currentProgress >= 100) {
          clearInterval(progressInterval);
        }
      }, 100);

      await headRef.current.speakAudio({
        audio: audioBuffer,
        visemes: visemeStrings,
        times: times,
        durations: durations,
        anim: {
          name: "mouth",
          dt: durations.map(d => d * 1000), 
          vs: {
            "mouthOpen": mouthOpenValues,
            "mouthSmile": mouthOpenValues.map(() => Math.random() > 0.8 ? 0.3 : 0)
          }
        }
      });
      
      clearInterval(progressInterval);
      setProgress(100);
      return true;
    } catch (err) {
      console.error('Speech error:', err);
      setError('Error: ' + err.message);
      return false;
    } finally {
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (scriptSegmentsRef.current.length === 0) return;
      
      if (currentSegment === 0 || currentSegment >= scriptSegmentsRef.current.length) {
        setCurrentSegment(0);
        setProgress(0);
      }
      
      const speakNext = async (index) => {
        if (index >= scriptSegmentsRef.current.length) {
          setIsPlaying(false);
          return;
        }
        
        setCurrentSegment(index);
        const success = await speakSegment(scriptSegmentsRef.current[index]);
        if (success && index + 1 < scriptSegmentsRef.current.length) {
          setTimeout(() => speakNext(index + 1), 500);
        } else {
          setIsPlaying(false);
        }
      };
      
      speakNext(currentSegment);
    }
  };

  const handleRestart = () => {
    setCurrentSegment(0);
    setProgress(0);
    setIsPlaying(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (headRef.current) {
    }
  };

  return (
    <div className="ai-learning-container">
      <div className="avatar-section">
        <div className="avatar-background"></div>
        <div ref={containerRef} className="avatar-container"></div>
      </div>

      <div className="script-container">
        {scriptLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Generating teaching content...</p>
          </div>
        ) : teachingScript ? (
          <>
            <div className="script-display">
              {scriptSegmentsRef.current.map((segment, index) => (
                <p 
                  key={index} 
                  className={`script-segment ${index === currentSegment ? 'active' : ''} ${index < currentSegment ? 'spoken' : ''}`}
                >
                  {segment}
                </p>
              ))}
            </div>
            
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            
            <div className="controls">
              <button onClick={handlePlayPause} className="control-button">
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button onClick={handleRestart} className="control-button">
                Restart
              </button>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <h3>AI Teaching Assistant</h3>
            <p>Generate a personalized teaching experience for this lecture.</p>
            <button 
              onClick={generateTeachingScript}
              disabled={isLoading || scriptLoading}
              className="generate-button"
            >
              Generate Teaching Content
            </button>
          </div>
        )}
        
        {error && <div className="error-message">{error}</div>}
      </div>
      
      <style jsx>{`
        .ai-learning-container {
          display: flex;
          flex-direction: column;
          width: 100%;
          min-height: 70vh;
          background-color: #f8f9fa;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
        }
        
        .avatar-section {
          position: relative;
          width: 100%;
          height: 450px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          margin-top: -20px; /* Adjusted to move avatar upward */
        }
        
        .avatar-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url('/avatar-background.jpg'); 
          background-size: contain;
          background-position: center;
          opacity: 1; 
          z-index: 0;
          pointer-events: none;
          filter: blur(5px); /* Added blur to make avatar more prominent */
        }
        
        .avatar-container {
          position: relative;
          width: 100%;
          height: 100%;
          z-index: 1; 
        }
        
        .script-container {
          padding: 2rem;
          background-color: white;
          border-radius: 0 0 12px 12px;
          flex: 1;
          box-shadow: 0 -5px 15px rgba(0, 0, 0, 0.05);
        }
        
        .script-display {
          max-height: 300px;
          overflow-y: auto;
          padding: 1rem;
          background-color: #f8f9fa;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.05);
        }
        
        .script-segment {
          font-size: 1.1rem;
          line-height: 1.6;
          margin-bottom: 0.8rem;
          color: #343a40;
          transition: all 0.3s ease;
        }
        
        .script-segment.active {
          color: #0066cc;
          font-weight: 600;
          background-color: rgba(0, 102, 204, 0.05);
          padding: 0.5rem;
          border-radius: 4px;
          transform: scale(1.01);
        }
        
        .script-segment.spoken {
          color: #666;
        }
        
        .progress-bar {
          height: 6px;
          background-color: #e9ecef;
          border-radius: 10px;
          margin: 1.5rem 0;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #0066cc, #5e9eff);
          transition: width 0.2s ease;
        }
        
        .controls {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-top: 1rem;
        }
        
        .control-button {
          padding: 8px 16px;
          background-color: #0066cc;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .control-button:hover {
          background-color: #0055aa;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(0, 102, 204, 0.1);
          border-radius: 50%;
          border-top-color: #0066cc;
          animation: spin 1s ease-in-out infinite;
          margin-bottom: 1rem;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .empty-state {
          text-align: center;
          padding: 2.5rem;
          background-color: #f8f9fa;
          border-radius: 8px;
          border: 1px dashed #ced4da;
        }
        
        .empty-state h3 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: #212529;
        }
        
        .empty-state p {
          color: #6c757d;
          margin-bottom: 2rem;
        }
        
        .generate-button {
          background-color: #0066cc;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .generate-button:hover {
          background-color: #0055aa;
          transform: translateY(-2px);
          box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
        }
        
        .generate-button:disabled {
          background-color: #a0c0e0;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        .error-message {
          margin-top: 1rem;
          padding: 0.75rem;
          background-color: #fff5f5;
          color: #e53e3e;
          border-left: 4px solid #e53e3e;
          border-radius: 4px;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}