import React, { useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Pressable,
} from 'react-native';
import { Check, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { Category, TaskItem } from '@/types/dump';

function hexToRGBA(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface Confetti {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: Animated.Value;
  translateY: Animated.Value;
  translateX: Animated.Value;
  opacity: Animated.Value;
}

interface TaskItemRowProps {
  item: TaskItem;
  accentColor: string;
  onToggle: (taskId: string) => void;
  onToggleExpanded?: (taskId: string) => void;
  onLongPress?: (task: TaskItem, categoryColor: string) => void;
  depth?: number;
  isHighlighted?: boolean;
}

function TaskItemRow({ item, accentColor, onToggle, onToggleExpanded, onLongPress, depth = 0, isHighlighted = false }: TaskItemRowProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [confetti, setConfetti] = useState<Confetti[]>([]);

  const createCelebration = useCallback(() => {
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    const newConfetti: Confetti[] = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 60 - 30,
      y: 0,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: new Animated.Value(0),
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }));

    setConfetti(newConfetti);

    newConfetti.forEach((particle) => {
      Animated.parallel([
        Animated.timing(particle.translateY, {
          toValue: -100 - Math.random() * 50,
          duration: 800 + Math.random() * 400,
          useNativeDriver: true,
        }),
        Animated.timing(particle.translateX, {
          toValue: particle.x,
          duration: 800 + Math.random() * 400,
          useNativeDriver: true,
        }),
        Animated.timing(particle.rotation, {
          toValue: Math.random() * 720 - 360,
          duration: 800 + Math.random() * 400,
          useNativeDriver: true,
        }),
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: 800 + Math.random() * 400,
          useNativeDriver: true,
        }),
      ]).start();
    });

    setTimeout(() => setConfetti([]), 1200);
  }, []);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (!item.completed) {
      createCelebration();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    onToggle(item.id);
  }, [item.id, item.completed, onToggle, scaleAnim, createCelebration]);

  if (item.isReflection) {
    return (
      <View style={[styles.reflectionRow, { marginLeft: depth * 16 }]}>
        <Text style={styles.reflectionText}>{item.task}</Text>
      </View>
    );
  }

  return (
    <>
      <Pressable
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onLongPress?.(item, accentColor);
        }}
      >
        <Animated.View style={[
          styles.taskRow,
          { transform: [{ scale: scaleAnim }], marginLeft: depth * 16 },
          isHighlighted && styles.taskRowHighlighted,
        ]}>
          <View style={styles.taskRowContent}>
            <TouchableOpacity
              style={[
                styles.checkbox,
                { borderColor: accentColor },
                item.completed && { backgroundColor: accentColor },
              ]}
              onPress={handlePress}
              activeOpacity={0.7}
            >
              {item.completed && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
            </TouchableOpacity>
            <View style={styles.taskContent}>
              <Text
                style={[
                  styles.taskText,
                  item.completed && styles.taskTextCompleted,
                ]}
              >
                {item.task}
              </Text>
              {item.timeEstimate && (
                <Text style={styles.timeEstimate}>{item.timeEstimate}</Text>
              )}
              {item.notes && (
                <Text style={styles.taskNotes} numberOfLines={2}>{item.notes}</Text>
              )}
              {item.hasSubtaskSuggestion && !item.isExpanded && item.subtasks && item.subtasks.length > 0 && (
                <TouchableOpacity onPress={() => onToggleExpanded?.(item.id)} style={styles.subtaskHintButton}>
                  <ChevronRight size={12} color={Colors.primary} />
                  <Text style={styles.subtaskHint}>Tap to break down</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          {confetti.map((particle) => (
            <Animated.View
              key={particle.id}
              style={[
                styles.confettiParticle,
                {
                  backgroundColor: particle.color,
                  transform: [
                    { translateX: particle.translateX },
                    { translateY: particle.translateY },
                    { rotate: particle.rotation.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    }) },
                  ],
                  opacity: particle.opacity,
                },
              ]}
            />
          ))}
        </Animated.View>
      </Pressable>
      {item.isExpanded && item.subtasks && item.subtasks.map((subtask) => (
        <TaskItemRow
          key={subtask.id}
          item={subtask}
          accentColor={accentColor}
          onToggle={onToggle}
          onToggleExpanded={onToggleExpanded}
          onLongPress={onLongPress}
          depth={depth + 1}
        />
      ))}
    </>
  );
}

interface CategoryCardProps {
  category: Category;
  onToggleTask: (taskId: string) => void;
  onToggleExpanded: (taskId: string) => void;
  onLongPress?: (task: TaskItem, categoryColor: string) => void;
  highlightedTaskIds?: string[];
  hideHighlightedTasks?: boolean;
}

