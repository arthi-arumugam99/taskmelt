import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Calendar as CalendarIcon, Check, Download } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useCalendarSync, CalendarEvent } from '@/hooks/useCalendarSync';
import { useDumps } from '@/contexts/DumpContext';

interface CalendarSyncModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function CalendarSyncModal({ visible, onClose }: CalendarSyncModalProps) {
  const { addDump } = useDumps();
  const {
    isLoading,
    calendars,
    events,
    fetchCalendars,
    fetchEventsFromCalendar,
    convertEventsToDumpSession,
  } = useCalendarSync();

  const [selectedCalendars, setSelectedCalendars] = useState<Set<string>>(new Set());
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<'calendars' | 'events' | 'confirm'>('calendars');
  const daysAhead = 30;

  useEffect(() => {
    if (visible) {
      fetchCalendars();
      setStep('calendars');
      setSelectedCalendars(new Set());
      setSelectedEvents(new Set());
    }
  }, [visible, fetchCalendars]);

  const handleToggleCalendar = (calendarId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCalendars((prev) => {
      const next = new Set(prev);
      if (next.has(calendarId)) {
        next.delete(calendarId);
      } else {
        next.add(calendarId);
      }
      return next;
    });
  };

  const handleSelectAllCalendars = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedCalendars.size === calendars.length) {
      setSelectedCalendars(new Set());
    } else {
      setSelectedCalendars(new Set(calendars.map((c) => c.id)));
    }
  };

  const handleFetchEvents = async () => {
    if (selectedCalendars.size === 0) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const calendarIds = Array.from(selectedCalendars);
    const fetchedEvents = await fetchEventsFromCalendar(calendarIds, daysAhead);
    
    if (fetchedEvents.length > 0) {
      setSelectedEvents(new Set(fetchedEvents.map((e) => e.id)));
      setStep('events');
    }
  };

  const handleToggleEvent = (eventId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const handleSelectAllEvents = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedEvents.size === events.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(events.map((e) => e.id)));
    }
  };

  const handleImport = () => {
    const eventsToImport = events.filter((e) => selectedEvents.has(e.id));
    if (eventsToImport.length === 0) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const dumpSession = convertEventsToDumpSession(eventsToImport);
    addDump(dumpSession);
    onClose();
  };

  const formatEventTime = (event: CalendarEvent) => {
    if (event.allDay) return 'All day';
    return event.startDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatEventDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <CalendarIcon size={24} color={Colors.primary} strokeWidth={2.5} />
            <Text style={styles.headerTitle}>
              {step === 'calendars' ? 'Select Calendars' : step === 'events' ? 'Select Events' : 'Confirm Import'}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
            <X size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {step === 'calendars' && (
          <>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                Import calendar events as tasks. Select which calendars to sync.
              </Text>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading calendars...</Text>
              </View>
            ) : (
              <>
                <View style={styles.selectAllContainer}>
                  <TouchableOpacity onPress={handleSelectAllCalendars} style={styles.selectAllButton}>
                    <Text style={styles.selectAllText}>
                      {selectedCalendars.size === calendars.length ? 'Deselect All' : 'Select All'}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.countText}>
                    {selectedCalendars.size} of {calendars.length} selected
                  </Text>
                </View>

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                  {calendars.map((calendar) => (
                    <TouchableOpacity
                      key={calendar.id}
                      style={[
                        styles.calendarCard,
                        selectedCalendars.has(calendar.id) && styles.calendarCardSelected,
                      ]}
                      onPress={() => handleToggleCalendar(calendar.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.calendarLeft}>
                        {calendar.color && (
                          <View style={[styles.calendarColorDot, { backgroundColor: calendar.color }]} />
                        )}
                        <View style={styles.calendarInfo}>
                          <Text style={styles.calendarTitle}>{calendar.title}</Text>
                          <Text style={styles.calendarSource}>{calendar.source}</Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.checkbox,
                          selectedCalendars.has(calendar.id) && styles.checkboxSelected,
                        ]}
                      >
                        {selectedCalendars.has(calendar.id) && (
                          <Check size={16} color={Colors.background} strokeWidth={3} />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.footer}>
                  <TouchableOpacity
                    style={[styles.nextButton, selectedCalendars.size === 0 && styles.nextButtonDisabled]}
                    onPress={handleFetchEvents}
                    disabled={selectedCalendars.size === 0 || isLoading}
                  >
                    <Text style={styles.nextButtonText}>
                      Fetch Events ({daysAhead} days ahead)
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </>
        )}

        {step === 'events' && (
          <>
            <View style={styles.selectAllContainer}>
              <TouchableOpacity onPress={handleSelectAllEvents} style={styles.selectAllButton}>
                <Text style={styles.selectAllText}>
                  {selectedEvents.size === events.length ? 'Deselect All' : 'Select All'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.countText}>
                {selectedEvents.size} of {events.length} selected
              </Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
              {events.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={[
                    styles.eventCard,
                    selectedEvents.has(event.id) && styles.eventCardSelected,
                  ]}
                  onPress={() => handleToggleEvent(event.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.eventLeft}>
                    {event.calendarColor && (
                      <View style={[styles.eventColorBar, { backgroundColor: event.calendarColor }]} />
                    )}
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <View style={styles.eventMeta}>
                        <Text style={styles.eventDate}>{formatEventDate(event.startDate)}</Text>
                        <Text style={styles.eventTime}>{formatEventTime(event)}</Text>
                        {event.location && (
                          <Text style={styles.eventLocation} numberOfLines={1}>
                            📍 {event.location}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.eventCalendar}>{event.calendarTitle}</Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      selectedEvents.has(event.id) && styles.checkboxSelected,
                    ]}
                  >
                    {selectedEvents.has(event.id) && (
                      <Check size={16} color={Colors.background} strokeWidth={3} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity style={styles.backButton} onPress={() => setStep('calendars')}>
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.importButton, selectedEvents.size === 0 && styles.importButtonDisabled]}
                onPress={handleImport}
                disabled={selectedEvents.size === 0}
              >
                <Download size={20} color={Colors.background} strokeWidth={2.5} />
                <Text style={styles.importButtonText}>Import {selectedEvents.size} Events</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 3,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  closeButton: {
    padding: 12,
  },
  infoCard: {
    backgroundColor: Colors.accent1,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: Colors.border,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  selectAllContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  selectAllButton: {
    padding: 8,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 12,
  },
  calendarCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 3,
    borderColor: Colors.border,
  },
  calendarCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  calendarLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  calendarColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  calendarInfo: {
    flex: 1,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  calendarSource: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  eventCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 3,
    borderColor: Colors.border,
  },
  eventCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  eventLeft: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  eventColorBar: {
    width: 4,
    borderRadius: 2,
  },
  eventInfo: {
    flex: 1,
    gap: 6,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    lineHeight: 22,
  },
  eventMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  eventDate: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  eventTime: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  eventLocation: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    flexShrink: 1,
  },
  eventCalendar: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600' as const,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 3,
    borderTopColor: Colors.border,
  },
  nextButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.background,
  },
  backButton: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.border,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  importButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.accent2Dark,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  importButtonDisabled: {
    opacity: 0.5,
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.background,
  },
});
