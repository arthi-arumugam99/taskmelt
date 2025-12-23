import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  Target,
  AlertCircle,
  Clock,
  BarChart3,
  Zap,
  Award,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useDumps } from '@/contexts/DumpContext';
import { analyzeWeeklyPatterns } from '@/lib/aiScheduler';
import { useQuery } from '@tanstack/react-query';

export default function InsightsScreen() {
  const { dumps } = useDumps();
  const [selectedTab, setSelectedTab] = useState<'weekly' | 'analytics'>('weekly');

  const insightsQuery = useQuery({
    queryKey: ['weeklyInsights', dumps],
    queryFn: () => analyzeWeeklyPatterns(dumps),
    enabled: dumps.length > 0,
    staleTime: 1000 * 60 * 10,
  });

  const insights = insightsQuery.data;

  const analyticsData = useMemo(() => {
    const now = Date.now();
    const last7Days = dumps.filter(d => {
      const dumpDate = new Date(d.createdAt).getTime();
      return (now - dumpDate) / (1000 * 60 * 60 * 24) <= 7;
    });

    const categoryTime: Record<string, number> = {};
    const completionByDay: Record<string, { completed: number; total: number }> = {};
    let totalEstimated = 0;
    let totalActual = 0;
    let taskCount = 0;

    last7Days.forEach(dump => {
      const dayKey = new Date(dump.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
      
      if (!completionByDay[dayKey]) {
        completionByDay[dayKey] = { completed: 0, total: 0 };
      }

      dump.categories.forEach(cat => {
        cat.items.forEach(item => {
          if (!item.isReflection) {
            completionByDay[dayKey].total++;
            if (item.completed) {
              completionByDay[dayKey].completed++;
            }

            const durationMatch = item.duration?.match(/(\d+)/);
            const minutes = durationMatch ? parseInt(durationMatch[1]) : 30;
            
            if (!categoryTime[cat.name]) {
              categoryTime[cat.name] = 0;
            }
            categoryTime[cat.name] += minutes;

            if (item.estimatedDuration) totalEstimated += item.estimatedDuration;
            if (item.actualDuration) totalActual += item.actualDuration;
            if (item.estimatedDuration || item.actualDuration) taskCount++;
          }
        });
      });
    });

    const categoryTrends = Object.entries(categoryTime)
      .map(([name, minutes]) => ({ name, hours: Math.round((minutes / 60) * 10) / 10 }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);

    const avgVelocity = taskCount > 0 ? Math.round((totalActual / totalEstimated) * 100) : 100;

    return {
      categoryTrends,
      completionByDay,
      avgVelocity,
    };
  }, [dumps]);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={18} color="#4CAF50" />;
      case 'down':
        return <TrendingDown size={18} color="#FF6B6B" />;
      default:
        return <Minus size={18} color={Colors.textMuted} />;
    }
  };

  const getVelocityColor = (trend: string) => {
    switch (trend) {
      case 'accelerating':
        return '#4CAF50';
      case 'slowing':
        return '#FF6B6B';
      default:
        return Colors.primary;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Insights</Text>
            <Text style={styles.subtitle}>AI-powered productivity analysis</Text>
          </View>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'weekly' && styles.tabActive]}
            onPress={() => {
              setSelectedTab('weekly');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Brain size={20} color={selectedTab === 'weekly' ? Colors.background : Colors.text} />
            <Text style={[styles.tabText, selectedTab === 'weekly' && styles.tabTextActive]}>
              Weekly Review
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'analytics' && styles.tabActive]}
            onPress={() => {
              setSelectedTab('analytics');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <BarChart3 size={20} color={selectedTab === 'analytics' ? Colors.background : Colors.text} />
            <Text style={[styles.tabText, selectedTab === 'analytics' && styles.tabTextActive]}>
              Analytics
            </Text>
          </TouchableOpacity>
        </View>

        {selectedTab === 'weekly' ? (
          <>
            {insightsQuery.isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Analyzing your productivity patterns...</Text>
              </View>
            ) : insights ? (
              <>
                <View style={styles.velocityCard}>
                  <View style={styles.velocityHeader}>
                    <Zap size={24} color={getVelocityColor(insights.velocityTrend)} />
                    <Text style={styles.velocityTitle}>Completion Velocity</Text>
                  </View>
                  <Text
                    style={[
                      styles.velocityStatus,
                      { color: getVelocityColor(insights.velocityTrend) },
                    ]}
                  >
                    {insights.velocityTrend === 'accelerating' ? '📈' : insights.velocityTrend === 'slowing' ? '📉' : '➡️'}{' '}
                    {insights.velocityTrend.charAt(0).toUpperCase() + insights.velocityTrend.slice(1)}
                  </Text>
                  <Text style={styles.velocityDesc}>
                    {insights.velocityTrend === 'accelerating'
                      ? "You're speeding up! Keep this momentum."
                      : insights.velocityTrend === 'slowing'
                      ? "You're slowing down. Time to recharge?"
                      : "You're maintaining steady pace."}
                  </Text>
                </View>

                {insights.patterns.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Target size={20} color={Colors.primary} />
                      <Text style={styles.sectionTitle}>Patterns Detected</Text>
                    </View>
                    {insights.patterns.map((pattern, index) => (
                      <View key={index} style={styles.insightCard}>
                        <Text style={styles.insightText}>{pattern}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {insights.productivityPeaks.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Award size={20} color="#4CAF50" />
                      <Text style={styles.sectionTitle}>Productivity Peaks</Text>
                    </View>
                    {insights.productivityPeaks.map((peak, index) => (
                      <View key={index} style={[styles.insightCard, { backgroundColor: '#4CAF5015' }]}>
                        <Text style={styles.insightText}>{peak}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {insights.slowdowns.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <AlertCircle size={20} color="#FF6B6B" />
                      <Text style={styles.sectionTitle}>Slowdowns</Text>
                    </View>
                    {insights.slowdowns.map((slowdown, index) => (
                      <View key={index} style={[styles.insightCard, { backgroundColor: '#FF6B6B15' }]}>
                        <Text style={styles.insightText}>{slowdown}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {insights.categoryTrends.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <BarChart3 size={20} color={Colors.primary} />
                      <Text style={styles.sectionTitle}>Category Trends</Text>
                    </View>
                    {insights.categoryTrends.map((trend, index) => (
                      <View key={index} style={styles.trendCard}>
                        <View style={styles.trendLeft}>
                          {getTrendIcon(trend.trend)}
                          <Text style={styles.trendCategory}>{trend.category}</Text>
                        </View>
                        <Text style={styles.trendPercentage}>{trend.percentage > 0 ? '+' : ''}{trend.percentage}%</Text>
                      </View>
                    ))}
                  </View>
                )}

                {insights.suggestions.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Brain size={20} color={Colors.accent3Dark} />
                      <Text style={styles.sectionTitle}>Suggestions for Next Week</Text>
                    </View>
                    {insights.suggestions.map((suggestion, index) => (
                      <View key={index} style={[styles.insightCard, { backgroundColor: Colors.accent3Dark + '15' }]}>
                        <Text style={styles.insightText}>💡 {suggestion}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Brain size={48} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No insights yet</Text>
                <Text style={styles.emptySubtitle}>
                  Complete more tasks to unlock AI-powered insights
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Clock size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Time Investment Report</Text>
              </View>
              {analyticsData.categoryTrends.length > 0 ? (
                <>
                  {analyticsData.categoryTrends.map((cat, index) => {
                    const maxHours = analyticsData.categoryTrends[0].hours;
                    const percentage = (cat.hours / maxHours) * 100;
                    
                    return (
                      <View key={index} style={styles.categoryAnalytics}>
                        <View style={styles.categoryHeader}>
                          <Text style={styles.categoryName}>{cat.name}</Text>
                          <Text style={styles.categoryHours}>{cat.hours}h</Text>
                        </View>
                        <View style={styles.progressBar}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${percentage}%`,
                                backgroundColor: Colors.primary,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    );
                  })}
                </>
              ) : (
                <Text style={styles.noDataText}>No time data available yet</Text>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <BarChart3 size={20} color={Colors.accent2Dark} />
                <Text style={styles.sectionTitle}>Completion Patterns</Text>
              </View>
              {Object.keys(analyticsData.completionByDay).length > 0 ? (
                <View style={styles.completionGrid}>
                  {Object.entries(analyticsData.completionByDay).map(([day, stats]) => {
                    const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                    
                    return (
                      <View key={day} style={styles.dayCard}>
                        <Text style={styles.dayName}>{day}</Text>
                        <Text style={styles.dayRate}>{rate}%</Text>
                        <Text style={styles.dayStats}>
                          {stats.completed}/{stats.total}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.noDataText}>No completion data available yet</Text>
              )}
            </View>

            {analyticsData.avgVelocity !== 100 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Zap size={20} color={Colors.accent3Dark} />
                  <Text style={styles.sectionTitle}>Estimation Accuracy</Text>
                </View>
                <View style={styles.velocityMetric}>
                  <Text style={styles.velocityMetricValue}>{analyticsData.avgVelocity}%</Text>
                  <Text style={styles.velocityMetricLabel}>
                    {analyticsData.avgVelocity > 100
                      ? 'Tasks taking longer than estimated'
                      : analyticsData.avgVelocity < 100
                      ? 'Completing tasks faster than estimated'
                      : 'Right on target!'}
                  </Text>
                </View>
              </View>
            )}
          </>
        )}
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
  tabContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  tabTextActive: {
    color: Colors.background,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  velocityCard: {
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
  velocityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  velocityTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  velocityStatus: {
    fontSize: 24,
    fontWeight: '900' as const,
    marginBottom: 8,
  },
  velocityDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  insightCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  insightText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  trendCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  trendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  trendCategory: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  trendPercentage: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.text,
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  categoryAnalytics: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  categoryHours: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.primary,
  },
  progressBar: {
    height: 12,
    backgroundColor: Colors.card,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  noDataText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontStyle: 'italic' as const,
    textAlign: 'center' as const,
    paddingVertical: 20,
  },
  completionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dayCard: {
    flex: 1,
    minWidth: 80,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  dayName: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    marginBottom: 6,
  },
  dayRate: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  dayStats: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  velocityMetric: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.border,
  },
  velocityMetricValue: {
    fontSize: 48,
    fontWeight: '900' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  velocityMetricLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
});
