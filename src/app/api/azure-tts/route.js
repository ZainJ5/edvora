import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

export async function POST(request) {
  try {
    const body = await request.json();
    const text = body.text || 'Hello, this is a test.';
    const voice = body.voice || 'en-US-JennyNeural';
    
    if (!process.env.AZURE_SPEECH_KEY || !process.env.AZURE_SPEECH_REGION) {
      return Response.json({ error: 'Azure Speech credentials not configured' }, { status: 500 });
    }
    
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.AZURE_SPEECH_KEY,
      process.env.AZURE_SPEECH_REGION
    );
    
    speechConfig.speechSynthesisVoiceName = voice;
    
    speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm;
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig);
    
    const visemes = [];
    synthesizer.visemeReceived = (s, e) => {
      console.log("Viseme received:", e.visemeId, "at", e.audioOffset);
      visemes.push({ 
        audioOffset: e.audioOffset, 
        visemeId: e.visemeId 
      });
    };
    
    const ssmlText = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
        <voice name="${voice}">
          <prosody rate="0.95" pitch="0%">
            ${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}
          </prosody>
        </voice>
      </speak>
    `;

    return new Promise((resolve, reject) => {
      synthesizer.speakSsmlAsync(
        ssmlText,
        (result) => {
          try {
            synthesizer.close();
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
              console.log(`Synthesis completed. Generated ${visemes.length} visemes.`);
              
              if (visemes.length === 0) {
                console.warn("No visemes generated for the text");
              }
              
              resolve(Response.json({
                audio: Buffer.from(result.audioData).toString('base64'),
                visemes: visemes,
                audioLength: result.audioData.length
              }));
            } else {
              resolve(Response.json({ 
                error: 'Synthesis failed: ' + result.reason 
              }, { status: 500 }));
            }
          } catch (e) {
            console.error("Error in synthesis completion handler:", e);
            resolve(Response.json({ error: e.message }, { status: 500 }));
          }
        },
        (error) => {
          synthesizer.close();
          console.error("Synthesis error:", error);
          resolve(Response.json({ 
            error: 'Azure TTS error: ' + error.toString() 
          }, { status: 500 }));
        }
      );
    });
  } catch (error) {
    console.error('Azure TTS error:', error);
    return Response.json({ 
      error: 'Azure TTS processing error: ' + (error.message || 'Unknown error') 
    }, { status: 500 });
  }
}