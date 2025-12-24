import { useState, useRef, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

const STT_API_URL = 'https://toolkit.rork.com/stt/transcribe/';

interface UseVoiceRecordingReturn {
  isRecording: boolean;
  isProcessing: boolean;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
}

export function useVoiceRecording(): UseVoiceRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');
  const recordingStartTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log('Cleanup recognition:', e);
        }
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);



  const startRecordingMobile = useCallback(async () => {
    try {
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch (e) {
          console.log('🧹 Cleanup old recording:', e);
        }
        recordingRef.current = null;
      }

      console.log('🎤 Requesting microphone permission...');
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Microphone permission required');
      }

      console.log('🔊 Setting audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      console.log('📝 Creating recording instance...');
      const recording = new Audio.Recording();
      
      try {
        console.log('⚙️ Preparing recorder...');
        await recording.prepareToRecordAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        
        console.log('▶️ Starting recording...');
        await recording.startAsync();
        recordingRef.current = recording;
        recordingStartTimeRef.current = Date.now();
        console.log('✅ Recording started successfully');
      } catch (prepError) {
        console.error('❌ Prepare/start error:', prepError);
        try {
          await recording.stopAndUnloadAsync();
        } catch (e) {
          console.log('Cleanup after error:', e);
        }
        throw new Error('Failed to start recording. Please try again.');
      }
    } catch (err) {
      console.error('❌ Mobile recording error:', err);
      throw err;
    }
  }, []);

  const stopRecordingMobile = useCallback(async (): Promise<string> => {
    try {
      const recording = recordingRef.current;
      if (!recording) {
        throw new Error('No recording in progress');
      }

      const recordingDuration = Date.now() - recordingStartTimeRef.current;
      console.log('⏱️ Recording duration:', recordingDuration, 'ms');

      if (recordingDuration < 1000) {
        throw new Error('Recording too short. Please hold for at least 2 seconds and speak clearly.');
      }

      console.log('⏹️ Stopping recording...');
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recording.getURI();
      recordingRef.current = null;
      recordingStartTimeRef.current = 0;

      if (!uri) {
        throw new Error('No recording URI');
      }

      console.log('📤 Sending audio for transcription...');
      const audioFile = {
        uri,
        name: 'recording.m4a',
        type: 'audio/m4a',
      };

      const formData = new FormData();
      formData.append('audio', audioFile as any);

      const response = await fetch(STT_API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Transcription failed:', response.status, errorText);
        throw new Error('Failed to transcribe audio');
      }

      const responseText = await response.text();
      console.log('📝 Raw response:', responseText.substring(0, 100));
      
      let transcribedText = '';
      try {
        const parsed = JSON.parse(responseText);
        transcribedText = parsed.text || parsed.transcription || '';
      } catch {
        console.log('⚠️ Response is not JSON, using as plain text');
        transcribedText = responseText;
      }
      
      const trimmed = transcribedText.trim();

      if (!trimmed || trimmed.length < 2) {
        throw new Error('Could not understand speech. Please speak clearly and hold the button while talking.');
      }

      console.log('✅ Transcription successful:', trimmed.length, 'characters');
      return trimmed;
    } catch (err) {
      console.error('❌ Stop recording error:', err);
      throw err;
    }
  }, []);

  const startRecordingWeb = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Recording not supported in this browser');
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    streamRef.current = stream;
    audioChunksRef.current = [];

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm',
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        audioChunksRef.current.push(e.data);
      }
    };

    mediaRecorder.start(100);
    mediaRecorderRef.current = mediaRecorder;
    recordingStartTimeRef.current = Date.now();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let text = '';
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            text += event.results[i][0].transcript + ' ';
          }
        }
        transcriptRef.current = text.trim();
      };

      recognition.onerror = (e: any) => {
        console.log('Speech recognition error:', e.error);
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
      } catch (e) {
        console.log('Failed to start speech recognition:', e);
      }
    }
  }, []);

  const stopRecordingWeb = useCallback(async (): Promise<string> => {
    const recordingDuration = Date.now() - recordingStartTimeRef.current;
    console.log('⏱️ Recording duration:', recordingDuration, 'ms');

    if (recordingDuration < 1000) {
      throw new Error('Recording too short. Please hold for at least 2 seconds and speak clearly.');
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log('Stop recognition:', e);
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    const transcript = transcriptRef.current.trim();
    console.log('🎤 Web transcript length:', transcript.length);
    
    transcriptRef.current = '';
    recognitionRef.current = null;
    mediaRecorderRef.current = null;
    streamRef.current = null;
    audioChunksRef.current = [];
    recordingStartTimeRef.current = 0;

    if (!transcript || transcript.length < 2) {
      throw new Error('Could not understand speech. Please speak clearly and hold the button while talking.');
    }

    return transcript;
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setIsRecording(true);
    transcriptRef.current = '';

    try {
      if (Platform.OS === 'web') {
        await startRecordingWeb();
      } else {
        await startRecordingMobile();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      console.error('Start recording failed:', message);
      setError(message);
      setIsRecording(false);
    }
  }, [startRecordingWeb, startRecordingMobile]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!isRecording) {
      return null;
    }

    setIsRecording(false);
    setIsProcessing(true);
    setError(null);

    try {
      const transcript = Platform.OS === 'web' 
        ? await stopRecordingWeb()
        : await stopRecordingMobile();

      setIsProcessing(false);
      return transcript;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process recording';
      setError(message);
      setIsProcessing(false);
      return null;
    }
  }, [isRecording, stopRecordingWeb, stopRecordingMobile]);

  return {
    isRecording,
    isProcessing,
    error,
    startRecording,
    stopRecording,
  };
}
