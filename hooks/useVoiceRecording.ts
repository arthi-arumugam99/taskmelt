import { useState, useRef, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

const STT_API_URL = 'https://toolkit.rork.com/stt/transcribe/';

interface UseVoiceRecordingReturn {
  isRecording: boolean;
  isProcessing: boolean;
  liveTranscript: string;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
}

export function useVoiceRecording(): UseVoiceRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          console.log('🧹 Cleanup recognition');
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
        } catch {
          console.log('🧹 Cleanup old recording');
        }
        recordingRef.current = null;
      }

      console.log('📱 Requesting microphone permission...');
      const permission = await Audio.getPermissionsAsync();
      console.log('Current permission status:', permission.status);
      
      if (permission.status !== 'granted') {
        console.log('Requesting permission...');
        const { status } = await Audio.requestPermissionsAsync();
        console.log('Permission request result:', status);
        
        if (status !== 'granted') {
          throw new Error('Microphone permission is required to record audio. Please enable it in your device settings.');
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
    } catch (err) {
      console.error('❌ Recording start failed:', err);
      throw new Error('Failed to start recording');
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

      console.log('📤 Transcribing audio...');
      console.log('Audio URI:', uri);
      console.log('File type:', fileType);
      
      const response = await fetch(STT_API_URL, {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error('Transcription failed');
      }

      const responseText = await response.text();
      console.log('Raw API response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        throw new Error('Invalid response from transcription service');
      }
      
      console.log('Parsed data:', JSON.stringify(data));
      const text = (data.text || data.transcription || data.transcript || '').trim();
      console.log('Extracted text:', text);

      if (!text) {
        console.error('No text in response. Full data:', JSON.stringify(data));
        throw new Error('No speech detected. Please speak clearly and try again.');
      }

      console.log('✅ Transcribed:', text.substring(0, 50));
      return text;
    } catch (err) {
      console.error('❌ Transcription error:', err);
      throw err;
    }
  }, []);

  const startRecordingWeb = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Recording not supported');
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    streamRef.current = stream;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let finalText = '';
        let interimText = '';

        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript + ' ';
          } else {
            interimText += transcript;
          }
        }

        const combined = (finalText + interimText).trim();
        setLiveTranscript(combined);
      };

      recognition.onerror = (e: any) => {
        console.log('🎤 Recognition error:', e.error);
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
        console.log('✅ Live transcription started');
      } catch {
        console.log('⚠️ Speech recognition unavailable');
      }
    }
  }, []);

  const stopRecordingWeb = useCallback(async (): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        console.log('🛑 Stop recognition');
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    const transcript = liveTranscript.trim();
    
    recognitionRef.current = null;
    streamRef.current = null;

    if (!transcript) {
      throw new Error('No speech detected');
    }

    console.log('✅ Web transcript:', transcript.substring(0, 50));
    return transcript;
  }, [liveTranscript]);

  const startRecording = useCallback(async () => {
    setError(null);
    setLiveTranscript('');
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
      setLiveTranscript('');
      return transcript;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transcription failed';
      setError(message);
      setIsProcessing(false);
      setLiveTranscript('');
      return null;
    }
  }, [isRecording, stopRecordingWeb, stopRecordingMobile]);

  return {
    isRecording,
    isProcessing,
    liveTranscript,
    error,
    startRecording,
    stopRecording,
  };
}
