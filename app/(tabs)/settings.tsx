import React, { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Trash2,
  Info,
  Heart,
  Sparkles,
  User,
  LogOut,
  LogIn,
  Calendar as CalendarIcon,
  FileText,
  Shield,
  Mail,
  UserX,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useDumps } from '@/contexts/DumpContext';
import { useAuth } from '@/contexts/AuthContext';
import CalendarSyncModal from '@/components/CalendarSyncModal';

const TERMS_URL = 'https://taskmelt.app/terms';
const PRIVACY_URL = 'https://taskmelt.app/privacy';

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
  const { user, isAuthenticated, signOut, isSigningOut, deleteAccount, isDeletingAccount } = useAuth();
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);

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

  const handleDeleteAccount = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This will delete all your data including dumps, tasks, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            // Second confirmation for destructive action
            Alert.alert(
              'Final Confirmation',
              'This is permanent. All your data will be lost forever.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Forever',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteAccount();
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
                    } catch {
                      Alert.alert('Error', 'Failed to delete account. Please try again or contact support.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }, [deleteAccount]);

  const handleCalendarSync = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCalendarModalVisible(true);
  }, []);

  const handleTerms = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(TERMS_URL);
  }, []);

  const handlePrivacy = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(PRIVACY_URL);
  }, []);

  const handleSupport = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Support',
      'For support, please email us at:\n\njunomobileapplications@gmail.com',
      [{ text: 'OK' }]
    );
  }, []);

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
                <SettingRow
                  icon={<UserX size={20} color={Colors.error} />}
                  title={isDeletingAccount ? 'Deleting...' : 'Delete Account'}
                  subtitle="Permanently delete your account and data"
                  onPress={handleDeleteAccount}
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
            <SettingRow
              icon={<Mail size={20} color={Colors.primary} />}
              title="Support"
              subtitle="Get help via email"
              onPress={handleSupport}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calendar</Text>
          <View style={styles.sectionContent}>
            <SettingRow
              icon={<CalendarIcon size={20} color={Colors.primary} />}
              title="Sync Calendar Events"
              subtitle="Import meetings and events as tasks"
              onPress={handleCalendarSync}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.sectionContent}>
            <SettingRow
              icon={<FileText size={20} color={Colors.primary} />}
              title="Terms of Use"
              subtitle="Read our terms and conditions"
              onPress={handleTerms}
            />
            <SettingRow
              icon={<Shield size={20} color={Colors.primary} />}
              title="Privacy Policy"
              subtitle="How we protect your data"
              onPress={handlePrivacy}
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

      <CalendarSyncModal
        visible={calendarModalVisible}
        onClose={() => setCalendarModalVisible(false)}
      />
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
