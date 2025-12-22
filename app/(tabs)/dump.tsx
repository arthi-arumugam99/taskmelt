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
import { RotateCcw, Mic, Square } from 'lucide-react-native';
import { useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import Colors from '@/constants/colors';
import { useDumps } from '@/contexts/DumpContext';
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
        })
      ),
    })
  ),
  summary: z.string(),
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
  const { addDump, toggleTask } = useDumps();
  const { isRecording, isTranscribing, error: voiceError, startRecording, stopRecording } = useVoiceRecording();

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

  const { mutate: organizeMutate, isPending, isError, reset } = useMutation({
    mutationFn: async (text: string) => {
      console.log('Organizing text:', text.substring(0, 100) + '...');
      
      const result = await generateObject({
        messages: [
          {
            role: 'user',
            content: `You are a compassionate productivity assistant helping someone organize their overwhelming thoughts.

INPUT: A messy, unstructured brain dump of thoughts, tasks, worries, and ideas.

YOUR JOB:
1. Parse the chaos into individual items
2. Categorize each item dynamically based on context. Don't force items into predefined categories. Instead, create categories that make sense for what the user shared. Examples:
   - For work tasks: "Work Today", "Meetings", "Email/Communication", "Projects"
   - For personal: "Home Tasks", "Health & Wellness", "Social", "Creative Projects"
   - For urgent items: "Do Now", "Today", "This Week"
   - For concerns: "To Think About", "Decisions to Make", "Questions to Answer"
   - Always include: "Not Actionable" for pure feelings/worries without clear actions

3. For each actionable item:
   - Rewrite as a clear, specific action (verb + object)
   - Estimate time if possible
   - Note any missing info needed (dates, details)

4. For non-actionable items:
   - Acknowledge the feeling
   - Suggest it may resolve when related tasks are done

5. Use appropriate emojis for each category that match the context

OUTPUT FORMAT:
Return JSON with dynamic categories based on the user's input:
{
  "categories": [
    {
      "name": "Category Name (based on context)",
      "emoji": "📋",
      "color": "#FF6B6B or #4ECDC4 or #45B7D1 or #96CEB4 or #FFEAA7 or similar",
      "items": [
        {
          "task": "Clear, actionable task text",
          "original": "What user wrote that mapped to this",
          "timeEstimate": "5 min"
        }
      ]
    }
  ],
  "summary": "Brief encouraging message about what was organized"
}

TONE: Warm, non-judgmental, practical. Like a supportive friend who's good at organizing.

RULES:
- Never create tasks that weren't implied in the input
- Create categories that reflect the USER'S life context, not generic templates
- Group similar items together under meaningful category names
- When in doubt, ask for clarity rather than assume
- "Not Actionable" is valid - not everything needs to be a task
- Keep task rewrites concise (<15 words)
- If input is very short, output can be short too
- Use colors that are vibrant and distinct for each category

Here's what the user needs to organize:

${text}`,
          },
        ],
        schema: resultSchema,
      });
      
      console.log('AI Response:', JSON.stringify(result, null, 2));
      return result;
    },
    onSuccess: (data) => {
      console.log('Organization successful:', data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const categories: Category[] = data.categories.map(cat => ({
        ...cat,
        items: cat.items.map(item => ({
          ...item,
          id: generateId(),
          completed: false,
        })),
      }));

      const session: DumpSession = {
        id: generateId(),
        rawText: inputText,
        categories,
        createdAt: new Date().toISOString(),
        summary: data.summary,
      };

      setCurrentSession(session);
      addDump(session);
    },
    onError: (error) => {
      console.error('Organization failed:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const handleOrganize = useCallback(() => {
    if (!inputText.trim() || isPending) return;

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
  }, [inputText, isPending, organizeMutate, buttonScale]);

  const handleReset = useCallback(() => {
    setInputText('');
    setCurrentSession(null);
    reset();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [reset]);

  const handleToggleTask = useCallback((taskId: string) => {
    if (!currentSession) return;

    const updatedSession = { ...currentSession };
    let taskFound = false;
    
    for (const category of updatedSession.categories) {
      const taskIndex = category.items.findIndex(item => item.id === taskId);
      if (taskIndex !== -1) {
        category.items[taskIndex].completed = !category.items[taskIndex].completed;
        taskFound = true;
        
        Haptics.impactAsync(
          category.items[taskIndex].completed 
            ? Haptics.ImpactFeedbackStyle.Medium 
            : Haptics.ImpactFeedbackStyle.Light
        );
        break;
      }
    }
    
    if (taskFound) {
      setCurrentSession(updatedSession);
      toggleTask(currentSession.id, taskId);
    }
  }, [currentSession, toggleTask]);

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
                      <Text style={styles.organizeButtonText}>Melt My Chaos</Text>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              </View>

              {isError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>
                    Oops! Something went wrong. Please try again.
                  </Text>
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
          ) : (
            <>
              <View style={styles.resultsHeader}>
                <View>
                  <Text style={styles.resultsTitle}>Your Clarity</Text>
                  {currentSession.summary && (
                    <Text style={styles.resultsSummary}>{currentSession.summary}</Text>
                  )}
                </View>
                <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
                  <RotateCcw size={20} color={Colors.primary} />
                </TouchableOpacity>
              </View>

              <OrganizedResults
                categories={currentSession.categories}
                summary={currentSession.summary}
                onToggleTask={handleToggleTask}
              />

              <TouchableOpacity
                style={styles.newDumpButton}
                onPress={handleReset}
              >
                <Text style={styles.newDumpButtonText}>Start New Dump</Text>
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
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textMuted,
    fontWeight: '500' as const,
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
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  resultsSummary: {
    fontSize: 14,
    color: Colors.textMuted,
    fontStyle: 'italic' as const,
  },
  resetButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.card,
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
});
