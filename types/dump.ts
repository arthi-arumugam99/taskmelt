export interface TaskItem {
  id: string;
  task: string;
  original?: string;
  timeEstimate?: string;
  completed: boolean;
  completedAt?: string;
  subtasks?: TaskItem[];
  hasSubtaskSuggestion?: boolean;
  isExpanded?: boolean;
  isReflection?: boolean;
  closesLoop?: boolean;
}

export interface Category {
  name: string;
  emoji: string;
  color: string;
  items: TaskItem[];
  priority?: 'high' | 'medium' | 'low';
}

export interface DumpSession {
  id: string;
  rawText: string;
  categories: Category[];
  createdAt: string;
  summary?: string;
  reflectionInsight?: string;
}
