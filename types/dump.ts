export interface TaskItem {
  id: string;
  task: string;
  original?: string;
  scheduledDate?: string;
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
  // New organizational features
  folderId?: string;
  listIds?: string[];
  tags?: string[];
  // Eisenhower Matrix
  eisenhower?: {
    urgent: boolean;
    important: boolean;
  };
  // Pomodoro tracking
  pomodorosCompleted?: number;
  pomodorosEstimated?: number;
  // Time tracking
  timeTracking?: {
    startedAt?: string;
    pausedAt?: string;
    totalTimeSpent?: number; // in seconds
    sessions?: TimeSession[];
  };
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

// New organizational types
export interface Folder {
  id: string;
  name: string;
  emoji?: string;
  color?: string;
  parentId?: string; // for nested folders
  order: number;
  createdAt: string;
}

export interface List {
  id: string;
  name: string;
  emoji?: string;
  color?: string;
  description?: string;
  taskIds: string[];
  createdAt: string;
  order: number;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
}

// Time tracking types
export interface TimeSession {
  id: string;
  startedAt: string;
  endedAt?: string;
  duration: number; // in seconds
  pausedDuration?: number; // in seconds
  taskId: string;
  type: 'pomodoro' | 'manual' | 'auto';
}

export interface PomodoroSession {
  id: string;
  taskId?: string;
  startedAt: string;
  endedAt?: string;
  duration: number; // 25 minutes standard
  type: 'work' | 'shortBreak' | 'longBreak';
  completed: boolean;
  interrupted: boolean;
}

export interface ProductivityStats {
  date: string;
  totalTimeSpent: number; // in seconds
  tasksCompleted: number;
  pomodorosCompleted: number;
  focusScore: number; // 0-100
  mostProductiveHour?: number; // 0-23
}

// Eisenhower Matrix quadrants
export type EisenhowerQuadrant =
  | 'urgent-important'      // Do First
  | 'not-urgent-important'  // Schedule
  | 'urgent-not-important'  // Delegate
  | 'not-urgent-not-important'; // Eliminate

export interface EisenhowerMatrix {
  urgentImportant: TaskItem[];
  notUrgentImportant: TaskItem[];
  urgentNotImportant: TaskItem[];
  notUrgentNotImportant: TaskItem[];
}
