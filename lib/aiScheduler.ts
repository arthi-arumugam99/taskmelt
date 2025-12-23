import { generateObject, generateText } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import { TaskItem, DumpSession } from '@/types/dump';

export interface ScheduledTask extends TaskItem {
  suggestedTime?: string;
  suggestedContext?: string;
  energyMatch?: 'perfect' | 'good' | 'poor';
  blockedBy?: string[];
}

export interface TimeBlock {
  time: string;
  tasks: ScheduledTask[];
  energyLevel: 'high' | 'medium' | 'low';
  suggestedBreak?: boolean;
}

export interface WeeklyInsights {
  patterns: string[];
  productivityPeaks: string[];
  slowdowns: string[];
  categoryTrends: { category: string; trend: 'up' | 'down' | 'stable'; percentage: number }[];
  velocityTrend: 'accelerating' | 'stable' | 'slowing';
  suggestions: string[];
}

export async function scheduleTasksWithAI(
  tasks: TaskItem[],
  preferences: {
    workHoursStart: string;
    workHoursEnd: string;
    peakEnergyTimes: string[];
    lowEnergyTimes: string[];
  }
): Promise<TimeBlock[]> {
  try {
    const taskDescriptions = tasks
      .filter(t => !t.completed)
      .map(t => ({
        id: t.id,
        task: t.task,
        duration: t.duration || t.timeEstimate || 'unknown',
        priority: t.priority || 'medium',
        energyLevel: t.energyLevel || 'medium',
        context: t.context || 'anywhere',
        dependencies: t.dependencies || [],
      }));

    const result = await generateObject({
      messages: [
        {
          role: 'user',
          content: `You are an expert productivity scheduler. Schedule these tasks into optimal time blocks.

Work hours: ${preferences.workHoursStart} - ${preferences.workHoursEnd}
Peak energy times: ${preferences.peakEnergyTimes.join(', ')}
Low energy times: ${preferences.lowEnergyTimes.join(', ')}

Tasks to schedule:
${JSON.stringify(taskDescriptions, null, 2)}

Rules:
1. High-energy tasks (high energyLevel) should be scheduled during peak times
2. Low-energy tasks should be scheduled during low energy times
3. Respect dependencies - tasks should be scheduled after their dependencies
4. Group tasks by context when possible (e.g., all "errands" together)
5. Add breaks between intense tasks (3+ consecutive high-energy tasks)
6. Consider priority - high priority tasks get better time slots

Return a schedule with time blocks.`,
        },
      ],
      schema: z.object({
        timeBlocks: z.array(
          z.object({
            time: z.string().describe('Time in HH:MM format'),
            taskIds: z.array(z.string()),
            energyLevel: z.enum(['high', 'medium', 'low']),
            suggestedBreak: z.boolean().optional(),
          })
        ),
      }),
    });

    const timeBlocks: TimeBlock[] = result.timeBlocks.map(block => {
      const blockTasks = block.taskIds
        .map(id => tasks.find(t => t.id === id))
        .filter((t): t is TaskItem => t !== undefined)
        .map(t => ({
          ...t,
          suggestedTime: block.time,
          energyMatch: calculateEnergyMatch(t, block.energyLevel, preferences),
        }));

      return {
        time: block.time,
        tasks: blockTasks,
        energyLevel: block.energyLevel,
        suggestedBreak: block.suggestedBreak,
      };
    });

    return timeBlocks;
  } catch (error) {
    console.error('AI scheduling error:', error);
    return createFallbackSchedule(tasks, preferences);
  }
}

function calculateEnergyMatch(
  task: TaskItem,
  blockEnergy: 'high' | 'medium' | 'low',
  preferences: any
): 'perfect' | 'good' | 'poor' {
  const taskEnergy = task.energyLevel || 'medium';
  if (taskEnergy === blockEnergy) return 'perfect';
  if (Math.abs(['low', 'medium', 'high'].indexOf(taskEnergy) - ['low', 'medium', 'high'].indexOf(blockEnergy)) === 1) {
    return 'good';
  }
  return 'poor';
}

function createFallbackSchedule(tasks: TaskItem[], preferences: any): TimeBlock[] {
  const [startHour] = preferences.workHoursStart.split(':').map(Number);
  const blocks: TimeBlock[] = [];
  
  const incompleteTasks = tasks.filter(t => !t.completed);
  
  incompleteTasks.forEach((task, index) => {
    const hour = startHour + index;
    blocks.push({
      time: `${hour.toString().padStart(2, '0')}:00`,
      tasks: [{ ...task, suggestedTime: `${hour}:00` }],
      energyLevel: 'medium',
    });
  });
  
  return blocks;
}

