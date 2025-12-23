import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

interface WeekNavigationProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  taskCounts?: { [date: string]: number };
}

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function getWeekDates(date: Date): Date[] {
  const week: Date[] = [];
  const current = new Date(date);
  const day = current.getDay();
  const diff = current.getDate() - day;
  
  for (let i = 0; i < 7; i++) {
    const weekDate = new Date(current.getFullYear(), current.getMonth(), diff + i);
    week.push(weekDate);
  }
  
  return week;
}

export default function WeekNavigation({ selectedDate, onDateSelect, taskCounts = {} }: WeekNavigationProps) {
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const today = new Date();

  const handlePrevWeek = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    onDateSelect(newDate);
  };

  const handleNextWeek = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    onDateSelect(newDate);
  };

  const handleDatePress = (date: Date) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDateSelect(date);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePrevWeek} style={styles.navButton}>
        <ChevronLeft size={20} color={Colors.text} />
      </TouchableOpacity>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysContainer}
      >
        {weekDates.map((date, index) => {
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, today);
          const dateString = date.toISOString().split('T')[0];
          const taskCount = taskCounts[dateString] || 0;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayButton,
                isSelected && styles.dayButtonSelected,
                isToday && !isSelected && styles.dayButtonToday,
              ]}
              onPress={() => handleDatePress(date)}
            >
              <Text
                style={[
                  styles.dayLabel,
                  isSelected && styles.dayLabelSelected,
                  isToday && !isSelected && styles.dayLabelToday,
                ]}
              >
                {DAYS_SHORT[date.getDay()]}
              </Text>
              <Text
                style={[
                  styles.dayNumber,
                  isSelected && styles.dayNumberSelected,
                  isToday && !isSelected && styles.dayNumberToday,
                ]}
              >
                {date.getDate()}
              </Text>
              {taskCount > 0 && (
                <View style={[styles.badge, isSelected && styles.badgeSelected]}>
                  <Text style={[styles.badgeText, isSelected && styles.badgeTextSelected]}>
                    {taskCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity onPress={handleNextWeek} style={styles.navButton}>
        <ChevronRight size={20} color={Colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 12,
    borderWidth: 3,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    gap: 8,
  },
  navButton: {
    padding: 4,
  },
  daysContainer: {
    gap: 8,
    paddingHorizontal: 4,
  },
  dayButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: 56,
    position: 'relative',
  },
  dayButtonSelected: {
    backgroundColor: Colors.primary,
  },
  dayButtonToday: {
    backgroundColor: Colors.accent1,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  dayLabelSelected: {
    color: Colors.background,
  },
  dayLabelToday: {
    color: Colors.text,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  dayNumberSelected: {
    color: Colors.background,
  },
  dayNumberToday: {
    color: Colors.text,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeSelected: {
    backgroundColor: Colors.background,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: Colors.background,
  },
  badgeTextSelected: {
    color: Colors.primary,
  },
});
