import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { TaskItem, EisenhowerMatrix as IEisenhowerMatrix } from '@/types/dump';
import { AlertCircle, Clock, UserX, Trash2 } from 'lucide-react-native';
import SwipeableTask from './SwipeableTask';

interface EisenhowerMatrixProps {
  tasks: TaskItem[];
  onTaskPress?: (task: TaskItem) => void;
  onTaskComplete?: (taskId: string) => void;
  onTaskUpdate?: (task: TaskItem) => void;
}

export default function EisenhowerMatrix({
  tasks,
  onTaskPress,
  onTaskComplete,
  onTaskUpdate,
}: EisenhowerMatrixProps) {
  // Categorize tasks into quadrants
  const matrix: IEisenhowerMatrix = {
    urgentImportant: [],
    notUrgentImportant: [],
    urgentNotImportant: [],
    notUrgentNotImportant: [],
  };

  tasks.forEach((task) => {
    const urgent = task.eisenhower?.urgent ?? false;
    const important = task.eisenhower?.important ?? false;

    if (urgent && important) {
      matrix.urgentImportant.push(task);
    } else if (!urgent && important) {
      matrix.notUrgentImportant.push(task);
    } else if (urgent && !important) {
      matrix.urgentNotImportant.push(task);
    } else {
      matrix.notUrgentNotImportant.push(task);
    }
  });

  interface QuadrantProps {
    title: string;
    subtitle: string;
    tasks: TaskItem[];
    color: string;
    icon: React.ReactNode;
  }

  const Quadrant = ({ title, subtitle, tasks, color, icon }: QuadrantProps) => (
    <View style={[styles.quadrant, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={styles.quadrantHeader}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          {icon}
        </View>
        <View style={styles.quadrantTitleContainer}>
          <Text style={styles.quadrantTitle}>{title}</Text>
          <Text style={styles.quadrantSubtitle}>{subtitle}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Text style={styles.badgeText}>{tasks.length}</Text>
        </View>
      </View>

      <ScrollView style={styles.taskList} showsVerticalScrollIndicator={false}>
        {tasks.length === 0 ? (
          <Text style={styles.emptyText}>No tasks in this quadrant</Text>
        ) : (
          tasks.map((task) => (
            <Pressable
              key={task.id}
              onPress={() => onTaskPress?.(task)}
              style={styles.taskItem}
            >
              <SwipeableTask
                task={task}
                onComplete={() => onTaskComplete?.(task.id)}
                onEdit={() => onTaskPress?.(task)}
              />
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Eisenhower Matrix</Text>
        <Text style={styles.headerSubtitle}>
          Organize tasks by urgency and importance
        </Text>
      </View>

      <View style={styles.grid}>
        {/* Quadrant 1: Urgent & Important - DO FIRST */}
        <Quadrant
          title="Do First"
          subtitle="Urgent & Important"
          tasks={matrix.urgentImportant}
          color="#FF4444"
          icon={<AlertCircle size={20} color="#FF4444" />}
        />

        {/* Quadrant 2: Not Urgent but Important - SCHEDULE */}
        <Quadrant
          title="Schedule"
          subtitle="Not Urgent but Important"
          tasks={matrix.notUrgentImportant}
          color="#4CAF50"
          icon={<Clock size={20} color="#4CAF50" />}
        />

        {/* Quadrant 3: Urgent but Not Important - DELEGATE */}
        <Quadrant
          title="Delegate"
          subtitle="Urgent but Not Important"
          tasks={matrix.urgentNotImportant}
          color="#FF9800"
          icon={<UserX size={20} color="#FF9800" />}
        />

        {/* Quadrant 4: Not Urgent & Not Important - ELIMINATE */}
        <Quadrant
          title="Eliminate"
          subtitle="Not Urgent & Not Important"
          tasks={matrix.notUrgentNotImportant}
          color="#9E9E9E"
          icon={<Trash2 size={20} color="#9E9E9E" />}
        />
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>How to use:</Text>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF4444' }]} />
          <Text style={styles.legendText}>
            <Text style={styles.legendBold}>Do First:</Text> Critical and time-sensitive tasks
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>
            <Text style={styles.legendBold}>Schedule:</Text> Important long-term goals
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
          <Text style={styles.legendText}>
            <Text style={styles.legendBold}>Delegate:</Text> Tasks others can do
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#9E9E9E' }]} />
          <Text style={styles.legendText}>
            <Text style={styles.legendBold}>Eliminate:</Text> Time-wasters and distractions
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  grid: {
    padding: 10,
    gap: 15,
  },
  quadrant: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 200,
  },
  quadrantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quadrantTitleContainer: {
    flex: 1,
  },
  quadrantTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  quadrantSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  badge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  taskList: {
    maxHeight: 300,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    padding: 20,
    fontStyle: 'italic',
  },
  taskItem: {
    marginBottom: 10,
  },
  legend: {
    margin: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  legendText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  legendBold: {
    fontWeight: '700',
    color: '#333',
  },
});
