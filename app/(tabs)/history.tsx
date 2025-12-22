import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trash2, ChevronRight, Calendar } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useDumps } from '@/contexts/DumpContext';
import { DumpSession } from '@/types/dump';
import OrganizedResults from '@/components/OrganizedResults';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffDays === 1) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

function getPreview(text: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= 60) return cleaned;
  return cleaned.substring(0, 60) + '...';
}

function getCompletionStats(dump: DumpSession): { completed: number; total: number } {
  let completed = 0;
  let total = 0;
  dump.categories.forEach((cat) => {
    cat.items.forEach((item) => {
      total++;
      if (item.completed) completed++;
    });
  });
  return { completed, total };
}

interface DumpCardProps {
  dump: DumpSession;
  onPress: () => void;
  onDelete: () => void;
}

function DumpCard({ dump, onPress, onDelete }: DumpCardProps) {
  const stats = getCompletionStats(dump);
  const progress = stats.total > 0 ? stats.completed / stats.total : 0;

  const handleDelete = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Dump',
      'Are you sure you want to delete this dump?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  }, [onDelete]);

  return (
    <TouchableOpacity style={styles.dumpCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={styles.dateRow}>
          <Calendar size={14} color={Colors.textMuted} />
          <Text style={styles.dateText}>{formatDate(dump.createdAt)}</Text>
        </View>
        <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Trash2 size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={styles.previewText}>{getPreview(dump.rawText)}</Text>

      <View style={styles.cardFooter}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.statsText}>
            {stats.completed}/{stats.total} tasks done
          </Text>
        </View>
        <ChevronRight size={20} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const { dumps, deleteDump, toggleTask } = useDumps();
  const [expandedDumpId, setExpandedDumpId] = useState<string | null>(null);

  const handleDumpPress = useCallback((dumpId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedDumpId((prev) => (prev === dumpId ? null : dumpId));
  }, []);

  const handleDelete = useCallback(
    (dumpId: string) => {
      deleteDump(dumpId);
      if (expandedDumpId === dumpId) {
        setExpandedDumpId(null);
      }
    },
    [deleteDump, expandedDumpId]
  );

  const handleToggleTask = useCallback(
    (dumpId: string, taskId: string) => {
      toggleTask(dumpId, taskId);
    },
    [toggleTask]
  );

  const expandedDump = dumps.find((d) => d.id === expandedDumpId);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>
            {dumps.length} {dumps.length === 1 ? 'dump' : 'dumps'} saved
          </Text>
        </View>

        {dumps.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No dumps yet</Text>
            <Text style={styles.emptySubtitle}>
              Your organized thoughts will appear here after your first brain dump.
            </Text>
          </View>
        ) : expandedDump ? (
          <View style={styles.expandedContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setExpandedDumpId(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>← Back to list</Text>
            </TouchableOpacity>

            <View style={styles.expandedHeader}>
              <Text style={styles.expandedDate}>{formatDate(expandedDump.createdAt)}</Text>
              <View style={styles.rawTextContainer}>
                <Text style={styles.rawTextLabel}>Original dump:</Text>
                <Text style={styles.rawText}>{expandedDump.rawText}</Text>
              </View>
            </View>

            <OrganizedResults
              categories={expandedDump.categories}
              summary={expandedDump.summary}
              onToggleTask={(taskId) => handleToggleTask(expandedDump.id, taskId)}
            />
          </View>
        ) : (
          <View style={styles.dumpList}>
            {dumps.map((dump) => (
              <DumpCard
                key={dump.id}
                dump={dump}
                onPress={() => handleDumpPress(dump.id)}
                onDelete={() => handleDelete(dump.id)}
              />
            ))}
          </View>
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
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  dumpList: {
    gap: 12,
  },
  dumpCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  previewText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressContainer: {
    flex: 1,
    gap: 6,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
    width: '80%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 2,
  },
  statsText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  expandedContainer: {
    gap: 20,
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  expandedHeader: {
    gap: 16,
  },
  expandedDate: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  rawTextContainer: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  rawTextLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  rawText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
