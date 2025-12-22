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
import { RotateCcw, Mic, Square, Share2, TrendingUp, Zap, Check } from 'lucide-react-native';
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
  const { dumps, addDump, toggleTask, canCreateDump, remainingFreeDumps } = useDumps();
  const { isProUser } = useRevenueCat();
  const router = useRouter();
  const { isRecording, isTranscribing, error: voiceError, liveTranscript, recordingDuration, startRecording, stopRecording } = useVoiceRecording();

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
      
      const maxRetries = 1;
      let lastError: Error | null = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Attempt ${attempt}/${maxRetries} - Calling generateObject...`);
          
          const result = await Promise.race([
            generateObject({
        messages: [
          {
            role: 'user',
            content: `Organize this brain dump into actionable tasks with categories.

Rules:
- Create 2-4 categories based on context
- Rewrite as clear actions
- Add time estimates
- For complex tasks, add 2-3 subtasks (mark hasSubtaskSuggestion: true)
- Mark reflections/notes with isReflection: true
- Prioritize: high (urgent), medium (regular), low (nice-to-have)

Input:
${text}`,
          },
        ],
        schema: resultSchema,
            }),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Request timeout after 60 seconds')), 60000)
            )
          ]);
          
          console.log('AI Response:', JSON.stringify(result, null, 2));
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
          
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
      
      if (lastError) {
        if (lastError.message.includes('timeout')) {
          throw new Error('The AI service is taking too long to respond. Please try with a shorter brain dump or try again later.');
        } else if (lastError.message.includes('Network request failed')) {
          throw new Error('Unable to reach the AI service. Please check your internet connection and try again.');
        } else {
          throw lastError;
        }
      }
      
      throw new Error('Organization failed after multiple attempts.');
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
      console.log('Stopping recording...');
      const transcription = await stopRecording();
      if (transcription) {
        console.log('Got transcription:', transcription);
        setInputText(prev => prev ? `${prev}\n${transcription}` : transcription);
      }
    } else {
      console.log('Starting recording...');
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

  const nextMomentumTask = React.useMemo(() => {
    if (!currentSession || completedTasks === 0 || completedTasks === totalTasks) return null;
    
    const actualDump = dumps.find((d: DumpSession) => d.id === currentSession.id);
    const dumpToUse = actualDump || currentSession;
    
    const incompleteTasks: { task: string; timeEstimate?: string; id: string; categoryColor: string; categoryName: string }[] = [];
    
    for (const cat of dumpToUse.categories) {
      for (const item of cat.items) {
        if (item.isReflection || item.completed) continue;
        
        if (item.subtasks && item.subtasks.length > 0) {
          for (const st of item.subtasks) {
            if (!st.completed) {
              incompleteTasks.push({ 
                task: st.task, 
                timeEstimate: st.timeEstimate, 
                id: st.id, 
                categoryColor: cat.color,
                categoryName: cat.name 
              });
            }
          }
        } else {
          incompleteTasks.push({ 
            task: item.task, 
            timeEstimate: item.timeEstimate, 
            id: item.id, 
            categoryColor: cat.color,
            categoryName: cat.name 
          });
        }
      }
    }
    
    incompleteTasks.sort((a, b) => {
      const aEst = a.timeEstimate?.match(/(\d+)/);
      const bEst = b.timeEstimate?.match(/(\d+)/);
      const aMin = aEst ? parseInt(aEst[1]) : 999;
      const bMin = bEst ? parseInt(bEst[1]) : 999;
      return aMin - bMin;
    });
    
    return incompleteTasks[0] || null;
  }, [currentSession, completedTasks, totalTasks, dumps]);

  const quickWins = React.useMemo(() => {
    if (!currentSession) return [];
    
    const actualDump = dumps.find((d: DumpSession) => d.id === currentSession.id);
    const dumpToUse = actualDump || currentSession;
    
    return dumpToUse.categories.flatMap((cat) => 
      cat.items
        .filter((item) => {
          const estimate = item.timeEstimate?.toLowerCase() || '';
          const match = estimate.match(/(\d+)\s*min/);
          if (!match) return false;
          const minutes = parseInt(match[1], 10);
          return minutes <= 5 && !item.completed && !item.isReflection;
        })
        .map((item) => ({ ...item, categoryColor: cat.color, categoryName: cat.name }))
    );
  }, [currentSession, dumps]);

  const firstTask = React.useMemo(() => {
    if (!currentSession) return undefined;
    
    const actualDump = dumps.find((d: DumpSession) => d.id === currentSession.id);
    const dumpToUse = actualDump || currentSession;
    
    return dumpToUse.categories
      .flatMap((cat) => cat.items
        .filter((item) => !item.completed && !item.isReflection)
        .map((item) => ({ ...item, categoryColor: cat.color, categoryName: cat.name }))
      )
      .sort((a, b) => {
        const aEst = a.timeEstimate?.match(/(\d+)/);
        const bEst = b.timeEstimate?.match(/(\d+)/);
        const aMin = aEst ? parseInt(aEst[1]) : 999;
        const bMin = bEst ? parseInt(bEst[1]) : 999;
        return aMin - bMin;
      })[0];
  }, [currentSession, dumps]);

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
                    <Text style={styles.recordingText}>Recording</Text>
                    <Text style={styles.recordingDuration}>
                      {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                    </Text>
                  </View>
                  {liveTranscript ? (
                    <View style={styles.transcriptContainer}>
                      <Text style={styles.transcriptLabel}>Live transcription:</Text>
                      <Text style={styles.transcriptText}>{liveTranscript}</Text>
                    </View>
                  ) : (
                    <Text style={styles.listeningText}>Listening...</Text>
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
                    <Text style={styles.progressTitle}>
                      {completedTasks === 0 ? 'Clarity Progress' : 'Execution Progress'}
                    </Text>
                  </View>
                  <View style={styles.progressStats}>
                    {completedTasks === 0 ? (
                      <>
                        <Text style={styles.progressPercentage}>✨</Text>
                        <Text style={styles.progressLabel}>
                          {totalTasks} {totalTasks === 1 ? 'task' : 'tasks'} organized • Start with one
                        </Text>
                      </>
                    ) : completedTasks === totalTasks ? (
                      <>
                        <Text style={styles.progressPercentage}>🎉 100%</Text>
                        <Text style={styles.progressLabel}>
                          All done! You turned chaos into clarity.
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.progressPercentage}>{completionRate}%</Text>
                        <Text style={styles.progressLabel}>
                          {completedTasks} done, {totalTasks - completedTasks} to go • You&rsquo;re making progress
                        </Text>
                      </>
                    )}
                  </View>
                  <View style={styles.progressBarContainer}>
                    <Animated.View style={[styles.progressBarFill, { width: `${completionRate}%` }]} />
                  </View>
                </View>
              )}



              {completedTasks === 0 && firstTask && (
                <View style={styles.startHereCard}>
                  <View style={styles.startHereHeader}>
                    <Text style={styles.startHereLabelText}>If you do nothing else</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleToggleTask(firstTask.id)}
                    style={styles.startHereTask}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.startHereCheckbox,
                        { borderColor: firstTask.categoryColor },
                        firstTask.completed && { backgroundColor: firstTask.categoryColor },
                      ]}
                    >
                      {firstTask.completed && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                    <View style={styles.startHereContent}>
                      <Text style={styles.startHereTaskText}>{firstTask.task}</Text>
                      {firstTask.timeEstimate && (
                        <Text style={styles.startHereTime}>{firstTask.timeEstimate}</Text>
                      )}
                      <Text style={styles.startHereHint}>Shortest task • Builds momentum</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {completedTasks > 0 && completedTasks < totalTasks && nextMomentumTask && (
                <View style={styles.momentumCard}>
                  <View style={styles.momentumHeader}>
                    <Text style={styles.momentumEmoji}>🔥</Text>
                    <View style={styles.momentumHeaderText}>
                      <Text style={styles.momentumTitle}>You&apos;re on a roll</Text>
                      <Text style={styles.momentumSubtitle}>Keep going?</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleToggleTask(nextMomentumTask.id)}
                    style={styles.momentumTask}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.momentumCheckbox,
                        { borderColor: nextMomentumTask.categoryColor },
                      ]}
                    />
                    <View style={styles.momentumContent}>
                      <Text style={styles.momentumTaskText}>{nextMomentumTask.task}</Text>
                      {nextMomentumTask.timeEstimate && (
                        <Text style={styles.momentumTime}>{nextMomentumTask.timeEstimate}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.momentumHint}>Just one more small win</Text>
                </View>
              )}

              {quickWins.length > 0 && (
                <View style={styles.quickWinsCard}>
                  <View style={styles.quickWinsHeader}>
                    <Zap size={16} color="#F59E0B" fill="#F59E0B" />
                    <Text style={styles.quickWinsTitle}>{quickWins.length} Quick Win{quickWins.length > 1 ? 's' : ''} (≤5 min)</Text>
                  </View>
                  <View style={styles.quickWinsList}>
                    {quickWins.map((task: any) => (
                      <TouchableOpacity
                        key={task.id}
                        onPress={() => handleToggleTask(task.id)}
                        style={[styles.quickWinItem, task.completed && styles.quickWinItemCompleted]}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.quickWinCheckbox,
                            { borderColor: task.categoryColor },
                            task.completed && { backgroundColor: task.categoryColor },
                          ]}
                        >
                          {task.completed && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                        </View>
                        <Text
                          style={[
                            styles.quickWinText,
                            task.completed && styles.quickWinTextCompleted,
                          ]}
                        >
                          {task.task}
                        </Text>
                        <Text style={styles.quickWinTime}>{task.timeEstimate}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}





              {(() => {
                const actualDump = dumps.find((d: DumpSession) => d.id === currentSession.id);
                const dumpToUse = actualDump || currentSession;
                
                return (
                  <>
                    <OrganizedResults
                      categories={dumpToUse.categories.filter((cat) => 
                        !cat.name.toLowerCase().includes('reflection') && 
                        !cat.name.toLowerCase().includes('notes')
                      )}
                      summary={dumpToUse.summary}
                      onToggleTask={handleToggleTask}
                      onToggleExpanded={handleToggleExpanded}
                      highlightedTaskIds={[...(firstTask ? [firstTask.id] : []), ...quickWins.map(qw => qw.id)]}
                      hideHighlightedTasks={true}
                    />

                    {(() => {
                      const notesCategory = dumpToUse.categories.find(cat => 
                        cat.name.toLowerCase().includes('reflection') || 
                        cat.name.toLowerCase().includes('notes')
                      );

                      return notesCategory ? (
                        <OrganizedResults
                          categories={[notesCategory]}
                          onToggleTask={handleToggleTask}
                          onToggleExpanded={handleToggleExpanded}
                          highlightedTaskIds={[]}
                          hideHighlightedTasks={false}
                        />
                      ) : null;
                    })()}
                  </>
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
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  freeLimitBadge: {
    marginTop: 12,
    backgroundColor: Colors.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  freeLimitText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  upgradeBadge: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  upgradeBadgeText: {
    fontSize: 13,
    color: Colors.background,
    fontWeight: '600' as const,
  },
  inputContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    color: Colors.text,
    minHeight: 200,
    maxHeight: 400,
    borderWidth: 1,
    borderColor: Colors.border,
    lineHeight: 24,
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
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  voiceButtonActive: {
    backgroundColor: '#EF4444',
  },
  voiceButtonDisabled: {
    opacity: 0.6,
  },
  organizeButtonWrapper: {
    flex: 1,
  },
  organizeButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  organizeButtonDisabled: {
    opacity: 0.5,
  },
  organizeButtonText: {
    color: Colors.background,
    fontSize: 18,
    fontWeight: '600' as const,
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
    borderRadius: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  progressStats: {
    gap: 4,
  },
  progressPercentage: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  progressLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  newDumpButton: {
    marginTop: 24,
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  newDumpButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  recordingIndicator: {
    marginTop: 16,
    padding: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  recordingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#EF4444',
    flex: 1,
  },
  recordingDuration: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  transcriptContainer: {
    marginTop: 8,
  },
  transcriptLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
    fontWeight: '500' as const,
  },
  transcriptText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  listeningText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontStyle: 'italic' as const,
  },
  quickWinsCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
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
    fontWeight: '600' as const,
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
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  startHereHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  startHereLabelText: {
    fontSize: 16,
    fontWeight: '600' as const,
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
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDBA74',
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
    fontWeight: '600' as const,
    color: '#C2410C',
  },
  momentumSubtitle: {
    fontSize: 13,
    color: '#EA580C',
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
