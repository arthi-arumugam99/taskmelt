import { useState, useRef, useCallback, useEffect } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import { Audio } from 'expo-av';

const STT_API_URL = 'https://toolkit.rork.com/stt/transcribe/';
const MAX_RECORDING_DURATION = 60;
const MIN_RECORDING_DURATION_MS = 500;

interface UseVoiceRecordingReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  error: string | null;
  recordingDuration: number;
  liveTranscript: string;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  cancelRecording: () => void;
}



export function useVoiceRecording(): UseVoiceRecordingReturn {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const recordingDurationRef = useRef<number>(0);
  const transcriptRef = useRef<string>('');
  const finalTranscriptRef = useRef<string>('');
  const lastResultIndexRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  const stopRecordingRef = useRef<(() => Promise<string | null>) | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<string>('');

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
    const timeoutId = setTimeout(() => controller.abort(), 20000);

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
        throw new Error(`Transcription service error (${response.status}). Please try again.`);
      }

      const contentType = response.headers.get('content-type') || '';
      console.log('📥 Response content-type:', contentType);
      
      const responseText = await response.text();
      console.log('📥 Raw STT response:', responseText.substring(0, 200));
      console.log('📥 Response length:', responseText.length, 'bytes');
      
      if (!responseText || responseText.trim() === '') {
        console.warn('⚠️ Empty response from STT API');
        throw new Error('Could not transcribe audio. Please speak louder and longer.');
      }
      
      const trimmedResponse = responseText.trim();
      
      if (!trimmedResponse) {
        throw new Error('Empty response from service. Please try again.');
      }
      
      const looksLikeJSON = trimmedResponse.startsWith('{') || trimmedResponse.startsWith('[');
      
      console.log('🔍 Response analysis:', {
        length: trimmedResponse.length,
        startsWithBrace: trimmedResponse.startsWith('{'),
        startsWithBracket: trimmedResponse.startsWith('['),
        firstChars: trimmedResponse.substring(0, 30),
        looksLikeJSON,
      });
      
      if (!looksLikeJSON) {
        console.error('❌ Response does not look like JSON:', responseText.substring(0, 200));
        const lowerResponse = responseText.toLowerCase();
        
        if (lowerResponse.includes('html') || trimmedResponse.startsWith('<')) {
          throw new Error('Service error occurred. Please try again.');
        }
        if (lowerResponse.includes('no audio') || lowerResponse.includes('no speech') || lowerResponse.includes('could not')) {
          throw new Error('No speech detected. Please speak clearly for 2-3 seconds.');
        }
        if (lowerResponse.includes('error') || lowerResponse.includes('fail')) {
          throw new Error('Transcription failed. Please try again.');
        }
        
        console.error('❌ Unexpected response format. First 100 chars:', responseText.substring(0, 100));
        throw new Error('Unexpected service response. Please try again.');
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('📥 Parsed STT response:', JSON.stringify(data).substring(0, 200));
      } catch (parseError) {
        const error = parseError as Error;
        console.error('❌ JSON Parse Error:', {
          message: error.message,
          responseStart: responseText.substring(0, 100),
          responseLength: responseText.length,
        });
        throw new Error('Invalid service response format. Please try again.');
      }
      
      const text = data?.text?.trim() || '';
      console.log('✅ Transcribed text:', text || '(empty)');
      console.log('📊 Text length:', text.length, 'characters');
      
      if (!text || text.length === 0) {
        console.warn('⚠️ Transcription returned empty text');
        
        if (data?.error) {
          const errorMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
          throw new Error(errorMsg);
        }
        
        throw new Error('No speech detected. Speak louder for 2-3 seconds.');
      }
      
      return text;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        console.error('⏱️ STT request timed out');
        throw new Error('Transcription timeout. Please try again.');
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
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        console.log('🔐 Requesting microphone permission...');
        const { status } = await Audio.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Microphone Permission',
          'Microphone access is required for voice recording.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Settings',
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

      console.log('🔧 Setting audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      console.log('📱 Creating recording instance...');
      const recording = new Audio.Recording();
      recordingRef.current = recording;
      
      console.log('⚙️ Preparing recorder...');
      await recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 64000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.MEDIUM,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 64000,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      console.log('✓ Recorder prepared, checking status...');
      const preparedStatus = await recording.getStatusAsync();
      console.log('📊 Prepared status:', JSON.stringify(preparedStatus));
      
      if (!preparedStatus.canRecord) {
        throw new Error('Recorder is not ready to record');
      }

      console.log('▶️ Starting recording...');
      await recording.startAsync();
      
      const startedStatus = await recording.getStatusAsync();
      console.log('📊 Started status:', JSON.stringify(startedStatus));
      
      if (!startedStatus.isRecording) {
        throw new Error('Recording failed to start');
      }
      
      console.log('✅ Mobile recording started successfully');
    } catch (err) {
      console.error('❌ Mobile recording error:', err);
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch (cleanupErr) {
          console.log('Error during cleanup:', cleanupErr);
        }
      }
      recordingRef.current = null;
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      }).catch(() => {});
      throw err;
    }
  }, []);

  const startRecordingWeb = useCallback(async () => {
    console.log('🌐 Starting web recording...');

    const isEmbedded = typeof window !== 'undefined' && window.self !== window.top;
    const isSecureContext = typeof window !== 'undefined' ? window.isSecureContext : true;
    const protocol = typeof window !== 'undefined' ? window.location?.protocol : undefined;

    console.log('🌐 Web env:', {
      isEmbedded,
      isSecureContext,
      protocol,
      hasMediaDevices: !!navigator?.mediaDevices,
      hasGetUserMedia: !!navigator?.mediaDevices?.getUserMedia,
    });

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Voice recording is not supported in this browser');
    }

    if (!isSecureContext && protocol !== 'http:' && protocol !== 'https:') {
      throw new Error('Microphone access requires a secure context (https or localhost).');
    }

    if (!isSecureContext && protocol === 'http:') {
      throw new Error('Microphone access requires https (or localhost). Please use the secure URL, then try again.');
    }

    try {
      if (navigator.permissions?.query) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          console.log('🎛️ Microphone permission state (web):', permissionStatus.state);
          if (permissionStatus.state === 'denied') {
            throw new Error(
              'Microphone permission is blocked. Please allow microphone access in your browser settings, then refresh the page.'
            );
          }
        } catch (e) {
          console.log('Permissions API query failed (ignored):', e);
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

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

      mediaRecorder.onerror = (e) => {
        console.error('MediaRecorder error:', e);
      };

      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        console.log('🎤 Initializing Speech Recognition...');
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let newFinalTranscript = '';

          for (let i = 0; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result?.[0]?.transcript ?? '';

            if (result.isFinal) {
              if (i >= lastResultIndexRef.current) {
                newFinalTranscript += transcript + ' ';
                lastResultIndexRef.current = i + 1;
              }
            } else {
              interimTranscript = transcript;
            }
          }

          if (newFinalTranscript) {
            finalTranscriptRef.current = (finalTranscriptRef.current + newFinalTranscript).trim();
          }

          const displayText = interimTranscript
            ? `${finalTranscriptRef.current} ${interimTranscript}`.trim()
            : finalTranscriptRef.current;

          transcriptRef.current = displayText;
          
          if (isMountedRef.current) {
            setLiveTranscript(displayText);
          }
        };

        recognition.onerror = (event: any) => {
          console.error('❌ Speech recognition error:', event?.error, event);
          if (event?.error !== 'no-speech' && event?.error !== 'aborted') {
            if (event?.error === 'not-allowed') {
              console.error('Microphone permission denied for speech recognition');
            }
          }
        };

        recognition.onstart = () => {
          console.log('✅ Speech Recognition started successfully');
        };

        recognition.onend = () => {
          console.log('🛑 Speech Recognition ended');
        };

        try {
          recognition.start();
          recognitionRef.current = recognition;
          console.log('📞 Speech Recognition start() called');
        } catch (e) {
          const rawMessage = e instanceof Error ? e.message : String(e);
          const lowered = rawMessage.toLowerCase();
          console.error('❌ Failed to start speech recognition:', e);

          if (lowered.includes('notallowed') || lowered.includes('not-allowed') || lowered.includes('permission')) {
            console.warn('⚠️ Speech recognition permission denied. Continuing with recording only.');
          } else {
            throw new Error('Failed to start live transcription: ' + rawMessage);
          }
        }
      } else {
        console.warn('⚠️ Speech Recognition API not available in this browser');
        console.warn('Live transcription will not work. Only recording will be available.');
      }

      console.log('✅ Recording started');
    } catch (e) {
      const rawMessage = e instanceof Error ? e.message : String(e);
      const lowered = rawMessage.toLowerCase();
      const errAny = e as any;
      const errorName = typeof errAny?.name === 'string' ? errAny.name : undefined;

      console.error('❌ Web recording start error:', {
        name: errorName,
        message: rawMessage,
        error: e,
      });

      if (streamRef.current) {
        try {
          streamRef.current.getTracks().forEach((track) => track.stop());
        } catch {
          // ignore
        }
        streamRef.current = null;
      }

      const isEmbedded = typeof window !== 'undefined' && window.self !== window.top;
      const isSecureContext = typeof window !== 'undefined' ? window.isSecureContext : true;

      if (!isSecureContext) {
        throw new Error('Microphone access requires https (or localhost). Please use the secure URL, then try again.');
      }

      if (
        isEmbedded &&
        (lowered.includes('notallowed') || lowered.includes('permission denied') || lowered.includes('not-allowed') || errorName === 'NotAllowedError')
      ) {
        throw new Error(
          'Microphone access is blocked in this embedded preview. Open the app in a new tab (or scan the QR code) and allow microphone access, then try again.'
        );
      }

      if (lowered.includes('notallowed') || lowered.includes('permission denied') || lowered.includes('not-allowed') || errorName === 'NotAllowedError') {
        throw new Error(
          'Microphone permission denied. Please allow microphone access in your browser/site settings, then try again.'
        );
      }

      if (lowered.includes('notfounderror') || lowered.includes('requested device not found') || errorName === 'NotFoundError') {
        throw new Error('No microphone found. Please connect a microphone and try again.');
      }

      throw new Error(rawMessage || 'Failed to start recording');
    }
  }, []);

  const startRecording = useCallback(async () => {
    console.log('🎬 startRecording called, Platform:', Platform.OS);

    setError(null);
    setLiveTranscript('');
    transcriptRef.current = '';
    finalTranscriptRef.current = '';
    lastResultIndexRef.current = 0;
    setRecordingDuration(0);
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

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }

      durationIntervalRef.current = setInterval(() => {
        if (!isMountedRef.current) return;
        const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
        recordingDurationRef.current = elapsed;
        setRecordingDuration(elapsed);

        if (elapsed >= MAX_RECORDING_DURATION) {
          console.log('⏱️ Max recording duration reached');
          if (stopRecordingRef.current) {
            stopRecordingRef.current();
          }
        }
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
      
      const durationMs = status.durationMillis || 0;
      console.log('🕐 Recording duration:', durationMs, 'ms');
      
      if (durationMs < MIN_RECORDING_DURATION_MS) {
        console.warn('⚠️ Recording too short:', durationMs, 'ms');
        throw new Error('Recording too short. Please speak for at least 1 second.');
      }
      
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

      const fileType = 'm4a';
      const mimeType = 'audio/m4a';
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

    if (Platform.OS === 'web') {
      console.log('✨ Web platform - using live transcript');
      
      const capturedTranscript = transcriptRef.current.trim();
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log('Recognition stop:', e);
        }
        await new Promise(resolve => setTimeout(resolve, 300));
        recognitionRef.current = null;
      }

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
      
      const finalTranscript = finalTranscriptRef.current.trim() || capturedTranscript;
      
      transcriptRef.current = '';
      finalTranscriptRef.current = '';
      lastResultIndexRef.current = 0;
      setLiveTranscript('');
      
      if (!finalTranscript) {
        if (isMountedRef.current) {
          setError('No speech detected');
        }
        return null;
      }
      
      console.log('✅ Web transcript:', finalTranscript.slice(0, 100));
      return finalTranscript;
    }

    try {
      setIsTranscribing(true);

      const formData = await stopRecordingMobile();

      if (!formData) {
        if (isMountedRef.current) {
          setIsTranscribing(false);
          setError('Failed to capture audio');
        }
        return null;
      }

      const transcribedText = await transcribeAudio(formData);

      if (!isMountedRef.current) return null;

      transcriptRef.current = '';
      finalTranscriptRef.current = '';
      setIsTranscribing(false);
      setLiveTranscript('');

      if (!transcribedText || transcribedText.trim().length === 0) {
        if (isMountedRef.current) {
          setError('No speech detected');
        }
        return null;
      }

      if (isMountedRef.current) {
        setError(null);
      }

      console.log('✅ Mobile transcript:', transcribedText.slice(0, 100));
      return transcribedText.trim();
    } catch (err) {
      console.error('❌ Transcription error:', err);
      const message = err instanceof Error ? err.message : 'Transcription failed';
      
      if (isMountedRef.current) {
        setError(message);
        setIsTranscribing(false);
      }
      
      return null;
    }
  }, [isRecording, stopRecordingMobile, transcribeAudio]);

  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  const cancelRecording = useCallback(async () => {
    setIsRecording(false);
    setIsTranscribing(false);
    setError(null);
    setLiveTranscript('');
    transcriptRef.current = '';
    finalTranscriptRef.current = '';
    lastResultIndexRef.current = 0;
    setRecordingDuration(0);

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
    recordingDuration,
    liveTranscript,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