export async function analyzeWeeklyPatterns(dumps: DumpSession[]): Promise<WeeklyInsights> {
  try {
    const completedTasks: any[] = [];
    const categoryStats: Record<string, { total: number; completed: number }> = {};
    
    dumps.forEach(dump => {
      const dumpDate = new Date(dump.createdAt);
      const daysSinceCreation = (Date.now() - dumpDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceCreation <= 7) {
        dump.categories.forEach(cat => {
          if (!categoryStats[cat.name]) {
            categoryStats[cat.name] = { total: 0, completed: 0 };
          }
          
          cat.items.forEach(item => {
            if (!item.isReflection) {
              categoryStats[cat.name].total++;
              if (item.completed) {
                categoryStats[cat.name].completed++;
                completedTasks.push({
                  task: item.task,
                  category: cat.name,
                  completedAt: item.completedAt,
                  duration: item.actualDuration || item.estimatedDuration,
                  scheduledTime: item.scheduledTime,
                });
              }
            }
          });
        });
      }
    });

    const analysisData = {
      completedTasks: completedTasks.slice(0, 50),
      categoryStats,
      totalCategories: Object.keys(categoryStats).length,
    };

    const insights = await generateObject({
      messages: [
        {
          role: 'user',
          content: `Analyze this week's productivity data and provide insights:

${JSON.stringify(analysisData, null, 2)}

Provide:
1. Patterns - what patterns do you see in task completion?
2. Productivity peaks - when is the user most productive?
3. Slowdowns - what's causing slowdowns?
4. Category trends - which life areas are getting attention/neglected?
5. Velocity trend - is the user speeding up, stable, or slowing down?
6. Actionable suggestions for next week

Be specific and data-driven.`,
        },
      ],
      schema: z.object({
        patterns: z.array(z.string()).describe('Key patterns observed'),
        productivityPeaks: z.array(z.string()).describe('When user is most productive'),
        slowdowns: z.array(z.string()).describe('What causes slowdowns'),
        categoryTrends: z.array(
          z.object({
            category: z.string(),
            trend: z.enum(['up', 'down', 'stable']),
            percentage: z.number(),
          })
        ),
        velocityTrend: z.enum(['accelerating', 'stable', 'slowing']),
        suggestions: z.array(z.string()).describe('Actionable suggestions'),
      }),
    });

    return insights;
  } catch (error) {
    console.error('Weekly analysis error:', error);
    return {
      patterns: ['Unable to analyze patterns'],
      productivityPeaks: [],
      slowdowns: [],
      categoryTrends: [],
      velocityTrend: 'stable',
      suggestions: ['Keep tracking your tasks to get insights'],
    };
  }
}

export async function suggestSmartPostpone(task: TaskItem, allTasks: TaskItem[]): Promise<{
  suggestedDate: string;
  suggestedTime: string;
  reason: string;
}> {
  try {
    const result = await generateText({
      messages: [
        {
          role: 'user',
          content: `This task is being postponed: "${task.task}"
Priority: ${task.priority || 'medium'}
Current schedule: ${task.scheduledTime || 'not scheduled'}
Dependencies: ${task.dependencies?.length || 0} tasks

Other upcoming tasks:
${allTasks.filter(t => !t.completed).slice(0, 10).map(t => `- ${t.task} (${t.scheduledTime || 'unscheduled'})`).join('\n')}

Suggest the BEST time to reschedule this task (tomorrow morning, this afternoon, tomorrow evening, next Monday, etc.) and explain why in one sentence.
Format: "WHEN | REASON"`,
        },
      ],
    });

    const [when, reason] = result.split('|').map(s => s.trim());
    
    const suggestedDate = parseDateFromText(when);
    const suggestedTime = parseTimeFromText(when);

    return {
      suggestedDate,
      suggestedTime,
      reason: reason || 'Based on your schedule and task priority',
    };
  } catch (error) {
    console.error('Smart postpone error:', error);
    return {
      suggestedDate: new Date(Date.now() + 86400000).toISOString(),
      suggestedTime: '09:00',
      reason: 'Tomorrow morning',
    };
  }
}

function parseDateFromText(text: string): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const lower = text.toLowerCase();
  if (lower.includes('tomorrow')) {
    return tomorrow.toISOString();
  } else if (lower.includes('monday')) {
    const date = new Date();
    const day = date.getDay();
    const diff = (1 + 7 - day) % 7 || 7;
    date.setDate(date.getDate() + diff);
    return date.toISOString();
  } else if (lower.includes('afternoon') || lower.includes('evening')) {
    return new Date().toISOString();
  }
  
  return tomorrow.toISOString();
}

function parseTimeFromText(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('morning')) return '09:00';
  if (lower.includes('afternoon')) return '14:00';
  if (lower.includes('evening')) return '18:00';
  
  const timeMatch = text.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) return `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
  
  return '09:00';
}

export async function detectDependencies(tasks: TaskItem[]): Promise<Map<string, string[]>> {
  try {
    const taskList = tasks.map(t => ({
      id: t.id,
      task: t.task,
      category: t.notes || '',
    }));

    const result = await generateObject({
      messages: [
        {
          role: 'user',
          content: `Analyze these tasks and detect dependencies (which tasks should be done before others):

