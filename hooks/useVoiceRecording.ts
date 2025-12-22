import { useState, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { useMutation } from '@tanstack/react-query';

const STT_API_URL = 'https://toolkit.rork.com/stt/transcribe/';

interface UseVoiceRecordingReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  cancelRecording: () => void;
}

export function useVoiceRecording(): UseVoiceRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const { mutateAsync: transcribeAudio, isPending: isTranscribing } = useMutation({
    mutationFn: async (formData: FormData): Promise<string> => {
      console.log('Sending audio for transcription...');
      
      const response = await fetch(STT_API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('STT API error:', errorText);
        throw new Error('Failed to transcribe audio');
      }

      const result = await response.json();
      console.log('Transcription result:', result);
      return result.text;
    },
  });

  const startRecordingMobile = useCallback(async () => {
    try {
      console.log('Checking mobile audio permissions...');
      
      const { status: existingStatus } = await Audio.getPermissionsAsync();
      console.log('Current permission status:', existingStatus);
      
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        console.log('Requesting microphone permission...');
        const { status } = await Audio.requestPermissionsAsync();
        finalStatus = status;
        console.log('Permission request result:', status);
      }
      
      if (finalStatus !== 'granted') {
        console.error('Permission not granted. Status:', finalStatus);
        throw new Error('Microphone access is required. Please allow microphone access in your device settings and try again.');
      }
      
      console.log('Permission granted, setting up audio mode...');

      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        console.log('Audio mode configured successfully');
      } catch (audioModeErr) {
        console.error('Error setting audio mode:', audioModeErr);
      }

      console.log('Creating recording instance...');
      const recording = new Audio.Recording();
      
      console.log('Preparing to record...');
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
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      console.log('Starting recording...');
      await recording.startAsync();
      recordingRef.current = recording;
      console.log('Mobile recording started successfully');
    } catch (err) {
      console.error('Error starting mobile recording:', err);
      throw err;
    }
  }, []);

  const startRecordingWeb = useCallback(async () => {
    try {
      console.log('Requesting web audio permissions...');
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Voice recording is not supported in this browser');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      console.log('Web recording started');
    } catch (err: unknown) {
      console.error('Error starting web recording:', err);
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          throw new Error('Microphone access denied. Please allow microphone permissions in your browser settings and try again.');
        }
        if (err.name === 'NotFoundError') {
          throw new Error('No microphone found. Please connect a microphone and try again.');
        }
      }
      throw err;
    }
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    
    try {
      if (Platform.OS === 'web') {
        await startRecordingWeb();
      } else {
        await startRecordingMobile();
      }
      setIsRecording(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      setError(message);
      console.error('Recording start error:', err);
    }
  }, [startRecordingMobile, startRecordingWeb]);

  const stopRecordingMobile = useCallback(async (): Promise<FormData | null> => {
    const recording = recordingRef.current;
    if (!recording) return null;

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      recordingRef.current = null;

      if (!uri) {
        throw new Error('No recording URI available');
      }

      console.log('Mobile recording stopped, URI:', uri);

      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      const audioFile = {
        uri,
        name: `recording.${fileType}`,
        type: `audio/${fileType}`,
      };

      const formData = new FormData();
      formData.append('audio', audioFile as unknown as Blob);
      
      return formData;
    } catch (err) {
      console.error('Error stopping mobile recording:', err);
      throw err;
    }
  }, []);

  const stopRecordingWeb = useCallback(async (): Promise<FormData | null> => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder) return null;

    return new Promise((resolve, reject) => {
      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }

          console.log('Web recording stopped, blob size:', audioBlob.size);

          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          
          mediaRecorderRef.current = null;
          audioChunksRef.current = [];
          
          resolve(formData);
        } catch (err) {
          reject(err);
        }
      };

      mediaRecorder.stop();
    });
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!isRecording) return null;
    
    setIsRecording(false);
    setError(null);

    try {
      let formData: FormData | null = null;

      if (Platform.OS === 'web') {
        formData = await stopRecordingWeb();
      } else {
        formData = await stopRecordingMobile();
      }

      if (!formData) {
        throw new Error('No audio data captured');
      }

      const transcribedText = await transcribeAudio(formData);
      return transcribedText;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process recording';
      setError(message);
      console.error('Recording stop error:', err);
      return null;
    }
  }, [isRecording, stopRecordingMobile, stopRecordingWeb, transcribeAudio]);

  const cancelRecording = useCallback(async () => {
    setIsRecording(false);
    setError(null);

    if (Platform.OS === 'web') {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      audioChunksRef.current = [];
    } else {
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
          });
        } catch (err) {
          console.log('Error cancelling recording:', err);
        }
        recordingRef.current = null;
      }
    }
  }, []);

  return {
    isRecording,
    isTranscribing,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
