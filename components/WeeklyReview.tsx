import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Trophy,
  Target,
  TrendingUp,
  Clock,
  Zap,
  Star,
  Lightbulb,
} from 'lucide-react-native';
import { DumpSession, TaskItem } from '@/types/dump';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WeeklyReviewProps {
  dumps: DumpSession[];
  onClose: () => void;
  onSaveReview?: (review: WeeklyReviewData) => void;
}

interface WeeklyReviewData {
  wins: string[];
  challenges: string[];
  nextWeekIntentions: string[];
  weekRating: number;
}

type ReviewStep = 'overview' | 'wins' | 'challenges' | 'intentions' | 'summary';

const STEPS: ReviewStep[] = ['overview', 'wins', 'challenges', 'intentions', 'summary'];

function getWeekDates(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - dayOfWeek);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function calculateWeekStats(dumps: DumpSession[], weekStart: Date, weekEnd: Date) {
  let tasksCompleted = 0;
  let tasksCreated = 0;
  const categoryCount: Record<string, { emoji: string; count: number }> = {};

  dumps.forEach((dump) => {
    const dumpDate = new Date(dump.createdAt);
    if (dumpDate >= weekStart && dumpDate <= weekEnd) {
      dump.categories.forEach((category) => {
        category.items.forEach((item) => {
          if (!item.isReflection) {
            tasksCreated++;
            if (item.completed) {
              tasksCompleted++;
            }
            if (!categoryCount[category.name]) {
              categoryCount[category.name] = { emoji: category.emoji, count: 0 };
            }
            categoryCount[category.name].count++;
          }
        });
      });
    }
  });

  const topCategories = Object.entries(categoryCount)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const completionRate = tasksCreated > 0
    ? Math.round((tasksCompleted / tasksCreated) * 100)
    : 0;

  return { tasksCompleted, tasksCreated, completionRate, topCategories };
}

