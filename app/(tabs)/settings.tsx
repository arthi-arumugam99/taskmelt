import React, { useCallback } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Trash2,
  Info,
  Heart,
  Sparkles,
  Crown,
  RefreshCw,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useDumps } from '@/contexts/DumpContext';
import { useRevenueCat } from '@/contexts/RevenueCatContext';

interface SettingRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  destructive?: boolean;
}

function SettingRow({ icon, title, subtitle, onPress, destructive }: SettingRowProps) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconContainer, destructive && styles.iconContainerDestructive]}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, destructive && styles.settingTitleDestructive]}>
          {title}
        </Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { dumps, clearAll } = useDumps();
  const {
    isProUser,
    customerInfo,
    restorePurchases,
    isRestoring,
  } = useRevenueCat();

  const handleClearAll = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your dumps. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            clearAll();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  }, [clearAll]);

  const handleAbout = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'About TaskMelt',
      'TaskMelt helps you transform overwhelming thoughts into organized, actionable tasks.\n\nVersion 1.0.0',
      [{ text: 'OK' }]
    );
  }, []);

  const handleRateApp = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Rate TaskMelt',
      'Thank you for using TaskMelt! Your feedback helps us improve.',
      [{ text: 'OK' }]
    );
  }, []);

  const handleUpgrade = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/paywall');
  }, [router]);

  const handleRestorePurchases = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await restorePurchases();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Your purchases have been restored.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to restore purchases';
      Alert.alert('Restore Failed', message);
    }
  }, [restorePurchases]);

  const handleManageSubscription = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Manage Subscription',
      'To manage your subscription, go to Settings > Apple ID > Subscriptions on your device.',
      [{ text: 'OK' }]
    );
  }, []);

  const totalTasks = dumps.reduce((acc, dump) => {
    return acc + dump.categories.reduce((catAcc, cat) => catAcc + cat.items.length, 0);
  }, 0);

  const completedTasks = dumps.reduce((acc, dump) => {
    return acc + dump.categories.reduce((catAcc, cat) => 
      catAcc + cat.items.filter((item) => item.completed).length, 0);
  }, 0);

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const thisWeekDumps = dumps.filter((dump) => {
    const dumpDate = new Date(dump.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return dumpDate >= weekAgo;
  }).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Sparkles size={20} color={Colors.primary} />
            <Text style={styles.statsTitle}>Your Journey</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{dumps.length}</Text>
              <Text style={styles.statLabel}>Brain Dumps</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalTasks}</Text>
              <Text style={styles.statLabel}>Tasks Created</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{completedTasks}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>

          <View style={styles.secondaryStats}>
            <View style={styles.secondaryStatRow}>
              <Text style={styles.secondaryStatLabel}>Completion Rate</Text>
              <Text style={styles.secondaryStatValue}>{completionRate}%</Text>
            </View>
            <View style={styles.secondaryStatRow}>
              <Text style={styles.secondaryStatLabel}>This Week</Text>
              <Text style={styles.secondaryStatValue}>{thisWeekDumps} dumps</Text>
            </View>
          </View>

          {completionRate >= 50 && (
            <View style={styles.achievementBadge}>
              <Text style={styles.achievementText}>🎯 Great progress! Keep it up!</Text>
            </View>
          )}
        </View>

        {!isProUser ? (
          <TouchableOpacity
            style={styles.proCard}
            onPress={handleUpgrade}
            activeOpacity={0.8}
          >
            <View style={styles.proCardContent}>
              <View style={styles.proIconContainer}>
                <Crown size={24} color="#FFFFFF" />
              </View>
              <View style={styles.proTextContainer}>
                <Text style={styles.proTitle}>Upgrade to Pro</Text>
                <Text style={styles.proSubtitle}>Unlock unlimited brain dumps</Text>
              </View>
              <ChevronRight size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.proActiveCard}>
            <View style={styles.proActiveContent}>
              <View style={styles.proActiveIconContainer}>
                <Crown size={20} color={Colors.primary} />
              </View>
              <View style={styles.proActiveTextContainer}>
                <Text style={styles.proActiveTitle}>TaskMelt Pro</Text>
                <Text style={styles.proActiveSubtitle}>
                  {customerInfo?.activeSubscriptions?.length
                    ? 'Active subscription'
                    : 'Lifetime access'}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <View style={styles.sectionContent}>
            {isProUser ? (
              <SettingRow
                icon={<Crown size={20} color={Colors.primary} />}
                title="Manage Subscription"
                subtitle="View or cancel your subscription"
                onPress={handleManageSubscription}
              />
            ) : (
              <SettingRow
                icon={<Crown size={20} color={Colors.primary} />}
                title="Upgrade to Pro"
                subtitle="Unlock all premium features"
                onPress={handleUpgrade}
              />
            )}
            <SettingRow
              icon={<RefreshCw size={20} color={Colors.primary} />}
              title={isRestoring ? 'Restoring...' : 'Restore Purchases'}
              subtitle="Restore previous purchases"
              onPress={handleRestorePurchases}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          <View style={styles.sectionContent}>
            <SettingRow
              icon={<Info size={20} color={Colors.primary} />}
              title="About TaskMelt"
              subtitle="Version 1.0.0"
              onPress={handleAbout}
            />
            <SettingRow
              icon={<Heart size={20} color={Colors.primary} />}
              title="Rate the App"
              subtitle="Help us improve"
              onPress={handleRateApp}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <View style={styles.sectionContent}>
            <SettingRow
              icon={<Trash2 size={20} color={Colors.error} />}
              title="Clear All Data"
              subtitle={`${dumps.length} dumps will be deleted`}
              onPress={handleClearAll}
              destructive
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with 🧠 for overwhelmed minds
          </Text>
          <Text style={styles.footerSubtext}>
            Chaos in. Clarity out.
          </Text>
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
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  statsCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  secondaryStats: {
    gap: 12,
    paddingTop: 16,
  },
  secondaryStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  secondaryStatLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  secondaryStatValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  achievementBadge: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.primary + '15',
    borderRadius: 12,
    alignItems: 'center',
  },
  achievementText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerDestructive: {
    backgroundColor: '#FDF2F2',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  settingTitleDestructive: {
    color: Colors.error,
  },
  settingSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 16,
  },
  footerText: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  proCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  proCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  proTextContainer: {
    flex: 1,
  },
  proTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  proSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  proActiveCard: {
    backgroundColor: Colors.primary + '10',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  proActiveContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proActiveIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  proActiveTextContainer: {
    flex: 1,
  },
  proActiveTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
    marginBottom: 2,
  },
  proActiveSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
