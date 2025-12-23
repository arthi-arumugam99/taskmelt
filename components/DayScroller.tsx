import React, { useRef, useEffect, useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ListRenderItem, LayoutChangeEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

interface DayScrollerProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_WIDTH = 56;

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function DayItemComponent({ 
  date, 
  isSelected, 
  isToday, 
  onPress 
}: { 
  date: Date; 
  isSelected: boolean; 
  isToday: boolean; 
  onPress: () => void;
}) {
  return (
  <TouchableOpacity
    style={[
      styles.dayItem,
      isSelected && styles.dayItemSelected,
      isToday && !isSelected && styles.dayItemToday,
    ]}
    onPress={onPress}
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
  </TouchableOpacity>
  );
}

const DayItem = React.memo(DayItemComponent);

export default function DayScroller({ selectedDate, onDateSelect }: DayScrollerProps) {
  const listRef = useRef<FlatList<Date>>(null);
  const today = React.useMemo(() => new Date(), []);
  const hasScrolled = useRef(false);
  const [containerWidth, setContainerWidth] = useState(0);

  const horizontalPadding = containerWidth > 0 ? (containerWidth - DAY_WIDTH) / 2 : 0;
  
  const days = React.useMemo(() => {
    const result: Date[] = [];
    const baseDate = new Date();
    for (let i = -30; i <= 30; i++) {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() + i);
      date.setHours(0, 0, 0, 0);
      result.push(date);
    }
    return result;
  }, []);

  const todayIndex = React.useMemo(() => 
    days.findIndex(d => isSameDay(d, today)),
    [days, today]
  );

  useEffect(() => {
    if (listRef.current && todayIndex >= 0 && containerWidth > 0 && !hasScrolled.current) {
      hasScrolled.current = true;
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({ 
          index: todayIndex, 
          animated: false, 
          viewPosition: 0.5 
        });
      });
    }
  }, [todayIndex, containerWidth]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  }, []);

  const handleDatePress = useCallback((date: Date) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDateSelect(date);
  }, [onDateSelect]);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: DAY_WIDTH,
    offset: DAY_WIDTH * index,
    index,
  }), []);

  const keyExtractor = useCallback((_: Date, index: number) => index.toString(), []);

  const renderItem: ListRenderItem<Date> = useCallback(({ item: date }) => {
    const isSelected = isSameDay(date, selectedDate);
    const isToday = isSameDay(date, today);
    return (
      <DayItem
        date={date}
        isSelected={isSelected}
        isToday={isToday}
        onPress={() => handleDatePress(date)}
      />
    );
  }, [selectedDate, today, handleDatePress]);

  const onScrollToIndexFailed = useCallback(() => {
    setTimeout(() => {
      if (todayIndex >= 0) {
        listRef.current?.scrollToIndex({ index: todayIndex, animated: false, viewPosition: 0.5 });
      }
    }, 100);
  }, [todayIndex]);

  const contentContainerStyle = React.useMemo(() => ({
    paddingHorizontal: horizontalPadding,
  }), [horizontalPadding]);

  return (
    <View style={styles.container}>
      <Text style={styles.monthLabel}>
        {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
      </Text>
      <FlatList
        ref={listRef}
        data={days}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={contentContainerStyle}
        getItemLayout={getItemLayout}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={11}
        removeClippedSubviews={true}
        onScrollToIndexFailed={onScrollToIndexFailed}
        onLayout={handleLayout}
      />
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

  dayItem: {
    width: DAY_WIDTH - 8,
    marginHorizontal: 4,
    marginVertical: 2,
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
