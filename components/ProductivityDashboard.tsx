import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Clock, CheckCircle2, Flame, TrendingUp, Calendar } from 'lucide-react-native';
import { ProductivityStats, PomodoroSession } from '@/types/dump';

interface ProductivityDashboardProps {
  stats: ProductivityStats[];
  pomodoroSessions: PomodoroSession[];
}

export default function ProductivityDashboard({ stats, pomodoroSessions }: ProductivityDashboardProps) {
  const todayStats = stats[0];
  const weekStats = stats.slice(0, 7);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const weeklyTotalTime = weekStats.reduce((sum, day) => sum + day.totalTimeSpent, 0);
  const weeklyTasksCompleted = weekStats.reduce((sum, day) => sum + day.tasksCompleted, 0);
  const weeklyPomodoros = weekStats.reduce((sum, day) => sum + day.pomodorosCompleted, 0);

  const currentStreak = calculateStreak(stats);
  const longestStreak = calculateLongestStreak(stats);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Today's Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FF6B6B20' }]}>
              <Clock size={24} color="#FF6B6B" />
            </View>
            <Text style={styles.statValue}>{formatTime(todayStats?.totalTimeSpent || 0)}</Text>
            <Text style={styles.statLabel}>Focused Time</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#4ECDC420' }]}>
              <CheckCircle2 size={24} color="#4ECDC4" />
            </View>
            <Text style={styles.statValue}>{todayStats?.tasksCompleted || 0}</Text>
            <Text style={styles.statLabel}>Tasks Done</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FFEAA720' }]}>
              <Flame size={24} color="#FF9800" />
            </View>
            <Text style={styles.statValue}>{todayStats?.pomodorosCompleted || 0}</Text>
            <Text style={styles.statLabel}>Pomodoros</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#96CEB420' }]}>
              <TrendingUp size={24} color="#96CEB4" />
            </View>
            <Text style={styles.statValue}>{todayStats?.focusScore || 0}%</Text>
            <Text style={styles.statLabel}>Focus Score</Text>
          </View>
        </View>
      </View>

      {/* This Week */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.weeklyCard}>
          <View style={styles.weeklyRow}>
            <Text style={styles.weeklyLabel}>Total Focused Time</Text>
            <Text style={styles.weeklyValue}>{formatTime(weeklyTotalTime)}</Text>
          </View>
          <View style={styles.weeklyRow}>
            <Text style={styles.weeklyLabel}>Tasks Completed</Text>
            <Text style={styles.weeklyValue}>{weeklyTasksCompleted}</Text>
          </View>
          <View style={styles.weeklyRow}>
            <Text style={styles.weeklyLabel}>Pomodoros Completed</Text>
            <Text style={styles.weeklyValue}>{weeklyPomodoros}</Text>
          </View>
          <View style={styles.weeklyRow}>
            <Text style={styles.weeklyLabel}>Avg Focus Score</Text>
            <Text style={styles.weeklyValue}>
              {Math.round(weekStats.reduce((sum, d) => sum + d.focusScore, 0) / (weekStats.length || 1))}%
            </Text>
          </View>
        </View>
      </View>

      {/* Streaks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Streaks</Text>
        <View style={styles.streaksCard}>
          <View style={styles.streakItem}>
            <Flame size={32} color="#FF6B6B" />
            <Text style={styles.streakValue}>{currentStreak}</Text>
            <Text style={styles.streakLabel}>Current Streak</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.streakItem}>
            <Calendar size={32} color="#4ECDC4" />
            <Text style={styles.streakValue}>{longestStreak}</Text>
            <Text style={styles.streakLabel}>Longest Streak</Text>
          </View>
        </View>
      </View>

      {/* Daily Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Last 7 Days</Text>
        <View style={styles.chartContainer}>
          {weekStats.reverse().map((day, index) => {
            const maxTime = Math.max(...weekStats.map((d) => d.totalTimeSpent), 1);
            const height = (day.totalTimeSpent / maxTime) * 120;
            const date = new Date(day.date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

            return (
              <View key={day.date} style={styles.chartBar}>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { height: height || 4, backgroundColor: '#4ECDC4' }]} />
                </View>
                <Text style={styles.chartLabel}>{dayName}</Text>
                <Text style={styles.chartValue}>{formatTime(day.totalTimeSpent)}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Most Productive Hour */}
      {todayStats?.mostProductiveHour !== undefined && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insights</Text>
          <View style={styles.insightCard}>
            <Text style={styles.insightText}>
              🌟 Your most productive hour today was{' '}
              <Text style={styles.insightHighlight}>
                {formatHour(todayStats.mostProductiveHour)}
              </Text>
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function calculateStreak(stats: ProductivityStats[]): number {
  let streak = 0;
  for (const day of stats) {
    if (day.tasksCompleted > 0) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function calculateLongestStreak(stats: ProductivityStats[]): number {
  let longest = 0;
  let current = 0;
  for (const day of stats) {
    if (day.tasksCompleted > 0) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }
  return longest;
}

function formatHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:00 ${period}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  weeklyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  weeklyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  weeklyLabel: {
    fontSize: 14,
    color: '#666',
  },
  weeklyValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  streaksCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  streakItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 20,
  },
  streakValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
    marginTop: 10,
  },
  streakLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  chartContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    height: 120,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: '100%',
    borderRadius: 4,
  },
  chartLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
    marginBottom: 2,
  },
  chartValue: {
    fontSize: 9,
    color: '#999',
  },
  insightCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4ECDC4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  insightText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  insightHighlight: {
    fontWeight: '700',
    color: '#333',
  },
});
