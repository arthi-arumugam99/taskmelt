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
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RotateCcw, Mic, Square, Share2, TrendingUp, Zap } from 'lucide-react-native';
import { useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import Colors from '@/constants/colors';
import { useDumps } from '@/contexts/DumpContext';
import { useRevenueCat } from '@/contexts/RevenueCatContext';
import { useRouter } from 'expo-router';
import { DumpSession, Category } from '@/types/dump';
import OrganizedResults from '@/components/OrganizedResults';
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
      name: z.string(),
      emoji: z.string(),
      color: z.string(),
      items: z.array(
        z.object({
          task: z.string(),
          original: z.string().optional(),
          timeEstimate: z.string().optional(),
          subtasks: z.array(
            z.object({
              task: z.string(),
              timeEstimate: z.string().optional(),
            })
          ).optional(),
          hasSubtaskSuggestion: z.boolean().optional(),
          isReflection: z.boolean().optional(),
          closesLoop: z.boolean().optional(),
        })
      ),
      priority: z.enum(['high', 'medium', 'low']).optional(),
    })
  ),
  summary: z.string(),
  reflectionInsight: z.string().optional(),
});

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export default function DumpScreen() {
  const [inputText, setInputText] = useState('');
  const [currentSession, setCurrentSession] = useState<DumpSession | null>(null);
  const [placeholder] = useState(() => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]);

  const buttonScale = useRef(new Animated.Value(1)).current;
  const micPulse = useRef(new Animated.Value(1)).current;
  const { dumps, addDump, toggleTask, deleteTask, canCreateDump, remainingFreeDumps } = useDumps();
  const { isProUser } = useRevenueCat();
  const router = useRouter();
  const { isRecording, isTranscribing, error: voiceError, liveTranscript, recordingDuration, confidence, startRecording, stopRecording } = useVoiceRecording();

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
      console.log('Organizing text:', text.substring(0, 100) + '...');
      console.log('Toolkit URL:', process.env.EXPO_PUBLIC_TOOLKIT_URL);
      console.log('Platform:', Platform.OS);
      
      if (!process.env.EXPO_PUBLIC_TOOLKIT_URL) {
        throw new Error('AI service not configured. Please restart the app.');
      }
      
      const maxRetries = 2;
      let lastError: Error | null = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Attempt ${attempt}/${maxRetries} - Calling generateObject...`);
          console.log('Input length:', text.length, 'characters');
          
          const result = await Promise.race([
            generateObject({
        messages: [
          {
            role: 'user',
            content: `Organize this brain dump into actionable tasks with categories.

Rules:
- Create 2-4 categories based on context
- Extract EVERY task mentioned, including those with specific times (e.g., "meeting at 9:30", "call at 2pm")
- Preserve time references in the task (e.g., "Complete meeting at 9:30" should stay as "Complete meeting at 9:30")
- Rewrite as clear actions while keeping original time/date info
- Add time estimates for completion duration
- For complex tasks, add 2-3 subtasks (mark hasSubtaskSuggestion: true)
- Mark reflections/notes with isReflection: true
- Prioritize: high (urgent/time-sensitive), medium (regular), low (nice-to-have)
- Do NOT skip any items - capture everything mentioned