function CategoryCard({ category, onToggleTask, onToggleExpanded, onLongPress, highlightedTaskIds = [], hideHighlightedTasks = false }: CategoryCardProps) {
  const bgColor = hexToRGBA(category.color, 0.12);
  const accentColor = category.color;
  const isReflectionCategory = category.name.toLowerCase().includes('reflection') || category.name.toLowerCase().includes('notes');
  
  const visibleItems = hideHighlightedTasks 
    ? category.items.filter(item => !highlightedTaskIds.includes(item.id))
    : category.items;
  
  const sortedVisibleItems = [...visibleItems].sort((a, b) => {
    if (a.isReflection && !b.isReflection) return 1;
    if (!a.isReflection && b.isReflection) return -1;
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });
  const hiddenCount = category.items.length - sortedVisibleItems.length;
  
  const actionableVisibleItems = visibleItems.filter((i) => !i.isReflection);
  
  let completedCount = 0;
  let totalCount = 0;
  actionableVisibleItems.forEach((item) => {
    if (item.subtasks && item.subtasks.length > 0) {
      totalCount += item.subtasks.length;
      completedCount += item.subtasks.filter(st => st.completed).length;
    } else {
      totalCount += 1;
      if (item.completed) completedCount += 1;
    }
  });

  if (sortedVisibleItems.length === 0) return null;

  return (
    <View style={[styles.categoryCard, { backgroundColor: bgColor }]}>
      <View style={styles.categoryHeader}>
        <View style={styles.categoryTitleRow}>
          <Text style={styles.categoryEmoji}>{category.emoji}</Text>
          <Text style={styles.categoryName}>{category.name}</Text>
        </View>
        {!isReflectionCategory && totalCount > 0 && (
          <Text style={[styles.categoryCount, { color: accentColor }]}>
            {completedCount}/{totalCount}
          </Text>
        )}
      </View>
      {isReflectionCategory && (
        <Text style={styles.reflectionHint}>We heard you</Text>
      )}
      {hideHighlightedTasks && hiddenCount > 0 && (
        <Text style={styles.hiddenTasksHint}>
          {hiddenCount} featured task{hiddenCount > 1 ? 's' : ''} from above {hiddenCount > 1 ? 'are' : 'is'} in this category
        </Text>
      )}
      <View style={styles.taskList}>
        {sortedVisibleItems.map((item) => (
          <TaskItemRow
            key={item.id}
            item={item}
            accentColor={accentColor}
            onToggle={onToggleTask}
            onToggleExpanded={onToggleExpanded}
            onLongPress={onLongPress}
            isHighlighted={false}
          />
        ))}
      </View>
    </View>
  );
}

interface OrganizedResultsProps {
  categories: Category[];
  summary?: string;
  onToggleTask: (taskId: string) => void;
  onToggleExpanded: (taskId: string) => void;
  onLongPress?: (task: TaskItem, categoryColor: string) => void;
  highlightedTaskIds?: string[];
  hideHighlightedTasks?: boolean;
}

export default function OrganizedResults({
  categories,
  summary,
  onToggleTask,
  onToggleExpanded,
  onLongPress,
  highlightedTaskIds = [],
  hideHighlightedTasks = true,
}: OrganizedResultsProps) {
  const nonEmptyCategories = categories.filter((c) => c.items.length > 0);

  if (nonEmptyCategories.length === 0) {
    return null;
  }

  const sortedCategories = [...nonEmptyCategories].sort((a, b) => {
    const aActionableItems = a.items.filter(i => !i.isReflection);
    const bActionableItems = b.items.filter(i => !i.isReflection);
    
    let aCompletedCount = 0;
    let aTotalCount = 0;
    aActionableItems.forEach((item) => {
      if (item.subtasks && item.subtasks.length > 0) {
        aTotalCount += item.subtasks.length;
        aCompletedCount += item.subtasks.filter(st => st.completed).length;
      } else {
        aTotalCount += 1;
        if (item.completed) aCompletedCount += 1;
      }
    });
    
    let bCompletedCount = 0;
    let bTotalCount = 0;
    bActionableItems.forEach((item) => {
      if (item.subtasks && item.subtasks.length > 0) {
        bTotalCount += item.subtasks.length;
        bCompletedCount += item.subtasks.filter(st => st.completed).length;
      } else {
        bTotalCount += 1;
        if (item.completed) bCompletedCount += 1;
      }
    });
    
    const aAllComplete = aTotalCount > 0 && aCompletedCount === aTotalCount;
    const bAllComplete = bTotalCount > 0 && bCompletedCount === bTotalCount;
    
    if (aAllComplete !== bAllComplete) {
      return aAllComplete ? 1 : -1;
    }
    
    const aCompletionRate = aTotalCount > 0 ? aCompletedCount / aTotalCount : 0;
    const bCompletionRate = bTotalCount > 0 ? bCompletedCount / bTotalCount : 0;
    
    if (Math.abs(aCompletionRate - bCompletionRate) > 0.01) {
      return aCompletionRate - bCompletionRate;
    }
    
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const aPriority = a.priority || 'medium';
    const bPriority = b.priority || 'medium';
    return priorityOrder[aPriority] - priorityOrder[bPriority];
  });

  return (
    <View style={styles.container}>
      {sortedCategories.map((category, index) => (
        <CategoryCard
          key={`${category.name}-${index}`}
          category={category}
          onToggleTask={onToggleTask}
          onToggleExpanded={onToggleExpanded}
          onLongPress={onLongPress}
          highlightedTaskIds={highlightedTaskIds}
          hideHighlightedTasks={hideHighlightedTasks}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  categoryCard: {
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 3,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    flexShrink: 1,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
    flexShrink: 1,
  },
  categoryCount: {
    fontSize: 16,
    fontWeight: '800' as const,
  },
  taskList: {
    gap: 8,
  },
  taskRow: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  taskRowContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  taskContent: {
    flex: 1,
    gap: 4,
  },
  taskText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  timeEstimate: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '600' as const,
  },
  taskNotes: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic' as const,
    lineHeight: 18,
  },
  subtaskHintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  subtaskHint: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700' as const,
  },
  confettiParticle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    left: 12,
    top: 12,
  },
  reflectionRow: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    borderLeftWidth: 4,
    borderLeftColor: Colors.textMuted,
  },
  reflectionText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    fontStyle: 'italic' as const,
    fontWeight: '500' as const,
  },
  reflectionHint: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic' as const,
    marginBottom: 8,
    fontWeight: '600' as const,
  },
  hiddenTasksHint: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic' as const,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600' as const,
  },
  taskRowHighlighted: {
    borderWidth: 3,
    borderColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
});
