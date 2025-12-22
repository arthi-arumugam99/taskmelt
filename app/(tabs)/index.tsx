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
import { Sparkles, RotateCcw, Mic, Square } from 'lucide-react-native';
import { useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import Colors from '@/constants/colors';
import { useDumps } from '@/contexts/DumpContext';
import { DumpSession, Category, CategoryType, CATEGORY_CONFIG } from '@/types/dump';
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
      type: z.enum(['doNow', 'today', 'thisWeek', 'someday', 'notActionable']),
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
  const { isRecording, isTranscribing, error: voiceError, startRecording, stopRecording, cancelRecording } = useVoiceRecording();

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
2. Categorize each item:
   - doNow: Urgent, can be done in <5 min, or blocking something
   - today: Should happen today
   - thisWeek: Important, not urgent, has implicit deadline
   - someday: No deadline, life admin, "would be nice"
   - notActionable: Feelings, worries, vague concerns (acknowledge but don't create false tasks)

3. For each actionable item:
   - Rewrite as a clear, specific action (verb + object)
   - Estimate time if possible

4. For non-actionable items:
   - Acknowledge the feeling
   - Suggest it may resolve when related tasks are done

RULES:
- Never create tasks that weren't implied in the input
- Keep task rewrites concise (<15 words)
- If input is very short, output can be short too
- Be warm and encouraging in the summary

Here's the brain dump to organize:
"""
${text}
"""`,
          },
        ],
        schema: resultSchema,
      });

      console.log('AI result:', JSON.stringify(result, null, 2));
      return result;
    },
    onSuccess: (result) => {
      const sessionId = generateId();
      
      const categories: Category[] = Object.entries(CATEGORY_CONFIG).map(([type, config]) => {
        const categoryResult = result.categories.find((c) => c.type === type);
        return {
          type: type as CategoryType,
          name: config.name,
          emoji: config.emoji,
          items: (categoryResult?.items || []).map((item) => ({
            id: generateId(),
            task: item.task,
            original: item.original,
            timeEstimate: item.timeEstimate,
            completed: false,
          })),
        };
      });

      const session: DumpSession = {
        id: sessionId,
        rawText: inputText,
        categories,
        createdAt: new Date().toISOString(),
        summary: result.summary,
      };

      setCurrentSession(session);
      addDump(session);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error) => {
      console.error('Organization error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const handleOrganize = useCallback(() => {
    if (!inputText.trim() || isPending) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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

    organizeMutate(inputText.trim());
  }, [inputText, isPending, organizeMutate, buttonScale]);

  const handleReset = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputText('');
    setCurrentSession(null);
    reset();
    cancelRecording();
  }, [reset, cancelRecording]);

  const handleVoicePress = useCallback(async () => {
    if (currentSession) return;
    
    if (isRecording) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const transcribedText = await stopRecording();
      if (transcribedText) {
        setInputText((prev) => {
          const separator = prev.trim() ? ' ' : '';
          return prev + separator + transcribedText;
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await startRecording();
    }
  }, [isRecording, currentSession, startRecording, stopRecording]);

  const handleToggleTask = useCallback(
    (taskId: string) => {
      if (!currentSession) return;
      
      toggleTask(currentSession.id, taskId);
      
      setCurrentSession((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          categories: prev.categories.map((category) => ({
            ...category,
            items: category.items.map((item) => {
              if (item.id !== taskId) return item;
              return {
                ...item,
                completed: !item.completed,
                completedAt: !item.completed ? new Date().toISOString() : undefined,
              };
            }),
          })),
        };
      });
    },
    [currentSession, toggleTask]
  );

  const isButtonDisabled = !inputText.trim() || isPending;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>taskmelt</Text>
            <Text style={styles.subtitle}>Chaos in. Clarity out.</Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder={isRecording ? 'Listening...' : placeholder}
              placeholderTextColor={isRecording ? Colors.error : Colors.textMuted}
              multiline
              value={inputText}
              onChangeText={setInputText}
              textAlignVertical="top"
              editable={!currentSession && !isRecording}
            />
            
            {!currentSession && (
              <View style={styles.voiceButtonContainer}>
                <Animated.View style={{ transform: [{ scale: micPulse }] }}>
                  <TouchableOpacity
                    style={[
                      styles.voiceButton,
                      isRecording && styles.voiceButtonRecording,
                      isTranscribing && styles.voiceButtonTranscribing,
                    ]}
                    onPress={handleVoicePress}
                    disabled={isTranscribing}
                    activeOpacity={0.7}
                  >
                    {isTranscribing ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : isRecording ? (
                      <Square size={18} color="#FFFFFF" fill="#FFFFFF" />
                    ) : (
                      <Mic size={20} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                </Animated.View>
                {isRecording && (
                  <Text style={styles.recordingHint}>Tap to stop</Text>
                )}
                {isTranscribing && (
                  <Text style={styles.recordingHint}>Transcribing...</Text>
                )}
              </View>
            )}
          </View>

          <View style={styles.buttonRow}>
            <Animated.View style={[styles.buttonWrapper, { transform: [{ scale: buttonScale }] }]}>
              <TouchableOpacity
                style={[
                  styles.organizeButton,
                  isButtonDisabled && styles.organizeButtonDisabled,
                  currentSession && styles.organizeButtonHidden,
                ]}
                onPress={handleOrganize}
                activeOpacity={0.8}
                disabled={isButtonDisabled || !!currentSession}
              >
                {isPending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Sparkles size={20} color="#FFFFFF" />
                )}
                <Text style={styles.organizeButtonText}>
                  {isPending ? 'Melting...' : 'Melt My Chaos'}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {currentSession && (
              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleReset}
                activeOpacity={0.7}
              >
                <RotateCcw size={18} color={Colors.primary} />
                <Text style={styles.resetButtonText}>New Dump</Text>
              </TouchableOpacity>
            )}
          </View>

          {(isError || voiceError) && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {voiceError || 'Something went wrong. Please try again.'}
              </Text>
            </View>
          )}

          {currentSession && (
            <View style={styles.resultsContainer}>
              <OrganizedResults
                categories={currentSession.categories}
                summary={currentSession.summary}
                onToggleTask={handleToggleTask}
              />
            </View>
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
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  inputContainer: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    minHeight: 180,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    padding: 20,
    minHeight: 180,
    lineHeight: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  buttonWrapper: {
    flex: 1,
  },
  organizeButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  organizeButtonDisabled: {
    opacity: 0.5,
  },
  organizeButtonHidden: {
    display: 'none',
  },
  organizeButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600' as const,
  },
  resetButton: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resetButtonText: {
    color: Colors.primary,
    fontSize: 17,
    fontWeight: '600' as const,
  },
  errorContainer: {
    backgroundColor: '#FDF2F2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  errorText: {
    color: Colors.error,
    fontSize: 15,
    textAlign: 'center',
  },
  resultsContainer: {
    marginTop: 8,
  },
  voiceButtonContainer: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    alignItems: 'center',
    gap: 6,
  },
  voiceButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  voiceButtonRecording: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  voiceButtonTranscribing: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  recordingHint: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
});
