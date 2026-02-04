import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Vibration,
  Platform,
} from 'react-native';
import { X, Play, Pause, SkipForward, Check, Clock, Zap } from 'lucide-react-native';
import { TaskItem } from '@/types/dump';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FocusModeProps {
  task: TaskItem;
  onComplete: () => void;
  onClose: () => void;
  onTimeUpdate?: (seconds: number) => void;
}

type FocusPhase = 'focus' | 'break' | 'idle';

const FOCUS_DURATION = 25 * 60; // 25 minutes
const BREAK_DURATION = 5 * 60; // 5 minutes

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function FocusMode({
  task,
  onComplete,
  onClose,
  onTimeUpdate,
}: FocusModeProps) {
  const [phase, setPhase] = useState<FocusPhase>('idle');
  const [timeRemaining, setTimeRemaining] = useState(FOCUS_DURATION);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRunning) {
      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRunning]);

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          if (phase === 'focus') {
            setTotalFocusTime((t) => t + 1);
            onTimeUpdate?.(1);
          }
          // Update progress
          const duration = phase === 'focus' ? FOCUS_DURATION : BREAK_DURATION;
          const progress = 1 - newTime / duration;
          Animated.timing(progressAnim, {
            toValue: progress,
            duration: 100,
            useNativeDriver: false,
          }).start();

          return newTime;
        });
      }, 1000);
    } else if (timeRemaining === 0 && isRunning) {
      // Phase complete
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      if (phase === 'focus') {
        setSessionsCompleted((s) => s + 1);
        setPhase('break');
        setTimeRemaining(BREAK_DURATION);
      } else {
        setPhase('focus');
        setTimeRemaining(FOCUS_DURATION);
      }
      progressAnim.setValue(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining, phase]);

  const handleStart = useCallback(() => {
    if (phase === 'idle') {
      setPhase('focus');
    }
    setIsRunning(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [phase]);

  const handlePause = useCallback(() => {
    setIsRunning(false);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleSkip = useCallback(() => {
    if (phase === 'focus') {
      setPhase('break');
      setTimeRemaining(BREAK_DURATION);
    } else {
      setPhase('focus');
      setTimeRemaining(FOCUS_DURATION);
    }
    progressAnim.setValue(0);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [phase]);

  const handleComplete = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onComplete();
  }, [onComplete]);

  const handleClose = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onClose());
  }, [onClose]);

  const progress = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const phaseColor = phase === 'focus' ? '#22C55E' : phase === 'break' ? '#3B82F6' : '#6B5C4C';
  const phaseText = phase === 'focus' ? 'Focus' : phase === 'break' ? 'Break' : 'Ready';

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <X size={24} color="#FEF7E6" />
        </TouchableOpacity>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Clock size={14} color="#FEF7E6" />
            <Text style={styles.statText}>{formatTime(totalFocusTime)}</Text>
          </View>
          <View style={styles.stat}>
            <Zap size={14} color="#FEF7E6" />
            <Text style={styles.statText}>{sessionsCompleted}</Text>
          </View>
        </View>
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Task info */}
        <View style={styles.taskContainer}>
          <Text style={styles.focusLabel}>Focusing on</Text>
          <Text style={styles.taskText} numberOfLines={3}>
            {task.task}
          </Text>
        </View>

        {/* Timer */}
        <Animated.View
          style={[
            styles.timerContainer,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <View style={styles.timerCircle}>
            <Animated.View
              style={[
                styles.timerProgress,
                {
                  width: progress,
                  backgroundColor: phaseColor,
                },
              ]}
            />
            <View style={styles.timerInner}>
              <Text style={[styles.phaseLabel, { color: phaseColor }]}>
                {phaseText}
              </Text>
              <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={handleSkip}
            style={styles.secondaryButton}
          >
            <SkipForward size={20} color="#FEF7E6" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={isRunning ? handlePause : handleStart}
            style={[styles.primaryButton, { backgroundColor: phaseColor }]}
          >
            {isRunning ? (
              <Pause size={32} color="#FEF7E6" />
            ) : (
              <Play size={32} color="#FEF7E6" style={{ marginLeft: 4 }} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleComplete}
            style={styles.secondaryButton}
          >
            <Check size={20} color="#FEF7E6" />
          </TouchableOpacity>
        </View>

        {/* Tip */}
        <Text style={styles.tip}>
          {phase === 'focus'
            ? 'Stay focused. You got this.'
            : phase === 'break'
            ? 'Take a short break. Stretch, breathe.'
            : 'Press play to start your focus session.'}
        </Text>
      </View>

      {/* Complete button */}
      <TouchableOpacity
        onPress={handleComplete}
        style={styles.completeButton}
      >
        <Check size={20} color="#1A1A1A" />
        <Text style={styles.completeButtonText}>Mark Complete</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1A1A1A',
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statText: {
    color: '#FEF7E6',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  taskContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  focusLabel: {
    color: '#8B7B6B',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  taskText: {
    color: '#FEF7E6',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 32,
  },
  timerContainer: {
    marginBottom: 48,
  },
  timerCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  timerProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    opacity: 0.2,
  },
  timerInner: {
    alignItems: 'center',
  },
  phaseLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timerText: {
    color: '#FEF7E6',
    fontSize: 56,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginBottom: 32,
  },
  primaryButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  secondaryButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tip: {
    color: '#6B5C4C',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF7E6',
    marginHorizontal: 32,
    marginBottom: 48,
    paddingVertical: 16,
    borderRadius: 12,
  },
  completeButtonText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '600',
  },
});
