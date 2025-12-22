import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useMemo } from 'react';
import { DumpSession } from '@/types/dump';

const STORAGE_KEY = 'taskmelt_dumps';

async function loadDumps(): Promise<DumpSession[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.log('Error loading dumps:', error);
    return [];
  }
}

async function saveDumps(dumps: DumpSession[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dumps));
  } catch (error) {
    console.log('Error saving dumps:', error);
  }
}

export const [DumpProvider, useDumps] = createContextHook(() => {
  const queryClient = useQueryClient();

  const dumpsQuery = useQuery({
    queryKey: ['dumps'],
    queryFn: loadDumps,
    staleTime: Infinity,
  });

  const dumps = useMemo(() => dumpsQuery.data ?? [], [dumpsQuery.data]);

  const { mutate: addDumpMutate } = useMutation({
    mutationFn: async (newDump: DumpSession) => {
      const currentDumps = queryClient.getQueryData<DumpSession[]>(['dumps']) ?? [];
      const updated = [newDump, ...currentDumps];
      await saveDumps(updated);
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['dumps'], data);
    },
  });

  const { mutate: toggleTaskMutate } = useMutation({
    mutationFn: async ({ dumpId, taskId }: { dumpId: string; taskId: string }) => {
      const currentDumps = queryClient.getQueryData<DumpSession[]>(['dumps']) ?? [];
      const updated = currentDumps.map((dump) => {
        if (dump.id !== dumpId) return dump;
        return {
          ...dump,
          categories: dump.categories.map((category) => ({
            ...category,
            items: category.items.map((item) => {
              if (item.id !== taskId) return item;
              return {
                ...item,
                completed: !item.completed,
                completedAt: !item.completed ? new Date().toISOString() : undefined,
              };
            }),
          })),
        };
      });
      await saveDumps(updated);
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['dumps'], data);
    },
  });

  const { mutate: deleteDumpMutate } = useMutation({
    mutationFn: async (dumpId: string) => {
      const currentDumps = queryClient.getQueryData<DumpSession[]>(['dumps']) ?? [];
      const updated = currentDumps.filter((d) => d.id !== dumpId);
      await saveDumps(updated);
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['dumps'], data);
    },
  });

  const { mutate: clearAllMutate } = useMutation({
    mutationFn: async () => {
      await saveDumps([]);
      return [];
    },
    onSuccess: () => {
      queryClient.setQueryData(['dumps'], []);
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

  const latestDump = useMemo(() => dumps[0] ?? null, [dumps]);

  const todaysDumps = useMemo(() => {
    const today = new Date().toDateString();
    return dumps.filter((d) => new Date(d.createdAt).toDateString() === today);
  }, [dumps]);

  return {
    dumps,
    latestDump,
    todaysDumps,
    isLoading: dumpsQuery.isLoading,
    addDump,
    toggleTask,
    deleteDump,
    clearAll,
  };
});
