import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { X, Plus, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { TASK_TEMPLATES } from '@/lib/aiScheduler';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TemplatesModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: string) => void;
}

export default function TemplatesModal({
  visible,
  onClose,
  onSelectTemplate,
}: TemplatesModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleSelectTemplate = (templateId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedTemplate(templateId);
  };

  const handleApply = () => {
    if (selectedTemplate) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      onSelectTemplate(selectedTemplate);
      setSelectedTemplate(null);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedTemplate(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Quick Templates</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Pre-made workflows to jumpstart your productivity
          </Text>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {TASK_TEMPLATES.map((template) => {
              const isSelected = selectedTemplate === template.id;
              const totalDuration = template.tasks.reduce((acc, task) => {
                const match = task.duration?.match(/(\d+)/);
                return acc + (match ? parseInt(match[1]) : 0);
              }, 0);

              return (
                <TouchableOpacity
                  key={template.id}
                  style={[
                    styles.templateCard,
                    isSelected && styles.templateCardSelected,
                  ]}
                  onPress={() => handleSelectTemplate(template.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.templateHeader}>
                    <View style={styles.templateTitleRow}>
                      <Text style={styles.templateEmoji}>{template.emoji}</Text>
                      <Text style={styles.templateName}>{template.name}</Text>
                    </View>
                    <View style={styles.durationBadge}>
                      <Clock size={14} color={Colors.textMuted} />
                      <Text style={styles.durationText}>{totalDuration}m</Text>
                    </View>
                  </View>

                  <View style={styles.tasksList}>
                    {template.tasks.map((task, index) => (
                      <View key={index} style={styles.taskPreview}>
                        <View style={styles.taskBullet} />
                        <Text style={styles.taskPreviewText}>{task.task}</Text>
                        {task.duration && (
                          <Text style={styles.taskDuration}>
                            {task.duration}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>

                  {isSelected && (
                    <View style={styles.selectedIndicator}>
                      <Text style={styles.selectedText}>✓ Selected</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.applyButton,
                !selectedTemplate && styles.applyButtonDisabled,
              ]}
              onPress={handleApply}
              disabled={!selectedTemplate}
            >
              <Plus size={20} color={Colors.background} />
              <Text style={styles.applyButtonText}>
                Apply Template
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: SCREEN_HEIGHT * 0.85,
    paddingTop: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  closeButton: {
    padding: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    paddingHorizontal: 20,
    marginBottom: 20,
    fontWeight: '500' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  templateCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  templateCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  templateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  templateEmoji: {
    fontSize: 28,
  },
  templateName: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
    flex: 1,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  durationText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  tasksList: {
    gap: 8,
  },
  taskPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  taskBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  taskPreviewText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600' as const,
    flex: 1,
  },
  taskDuration: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  selectedIndicator: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  footer: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: Colors.border,
  },
  applyButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 3,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  applyButtonDisabled: {
    backgroundColor: Colors.textMuted,
    opacity: 0.5,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.background,
  },
});
