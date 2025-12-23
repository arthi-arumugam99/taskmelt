import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Check, TrendingUp, Calendar as CalendarIcon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useDumps } from '@/contexts/DumpContext';
import { DumpSession, TaskItem } from '@/types/dump';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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

interface DayStats {
  total: number;
  completed: number;
  dumps: DumpSession[];
}

export default function TrackerScreen() {
  const { dumps, toggleTask } = useDumps();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  const dayStatsMap = useMemo(() => {
    const map = new Map<string, DayStats>();
    
    dumps.forEach((dump: DumpSession) => {
      const dateStr = formatDateString(new Date(dump.createdAt));
      const existing = map.get(dateStr) || { total: 0, completed: 0, dumps: [] };
      
      let total = 0;
      let completed = 0;
      
      dump.categories.forEach((cat) => {
        cat.items.forEach((item) => {
          if (item.isReflection) return;
          if (item.subtasks && item.subtasks.length > 0) {
            total += item.subtasks.length;
            completed += item.subtasks.filter((st) => st.completed).length;
          } else {
            total += 1;
            if (item.completed) completed += 1;
          }
        });
      });
      
      map.set(dateStr, {
        total: existing.total + total,
        completed: existing.completed + completed,
        dumps: [...existing.dumps, dump],
      });
    });
    
    return map;
  }, [dumps]);

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

  const selectedDayStats = useMemo(() => {
    const dateStr = formatDateString(selectedDate);
    return dayStatsMap.get(dateStr);
  }, [selectedDate, dayStatsMap]);

  const selectedDayTasks = useMemo(() => {
    if (!selectedDayStats) return [];
    
    const tasks: { task: TaskItem; dumpId: string; categoryName: string; categoryColor: string; categoryEmoji: string }[] = [];
    
    selectedDayStats.dumps.forEach((dump) => {
      dump.categories.forEach((cat) => {
        cat.items.forEach((item) => {
          if (!item.isReflection) {
            tasks.push({
              task: item,
              dumpId: dump.id,
              categoryName: cat.name,
              categoryColor: cat.color,
              categoryEmoji: cat.emoji,
            });
          }
        });
      });
    });
    
    return tasks;
  }, [selectedDayStats]);

  const weeklyStats = useMemo(() => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    let total = 0;
    let completed = 0;
    let activeDays = 0;
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      const stats = dayStatsMap.get(formatDateString(day));
      if (stats) {
        total += stats.total;
        completed += stats.completed;
        if (stats.total > 0) activeDays++;
      }
    }
    
    return { total, completed, activeDays };
  }, [dayStatsMap]);

  const handlePrevMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDatePress = (date: Date) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDate(date);
  };

  const handleToggleTask = useCallback((dumpId: string, taskId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleTask(dumpId, taskId);
  }, [toggleTask]);

  const today = new Date();

  const getCompletionColor = (completed: number, total: number): string => {
    if (total === 0) return 'transparent';
    const rate = completed / total;
    if (rate >= 1) return Colors.accent2Dark;
    if (rate >= 0.5) return Colors.accent2;
    if (rate > 0) return Colors.accent5;
    return Colors.accent3;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Tracker</Text>
          <Text style={styles.subtitle}>Your productivity journey</Text>
        </View>

        <View style={styles.weeklyCard}>
          <View style={styles.weeklyHeader}>
            <TrendingUp size={20} color={Colors.primary} />
            <Text style={styles.weeklyTitle}>This Week</Text>
          </View>
          <View style={styles.weeklyStats}>
            <View style={styles.weeklyStat}>
              <Text style={styles.weeklyStatNumber}>{weeklyStats.completed}</Text>
              <Text style={styles.weeklyStatLabel}>Completed</Text>
            </View>
            <View style={styles.weeklyStatDivider} />
            <View style={styles.weeklyStat}>
              <Text style={styles.weeklyStatNumber}>{weeklyStats.total}</Text>
              <Text style={styles.weeklyStatLabel}>Total Tasks</Text>
            </View>
            <View style={styles.weeklyStatDivider} />
            <View style={styles.weeklyStat}>
              <Text style={styles.weeklyStatNumber}>{weeklyStats.activeDays}</Text>
              <Text style={styles.weeklyStatLabel}>Active Days</Text>
            </View>
          </View>
          {weeklyStats.total > 0 && (
            <View style={styles.weeklyProgress}>
              <View style={styles.progressBarBg}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${(weeklyStats.completed / weeklyStats.total) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.weeklyProgressText}>
                {Math.round((weeklyStats.completed / weeklyStats.total) * 100)}% complete
              </Text>
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
              const dateString = formatDateString(date);
              const dayStats = dayStatsMap.get(dateString);
              const hasActivity = dayStats && dayStats.total > 0;
              const completionColor = dayStats ? getCompletionColor(dayStats.completed, dayStats.total) : 'transparent';

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    hasActivity && { backgroundColor: completionColor },
                    isSelected && styles.selectedDay,
                    isToday && !isSelected && styles.todayDay,
                  ]}
                  onPress={() => handleDatePress(date)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      hasActivity && styles.dayTextWithActivity,
                      isSelected && styles.selectedDayText,
                      isToday && !isSelected && styles.todayDayText,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                  {dayStats && dayStats.completed === dayStats.total && dayStats.total > 0 && (
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
              <Text style={styles.legendText}>50%+</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.accent2Dark }]} />
              <Text style={styles.legendText}>Complete</Text>
            </View>
          </View>
        </View>

        <View style={styles.dayDetailCard}>
          <View style={styles.dayDetailHeader}>
            <CalendarIcon size={18} color={Colors.primary} />
            <Text style={styles.dayDetailTitle}>
              {isSameDay(selectedDate, today) 
                ? 'Today' 
                : selectedDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
            </Text>
          </View>

          {!selectedDayStats || selectedDayStats.total === 0 ? (
            <View style={styles.noActivity}>
              <Text style={styles.noActivityText}>No tasks on this day</Text>
              <Text style={styles.noActivitySubtext}>Create a brain dump to add tasks</Text>
            </View>
          ) : (
            <>
              <View style={styles.dayStats}>
                <Text style={styles.dayStatsText}>
                  {selectedDayStats.completed}/{selectedDayStats.total} tasks completed
                </Text>
                <View style={styles.dayProgressBar}>
                  <View 
                    style={[
                      styles.dayProgressFill, 
                      { width: `${(selectedDayStats.completed / selectedDayStats.total) * 100}%` }
                    ]} 
                  />
                </View>
              </View>

              <View style={styles.tasksList}>
                {selectedDayTasks.map((item) => (
                  <TouchableOpacity
                    key={item.task.id}
                    style={styles.taskItem}
                    onPress={() => handleToggleTask(item.dumpId, item.task.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.taskCheckbox,
                        { borderColor: item.categoryColor },
                        item.task.completed && { backgroundColor: item.categoryColor },
                      ]}
                    >
                      {item.task.completed && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
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
                      <Text style={styles.taskCategory}>
                        {item.categoryEmoji} {item.categoryName}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
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
  weeklyCard: {
    backgroundColor: Colors.accent2,
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
  weeklyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  weeklyTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  weeklyStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weeklyStat: {
    flex: 1,
    alignItems: 'center',
  },
  weeklyStatDivider: {
    width: 2,
    height: 40,
    backgroundColor: Colors.border,
  },
  weeklyStatNumber: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: Colors.text,
  },
  weeklyStatLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  weeklyProgress: {
    marginTop: 16,
    gap: 8,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: Colors.card,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.accent2Dark,
    borderRadius: 4,
  },
  weeklyProgressText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textAlign: 'center',
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
  dayDetailCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 3,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  dayDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dayDetailTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  noActivity: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noActivityText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  noActivitySubtext: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  dayStats: {
    marginBottom: 16,
  },
  dayStatsText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  dayProgressBar: {
    height: 8,
    backgroundColor: Colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  dayProgressFill: {
    height: '100%',
    backgroundColor: Colors.accent2Dark,
    borderRadius: 4,
  },
  tasksList: {
    gap: 10,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  taskCategory: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
