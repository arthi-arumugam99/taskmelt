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

function safeTrim(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function extractTextFromSttResponse(responseText: string): string {
  const trimmedResponse = responseText.trim();
  if (!trimmedResponse) return '';

  if (trimmedResponse.startsWith('{') || trimmedResponse.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(trimmedResponse);

      if (Array.isArray(parsed)) {
        const first = parsed[0] as unknown;
        if (typeof first === 'string') return first.trim();
        if (first && typeof first === 'object' && 'text' in (first as Record<string, unknown>)) {
          return safeTrim((first as Record<string, unknown>).text);
        }
        return '';
      }

      if (parsed && typeof parsed === 'object') {
        const obj = parsed as Record<string, unknown>;
        if (typeof obj.text === 'string') return obj.text.trim();
        if (typeof obj.transcription === 'string') return obj.transcription.trim();
        const firstString = Object.values(obj).find((v) => typeof v === 'string' && v.trim().length > 0);
        return safeTrim(firstString);
      }

      return '';
    } catch (e) {
      console.warn('STT JSON parse failed, treating as raw text:', e);
      if (!trimmedResponse.toLowerCase().includes('error')) {
        return trimmedResponse;
      }
      return '';
    }
  }

  return trimmedResponse;
}

export function useVoiceRecording(): UseVoiceRecordingReturn {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [confidence, setConfidence] = useState<number>(0);
  const [isFetchingFinal, setIsFetchingFinal] = useState<boolean>(false);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const isStoppingRef = useRef<boolean>(false);
  const transcriptRef = useRef<string>('');

  const { mutateAsync: transcribeAudio, reset: resetTranscription } = useMutation({
    mutationFn: async (formData: FormData): Promise<string> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      try {
        console.log('📤 STT request ->', STT_API_URL);

        const response = await fetch(STT_API_URL, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseText = await response.text();
        console.log('📥 STT raw response (first 200):', responseText.slice(0, 200));

        if (!response.ok) {
          console.error('STT API error status:', response.status);
          console.error('STT API error body:', responseText);
          throw new Error(`Transcribe failed: ${response.status}`);
        }

        const transcribedText = extractTextFromSttResponse(responseText).trim();

        if (transcribedText.toLowerCase().includes('invalid json') || transcribedText.toLowerCase().includes('backend error')) {
          return '';
        }

        return transcribedText;
      } catch (err) {
        clearTimeout(timeoutId);
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('⏱️ STT timeout');
          return '';
        }
        throw err;
      }
    },
  });

  const startRecordingMobile = useCallback(async () => {
    console.log('🎤 startRecordingMobile');

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
      staysActiveInBackground: false,
    });

    const recording = new Audio.Recording();

    await recording.prepareToRecordAsync({
      android: {
        extension: '.m4a',
        outputFormat: Audio.AndroidOutputFormat.MPEG_4,
        audioEncoder: Audio.AndroidAudioEncoder.AAC,
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 96000,
      },
      ios: {
        extension: '.wav',
        outputFormat: Audio.IOSOutputFormat.LINEARPCM,
        audioQuality: Audio.IOSAudioQuality.HIGH,
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 1411200,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      web: {
        mimeType: 'audio/webm',
        bitsPerSecond: 96000,
      },
    });

    await recording.startAsync();
    recordingRef.current = recording;

    const status = await recording.getStatusAsync();
    console.log('✅ Mobile recording started. status:', status);
  }, []);

  const startRecordingWeb = useCallback(async () => {
    console.log('🌐 startRecordingWeb');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Voice recording is not supported in this browser');
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    audioChunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      audioBitsPerSecond: 96000,
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onerror = (e) => {
      console.log('MediaRecorder error:', e);
    };

    mediaRecorder.start(250);
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
          const transcript = result?.[0]?.transcript ?? '';
          const confidenceScore = result?.[0]?.confidence ?? 0;

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

        setLiveTranscript((prev) => {
          const committed = (prev + finalTranscript).trim();
          const combined = interimTranscript ? `${committed} ${interimTranscript}`.trim() : committed;
          transcriptRef.current = combined;
          return combined;
        });
      };

      recognition.onerror = (event: any) => {
        if (event?.error !== 'no-speech' && event?.error !== 'aborted') {
          console.log('Speech recognition error:', event?.error);
        }
      };

      recognition.onstart = () => {
        console.log('✅ Web live transcription active');
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
      } catch (e) {
        console.log('SpeechRecognition start failed:', e);
      }
    }

    console.log('✅ Web recording started');
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setLiveTranscript('');
    transcriptRef.current = '';
    setRecordingDuration(0);
    setConfidence(0);
    setIsFetchingFinal(false);
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

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }

      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
        setRecordingDuration(elapsed);
      }, 500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      setError(message);
      console.error('Recording start error:', err);
    }
  }, [resetTranscription, startRecordingMobile, startRecordingWeb]);

  const stopRecordingMobile = useCallback(async (): Promise<FormData | null> => {
    const recording = recordingRef.current;
    if (!recording) {
      console.log('stopRecordingMobile: no active recording');
      return null;
    }

    try {
      const before = await recording.getStatusAsync();
      console.log('🛑 stopRecordingMobile. status before stop:', before);

      await recording.stopAndUnloadAsync();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      recordingRef.current = null;

      console.log('📼 Recording URI:', uri);

      if (!uri) {
        return null;
      }

      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1] || 'm4a';

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
    if (!mediaRecorder) {
      console.log('stopRecordingWeb: no active MediaRecorder');
      return null;
    }

    return new Promise((resolve, reject) => {
      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }

          console.log('📼 Web recording blob size:', audioBlob.size);

          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          mediaRecorderRef.current = null;
          audioChunksRef.current = [];

          resolve(formData);
        } catch (err) {
          reject(err);
        }
      };

      try {
        mediaRecorder.stop();
      } catch (e) {
        reject(e);
      }
    });
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!isRecording) return null;

    isStoppingRef.current = true;
    setIsRecording(false);
    setError(null);
    setIsFetchingFinal(true);

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log('SpeechRecognition stop failed:', e);
      }
      recognitionRef.current = null;
    }

    try {
      const currentTranscript = transcriptRef.current.trim() || liveTranscript.trim();

      if (Platform.OS === 'web' && currentTranscript) {
        console.log('✨ Using instant web live transcript');
        setLiveTranscript('');
        transcriptRef.current = '';
        setConfidence(0);
        return currentTranscript;
      }

      const stopStart = Date.now();
      const formData = Platform.OS === 'web' ? await stopRecordingWeb() : await stopRecordingMobile();
      console.log('🧾 stopRecording: formData ready in', Date.now() - stopStart, 'ms');

      if (!formData) {
        const result = currentTranscript || null;
        setLiveTranscript('');
        transcriptRef.current = '';
        setConfidence(0);
        return result;
      }

      const startTime = Date.now();
      const transcribedText = await transcribeAudio(formData);
      const elapsed = Date.now() - startTime;
      console.log(`✅ STT done in ${elapsed}ms`);

      const finalText = currentTranscript ? `${currentTranscript} ${transcribedText}`.trim() : transcribedText.trim();

      setLiveTranscript('');
      transcriptRef.current = '';
      setConfidence(0);

      if (!finalText) {
        console.log('🫥 No speech detected / empty transcript');
        return null;
      }

      return finalText;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process recording';
      setError(message);
      console.error('Recording stop error:', err);

      const fallback = transcriptRef.current.trim() || liveTranscript.trim() || null;
      setLiveTranscript('');
      transcriptRef.current = '';
      return fallback;
    } finally {
      setIsFetchingFinal(false);
    }
  }, [isRecording, liveTranscript, stopRecordingMobile, stopRecordingWeb, transcribeAudio]);

  const cancelRecording = useCallback(async () => {
    isStoppingRef.current = true;
    setIsRecording(false);
    setError(null);
    setLiveTranscript('');
    transcriptRef.current = '';
    setRecordingDuration(0);
    setConfidence(0);
    setIsFetchingFinal(false);

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
