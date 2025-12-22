export type CategoryType = 'doNow' | 'today' | 'thisWeek' | 'someday' | 'notActionable';

export interface TaskItem {
  id: string;
  task: string;
  original?: string;
  timeEstimate?: string;
  completed: boolean;
  completedAt?: string;
}

export interface Category {
  type: CategoryType;
  name: string;
  emoji: string;
  items: TaskItem[];
}

export interface DumpSession {
  id: string;
  rawText: string;
  categories: Category[];
  createdAt: string;
  summary?: string;
}

export interface OrganizedResult {
  categories: {
    type: CategoryType;
    name: string;
    emoji: string;
    items: {
      task: string;
      original?: string;
      timeEstimate?: string;
    }[];
  }[];
  summary: string;
}

export const CATEGORY_CONFIG: Record<CategoryType, { name: string; emoji: string }> = {
  doNow: { name: 'Do Now', emoji: '🔴' },
  today: { name: 'Today', emoji: '🟠' },
  thisWeek: { name: 'This Week', emoji: '🟡' },
  someday: { name: 'Someday', emoji: '🟢' },
  notActionable: { name: 'Not Actionable', emoji: '💭' },
};
