import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

// Initialize OpenAI client with server-side API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    // Check if request is multipart form-data
    if (!request.headers.get('content-type')?.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Request must be multipart/form-data' },
        { status: 400 }
      );
    }

    // Parse the form data
    const formData = await request.formData();
    const audioFile = formData.get('file');

    // Validate file exists
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/ogg'];
    if (!validTypes.includes(audioFile.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${audioFile.type}. Supported types: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Convert blob to buffer (OpenAI SDK accepts Buffer/Uint8Array/File)
    const buffer = Buffer.from(await audioFile.arrayBuffer());

    // Call OpenAI Whisper API directly with the buffer
    const transcription = await openai.audio.transcriptions.create({
      file: buffer,
      model: 'whisper-1',
      language: 'en',
    });

    // Return the transcription
    return NextResponse.json({ 
      text: transcription.text,
      success: true 
    });
    
  } catch (error) {
    console.error('Transcription error:', error);
    
    // Determine appropriate error message and status
    let status = 500;
    let message = 'An error occurred during transcription';
    
    if (error.response) {
      status = error.response.status;
      message = `OpenAI API error: ${error.response.data?.error?.message || error.message}`;
    } else if (error.message) {
      message = error.message;
    }
    
    return NextResponse.json(
      { error: message, success: false },
      { status }
    );
  }
}
