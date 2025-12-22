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

function extractTextFromResponse(responseText: string): string {
  try {
    const parsed = JSON.parse(responseText);
    if (parsed && typeof parsed.text === 'string') {
      return parsed.text.trim();
    }
    return responseText.trim();
  } catch {
    return responseText.trim();
  }
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
        console.log(`⏱️ STT API responded in ${Date.now() - startTime}ms`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('STT API error:', response.status, errorText);
          throw new Error('Transcription failed');
        }

        const responseText = await response.text();
        console.log('📥 STT response:', responseText.slice(0, 100));

        const transcribedText = extractTextFromResponse(responseText);
        console.log('✅ Transcribed:', transcribedText || '(empty)');
        
        return transcribedText;
      } catch (err) {
        clearTimeout(timeoutId);
        if (err instanceof Error && err.name === 'AbortError') {
          console.error('⏱️ STT request timed out after 15s');
          throw new Error('Transcription timed out');
        }
        console.error('STT error:', err);
        throw err;
      }
    },
  });

  const startRecordingMobile = useCallback(async () => {
    console.log('🎤 Starting mobile recording...');

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
        bitRate: 128000,
      },
      ios: {
        extension: '.m4a',
        outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
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
    console.log('✅ Recording started');
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
      console.log('⚠️ No active recording');
      return null;
    }

    try {
      console.log('🛑 Stopping recording...');
      await recording.stopAndUnloadAsync();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      recordingRef.current = null;

      if (!uri) {
        console.error('❌ No recording URI');
        return null;
      }

      console.log('📼 Recording saved:', uri);

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
      console.error('❌ Error stopping recording:', err);
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
    if (!isRecording) {
      console.log('⚠️ Not recording');
      return null;
    }

    console.log('🛑 Stopping recording...');
    isStoppingRef.current = true;
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
        console.error('Error stopping speech recognition:', e);
      }
      recognitionRef.current = null;
    }

    try {
      const currentTranscript = transcriptRef.current.trim() || liveTranscript.trim();

      if (Platform.OS === 'web' && currentTranscript) {
        console.log('✨ Using live transcript:', currentTranscript.slice(0, 50));
        setLiveTranscript('');
        transcriptRef.current = '';
        setConfidence(0);
        return currentTranscript;
      }

      setIsFetchingFinal(true);

      const formData = Platform.OS === 'web' 
        ? await stopRecordingWeb() 
        : await stopRecordingMobile();

      if (!formData) {
        console.log('⚠️ No audio data, using live transcript');
        const result = currentTranscript || null;
        setLiveTranscript('');
        transcriptRef.current = '';
        setConfidence(0);
        setIsFetchingFinal(false);
        return result;
      }

      const transcribedText = await transcribeAudio(formData);

      const finalText = currentTranscript 
        ? `${currentTranscript} ${transcribedText}`.trim() 
        : transcribedText.trim();

      setLiveTranscript('');
      transcriptRef.current = '';
      setConfidence(0);
      setIsFetchingFinal(false);

      if (!finalText) {
        console.log('⚠️ Empty transcription result');
        return null;
      }

      console.log('✅ Final text:', finalText.slice(0, 50));
      return finalText;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to transcribe';
      setError(message);
      console.error('❌ Stop recording error:', err);

      const fallback = transcriptRef.current.trim() || liveTranscript.trim() || null;
      setLiveTranscript('');
      transcriptRef.current = '';
      setIsFetchingFinal(false);
      return fallback;
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
