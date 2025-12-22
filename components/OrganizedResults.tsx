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
import { Category, TaskItem, CategoryType } from '@/types/dump';

const CATEGORY_COLORS: Record<CategoryType, { bg: string; accent: string }> = {
  doNow: { bg: Colors.categories.doNowBg, accent: Colors.categories.doNow },
  today: { bg: Colors.categories.todayBg, accent: Colors.categories.today },
  thisWeek: { bg: Colors.categories.thisWeekBg, accent: Colors.categories.thisWeek },
  someday: { bg: Colors.categories.somedayBg, accent: Colors.categories.someday },
  notActionable: { bg: Colors.categories.notActionableBg, accent: Colors.categories.notActionable },
};

interface TaskItemRowProps {
  item: TaskItem;
  categoryType: CategoryType;
  onToggle: (taskId: string) => void;
}

function TaskItemRow({ item, categoryType, onToggle }: TaskItemRowProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const colors = CATEGORY_COLORS[categoryType];

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
          { borderColor: colors.accent },
          item.completed && { backgroundColor: colors.accent },
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
  const colors = CATEGORY_COLORS[category.type];
  const completedCount = category.items.filter((i) => i.completed).length;
  const totalCount = category.items.length;

  if (totalCount === 0) return null;

  return (
    <View style={[styles.categoryCard, { backgroundColor: colors.bg }]}>
      <View style={styles.categoryHeader}>
        <View style={styles.categoryTitleRow}>
          <Text style={styles.categoryEmoji}>{category.emoji}</Text>
          <Text style={styles.categoryName}>{category.name}</Text>
        </View>
        <Text style={[styles.categoryCount, { color: colors.accent }]}>
          {completedCount}/{totalCount}
        </Text>
      </View>
      <View style={styles.taskList}>
        {category.items.map((item) => (
          <TaskItemRow
            key={item.id}
            item={item}
            categoryType={category.type}
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
      {nonEmptyCategories.map((category) => (
        <CategoryCard
          key={category.type}
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
