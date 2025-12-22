import { useState, useRef, useCallback } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import { Audio } from 'expo-av';
import { useMutation } from '@tanstack/react-query';

const STT_API_URL = 'https://toolkit.rork.com/stt/transcribe/';

interface UseVoiceRecordingReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  error: string | null;
  liveTranscript: string;
  recordingDuration: number;
  confidence: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  cancelRecording: () => void;
}

export function useVoiceRecording(): UseVoiceRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [confidence, setConfidence] = useState(0);
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const chunkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isStoppingRef = useRef(false);

  const { mutateAsync: transcribeAudio, isPending: isTranscribing, reset: resetTranscription } = useMutation({
    mutationFn: async (formData: FormData): Promise<string> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      try {
        const response = await fetch(STT_API_URL, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('STT API error:', errorText);
          throw new Error('Failed to transcribe audio');
        }

        const responseText = await response.text();
        const trimmedResponse = responseText.trim();
        
        if (!trimmedResponse) {
          return '';
        }
        
        let transcribedText: string;
        
        if (trimmedResponse.startsWith('{') || trimmedResponse.startsWith('[')) {
          try {
            const result = JSON.parse(trimmedResponse);
            if ('text' in result) {
              transcribedText = result.text || '';
            } else if (typeof result === 'string') {
              transcribedText = result;
            } else if (Array.isArray(result) && result.length > 0) {
              transcribedText = result[0].text || result[0] || '';
            } else {
              transcribedText = JSON.stringify(result);
            }
          } catch {
            transcribedText = trimmedResponse;
          }
        } else {
          transcribedText = trimmedResponse;
        }
        
        if (!transcribedText || transcribedText.trim().length === 0) {
          return '';
        }
        
        return transcribedText;
      } catch (err) {
        clearTimeout(timeoutId);
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('Chunk transcription timeout - skipping');
          return '';
        }
        throw err;
      }
    },
  });

  const processLiveChunk = useCallback(async () => {
    if (!recordingRef.current || isStoppingRef.current || Platform.OS === 'web') return;
    
    try {
      const status = await recordingRef.current.getStatusAsync();
      if (!status.isRecording) return;
      
      const durationMillis = status.durationMillis || 0;
      if (durationMillis < 1500) return;
      
      console.log('📦 Processing live chunk...');
      
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      
      if (uri) {
        const uriParts = uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        const audioFile = {
          uri,
          name: `chunk_${Date.now()}.${fileType}`,
          type: `audio/${fileType}`,
        };
        
        const formData = new FormData();
        formData.append('audio', audioFile as unknown as Blob);
        
        const chunkText = await transcribeAudio(formData);
        if (chunkText && chunkText.trim()) {
          console.log('✨ Live chunk:', chunkText.substring(0, 50));
          setLiveTranscript(prev => prev ? `${prev} ${chunkText}` : chunkText);
        }
      }
      
      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 32000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.MEDIUM,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 32000,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 32000,
        },
      });
      await newRecording.startAsync();
      recordingRef.current = newRecording;
    } catch (err) {
      console.log('Chunk processing skipped:', err instanceof Error ? err.message : 'Unknown');
    }
  }, [transcribeAudio]);

  const startRecordingMobile = useCallback(async () => {
    try {
      console.log('🎤 Starting mobile live recording...');
      
      const { status: existingStatus } = await Audio.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Audio.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert(
          'Microphone Permission Required',
          'Please allow microphone access to use voice recording.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
        throw new Error('Microphone permission denied');
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
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 32000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.MEDIUM,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 32000,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 32000,
        },
      });

      await recording.startAsync();
      recordingRef.current = recording;
      console.log('✅ Mobile recording started');
      
      chunkIntervalRef.current = setInterval(async () => {
        await processLiveChunk();
      }, 2000);
    } catch (err) {
      console.error('Error starting mobile recording:', err);
      throw err;
    }
  }, [processLiveChunk]);

  const startRecordingWeb = useCallback(async () => {
    try {
      console.log('🌐 Starting web recording with live transcription...');
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Voice recording is not supported in this browser');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/webm';
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 32000,
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;
        
        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';
          let maxConfidence = 0;
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript;
            const confidenceScore = result[0].confidence || 0;
            
            if (confidenceScore > maxConfidence) {
              maxConfidence = confidenceScore;
            }
            
            if (result.isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }
          
          setConfidence(maxConfidence);
          
          setLiveTranscript(prev => {
            const updated = (prev + finalTranscript).trim();
            return interimTranscript ? updated + ' ' + interimTranscript : updated;
          });
          
          console.log('🎯 Live:', interimTranscript || finalTranscript);
        };
        
        recognition.onerror = (event: any) => {
          if (event.error !== 'no-speech' && event.error !== 'aborted') {
            console.log('Speech recognition error:', event.error);
          }
        };
        
        recognition.onstart = () => {
          console.log('✅ Live transcription active');
        };
        
        recognition.start();
        recognitionRef.current = recognition;
      }
      
      console.log('✅ Web recording started');
    } catch (err: unknown) {
      console.error('Error starting web recording:', err);
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          throw new Error('Microphone access denied. Please allow microphone permissions in your browser settings.');
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
    setLiveTranscript('');
    setRecordingDuration(0);
    setConfidence(0);
    isStoppingRef.current = false;
    recordingStartTimeRef.current = Date.now();
    resetTranscription();
    
    try {
      if (Platform.OS === 'web') {
        await startRecordingWeb();
      } else {
        await startRecordingMobile();
      }
      setIsRecording(true);
      
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
        setRecordingDuration(elapsed);
      }, 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      setError(message);
      console.error('Recording start error:', err);
    }
  }, [startRecordingMobile, startRecordingWeb, resetTranscription]);

  const stopRecordingMobile = useCallback(async (): Promise<FormData | null> => {
    isStoppingRef.current = true;
    
    if (chunkIntervalRef.current) {
      clearInterval(chunkIntervalRef.current);
      chunkIntervalRef.current = null;
    }
    
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
        return null;
      }

      console.log('🎤 Processing final chunk...');

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
    
    isStoppingRef.current = true;
    setIsRecording(false);
    setError(null);
    
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    
    if (chunkIntervalRef.current) {
      clearInterval(chunkIntervalRef.current);
      chunkIntervalRef.current = null;
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    try {
      const currentTranscript = liveTranscript.trim();
      
      if (Platform.OS === 'web' && currentTranscript) {
        console.log('✨ Instant result from live transcription');
        setLiveTranscript('');
        setConfidence(0);
        return currentTranscript;
      }

      let formData: FormData | null = null;

      if (Platform.OS === 'web') {
        formData = await stopRecordingWeb();
      } else {
        formData = await stopRecordingMobile();
      }

      if (!formData) {
        const result = currentTranscript || null;
        setLiveTranscript('');
        setConfidence(0);
        return result;
      }

      console.log('📤 Processing final chunk...');
      const startTime = Date.now();
      const transcribedText = await transcribeAudio(formData);
      const elapsed = Date.now() - startTime;
      console.log(`✅ Final chunk processed in ${elapsed}ms`);
      
      const finalText = currentTranscript
        ? `${currentTranscript} ${transcribedText}`.trim()
        : transcribedText;
      
      setLiveTranscript('');
      setConfidence(0);
      
      if (!finalText || finalText.trim().length === 0) {
        console.log('No speech detected in recording');
        return null;
      }
      
      return finalText;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process recording';
      setError(message);
      console.error('Recording stop error:', err);
      const fallback = liveTranscript.trim() || null;
      setLiveTranscript('');
      return fallback;
    }
  }, [isRecording, stopRecordingMobile, stopRecordingWeb, transcribeAudio, liveTranscript]);

  const cancelRecording = useCallback(async () => {
    isStoppingRef.current = true;
    setIsRecording(false);
    setError(null);
    setLiveTranscript('');
    setRecordingDuration(0);
    setConfidence(0);
    
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    
    if (chunkIntervalRef.current) {
      clearInterval(chunkIntervalRef.current);
      chunkIntervalRef.current = null;
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

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
    liveTranscript,
    recordingDuration,
    confidence,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
