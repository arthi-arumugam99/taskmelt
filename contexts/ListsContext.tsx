import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback } from 'react';
import { List } from '@/types/dump';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'taskmelt_lists';

async function loadLocalLists(): Promise<List[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.log('Error loading local lists:', error);
    return [];
  }
}

async function saveLocalLists(lists: List[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
  } catch (error) {
    console.log('Error saving local lists:', error);
  }
}

const [useLists, Provider] = createContextHook(() => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Load lists
  const { data: lists = [], isLoading } = useQuery({
    queryKey: ['lists', user?.id],
    queryFn: async () => {
      if (!user) {
        return await loadLocalLists();
      }

      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .eq('user_id', user.id)
        .order('order', { ascending: true });

      if (error) throw error;

      const formattedLists: List[] = data.map((l) => ({
        id: l.id,
        name: l.name,
        emoji: l.emoji,
        color: l.color,
        description: l.description,
        taskIds: l.task_ids || [],
        order: l.order,
        createdAt: l.created_at,
      }));

      await saveLocalLists(formattedLists);
      return formattedLists;
    },
    enabled: true,
  });

  // Create list
  const createListMutation = useMutation({
    mutationFn: async ({
      name,
      emoji,
      color,
      description,
    }: {
      name: string;
      emoji?: string;
      color?: string;
      description?: string;
    }) => {
      const newList: List = {
        id: `list-${Date.now()}`,
        name,
        emoji,
        color,
        description,
        taskIds: [],
        order: lists.length,
        createdAt: new Date().toISOString(),
      };

      if (user) {
        const { error } = await supabase.from('lists').insert({
          id: newList.id,
          user_id: user.id,
          name: newList.name,
          emoji: newList.emoji,
          color: newList.color,
          description: newList.description,
          task_ids: [],
          order: newList.order,
        });

        if (error) throw error;
      }

      const updatedLists = [...lists, newList];
      await saveLocalLists(updatedLists);
      return updatedLists;
    },
    onSuccess: (updatedLists) => {
      queryClient.setQueryData(['lists', user?.id], updatedLists);
    },
  });

  // Update list
  const updateListMutation = useMutation({
    mutationFn: async (list: List) => {
      if (user) {
        const { error } = await supabase
          .from('lists')
          .update({
            name: list.name,
            emoji: list.emoji,
            color: list.color,
            description: list.description,
            task_ids: list.taskIds,
            order: list.order,
          })
          .eq('id', list.id)
          .eq('user_id', user.id);

        if (error) throw error;
      }

      const updatedLists = lists.map((l) => (l.id === list.id ? list : l));
      await saveLocalLists(updatedLists);
      return updatedLists;
    },
    onSuccess: (updatedLists) => {
      queryClient.setQueryData(['lists', user?.id], updatedLists);
    },
  });

  // Delete list
  const deleteListMutation = useMutation({
    mutationFn: async (listId: string) => {
      if (user) {
        const { error } = await supabase
          .from('lists')
          .delete()
          .eq('id', listId)
          .eq('user_id', user.id);

        if (error) throw error;
      }

      const updatedLists = lists.filter((l) => l.id !== listId);
      await saveLocalLists(updatedLists);
      return updatedLists;
    },
    onSuccess: (updatedLists) => {
      queryClient.setQueryData(['lists', user?.id], updatedLists);
    },
  });

  // Add task to list
  const addTaskToListMutation = useMutation({
    mutationFn: async ({ listId, taskId }: { listId: string; taskId: string }) => {
      const list = lists.find((l) => l.id === listId);
      if (!list) throw new Error('List not found');

      const updatedList = {
        ...list,
        taskIds: [...list.taskIds, taskId],
      };

      if (user) {
        const { error } = await supabase
          .from('lists')
          .update({ task_ids: updatedList.taskIds })
          .eq('id', listId)
          .eq('user_id', user.id);

        if (error) throw error;
      }

      const updatedLists = lists.map((l) => (l.id === listId ? updatedList : l));
      await saveLocalLists(updatedLists);
      return updatedLists;
    },
    onSuccess: (updatedLists) => {
      queryClient.setQueryData(['lists', user?.id], updatedLists);
    },
  });

  // Remove task from list
  const removeTaskFromListMutation = useMutation({
    mutationFn: async ({ listId, taskId }: { listId: string; taskId: string }) => {
      const list = lists.find((l) => l.id === listId);
      if (!list) throw new Error('List not found');

      const updatedList = {
        ...list,
        taskIds: list.taskIds.filter((id) => id !== taskId),
      };

      if (user) {
        const { error } = await supabase
          .from('lists')
          .update({ task_ids: updatedList.taskIds })
          .eq('id', listId)
          .eq('user_id', user.id);

        if (error) throw error;
      }

      const updatedLists = lists.map((l) => (l.id === listId ? updatedList : l));
      await saveLocalLists(updatedLists);
      return updatedLists;
    },
    onSuccess: (updatedLists) => {
      queryClient.setQueryData(['lists', user?.id], updatedLists);
    },
  });

  const createList = useCallback(
    (name: string, emoji?: string, description?: string, color?: string) => {
      createListMutation.mutate({ name, emoji, color, description });
    },
    [createListMutation]
  );

  const updateList = useCallback(
    (list: List) => {
      updateListMutation.mutate(list);
    },
    [updateListMutation]
  );

  const deleteList = useCallback(
    (listId: string) => {
      deleteListMutation.mutate(listId);
    },
    [deleteListMutation]
  );

  const addTaskToList = useCallback(
    (listId: string, taskId: string) => {
      addTaskToListMutation.mutate({ listId, taskId });
    },
    [addTaskToListMutation]
  );

  const removeTaskFromList = useCallback(
    (listId: string, taskId: string) => {
      removeTaskFromListMutation.mutate({ listId, taskId });
    },
    [removeTaskFromListMutation]
  );

  const getListById = useCallback(
    (listId: string) => {
      return lists.find((l) => l.id === listId);
    },
    [lists]
  );

  return {
    lists,
    isLoading,
    createList,
    updateList,
    deleteList,
    addTaskToList,
    removeTaskFromList,
    getListById,
  };
});

export { useLists, Provider as ListsProvider };
