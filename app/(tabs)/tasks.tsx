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
  PanResponder,
  LayoutChangeEvent,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Search, X, Filter, Edit2, GripVertical, ChevronDown, ChevronRight, Clock, Plus, Eye, EyeOff, Calendar } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useDumps } from '@/contexts/DumpContext';
import { DumpSession, TaskItem } from '@/types/dump';
import TaskEditModal from '@/components/TaskEditModal';
import DayScroller from '@/components/DayScroller';
import CalendarSyncModal from '@/components/CalendarSyncModal';
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
  const { dumps, toggleTask, updateTask, deleteTask, clearAll, addDump } = useDumps();
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
  const [showAllDates, setShowAllDates] = useState(false);
  const [manualOrder, setManualOrder] = useState<string[]>([]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [cardLayouts, setCardLayouts] = useState<{ y: number; height: number }[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [hideCompleted, setHideCompleted] = useState(false);
  const [showCalendarSync, setShowCalendarSync] = useState(false);
  
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



  const isSameDay = useCallback((date1: Date | string, date2: Date | string): boolean => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }, []);

  const getTaskDate = useCallback((task: FlatTask): Date => {
    if (task.task.scheduledDate) {
      const scheduled = new Date(task.task.scheduledDate);
      if (!isNaN(scheduled.getTime())) {
        return scheduled;
      }
    }
    return new Date(task.createdAt);
  }, []);

  const filteredTasks = useMemo(() => {
    let result = [...allTasks];

    if (!showAllDates) {
      result = result.filter((t) => isSameDay(getTaskDate(t), selectedDate));
    }

    if (hideCompleted) {
      result = result.filter((t) => !t.task.completed);
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

    if (manualOrder.length > 0) {
      result.sort((a, b) => {
        const aIndex = manualOrder.indexOf(a.task.id);
        const bIndex = manualOrder.indexOf(b.task.id);
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
    } else {
      result.sort((a, b) => {
        const aScheduledTime = a.task.scheduledTime || '';
        const bScheduledTime = b.task.scheduledTime || '';
        const aPriority = a.task.priority || 'medium';
        const bPriority = b.task.priority || 'medium';
        
        const aHasScheduledTime = aScheduledTime.trim().length > 0;
        const bHasScheduledTime = bScheduledTime.trim().length > 0;
        
        if (aHasScheduledTime && !bHasScheduledTime) return -1;
        if (!aHasScheduledTime && bHasScheduledTime) return 1;
        
        if (aHasScheduledTime && bHasScheduledTime) {
          const aMatch = aScheduledTime.match(/(\d+):(\d+)/);
          const bMatch = bScheduledTime.match(/(\d+):(\d+)/);
          if (aMatch && bMatch) {
            const aMinutes = parseInt(aMatch[1]) * 60 + parseInt(aMatch[2]);
            const bMinutes = parseInt(bMatch[1]) * 60 + parseInt(bMatch[2]);
            if (aMinutes !== bMinutes) return aMinutes - bMinutes;
          }
        }
        
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const aPriorityValue = priorityOrder[aPriority as keyof typeof priorityOrder];
        const bPriorityValue = priorityOrder[bPriority as keyof typeof priorityOrder];
        if (aPriorityValue !== bPriorityValue) {
          return aPriorityValue - bPriorityValue;
        }
        
        const aCreated = new Date(a.createdAt).getTime();
        const bCreated = new Date(b.createdAt).getTime();
        return bCreated - aCreated;
      });
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
  }, [allTasks, searchQuery, filter, sortBy, showAllDates, selectedDate, isSameDay, getTaskDate, manualOrder, hideCompleted]);

  const stats = useMemo(() => {
    const tasksForStats = showAllDates 
      ? allTasks 
      : allTasks.filter((t) => isSameDay(getTaskDate(t), selectedDate));
    const total = tasksForStats.length;
    const completed = tasksForStats.filter((t) => t.task.completed).length;
    const pending = total - completed;
    return { total, completed, pending };
  }, [allTasks, showAllDates, selectedDate, isSameDay, getTaskDate]);

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

  const handleToggleExpand = useCallback((task: TaskItem, dumpId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updatedTask = { ...task, isExpanded: !task.isExpanded };
    updateTask(dumpId, task.id, updatedTask);
  }, [updateTask]);

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

  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    const newOrder = [...filteredTasks.map(t => t.task.id)];
    const [removed] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, removed);
    setManualOrder(newOrder);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [filteredTasks]);

  const handleCardLayout = useCallback((index: number, event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    setCardLayouts(prev => {
      const newLayouts = [...prev];
      newLayouts[index] = { y, height };
      return newLayouts;
    });
  }, []);

  const createPanResponder = useCallback((index: number) => {
    const pan = new Animated.ValueXY();
    
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        setDraggingIndex(index);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (_, gestureState) => {
        pan.setValue({ x: 0, y: gestureState.dy });
        
        const currentY = (cardLayouts[index]?.y || 0) + gestureState.dy;
        let targetIndex = index;
        
        for (let i = 0; i < cardLayouts.length; i++) {
          if (i === index) continue;
          const layout = cardLayouts[i];
          if (!layout) continue;
          
          if (currentY > layout.y && currentY < layout.y + layout.height) {
            targetIndex = i;
            break;
          }
        }
        
        if (targetIndex !== index) {
          handleReorder(index, targetIndex);
        }
      },
      onPanResponderRelease: () => {
        setDraggingIndex(null);
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
      },
    });
  }, [cardLayouts, handleReorder]);

  useEffect(() => {
    if (params.animated === 'true' && !hasAnimated) {
      setHasAnimated(true);
      
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(headerAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      cardAnimations.current.forEach((anim) => {
        anim.setValue(1);
      });
    } else if (!params.animated) {
      slideAnim.setValue(0);
      fadeAnim.setValue(1);
      headerAnim.setValue(0);
      cardAnimations.current.forEach(anim => anim.setValue(1));
    }
  }, [params.animated, hasAnimated, slideAnim, fadeAnim, headerAnim]);

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
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={draggingIndex === null}
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
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Tasks</Text>
              <Text style={styles.subtitle}>Smart AI organization</Text>
              {!showAllDates && (
                <TouchableOpacity onPress={handleShowAll} style={{ marginTop: 4 }}>
                  <Text style={{ fontSize: 12, color: Colors.primary, fontWeight: '600' }}>Filtered by date • Tap to show all</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => {
                  setShowCalendarSync(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Calendar size={18} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconButton, hideCompleted && styles.iconButtonActive]}
                onPress={() => {
                  setHideCompleted(!hideCompleted);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                {hideCompleted ? <EyeOff size={18} color={Colors.background} /> : <Eye size={18} color={Colors.primary} />}
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
                  <X size={18} color={Colors.primary} />
                ) : (
                  <Search size={18} color={Colors.primary} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => {
                  setShowFilters(!showFilters);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Filter size={18} color={Colors.primary} />
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
        />
        
        {!showAllDates && (
          <TouchableOpacity style={styles.showAllButton} onPress={handleShowAll}>
            <Text style={styles.showAllText}>Show all dates</Text>
            <X size={16} color={Colors.primary} />
          </TouchableOpacity>
        )}



        <View style={styles.dateActionsRow}>
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
          <TouchableOpacity
            style={styles.addTaskButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowAddTaskModal(true);
            }}
          >
            <Plus size={20} color={Colors.background} strokeWidth={3} />
          </TouchableOpacity>
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
              const panResponder = createPanResponder(index);

              return (
              <View 
                key={item.task.id}
                onLayout={(e) => handleCardLayout(index, e)}
                style={[
                  styles.taskCard,
                  draggingIndex === index && { opacity: 0.7, zIndex: 1000 },
                ]}
              >
                <View {...panResponder.panHandlers} style={styles.dragHandle}>
                  <GripVertical size={20} color={Colors.textMuted} />
                </View>
                <View style={styles.taskMainContent}>
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
                      <View style={styles.taskTextRow}>
                        <Text
                          style={[
                            styles.taskText,
                            item.task.completed && styles.taskTextCompleted,
                          ]}
                        >
                          {item.task.task}
                        </Text>
                        {item.task.priority === 'high' && (
                          <View style={styles.priorityIndicator}>
                            <Text style={styles.priorityText}>!</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.taskMeta}>
                        {item.task.scheduledTime && (
                          <View style={[styles.timeBadge, { backgroundColor: item.categoryColor + '20', borderWidth: 2, borderColor: item.categoryColor }]}>
                            <Clock size={12} color={item.categoryColor} />
                            <Text style={[styles.timeEstimate, { color: item.categoryColor, fontWeight: '700' as const }]}>
                              {item.task.scheduledTime}
                            </Text>
                          </View>
                        )}
                        {item.task.duration && (
                          <View style={[styles.timeBadge, { backgroundColor: Colors.card }]}>
                            <Clock size={12} color={Colors.textMuted} />
                            <Text style={styles.timeEstimate}>
                              {item.task.duration}
                            </Text>
                          </View>
                        )}
                        {item.task.energyLevel && (
                          <View style={[styles.energyBadge, { 
                            backgroundColor: item.task.energyLevel === 'high' ? '#FEE2E2' : 
                                           item.task.energyLevel === 'medium' ? '#FEF3C7' : '#DCFCE7'
                          }]}>
                            <Text style={styles.energyText}>
                              {item.task.energyLevel === 'high' ? '🔥' : 
                               item.task.energyLevel === 'medium' ? '⚡' : '🌱'}
                            </Text>
                          </View>
                        )}
                        {item.task.context && item.task.context !== 'anywhere' && (
                          <View style={[styles.contextBadge, { backgroundColor: Colors.accent5 }]}>
                            <Text style={styles.contextText}>
                              {item.task.context === 'work' ? '💼' : 
                               item.task.context === 'home' ? '🏠' : 
                               item.task.context === 'errands' ? '🛒' : 
                               item.task.context === 'computer' ? '💻' : 
                               item.task.context === 'phone' ? '📱' : '📍'}
                            </Text>
                          </View>
                        )}
                        <View style={[styles.categoryBadge, { backgroundColor: item.categoryColor + '20' }]}>
                          <Text style={styles.categoryBadgeText}>
                            {item.categoryEmoji} {item.categoryName}
                          </Text>
                        </View>
                        {item.task.subtasks && item.task.subtasks.length > 0 && (
                          <TouchableOpacity
                            onPress={() => handleToggleExpand(item.task, item.dumpId)}
                            style={[styles.subtaskCountBadge, { backgroundColor: item.categoryColor + '30' }]}
                          >
                            <Text style={[styles.subtaskCountText, { color: item.categoryColor }]}>
                              {item.task.subtasks.filter(st => st.completed).length}/{item.task.subtasks.length} subtasks
                            </Text>
                            {item.task.isExpanded ? (
                              <ChevronDown size={14} color={item.categoryColor} strokeWidth={3} />
                            ) : (
                              <ChevronRight size={14} color={item.categoryColor} strokeWidth={3} />
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                  {item.task.subtasks && item.task.subtasks.length > 0 && item.task.isExpanded && (
                    <View style={styles.subtasksList}>
                      {item.task.subtasks.map((subtask, subIndex) => (
                        <TouchableOpacity
                          key={subtask.id}
                          style={styles.subtaskItem}
                          onPress={() => handleToggleTask(item.dumpId, subtask.id)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.subtaskLine} />
                          <View
                            style={[
                              styles.subtaskCheckbox,
                              { borderColor: item.categoryColor },
                              subtask.completed && { backgroundColor: item.categoryColor },
                            ]}
                          >
                            {subtask.completed && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                          </View>
                          <View style={styles.subtaskContent}>
                            <Text
                              style={[
                                styles.subtaskText,
                                subtask.completed && styles.taskTextCompleted,
                              ]}
                            >
                              {subtask.task}
                            </Text>
                            {subtask.duration && (
                              <View style={styles.subtaskMeta}>
                                <Clock size={10} color={Colors.textMuted} />
                                <Text style={styles.subtaskDuration}>
                                  {subtask.duration}
                                </Text>
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEditTask(item.task, item.dumpId)}
                >
                  <Edit2 size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            );
            })}
          </View>
        )}

        {stats.total > 0 && (
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              clearAll();
            }}
          >
            <Text style={styles.clearAllText}>Clear All Tasks</Text>
          </TouchableOpacity>
        )}
        </ScrollView>
      </Animated.View>

      <Modal
        visible={showAddTaskModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddTaskModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Task</Text>
              <TouchableOpacity onPress={() => {
                setShowAddTaskModal(false);
                setNewTaskText('');
              }}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Task</Text>
              <TextInput
                style={styles.modalInput}
                value={newTaskText}
                onChangeText={setNewTaskText}
                placeholder="e.g., Buy groceries"
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
                autoFocus
              />
              <Text style={styles.dateLabel}>
                For: {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.modalButton, !newTaskText.trim() && styles.modalButtonDisabled]}
              onPress={() => {
                if (!newTaskText.trim()) return;
                
                const taskDate = new Date(selectedDate);
                taskDate.setHours(12, 0, 0, 0);
                
                const newDump: DumpSession = {
                  id: Date.now().toString(),
                  rawText: newTaskText.trim(),
                  createdAt: taskDate.toISOString(),
                  categories: [
                    {
                      name: 'Quick Add',
                      emoji: '⚡',
                      color: Colors.primary,
                      items: [
                        {
                          id: Date.now().toString() + '_task',
                          task: newTaskText.trim(),
                          completed: false,
                          isReflection: false,
                          scheduledDate: taskDate.toISOString(),
                        }
                      ]
                    }
                  ]
                };
                
                addDump(newDump);
                setNewTaskText('');
                setShowAddTaskModal(false);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }}
              disabled={!newTaskText.trim()}
            >
              <Text style={styles.modalButtonText}>Add Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

      <CalendarSyncModal
        visible={showCalendarSync}
        onClose={() => setShowCalendarSync(false)}
      />
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
  titleContainer: {
    flex: 1,
    paddingRight: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
    flexShrink: 0,
  },
  iconButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 3,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  iconButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
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
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.accent1,
    borderRadius: 20,
    padding: 20,
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
    alignItems: 'flex-start',
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
  taskMainContent: {
    flex: 1,
  },
  dragHandle: {
    padding: 14,
    paddingRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
  taskTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    borderWidth: 2,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '900' as const,
    color: '#EF4444',
  },
  energyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  energyText: {
    fontSize: 11,
  },
  contextBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  contextText: {
    fontSize: 11,
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
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timeEstimate: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  viewModeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.accent1,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
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
  clearAllButton: {
    backgroundColor: Colors.error,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 3,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    marginTop: 16,
  },
  clearAllText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.background,
    textAlign: 'center' as const,
  },
  subtasksList: {
    paddingLeft: 14,
    paddingRight: 14,
    paddingBottom: 8,
    gap: 8,
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 8,
  },
  subtaskLine: {
    width: 2,
    height: '100%',
    backgroundColor: Colors.borderLight,
    position: 'absolute',
    left: 19,
    top: 0,
  },
  subtaskCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtaskContent: {
    flex: 1,
    gap: 4,
  },
  subtaskText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  subtaskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subtaskDuration: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  subtaskCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  subtaskCountText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },

  compactCard: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    marginBottom: 6,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  compactCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  compactTime: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  compactEmoji: {
    fontSize: 14,
  },
  dateActionsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    marginBottom: 20,
  },
  addTaskButton: {
    width: 56,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  modalBody: {
    gap: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
  },
  modalInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 2,
    borderColor: Colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  modalButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 24,
    borderWidth: 3,
    borderColor: Colors.border,
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.background,
  },
});
