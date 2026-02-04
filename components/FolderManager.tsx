import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, FlatList, Modal } from 'react-native';
import { Folder as FolderIcon, Plus, Edit2, Trash2, ChevronRight, X } from 'lucide-react-native';
import { Folder } from '@/types/dump';

interface FolderManagerProps {
  folders: Folder[];
  selectedFolderId?: string;
  onFolderSelect?: (folderId: string) => void;
  onCreateFolder?: (name: string, emoji?: string, parentId?: string) => void;
  onUpdateFolder?: (folder: Folder) => void;
  onDeleteFolder?: (folderId: string) => void;
}

const FOLDER_EMOJIS = ['📁', '📂', '🗂️', '📋', '📝', '💼', '🏠', '💻', '🎯', '🌟'];
const FOLDER_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DFE6E9'];

export default function FolderManager({
  folders,
  selectedFolderId,
  onFolderSelect,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
}: FolderManagerProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(FOLDER_EMOJIS[0]);
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const handleCreateFolder = () => {
    if (newFolderName.trim() && onCreateFolder) {
      onCreateFolder(newFolderName.trim(), selectedEmoji);
      setNewFolderName('');
      setSelectedEmoji(FOLDER_EMOJIS[0]);
      setSelectedColor(FOLDER_COLORS[0]);
      setShowCreateModal(false);
    }
  };

  const handleUpdateFolder = () => {
    if (editingFolder && newFolderName.trim() && onUpdateFolder) {
      onUpdateFolder({
        ...editingFolder,
        name: newFolderName.trim(),
        emoji: selectedEmoji,
        color: selectedColor,
      });
      setEditingFolder(null);
      setNewFolderName('');
      setShowCreateModal(false);
    }
  };

  const openCreateModal = () => {
    setEditingFolder(null);
    setNewFolderName('');
    setSelectedEmoji(FOLDER_EMOJIS[0]);
    setSelectedColor(FOLDER_COLORS[0]);
    setShowCreateModal(true);
  };

  const openEditModal = (folder: Folder) => {
    setEditingFolder(folder);
    setNewFolderName(folder.name);
    setSelectedEmoji(folder.emoji || FOLDER_EMOJIS[0]);
    setSelectedColor(folder.color || FOLDER_COLORS[0]);
    setShowCreateModal(true);
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const getSubfolders = (parentId?: string) => {
    return folders.filter((f) => f.parentId === parentId);
  };

  const renderFolder = (folder: Folder, depth: number = 0) => {
    const subfolders = getSubfolders(folder.id);
    const hasSubfolders = subfolders.length > 0;
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;

    return (
      <View key={folder.id}>
        <Pressable
          onPress={() => onFolderSelect?.(folder.id)}
          style={[
            styles.folderItem,
            { paddingLeft: 15 + depth * 20 },
            isSelected && styles.folderItemSelected,
          ]}
        >
          {hasSubfolders && (
            <Pressable onPress={() => toggleFolder(folder.id)} style={styles.expandButton}>
              <ChevronRight
                size={16}
                color="#666"
                style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
              />
            </Pressable>
          )}

          <View
            style={[
              styles.folderIconContainer,
              { backgroundColor: folder.color || FOLDER_COLORS[0] },
            ]}
          >
            <Text style={styles.folderEmoji}>{folder.emoji || '📁'}</Text>
          </View>

          <Text style={styles.folderName} numberOfLines={1}>
            {folder.name}
          </Text>

          <View style={styles.folderActions}>
            <Pressable onPress={() => openEditModal(folder)} style={styles.actionButton}>
              <Edit2 size={16} color="#666" />
            </Pressable>
            <Pressable
              onPress={() => onDeleteFolder?.(folder.id)}
              style={styles.actionButton}
            >
              <Trash2 size={16} color="#FF6B6B" />
            </Pressable>
          </View>
        </Pressable>

        {isExpanded &&
          hasSubfolders &&
          subfolders.map((subfolder) => renderFolder(subfolder, depth + 1))}
      </View>
    );
  };

  const rootFolders = getSubfolders(undefined);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FolderIcon size={20} color="#666" />
          <Text style={styles.title}>Folders</Text>
        </View>
        <Pressable onPress={openCreateModal} style={styles.addButton}>
          <Plus size={20} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={rootFolders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderFolder(item)}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No folders yet. Create your first folder!</Text>
        }
      />

      {/* Create/Edit Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingFolder ? 'Edit Folder' : 'New Folder'}
              </Text>
              <Pressable onPress={() => setShowCreateModal(false)}>
                <X size={24} color="#666" />
              </Pressable>
            </View>

            <TextInput
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder="Folder name"
              style={styles.input}
              placeholderTextColor="#999"
              autoFocus
            />

            <Text style={styles.label}>Choose emoji:</Text>
            <View style={styles.emojiGrid}>
              {FOLDER_EMOJIS.map((emoji) => (
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
              {FOLDER_COLORS.map((color) => (
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
              onPress={editingFolder ? handleUpdateFolder : handleCreateFolder}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>
                {editingFolder ? 'Update Folder' : 'Create Folder'}
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
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    gap: 10,
  },
  folderItemSelected: {
    backgroundColor: '#f0f8ff',
  },
  expandButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderEmoji: {
    fontSize: 20,
  },
  folderName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  folderActions: {
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
    maxHeight: '80%',
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
    marginBottom: 20,
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
