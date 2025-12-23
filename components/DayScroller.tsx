import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

interface DayScrollerProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  taskCountByDate?: Record<string, number>;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_WIDTH = 56;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

export default function DayScroller({ selectedDate, onDateSelect, taskCountByDate = {} }: DayScrollerProps) {
  const scrollRef = useRef<ScrollView>(null);
  const today = React.useMemo(() => new Date(), []);
  
  const days = React.useMemo(() => {
    const result: Date[] = [];
    const baseDate = new Date();
    for (let i = -30; i <= 30; i++) {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() + i);
      result.push(date);
    }
    return result;
  }, []);

  const selectedIndex = React.useMemo(() => 
    days.findIndex(d => isSameDay(d, selectedDate)),
    [days, selectedDate]
  );

  useEffect(() => {
    if (scrollRef.current && selectedIndex >= 0) {
      const offset = (selectedIndex * DAY_WIDTH) - (SCREEN_WIDTH / 2) + (DAY_WIDTH / 2) + 10;
      setTimeout(() => {
        scrollRef.current?.scrollTo({ x: Math.max(0, offset), animated: false });
      }, 100);
    }
  }, [selectedIndex]);

  const handleDatePress = (date: Date) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDateSelect(date);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.monthLabel}>
        {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
      </Text>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={DAY_WIDTH}
        decelerationRate="fast"
      >
        {days.map((date, index) => {
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, today);
          const dateKey = formatDateKey(date);
          const taskCount = taskCountByDate[dateKey] || 0;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayItem,
                isSelected && styles.dayItemSelected,
                isToday && !isSelected && styles.dayItemToday,
              ]}
              onPress={() => handleDatePress(date)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dayName,
                isSelected && styles.dayNameSelected,
                isToday && !isSelected && styles.dayNameToday,
              ]}>
                {DAYS[date.getDay()]}
              </Text>
              <Text style={[
                styles.dayNumber,
                isSelected && styles.dayNumberSelected,
                isToday && !isSelected && styles.dayNumberToday,
              ]}>
                {date.getDate()}
              </Text>
              {taskCount > 0 && (
                <View style={[
                  styles.taskDot,
                  isSelected && styles.taskDotSelected,
                ]}>
                  <Text style={[
                    styles.taskDotText,
                    isSelected && styles.taskDotTextSelected,
                  ]}>
                    {taskCount > 9 ? '9+' : taskCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: 10,
  },
  dayItem: {
    width: DAY_WIDTH - 8,
    marginHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  dayItemSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.border,
  },
  dayItemToday: {
    backgroundColor: Colors.accent1,
    borderColor: Colors.accent1Dark,
  },
  dayName: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  dayNameSelected: {
    color: Colors.background,
  },
  dayNameToday: {
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
  taskDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.accent2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  taskDotSelected: {
    backgroundColor: Colors.background,
  },
  taskDotText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.background,
  },
  taskDotTextSelected: {
    color: Colors.primary,
  },
});
