'use client';

import { useState, useRef, useEffect } from 'react';
import { MicrophoneIcon, StopIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/solid';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function VoiceTaskRecorder({ userId, onTasksAdded }) {
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [extractedTasks, setExtractedTasks] = useState([]);
  const [error, setError] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  // Refs
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null); // tracks actual recording start
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Reset all states function
  const resetState = () => {
    setIsRecording(false);
    setIsPreparing(false);
    setIsTranscribing(false);
    setIsProcessing(false);
    setAudioBlob(null);
    setTranscript('');
    setError(null);
    setRecordingTime(0);
    setAudioLevel(0);
    
    // Don't reset extracted tasks here as they might be in use
    
    // Clear refs
    audioChunksRef.current = [];
    
    // Stop any ongoing processes
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Clear start time
    startTimeRef.current = null;
    
    // Release media resources
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Start recording function
  const startRecording = async () => {
    try {
      // Reset state before starting a new recording
      resetState();
      setError(null);
      setIsPreparing(true);
      
      console.log('[VoiceRecorder] Requesting microphone access...');
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      console.log('[VoiceRecorder] Microphone access granted, setting up audio context...');
      
      // Set up audio analyzer for visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      dataArrayRef.current = dataArray;
      
      // Start audio level visualization
      const updateAudioLevel = () => {
        if (!analyserRef.current || !dataArrayRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const average = dataArrayRef.current.reduce((acc, val) => acc + val, 0) / bufferLength;
        const normalized = Math.min(100, average * 2); // Scale for better visual feedback
        setAudioLevel(normalized);
        
        if (isRecording) {
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      
      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log('[VoiceRecorder] Recording stopped, processing audio...');
        
        // Calculate real recording duration
        const elapsedSec = startTimeRef.current
          ? (Date.now() - startTimeRef.current) / 1000
          : 0;

        // Create blob from recorded chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        
        // Stop all tracks to release the microphone
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        // Clear timers
        if (timerRef.current) clearInterval(timerRef.current);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        
        // Only proceed to transcription if we have recorded something meaningful
        // threshold 0.5 s
        if (elapsedSec > 0.5 && audioChunksRef.current.length > 0) {
          console.log('[VoiceRecorder] Recording duration:', elapsedSec, 'seconds. Proceeding to transcription.');
          transcribeAudio(audioBlob);
        } else {
          console.log('[VoiceRecorder] Recording too short or no audio data captured.');
          setIsRecording(false);
          setIsPreparing(false);
          setError('Recording was too short. Please try again and speak clearly.');
        }
      };
      
      // Start recording
      mediaRecorder.start(100); // Capture data in smaller chunks (100ms)
      setIsRecording(true);
      setIsPreparing(false);

      // Mark real start time
      startTimeRef.current = Date.now();
      
      console.log('[VoiceRecorder] Recording started successfully.');
      
      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // Start visualization
      updateAudioLevel();
      
    } catch (err) {
      console.error('[VoiceRecorder] Error starting recording:', err);
      setIsPreparing(false);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        setError('Microphone permission denied. Please allow access to use voice recording.');
      } else {
        setError(`Could not start recording: ${err.message}`);
      }
    }
  };

  // Stop recording function
  const stopRecording = () => {
    console.log('[VoiceRecorder] Stopping recording...');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error('[VoiceRecorder] Error stopping MediaRecorder:', err);
        resetState();
        setError(`Error stopping recording: ${err.message}`);
      }
    } else {
      console.warn('[VoiceRecorder] Attempted to stop recording but MediaRecorder was not active');
      resetState();
    }
  };

  // Cancel recording function
  const cancelRecording = () => {
    console.log('[VoiceRecorder] Cancelling recording...');
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error('[VoiceRecorder] Error stopping MediaRecorder during cancel:', err);
      }
    }
    
    resetState();
    setExtractedTasks([]);
  };

  // Transcribe audio using OpenAI Whisper API
  const transcribeAudio = async (blob) => {
    try {
      setIsTranscribing(true);
      console.log('[VoiceRecorder] Starting transcription, audio size:', Math.round(blob.size / 1024), 'KB');
      
      // Create form data for the API request
      const formData = new FormData();
      formData.append('file', blob, 'recording.webm');
      
      // Send to our secure server-side transcription endpoint
      console.log('[VoiceRecorder] Sending audio to transcription API...');
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || response.statusText || 'Unknown error';
        console.error('[VoiceRecorder] Transcription API error:', response.status, errorMessage);
        throw new Error(`Transcription failed: ${errorMessage}`);
      }
      
      const data = await response.json();
      
      if (!data.text || data.text.trim() === '') {
        console.warn('[VoiceRecorder] Transcription returned empty text');
        throw new Error('No speech detected. Please try again and speak clearly.');
      }
      
      console.log('[VoiceRecorder] Transcription successful:', data.text);
      setTranscript(data.text);
      setIsTranscribing(false);
      
      // Extract tasks from transcript
      extractTasks(data.text);
      
    } catch (err) {
      console.error('[VoiceRecorder] Transcription error:', err);
      setIsTranscribing(false);
      setError(`Transcription failed: ${err.message}`);
    }
  };

  // Extract tasks from transcript
  const extractTasks = (text) => {
    setIsProcessing(true);
    console.log('[VoiceRecorder] Extracting tasks from transcript...');
    
    try {
      // Task extraction patterns
      const taskPatterns = [
        // Direct task mentions
        /(?:add|create|make)(?:\sa)?\stask(?:\sto)?\s(.*?)(?:\.|\n|$)/i,
        /(?:remind\sme\sto)\s(.*?)(?:\.|\n|$)/i,
        /(?:i\sneed\sto)\s(.*?)(?:\.|\n|$)/i,
        /(?:don't\sforget\sto)\s(.*?)(?:\.|\n|$)/i,
        
        // List items (numbered or bullet points)
        /(?:^|\n)\s*(?:\d+\.|\*|\-)\s*(.*?)(?:\.|\n|$)/i,
      ];
      
      // Split by common separators if no specific patterns are found
      const separatorPatterns = [
        /(?:and\sthen|then|next|also|additionally|moreover|furthermore|besides|plus|after\sthat)/i
      ];
      
      let tasks = [];
      
      // First try to extract using specific task patterns
      for (const pattern of taskPatterns) {
        const matches = [...text.matchAll(new RegExp(pattern, 'gi'))];
        if (matches.length > 0) {
          matches.forEach(match => {
            if (match[1] && match[1].trim().length > 0) {
              tasks.push({
                title: capitalizeFirstLetter(match[1].trim()),
                detail: '',
                source: 'voice'
              });
            }
          });
        }
      }
      
      // If no tasks found with specific patterns, try splitting by separators
      if (tasks.length === 0) {
        let segments = [text];
        
        // Split by separators
        for (const pattern of separatorPatterns) {
          const newSegments = [];
          segments.forEach(segment => {
            const parts = segment.split(pattern);
            newSegments.push(...parts);
          });
          segments = newSegments;
        }
        
        // Clean up and add as tasks
        segments.forEach(segment => {
          const trimmed = segment.trim();
          if (trimmed.length > 0) {
            tasks.push({
              title: capitalizeFirstLetter(trimmed),
              detail: '',
              source: 'voice'
            });
          }
        });
      }
      
      // If still no tasks, use the whole transcript as one task
      if (tasks.length === 0 && text.trim().length > 0) {
        tasks.push({
          title: capitalizeFirstLetter(text.trim()),
          detail: '',
          source: 'voice'
        });
      }
      
      console.log('[VoiceRecorder] Extracted tasks:', tasks.length);
      setExtractedTasks(tasks);
      setIsProcessing(false);
      
    } catch (err) {
      console.error('[VoiceRecorder] Task extraction error:', err);
      setIsProcessing(false);
      setError(`Failed to extract tasks: ${err.message}`);
    }
  };

  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Save extracted tasks to Firebase
  const saveTasks = async () => {
    try {
      setIsProcessing(true);
      console.log('[VoiceRecorder] Saving tasks to Firebase...');
      
      if (!userId) {
        throw new Error('User not logged in');
      }
      
      if (extractedTasks.length === 0) {
        throw new Error('No tasks to save');
      }
      
      // Add tasks to Firestore
      const savedTasks = await Promise.all(
        extractedTasks.map(task => 
          addDoc(collection(db, 'tasks'), {
            ...task,
            userId,
            createdAt: Timestamp.now(),
            category: 'voice', // You can adjust this or make it smarter
          })
        )
      );
      
      console.log('[VoiceRecorder] Successfully saved', savedTasks.length, 'tasks');
      
      // Reset the recorder state
      resetState();
      setExtractedTasks([]);
      
      // Notify parent component
      if (onTasksAdded) {
        onTasksAdded(savedTasks.length);
      }
      
    } catch (err) {
      console.error('[VoiceRecorder] Error saving tasks:', err);
      setIsProcessing(false);
      setError(`Failed to save tasks: ${err.message}`);
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
      <h2 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
        <MicrophoneIcon className="w-5 h-5 mr-2 text-blue-500" />
        Voice Tasks
      </h2>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}
      
      {/* Recording UI */}
      {isRecording && (
        <div className="mb-4">
          {/* Recording indicator and timer */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full bg-red-500 mr-2 ${isRecording ? 'animate-pulse' : ''}`}></div>
              <span className="text-red-600 font-medium">Recording</span>
            </div>
            <div className="text-gray-600 font-mono">{formatTime(recordingTime)}</div>
          </div>
          
          {/* Audio visualization */}
          <div className="h-12 bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
            <div className="flex items-end h-8 space-x-1 px-2">
              {[...Array(20)].map((_, i) => {
                // Create a wave-like pattern based on audio level and position
                const barHeight = Math.max(
                  4,
                  (audioLevel * Math.sin((Date.now() / 500) + i / 3) + audioLevel) / 2
                );
                
                return (
                  <div
                    key={i}
                    className="w-1 bg-blue-500 rounded-t"
                    style={{ 
                      height: `${barHeight}%`,
                      opacity: audioLevel > 10 ? 1 : 0.5,
                      transition: 'height 0.1s ease-in-out'
                    }}
                  ></div>
                );
              })}
            </div>
          </div>
          
          {/* Recording controls */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={cancelRecording}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full p-2"
              disabled={isTranscribing || isProcessing}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            <button
              onClick={stopRecording}
              className="bg-red-100 hover:bg-red-200 text-red-700 rounded-full p-3"
              disabled={isTranscribing || isProcessing}
            >
              <StopIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
      
      {/* Transcription and Processing UI */}
      {(isTranscribing || isProcessing) && (
        <div className="flex flex-col items-center justify-center py-6">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">
            {isTranscribing ? 'Transcribing your recording...' : 'Processing tasks...'}
          </p>
        </div>
      )}
      
      {/* Extracted Tasks UI */}
      {!isRecording && !isTranscribing && !isProcessing && extractedTasks.length > 0 && (
        <div className="mb-4">
          <h3 className="text-md font-medium mb-2 text-gray-700">Found {extractedTasks.length} task(s):</h3>
          <ul className="space-y-2 mb-4">
            {extractedTasks.map((task, index) => (
              <li key={index} className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                {task.title}
              </li>
            ))}
          </ul>
          <div className="flex justify-end space-x-3">
            <button 
              onClick={cancelRecording} 
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button 
              onClick={saveTasks} 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <CheckIcon className="w-4 h-4 mr-1" />
              Add Tasks
            </button>
          </div>
        </div>
      )}
      
      {/* Start Recording Button */}
      {!isRecording && !isTranscribing && !isProcessing && extractedTasks.length === 0 && (
        <button
          onClick={startRecording}
          disabled={isPreparing || permissionDenied}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all ${
            isPreparing 
              ? 'bg-gray-100 text-gray-400' 
              : permissionDenied
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          {isPreparing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <span>Preparing...</span>
            </>
          ) : (
            <>
              <MicrophoneIcon className="w-5 h-5" />
              <span>{permissionDenied ? 'Microphone Access Denied' : 'Record Voice Tasks'}</span>
            </>
          )}
        </button>
      )}
      
      {/* Instructions */}
      {!isRecording && !isTranscribing && !isProcessing && extractedTasks.length === 0 && !permissionDenied && (
        <p className="text-xs text-gray-500 mt-3 text-center">
          Tap to record, then speak your tasks. Try phrases like &quot;Add task to buy groceries&quot; or &quot;Remind me to call mom&quot;.
        </p>
      )}
    </div>
  );
}
