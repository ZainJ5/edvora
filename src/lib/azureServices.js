import { SpeechConfig, AudioConfig, SpeechRecognizer } from 'microsoft-cognitiveservices-speech-sdk';

export async function extractTranscription(videoUrl) {
  try {
    const speechConfig = SpeechConfig.fromSubscription(
      process.env.AZURE_SPEECH_KEY,
      process.env.AZURE_SPEECH_REGION
    );
    
    speechConfig.speechRecognitionLanguage = "en-US";
    const audioConfig = AudioConfig.fromWavFileInput(videoUrl);
    const recognizer = new SpeechRecognizer(speechConfig, audioConfig);
    
    return new Promise((resolve, reject) => {
      let transcription = '';
      
      recognizer.recognized = (s, e) => {
        if (e.result.reason === ResultReason.RecognizedSpeech) {
          transcription += e.result.text + ' ';
        }
      };
      
      recognizer.recognizeOnceAsync(
        (result) => {
          recognizer.close();
          resolve(transcription.trim());
        },
        (err) => {
          recognizer.close();
          console.error('Speech recognition error:', err);
          reject(err);
        }
      );
    });
    
  } catch (error) {
    console.error('Error extracting transcription:', error);
    return '';
  }
}