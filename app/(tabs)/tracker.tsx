import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Check, Flame, Plus, X, Trash2, Target } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const HABIT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string;
  createdAt: string;
}

interface HabitLog {
  [date: string]: string[];
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function formatDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

const DEFAULT_HABITS: Habit[] = [
  { id: '1', name: 'Exercise', emoji: '💪', color: '#FF6B6B', createdAt: new Date().toISOString() },
  { id: '2', name: 'Read', emoji: '📚', color: '#4ECDC4', createdAt: new Date().toISOString() },
  { id: '3', name: 'Meditate', emoji: '🧘', color: '#45B7D1', createdAt: new Date().toISOString() },
  { id: '4', name: 'Hydrate', emoji: '💧', color: '#96CEB4', createdAt: new Date().toISOString() },
  { id: '5', name: 'Learn', emoji: '🧠', color: '#FFEAA7', createdAt: new Date().toISOString() },
];

export default function TrackerScreen() {
  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS);
  const [habitLogs, setHabitLogs] = useState<HabitLog>({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitEmoji, setNewHabitEmoji] = useState('✨');
  const [newHabitColor, setNewHabitColor] = useState(HABIT_COLORS[0]);
  const [streakAnimation] = useState(new Animated.Value(1));

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const save = async () => {
      try {
        await AsyncStorage.setItem('habits', JSON.stringify(habits));
        await AsyncStorage.setItem('habitLogs', JSON.stringify(habitLogs));
      } catch (error) {
        console.log('Error saving habit data:', error);
      }
    };
    save();
  }, [habits, habitLogs]);

  const loadData = async () => {
    try {
      const storedHabits = await AsyncStorage.getItem('habits');
      const storedLogs = await AsyncStorage.getItem('habitLogs');
      
      if (storedHabits) {
        try {
          const parsed = JSON.parse(storedHabits);
          if (Array.isArray(parsed)) {
            setHabits(parsed);
          } else {
            console.log('Invalid habits format, using defaults');
            await AsyncStorage.removeItem('habits');
          }
        } catch (parseError) {
          console.log('Error parsing habits, clearing corrupted data:', parseError);
          await AsyncStorage.removeItem('habits');
        }
      }
      
      if (storedLogs) {
        try {
          const parsed = JSON.parse(storedLogs);
          if (typeof parsed === 'object' && parsed !== null) {
            setHabitLogs(parsed);
          } else {
            console.log('Invalid habit logs format, resetting');
            await AsyncStorage.removeItem('habitLogs');
          }
        } catch (parseError) {
          console.log('Error parsing habit logs, clearing corrupted data:', parseError);
          await AsyncStorage.removeItem('habitLogs');
        }
      }
    } catch (error) {
      console.log('Error loading habit data:', error);
    }
  };


  const currentStreak = useMemo(() => {
    let streak = 0;
    const today = new Date();
    const checkDate = new Date(today);
    
    while (true) {
      const dateStr = formatDateString(checkDate);
      const completedHabits = habitLogs[dateStr] || [];
      
      if (completedHabits.length > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        if (isSameDay(checkDate, today)) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        break;
      }
    }
    
    return streak;
  }, [habitLogs]);

  const longestStreak = useMemo(() => {
    const sortedDates = Object.keys(habitLogs).sort();
    if (sortedDates.length === 0) return 0;
    
    let longest = 0;
    let current = 0;
    let prevDate: Date | null = null;
    
    for (const dateStr of sortedDates) {
      if (habitLogs[dateStr].length > 0) {
        const date = new Date(dateStr);
        if (prevDate) {
          const diffDays = Math.round((date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            current++;
          } else {
            current = 1;
          }
        } else {
          current = 1;
        }
        longest = Math.max(longest, current);
        prevDate = date;
      }
    }
    
    return longest;
  }, [habitLogs]);

  const todayProgress = useMemo(() => {
    const todayStr = formatDateString(selectedDate);
    const completed = habitLogs[todayStr]?.length || 0;
    return { completed, total: habits.length };
  }, [habitLogs, habits, selectedDate]);

  const isNoZeroDay = useMemo(() => {
    const todayStr = formatDateString(new Date());
    return (habitLogs[todayStr]?.length || 0) > 0;
  }, [habitLogs]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentMonth]);

  const handlePrevMonth = () => {
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentMonth(prevMonth);
  };

  const handleNextMonth = () => {
    const today = new Date();
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    if (nextMonth > today) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentMonth(nextMonth);
  };

  const handleDatePress = (date: Date) => {
    const today = new Date();
    if (!isSameDay(date, today)) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDate(date);
  };

  const toggleHabit = useCallback((habitId: string) => {
    const dateStr = formatDateString(selectedDate);
    const currentLogs = habitLogs[dateStr] || [];
    
    let newLogs: string[];
    if (currentLogs.includes(habitId)) {
      newLogs = currentLogs.filter(id => id !== habitId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      newLogs = [...currentLogs, habitId];
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Animated.sequence([
        Animated.timing(streakAnimation, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(streakAnimation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
    
    setHabitLogs(prev => ({
      ...prev,
      [dateStr]: newLogs,
    }));
  }, [selectedDate, habitLogs, streakAnimation]);

  const addHabit = useCallback(() => {
    if (!newHabitName.trim()) return;
    
    const newHabit: Habit = {
      id: generateId(),
      name: newHabitName.trim(),
      emoji: newHabitEmoji,
      color: newHabitColor,
      createdAt: new Date().toISOString(),
    };
    
    setHabits(prev => [...prev, newHabit]);
    setNewHabitName('');
    setNewHabitEmoji('✨');
    setNewHabitColor(HABIT_COLORS[0]);
    setShowAddModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [newHabitName, newHabitEmoji, newHabitColor]);

  const deleteHabit = useCallback((habitId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHabits(prev => prev.filter(h => h.id !== habitId));
    
    const newLogs = { ...habitLogs };
    Object.keys(newLogs).forEach(date => {
      newLogs[date] = newLogs[date].filter(id => id !== habitId);
    });
    setHabitLogs(newLogs);
  }, [habitLogs]);

  const today = new Date();
  const selectedDateStr = formatDateString(selectedDate);
  const completedToday = habitLogs[selectedDateStr] || [];

  const getCompletionLevel = (date: Date): number => {
    const dateStr = formatDateString(date);
    const completed = habitLogs[dateStr]?.length || 0;
    if (completed === 0) return 0;
    if (completed >= habits.length) return 3;
    if (completed >= habits.length / 2) return 2;
    return 1;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>No Zero Days</Text>
          <Text style={styles.subtitle}>Do at least one thing every day</Text>
        </View>

        <View style={styles.streakCard}>
          <Animated.View style={[styles.streakMain, { transform: [{ scale: streakAnimation }] }]}>
            <Flame size={32} color="#FF6B6B" fill="#FF6B6B" />
            <View style={styles.streakInfo}>
              <Text style={styles.streakNumber}>{currentStreak}</Text>
              <Text style={styles.streakLabel}>Day Streak</Text>
            </View>
          </Animated.View>
          
          <View style={styles.streakDivider} />
          
          <View style={styles.streakStats}>
            <View style={styles.streakStat}>
              <Text style={styles.streakStatNumber}>{longestStreak}</Text>
              <Text style={styles.streakStatLabel}>Best</Text>
            </View>
            <View style={styles.streakStat}>
              <Text style={styles.streakStatNumber}>{Object.keys(habitLogs).filter(d => habitLogs[d].length > 0).length}</Text>
              <Text style={styles.streakStatLabel}>Total Days</Text>
            </View>
          </View>
          
          {!isNoZeroDay && isSameDay(selectedDate, today) && (
            <View style={styles.noZeroWarning}>
              <Target size={16} color="#F59E0B" />
              <Text style={styles.noZeroWarningText}>Complete at least one habit today!</Text>
            </View>
          )}
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
              <ChevronLeft size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.monthYear}>
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
              <ChevronRight size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekDays}>
            {DAYS.map((day) => (
              <View key={day} style={styles.weekDayCell}>
                <Text style={styles.weekDayText}>{day}</Text>
              </View>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {calendarDays.map((date, index) => {
              if (!date) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }

              const isSelected = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, today);
              const completionLevel = getCompletionLevel(date);
              const isFuture = date > today;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    !isFuture && completionLevel > 0 && {
                      backgroundColor: completionLevel === 3 
                        ? Colors.accent2Dark 
                        : completionLevel === 2 
                          ? Colors.accent2 
                          : Colors.accent5,
                    },
                    isSelected && styles.selectedDay,
                    isToday && !isSelected && styles.todayDay,
                  ]}
                  onPress={() => handleDatePress(date)}
                  disabled={!isToday}
                >
                  <Text
                    style={[
                      styles.dayText,
                      completionLevel > 0 && styles.dayTextWithActivity,
                      isSelected && styles.selectedDayText,
                      isToday && !isSelected && styles.todayDayText,
                      isFuture && styles.futureDayText,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                  {completionLevel === 3 && !isSelected && (
                    <View style={styles.completedBadge}>
                      <Check size={8} color="#FFFFFF" strokeWidth={4} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.accent5 }]} />
              <Text style={styles.legendText}>Started</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.accent2 }]} />
              <Text style={styles.legendText}>Half</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.accent2Dark }]} />
              <Text style={styles.legendText}>All Done</Text>
            </View>
          </View>
        </View>

        <View style={styles.habitsSection}>
          <View style={styles.habitsSectionHeader}>
            <Text style={styles.habitsSectionTitle}>Today&apos;s Habits</Text>
            <Text style={styles.habitProgress}>
              {todayProgress.completed}/{todayProgress.total}
            </Text>
          </View>

          <View style={styles.habitsList}>
            {habits.map((habit) => {
              const isCompleted = completedToday.includes(habit.id);
              
              return (
                <TouchableOpacity
                  key={habit.id}
                  style={[
                    styles.habitItem,
                    isCompleted && styles.habitItemCompleted,
                  ]}
                  onPress={() => toggleHabit(habit.id)}
                  onLongPress={() => deleteHabit(habit.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.habitCheck, { borderColor: habit.color }, isCompleted && { backgroundColor: habit.color }]}>
                    {isCompleted && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                  <Text style={styles.habitEmoji}>{habit.emoji}</Text>
                  <Text style={[styles.habitName, isCompleted && styles.habitNameCompleted]}>
                    {habit.name}
                  </Text>
                  <TouchableOpacity 
                    style={styles.deleteHabitButton}
                    onPress={() => deleteHabit(habit.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Trash2 size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity 
            style={styles.addHabitButton}
            onPress={() => setShowAddModal(true)}
          >
            <Plus size={20} color={Colors.primary} />
            <Text style={styles.addHabitText}>Add New Habit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.motivationCard}>
          <Text style={styles.motivationEmoji}>💡</Text>
          <Text style={styles.motivationText}>
  {"No more zero days. Every day, do at least one thing towards your goals—no matter how small."}
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Habit</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.modalInput}
                value={newHabitName}
                onChangeText={setNewHabitName}
                placeholder="e.g., Morning Run"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.inputLabel}>Emoji</Text>
              <TextInput
                style={styles.modalInput}
                value={newHabitEmoji}
                onChangeText={setNewHabitEmoji}
                placeholder="✨"
                placeholderTextColor={Colors.textMuted}
                maxLength={2}
              />

              <Text style={styles.inputLabel}>Color</Text>
              <View style={styles.colorPicker}>
                {HABIT_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      newHabitColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setNewHabitColor(color)}
                  />
                ))}
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.modalButton, !newHabitName.trim() && styles.modalButtonDisabled]}
              onPress={addHabit}
              disabled={!newHabitName.trim()}
            >
              <Text style={styles.modalButtonText}>Add Habit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  streakCard: {
    backgroundColor: Colors.accent1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  streakMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  streakInfo: {
    flex: 1,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: '900' as const,
    color: Colors.text,
    lineHeight: 52,
  },
  streakLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
  },
  streakDivider: {
    height: 2,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  streakStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  streakStat: {
    alignItems: 'center',
  },
  streakStatNumber: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: Colors.text,
  },
  streakStatLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  noZeroWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  noZeroWarningText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#B45309',
  },
  calendarCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textMuted,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    position: 'relative',
  },
  selectedDay: {
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.border,
  },
  todayDay: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  dayTextWithActivity: {
    fontWeight: '800' as const,
  },
  selectedDayText: {
    color: Colors.background,
    fontWeight: '800' as const,
  },
  todayDayText: {
    color: Colors.primary,
    fontWeight: '800' as const,
  },
  futureDayText: {
    color: Colors.textMuted,
    opacity: 0.5,
  },
  completedBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.accent2Dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: Colors.borderLight,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  habitsSection: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  habitsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  habitsSectionTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  habitProgress: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.primary,
  },
  habitsList: {
    gap: 10,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  habitItemCompleted: {
    backgroundColor: Colors.accent2 + '30',
    borderColor: Colors.accent2Dark,
  },
  habitCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitEmoji: {
    fontSize: 20,
  },
  habitName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  habitNameCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  deleteHabitButton: {
    padding: 4,
  },
  addHabitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  addHabitText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  motivationCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#86EFAC',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  motivationEmoji: {
    fontSize: 24,
  },
  motivationText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#15803D',
    fontStyle: 'italic' as const,
    lineHeight: 22,
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
    gap: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: Colors.text,
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