Input:
${text}`,
          },
        ],
        schema: resultSchema,
            }),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Request timeout after 120 seconds')), 120000)
            )
          ]);
          
          console.log('AI Response received successfully');
          console.log('Categories count:', result.categories?.length ?? 0);
          return result;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          console.error(`Attempt ${attempt} failed:`, lastError.message);
          
          if (attempt === maxRetries) {
            console.error('All retry attempts failed');
            console.error('Error type:', typeof err);
            console.error('Error constructor:', err?.constructor?.name);
            if (err instanceof Error) {
              console.error('Error name:', err.name);
              console.error('Error stack:', err.stack);
            }
            break;
          }
          
          console.log(`Waiting ${2 * attempt} seconds before retry...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
      }
      
      if (lastError) {
        if (lastError.message.includes('timeout')) {
          throw new Error('The AI is taking longer than usual. Please try again or consider shortening your brain dump.');
        } else if (lastError.message.includes('Network request failed')) {
          throw new Error('Connection issue. Please check your internet and try again.');
        } else if (lastError.message.includes('fetch')) {
          throw new Error('Network error. Please check your connection and try again.');
        } else {
          throw new Error('Unable to process your brain dump. Please try again.');
        }
      }
      
      throw new Error('Processing failed. Please try again.');
    },
    onSuccess: (data) => {
      console.log('Organization successful:', data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const categories: Category[] = data.categories.map(cat => ({
        ...cat,
        priority: cat.priority || 'medium',
        items: cat.items.map(item => ({
          ...item,
          id: generateId(),
          completed: false,
          subtasks: item.subtasks?.map(subtask => ({
            ...subtask,
            id: generateId(),
            completed: false,
          })),
          isExpanded: false,
          isReflection: item.isReflection || false,
        })),
      }));

      const session: DumpSession = {
        id: generateId(),
        rawText: inputText,
        categories,
        createdAt: new Date().toISOString(),
        summary: data.summary,
        reflectionInsight: data.reflectionInsight,
      };

      setCurrentSession(session);
      addDump(session);
    },
    onError: (error) => {
      console.error('Organization failed:', error);
      console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const handleOrganize = useCallback(() => {
    if (!inputText.trim() || isPending) return;

    if (!canCreateDump(isProUser)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.push('/paywall');
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

  const handleReset = useCallback(() => {
    setInputText('');
    setCurrentSession(null);
    reset();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [reset]);

  const handleToggleTask = useCallback((taskId: string) => {
    if (!currentSession) return;

    let isCompleting = false;
    
    for (const category of currentSession.categories) {
      const taskIndex = category.items.findIndex(item => item.id === taskId);
      if (taskIndex !== -1) {
        isCompleting = !category.items[taskIndex].completed;
        break;
      }
      
      for (const item of category.items) {
        if (item.subtasks) {
          const subtaskIndex = item.subtasks.findIndex(st => st.id === taskId);
          if (subtaskIndex !== -1) {
            isCompleting = !item.subtasks[subtaskIndex].completed;
            break;
          }
        }
      }
    }
    
    Haptics.impactAsync(
      isCompleting
        ? Haptics.ImpactFeedbackStyle.Medium 
        : Haptics.ImpactFeedbackStyle.Light
    );
    
    toggleTask(currentSession.id, taskId);
  }, [currentSession, toggleTask]);

  const handleToggleExpanded = useCallback((taskId: string) => {
    if (!currentSession) return;

    const updatedSession = { ...currentSession };
    
    for (const category of updatedSession.categories) {
      const taskIndex = category.items.findIndex(item => item.id === taskId);
      if (taskIndex !== -1) {
        category.items[taskIndex].isExpanded = !category.items[taskIndex].isExpanded;
        setCurrentSession(updatedSession);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return;
      }
    }
  }, [currentSession]);

  const handleVoicePress = useCallback(async () => {
    if (isRecording) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const transcription = await stopRecording();
      if (transcription && transcription.trim()) {
        setInputText(prev => prev ? `${prev}\n${transcription}` : transcription);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const handleShareResults = useCallback(async () => {
    if (!currentSession) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    let shareText = `📋 TaskMelt Brain Dump\n\n`;
    
    currentSession.categories.forEach((cat) => {
      if (cat.items.length > 0) {
        shareText += `\n${cat.emoji} ${cat.name}:\n`;
        cat.items.forEach((item) => {
          const status = item.completed ? '✅' : '⬜';
          shareText += `${status} ${item.task}`;
          if (item.timeEstimate) shareText += ` (${item.timeEstimate})`;
          shareText += '\n';
        });
      }
    });
    
    try {
      await Share.share({ message: shareText });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  }, [currentSession]);

  const { totalTasks, completedTasks } = React.useMemo(() => {
    if (!currentSession) return { totalTasks: 0, completedTasks: 0 };
    
    const actualDump = dumps.find((d: DumpSession) => d.id === currentSession.id);
    const dumpToUse = actualDump || currentSession;
    
    let total = 0;
    let completed = 0;
    
    for (const cat of dumpToUse.categories) {
      for (const item of cat.items) {
        if (item.isReflection) continue;
        
        if (item.subtasks && item.subtasks.length > 0) {
          total += item.subtasks.length;
          completed += item.subtasks.filter((st) => st.completed).length;
        } else {
          total += 1;
          if (item.completed) completed += 1;
        }
      }
    }
    
    return { totalTasks: total, completedTasks: completed };
  }, [currentSession, dumps]);
  
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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
                <Text style={styles.title}>taskmelt</Text>
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
                    onPress={() => router.push('/paywall')}
                  >
                    <Text style={styles.upgradeBadgeText}>Upgrade to Pro for unlimited dumps</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.inputContainer}>
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
                />
                {inputText.length > 0 && (
                  <Text style={styles.characterCount}>
                    {inputText.length} / 5000
                  </Text>
                )}
              </View>

              <View style={styles.buttonContainer}>
                <Animated.View style={{ transform: [{ scale: micPulse }] }}>
                  <TouchableOpacity
                    style={[
                      styles.voiceButton,
                      isRecording && styles.voiceButtonActive,
                      isTranscribing && styles.voiceButtonDisabled,
                    ]}
                    onPress={handleVoicePress}
                    disabled={isTranscribing}
                  >
                    {isTranscribing ? (
                      <ActivityIndicator size="small" color={Colors.background} />
                    ) : isRecording ? (
                      <Square size={24} color={Colors.background} fill={Colors.background} />
                    ) : (
                      <Mic size={24} color={Colors.background} />
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

              {isRecording && (
                <View style={styles.recordingIndicator}>
                  <View style={styles.recordingHeader}>
                    <View style={styles.recordingDot} />
                    <Text style={styles.recordingText}>Listening</Text>
                    <Text style={styles.recordingDuration}>
                      {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                    </Text>
                  </View>
                  {liveTranscript ? (
                    <View style={styles.transcriptContainer}>
                      <View style={styles.transcriptHeader}>
                        <Text style={styles.transcriptLabel}>Live:</Text>
                        {confidence > 0 && (
                          <View style={styles.confidenceBadge}>
                            <View style={[styles.confidenceDot, { opacity: confidence }]} />
                          </View>
                        )}
                      </View>
                      <Text style={styles.transcriptText}>{liveTranscript}</Text>
                      <Text style={styles.transcriptHint}>Tap stop when done speaking</Text>
                    </View>
                  ) : (
                    <View style={styles.listeningContainer}>
                      <Text style={styles.listeningText}>Start speaking...</Text>
                      <View style={styles.waveBars}>
                        <Animated.View style={[styles.waveBar, { height: 12 }]} />
                        <Animated.View style={[styles.waveBar, { height: 20 }]} />
                        <Animated.View style={[styles.waveBar, { height: 16 }]} />
                        <Animated.View style={[styles.waveBar, { height: 24 }]} />
                        <Animated.View style={[styles.waveBar, { height: 14 }]} />
                      </View>
                    </View>
                  )}
                </View>
              )}
            </>
          ) : (
            <>
              <View style={styles.resultsHeader}>
                <View style={styles.resultsHeaderLeft}>
                  <Text style={styles.resultsTitle}>Your Clarity</Text>
                  {currentSession.summary && (
                    <Text style={styles.resultsSummary}>{currentSession.summary}</Text>
                  )}
                </View>
                <View style={styles.resultsHeaderActions}>
                  <TouchableOpacity onPress={handleShareResults} style={styles.iconButton}>
                    <Share2 size={20} color={Colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleReset} style={styles.iconButton}>
                    <RotateCcw size={20} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              {totalTasks > 0 && (
                <View style={styles.progressCard}>
                  <View style={styles.progressHeader}>
                    <TrendingUp size={18} color={Colors.primary} />
                    <Text style={styles.progressTitle}>Progress</Text>
                  </View>
                  <View style={styles.progressStats}>
                    <Text style={styles.progressPercentage}>
                      {completedTasks === totalTasks ? '🎉 100%' : `${completionRate}%`}
                    </Text>
                    <Text style={styles.progressLabel}>
                      {completedTasks} of {totalTasks} tasks completed
                    </Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <Animated.View style={[styles.progressBarFill, { width: `${completionRate}%` }]} />
                  </View>
                </View>
              )}





              {(() => {
                const actualDump = dumps.find((d: DumpSession) => d.id === currentSession.id);
                const dumpToUse = actualDump || currentSession;
                
                return (
                  <OrganizedResults
                    categories={dumpToUse.categories}
                    summary={dumpToUse.summary}
                    onToggleTask={handleToggleTask}
                    onToggleExpanded={handleToggleExpanded}
                    onDeleteTask={(taskId) => deleteTask(currentSession.id, taskId)}
                    highlightedTaskIds={[]}
                    hideHighlightedTasks={false}
                  />
                );
              })()}

              <TouchableOpacity
                style={styles.newDumpButton}
                onPress={handleReset}
              >
                <Text style={styles.newDumpButtonText}>Unload Your Thoughts</Text>
              </TouchableOpacity>
            </>
          )}
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
    textTransform: 'uppercase' as const,
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
    position: 'relative',
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    fontSize: 16,
    color: Colors.text,
    minHeight: 200,
    maxHeight: 400,
    borderWidth: 3,
    borderColor: Colors.border,
    lineHeight: 24,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  characterCount: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    fontSize: 12,
    color: Colors.textMuted,
    backgroundColor: Colors.card,
    paddingHorizontal: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  voiceButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent3Dark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  voiceButtonActive: {
    backgroundColor: Colors.error,
  },
  voiceButtonDisabled: {
    opacity: 0.6,
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
