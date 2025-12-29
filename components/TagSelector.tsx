import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, FlatList } from 'react-native';
import { Tag as TagIcon, Plus, X } from 'lucide-react-native';
import { Tag } from '@/types/dump';

interface TagSelectorProps {
  selectedTags: string[];
  availableTags: Tag[];
  onTagsChange: (tags: string[]) => void;
  onCreateTag?: (name: string, color?: string) => void;
}

const TAG_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DFE6E9', '#A29BFE', '#FD79A8', '#FDCB6E', '#6C5CE7',
];

export default function TagSelector({
  selectedTags,
  availableTags,
  onTagsChange,
  onCreateTag,
}: TagSelectorProps) {
  const [newTagName, setNewTagName] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);

  const handleToggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter((id) => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  const handleCreateTag = () => {
    if (newTagName.trim() && onCreateTag) {
      onCreateTag(newTagName.trim(), selectedColor);
      setNewTagName('');
      setShowColorPicker(false);
      setSelectedColor(TAG_COLORS[0]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TagIcon size={20} color="#666" />
        <Text style={styles.title}>Tags</Text>
      </View>

      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <View style={styles.selectedTags}>
          {selectedTags.map((tagId) => {
            const tag = availableTags.find((t) => t.id === tagId);
            if (!tag) return null;

            return (
              <Pressable
                key={tag.id}
                onPress={() => handleToggleTag(tag.id)}
                style={[styles.tag, { backgroundColor: tag.color || '#666' }]}
              >
                <Text style={styles.tagText}>{tag.name}</Text>
                <X size={14} color="#fff" />
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Available tags */}
      <FlatList
        data={availableTags.filter((tag) => !selectedTags.includes(tag.id))}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.availableTags}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleToggleTag(item.id)}
            style={[styles.tag, { backgroundColor: item.color || '#666', opacity: 0.7 }]}
          >
            <Text style={styles.tagText}>{item.name}</Text>
          </Pressable>
        )}
      />

      {/* Create new tag */}
      {onCreateTag && (
        <View style={styles.createTagSection}>
          <View style={styles.inputRow}>
            <TextInput
              value={newTagName}
              onChangeText={setNewTagName}
              placeholder="New tag name..."
              style={styles.input}
              placeholderTextColor="#999"
            />
            <Pressable
              onPress={() => setShowColorPicker(!showColorPicker)}
              style={[styles.colorButton, { backgroundColor: selectedColor }]}
            />
            <Pressable onPress={handleCreateTag} style={styles.createButton}>
              <Plus size={20} color="#fff" />
            </Pressable>
          </View>

          {showColorPicker && (
            <View style={styles.colorPicker}>
              {TAG_COLORS.map((color) => (
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
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  availableTags: {
    gap: 8,
    paddingVertical: 5,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  createTagSection: {
    gap: 10,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  colorButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#333',
    borderWidth: 3,
  },
});
