import { useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { TaskItem } from '@/types/dump';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotifications() {
  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'web') return;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permissions not granted');
      return;
    }

    console.log('Notification permissions granted');
  };

  const scheduleTaskNotification = useCallback(async (
    task: TaskItem,
    categoryName: string,
    categoryEmoji: string,
    dumpId: string
  ) => {
    if (Platform.OS === 'web') return;

    try {
      const notificationId = `task-${dumpId}-${task.id}`;
      
      await Notifications.cancelScheduledNotificationAsync(notificationId).catch(() => {});

      if (task.completed) {
        return;
      }

      const triggers: Date[] = [];

      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const now = new Date();
        
        if (dueDate > now) {
          const reminderTime = new Date(dueDate.getTime() - 30 * 60 * 1000);
          
          if (reminderTime > now) {
            triggers.push(reminderTime);
          }

          const dayBeforeTime = new Date(dueDate.getTime() - 24 * 60 * 60 * 1000);
          dayBeforeTime.setHours(20, 0, 0, 0);
          
          if (dayBeforeTime > now) {
            triggers.push(dayBeforeTime);
          }

          const morningOfTime = new Date(dueDate);
          morningOfTime.setHours(9, 0, 0, 0);
          
          if (morningOfTime > now && morningOfTime < dueDate) {
            triggers.push(morningOfTime);
          }
        }
      } else if (task.timeEstimate) {
        const timeMatch = task.timeEstimate.match(/(\d+):(\d+)/);
        if (timeMatch) {
          const hours = parseInt(timeMatch[1]);
          const minutes = parseInt(timeMatch[2]);
          
          const taskTime = new Date();
          taskTime.setHours(hours, minutes, 0, 0);
          
          const now = new Date();
          if (taskTime > now) {
            const reminderTime = new Date(taskTime.getTime() - 15 * 60 * 1000);
            
            if (reminderTime > now) {
              triggers.push(reminderTime);
            }
          }
        }
      }

      for (let i = 0; i < triggers.length; i++) {
        const triggerDate = triggers[i];
        const id = `${notificationId}-${i}`;
        
        let title = '';
        let body = '';
        
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate);
          const diffHours = Math.floor((dueDate.getTime() - triggerDate.getTime()) / (1000 * 60 * 60));
          
          if (diffHours < 1) {
            title = `${categoryEmoji} Due in 30 minutes`;
            body = task.task;
          } else if (diffHours < 24) {
            title = `${categoryEmoji} Due today`;
            body = task.task;
          } else {
            title = `${categoryEmoji} Due tomorrow`;
            body = task.task;
          }
        } else if (task.timeEstimate) {
          title = `${categoryEmoji} Upcoming: ${task.timeEstimate}`;
          body = task.task;
        }

        await Notifications.scheduleNotificationAsync({
          identifier: id,
          content: {
            title,
            body,
            data: { taskId: task.id, dumpId, categoryName },
            categoryIdentifier: 'task-reminder',
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
        });
      }

      console.log(`Scheduled ${triggers.length} notifications for task:`, task.task.substring(0, 30));
    } catch (error) {
      console.log('Error scheduling task notification:', error);
    }
  }, []);

  const scheduleSmartNudge = useCallback(async (
    pendingTasksCount: number,
    categoryBreakdown: { emoji: string; name: string; count: number }[]
  ) => {
    if (Platform.OS === 'web') return;

    try {
      await Notifications.cancelScheduledNotificationAsync('smart-nudge-morning').catch(() => {});
      await Notifications.cancelScheduledNotificationAsync('smart-nudge-evening').catch(() => {});

      if (pendingTasksCount === 0) {
        return;
      }

      let morningBody = `You have ${pendingTasksCount} task${pendingTasksCount > 1 ? 's' : ''} to complete.`;
      if (categoryBreakdown.length > 0) {
        const topCategory = categoryBreakdown[0];
        morningBody += ` ${topCategory.emoji} ${topCategory.count} in ${topCategory.name}`;
      }

      await Notifications.scheduleNotificationAsync({
        identifier: 'smart-nudge-morning',
        content: {
          title: '🌅 Good morning!',
          body: morningBody,
          data: { type: 'smart-nudge' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 9,
          minute: 0,
        },
      });

      await Notifications.scheduleNotificationAsync({
        identifier: 'smart-nudge-evening',
        content: {
          title: '🌙 Evening check-in',
          body: `${pendingTasksCount} task${pendingTasksCount > 1 ? 's' : ''} still pending. Finish strong!`,
          data: { type: 'smart-nudge' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 20,
          minute: 0,
        },
      });

      console.log('Scheduled smart nudges');
    } catch (error) {
      console.log('Error scheduling smart nudge:', error);
    }
  }, []);

  const cancelTaskNotifications = useCallback(async (dumpId: string, taskId: string) => {
    if (Platform.OS === 'web') return;

    try {
      const notificationId = `task-${dumpId}-${taskId}`;
      
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const toCancel = scheduled.filter(n => n.identifier.startsWith(notificationId));
      
      for (const notification of toCancel) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }

      console.log(`Cancelled ${toCancel.length} notifications for task`);
    } catch (error) {
      console.log('Error cancelling task notifications:', error);
    }
  }, []);

  const cancelAllTaskNotifications = useCallback(async () => {
    if (Platform.OS === 'web') return;

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Cancelled all notifications');
    } catch (error) {
      console.log('Error cancelling all notifications:', error);
    }
  }, []);

  const scheduleDeadlineReminder = useCallback(async (
    urgentTasks: { task: TaskItem; categoryEmoji: string; hoursUntilDue: number }[]
  ) => {
    if (Platform.OS === 'web') return;

    try {
      await Notifications.cancelScheduledNotificationAsync('urgent-deadline').catch(() => {});

      if (urgentTasks.length === 0) return;

      const now = new Date();
      const reminderTime = new Date(now.getTime() + 5 * 60 * 1000);

      const task = urgentTasks[0];
      const hoursText = task.hoursUntilDue < 1 
        ? 'less than an hour' 
        : `${Math.floor(task.hoursUntilDue)} hour${Math.floor(task.hoursUntilDue) > 1 ? 's' : ''}`;

      await Notifications.scheduleNotificationAsync({
        identifier: 'urgent-deadline',
        content: {
          title: `🚨 ${task.categoryEmoji} Urgent deadline`,
          body: `"${task.task.task}" is due in ${hoursText}!`,
          data: { type: 'urgent', taskId: task.task.id },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminderTime },
      });

      console.log('Scheduled urgent deadline reminder');
    } catch (error) {
      console.log('Error scheduling deadline reminder:', error);
    }
  }, []);

  return {
    scheduleTaskNotification,
    scheduleSmartNudge,
    cancelTaskNotifications,
    cancelAllTaskNotifications,
    scheduleDeadlineReminder,
  };
}
