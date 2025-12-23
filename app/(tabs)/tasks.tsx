import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Search, X, Filter, Edit2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useDumps } from '@/contexts/DumpContext';
import { DumpSession, TaskItem } from '@/types/dump';
import TaskEditModal from '@/components/TaskEditModal';
import DayScroller from '@/components/DayScroller';
import { useLocalSearchParams } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type FilterType = 'all' | 'pending' | 'completed';
type SortType = 'newest' | 'oldest' | 'category';

interface FlatTask {
  task: TaskItem;
  dumpId: string;
  categoryName: string;
  categoryEmoji: string;
  categoryColor: string;
  createdAt: string;
}

export default function TasksScreen() {
  const { dumps, toggleTask, updateTask, deleteTask } = useDumps();
  const params = useLocalSearchParams<{ animated?: string; date?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [editingTask, setEditingTask] = useState<{ task: TaskItem; dumpId: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (params.date) {
      return new Date(params.date);
    }
    return new Date();
  });
  const [showAllDates, setShowAllDates] = useState(!params.date);
  
  const cardAnimations = useRef<Animated.Value[]>([]);
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(-50)).current;
  const [hasAnimated, setHasAnimated] = useState(false);

  const allTasks = useMemo(() => {
    const tasks: FlatTask[] = [];
    
    dumps.forEach((dump: DumpSession) => {
      dump.categories.forEach((category) => {
        category.items.forEach((item) => {
          if (!item.isReflection) {
            tasks.push({
              task: item,
              dumpId: dump.id,
              categoryName: category.name,
              categoryEmoji: category.emoji,
              categoryColor: category.color,
              createdAt: dump.createdAt,
            });
          }
        });
      });
    });

    return tasks;
  }, [dumps]);

  const taskCountByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    allTasks.forEach((t) => {
      const dateKey = new Date(t.createdAt).toISOString().split('T')[0];
      counts[dateKey] = (counts[dateKey] || 0) + 1;
    });
    return counts;
  }, [allTasks]);

  const isSameDay = useCallback((date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }, []);

  const filteredTasks = useMemo(() => {
    let result = [...allTasks];

    if (!showAllDates) {
      result = result.filter((t) => isSameDay(new Date(t.createdAt), selectedDate));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((t) => t.task.task.toLowerCase().includes(query));
    }

    if (filter === 'pending') {
      result = result.filter((t) => !t.task.completed);
    } else if (filter === 'completed') {
      result = result.filter((t) => t.task.completed);
    }

    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === 'category') {
      result.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
    }

    if (cardAnimations.current.length !== result.length) {
      cardAnimations.current = result.map((_, i) => 
        cardAnimations.current[i] || new Animated.Value(0)
      );
    }

    return result;
  }, [allTasks, searchQuery, filter, sortBy, showAllDates, selectedDate, isSameDay]);

  const stats = useMemo(() => {
    const tasksForStats = showAllDates 
      ? allTasks 
      : allTasks.filter((t) => isSameDay(new Date(t.createdAt), selectedDate));
    const total = tasksForStats.length;
    const completed = tasksForStats.filter((t) => t.task.completed).length;
    const pending = total - completed;
    return { total, completed, pending };
  }, [allTasks, showAllDates, selectedDate, isSameDay]);

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    setShowAllDates(false);
  }, []);

  const handleShowAll = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAllDates(true);
  }, []);

  const handleToggleTask = useCallback((dumpId: string, taskId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleTask(dumpId, taskId);
  }, [toggleTask]);

  const handleEditTask = useCallback((task: TaskItem, dumpId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingTask({ task, dumpId });
  }, []);

  const handleSaveTask = useCallback((updatedTask: TaskItem) => {
    if (editingTask) {
      updateTask(editingTask.dumpId, editingTask.task.id, updatedTask);
      setEditingTask(null);
    }
  }, [editingTask, updateTask]);

  const handleDeleteTask = useCallback(() => {
    if (editingTask) {
      deleteTask(editingTask.dumpId, editingTask.task.id);
      setEditingTask(null);
    }
  }, [editingTask, deleteTask]);

  useEffect(() => {
    if (params.animated === 'true' && !hasAnimated && filteredTasks.length > 0) {
      setHasAnimated(true);
      
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          delay: 200,
          useNativeDriver: true,
        }),
        Animated.timing(headerAnim, {
          toValue: 0,
          duration: 500,
          delay: 100,
          useNativeDriver: true,
        }),
      ]).start();

      filteredTasks.forEach((_, index) => {
        Animated.sequence([
          Animated.delay(300 + index * 80),
          Animated.spring(cardAnimations.current[index], {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else if (!params.animated) {
      slideAnim.setValue(0);
      fadeAnim.setValue(1);
      headerAnim.setValue(0);
      cardAnimations.current.forEach(anim => anim.setValue(1));
    }
  }, [params.animated, filteredTasks, hasAnimated, slideAnim, fadeAnim, headerAnim]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View 
        style={[
          styles.pageWrapper,
          {
            transform: [{ translateX: slideAnim }],
            opacity: fadeAnim,
          }
        ]}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            style={[
              styles.header,
              {
                transform: [{ translateY: headerAnim }],
              }
            ]}
          >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>Tasks</Text>
              <Text style={styles.subtitle}>
                {stats.completed}/{stats.total} completed
              </Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => {
                  setShowFilters(!showFilters);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Filter size={20} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => {
                  setShowSearch(!showSearch);
                  if (showSearch) setSearchQuery('');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                {showSearch ? (
                  <X size={20} color={Colors.primary} />
                ) : (
                  <Search size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {showSearch && (
            <View style={styles.searchContainer}>
              <Search size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search tasks..."
                placeholderTextColor={Colors.textMuted}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {showFilters && (
            <View style={styles.filtersContainer}>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Status</Text>
                <View style={styles.filterButtons}>
                  {(['all', 'pending', 'completed'] as FilterType[]).map((f) => (
                    <TouchableOpacity
                      key={f}
                      style={[styles.filterButton, filter === f && styles.filterButtonActive]}
                      onPress={() => {
                        setFilter(f);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text style={[styles.filterButtonText, filter === f && styles.filterButtonTextActive]}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Sort by</Text>
                <View style={styles.filterButtons}>
                  {(['newest', 'oldest', 'category'] as SortType[]).map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.filterButton, sortBy === s && styles.filterButtonActive]}
                      onPress={() => {
                        setSortBy(s);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text style={[styles.filterButtonText, sortBy === s && styles.filterButtonTextActive]}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}
          </Animated.View>

        <DayScroller
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          taskCountByDate={taskCountByDate}
        />

        {!showAllDates && (
          <TouchableOpacity style={styles.showAllButton} onPress={handleShowAll}>
            <Text style={styles.showAllText}>Show all dates</Text>
            <X size={16} color={Colors.primary} />
          </TouchableOpacity>
        )}

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: Colors.accent3Dark }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: Colors.accent2Dark }]}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Done</Text>
          </View>
        </View>

        {filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No matching tasks' : stats.total === 0 ? 'No tasks yet' : 'All done!'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Try a different search term'
                : stats.total === 0
                ? 'Create a brain dump to get started'
                : 'You\'ve completed all your tasks'}
            </Text>
          </View>
        ) : (
          <View style={styles.taskList}>
            {filteredTasks.map((item, index) => {
              const animValue = cardAnimations.current[index] || new Animated.Value(1);
              const scale = animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              });
              const translateY = animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [-100, 0],
              });
              const opacity = animValue.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 0.5, 1],
              });
              const rotate = animValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['-10deg', '0deg'],
              });

              return (
              <Animated.View 
                key={item.task.id} 
                style={[
                  styles.taskCard,
                  {
                    transform: [
                      { scale },
                      { translateY },
                      { rotate },
                    ],
                    opacity,
                  }
                ]}
              >
                <TouchableOpacity
                  style={styles.taskRow}
                  onPress={() => handleToggleTask(item.dumpId, item.task.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.checkbox,
                      { borderColor: item.categoryColor },
                      item.task.completed && { backgroundColor: item.categoryColor },
                    ]}
                  >
                    {item.task.completed && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                  <View style={styles.taskContent}>
                    <Text
                      style={[
                        styles.taskText,
                        item.task.completed && styles.taskTextCompleted,
                      ]}
                    >
                      {item.task.task}
                    </Text>
                    <View style={styles.taskMeta}>
                      <View style={[styles.categoryBadge, { backgroundColor: item.categoryColor + '20' }]}>
                        <Text style={styles.categoryBadgeText}>
                          {item.categoryEmoji} {item.categoryName}
                        </Text>
                      </View>
                      {item.task.timeEstimate && (
                        <Text style={styles.timeEstimate}>{item.task.timeEstimate}</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEditTask(item.task, item.dumpId)}
                >
                  <Edit2 size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              </Animated.View>
            )})}
          </View>
        )}
        </ScrollView>
      </Animated.View>

      {editingTask && (
        <TaskEditModal
          visible={true}
          task={editingTask.task}
          categoryColor={allTasks.find(t => t.task.id === editingTask.task.id)?.categoryColor || Colors.primary}
          onClose={() => setEditingTask(null)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  pageWrapper: {
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
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 3,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  title: {
    fontSize: 36,
    fontWeight: '900' as const,
    color: Colors.text,
    letterSpacing: -1,
    textTransform: 'uppercase' as const,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '600' as const,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 3,
    borderColor: Colors.border,
    gap: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    padding: 0,
  },
  filtersContainer: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 3,
    borderColor: Colors.border,
    gap: 16,
  },
  filterGroup: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  filterButtonTextActive: {
    color: Colors.background,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.accent1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 2,
    backgroundColor: Colors.border,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  taskList: {
    gap: 12,
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
    gap: 10,
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
    flexShrink: 1,
  },
  timeEstimate: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  editButton: {
    padding: 14,
    borderLeftWidth: 2,
    borderLeftColor: Colors.borderLight,
  },
  showAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginBottom: 16,
  },
  showAllText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