export default function WeeklyReview({ dumps, onClose, onSaveReview }: WeeklyReviewProps) {
  const [currentStep, setCurrentStep] = useState<ReviewStep>('overview');
  const [wins, setWins] = useState<string[]>(['', '', '']);
  const [challenges, setChallenges] = useState<string[]>(['', '']);
  const [intentions, setIntentions] = useState<string[]>(['', '', '']);
  const [weekRating, setWeekRating] = useState(0);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const { start: weekStart, end: weekEnd } = useMemo(() => getWeekDates(), []);
  const stats = useMemo(
    () => calculateWeekStats(dumps, weekStart, weekEnd),
    [dumps, weekStart, weekEnd]
  );

  const currentStepIndex = STEPS.indexOf(currentStep);

  const animateTransition = (direction: 'next' | 'prev') => {
    const toValue = direction === 'next' ? -SCREEN_WIDTH : SCREEN_WIDTH;

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      slideAnim.setValue(direction === 'next' ? SCREEN_WIDTH : -SCREEN_WIDTH);
      setCurrentStep(STEPS[currentStepIndex + (direction === 'next' ? 1 : -1)]);

      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      animateTransition('next');
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      animateTransition('prev');
    }
  };

  const handleComplete = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onSaveReview?.({
      wins: wins.filter((w) => w.trim()),
      challenges: challenges.filter((c) => c.trim()),
      nextWeekIntentions: intentions.filter((i) => i.trim()),
      weekRating,
    });
    onClose();
  };

  const updateListItem = (
    list: string[],
    setList: (list: string[]) => void,
    index: number,
    value: string
  ) => {
    const newList = [...list];
    newList[index] = value;
    setList(newList);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'overview':
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Trophy size={32} color="#F59E0B" />
              <Text style={styles.stepTitle}>Your Week in Review</Text>
              <Text style={styles.stepSubtitle}>
                {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
                {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Check size={24} color="#22C55E" />
                <Text style={styles.statValue}>{stats.tasksCompleted}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statCard}>
                <Target size={24} color="#3B82F6" />
                <Text style={styles.statValue}>{stats.completionRate}%</Text>
                <Text style={styles.statLabel}>Rate</Text>
              </View>
            </View>

            {stats.topCategories.length > 0 && (
              <View style={styles.categoriesSection}>
                <Text style={styles.sectionLabel}>Top Categories</Text>
                <View style={styles.categoryList}>
                  {stats.topCategories.map((cat, index) => (
                    <View key={index} style={styles.categoryChip}>
                      <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                      <Text style={styles.categoryName}>{cat.name}</Text>
                      <Text style={styles.categoryCount}>{cat.count}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        );

      case 'wins':
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Star size={32} color="#F59E0B" />
              <Text style={styles.stepTitle}>Celebrate Your Wins</Text>
              <Text style={styles.stepSubtitle}>
                What went well this week? List 3 wins, big or small.
              </Text>
            </View>

            <View style={styles.inputList}>
              {wins.map((win, index) => (
                <View key={index} style={styles.inputRow}>
                  <Text style={styles.inputNumber}>{index + 1}.</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder={`Win #${index + 1}...`}
                    placeholderTextColor="#A89F91"
                    value={win}
                    onChangeText={(value) => updateListItem(wins, setWins, index, value)}
                    multiline
                  />
                </View>
              ))}
            </View>
          </View>
        );

      case 'challenges':
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <TrendingUp size={32} color="#3B82F6" />
              <Text style={styles.stepTitle}>Reflect on Challenges</Text>
              <Text style={styles.stepSubtitle}>
                What obstacles did you face? No judgment, just awareness.
              </Text>
            </View>

            <View style={styles.inputList}>
              {challenges.map((challenge, index) => (
                <View key={index} style={styles.inputRow}>
                  <Text style={styles.inputNumber}>{index + 1}.</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder={`Challenge #${index + 1}...`}
                    placeholderTextColor="#A89F91"
                    value={challenge}
                    onChangeText={(value) =>
                      updateListItem(challenges, setChallenges, index, value)
                    }
                    multiline
                  />
                </View>
              ))}
            </View>
          </View>
        );

      case 'intentions':
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Lightbulb size={32} color="#22C55E" />
              <Text style={styles.stepTitle}>Set Next Week's Intentions</Text>
              <Text style={styles.stepSubtitle}>
                What do you want to focus on next week?
              </Text>
            </View>

            <View style={styles.inputList}>
              {intentions.map((intention, index) => (
                <View key={index} style={styles.inputRow}>
                  <Text style={styles.inputNumber}>{index + 1}.</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder={`Intention #${index + 1}...`}
                    placeholderTextColor="#A89F91"
                    value={intention}
                    onChangeText={(value) =>
                      updateListItem(intentions, setIntentions, index, value)
                    }
                    multiline
                  />
                </View>
              ))}
            </View>
          </View>
        );

      case 'summary':
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Zap size={32} color="#F59E0B" />
              <Text style={styles.stepTitle}>Rate Your Week</Text>
              <Text style={styles.stepSubtitle}>
                How would you rate this week overall?
              </Text>
            </View>

            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  onPress={() => setWeekRating(rating)}
                  style={[
                    styles.ratingButton,
                    weekRating >= rating && styles.ratingButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.ratingEmoji,
                      weekRating >= rating && styles.ratingEmojiActive,
                    ]}
                  >
                    {rating === 1
                      ? '😔'
                      : rating === 2
                      ? '😐'
                      : rating === 3
                      ? '🙂'
                      : rating === 4
                      ? '😊'
                      : '🤩'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.summaryPreview}>
              {wins.filter((w) => w.trim()).length > 0 && (
                <View style={styles.summarySection}>
                  <Text style={styles.summaryLabel}>
                    {wins.filter((w) => w.trim()).length} Wins
                  </Text>
                </View>
              )}
              {challenges.filter((c) => c.trim()).length > 0 && (
                <View style={styles.summarySection}>
                  <Text style={styles.summaryLabel}>
                    {challenges.filter((c) => c.trim()).length} Challenges
                  </Text>
                </View>
              )}
              {intentions.filter((i) => i.trim()).length > 0 && (
                <View style={styles.summarySection}>
                  <Text style={styles.summaryLabel}>
                    {intentions.filter((i) => i.trim()).length} Intentions
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Weekly Review</Text>
        <View style={styles.progressDots}>
          {STEPS.map((step, index) => (
            <View
              key={step}
              style={[
                styles.progressDot,
                index <= currentStepIndex && styles.progressDotActive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={{
            transform: [{ translateX: slideAnim }],
            opacity: fadeAnim,
          }}
        >
          {renderStep()}
        </Animated.View>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        {currentStepIndex > 0 ? (
          <TouchableOpacity onPress={handlePrev} style={styles.navButton}>
            <ChevronLeft size={20} color="#6B5C4C" />
            <Text style={styles.navButtonText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.navButton} />
        )}

        {currentStepIndex < STEPS.length - 1 ? (
          <TouchableOpacity onPress={handleNext} style={styles.navButtonPrimary}>
            <Text style={styles.navButtonPrimaryText}>Continue</Text>
            <ChevronRight size={20} color="#FEF7E6" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleComplete} style={styles.navButtonPrimary}>
            <Text style={styles.navButtonPrimaryText}>Complete</Text>
            <Check size={20} color="#FEF7E6" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF7E6',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E1D5',
  },
  closeButton: {
    position: 'absolute',
    top: 56,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F0E6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E8E1D5',
  },
  progressDotActive: {
    backgroundColor: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  stepContent: {
    padding: 24,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#6B5C4C',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFDF9',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E1D5',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B5C4C',
    marginTop: 4,
  },
  categoriesSection: {
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B5C4C',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  categoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E8E1D5',
    gap: 6,
  },
  categoryEmoji: {
    fontSize: 14,
  },
  categoryName: {
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  categoryCount: {
    fontSize: 12,
    color: '#6B5C4C',
    backgroundColor: '#E8E1D5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  inputList: {
    gap: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  inputNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B5C4C',
    paddingTop: 12,
    width: 24,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#FFFDF9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E8E1D5',
    minHeight: 48,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  ratingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFDF9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E8E1D5',
  },
  ratingButtonActive: {
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
  },
  ratingEmoji: {
    fontSize: 24,
    opacity: 0.5,
  },
  ratingEmojiActive: {
    opacity: 1,
  },
  summaryPreview: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  summarySection: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B5C4C',
    fontWeight: '500',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E8E1D5',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 80,
  },
  navButtonText: {
    fontSize: 15,
    color: '#6B5C4C',
    fontWeight: '500',
  },
  navButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1A1A1A',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  navButtonPrimaryText: {
    fontSize: 15,
    color: '#FEF7E6',
    fontWeight: '600',
  },
});
