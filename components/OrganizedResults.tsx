import React, { useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Check } from 'lucide-react-native';
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
}

function TaskItemRow({ item, accentColor, onToggle }: TaskItemRowProps) {
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

    newConfetti.forEach((particle, index) => {
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

  return (
    <Animated.View style={[styles.taskRow, { transform: [{ scale: scaleAnim }] }]}>
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
  );
}

interface CategoryCardProps {
  category: Category;
  onToggleTask: (taskId: string) => void;
}

function CategoryCard({ category, onToggleTask }: CategoryCardProps) {
  const bgColor = hexToRGBA(category.color, 0.12);
  const accentColor = category.color;
  const completedCount = category.items.filter((i) => i.completed).length;
  const totalCount = category.items.length;

  if (totalCount === 0) return null;

  return (
    <View style={[styles.categoryCard, { backgroundColor: bgColor }]}>
      <View style={styles.categoryHeader}>
        <View style={styles.categoryTitleRow}>
          <Text style={styles.categoryEmoji}>{category.emoji}</Text>
          <Text style={styles.categoryName}>{category.name}</Text>
        </View>
        <Text style={[styles.categoryCount, { color: accentColor }]}>
          {completedCount}/{totalCount}
        </Text>
      </View>
      <View style={styles.taskList}>
        {category.items.map((item) => (
          <TaskItemRow
            key={item.id}
            item={item}
            accentColor={accentColor}
            onToggle={onToggleTask}
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
}

export default function OrganizedResults({
  categories,
  summary,
  onToggleTask,
}: OrganizedResultsProps) {
  const nonEmptyCategories = categories.filter((c) => c.items.length > 0);

  if (nonEmptyCategories.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {summary && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>{summary}</Text>
        </View>
      )}
      {nonEmptyCategories.map((category, index) => (
        <CategoryCard
          key={`${category.name}-${index}`}
          category={category}
          onToggleTask={onToggleTask}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  summaryContainer: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  categoryCard: {
    borderRadius: 20,
    padding: 16,
    gap: 12,
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
  },
  categoryEmoji: {
    fontSize: 18,
  },
  categoryName: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  categoryCount: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  taskList: {
    gap: 8,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 12,
    padding: 12,
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
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  timeEstimate: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  confettiParticle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    left: 12,
    top: 12,
  },
});
