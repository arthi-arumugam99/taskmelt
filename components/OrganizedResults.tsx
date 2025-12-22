import React, { useRef, useCallback } from 'react';
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

interface TaskItemRowProps {
  item: TaskItem;
  accentColor: string;
  onToggle: (taskId: string) => void;
}

function TaskItemRow({ item, accentColor, onToggle }: TaskItemRowProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

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

    onToggle(item.id);
  }, [item.id, onToggle, scaleAnim]);

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
});
