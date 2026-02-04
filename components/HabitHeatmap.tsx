import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface HabitLog {
  date: string; // YYYY-MM-DD
  habitId: string;
  completed: boolean;
}

interface HabitHeatmapProps {
  logs: HabitLog[];
  habitId?: string; // if provided, filter to single habit
  weeks?: number; // number of weeks to show (default 12)
  showLabels?: boolean;
}

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getIntensityColor(count: number, maxCount: number): string {
  if (count === 0) return '#F5F0E6';
  const ratio = count / Math.max(maxCount, 1);
  if (ratio < 0.25) return '#C6E48B';
  if (ratio < 0.5) return '#7BC96F';
  if (ratio < 0.75) return '#449A3D';
  return '#196127';
}

function generateDateGrid(weeks: number): Date[][] {
  const grid: Date[][] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the start of the current week (Sunday)
  const currentDayOfWeek = today.getDay();
  const endDate = new Date(today);

  // Go back to fill the grid
  const totalDays = weeks * 7;
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - totalDays + 1 + (6 - currentDayOfWeek));

  for (let week = 0; week < weeks; week++) {
    const weekDates: Date[] = [];
    for (let day = 0; day < 7; day++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + week * 7 + day);
      weekDates.push(date);
    }
    grid.push(weekDates);
  }

  return grid;
}

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

export default function HabitHeatmap({
  logs,
  habitId,
  weeks = 12,
  showLabels = true,
}: HabitHeatmapProps) {
  const { dateGrid, countMap, maxCount, monthLabels } = useMemo(() => {
    // Filter logs if habitId provided
    const filteredLogs = habitId
      ? logs.filter((l) => l.habitId === habitId && l.completed)
      : logs.filter((l) => l.completed);

    // Count completions per day
    const countMap = new Map<string, number>();
    filteredLogs.forEach((log) => {
      const key = log.date;
      countMap.set(key, (countMap.get(key) || 0) + 1);
    });

    // Find max for intensity scaling
    let maxCount = 0;
    countMap.forEach((count) => {
      if (count > maxCount) maxCount = count;
    });

    // Generate date grid
    const dateGrid = generateDateGrid(weeks);

    // Generate month labels
    const monthLabels: Array<{ month: string; weekIndex: number }> = [];
    let lastMonth = -1;
    dateGrid.forEach((week, weekIndex) => {
      const firstDayOfWeek = week[0];
      const month = firstDayOfWeek.getMonth();
      if (month !== lastMonth) {
        monthLabels.push({ month: MONTHS[month], weekIndex });
        lastMonth = month;
      }
    });

    return { dateGrid, countMap, maxCount, monthLabels };
  }, [logs, habitId, weeks]);

  const totalCompletions = useMemo(() => {
    let total = 0;
    countMap.forEach((count) => {
      total += count;
    });
    return total;
  }, [countMap]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <View style={styles.container}>
      {/* Month labels */}
      {showLabels && (
        <View style={styles.monthLabelsContainer}>
          <View style={styles.dayLabelsSpace} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.monthLabels}>
              {monthLabels.map(({ month, weekIndex }, index) => (
                <Text
                  key={`${month}-${index}`}
                  style={[
                    styles.monthLabel,
                    { left: weekIndex * 14 },
                  ]}
                >
                  {month}
                </Text>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      <View style={styles.gridContainer}>
        {/* Day labels */}
        {showLabels && (
          <View style={styles.dayLabels}>
            {DAYS.map((day, index) => (
              <Text
                key={`day-${index}`}
                style={[
                  styles.dayLabel,
                  index % 2 === 1 && styles.visibleDayLabel,
                ]}
              >
                {index % 2 === 1 ? day : ''}
              </Text>
            ))}
          </View>
        )}

        {/* Heatmap grid */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.grid}>
            {dateGrid.map((week, weekIndex) => (
              <View key={`week-${weekIndex}`} style={styles.weekColumn}>
                {week.map((date, dayIndex) => {
                  const dateKey = formatDateKey(date);
                  const count = countMap.get(dateKey) || 0;
                  const isFuture = date > today;

                  return (
                    <View
                      key={`${weekIndex}-${dayIndex}`}
                      style={[
                        styles.cell,
                        {
                          backgroundColor: isFuture
                            ? '#F0EBE3'
                            : getIntensityColor(count, maxCount),
                        },
                        isFuture && styles.futureCell,
                      ]}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        <Text style={styles.totalText}>{totalCompletions} completions</Text>
        <View style={styles.legend}>
          <Text style={styles.legendLabel}>Less</Text>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <View
              key={`legend-${index}`}
              style={[
                styles.legendCell,
                { backgroundColor: getIntensityColor(ratio * 4, 4) },
              ]}
            />
          ))}
          <Text style={styles.legendLabel}>More</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFFDF9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E1D5',
  },
  monthLabelsContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayLabelsSpace: {
    width: 24,
  },
  monthLabels: {
    height: 16,
    position: 'relative',
    width: 12 * 14 + 100, // weeks * cell size + padding
  },
  monthLabel: {
    position: 'absolute',
    fontSize: 10,
    color: '#6B5C4C',
    fontWeight: '500',
  },
  gridContainer: {
    flexDirection: 'row',
  },
  dayLabels: {
    width: 20,
    marginRight: 4,
  },
  dayLabel: {
    height: 12,
    fontSize: 9,
    color: 'transparent',
    textAlign: 'right',
    paddingRight: 4,
  },
  visibleDayLabel: {
    color: '#6B5C4C',
  },
  grid: {
    flexDirection: 'row',
    gap: 2,
  },
  weekColumn: {
    flexDirection: 'column',
    gap: 2,
  },
  cell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  futureCell: {
    opacity: 0.3,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E1D5',
  },
  totalText: {
    fontSize: 12,
    color: '#6B5C4C',
    fontWeight: '500',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendLabel: {
    fontSize: 10,
    color: '#8B7B6B',
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
});
