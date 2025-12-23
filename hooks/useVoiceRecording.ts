import { useState, useRef, useCallback, useEffect } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import { Audio } from 'expo-av';

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
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [confidence, setConfidence] = useState<number>(0);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const transcriptRef = useRef<string>('');
  const finalTranscriptRef = useRef<string>('');
  const lastResultIndexRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  const transcribeAudio = useCallback(async (formData: FormData): Promise<string> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      console.log('📤 Sending audio to STT API...');
      const startTime = Date.now();

      const response = await fetch(STT_API_URL, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(`⏱️ STT API responded in ${Date.now() - startTime}ms, status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ STT API error:', response.status, errorText);
        throw new Error(`Transcription failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('📥 STT response:', JSON.stringify(data));
      
      const text = data?.text?.trim() || '';
      console.log('✅ Transcribed text:', text || '(empty)');
      return text;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        console.error('⏱️ STT request timed out');
        throw new Error('Transcription timed out');
      }
      console.error('❌ STT error:', err);
      throw err;
    }
  }, []);

  const startRecordingMobile = useCallback(async () => {
    console.log('🎤 Starting mobile recording...');

    try {
      if (recordingRef.current) {
        console.log('⚠️ Cleaning up existing recording...');
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch (e) {
          console.log('Cleanup error (ignored):', e);
        }
        recordingRef.current = null;
      }

      const { status: existingStatus } = await Audio.getPermissionsAsync();
      console.log('📋 Current permission status:', existingStatus);
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        console.log('🔐 Requesting microphone permission...');
        const { status } = await Audio.requestPermissionsAsync();
        finalStatus = status;
        console.log('📋 New permission status:', finalStatus);
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

      console.log('🔊 Setting audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      console.log('🎙️ Creating recording...');
      
      const recordingOptions = {
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
      };

      const recording = new Audio.Recording();
      
      try {
        await recording.prepareToRecordAsync(recordingOptions);
        console.log('✅ Recording prepared');
      } catch (prepareError) {
        console.error('❌ Prepare error:', prepareError);
        throw prepareError;
      }
      
      await recording.startAsync();
      recordingRef.current = recording;
      
      const status = await recording.getStatusAsync();
      console.log('✅ Recording started, status:', JSON.stringify(status));
    } catch (err) {
      console.error('❌ Mobile recording error:', err);
      throw err;
    }
  }, []);

  const startRecordingWeb = useCallback(async () => {
    console.log('🌐 Starting web recording...');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Voice recording is not supported in this browser');
    }

    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
      } 
    });
    streamRef.current = stream;
    audioChunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
      ? 'audio/webm;codecs=opus' 
      : 'audio/webm';

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      audioBitsPerSecond: 128000,
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onerror = (e) => {
      console.error('MediaRecorder error:', e);
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
        let newFinalTranscript = '';
        let maxConfidence = 0;

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result?.[0]?.transcript ?? '';
          const confidenceScore = result?.[0]?.confidence ?? 0;

          if (confidenceScore > maxConfidence) {
            maxConfidence = confidenceScore;
          }

          if (result.isFinal) {
            if (i >= lastResultIndexRef.current) {
              newFinalTranscript += transcript + ' ';
              lastResultIndexRef.current = i + 1;
            }
          } else {
            interimTranscript = transcript;
          }
        }

        setConfidence(maxConfidence);

        if (newFinalTranscript) {
          finalTranscriptRef.current = (finalTranscriptRef.current + newFinalTranscript).trim();
        }

        const displayText = interimTranscript 
          ? `${finalTranscriptRef.current} ${interimTranscript}`.trim() 
          : finalTranscriptRef.current;
        
        transcriptRef.current = displayText;
        setLiveTranscript(displayText);
      };

      recognition.onerror = (event: any) => {
        if (event?.error !== 'no-speech' && event?.error !== 'aborted') {
          console.error('Speech recognition error:', event?.error);
        }
      };

      recognition.onstart = () => {
        console.log('✅ Live transcription active');
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
      } catch (e) {
        console.error('Failed to start speech recognition:', e);
      }
    } else {
      console.log('⚠️ Speech Recognition not available');
    }

    console.log('✅ Recording started');
  }, []);

  const startRecording = useCallback(async () => {
    console.log('🎬 startRecording called, Platform:', Platform.OS);
    
    setError(null);
    setLiveTranscript('');
    transcriptRef.current = '';
    finalTranscriptRef.current = '';
    lastResultIndexRef.current = 0;
    setRecordingDuration(0);
    setConfidence(0);
    setIsTranscribing(false);
    recordingStartTimeRef.current = Date.now();

    try {
      if (Platform.OS === 'web') {
        await startRecordingWeb();
      } else {
        await startRecordingMobile();
      }

      if (!isMountedRef.current) return;
      
      setIsRecording(true);
      console.log('✅ isRecording set to true');

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }

      durationIntervalRef.current = setInterval(() => {
        if (!isMountedRef.current) return;
        const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
        setRecordingDuration(elapsed);
      }, 500);
    } catch (err) {
      console.error('❌ Recording start error:', err);
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      if (isMountedRef.current) {
        setError(message);
        setIsRecording(false);
      }
    }
  }, [startRecordingMobile, startRecordingWeb]);

  const stopRecordingMobile = useCallback(async (): Promise<FormData | null> => {
    const recording = recordingRef.current;
    if (!recording) {
      console.log('⚠️ No active recording to stop');
      return null;
    }

    try {
      console.log('🛑 Stopping mobile recording...');
      
      const status = await recording.getStatusAsync();
      console.log('📊 Recording status before stop:', JSON.stringify(status));
      
      await recording.stopAndUnloadAsync();
      console.log('✅ Recording stopped and unloaded');

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      console.log('🔇 Audio mode reset');

      const uri = recording.getURI();
      recordingRef.current = null;

      if (!uri) {
        console.error('❌ No recording URI available');
        return null;
      }

      console.log('📼 Recording URI:', uri);

      const fileType = Platform.OS === 'ios' ? 'wav' : 'm4a';
      const mimeType = Platform.OS === 'ios' ? 'audio/wav' : 'audio/m4a';
      console.log('📁 File type:', fileType, 'MIME:', mimeType);

      const audioFile = {
        uri,
        name: `recording.${fileType}`,
        type: mimeType,
      };
      console.log('📦 Audio file object:', JSON.stringify(audioFile));

      const formData = new FormData();
      formData.append('audio', audioFile as unknown as Blob);

      return formData;
    } catch (err) {
      console.error('❌ Error stopping mobile recording:', err);
      recordingRef.current = null;
      throw err;
    }
  }, []);

  const stopRecordingWeb = useCallback(async (): Promise<FormData | null> => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder) {
      console.log('⚠️ No active MediaRecorder');
      return null;
    }

    return new Promise((resolve, reject) => {
      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          console.log('📼 Recording size:', audioBlob.size, 'bytes');

          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }

          if (audioBlob.size === 0) {
            console.error('❌ Empty audio recording');
            resolve(null);
            return;
          }

          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          mediaRecorderRef.current = null;
          audioChunksRef.current = [];

          resolve(formData);
        } catch (err) {
          console.error('❌ Error processing recording:', err);
          reject(err);
        }
      };

      try {
        mediaRecorder.stop();
      } catch (e) {
        console.error('❌ Error stopping MediaRecorder:', e);
        reject(e);
      }
    });
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    console.log('🛑 stopRecording called, isRecording:', isRecording);
    
    if (!isRecording && !recordingRef.current && !mediaRecorderRef.current) {
      console.log('⚠️ No active recording');
      return null;
    }

    setIsRecording(false);
    setError(null);

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log('Speech recognition stop:', e);
      }
      recognitionRef.current = null;
    }

    try {
      const currentTranscript = transcriptRef.current.trim() || liveTranscript.trim();
      console.log('📝 Current live transcript:', currentTranscript.slice(0, 50) || '(empty)');

      if (Platform.OS === 'web' && currentTranscript) {
        console.log('✨ Using live transcript for web');
        
        if (mediaRecorderRef.current) {
          try {
            mediaRecorderRef.current.stop();
          } catch (e) {
            console.log('MediaRecorder stop:', e);
          }
          mediaRecorderRef.current = null;
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        setLiveTranscript('');
        transcriptRef.current = '';
        setConfidence(0);
        return currentTranscript;
      }

      setIsTranscribing(true);
      console.log('🔄 Starting transcription...');

      const formData = Platform.OS === 'web' 
        ? await stopRecordingWeb() 
        : await stopRecordingMobile();

      if (!formData) {
        console.log('⚠️ No audio data captured');
        if (isMountedRef.current) {
          setIsTranscribing(false);
          setLiveTranscript('');
          transcriptRef.current = '';
          setConfidence(0);
        }
        return currentTranscript || null;
      }

      console.log('📤 Sending to transcription API...');
      const transcribedText = await transcribeAudio(formData);
      console.log('📥 Transcription result:', transcribedText.slice(0, 100) || '(empty)');

      if (!isMountedRef.current) return null;

      const finalText = currentTranscript 
        ? `${currentTranscript} ${transcribedText}`.trim() 
        : transcribedText.trim();

      setLiveTranscript('');
      transcriptRef.current = '';
      setConfidence(0);
      setIsTranscribing(false);

      if (!finalText) {
        console.log('⚠️ Empty transcription result');
        return null;
      }

      console.log('✅ Final transcribed text:', finalText.slice(0, 100));
      return finalText;
    } catch (err) {
      console.error('❌ Stop recording error:', err);
      const message = err instanceof Error ? err.message : 'Transcription failed';
      
      if (isMountedRef.current) {
        setError(message);
        setIsTranscribing(false);
        setLiveTranscript('');
        transcriptRef.current = '';
      }
      
      return null;
    }
  }, [isRecording, liveTranscript, stopRecordingMobile, stopRecordingWeb, transcribeAudio]);

  const cancelRecording = useCallback(async () => {
    setIsRecording(false);
    setIsTranscribing(false);
    setError(null);
    setLiveTranscript('');
    transcriptRef.current = '';
    finalTranscriptRef.current = '';
    lastResultIndexRef.current = 0;
    setRecordingDuration(0);
    setConfidence(0);

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log('SpeechRecognition cancel stop failed:', e);
      }
      recognitionRef.current = null;
    }

    if (Platform.OS === 'web') {
      if (mediaRecorderRef.current) {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.log('MediaRecorder cancel stop failed:', e);
        }
        mediaRecorderRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      audioChunksRef.current = [];
    } else {
      if (recordingRef.current) {
        try {
          const status = await recordingRef.current.getStatusAsync();
          console.log('cancelRecording mobile status:', status);
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
