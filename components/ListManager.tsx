import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, FlatList, Modal } from 'react-native';
import { List as ListIcon, Plus, Edit2, Trash2, X, GripVertical } from 'lucide-react-native';
import { List } from '@/types/dump';

interface ListManagerProps {
  lists: List[];
  selectedListId?: string;
  onListSelect?: (listId: string) => void;
  onCreateList?: (name: string, emoji?: string, description?: string) => void;
  onUpdateList?: (list: List) => void;
  onDeleteList?: (listId: string) => void;
}

const LIST_EMOJIS = ['📝', '✅', '🎯', '⭐', '🔥', '💡', '🚀', '📌', '🎨', '🌈'];
const LIST_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DFE6E9', '#A29BFE'];

export default function ListManager({
  lists,
  selectedListId,
  onListSelect,
  onCreateList,
  onUpdateList,
  onDeleteList,
}: ListManagerProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingList, setEditingList] = useState<List | null>(null);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(LIST_EMOJIS[0]);
  const [selectedColor, setSelectedColor] = useState(LIST_COLORS[0]);

  const handleCreateList = () => {
    if (newListName.trim() && onCreateList) {
      onCreateList(newListName.trim(), selectedEmoji, newListDescription.trim() || undefined);
      resetForm();
    }
  };

  const handleUpdateList = () => {
    if (editingList && newListName.trim() && onUpdateList) {
      onUpdateList({
        ...editingList,
        name: newListName.trim(),
        emoji: selectedEmoji,
        color: selectedColor,
        description: newListDescription.trim() || undefined,
      });
      resetForm();
    }
  };

  const resetForm = () => {
    setNewListName('');
    setNewListDescription('');
    setSelectedEmoji(LIST_EMOJIS[0]);
    setSelectedColor(LIST_COLORS[0]);
    setEditingList(null);
    setShowCreateModal(false);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (list: List) => {
    setEditingList(list);
    setNewListName(list.name);
    setNewListDescription(list.description || '');
    setSelectedEmoji(list.emoji || LIST_EMOJIS[0]);
    setSelectedColor(list.color || LIST_COLORS[0]);
    setShowCreateModal(true);
  };

  const renderListItem = ({ item }: { item: List }) => {
    const isSelected = selectedListId === item.id;
    const taskCount = item.taskIds?.length || 0;

    return (
      <Pressable
        onPress={() => onListSelect?.(item.id)}
        style={[styles.listItem, isSelected && styles.listItemSelected]}
      >
        <View style={[styles.listIconContainer, { backgroundColor: item.color || LIST_COLORS[0] }]}>
          <Text style={styles.listEmoji}>{item.emoji || '📝'}</Text>
        </View>

        <View style={styles.listContent}>
          <Text style={styles.listName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.description && (
            <Text style={styles.listDescription} numberOfLines={1}>
              {item.description}
            </Text>
          )}
        </View>

        <View style={styles.taskCount}>
          <Text style={styles.taskCountText}>{taskCount}</Text>
        </View>

        <View style={styles.listActions}>
          <Pressable onPress={() => openEditModal(item)} style={styles.actionButton}>
            <Edit2 size={16} color="#666" />
          </Pressable>
          <Pressable onPress={() => onDeleteList?.(item.id)} style={styles.actionButton}>
            <Trash2 size={16} color="#FF6B6B" />
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ListIcon size={20} color="#666" />
          <Text style={styles.title}>Lists</Text>
        </View>
        <Pressable onPress={openCreateModal} style={styles.addButton}>
          <Plus size={20} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={lists}
        keyExtractor={(item) => item.id}
        renderItem={renderListItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No lists yet. Create your first list!</Text>
        }
      />

      {/* Create/Edit Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={resetForm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingList ? 'Edit List' : 'New List'}
              </Text>
              <Pressable onPress={resetForm}>
                <X size={24} color="#666" />
              </Pressable>
            </View>

            <TextInput
              value={newListName}
              onChangeText={setNewListName}
              placeholder="List name"
              style={styles.input}
              placeholderTextColor="#999"
              autoFocus
            />

            <TextInput
              value={newListDescription}
              onChangeText={setNewListDescription}
              placeholder="Description (optional)"
              style={[styles.input, styles.textArea]}
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Choose emoji:</Text>
            <View style={styles.emojiGrid}>
              {LIST_EMOJIS.map((emoji) => (
                <Pressable
                  key={emoji}
                  onPress={() => setSelectedEmoji(emoji)}
                  style={[
                    styles.emojiOption,
                    selectedEmoji === emoji && styles.emojiOptionSelected,
                  ]}
                >
                  <Text style={styles.emoji}>{emoji}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Choose color:</Text>
            <View style={styles.colorGrid}>
              {LIST_COLORS.map((color) => (
                <Pressable
                  key={color}
                  onPress={() => setSelectedColor(color)}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorOptionSelected,
                  ]}
                />
              ))}
            </View>

            <Pressable
              onPress={editingList ? handleUpdateList : handleCreateList}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>
                {editingList ? 'Update List' : 'Create List'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    padding: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listItemSelected: {
    backgroundColor: '#f0f8ff',
    borderWidth: 2,
    borderColor: '#4ECDC4',
  },
  listIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listEmoji: {
    fontSize: 24,
  },
  listContent: {
    flex: 1,
  },
  listName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  listDescription: {
    fontSize: 14,
    color: '#666',
  },
  taskCount: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  listActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    padding: 40,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  emojiOption: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiOptionSelected: {
    borderColor: '#333',
  },
  emoji: {
    fontSize: 28,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 30,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#333',
  },
  saveButton: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
