import { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Play, Pause, RotateCcw, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { TaskItem, PomodoroSession } from '@/types/dump';

const WORK_DURATION = 25 * 60; // 25 minutes
const SHORT_BREAK = 5 * 60; // 5 minutes
const LONG_BREAK = 15 * 60; // 15 minutes
const SESSIONS_UNTIL_LONG_BREAK = 4;

interface PomodoroTimerProps {
  task?: TaskItem;
  onComplete?: (session: PomodoroSession) => void;
  onClose?: () => void;
}

export default function PomodoroTimer({ task, onComplete, onClose }: PomodoroTimerProps) {
  const [sessionType, setSessionType] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [currentSession, setCurrentSession] = useState<Partial<PomodoroSession> | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const getDuration = () => {
    switch (sessionType) {
      case 'work':
        return WORK_DURATION;
      case 'shortBreak':
        return SHORT_BREAK;
      case 'longBreak':
        return LONG_BREAK;
    }
  };

  useEffect(() => {
    setTimeLeft(getDuration());
  }, [sessionType]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const playSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/sounds/timer-complete.mp3'),
        { shouldPlay: true }
      );
      soundRef.current = sound;
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  };

  const handleSessionComplete = async () => {
    setIsRunning(false);

    // Haptic feedback
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Play completion sound
    await playSound();

    // Create session record
    const session: PomodoroSession = {
      id: `pomodoro-${Date.now()}`,
      taskId: task?.id,
      startedAt: currentSession?.startedAt || new Date().toISOString(),
      endedAt: new Date().toISOString(),
      duration: getDuration(),
      type: sessionType,
      completed: true,
      interrupted: false,
    };

    onComplete?.(session);

    // Move to next session type
    if (sessionType === 'work') {
      const newSessionsCompleted = sessionsCompleted + 1;
      setSessionsCompleted(newSessionsCompleted);

      if (newSessionsCompleted % SESSIONS_UNTIL_LONG_BREAK === 0) {
        setSessionType('longBreak');
      } else {
        setSessionType('shortBreak');
      }
    } else {
      setSessionType('work');
    }
  };

  const handlePlayPause = async () => {
    if (!isRunning && timeLeft === getDuration()) {
      // Starting new session
      setCurrentSession({
        id: `pomodoro-${Date.now()}`,
        taskId: task?.id,
        startedAt: new Date().toISOString(),
        duration: getDuration(),
        type: sessionType,
        completed: false,
        interrupted: false,
      });
    }

    setIsRunning(!isRunning);

    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleReset = async () => {
    setIsRunning(false);
    setTimeLeft(getDuration());
    setCurrentSession(null);

    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    return ((getDuration() - timeLeft) / getDuration()) * 100;
  };

  const getColor = () => {
    switch (sessionType) {
      case 'work':
        return '#FF6B6B';
      case 'shortBreak':
        return '#4ECDC4';
      case 'longBreak':
        return '#95E1D3';
    }
  };

  return (
    <View style={styles.container}>
      {onClose && (
        <Pressable onPress={onClose} style={styles.closeButton}>
          <X size={24} color="#666" />
        </Pressable>
      )}

      {task && (
        <View style={styles.taskInfo}>
          <Text style={styles.taskLabel}>Working on:</Text>
          <Text style={styles.taskName} numberOfLines={2}>
            {task.task}
          </Text>
        </View>
      )}

      <View style={styles.sessionTypeContainer}>
        <Pressable
          onPress={() => setSessionType('work')}
          style={[styles.sessionTypeButton, sessionType === 'work' && styles.sessionTypeActive]}
        >
          <Text style={[styles.sessionTypeText, sessionType === 'work' && styles.sessionTypeTextActive]}>
            Work
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setSessionType('shortBreak')}
          style={[styles.sessionTypeButton, sessionType === 'shortBreak' && styles.sessionTypeActive]}
        >
          <Text style={[styles.sessionTypeText, sessionType === 'shortBreak' && styles.sessionTypeTextActive]}>
            Break
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setSessionType('longBreak')}
          style={[styles.sessionTypeButton, sessionType === 'longBreak' && styles.sessionTypeActive]}
        >
          <Text style={[styles.sessionTypeText, sessionType === 'longBreak' && styles.sessionTypeTextActive]}>
            Long Break
          </Text>
        </Pressable>
      </View>

      <View style={[styles.timerCircle, { borderColor: getColor() }]}>
        <View style={[styles.progressRing, { borderColor: getColor(), opacity: 0.3 }]} />
        <View
          style={[
            styles.progressRing,
            {
              borderColor: getColor(),
              transform: [{ rotate: `${(getProgress() * 360) / 100}deg` }],
            },
          ]}
        />
        <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
      </View>

      <View style={styles.controls}>
        <Pressable onPress={handleReset} style={styles.controlButton}>
          <RotateCcw size={28} color="#666" />
        </Pressable>

        <Pressable
          onPress={handlePlayPause}
          style={[styles.playButton, { backgroundColor: getColor() }]}
        >
          {isRunning ? (
            <Pause size={32} color="#fff" fill="#fff" />
          ) : (
            <Play size={32} color="#fff" fill="#fff" />
          )}
        </Pressable>

        <View style={styles.controlButton} />
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{sessionsCompleted}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {SESSIONS_UNTIL_LONG_BREAK - (sessionsCompleted % SESSIONS_UNTIL_LONG_BREAK)}
          </Text>
          <Text style={styles.statLabel}>Until Long Break</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 10,
    zIndex: 10,
  },
  taskInfo: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  taskLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 5,
  },
  taskName: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
  },
  sessionTypeContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 40,
  },
  sessionTypeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  sessionTypeActive: {
    backgroundColor: '#333',
  },
  sessionTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  sessionTypeTextActive: {
    color: '#fff',
  },
  timerCircle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 50,
    position: 'relative',
  },
  progressRing: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 8,
  },
  timerText: {
    fontSize: 64,
    fontWeight: '700',
    color: '#333',
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 30,
    marginBottom: 40,
  },
  controlButton: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  stats: {
    flexDirection: 'row',
    gap: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});
