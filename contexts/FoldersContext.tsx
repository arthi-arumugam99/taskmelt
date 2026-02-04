import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback } from 'react';
import { Folder } from '@/types/dump';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'taskmelt_folders';

async function loadLocalFolders(): Promise<Folder[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.log('Error loading local folders:', error);
    return [];
  }
}

async function saveLocalFolders(folders: Folder[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
  } catch (error) {
    console.log('Error saving local folders:', error);
  }
}

const [useFolders, Provider] = createContextHook(() => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Load folders
  const { data: folders = [], isLoading } = useQuery({
    queryKey: ['folders', user?.id],
    queryFn: async () => {
      if (!user) {
        return await loadLocalFolders();
      }

      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('order', { ascending: true });

      if (error) throw error;

      const formattedFolders: Folder[] = data.map((f) => ({
        id: f.id,
        name: f.name,
        emoji: f.emoji,
        color: f.color,
        parentId: f.parent_id,
        order: f.order,
        createdAt: f.created_at,
      }));

      await saveLocalFolders(formattedFolders);
      return formattedFolders;
    },
    enabled: true,
  });

  // Create folder
  const createFolderMutation = useMutation({
    mutationFn: async ({
      name,
      emoji,
      color,
      parentId,
    }: {
      name: string;
      emoji?: string;
      color?: string;
      parentId?: string;
    }) => {
      const newFolder: Folder = {
        id: `folder-${Date.now()}`,
        name,
        emoji,
        color,
        parentId,
        order: folders.length,
        createdAt: new Date().toISOString(),
      };

      if (user) {
        const { error } = await supabase.from('folders').insert({
          id: newFolder.id,
          user_id: user.id,
          name: newFolder.name,
          emoji: newFolder.emoji,
          color: newFolder.color,
          parent_id: newFolder.parentId,
          order: newFolder.order,
        });

        if (error) throw error;
      }

      const updatedFolders = [...folders, newFolder];
      await saveLocalFolders(updatedFolders);
      return updatedFolders;
    },
    onSuccess: (updatedFolders) => {
      queryClient.setQueryData(['folders', user?.id], updatedFolders);
    },
  });

  // Update folder
  const updateFolderMutation = useMutation({
    mutationFn: async (folder: Folder) => {
      if (user) {
        const { error } = await supabase
          .from('folders')
          .update({
            name: folder.name,
            emoji: folder.emoji,
            color: folder.color,
            parent_id: folder.parentId,
            order: folder.order,
          })
          .eq('id', folder.id)
          .eq('user_id', user.id);

        if (error) throw error;
      }

      const updatedFolders = folders.map((f) => (f.id === folder.id ? folder : f));
      await saveLocalFolders(updatedFolders);
      return updatedFolders;
    },
    onSuccess: (updatedFolders) => {
      queryClient.setQueryData(['folders', user?.id], updatedFolders);
    },
  });

  // Delete folder
  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: string) => {
      if (user) {
        const { error } = await supabase
          .from('folders')
          .delete()
          .eq('id', folderId)
          .eq('user_id', user.id);

        if (error) throw error;
      }

      const updatedFolders = folders.filter((f) => f.id !== folderId && f.parentId !== folderId);
      await saveLocalFolders(updatedFolders);
      return updatedFolders;
    },
    onSuccess: (updatedFolders) => {
      queryClient.setQueryData(['folders', user?.id], updatedFolders);
    },
  });

  const createFolder = useCallback(
    (name: string, emoji?: string, color?: string, parentId?: string) => {
      createFolderMutation.mutate({ name, emoji, color, parentId });
    },
    [createFolderMutation]
  );

  const updateFolder = useCallback(
    (folder: Folder) => {
      updateFolderMutation.mutate(folder);
    },
    [updateFolderMutation]
  );

  const deleteFolder = useCallback(
    (folderId: string) => {
      deleteFolderMutation.mutate(folderId);
    },
    [deleteFolderMutation]
  );

  const getFolderById = useCallback(
    (folderId: string) => {
      return folders.find((f) => f.id === folderId);
    },
    [folders]
  );

  const getSubfolders = useCallback(
    (parentId?: string) => {
      return folders.filter((f) => f.parentId === parentId);
    },
    [folders]
  );

  return {
    folders,
    isLoading,
    createFolder,
    updateFolder,
    deleteFolder,
    getFolderById,
    getSubfolders,
  };
});

export { useFolders, Provider as FoldersProvider };
