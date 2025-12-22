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

  const isProcessingChunkRef = useRef(false);
  const transcriptRef = useRef('');
  const [isFetchingFinal, setIsFetchingFinal] = useState(false);

  const { mutateAsync: transcribeAudio, reset: resetTranscription } = useMutation({
    mutationFn: async (formData: FormData): Promise<string> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Reduced to 10s for faster failure on chunks
      
      try {
        const response = await fetch(STT_API_URL, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('STT API error status:', response.status);
          console.error('STT API error body:', errorText);
          throw new Error(`Transcribe failed: ${response.status}`);
        }

        const responseText = await response.text();
        const trimmedResponse = responseText.trim();
        
        if (!trimmedResponse) {
          return '';
        }
        
        let transcribedText: string = '';
        
        // Try to parse as JSON first
        if (trimmedResponse.startsWith('{') || trimmedResponse.startsWith('[')) {
          try {
            const result = JSON.parse(trimmedResponse);
            if (result && typeof result === 'object') {
              if ('text' in result) {
                transcribedText = result.text || '';
              } else if ('transcription' in result) {
                 transcribedText = result.transcription || '';
              } else {
                 // Fallback: try to find any string property that looks like text
                 const values = Object.values(result);
                 const textValue = values.find(v => typeof v === 'string' && v.length > 0);
                 transcribedText = (textValue as string) || '';
              }
            } else if (Array.isArray(result) && result.length > 0) {
              transcribedText = result[0]?.text || result[0] || '';
            }
          } catch (e) {
            console.warn('JSON parse failed, treating as raw text. Error:', e);
            // If it looked like JSON but failed to parse, it might be partial or malformed.
            // But we can try to use it as raw text if it doesn't look like an error message.
            if (!trimmedResponse.includes('"error"')) {
               transcribedText = trimmedResponse;
            }
          }
        } else {
          // Plain text response
          transcribedText = trimmedResponse;
        }

        // Clean up text
        transcribedText = transcribedText.trim();
        
        // Filter out "invalid json" or "error" if they somehow got into the text
        if (transcribedText.toLowerCase().includes('invalid json') || transcribedText.toLowerCase().includes('backend error')) {
           return '';
        }
        
        return transcribedText;

      } catch (err) {
        clearTimeout(timeoutId);
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('Transcription timeout');
          return ''; // Return empty string on timeout to not break flow
        }
        throw err;
      }
    },
  });

  const processLiveChunk = useCallback(async () => {
    if (!recordingRef.current || isStoppingRef.current || Platform.OS === 'web') return;
    if (isProcessingChunkRef.current) {
        console.log('Skipping chunk - previous chunk still processing');
        return;
    }
    
    try {
      const status = await recordingRef.current.getStatusAsync();
      if (!status.isRecording) return;
      
      const durationMillis = status.durationMillis || 0;
      // Process every 2.5 seconds to balance "live" feel with network load
      if (durationMillis < 2500) return;
      
      console.log('📦 Processing live chunk...');
      isProcessingChunkRef.current = true;
      
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      
      // Start new recording IMMEDIATELY to minimize gap
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
      
      // Process the previous chunk in background
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
        
        // We don't await this directly to block the function, but we await it to unset the flag
        transcribeAudio(formData).then((chunkText) => {
            if (chunkText && chunkText.trim()) {
                console.log('✨ Live chunk:', chunkText.substring(0, 50));
                
                // Update both ref and state to ensure sync
                const cleanChunk = chunkText.trim();
                
                setLiveTranscript(prev => {
                    const cleanPrev = prev.trim();
                    
                    let newTranscript = '';
                    if (!cleanPrev) {
                        newTranscript = cleanChunk;
                    } else {
                        // Avoid duplicate words at the seam
                        const prevWords = cleanPrev.split(' ');
                        const lastWord = prevWords[prevWords.length - 1];
                        if (cleanChunk.startsWith(lastWord)) {
                             newTranscript = cleanPrev + cleanChunk.substring(lastWord.length);
                        } else {
                             newTranscript = `${cleanPrev} ${cleanChunk}`;
                        }
                    }
                    
                    // Sync ref
                    transcriptRef.current = newTranscript;
                    return newTranscript;
                });
            }
        }).catch(err => {
            console.log('Chunk transcription failed safely:', err);
        }).finally(() => {
            isProcessingChunkRef.current = false;
        });
      } else {
         isProcessingChunkRef.current = false;
      }
      
    } catch (err) {
      console.log('Chunk processing skipped:', err instanceof Error ? err.message : 'Unknown');
      isProcessingChunkRef.current = false;
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
        staysActiveInBackground: true, // Keep recording if app goes background briefly
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
      
      // Clear any existing intervals just in case
      if (chunkIntervalRef.current) {
        clearInterval(chunkIntervalRef.current);
      }

      // Use 3000ms interval to match the chunk processing check
      chunkIntervalRef.current = setInterval(async () => {
        await processLiveChunk();
      }, 3000);
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
    transcriptRef.current = ''; // Reset ref
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
    
    // 1. Mark as stopping to prevent new chunks
    isStoppingRef.current = true;
    setIsRecording(false);
    setError(null);
    setIsFetchingFinal(true);
    
    // 2. Clear intervals immediately
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
      // 3. Wait for any pending chunk processing to finish (up to 2s)
      let waitTime = 0;
      while (isProcessingChunkRef.current && waitTime < 2000) {
        await new Promise(r => setTimeout(r, 100));
        waitTime += 100;
      }

      // 4. Use the REF for the most up-to-date transcript (avoiding state staleness)
      const currentTranscript = transcriptRef.current.trim() || liveTranscript.trim();
      
      if (Platform.OS === 'web' && currentTranscript) {
        console.log('✨ Instant result from live transcription');
        setLiveTranscript('');
        transcriptRef.current = '';
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
        transcriptRef.current = '';
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
      transcriptRef.current = '';
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
      // Fallback to what we have
      const fallback = transcriptRef.current.trim() || liveTranscript.trim() || null;
      setLiveTranscript('');
      transcriptRef.current = '';
      return fallback;
    } finally {
        setIsFetchingFinal(false);
    }
  }, [isRecording, stopRecordingMobile, stopRecordingWeb, transcribeAudio, liveTranscript]);

  const cancelRecording = useCallback(async () => {
    isStoppingRef.current = true;
    setIsRecording(false);
    setError(null);
    setLiveTranscript('');
    transcriptRef.current = '';
    setRecordingDuration(0);
    setConfidence(0);
    isProcessingChunkRef.current = false;
    setIsFetchingFinal(false);
    
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
    isTranscribing: isFetchingFinal,
    error,
    liveTranscript,
    recordingDuration,
    confidence,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
