"use client";

import { useEffect, useRef, useState } from 'react';
import { TalkingHead } from '../../../lib/talkinghead/modules/talkinghead.mjs'; 

export default function AILearning({ course, currentLecture }) {
  const containerRef = useRef(null);
  const headRef = useRef(null);
  const audioContextRef = useRef(null);
  const [text, setText] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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
  }, []);

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

  const handleSpeak = async () => {
    if (!text || !headRef.current) return;
    setError(null);
    setIsLoading(true);

    try {
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const response = await fetch('/api/azure-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text,
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

      // Convert base64 to ArrayBuffer
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
      
      console.log("Speaking with visemes:", visemeStrings.length);

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
    } catch (err) {
      console.error('Speech error:', err);
      setError('Error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: '500px', 
          background: '#f0f0f0',
          position: 'relative'
        }}
      />
      <div style={{ margin: '10px 0' }}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type text to speak (e.g., Hello, how are you today?)"
          style={{ width: '300px', marginRight: '10px', padding: '8px' }}
          disabled={isLoading}
        />
        <button 
          onClick={handleSpeak} 
          disabled={isLoading || !headRef.current}
          style={{ padding: '8px 16px' }}
        >
          {isLoading ? 'Speaking...' : 'Speak'}
        </button>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}