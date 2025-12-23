import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
} from 'react-native';
import { Check, Clock, Calendar, Edit2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

const SWIPE_THRESHOLD = 80;
const ACTION_WIDTH = 70;

interface SwipeableTaskProps {
  task: {
    id: string;
    task: string;
    completed: boolean;
    scheduledTime?: string;
    duration?: string;
    context?: string;
    energyLevel?: 'high' | 'medium' | 'low';
  };
  categoryColor: string;
  categoryEmoji: string;
  categoryName: string;
  onComplete: () => void;
  onPostpone: () => void;
  onReschedule: () => void;
  onEdit: () => void;
}

export default function SwipeableTask({
  task,
  categoryColor,
  categoryEmoji,
  categoryName,
  onComplete,
  onPostpone,
  onReschedule,
  onEdit,
}: SwipeableTaskProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const resetPosition = useCallback(() => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
    setSwipeDirection(null);
  }, [translateX]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5;
      },
      onPanResponderGrant: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (_, gestureState) => {
        const dx = gestureState.dx;
        
        if (dx > 0) {
          setSwipeDirection('right');
          translateX.setValue(Math.min(dx, ACTION_WIDTH * 2));
        } else {
          setSwipeDirection('left');
          translateX.setValue(Math.max(dx, -ACTION_WIDTH * 2));
        }
        
        if (Math.abs(dx) > SWIPE_THRESHOLD) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const dx = gestureState.dx;
        const absDx = Math.abs(dx);

        if (absDx > SWIPE_THRESHOLD) {
          if (dx > 0) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            onComplete();
            resetPosition();
          } else {
            Animated.timing(translateX, {
              toValue: -ACTION_WIDTH * 2,
              duration: 200,
              useNativeDriver: true,
            }).start();
          }
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const handlePostpone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPostpone();
    resetPosition();
  };

  const handleReschedule = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onReschedule();
    resetPosition();
  };

  const completeOpacity = translateX.interpolate({
    inputRange: [0, ACTION_WIDTH * 2],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const actionsOpacity = translateX.interpolate({
    inputRange: [-ACTION_WIDTH * 2, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <View style={styles.actionsContainer}>
        <Animated.View style={[styles.completeAction, { opacity: completeOpacity }]}>
          <Check size={24} color="#FFFFFF" strokeWidth={3} />
          <Text style={styles.actionText}>Complete</Text>
        </Animated.View>

        <Animated.View style={[styles.rightActionsRow, { opacity: actionsOpacity }]}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors.accent3Dark }]}
            onPress={handlePostpone}
          >
            <Clock size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Later</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors.primary }]}
            onPress={handleReschedule}
          >
            <Calendar size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Reschedule</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.taskCard,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.taskRow}
          onPress={onComplete}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.checkbox,
              { borderColor: categoryColor },
              task.completed && { backgroundColor: categoryColor },
            ]}
          >
            {task.completed && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
          </View>
          <View style={styles.taskContent}>
            <Text
              style={[
                styles.taskText,
                task.completed && styles.taskTextCompleted,
              ]}
            >
              {task.task}
            </Text>
            <View style={styles.taskMeta}>
              <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
                <Text style={styles.categoryBadgeText}>
                  {categoryEmoji} {categoryName}
                </Text>
              </View>
              {task.scheduledTime && (
                <View style={[styles.timeBadge, { backgroundColor: categoryColor + '20' }]}>
                  <Clock size={12} color={categoryColor} />
                  <Text style={[styles.timeText, { color: categoryColor }]}>
                    {task.scheduledTime}
                  </Text>
                </View>
              )}
              {task.duration && (
                <View style={styles.timeBadge}>
                  <Text style={styles.durationText}>{task.duration}</Text>
                </View>
              )}
              {task.energyLevel && (
                <View
                  style={[
                    styles.energyBadge,
                    {
                      backgroundColor:
                        task.energyLevel === 'high'
                          ? '#FF6B6B20'
                          : task.energyLevel === 'medium'
                          ? '#FFA50020'
                          : '#4CAF5020',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.energyText,
                      {
                        color:
                          task.energyLevel === 'high'
                            ? '#FF6B6B'
                            : task.energyLevel === 'medium'
                            ? '#FFA500'
                            : '#4CAF50',
                      },
                    ]}
                  >
                    {task.energyLevel === 'high' ? '🔥' : task.energyLevel === 'medium' ? '⚡' : '🌱'}{' '}
                    {task.energyLevel}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.editButton} onPress={onEdit}>
          <Edit2 size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    position: 'relative',
  },
  actionsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  completeAction: {
    backgroundColor: Colors.accent2Dark,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  rightActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: ACTION_WIDTH,
    borderRadius: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600' as const,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  taskRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskContent: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  taskText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 22,
    flexShrink: 1,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  durationText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  energyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  energyText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  editButton: {
    padding: 14,
    borderLeftWidth: 2,
    borderLeftColor: Colors.borderLight,
  },
});
