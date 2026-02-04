import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback } from 'react';
import { Tag } from '@/types/dump';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'taskmelt_tags';

async function loadLocalTags(): Promise<Tag[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.log('Error loading local tags:', error);
    return [];
  }
}

async function saveLocalTags(tags: Tag[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
  } catch (error) {
    console.log('Error saving local tags:', error);
  }
}

const [useTags, Provider] = createContextHook(() => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Load tags
  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags', user?.id],
    queryFn: async () => {
      if (!user) {
        return await loadLocalTags();
      }

      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedTags: Tag[] = data.map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
        createdAt: t.created_at,
      }));

      await saveLocalTags(formattedTags);
      return formattedTags;
    },
    enabled: true,
  });

  // Create tag
  const createTagMutation = useMutation({
    mutationFn: async ({ name, color }: { name: string; color?: string }) => {
      const newTag: Tag = {
        id: `tag-${Date.now()}`,
        name,
        color,
        createdAt: new Date().toISOString(),
      };

      if (user) {
        const { error } = await supabase.from('tags').insert({
          id: newTag.id,
          user_id: user.id,
          name: newTag.name,
          color: newTag.color,
        });

        if (error) throw error;
      }

      const updatedTags = [...tags, newTag];
      await saveLocalTags(updatedTags);
      return updatedTags;
    },
    onSuccess: (updatedTags) => {
      queryClient.setQueryData(['tags', user?.id], updatedTags);
    },
  });

  // Update tag
  const updateTagMutation = useMutation({
    mutationFn: async (tag: Tag) => {
      if (user) {
        const { error } = await supabase
          .from('tags')
          .update({
            name: tag.name,
            color: tag.color,
          })
          .eq('id', tag.id)
          .eq('user_id', user.id);

        if (error) throw error;
      }

      const updatedTags = tags.map((t) => (t.id === tag.id ? tag : t));
      await saveLocalTags(updatedTags);
      return updatedTags;
    },
    onSuccess: (updatedTags) => {
      queryClient.setQueryData(['tags', user?.id], updatedTags);
    },
  });

  // Delete tag
  const deleteTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      if (user) {
        const { error } = await supabase
          .from('tags')
          .delete()
          .eq('id', tagId)
          .eq('user_id', user.id);

        if (error) throw error;
      }

      const updatedTags = tags.filter((t) => t.id !== tagId);
      await saveLocalTags(updatedTags);
      return updatedTags;
    },
    onSuccess: (updatedTags) => {
      queryClient.setQueryData(['tags', user?.id], updatedTags);
    },
  });

  const createTag = useCallback(
    (name: string, color?: string) => {
      createTagMutation.mutate({ name, color });
    },
    [createTagMutation]
  );

  const updateTag = useCallback(
    (tag: Tag) => {
      updateTagMutation.mutate(tag);
    },
    [updateTagMutation]
  );

  const deleteTag = useCallback(
    (tagId: string) => {
      deleteTagMutation.mutate(tagId);
    },
    [deleteTagMutation]
  );

  const getTagById = useCallback(
    (tagId: string) => {
      return tags.find((t) => t.id === tagId);
    },
    [tags]
  );

  const getTagsByIds = useCallback(
    (tagIds: string[]) => {
      return tags.filter((t) => tagIds.includes(t.id));
    },
    [tags]
  );

  return {
    tags,
    isLoading,
    createTag,
    updateTag,
    deleteTag,
    getTagById,
    getTagsByIds,
  };
});

export { useTags, Provider as TagsProvider };
