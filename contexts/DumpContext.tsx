import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useMemo, useEffect } from 'react';
import { DumpSession } from '@/types/dump';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'taskmelt_dumps';
const LIFETIME_COUNT_KEY = 'taskmelt_lifetime_dump_count';
const FREE_USER_DUMP_LIMIT = 3;

async function loadLocalDumps(): Promise<DumpSession[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (parseError) {
        console.log('Error parsing stored dumps, clearing corrupted data:', parseError);
        console.log('Corrupted value:', stored?.substring(0, 100));
        await AsyncStorage.removeItem(STORAGE_KEY);
        return [];
      }
    }
    return [];
  } catch (error) {
    console.log('Error loading local dumps:', error);
    return [];
  }
}

async function saveLocalDumps(dumps: DumpSession[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dumps));
  } catch (error) {
    console.log('Error saving local dumps:', error);
  }
}

async function getLifetimeDumpCount(): Promise<number> {
  try {
    const count = await AsyncStorage.getItem(LIFETIME_COUNT_KEY);
    if (!count) return 0;
    const parsed = parseInt(count, 10);
    if (isNaN(parsed)) {
      console.log('Invalid lifetime count, resetting:', count);
      await AsyncStorage.removeItem(LIFETIME_COUNT_KEY);
      return 0;
    }
    return parsed;
  } catch (error) {
    console.log('Error getting lifetime dump count:', error);
    return 0;
  }
}

async function incrementLifetimeDumpCount(): Promise<number> {
  try {
    const current = await getLifetimeDumpCount();
    const newCount = current + 1;
    await AsyncStorage.setItem(LIFETIME_COUNT_KEY, newCount.toString());
    console.log('Lifetime dump count incremented to:', newCount);
    return newCount;
  } catch (error) {
    console.log('Error incrementing lifetime dump count:', error);
    return 0;
  }
}

async function loadRemoteDumps(userId: string): Promise<DumpSession[]> {
  if (!supabase) {
    console.log('Sync: Supabase not available, skipping remote load');
    return [];
  }
  
  try {
    console.log('Sync: Loading remote dumps for user:', userId);
    const { data, error } = await supabase
      .from('dumps')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Sync: Error loading remote dumps:', error);
      return [];
    }

    console.log('Sync: Loaded', data?.length ?? 0, 'remote dumps');
    return (data ?? []).map((row) => ({
      id: row.id,
      rawText: row.raw_text,
      categories: row.categories,
      createdAt: row.created_at,
      summary: row.summary,
      reflectionInsight: row.reflection_insight,
    }));
  } catch (error) {
    console.log('Sync: Error loading remote dumps:', error);
    return [];
  }
}

async function saveRemoteDump(userId: string, dump: DumpSession): Promise<void> {
  if (!supabase) {
    console.log('Sync: Supabase not available, skipping remote save');
    return;
  }
  
  try {
    console.log('Sync: Saving dump to remote:', dump.id);
    const { error } = await supabase.from('dumps').upsert({
      id: dump.id,
      user_id: userId,
      raw_text: dump.rawText,
      categories: dump.categories,
      created_at: dump.createdAt,
      summary: dump.summary,
      reflection_insight: dump.reflectionInsight,
    });

    if (error) {
      console.log('Sync: Error saving remote dump:', error);
    } else {
      console.log('Sync: Dump saved to remote successfully');
    }
  } catch (error) {
    console.log('Sync: Error saving remote dump:', error);
  }
}

async function deleteRemoteDump(userId: string, dumpId: string): Promise<void> {
  if (!supabase) {
    console.log('Sync: Supabase not available, skipping remote delete');
    return;
  }
  
  try {
    console.log('Sync: Deleting remote dump:', dumpId);
    const { error } = await supabase
      .from('dumps')
      .delete()
      .eq('id', dumpId)
      .eq('user_id', userId);

    if (error) {
      console.log('Sync: Error deleting remote dump:', error);
    }
  } catch (error) {
    console.log('Sync: Error deleting remote dump:', error);
  }
}

