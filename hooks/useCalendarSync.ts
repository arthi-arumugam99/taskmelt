import { useState, useCallback } from 'react';
import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';
import { DumpSession, TaskItem } from '@/types/dump';
import Colors from '@/constants/colors';

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  location?: string;
  notes?: string;
  calendarId: string;
  calendarTitle: string;
  calendarColor?: string;
}

export interface CalendarInfo {
  id: string;
  title: string;
  source: string;
  color?: string;
  isPrimary: boolean;
  allowsModifications: boolean;
}

export function useCalendarSync() {
  const [isLoading, setIsLoading] = useState(false);
  const [calendars, setCalendars] = useState<CalendarInfo[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [hasPermission, setHasPermission] = useState(false);

  const requestCalendarPermissions = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Calendar sync is not available on web. Please use the mobile app.');
      return false;
    }

    try {
      const { status: existingStatus } = await Calendar.getCalendarPermissionsAsync();
      
      if (existingStatus === 'granted') {
        setHasPermission(true);
        return true;
      }

      const { status } = await Calendar.requestCalendarPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);

      if (!granted) {
        Alert.alert(
          'Permission Required',
          'TaskMelt needs calendar access to import your events. Please enable calendar permissions in your device settings.'
        );
      }

      return granted;
    } catch (error) {
      console.log('Error requesting calendar permissions:', error);
      return false;
    }
  }, []);

  const fetchCalendars = useCallback(async (): Promise<CalendarInfo[]> => {
    const hasAccess = await requestCalendarPermissions();
    if (!hasAccess) return [];

    try {
      setIsLoading(true);
      const deviceCalendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

      const calendarInfos: CalendarInfo[] = deviceCalendars.map((cal) => ({
        id: cal.id,
        title: cal.title,
        source: cal.source.name,
        color: cal.color,
        isPrimary: cal.isPrimary || false,
        allowsModifications: cal.allowsModifications,
      }));

      setCalendars(calendarInfos);
      return calendarInfos;
    } catch (error) {
      console.log('Error fetching calendars:', error);
      Alert.alert('Error', 'Failed to fetch calendars. Please try again.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [requestCalendarPermissions]);

  const fetchEventsFromCalendar = useCallback(
    async (calendarIds: string[], daysAhead: number = 30): Promise<CalendarEvent[]> => {
      const hasAccess = await requestCalendarPermissions();
      if (!hasAccess) return [];

      try {
        setIsLoading(true);
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + daysAhead);
        endDate.setHours(23, 59, 59, 999);

        const calendarEvents = await Calendar.getEventsAsync(
          calendarIds,
          startDate,
          endDate
        );

        const eventMap = new Map<string, CalendarEvent>();
        
        calendarEvents.forEach((event) => {
          const calendar = calendars.find((c) => c.id === event.calendarId);
          const eventKey = `${event.title}_${new Date(event.startDate).getTime()}_${event.allDay}`;
          
          if (!eventMap.has(eventKey)) {
            eventMap.set(eventKey, {
              id: event.id,
              title: event.title,
              startDate: new Date(event.startDate),
              endDate: new Date(event.endDate),
              allDay: event.allDay || false,
              location: event.location || undefined,
              notes: event.notes || undefined,
              calendarId: event.calendarId,
              calendarTitle: calendar?.title || 'Unknown Calendar',
              calendarColor: calendar?.color,
            });
          }
        });

        const uniqueEvents = Array.from(eventMap.values());
        
        const sortedEvents = uniqueEvents.sort(
          (a, b) => a.startDate.getTime() - b.startDate.getTime()
        );

        setEvents(sortedEvents);
        return sortedEvents;
      } catch (error) {
        console.log('Error fetching calendar events:', error);
        Alert.alert('Error', 'Failed to fetch calendar events. Please try again.');
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [requestCalendarPermissions, calendars]
  );

  const convertEventsToDumpSession = useCallback(
    (eventsToConvert: CalendarEvent[]): DumpSession => {
      const eventsByCalendar = eventsToConvert.reduce((acc, event) => {
        const key = event.calendarId;
        if (!acc[key]) {
          acc[key] = {
            calendarTitle: event.calendarTitle,
            calendarColor: event.calendarColor || Colors.primary,
            events: [],
          };
        }
        acc[key].events.push(event);
        return acc;
      }, {} as Record<string, { calendarTitle: string; calendarColor: string; events: CalendarEvent[] }>);

      const categories = Object.values(eventsByCalendar).map((group) => {
        const items: TaskItem[] = group.events.map((event) => {
          const duration = event.allDay
            ? 'All day'
            : `${Math.round((event.endDate.getTime() - event.startDate.getTime()) / (1000 * 60))} min`;

          const scheduledTime = event.allDay
            ? undefined
            : event.startDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              });

          const eventDate = new Date(event.startDate);
          
          const year = eventDate.getFullYear();
          const month = eventDate.getMonth() + 1;
          const day = eventDate.getDate();
          
          const taskDate = new Date(year, month - 1, day, 12, 0, 0, 0);
          const scheduledDateStr = taskDate.toISOString();
          
          console.log(`📅 Calendar event: ${event.title} scheduled for ${month}/${day}/${year} -> ${scheduledDateStr}`);
          
          return {
            id: `calendar_${event.id}_${Date.now()}`,
            task: event.title,
            completed: false,
            isReflection: false,
            scheduledDate: scheduledDateStr,
            scheduledTime: scheduledTime,
            duration: duration,
            notes: event.notes,
            context: event.location ? 'anywhere' : undefined,
          };
        });

        const calendarEmoji = '📅';
        
        return {
          name: group.calendarTitle,
          emoji: calendarEmoji,
          color: group.calendarColor,
          items,
        };
      });

      return {
        id: `calendar_import_${Date.now()}`,
        rawText: `Imported ${eventsToConvert.length} events from calendar`,
        categories,
        createdAt: new Date().toISOString(),
        summary: `Calendar import with ${eventsToConvert.length} events`,
      };
    },
    []
  );

  return {
    isLoading,
    calendars,
    events,
    hasPermission,
    requestCalendarPermissions,
    fetchCalendars,
    fetchEventsFromCalendar,
    convertEventsToDumpSession,
  };
}
