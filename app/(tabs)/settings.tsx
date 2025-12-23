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
  User,
  LogOut,
  LogIn,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useDumps } from '@/contexts/DumpContext';
import { useRevenueCat } from '@/contexts/RevenueCatContext';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user, isAuthenticated, signOut, isSigningOut } = useAuth();

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
      'About taskmelt',
      'taskmelt helps you transform overwhelming thoughts into organized, actionable tasks.\n\nVersion 1.0.0',
      [{ text: 'OK' }]
    );
  }, []);

  const handleRateApp = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Rate taskmelt',
      'Thank you for using taskmelt! Your feedback helps us improve.',
      [{ text: 'OK' }]
    );
  }, []);

  const handleUpgrade = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/paywall' as any);
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

  const handleSignIn = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/auth' as any);
  }, [router]);

  const handleSignOut = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  }, [signOut]);

  const totalTasks = dumps.reduce((acc, dump) => {
    return acc + dump.categories.reduce((catAcc, cat) => {
      return catAcc + cat.items.reduce((itemAcc, item) => {
        if (item.isReflection) return itemAcc;
        if (item.subtasks && item.subtasks.length > 0) {
          return itemAcc + item.subtasks.length;
        }
        return itemAcc + 1;
      }, 0);
    }, 0);
  }, 0);

  const completedTasks = dumps.reduce((acc, dump) => {
    return acc + dump.categories.reduce((catAcc, cat) => {
      return catAcc + cat.items.reduce((itemAcc, item) => {
        if (item.isReflection) return itemAcc;
        if (item.subtasks && item.subtasks.length > 0) {
          return itemAcc + item.subtasks.filter(st => st.completed).length;
        }
        return itemAcc + (item.completed ? 1 : 0);
      }, 0);
    }, 0);
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
                <Text style={styles.proSubtitle}>From $6.99/mo • Unlimited dumps</Text>
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
                <Text style={styles.proActiveTitle}>task<Text style={styles.proActiveTitleItalic}>melt</Text> Pro</Text>
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
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.sectionContent}>
            {isAuthenticated ? (
              <>
                <View style={styles.accountInfo}>
                  <View style={styles.accountIconContainer}>
                    <User size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.accountTextContainer}>
                    <Text style={styles.accountEmail} numberOfLines={1}>
                      {user?.email}
                    </Text>
                    <Text style={styles.accountStatus}>Signed in</Text>
                  </View>
                </View>
                <SettingRow
                  icon={<LogOut size={20} color={Colors.error} />}
                  title={isSigningOut ? 'Signing out...' : 'Sign Out'}
                  subtitle="Sign out of your account"
                  onPress={handleSignOut}
                  destructive
                />
              </>
            ) : (
              <SettingRow
                icon={<LogIn size={20} color={Colors.primary} />}
                title="Sign In"
                subtitle="Sign in to sync your data"
                onPress={handleSignIn}
              />
            )}
          </View>
        </View>

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
                subtitle="From $6.99/mo • $69.99/yr • $99.99 lifetime"
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
              title="About taskmelt"
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
    fontSize: 36,
    fontWeight: '900' as const,
    color: Colors.text,
    letterSpacing: -1,
    textTransform: 'uppercase' as const,
  },
  statsCard: {
    backgroundColor: Colors.accent2,
    borderRadius: 24,
    padding: 20,
    marginBottom: 32,
    borderWidth: 3,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 17,
    fontWeight: '800' as const,
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
    fontWeight: '700' as const,
    color: Colors.text,
  },
  achievementBadge: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.accent5,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.border,
  },
  achievementText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '700' as const,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '900' as const,
    color: Colors.text,
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
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
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
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  iconContainerDestructive: {
    backgroundColor: '#FDF2F2',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
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
    backgroundColor: Colors.accent1Dark,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 3,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  proCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  proTextContainer: {
    flex: 1,
  },
  proTitle: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  proSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  proActiveCard: {
    backgroundColor: Colors.accent5,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 3,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  proActiveContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proActiveIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  proActiveTextContainer: {
    flex: 1,
  },
  proActiveTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  proActiveTitleItalic: {
    fontStyle: 'italic' as const,
  },
  proActiveSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  accountIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  accountTextContainer: {
    flex: 1,
  },
  accountEmail: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  accountStatus: {
    fontSize: 13,
    color: Colors.success,
    marginTop: 2,
  },
});
