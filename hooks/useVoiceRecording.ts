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

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          console.log('🧹 Cleanup recorder');
        }
      }
    };
  }, []);



  const startRecordingMobile = useCallback(async () => {
    try {
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch {
          console.log('🧹 Cleanup old recording');
        }
        recordingRef.current = null;
      }

      console.log('📱 Requesting microphone permission...');
      const permission = await Audio.getPermissionsAsync();
      
      if (permission.status !== 'granted') {
        const { status } = await Audio.requestPermissionsAsync();
        
        if (status !== 'granted') {
          throw new Error('Microphone permission required. Please enable it in settings.');
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      
      await recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });
      
      await recording.startAsync();
      recordingRef.current = recording;
      console.log('✅ Mobile recording started');
    } catch (err) {
      console.error('❌ Mobile recording failed:', err);
      throw err;
    }
  }, []);

  const stopRecordingMobile = useCallback(async (): Promise<string> => {
    try {
      const recording = recordingRef.current;
      if (!recording) {
        throw new Error('No active recording');
      }

      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recording.getURI();
      recordingRef.current = null;

      if (!uri) {
        throw new Error('Recording failed');
      }

      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      const formData = new FormData();
      formData.append('audio', {
        uri,
        name: `recording.${fileType}`,
        type: `audio/${fileType}`,
      } as any);

      console.log('📤 Sending to STT API...');
      
      const response = await fetch(STT_API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('STT API error:', errorText);
        throw new Error('Transcription service error');
      }

      const data = await response.json();
      const text = (data.text || '').trim();

      if (!text) {
        throw new Error('Could not detect speech. Please speak clearly.');
      }

      console.log('✅ Transcribed:', text.substring(0, 100));
      return text;
    } catch (err) {
      console.error('❌ Mobile transcription error:', err);
      throw err;
    }
  }, []);

  const startRecordingWeb = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Recording not supported in this browser');
      }

      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      console.log('✅ Web recording started');
    } catch (err) {
      console.error('❌ Web recording failed:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.message.includes('permission')) {
          throw new Error('Microphone permission required. Please enable it in browser settings.');
        }
        throw err;
      }
      throw new Error('Failed to start recording');
    }
  }, []);

  const stopRecordingWeb = useCallback(async (): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      const mediaRecorder = mediaRecorderRef.current;
      
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        reject(new Error('No active recording'));
        return;
      }

      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: mediaRecorder.mimeType 
          });

          if (mediaRecorder.stream) {
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
          }

          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          console.log('📤 Sending to STT API...');

          const response = await fetch(STT_API_URL, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('STT API error:', errorText);
            reject(new Error('Transcription service error'));
            return;
          }

          const data = await response.json();
          const text = (data.text || '').trim();

          if (!text) {
            reject(new Error('Could not detect speech. Please speak clearly.'));
            return;
          }

          console.log('✅ Transcribed:', text.substring(0, 100));
          resolve(text);
        } catch (err) {
          console.error('❌ Web transcription error:', err);
          reject(err);
        } finally {
          mediaRecorderRef.current = null;
          audioChunksRef.current = [];
        }
      };

      mediaRecorder.stop();
    });
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setIsRecording(true);

    try {
      if (Platform.OS === 'web') {
        await startRecordingWeb();
      } else {
        await startRecordingMobile();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Recording failed';
      setError(message);
      setIsRecording(false);
      throw err;
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
      const message = err instanceof Error ? err.message : 'Transcription failed';
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
