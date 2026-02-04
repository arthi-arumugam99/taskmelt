import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Plus, X, Send, Zap } from 'lucide-react-native';
import { parseNaturalLanguageTask, getParsePreview } from '@/lib/naturalLanguageParser';
import * as Haptics from 'expo-haptics';

interface QuickCaptureProps {
  onSubmit: (task: {
    text: string;
    scheduledDate?: string;
    scheduledTime?: string;
    priority?: 'high' | 'medium' | 'low';
    context?: string;
    duration?: number;
    tags?: string[];
  }) => void;
  visible?: boolean;
}

export default function QuickCapture({ onSubmit, visible = true }: QuickCaptureProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputText, setInputText] = useState('');
  const [parsedPreviews, setParsedPreviews] = useState<string[]>([]);

  const expandAnim = useRef(new Animated.Value(0)).current;
  const fabScale = useRef(new Animated.Value(1)).current;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    Animated.spring(expandAnim, {
      toValue: isExpanded ? 1 : 0,
      friction: 8,
      tension: 100,
      useNativeDriver: false,
    }).start();

    if (isExpanded) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isExpanded]);

  useEffect(() => {
    if (inputText.trim()) {
      const parsed = parseNaturalLanguageTask(inputText);
      setParsedPreviews(getParsePreview(parsed));
    } else {
      setParsedPreviews([]);
    }
  }, [inputText]);

  const handleOpen = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsExpanded(true);
  }, []);

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    setIsExpanded(false);
    setInputText('');
    setParsedPreviews([]);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!inputText.trim()) return;

    const parsed = parseNaturalLanguageTask(inputText);

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    onSubmit({
      text: parsed.cleanText || inputText.trim(),
      scheduledDate: parsed.scheduledDate,
      scheduledTime: parsed.scheduledTime,
      priority: parsed.priority,
      context: parsed.context,
      duration: parsed.duration,
      tags: parsed.tags,
    });

    handleClose();
  }, [inputText, onSubmit, handleClose]);

  const handleFabPressIn = useCallback(() => {
    Animated.spring(fabScale, {
      toValue: 0.9,
      friction: 5,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleFabPressOut = useCallback(() => {
    Animated.spring(fabScale, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  }, []);

  if (!visible) return null;

  const modalWidth = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [60, 340],
  });

  const modalHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [60, parsedPreviews.length > 0 ? 180 : 140],
  });

  const borderRadius = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 20],
  });

  const iconOpacity = expandAnim.interpolate({
    inputRange: [0, 0.3],
    outputRange: [1, 0],
  });

  const inputOpacity = expandAnim.interpolate({
    inputRange: [0.5, 1],
    outputRange: [0, 1],
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      pointerEvents="box-none"
    >
      {/* Backdrop */}
      {isExpanded && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
      )}

      {/* FAB / Input container */}
      <Animated.View
        style={[
          styles.fabContainer,
          {
            width: modalWidth,
            height: modalHeight,
            borderRadius,
          },
        ]}
      >
        {/* FAB button (when closed) */}
        <Animated.View
          style={[
            styles.fabContent,
            { opacity: iconOpacity },
          ]}
        >
          <TouchableOpacity
            onPress={handleOpen}
            onPressIn={handleFabPressIn}
            onPressOut={handleFabPressOut}
            style={styles.fabTouchable}
            activeOpacity={1}
          >
            <Animated.View style={{ transform: [{ scale: fabScale }] }}>
              <Plus size={28} color="#FEF7E6" strokeWidth={2.5} />
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>

        {/* Input content (when expanded) */}
        <Animated.View
          style={[
            styles.inputContainer,
            { opacity: inputOpacity },
          ]}
          pointerEvents={isExpanded ? 'auto' : 'none'}
        >
          {/* Header */}
          <View style={styles.inputHeader}>
            <View style={styles.quickBadge}>
              <Zap size={12} color="#F59E0B" />
              <Text style={styles.quickBadgeText}>Quick Capture</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={18} color="#6B5C4C" />
            </TouchableOpacity>
          </View>

          {/* Input */}
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder="Add a task... (try: 'Call mom tomorrow at 3pm')"
              placeholderTextColor="#A89F91"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSubmit}
              returnKeyType="done"
              multiline={false}
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={handleSubmit}
              style={[
                styles.sendButton,
                !inputText.trim() && styles.sendButtonDisabled,
              ]}
              disabled={!inputText.trim()}
            >
              <Send size={18} color={inputText.trim() ? '#FEF7E6' : '#A89F91'} />
            </TouchableOpacity>
          </View>

          {/* Parsed previews */}
          {parsedPreviews.length > 0 && (
            <View style={styles.previewContainer}>
              {parsedPreviews.map((preview, index) => (
                <View key={index} style={styles.previewChip}>
                  <Text style={styles.previewText}>{preview}</Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 100,
  },
  backdrop: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  fabContainer: {
    backgroundColor: '#1A1A1A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  fabContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabTouchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flex: 1,
    padding: 12,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F59E0B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#FEF7E6',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  previewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  previewChip: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  previewText: {
    fontSize: 11,
    color: '#A89F91',
  },
});
