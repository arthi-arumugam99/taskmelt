import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, Square, Zap } from 'lucide-react-native';
import { useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import Colors from '@/constants/colors';
import { useDumps } from '@/contexts/DumpContext';
import { useRevenueCat } from '@/contexts/RevenueCatContext';
import { useRouter } from 'expo-router';
import { DumpSession, Category } from '@/types/dump';

import { useVoiceRecording } from '@/hooks/useVoiceRecording';

const PLACEHOLDERS = [
  "What's on your mind?",
  "Type everything swirling in your head...",
  "Dump your thoughts here...",
  "What's keeping you up at night?",
  "Get it all out...",
];

const resultSchema = z.object({
  categories: z.array(
    z.object({
      name: z.string().describe('Category name like Work, Personal, Health, etc'),
      emoji: z.string().describe('Single relevant emoji'),
      color: z.string().describe('Hex color code'),
      priority: z.enum(['high', 'medium', 'low']).optional(),
      items: z.array(
        z.object({
          task: z.string().describe('Clear, actionable task description'),
          priority: z.enum(['high', 'medium', 'low']),
          duration: z.string().optional().describe('Estimated time like 15min, 1h, 2h'),
          scheduledTime: z.string().optional().describe('Suggested time in HH:MM format'),
          energyLevel: z.enum(['high', 'medium', 'low']).optional(),
          context: z.enum(['home', 'work', 'errands', 'computer', 'phone', 'anywhere']).optional(),
          subtasks: z.array(
            z.object({
              task: z.string(),
              duration: z.string().optional(),
            })
          ).optional().describe('Break down complex tasks into 2-4 subtasks'),
        })
      ),
    })
  ).min(1).max(5).describe('2-5 well-organized categories'),
  summary: z.string().describe('Brief summary of what the user wants to accomplish'),
  reflectionInsight: z.string().optional().describe('Optional insight about patterns or suggestions'),
});

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export default function DumpScreen() {
  const [inputText, setInputText] = useState('');
  const [currentSession] = useState<DumpSession | null>(null);
  const [placeholder] = useState(() => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]);

  const buttonScale = useRef(new Animated.Value(1)).current;
  const micPulse = useRef(new Animated.Value(1)).current;
  const { addDump, canCreateDump, remainingFreeDumps } = useDumps();
  const { isProUser } = useRevenueCat();
  const router = useRouter();
  const { isRecording, isProcessing, error: voiceError, startRecording, stopRecording } = useVoiceRecording();

  useEffect(() => {
    if (isRecording) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(micPulse, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(micPulse, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    } else {
      micPulse.setValue(1);
    }
  }, [isRecording, micPulse]);

  const { mutate: organizeMutate, isPending, isError, error: mutationError, reset } = useMutation({
    mutationFn: async (text: string) => {
      console.log('=== Starting organization ===');
      console.log('Text length:', text.length, 'characters');
      console.log('Platform:', Platform.OS);
      console.log('Toolkit URL:', process.env.EXPO_PUBLIC_TOOLKIT_URL);
      
      if (!text.trim()) {
        throw new Error('Please enter some text to organize.');
      }
      
      let lastError: Error | null = null;
      const maxRetries = 2;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Attempt ${attempt}/${maxRetries}...`);
          
          const truncatedText = text.length > 1200 ? text.substring(0, 1200) : text;
          
          const currentTime = new Date();
          const currentHour = currentTime.getHours();
          const timeOfDay = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening';
          
          const rawResult = await Promise.race([
            generateObject({
              messages: [
                {
                  role: 'user',
                  content: `You are a world-class productivity AI that transforms chaotic thoughts into organized, actionable tasks.

Current context:
- Time: ${timeOfDay} (${currentHour}:${currentTime.getMinutes().toString().padStart(2, '0')})
- Day: ${currentTime.toLocaleDateString('en-US', { weekday: 'long' })}

User's brain dump:
"""${truncatedText}"""

Your task:
1. Extract ALL actionable tasks (don't miss anything)
2. Organize into 2-5 logical categories (Work, Personal, Health, Learning, etc.)
3. Assign smart priorities:
   - HIGH: urgent, time-sensitive, or high-impact
   - MEDIUM: important but not urgent
   - LOW: nice-to-have or routine

4. Estimate realistic durations (15min, 30min, 1h, 2h, etc.)

5. Suggest optimal times based on:
   - Task type (deep work → morning, calls → afternoon, errands → midday)
   - Energy needed (creative work → high energy times)
   - Current time of day

6. Assign energy levels:
   - HIGH: requires focus, creativity, or physical energy
   - MEDIUM: moderate effort
   - LOW: routine, administrative, or low-stakes

7. Set context (where/how to do it):
   - work: office/work environment
   - home: at home
   - errands: out and about
   - computer: needs computer
   - phone: can do on phone
   - anywhere: flexible

8. Break complex tasks into 2-4 subtasks when helpful

9. Choose appropriate emojis and colors:
   - Work: 💼 #4F46E5
   - Personal: 🏠 #10B981
   - Health: 💪 #EF4444
   - Learning: 📚 #F59E0B
   - Creative: 🎨 #8B5CF6
   - Finance: 💰 #059669
   - Social: 👥 #EC4899
   - Errands: 🛒 #F97316

10. Write a brief summary and insight about what patterns you see

Be smart, thoughtful, and help the user succeed!`,
                },
              ],
              schema: resultSchema,
            }),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Request timeout - AI is taking too long')), 90000)
            )
          ]);
          
          console.log('✓ AI Response received');
          console.log('Raw result:', JSON.stringify(rawResult, null, 2).substring(0, 500));
          console.log('Categories count:', rawResult?.categories?.length ?? 0);
          
          if (!rawResult || typeof rawResult !== 'object') {
            console.error('Invalid response type:', typeof rawResult);
            throw new Error('AI returned invalid response. Please try again.');
          }
          
          if (!rawResult.categories || !Array.isArray(rawResult.categories)) {
            console.error('Missing or invalid categories:', rawResult.categories);
            throw new Error('AI did not return organized tasks. Please try again with more details.');
          }
          
          if (rawResult.categories.length === 0) {
            console.error('Empty categories array');
            throw new Error('No tasks could be extracted. Please provide more specific details about what you need to do.');
          }
          
          // Validate that categories have items
          const hasItems = rawResult.categories.some((cat: any) => cat.items && cat.items.length > 0);
          if (!hasItems) {
            console.error('No items in any category');
            throw new Error('No actionable tasks found. Try describing your tasks more clearly.');
          }
          
          const validPriorities = ['high', 'medium', 'low'];
          const sanitizePriority = (p: string | undefined): 'high' | 'medium' | 'low' => {
            if (p && validPriorities.includes(p.toLowerCase())) {
              return p.toLowerCase() as 'high' | 'medium' | 'low';
            }
            return 'medium';
          };
          
          const result = {
            ...rawResult,
            categories: rawResult.categories.slice(0, 5).map((cat: any) => ({
              ...cat,
              priority: cat.priority || 'medium',
              items: cat.items.map((item: any) => ({
                ...item,
                priority: sanitizePriority(item.priority),
                original: item.task,
                timeEstimate: item.duration,
                duration: item.duration,
                scheduledTime: item.scheduledTime,
                energyLevel: item.energyLevel || 'medium',
                context: item.context || 'anywhere',
                isReflection: false,
                closesLoop: false,
                subtasks: item.subtasks?.map((sub: any) => ({
                  task: sub.task,
                  duration: sub.duration,
                  completed: false,
                  isReflection: false,
                })) || [],
              })),
            })),
            reflectionInsight: rawResult.reflectionInsight,
          };
          
          return result;
        } catch (error) {
          console.error(`Attempt ${attempt} failed:`, error);
          lastError = error as Error;
          
          if (attempt < maxRetries) {
            console.log(`Retrying in 1000ms...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      console.error('All retry attempts failed');
      console.error('Last error:', lastError);
      const errorMessage = lastError?.message || 'Unknown error';
      
      if (errorMessage.includes('Network request failed') || errorMessage.includes('fetch')) {
        throw new Error('Unable to connect to AI service. Please check your internet connection and try again.');
      } else if (errorMessage.includes('timeout')) {
        throw new Error('AI is taking too long. Try a shorter brain dump or try again later.');
      } else if (errorMessage.includes('parse') || errorMessage.includes('JSON')) {
        throw new Error('AI response was corrupted. Please try again.');
      } else {
        throw new Error(`Failed to organize: ${errorMessage}`);
      }
    },
    onSuccess: (data) => {
      console.log('=== Organization successful ===');
      console.log('Categories:', data.categories?.length);
      console.log('Total items:', data.categories?.reduce((acc: number, cat: any) => acc + (cat.items?.length || 0), 0));
      console.log('Summary:', data.summary);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const now = new Date();
      const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const categories: Category[] = data.categories.map((cat: any) => ({
        ...cat,
        priority: cat.priority || 'medium',
        items: cat.items.map((item: any) => {
          let scheduledDate = todayDate.toISOString();
          
          if (item.scheduledTime) {
            try {
              const [hours, minutes] = item.scheduledTime.split(':').map(Number);
              if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
                console.warn('Invalid time format:', item.scheduledTime);
              } else {
                const taskDateTime = new Date(todayDate);
                taskDateTime.setHours(hours, minutes, 0, 0);
                
                if (isNaN(taskDateTime.getTime())) {
                  console.warn('Invalid date created for task:', item.task);
                } else {
                  scheduledDate = taskDateTime.toISOString();
                }
              }
            } catch (err) {
              console.error('Error parsing scheduled time:', err);
            }
          }
          
          return {
            ...item,
            id: generateId(),
            completed: false,
            priority: item.priority || 'medium',
            scheduledDate,
            scheduledTime: item.scheduledTime,
            energyLevel: item.energyLevel || 'medium',
            context: item.context || 'anywhere',
            subtasks: item.subtasks?.map((subtask: any) => ({
              ...subtask,
              id: generateId(),
              completed: false,
              priority: item.priority || 'medium',
              isReflection: false,
            })) || [],
            isExpanded: false,
            isReflection: item.isReflection || false,
          };
        }),
      }));

      const session: DumpSession = {
        id: generateId(),
        rawText: inputText,
        categories,
        createdAt: new Date().toISOString(),
        summary: data.summary,
        reflectionInsight: data.reflectionInsight,
      };

      console.log('=== Saving session ===');
      console.log('Session ID:', session.id);
      console.log('Categories in session:', session.categories.length);
      console.log('Tasks in session:', session.categories.reduce((acc, cat) => acc + cat.items.length, 0));
      
      addDump(session);
      setInputText('');
      
      // Navigate to tasks page with animation
      console.log('Navigating to tasks page...');
      router.push({
        pathname: '/(tabs)/tasks' as any,
        params: { animated: 'true', date: new Date().toISOString().split('T')[0] }
      });
    },
    onError: (error) => {
      console.error('=== Organization FAILED ===');
      console.error('Error type:', error?.constructor?.name);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const handleOrganize = useCallback(() => {
    if (!inputText.trim() || isPending) return;

    if (!canCreateDump(isProUser)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.push('/paywall' as any);
      return;
    }

    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    organizeMutate(inputText);
  }, [inputText, isPending, organizeMutate, buttonScale, canCreateDump, isProUser, router]);



  const handleVoicePress = useCallback(async () => {
    try {
      if (isRecording) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        console.log('🛑 Stopping recording...');
        
        const finalTranscript = await stopRecording();
        
        if (finalTranscript && finalTranscript.trim()) {
          console.log('✅ Got transcript:', finalTranscript.substring(0, 100));
          setInputText(finalTranscript.trim());
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          console.log('❌ No transcript');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        console.log('🎤 Starting recording...');
        await startRecording();
      }
    } catch (err) {
      console.error('Voice press error:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [isRecording, startRecording, stopRecording]);



  useEffect(() => {
    if (voiceError) {
      console.error('Voice recording error:', voiceError);
    }
  }, [voiceError]);

  const buttonDisabled = !inputText.trim() || isPending;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!currentSession ? (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>task<Text style={styles.titleItalic}>melt</Text></Text>
                <Text style={styles.subtitle}>Chaos in. Clarity out.</Text>
                {!isProUser && remainingFreeDumps > 0 && (
                  <View style={styles.freeLimitBadge}>
                    <Text style={styles.freeLimitText}>
                      {remainingFreeDumps} free {remainingFreeDumps === 1 ? 'dump' : 'dumps'} remaining
                    </Text>
                  </View>
                )}
                {!isProUser && remainingFreeDumps === 0 && (
                  <TouchableOpacity 
                    style={styles.upgradeBadge}
                    onPress={() => router.push('/paywall' as any)}
                  >
                    <Text style={styles.upgradeBadgeText}>Upgrade to Pro for unlimited dumps</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder={placeholder}
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    textAlignVertical="top"
                    autoFocus={false}
                    maxLength={5000}
                    editable={!isRecording && !isProcessing}
                  />
                  {inputText.length > 0 && (
                    <View style={styles.characterCountContainer}>
                      <Text style={styles.characterCount}>
                        {inputText.length} / 5000
                      </Text>
                    </View>
                  )}
                </View>
                
                {isRecording && (
                  <View style={styles.recordingIndicatorSimple}>
                    <View style={styles.recordingDot} />
                    <Text style={styles.recordingTextSimple}>
                      Recording... Speak now
                    </Text>
                  </View>
                )}
                
                {isProcessing && (
                  <View style={styles.recordingIndicatorSimple}>
                    <ActivityIndicator size="small" color={Colors.accent1} />
                    <Text style={styles.recordingTextSimple}>Transcribing audio...</Text>
                  </View>
                )}
              </View>

              <View style={styles.buttonRow}>
                <Animated.View style={{ transform: [{ scale: micPulse }] }}>
                  <TouchableOpacity
                    style={[
                      styles.voiceButtonSmall,
                      isRecording && styles.voiceButtonRecording,
                      isProcessing && styles.voiceButtonDisabled,
                    ]}
                    onPress={handleVoicePress}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="small" color={Colors.background} />
                    ) : isRecording ? (
                      <Square size={22} color={Colors.background} fill={Colors.background} />
                    ) : (
                      <Mic size={22} color={Colors.background} />
                    )}
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View style={[styles.organizeButtonWrapper, { transform: [{ scale: buttonScale }] }]}>
                  <TouchableOpacity
                    style={[styles.organizeButton, buttonDisabled && styles.organizeButtonDisabled]}
                    onPress={handleOrganize}
                    disabled={buttonDisabled}
                    activeOpacity={0.8}
                  >
                    {isPending ? (
                      <>
                        <ActivityIndicator size="small" color={Colors.background} style={styles.buttonLoader} />
                        <Text style={styles.organizeButtonText}>Melting chaos...</Text>
                      </>
                    ) : (
                      <>
                        <Zap size={20} color={Colors.background} style={{ marginRight: 8 }} />
                        <Text style={styles.organizeButtonText}>Melt My Chaos</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              </View>

              {isError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>
                    {mutationError instanceof Error && mutationError.message ? 
                      mutationError.message : 
                      'Oops! Something went wrong. Please try again.'}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => {
                      reset();
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={styles.retryButton}
                  >
                    <Text style={styles.retryButtonText}>Dismiss</Text>
                  </TouchableOpacity>
                </View>
              )}

              {voiceError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>
                    {voiceError}
                  </Text>
                </View>
              )}
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '900' as const,
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -1,
  },
  titleItalic: {
    fontStyle: 'italic' as const,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  freeLimitBadge: {
    marginTop: 12,
    backgroundColor: Colors.accent5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.border,
  },
  freeLimitText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  upgradeBadge: {
    marginTop: 12,
    backgroundColor: Colors.accent1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.border,
  },
  upgradeBadgeText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '700' as const,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    overflow: 'hidden',
  },
  input: {
    padding: 20,
    paddingBottom: 60,
    fontSize: 16,
    color: Colors.text,
    minHeight: 200,
    maxHeight: 400,
    lineHeight: 24,
  },
  characterCountContainer: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  characterCount: {
    fontSize: 12,
    color: Colors.textMuted,
    backgroundColor: Colors.card,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  voiceButtonSmall: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent3Dark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  voiceButtonRecording: {
    backgroundColor: Colors.error,
  },
  voiceButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.background,
  },
  voiceButtonDisabled: {
    opacity: 0.6,
  },
  recordingIndicatorSimple: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FCA5A5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  recordingTextSimple: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#EF4444',
  },
  organizeButtonWrapper: {
    flex: 1,
  },
  organizeButton: {
    backgroundColor: Colors.accent1Dark,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 3,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  organizeButtonDisabled: {
    opacity: 0.5,
  },
  organizeButtonText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800' as const,
  },
  buttonLoader: {
    marginRight: 8,
  },
  errorContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  resultsHeaderLeft: {
    flex: 1,
  },
  resultsHeaderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  resultsSummary: {
    fontSize: 15,
    color: Colors.textMuted,
    fontStyle: 'italic' as const,
    paddingRight: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 3,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  progressCard: {
    backgroundColor: Colors.accent2,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: Colors.border,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  progressStats: {
    gap: 4,
  },
  progressPercentage: {
    fontSize: 32,
    fontWeight: '900' as const,
    color: Colors.text,
  },
  progressLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: Colors.card,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: Colors.border,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.accent2Dark,
    borderRadius: 4,
  },
  newDumpButton: {
    marginTop: 24,
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  newDumpButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '800' as const,
  },
  recordingIndicator: {
    marginTop: 16,
    padding: 18,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FCA5A5',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  recordingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    marginRight: 10,
  },
  recordingText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#EF4444',
    flex: 1,
    letterSpacing: 0.3,
  },
  recordingDuration: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#DC2626',
    fontVariant: ['tabular-nums'] as const,
  },
  transcriptContainer: {
    gap: 8,
  },
  transcriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  transcriptLabel: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  transcriptText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
    fontWeight: '500' as const,
  },
  transcriptHint: {
    fontSize: 11,
    color: '#DC2626',
    fontStyle: 'italic' as const,
    opacity: 0.8,
  },
  listeningContainer: {
    gap: 12,
    alignItems: 'center',
  },
  listeningText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500' as const,
    textAlign: 'center',
  },
  transcriptPreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    width: '100%',
  },
  transcriptPreviewText: {
    fontSize: 13,
    color: '#1F2937',
    lineHeight: 18,
  },

  waveBars: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    height: 30,
  },
  waveBar: {
    width: 3,
    backgroundColor: '#FCA5A5',
    borderRadius: 2,
  },
  quickWinsCard: {
    backgroundColor: Colors.accent5,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  quickWinsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickWinsIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickWinsHeaderText: {
    flex: 1,
  },
  quickWinsTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  quickWinsSubtitle: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },
  quickWinsBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  quickWinsBadgeText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  quickWinsList: {
    gap: 8,
    marginTop: 12,
  },
  quickWinItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
  },
  quickWinItemCompleted: {
    opacity: 0.6,
  },
  quickWinCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickWinText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  quickWinTextCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  quickWinTime: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '600' as const,
  },
  quickWinsMoreButton: {
    marginTop: 4,
    paddingVertical: 8,
  },
  quickWinsMore: {
    fontSize: 12,
    color: '#B45309',
    textAlign: 'center',
    fontStyle: 'italic' as const,
  },
  whyThisButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  whyThisButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  whyThisContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  whyThisText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    fontStyle: 'italic' as const,
  },
  startHereCard: {
    backgroundColor: Colors.accent1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  startHereHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  startHereLabelText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  startHereTask: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
  },
  startHereCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startHereContent: {
    flex: 1,
  },
  startHereTaskText: {
    fontSize: 15,
    color: Colors.text,
    marginBottom: 4,
  },
  startHereTime: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  startHereHint: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic' as const,
  },
  scrollToCheckText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  quickWinsSuggestion: {
    fontSize: 11,
    color: '#B45309',
    fontStyle: 'italic' as const,
    marginBottom: 8,
    textAlign: 'center',
  },
  quickWinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  insightCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  insightText: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.text,
    fontStyle: 'italic' as const,
    fontWeight: '500' as const,
  },
  loopCloserCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#86EFAC',
  },
  loopCloserHeader: {
    marginBottom: 12,
  },
  loopCloserLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#15803D',
    marginBottom: 2,
  },
  loopCloserSubtitle: {
    fontSize: 12,
    color: '#22C55E',
    fontStyle: 'italic' as const,
  },
  loopCloserTask: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
  },
  loopCloserEmoji: {
    fontSize: 20,
  },
  loopCloserContent: {
    flex: 1,
  },
  loopCloserTaskText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  loopCloserTime: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  loopCloserHint: {
    fontSize: 11,
    color: '#15803D',
    fontStyle: 'italic' as const,
  },
  loopCloserCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loopCloserTaskTextCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  momentumCard: {
    backgroundColor: Colors.accent3,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  momentumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  momentumEmoji: {
    fontSize: 24,
  },
  momentumHeaderText: {
    flex: 1,
  },
  momentumTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  momentumSubtitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  momentumTask: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
  },
  momentumCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginTop: 2,
  },
  momentumContent: {
    flex: 1,
  },
  momentumTaskText: {
    fontSize: 15,
    color: Colors.text,
    marginBottom: 2,
  },
  momentumTime: {
    fontSize: 13,
    color: '#EA580C',
    fontWeight: '500' as const,
  },
  momentumHint: {
    fontSize: 12,
    color: '#C2410C',
    fontStyle: 'italic' as const,
    marginTop: 8,
    textAlign: 'center',
  },
});
