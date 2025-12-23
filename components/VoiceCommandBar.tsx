import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Animated,
} from 'react-native';
import { Send, X, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useRorkAgent, createRorkTool } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';

interface VoiceCommandBarProps {
  visible: boolean;
  onClose: () => void;
  onCommand: (command: { type: string; data: any }) => void;
  tasks: { id: string; task: string; completed: boolean }[];
}

export default function VoiceCommandBar({
  visible,
  onClose,
  onCommand,
  tasks,
}: VoiceCommandBarProps) {
  const [input, setInput] = useState('');
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const { messages, error, sendMessage, setMessages } = useRorkAgent({
    tools: {
      findNextTask: createRorkTool({
        description: 'Find the next best task for the user to work on',
        zodSchema: z.object({
          taskId: z.string().describe('The ID of the recommended task'),
          reason: z.string().describe('Why this task is recommended next'),
        }),
        execute(input) {
          onCommand({ type: 'nextTask', data: input });
          return 'Task recommended!';
        },
      }),
      scheduleTasks: createRorkTool({
        description: 'Schedule or reschedule tasks',
        zodSchema: z.object({
          taskIds: z.array(z.string()).describe('Task IDs to schedule'),
          time: z.string().describe('Scheduled time'),
          date: z.string().optional().describe('Optional date'),
        }),
        execute(input) {
          onCommand({ type: 'schedule', data: input });
          return 'Tasks scheduled!';
        },
      }),
      groupByContext: createRorkTool({
        description: 'Group tasks by context (work, home, errands, etc.)',
        zodSchema: z.object({
          context: z.enum(['work', 'home', 'errands', 'computer', 'phone', 'anywhere']),
        }),
        execute(input) {
          onCommand({ type: 'groupByContext', data: input });
          return 'Tasks grouped!';
        },
      }),
      prioritizeTasks: createRorkTool({
        description: 'Re-prioritize tasks based on criteria',
        zodSchema: z.object({
          taskIds: z.array(z.string()),
          priority: z.enum(['high', 'medium', 'low']),
        }),
        execute(input) {
          onCommand({ type: 'prioritize', data: input });
          return 'Tasks prioritized!';
        },
      }),
    },
  });

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
      setMessages([]);
      setInput('');
    }
  }, [visible, fadeAnim, setMessages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const taskContext = tasks
      .filter(t => !t.completed)
      .slice(0, 10)
      .map(t => `- ${t.task} (ID: ${t.id})`)
      .join('\n');

    const contextualPrompt = `User command: "${input}"

Available tasks:
${taskContext}

Help the user with their request using the available tools.`;

    await sendMessage(contextualPrompt);
    setInput('');
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Sparkles size={24} color={Colors.primary} />
              <Text style={styles.title}>AI Assistant</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.messagesContainer}>
            {messages.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>How can I help?</Text>
                <View style={styles.examplesList}>
                  <Text style={styles.exampleText}>• &ldquo;What should I do next?&rdquo;</Text>
                  <Text style={styles.exampleText}>• &ldquo;Show me all work tasks&rdquo;</Text>
                  <Text style={styles.exampleText}>• &ldquo;Schedule my tasks for today&rdquo;</Text>
                  <Text style={styles.exampleText}>• &ldquo;Group tasks by location&rdquo;</Text>
                </View>
              </View>
            ) : (
              <>
                {messages.map((m) => (
                  <View key={m.id} style={styles.messageRow}>
                    {m.role === 'user' && (
                      <View style={styles.userMessage}>
                        <Text style={styles.userMessageText}>
                          {m.parts.find((p) => p.type === 'text')?.text}
                        </Text>
                      </View>
                    )}
                    {m.role === 'assistant' && (
                      <View style={styles.assistantMessage}>
                        {m.parts.map((part, i) => {
                          if (part.type === 'text') {
                            return (
                              <Text key={`${m.id}-${i}`} style={styles.assistantMessageText}>
                                {part.text}
                              </Text>
                            );
                          }
                          if (part.type === 'tool') {
                            if (part.state === 'input-streaming' || part.state === 'input-available') {
                              return (
                                <View key={`${m.id}-${i}`} style={styles.toolIndicator}>
                                  <ActivityIndicator size="small" color={Colors.primary} />
                                  <Text style={styles.toolText}>Working on it...</Text>
                                </View>
                              );
                            }
                            if (part.state === 'output-available') {
                              return (
                                <View key={`${m.id}-${i}`} style={styles.toolSuccess}>
                                  <Text style={styles.toolSuccessText}>✓ Done!</Text>
                                </View>
                              );
                            }
                          }
                          return null;
                        })}
                      </View>
                    )}
                  </View>
                ))}
              </>
            )}
            {error && (
              <View style={styles.errorMessage}>
                <Text style={styles.errorText}>Error: {error.message}</Text>
              </View>
            )}
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Ask me anything..."
                placeholderTextColor={Colors.textMuted}
                multiline
                maxLength={200}
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!input.trim()}
              >
                <Send size={20} color={input.trim() ? Colors.background : Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  container: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '70%',
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: Colors.text,
  },
  closeButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 20,
  },
  examplesList: {
    gap: 10,
    alignSelf: 'stretch',
  },
  exampleText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  messageRow: {
    marginBottom: 12,
  },
  userMessage: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  userMessageText: {
    fontSize: 15,
    color: Colors.background,
    fontWeight: '600' as const,
  },
  assistantMessage: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    alignSelf: 'flex-start',
    maxWidth: '80%',
    gap: 8,
  },
  assistantMessageText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  toolIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  toolText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '600' as const,
  },
  toolSuccess: {
    paddingVertical: 4,
  },
  toolSuccessText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '700' as const,
  },
  errorMessage: {
    backgroundColor: '#FF6B6B20',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  errorText: {
    fontSize: 13,
    color: '#FF6B6B',
    fontWeight: '600' as const,
  },
  inputContainer: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: Colors.border,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 2,
    borderColor: Colors.border,
    maxHeight: 100,
    fontWeight: '600' as const,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.card,
  },
});
