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
      name: z.string(),
      emoji: z.string(),
      color: z.string(),
      items: z.array(
        z.object({
          task: z.string(),
          original: z.string().optional(),
          scheduledTime: z.string().optional(),
          duration: z.string().optional(),
          timeEstimate: z.string().optional(),
          priority: z.enum(['high', 'medium', 'low']).optional(),
          subtasks: z.array(
            z.object({
              task: z.string(),
              scheduledTime: z.string().optional(),
              duration: z.string().optional(),
              timeEstimate: z.string().optional(),
              priority: z.enum(['high', 'medium', 'low']).optional(),
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
  const [currentSession] = useState<DumpSession | null>(null);
  const [placeholder] = useState(() => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]);

  const buttonScale = useRef(new Animated.Value(1)).current;
  const micPulse = useRef(new Animated.Value(1)).current;
  const { addDump, canCreateDump, remainingFreeDumps } = useDumps();
  const { isProUser } = useRevenueCat();
  const router = useRouter();
  const { isRecording, isTranscribing, error: voiceError, recordingDuration, startRecording, stopRecording } = useVoiceRecording();

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
      console.log('Toolkit URL configured:', !!process.env.EXPO_PUBLIC_TOOLKIT_URL);
      
      if (!process.env.EXPO_PUBLIC_TOOLKIT_URL) {
        throw new Error('AI service not configured. Please restart the app.');
      }
      
      let lastError: Error | null = null;
      const maxRetries = 2;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Attempt ${attempt}/${maxRetries}...`);
          
          const result = await Promise.race([
            generateObject({
              messages: [
                {
                  role: 'user',
                  content: `You are an elite AI productivity assistant. Transform this brain dump into a perfectly organized, actionable productivity system.

**🎯 CORE MISSION:**
Create a smart, time-aware task system that orders by IMPORTANCE & LOGIC—not by the order things were mentioned.

**⚡ INTELLIGENT TIME HANDLING:**
1. **scheduledTime**: ONLY for specific appointment times
   - Examples: "9:30" (9:30am), "14:00" (2pm), "15:45" (3:45pm)
   - Format: 24-hour "HH:MM" format
   - Use for: meetings, appointments, deadlines with specific times
   - "meeting at 2pm" → scheduledTime: "14:00"
   - "pick up kids at 3:30" → scheduledTime: "15:30"
   - "gym at 6am" → scheduledTime: "06:00"

2. **duration**: Estimated time to complete the task
   - Examples: "15m", "30m", "1h", "2h", "3h"
   - Use for ALL actionable tasks
   - Be realistic: emails (10-15m), calls (30m), reports (2-3h)

3. **timeEstimate**: Human-readable combined info (LEGACY, populate for compatibility)
   - Examples: "30 mins", "1 hour", "2 hours"

**🧠 CRITICAL: SMART TASK GROUPING & BREAKDOWN**

⚠️ YOU MUST GROUP RELATED TASKS AND CREATE SUBTASKS ⚠️

This is THE MOST IMPORTANT RULE. Users complain when you don't do this right.

**GROUPING RULES (DO THIS FIRST):**
1. If you see multiple tasks about the SAME THING → Create ONE parent task with ALL as subtasks
   - "Reply to email X", "Reply to email Y", "Reply to email Z" → Parent: "Handle email responses" + 3 subtasks
   - "Respond to Slack message 1", "Respond to Slack message 2" → Parent: "Respond to Slack messages" + 2 subtasks
   - "Open document", "Write conclusion", "Send file" → Parent: "Complete and send document" + 3 subtasks

2. If tasks are STEPS in a larger workflow → Create parent with workflow name
   - "Check invoice status", "Open bank app", "Send payment" → Parent: "Process invoice payment" + 3 subtasks
   - "Find charger", "Plug in device" → Parent: "Charge device" + 2 subtasks

3. If tasks mention "then", "after", "and then" → They're a sequence, make them subtasks

**BREAKDOWN RULES (AFTER GROUPING):**
1. Complex tasks (>30 min) → MUST have subtasks
2. Tasks with "prepare", "plan", "organize", "setup", "create", "research" → MUST have subtasks
3. Each subtask MUST have: task, duration, priority, scheduledTime (if applicable)
4. Set hasSubtaskSuggestion: true on parent task
5. Make 2-6 subtasks per complex task
6. Each subtask must be actionable and atomic

**CRITICAL EXAMPLES - STUDY THESE:**

❌ WRONG (What you're doing now):
Input: "reply to update request email, respond to slack messages, respond to slack message needing decision"
Bad output: 3 separate tasks

✅ CORRECT (What you MUST do):
Parent: { task: "Handle communications", hasSubtaskSuggestion: true, duration: "45m", subtasks: [...] }
Subtasks:
- Reply to update request email (10m, high)
- Respond to slack messages (15m, medium)  
- Respond to slack message needing decision (20m, high)

❌ WRONG:
Input: "open document and review, write conclusion, send file, check file"
Bad output: 4 separate tasks

✅ CORRECT:
Parent: { task: "Complete and finalize document", hasSubtaskSuggestion: true, duration: "1h", subtasks: [...] }
Subtasks:
- Open document and review current state (10m, high)
- Write and add conclusion (20m, high)
- Double check and rename file (5m, medium)
- Send finished file (5m, high)

"prepare presentation" →
  Parent: { task: "Prepare presentation", hasSubtaskSuggestion: true, subtasks: [...] }
  Subtasks:
  - Research topic and gather data (1h, medium)
  - Create slide outline (30m, medium)
  - Design slides with visuals (2h, medium)
  - Practice delivery and timing (30m, low)

"weekly meal prep" →
  Parent: { task: "Weekly meal prep", hasSubtaskSuggestion: true, subtasks: [...] }
  Subtasks:
  - Plan meals for the week (20m, medium)
  - Create grocery list (10m, medium)
  - Go grocery shopping (1h, medium)
  - Cook and portion meals (3h, high)

"organize team meeting" →
  Parent: { task: "Organize team meeting", hasSubtaskSuggestion: true, subtasks: [...] }
  Subtasks:
  - Choose meeting time and date (15m, high)
  - Send calendar invites to team (10m, high)
  - Prepare meeting agenda (30m, medium)
  - Book conference room (5m, medium)

"plan vacation" →
  Parent: { task: "Plan vacation", hasSubtaskSuggestion: true, subtasks: [...] }
  Subtasks:
  - Research destinations and activities (1h, medium)
  - Compare flights and prices (30m, medium)
  - Book flights and accommodation (45m, high)
  - Create day-by-day itinerary (1h, low)

"write blog post" →
  Subtasks:
  - Brainstorm topics and outline (30m, medium)
  - Research and gather sources (1h, medium)
  - Write first draft (2h, high)
  - Edit and proofread (45m, medium)
  - Add images and format (30m, low)

"deep clean apartment" →
  Subtasks:
  - Declutter and organize (1h, medium)
  - Clean kitchen and appliances (45m, high)
  - Clean bathroom thoroughly (30m, high)
  - Vacuum and mop floors (45m, medium)

**WHEN TO BREAK DOWN:**
- Preparing anything → subtasks
- Planning anything → subtasks
- Organizing anything → subtasks
- Creating anything substantial → subtasks
- Any task mentioning "and" (e.g., "clean and organize") → subtasks
- Any task that takes more than 30 minutes → subtasks

**📊 PRIORITY ASSIGNMENT:**
Assign priority to EVERY task:
- **high**: Urgent, time-sensitive, deadlines today, meetings, critical
- **medium**: Important but flexible, regular work tasks
- **low**: Nice-to-have, optional, can be postponed

**🎨 SMART CATEGORIZATION:**
Create 2-5 logical categories:
- Common: Work, Personal, Health, Finance, Home, Learning, Social
- Use context clues: gym→Health, emails→Work, groceries→Personal/Home
- Assign category priority based on urgency of items within
- Put time-sensitive items in high-priority categories

**📋 INTELLIGENT ORDERING WITHIN CATEGORIES:**
1. ⏰ Scheduled items FIRST (sorted by scheduledTime chronologically)
2. 🔥 High-priority unscheduled tasks
3. 📌 Medium-priority tasks  
4. 💭 Low-priority tasks
5. 📝 Reflections/notes LAST

Example category order:
- "Meeting with Sarah" (scheduledTime: "10:00", priority: high)
- "Submit report" (priority: high, duration: "2h")
- "Review emails" (priority: medium, duration: "30m")
- "Update website" (priority: low, duration: "1h")
- Reflection: "Feeling overwhelmed with deadlines"

**🎯 CATEGORY ORDER:**
Order categories by:
1. Categories with scheduled items first
2. High-priority categories
3. Medium-priority categories
4. Low-priority categories

**💡 SPECIAL ITEMS:**
- Mark thoughts/feelings/reflections with isReflection: true
- These get their own category or go to "Notes & Reflections"
- No priority, no duration for reflections

**📝 EXTRACT EVERYTHING:**
- Every task, action, idea, thought mentioned
- Every meeting, appointment, deadline
- Every wish, goal, concern
- Be thorough but smart—combine duplicates

**INPUT TO ORGANIZE:**
${text}`,
                },
              ],
              schema: resultSchema,
            }),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Request timeout - AI is taking too long')), 45000)
            )
          ]);
          
          console.log('✓ AI Response received');
          console.log('Categories:', result?.categories?.length ?? 0);
          
          if (!result || typeof result !== 'object') {
            throw new Error('Invalid AI response format');
          }
          
          if (!result.categories || !Array.isArray(result.categories)) {
            throw new Error('Missing categories in response');
          }
          
          return result;
        } catch (error) {
          console.error(`Attempt ${attempt} failed:`, error);
          lastError = error as Error;
          
          if (attempt < maxRetries) {
            console.log('Retrying in 1 second...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      console.error('All retry attempts failed');
      const errorMessage = lastError?.message || 'Unknown error';
      
      if (errorMessage.includes('Network request failed')) {
        throw new Error('Unable to connect to AI service. Please check your internet connection and try again.');
      } else if (errorMessage.includes('timeout')) {
        throw new Error('AI is taking too long. Try a shorter brain dump or try again later.');
      } else {
        throw new Error(errorMessage);
      }
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
          priority: item.priority || 'medium',
          subtasks: item.subtasks?.map(subtask => ({
            ...subtask,
            id: generateId(),
            completed: false,
            priority: subtask.priority || 'medium',
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

      addDump(session);
      setInputText('');
      
      // Navigate to tasks page with animation
      router.push({
        pathname: '/(tabs)/tasks' as any,
        params: { animated: 'true', date: new Date().toISOString().split('T')[0] }
      });
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
    if (isRecording) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const finalTranscript = await stopRecording();
      if (finalTranscript) {
        setInputText(finalTranscript);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await startRecording((transcript) => {
        setInputText(transcript);
      });
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
                  <View style={styles.listeningContainer}>
                    <Text style={styles.listeningText}>
                      {Platform.OS === 'web' ? '🎤 Live transcription active' : '🎙️ Recording... (transcribes when you stop)'}
                    </Text>
                    <View style={styles.waveBars}>
                      <Animated.View style={[styles.waveBar, { height: 12 }]} />
                      <Animated.View style={[styles.waveBar, { height: 20 }]} />
                      <Animated.View style={[styles.waveBar, { height: 16 }]} />
                      <Animated.View style={[styles.waveBar, { height: 24 }]} />
                      <Animated.View style={[styles.waveBar, { height: 14 }]} />
                    </View>
                  </View>
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
