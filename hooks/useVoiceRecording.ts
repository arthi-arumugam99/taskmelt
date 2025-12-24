import { useState, useRef, useCallback, useEffect } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import { Audio } from 'expo-av';

const STT_API_URL = 'https://toolkit.rork.com/stt/transcribe/';
const MAX_RECORDING_DURATION = 60;

interface UseVoiceRecordingReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  error: string | null;
  recordingDuration: number;
  startRecording: (onTranscriptUpdate: (text: string) => void) => Promise<void>;
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
  const transcriptRef = useRef<string>('');
  const finalTranscriptRef = useRef<string>('');
  const lastResultIndexRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  const onTranscriptUpdateRef = useRef<((text: string) => void) | null>(null);
  const stopRecordingRef = useRef<(() => Promise<string | null>) | null>(null);

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
    const timeoutId = setTimeout(() => controller.abort(), 15000);

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
      
      if (!responseText || responseText.trim() === '') {
        console.warn('⚠️ Empty response from STT API');
        return '';
      }
      
      // Check if response looks like JSON at all
      const trimmedResponse = responseText.trim();
      const looksLikeJSON = trimmedResponse.startsWith('{') || trimmedResponse.startsWith('[');
      
      if (!looksLikeJSON) {
        console.error('❌ Response does not look like JSON:', responseText.substring(0, 100));
        const lowerResponse = responseText.toLowerCase();
        
        if (lowerResponse.includes('html') || trimmedResponse.startsWith('<')) {
          throw new Error('Service temporarily unavailable. Please try again.');
        }
        if (lowerResponse.includes('offline') || lowerResponse.includes('maintenance')) {
          throw new Error('Service is offline. Please try again later.');
        }
        if (lowerResponse.includes('network') || lowerResponse.includes('connection')) {
          throw new Error('Network error. Please check your connection.');
        }
        if (lowerResponse.includes('error') && responseText.length < 200) {
          throw new Error(`Service error: ${responseText}`);
        }
        throw new Error('Service returned invalid response. Please try again.');
      }
      
      // Check if response is not JSON based on content-type
      if (!contentType.includes('application/json') && !contentType.includes('text/json')) {
        console.warn('⚠️ Non-JSON content-type but response looks like JSON:', contentType);
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('📥 Parsed STT response:', JSON.stringify(data));
      } catch (parseError) {
        console.error('❌ Failed to parse STT response as JSON:', parseError);
        console.error('Response was:', responseText.substring(0, 500));
        
        // Try to give a more helpful error message
        if (responseText.length < 200) {
          throw new Error(`Could not process response: ${responseText}`);
        }
        throw new Error('Service returned malformed data. Please try again.');
      }
      
      const text = data?.text?.trim() || '';
      console.log('✅ Transcribed text:', text || '(empty)');
      console.log('📊 Text length:', text.length, 'characters');
      
      if (!text || text.length === 0) {
        console.warn('⚠️ Transcription returned empty text');
        return '';
      }
      
      return text;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        console.error('⏱️ STT request timed out');
        throw new Error('Transcription timeout - try shorter audio');
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
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 32000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.LOW,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 32000,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 32000,
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
          console.log('🗣️ Speech result received, results:', event.results.length);
          let interimTranscript = '';
          let newFinalTranscript = '';

          for (let i = 0; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result?.[0]?.transcript ?? '';

            if (result.isFinal) {
              if (i >= lastResultIndexRef.current) {
                newFinalTranscript += transcript + ' ';
                lastResultIndexRef.current = i + 1;
                console.log('✓ Final transcript:', transcript);
              }
            } else {
              interimTranscript = transcript;
              console.log('⋯ Interim transcript:', transcript.substring(0, 50));
            }
          }

          if (newFinalTranscript) {
            finalTranscriptRef.current = (finalTranscriptRef.current + newFinalTranscript).trim();
            console.log('📝 Updated final transcript:', finalTranscriptRef.current.substring(0, 100));
          }

          const displayText = interimTranscript
            ? `${finalTranscriptRef.current} ${interimTranscript}`.trim()
            : finalTranscriptRef.current;

          transcriptRef.current = displayText;
          console.log('🔄 Update callback status:', {
            hasCallback: !!onTranscriptUpdateRef.current,
            displayTextLength: displayText.length,
            preview: displayText.substring(0, 100)
          });
          
          if (onTranscriptUpdateRef.current) {
            try {
              onTranscriptUpdateRef.current(displayText);
              console.log('✅ Callback executed successfully');
            } catch (err) {
              console.error('❌ Callback error:', err);
            }
          } else {
            console.warn('⚠️ No update callback registered!');
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

  const startRecording = useCallback(async (onTranscriptUpdate: (text: string) => void) => {
    console.log('🎬 startRecording called, Platform:', Platform.OS);

    setError(null);
    transcriptRef.current = '';
    finalTranscriptRef.current = '';
    lastResultIndexRef.current = 0;
    setRecordingDuration(0);
    setIsTranscribing(false);
    recordingStartTimeRef.current = Date.now();
    onTranscriptUpdateRef.current = onTranscriptUpdate;

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

        if (elapsed >= MAX_RECORDING_DURATION) {
          console.log('⏱️ Max recording duration reached, auto-stopping');
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
      console.log('🕐 Recording duration:', durationMs, 'ms (', (durationMs / 1000).toFixed(1), 's)');
      
      if (durationMs < 1000) {
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
      console.log('✨ Web platform - processing live transcript');
      
      // Stop recognition FIRST and wait for final results
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          console.log('🛑 Speech recognition stopped');
        } catch (e) {
          console.log('Speech recognition stop error:', e);
        }
        recognitionRef.current = null;
        
        // Wait for final results to be processed
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Capture transcripts AFTER stopping and waiting
      const capturedFinalTranscript = finalTranscriptRef.current.trim();
      const capturedDisplayTranscript = transcriptRef.current.trim();
      
      console.log('📝 Final transcript:', capturedFinalTranscript.slice(0, 100) || '(empty)');
      console.log('📝 Display transcript:', capturedDisplayTranscript.slice(0, 100) || '(empty)');
      
      // Use the longer transcript
      const webTranscript = capturedFinalTranscript.length >= capturedDisplayTranscript.length 
        ? capturedFinalTranscript 
        : capturedDisplayTranscript;
      
      console.log('📝 Selected web transcript (length:', webTranscript.length, '):', webTranscript.slice(0, 100) || '(empty)');
      
      // Stop media recorder
      if (mediaRecorderRef.current) {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.log('MediaRecorder stop:', e);
        }
        mediaRecorderRef.current = null;
      }
      
      // Stop stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Clear refs
      transcriptRef.current = '';
      finalTranscriptRef.current = '';
      lastResultIndexRef.current = 0;
      onTranscriptUpdateRef.current = null;
      
      const finalWebResult = webTranscript.trim();
      console.log('✅ Returning web transcript (final):', finalWebResult ? finalWebResult.slice(0, 100) : '(EMPTY - NO SPEECH DETECTED)');
      
      if (!finalWebResult) {
        if (isMountedRef.current) {
          setError('No speech detected. Please speak clearly and closer to your microphone.');
        }
        return null;
      }
      
      return finalWebResult;
    }

    // Mobile recording - stop recognition if running
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log('Speech recognition stop:', e);
      }
      recognitionRef.current = null;
    }

    const capturedTranscript = transcriptRef.current.trim();
    console.log('📝 Mobile: captured live transcript:', capturedTranscript.slice(0, 100) || '(empty)');

    try {

      setIsTranscribing(true);
      console.log('🔄 Starting mobile transcription...');

      const formData = await stopRecordingMobile();

      if (!formData) {
        console.log('⚠️ No audio data captured');
        if (isMountedRef.current) {
          setIsTranscribing(false);
          transcriptRef.current = '';
          onTranscriptUpdateRef.current = null;
        }
        if (!capturedTranscript) {
          if (isMountedRef.current) {
            setError('Recording failed. Please check microphone permissions and try again.');
          }
          return null;
        }
        return capturedTranscript;
      }

      console.log('📤 Sending to transcription API...');
      const transcribedText = await transcribeAudio(formData);
      console.log('📥 API Transcription result:', transcribedText.slice(0, 100) || '(empty)');
      console.log('📥 API Transcription length:', transcribedText.length);

      if (!isMountedRef.current) return null;

      const finalText = transcribedText.trim() || capturedTranscript.trim();
      console.log('📊 Final text combining:', { transcribed: transcribedText.length, captured: capturedTranscript.length, final: finalText.length });

      transcriptRef.current = '';
      setIsTranscribing(false);
      onTranscriptUpdateRef.current = null;

      if (!finalText) {
        console.warn('⚠️ Empty transcription result - no speech detected');
        if (isMountedRef.current) {
          setError('Could not detect speech. Please speak clearly, louder, and closer to the microphone. Make sure you speak for at least 2-3 seconds.');
        }
        return null;
      }

      console.log('✅ Final mobile transcribed text:', finalText.slice(0, 100));
      return finalText;
    } catch (err) {
      console.error('❌ Stop recording error:', err);
      const message = err instanceof Error ? err.message : 'Transcription failed';
      
      if (isMountedRef.current) {
        setError(message);
        setIsTranscribing(false);
        transcriptRef.current = '';
        onTranscriptUpdateRef.current = null;
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
    transcriptRef.current = '';
    finalTranscriptRef.current = '';
    lastResultIndexRef.current = 0;
    setRecordingDuration(0);
    onTranscriptUpdateRef.current = null;

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
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
