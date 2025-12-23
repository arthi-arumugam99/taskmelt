export interface TaskItem {
  id: string;
  task: string;
  original?: string;
  scheduledTime?: string;
  duration?: string;
  timeEstimate?: string;
  completed: boolean;
  completedAt?: string;
  subtasks?: TaskItem[];
  hasSubtaskSuggestion?: boolean;
  isExpanded?: boolean;
  isReflection?: boolean;
  closesLoop?: boolean;
  notes?: string;
  dueDate?: string;
  priority?: 'high' | 'medium' | 'low';
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[];
    dayOfMonth?: number;
  };
  order?: number;
  context?: 'home' | 'work' | 'errands' | 'computer' | 'phone' | 'anywhere';
  energyLevel?: 'high' | 'medium' | 'low';
  dependencies?: string[];
  postponedCount?: number;
  postponedAt?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  velocityScore?: number;
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
