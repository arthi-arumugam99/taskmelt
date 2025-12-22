import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trash2, ChevronRight, Calendar, Search, X, Share2 } from 'lucide-react-native';
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
      if (item.isReflection) return;
      
      if (item.subtasks && item.subtasks.length > 0) {
        total += item.subtasks.length;
        completed += item.subtasks.filter(st => st.completed).length;
      } else {
        total += 1;
        if (item.completed) completed += 1;
      }
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

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

  const handleToggleExpanded = useCallback(
    (taskId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    []
  );

  const handleShare = useCallback(async (dump: DumpSession) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const stats = getCompletionStats(dump);
    let shareText = `📋 TaskMelt Brain Dump\n${formatDate(dump.createdAt)}\n\n"${dump.rawText}"\n\n`;
    
    dump.categories.forEach((cat) => {
      if (cat.items.length > 0) {
        shareText += `\n${cat.emoji} ${cat.name}:\n`;
        cat.items.forEach((item) => {
          const status = item.completed ? '✅' : '⬜';
          shareText += `${status} ${item.task}`;
          if (item.timeEstimate) shareText += ` (${item.timeEstimate})`;
          shareText += '\n';
        });
      }
    });
    
    shareText += `\n✨ Progress: ${stats.completed}/${stats.total} tasks completed`;
    
    try {
      await Share.share({ message: shareText });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  }, []);

  const filteredDumps = useMemo(() => {
    if (!searchQuery.trim()) return dumps;
    
    const query = searchQuery.toLowerCase();
    return dumps.filter((dump) => {
      if (dump.rawText.toLowerCase().includes(query)) return true;
      return dump.categories.some((cat) =>
        cat.items.some((item) => item.task.toLowerCase().includes(query))
      );
    });
  }, [dumps, searchQuery]);

  const expandedDump = dumps.find((d) => d.id === expandedDumpId);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>History</Text>
              <Text style={styles.subtitle}>
                {filteredDumps.length} {filteredDumps.length === 1 ? 'dump' : 'dumps'}
                {searchQuery ? ' found' : ' saved'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => {
                setShowSearch(!showSearch);
                if (showSearch) setSearchQuery('');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              {showSearch ? (
                <X size={22} color={Colors.primary} />
              ) : (
                <Search size={22} color={Colors.primary} />
              )}
            </TouchableOpacity>
          </View>

          {showSearch && (
            <View style={styles.searchContainer}>
              <Search size={18} color={Colors.textMuted} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search your dumps..."
                placeholderTextColor={Colors.textMuted}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearButton}
                >
                  <X size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {filteredDumps.length === 0 && !searchQuery ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No dumps yet</Text>
            <Text style={styles.emptySubtitle}>
              Your organized thoughts will appear here after your first brain dump.
            </Text>
          </View>
        ) : filteredDumps.length === 0 && searchQuery ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptySubtitle}>
              Try searching with different keywords
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
              <View style={styles.expandedTop}>
                <Text style={styles.expandedDate}>{formatDate(expandedDump.createdAt)}</Text>
                <TouchableOpacity
                  style={styles.shareButtonSmall}
                  onPress={() => handleShare(expandedDump)}
                >
                  <Share2 size={18} color={Colors.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.rawTextContainer}>
                <Text style={styles.rawTextLabel}>Original dump:</Text>
                <Text style={styles.rawText}>{expandedDump.rawText}</Text>
              </View>
            </View>

            <OrganizedResults
              categories={expandedDump.categories}
              summary={expandedDump.summary}
              onToggleTask={(taskId) => handleToggleTask(expandedDump.id, taskId)}
              onToggleExpanded={handleToggleExpanded}
            />
          </View>
        ) : (
          <View style={styles.dumpList}>
            {filteredDumps.map((dump) => (
              <View key={dump.id}>
                <DumpCard
                  dump={dump}
                  onPress={() => handleDumpPress(dump.id)}
                  onDelete={() => handleDelete(dump.id)}
                />
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={() => handleShare(dump)}
                  activeOpacity={0.7}
                >
                  <Share2 size={16} color={Colors.primary} />
                  <Text style={styles.shareButtonText}>Share</Text>
                </TouchableOpacity>
              </View>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  searchButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 8,
  },
  searchIcon: {
    marginLeft: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    padding: 0,
  },
  clearButton: {
    padding: 4,
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
  expandedTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expandedDate: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  shareButtonSmall: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
    marginBottom: 4,
  },
  shareButtonText: {
    fontSize: 14,
    color: Colors.primary,
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
