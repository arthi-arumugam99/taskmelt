import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { X, Trash2, Plus, Clock, FileText } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { TaskItem } from '@/types/dump';

interface TaskEditModalProps {
  visible: boolean;
  task: TaskItem | null;
  categoryColor: string;
  onClose: () => void;
  onSave: (updatedTask: TaskItem) => void;
  onDelete: () => void;
}

export default function TaskEditModal({
  visible,
  task,
  categoryColor,
  onClose,
  onSave,
  onDelete,
}: TaskEditModalProps) {
  const [taskName, setTaskName] = useState(task?.task || '');
  const [timeEstimate, setTimeEstimate] = useState(task?.timeEstimate || '');
  const [notes, setNotes] = useState(task?.notes || '');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>(task?.priority || 'medium');
  const [subtasks, setSubtasks] = useState<TaskItem[]>(task?.subtasks || []);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  React.useEffect(() => {
    if (task) {
      setTaskName(task.task);
      setTimeEstimate(task.timeEstimate || '');
      setNotes(task.notes || '');
      setPriority(task.priority || 'medium');
      setSubtasks(task.subtasks || []);
    }
  }, [task]);

  if (!task) return null;

  const handleSave = () => {
    if (!taskName.trim()) {
      Alert.alert('Error', 'Task name cannot be empty');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({
      ...task,
      task: taskName,
      timeEstimate: timeEstimate || undefined,
      notes: notes || undefined,
      priority,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete();
            onClose();
          },
        },
      ]
    );
  };

  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSubtask: TaskItem = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      task: newSubtaskText,
      completed: false,
    };
    setSubtasks([...subtasks, newSubtask]);
    setNewSubtaskText('');
  };

  const handleRemoveSubtask = (subtaskId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSubtasks(subtasks.filter((st) => st.id !== subtaskId));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Edit Task</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.label}>Task Name</Text>
            <TextInput
              style={styles.input}
              value={taskName}
              onChangeText={setTaskName}
              placeholder="Enter task name"
              placeholderTextColor={Colors.textMuted}
              multiline
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>
              <Clock size={14} color={Colors.textMuted} /> Time Estimate
            </Text>
            <TextInput
              style={styles.input}
              value={timeEstimate}
              onChangeText={setTimeEstimate}
              placeholder="e.g., 30 mins, 1 hour"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Priority</Text>
            <View style={styles.priorityRow}>
              {(['high', 'medium', 'low'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityButton,
                    priority === p && styles.priorityButtonActive,
                    priority === p && p === 'high' && { backgroundColor: '#FEE2E2', borderColor: '#EF4444' },
                    priority === p && p === 'medium' && { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' },
                    priority === p && p === 'low' && { backgroundColor: '#DBEAFE', borderColor: '#3B82F6' },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPriority(p);
                  }}
                >
                  <Text
                    style={[
                      styles.priorityText,
                      priority === p && styles.priorityTextActive,
                    ]}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>
              <FileText size={14} color={Colors.textMuted} /> Notes
            </Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any additional details..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Subtasks</Text>
            {subtasks.map((subtask) => (
              <View key={subtask.id} style={styles.subtaskRow}>
                <Text style={styles.subtaskText}>{subtask.task}</Text>
                <TouchableOpacity onPress={() => handleRemoveSubtask(subtask.id)}>
                  <X size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.addSubtaskRow}>
              <TextInput
                style={styles.subtaskInput}
                value={newSubtaskText}
                onChangeText={setNewSubtaskText}
                placeholder="Add subtask..."
                placeholderTextColor={Colors.textMuted}
                onSubmitEditing={handleAddSubtask}
                returnKeyType="done"
              />
              <TouchableOpacity onPress={handleAddSubtask} style={styles.addButton}>
                <Plus size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Trash2 size={20} color={Colors.error} />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  closeButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    alignItems: 'center',
  },
  priorityButtonActive: {
    borderWidth: 3,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  priorityTextActive: {
    fontWeight: '800' as const,
    color: Colors.text,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  subtaskText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  addSubtaskRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  subtaskInput: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  addButton: {
    padding: 12,
    backgroundColor: Colors.accent1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    borderWidth: 3,
    borderColor: Colors.border,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.error,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.border,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.background,
  },
});
