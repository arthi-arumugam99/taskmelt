export interface TaskItem {
  id: string;
  task: string;
  original?: string;
  timeEstimate?: string;
  completed: boolean;
  completedAt?: string;
}

export interface Category {
  name: string;
  emoji: string;
  color: string;
  items: TaskItem[];
}

export interface DumpSession {
  id: string;
  rawText: string;
  categories: Category[];
  createdAt: string;
  summary?: string;
}