async function clearRemoteDumps(userId: string): Promise<void> {
  if (!supabase) {
    console.log('Sync: Supabase not available, skipping remote clear');
    return;
  }
  
  try {
    console.log('Sync: Clearing all remote dumps for user:', userId);
    const { error } = await supabase
      .from('dumps')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.log('Sync: Error clearing remote dumps:', error);
    }
  } catch (error) {
    console.log('Sync: Error clearing remote dumps:', error);
  }
}

function mergeDumps(local: DumpSession[], remote: DumpSession[]): DumpSession[] {
  const merged = new Map<string, DumpSession>();
  
  remote.forEach((dump) => merged.set(dump.id, dump));
  local.forEach((dump) => {
    if (!merged.has(dump.id)) {
      merged.set(dump.id, dump);
    }
  });

  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export const [DumpProvider, useDumps] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const lifetimeCountQuery = useQuery({
    queryKey: ['lifetimeDumpCount'],
    queryFn: getLifetimeDumpCount,
    staleTime: Infinity,
  });

  const lifetimeDumpCount = lifetimeCountQuery.data ?? 0;

  const dumpQueryKey = useMemo(
    () => ['dumps', user?.id ?? 'local', isAuthenticated] as const,
    [user?.id, isAuthenticated]
  );

  const dumpsQuery = useQuery({
    queryKey: dumpQueryKey,
    queryFn: async () => {
      const localDumps = await loadLocalDumps();
      
      if (isAuthenticated && user?.id) {
        const remoteDumps = await loadRemoteDumps(user.id);
        const merged = mergeDumps(localDumps, remoteDumps);
        
        const localOnlyDumps = localDumps.filter(
          (local) => !remoteDumps.some((remote) => remote.id === local.id)
        );
        
        if (localOnlyDumps.length > 0) {
          console.log('Sync: Uploading', localOnlyDumps.length, 'local-only dumps to remote');
          await Promise.all(
            localOnlyDumps.map((dump) => saveRemoteDump(user.id, dump))
          );
        }
        
        await saveLocalDumps(merged);
        return merged;
      }
      
      return localDumps;
    },
    staleTime: 1000 * 60 * 5,
  });

  const dumps = useMemo(() => dumpsQuery.data ?? [], [dumpsQuery.data]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      queryClient.invalidateQueries({ queryKey: dumpQueryKey });
    }
  }, [isAuthenticated, user?.id, queryClient, dumpQueryKey]);

  const { mutate: addDumpMutate } = useMutation({
    mutationFn: async (newDump: DumpSession) => {
      const currentDumps = queryClient.getQueryData<DumpSession[]>(dumpQueryKey) ?? [];
      const updated = [newDump, ...currentDumps];
      
      await saveLocalDumps(updated);
      await incrementLifetimeDumpCount();
      
      if (isAuthenticated && user?.id) {
        await saveRemoteDump(user.id, newDump);
      }
      
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(dumpQueryKey, data);
      queryClient.invalidateQueries({ queryKey: ['lifetimeDumpCount'] });
    },
  });

  const { mutate: toggleTaskMutate } = useMutation({
    mutationFn: async ({ dumpId, taskId }: { dumpId: string; taskId: string }) => {
      const currentDumps = queryClient.getQueryData<DumpSession[]>(dumpQueryKey) ?? [];
      let updatedDump: DumpSession | null = null;
      
      const updated = currentDumps.map((dump) => {
        if (dump.id !== dumpId) return dump;
        const newDump = {
          ...dump,
          categories: dump.categories.map((category) => ({
            ...category,
            items: category.items.map((item) => {
              if (item.id === taskId) {
                const newCompletedState = !item.completed;
                return {
                  ...item,
                  completed: newCompletedState,
                  completedAt: newCompletedState ? new Date().toISOString() : undefined,
                  subtasks: item.subtasks?.map(subtask => ({
                    ...subtask,
                    completed: newCompletedState,
                    completedAt: newCompletedState ? new Date().toISOString() : undefined,
                  })),
                };
              }
              if (item.subtasks) {
                const subtaskIndex = item.subtasks.findIndex(st => st.id === taskId);
                if (subtaskIndex !== -1) {
                  const updatedSubtasks = item.subtasks.map((st) => {
                    if (st.id === taskId) {
                      const newCompletedState = !st.completed;
                      return {
                        ...st,
                        completed: newCompletedState,
                        completedAt: newCompletedState ? new Date().toISOString() : undefined,
                      };
                    }
                    return st;
                  });
                  
                  const allSubtasksComplete = updatedSubtasks.every(st => st.completed);
                  
                  return {
                    ...item,
                    subtasks: updatedSubtasks,
                    completed: allSubtasksComplete,
                    completedAt: allSubtasksComplete ? new Date().toISOString() : undefined,
                  };
                }
              }
              return item;
            }),
          })),
        };
        updatedDump = newDump;
        return newDump;
      });
      
      await saveLocalDumps(updated);
      
      if (isAuthenticated && user?.id && updatedDump) {
        await saveRemoteDump(user.id, updatedDump);
      }
      
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(dumpQueryKey, data);
    },
  });

  const { mutate: deleteDumpMutate } = useMutation({
    mutationFn: async (dumpId: string) => {
      const currentDumps = queryClient.getQueryData<DumpSession[]>(dumpQueryKey) ?? [];
      const updated = currentDumps.filter((d) => d.id !== dumpId);
      
      await saveLocalDumps(updated);
      
      if (isAuthenticated && user?.id) {
        await deleteRemoteDump(user.id, dumpId);
      }
      
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(dumpQueryKey, data);
    },
  });

  const { mutate: clearAllMutate } = useMutation({
    mutationFn: async () => {
      await saveLocalDumps([]);
      
      if (isAuthenticated && user?.id) {
        await clearRemoteDumps(user.id);
      }
      
      return [];
    },
    onSuccess: () => {
      queryClient.setQueryData(dumpQueryKey, []);
    },
  });

  const addDump = useCallback(
    (dump: DumpSession) => {
      addDumpMutate(dump);
    },
    [addDumpMutate]
  );

  const toggleTask = useCallback(
    (dumpId: string, taskId: string) => {
      toggleTaskMutate({ dumpId, taskId });
    },
    [toggleTaskMutate]
  );

  const deleteDump = useCallback(
    (dumpId: string) => {
      deleteDumpMutate(dumpId);
    },
    [deleteDumpMutate]
  );

  const clearAll = useCallback(() => {
    clearAllMutate();
  }, [clearAllMutate]);

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: dumpQueryKey });
  }, [queryClient, dumpQueryKey]);

  const latestDump = useMemo(() => dumps[0] ?? null, [dumps]);

  const todaysDumps = useMemo(() => {
    const today = new Date().toDateString();
    return dumps.filter((d) => new Date(d.createdAt).toDateString() === today);
  }, [dumps]);

  const canCreateDump = useCallback((isProUser: boolean) => {
    if (isProUser) return true;
    return lifetimeDumpCount < FREE_USER_DUMP_LIMIT;
  }, [lifetimeDumpCount]);

  const remainingFreeDumps = useMemo(() => {
    return Math.max(0, FREE_USER_DUMP_LIMIT - lifetimeDumpCount);
  }, [lifetimeDumpCount]);

  return {
    dumps,
    latestDump,
    todaysDumps,
    isLoading: dumpsQuery.isLoading,
    isSyncing: dumpsQuery.isFetching,
    addDump,
    toggleTask,
    deleteDump,
    clearAll,
    refetch,
    lifetimeDumpCount,
    canCreateDump,
    remainingFreeDumps,
    FREE_USER_DUMP_LIMIT,
  };
});