${JSON.stringify(taskList, null, 2)}

Return a map of task IDs to their dependencies (tasks that must be completed first).
Only include clear dependencies (e.g., "Buy groceries" must happen before "Cook dinner").`,
        },
      ],
      schema: z.object({
        dependencies: z.array(
          z.object({
            taskId: z.string(),
            dependsOn: z.array(z.string()),
          })
        ),
      }),
    });

    const depMap = new Map<string, string[]>();
    result.dependencies.forEach(dep => {
      depMap.set(dep.taskId, dep.dependsOn);
    });

    return depMap;
  } catch (error) {
    console.error('Dependency detection error:', error);
    return new Map();
  }
}

export async function processNaturalLanguageCommand(
  command: string,
  tasks: TaskItem[]
): Promise<{ action: string; taskIds: string[]; newDate?: string; newTime?: string; newContext?: string }> {
  try {
    const taskList = tasks.map(t => ({ id: t.id, task: t.task, context: t.context }));

    const result = await generateObject({
      messages: [
        {
          role: 'user',
          content: `Parse this natural language command: "${command}"

Available tasks:
${JSON.stringify(taskList, null, 2)}

Determine:
1. What action (move, reschedule, change_context, delete, complete)
2. Which task IDs are affected
3. New date/time if applicable
4. New context if applicable

Examples:
- "Move all work tasks to Friday" → action: move, taskIds: [work task ids], newDate: next Friday
- "Reschedule morning tasks to afternoon" → action: reschedule, taskIds: [morning task ids], newTime: 14:00`,
        },
      ],
      schema: z.object({
        action: z.enum(['move', 'reschedule', 'change_context', 'delete', 'complete']),
        taskIds: z.array(z.string()),
        newDate: z.string().optional(),
        newTime: z.string().optional(),
        newContext: z.string().optional(),
      }),
    });

    return result;
  } catch (error) {
    console.error('Natural language processing error:', error);
    throw error;
  }
}

export const TASK_TEMPLATES = [
  {
    id: 'morning-routine',
    name: 'Morning Routine',
    emoji: '🌅',
    tasks: [
      { task: 'Review daily goals', duration: '5 min', scheduledTime: '07:00', energyLevel: 'high' as const },
      { task: 'Check urgent emails', duration: '10 min', scheduledTime: '07:05', energyLevel: 'high' as const },
      { task: 'Plan top 3 priorities', duration: '5 min', scheduledTime: '07:15', energyLevel: 'high' as const },
    ],
  },
  {
    id: 'weekly-review',
    name: 'Weekly Review',
    emoji: '📊',
    tasks: [
      { task: 'Review completed tasks', duration: '15 min', energyLevel: 'medium' as const },
      { task: 'Identify wins and lessons', duration: '10 min', energyLevel: 'medium' as const },
      { task: 'Plan next week priorities', duration: '20 min', energyLevel: 'high' as const },
      { task: 'Schedule important meetings', duration: '10 min', energyLevel: 'medium' as const },
    ],
  },
  {
    id: 'deep-work',
    name: 'Deep Work Session',
    emoji: '🧠',
    tasks: [
      { task: 'Silence notifications', duration: '2 min', scheduledTime: '09:00', energyLevel: 'low' as const },
      { task: 'Work on priority project', duration: '90 min', scheduledTime: '09:05', energyLevel: 'high' as const },
      { task: 'Take break', duration: '15 min', scheduledTime: '10:35', energyLevel: 'low' as const },
      { task: 'Review and document progress', duration: '10 min', scheduledTime: '10:50', energyLevel: 'medium' as const },
    ],
  },
  {
    id: 'evening-wrap',
    name: 'Evening Wrap-up',
    emoji: '🌙',
    tasks: [
      { task: 'Review what got done today', duration: '5 min', scheduledTime: '18:00', energyLevel: 'low' as const },
      { task: 'Clear unfinished tasks', duration: '10 min', scheduledTime: '18:05', energyLevel: 'low' as const },
      { task: 'Prep tomorrow\'s top 3', duration: '10 min', scheduledTime: '18:15', energyLevel: 'medium' as const },
      { task: 'Close all work tabs', duration: '2 min', scheduledTime: '18:25', energyLevel: 'low' as const },
    ],
  },
  {
    id: 'errands-batch',
    name: 'Errands Batch',
    emoji: '🚗',
    tasks: [
      { task: 'Grocery shopping', duration: '45 min', context: 'errands' as const, energyLevel: 'medium' as const },
      { task: 'Post office', duration: '15 min', context: 'errands' as const, energyLevel: 'low' as const },
      { task: 'Pharmacy pickup', duration: '10 min', context: 'errands' as const, energyLevel: 'low' as const },
      { task: 'Gas station', duration: '10 min', context: 'errands' as const, energyLevel: 'low' as const },
    ],
  },
];
