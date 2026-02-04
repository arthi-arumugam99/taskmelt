/**
 * Natural Language Task Parser
 * Parses dates, times, priorities, contexts, and durations from natural text
 * Similar to Griply's Smart Recognition feature
 */

interface ParsedTask {
  text: string;
  cleanText: string;
  scheduledDate?: string;
  scheduledTime?: string;
  dueDate?: string;
  priority?: 'high' | 'medium' | 'low';
  context?: 'home' | 'work' | 'errands' | 'computer' | 'phone' | 'anywhere';
  duration?: number; // in minutes
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[];
  };
  tags?: string[];
}

// Date patterns
const DATE_PATTERNS = {
  today: /\b(today)\b/i,
  tomorrow: /\b(tomorrow|tmrw|tmw)\b/i,
  dayAfterTomorrow: /\b(day after tomorrow)\b/i,
  nextWeek: /\b(next week)\b/i,
  thisWeekend: /\b(this weekend|weekend)\b/i,
  monday: /\b(monday|mon)\b/i,
  tuesday: /\b(tuesday|tue|tues)\b/i,
  wednesday: /\b(wednesday|wed)\b/i,
  thursday: /\b(thursday|thu|thur|thurs)\b/i,
  friday: /\b(friday|fri)\b/i,
  saturday: /\b(saturday|sat)\b/i,
  sunday: /\b(sunday|sun)\b/i,
  specificDate: /\b(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)\b/,
  inDays: /\bin\s+(\d+)\s+days?\b/i,
};

// Time patterns
const TIME_PATTERNS = {
  atTime: /\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i,
  byTime: /\bby\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i,
  morning: /\b(morning|in the morning)\b/i,
  afternoon: /\b(afternoon|in the afternoon)\b/i,
  evening: /\b(evening|tonight|in the evening)\b/i,
  noon: /\b(noon|midday)\b/i,
  midnight: /\b(midnight)\b/i,
};

// Priority patterns
const PRIORITY_PATTERNS = {
  high: /\b(urgent|asap|important|critical|p1|priority\s*1|high\s*priority|!{2,})\b/i,
  medium: /\b(soon|p2|priority\s*2|medium\s*priority)\b/i,
  low: /\b(someday|whenever|p3|priority\s*3|low\s*priority|eventually)\b/i,
};

// Context patterns
const CONTEXT_PATTERNS = {
  home: /\b(@home|at\s+home)\b/i,
  work: /\b(@work|at\s+work|at\s+office|@office)\b/i,
  errands: /\b(@errands|while\s+out|outside|@out)\b/i,
  computer: /\b(@computer|on\s+computer|@pc|@laptop|@mac)\b/i,
  phone: /\b(@phone|on\s+phone|@mobile|@call)\b/i,
  anywhere: /\b(@anywhere|anywhere)\b/i,
};

// Duration patterns
const DURATION_PATTERNS = {
  minutes: /\b(\d+)\s*(min(?:ute)?s?|m)\b/i,
  hours: /\b(\d+(?:\.\d+)?)\s*(hours?|hrs?|h)\b/i,
  forDuration: /\bfor\s+(\d+)\s*(min(?:ute)?s?|hours?|hrs?|h|m)\b/i,
};

// Recurring patterns
const RECURRING_PATTERNS = {
  daily: /\b(every\s*day|daily)\b/i,
  weekly: /\b(every\s*week|weekly)\b/i,
  monthly: /\b(every\s*month|monthly)\b/i,
  everyWeekday: /\b(every\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)s?)\b/i,
};

// Tag pattern (hashtags)
const TAG_PATTERN = /#(\w+)/g;

function getNextWeekday(dayIndex: number): Date {
  const today = new Date();
  const currentDay = today.getDay();
  let daysUntil = dayIndex - currentDay;
  if (daysUntil <= 0) daysUntil += 7;
  const result = new Date(today);
  result.setDate(today.getDate() + daysUntil);
  return result;
}

function parseDate(text: string): { date?: Date; matchedText?: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (DATE_PATTERNS.today.test(text)) {
    return { date: today, matchedText: text.match(DATE_PATTERNS.today)?.[0] };
  }

  if (DATE_PATTERNS.tomorrow.test(text)) {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return { date: tomorrow, matchedText: text.match(DATE_PATTERNS.tomorrow)?.[0] };
  }

  if (DATE_PATTERNS.dayAfterTomorrow.test(text)) {
    const dat = new Date(today);
    dat.setDate(today.getDate() + 2);
    return { date: dat, matchedText: text.match(DATE_PATTERNS.dayAfterTomorrow)?.[0] };
  }

  if (DATE_PATTERNS.nextWeek.test(text)) {
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    return { date: nextWeek, matchedText: text.match(DATE_PATTERNS.nextWeek)?.[0] };
  }

  if (DATE_PATTERNS.thisWeekend.test(text)) {
    const saturday = getNextWeekday(6);
    return { date: saturday, matchedText: text.match(DATE_PATTERNS.thisWeekend)?.[0] };
  }

  const inDaysMatch = text.match(DATE_PATTERNS.inDays);
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1], 10);
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + days);
    return { date: futureDate, matchedText: inDaysMatch[0] };
  }

  // Weekday matches
  const weekdays = [
    { pattern: DATE_PATTERNS.sunday, day: 0 },
    { pattern: DATE_PATTERNS.monday, day: 1 },
    { pattern: DATE_PATTERNS.tuesday, day: 2 },
    { pattern: DATE_PATTERNS.wednesday, day: 3 },
    { pattern: DATE_PATTERNS.thursday, day: 4 },
    { pattern: DATE_PATTERNS.friday, day: 5 },
    { pattern: DATE_PATTERNS.saturday, day: 6 },
  ];

  for (const { pattern, day } of weekdays) {
    if (pattern.test(text)) {
      return { date: getNextWeekday(day), matchedText: text.match(pattern)?.[0] };
    }
  }

  // Specific date (MM/DD or MM/DD/YYYY)
  const specificMatch = text.match(DATE_PATTERNS.specificDate);
  if (specificMatch) {
    const parts = specificMatch[1].split(/[\/\-]/);
    const month = parseInt(parts[0], 10) - 1;
    const day = parseInt(parts[1], 10);
    const year = parts[2] ? parseInt(parts[2], 10) : today.getFullYear();
    const fullYear = year < 100 ? 2000 + year : year;
    return { date: new Date(fullYear, month, day), matchedText: specificMatch[0] };
  }

  return {};
}

function parseTime(text: string): { time?: string; matchedText?: string } {
  // At/By specific time
  const atTimeMatch = text.match(TIME_PATTERNS.atTime) || text.match(TIME_PATTERNS.byTime);
  if (atTimeMatch) {
    let hours = parseInt(atTimeMatch[1], 10);
    const minutes = atTimeMatch[2] ? parseInt(atTimeMatch[2], 10) : 0;
    const period = atTimeMatch[3]?.toLowerCase();

    if (period === 'pm' && hours < 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;

    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    return { time: timeStr, matchedText: atTimeMatch[0] };
  }

  if (TIME_PATTERNS.morning.test(text)) {
    return { time: '09:00', matchedText: text.match(TIME_PATTERNS.morning)?.[0] };
  }
  if (TIME_PATTERNS.noon.test(text)) {
    return { time: '12:00', matchedText: text.match(TIME_PATTERNS.noon)?.[0] };
  }
  if (TIME_PATTERNS.afternoon.test(text)) {
    return { time: '14:00', matchedText: text.match(TIME_PATTERNS.afternoon)?.[0] };
  }
  if (TIME_PATTERNS.evening.test(text)) {
    return { time: '18:00', matchedText: text.match(TIME_PATTERNS.evening)?.[0] };
  }
  if (TIME_PATTERNS.midnight.test(text)) {
    return { time: '00:00', matchedText: text.match(TIME_PATTERNS.midnight)?.[0] };
  }

  return {};
}

function parsePriority(text: string): { priority?: 'high' | 'medium' | 'low'; matchedText?: string } {
  if (PRIORITY_PATTERNS.high.test(text)) {
    return { priority: 'high', matchedText: text.match(PRIORITY_PATTERNS.high)?.[0] };
  }
  if (PRIORITY_PATTERNS.medium.test(text)) {
    return { priority: 'medium', matchedText: text.match(PRIORITY_PATTERNS.medium)?.[0] };
  }
  if (PRIORITY_PATTERNS.low.test(text)) {
    return { priority: 'low', matchedText: text.match(PRIORITY_PATTERNS.low)?.[0] };
  }
  return {};
}

function parseContext(text: string): { context?: ParsedTask['context']; matchedText?: string } {
  for (const [contextKey, pattern] of Object.entries(CONTEXT_PATTERNS)) {
    if (pattern.test(text)) {
      return {
        context: contextKey as ParsedTask['context'],
        matchedText: text.match(pattern)?.[0]
      };
    }
  }
  return {};
}

function parseDuration(text: string): { duration?: number; matchedText?: string } {
  const forMatch = text.match(DURATION_PATTERNS.forDuration);
  if (forMatch) {
    const value = parseFloat(forMatch[1]);
    const unit = forMatch[2].toLowerCase();
    const minutes = unit.startsWith('h') ? value * 60 : value;
    return { duration: Math.round(minutes), matchedText: forMatch[0] };
  }

  const hoursMatch = text.match(DURATION_PATTERNS.hours);
  if (hoursMatch) {
    const hours = parseFloat(hoursMatch[1]);
    return { duration: Math.round(hours * 60), matchedText: hoursMatch[0] };
  }

  const minutesMatch = text.match(DURATION_PATTERNS.minutes);
  if (minutesMatch) {
    return { duration: parseInt(minutesMatch[1], 10), matchedText: minutesMatch[0] };
  }

  return {};
}

function parseRecurring(text: string): { recurring?: ParsedTask['recurring']; matchedText?: string } {
  if (RECURRING_PATTERNS.daily.test(text)) {
    return {
      recurring: { frequency: 'daily' },
      matchedText: text.match(RECURRING_PATTERNS.daily)?.[0]
    };
  }
  if (RECURRING_PATTERNS.weekly.test(text)) {
    return {
      recurring: { frequency: 'weekly' },
      matchedText: text.match(RECURRING_PATTERNS.weekly)?.[0]
    };
  }
  if (RECURRING_PATTERNS.monthly.test(text)) {
    return {
      recurring: { frequency: 'monthly' },
      matchedText: text.match(RECURRING_PATTERNS.monthly)?.[0]
    };
  }

  // Every specific weekday
  const weekdayMatch = text.match(RECURRING_PATTERNS.everyWeekday);
  if (weekdayMatch) {
    const dayName = weekdayMatch[2].toLowerCase();
    const dayMap: Record<string, number> = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
      thursday: 4, friday: 5, saturday: 6
    };
    return {
      recurring: { frequency: 'weekly', daysOfWeek: [dayMap[dayName]] },
      matchedText: weekdayMatch[0]
    };
  }

  return {};
}

function parseTags(text: string): string[] {
  const matches = text.matchAll(TAG_PATTERN);
  return Array.from(matches, m => m[1]);
}

export function parseNaturalLanguageTask(input: string): ParsedTask {
  let cleanText = input;
  const matchedParts: string[] = [];

  // Parse all components
  const { date, matchedText: dateMatch } = parseDate(input);
  if (dateMatch) matchedParts.push(dateMatch);

  const { time, matchedText: timeMatch } = parseTime(input);
  if (timeMatch) matchedParts.push(timeMatch);

  const { priority, matchedText: priorityMatch } = parsePriority(input);
  if (priorityMatch) matchedParts.push(priorityMatch);

  const { context, matchedText: contextMatch } = parseContext(input);
  if (contextMatch) matchedParts.push(contextMatch);

  const { duration, matchedText: durationMatch } = parseDuration(input);
  if (durationMatch) matchedParts.push(durationMatch);

  const { recurring, matchedText: recurringMatch } = parseRecurring(input);
  if (recurringMatch) matchedParts.push(recurringMatch);

  const tags = parseTags(input);

  // Remove matched parts from clean text
  for (const part of matchedParts) {
    cleanText = cleanText.replace(part, '');
  }
  // Remove hashtags from clean text
  cleanText = cleanText.replace(TAG_PATTERN, '');
  // Clean up whitespace
  cleanText = cleanText.replace(/\s+/g, ' ').trim();

  return {
    text: input,
    cleanText,
    scheduledDate: date?.toISOString(),
    scheduledTime: time,
    priority,
    context,
    duration,
    recurring,
    tags: tags.length > 0 ? tags : undefined,
  };
}

// Helper to format parsed result for display
export function getParsePreview(parsed: ParsedTask): string[] {
  const previews: string[] = [];

  if (parsed.scheduledDate) {
    const date = new Date(parsed.scheduledDate);
    previews.push(`📅 ${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`);
  }
  if (parsed.scheduledTime) {
    const [hours, minutes] = parsed.scheduledTime.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    previews.push(`⏰ ${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`);
  }
  if (parsed.priority) {
    const emoji = parsed.priority === 'high' ? '🔴' : parsed.priority === 'medium' ? '🟡' : '🟢';
    previews.push(`${emoji} ${parsed.priority}`);
  }
  if (parsed.context) {
    const contextEmoji: Record<string, string> = {
      home: '🏠', work: '💼', errands: '🛒',
      computer: '💻', phone: '📱', anywhere: '🌍'
    };
    previews.push(`${contextEmoji[parsed.context]} ${parsed.context}`);
  }
  if (parsed.duration) {
    const hours = Math.floor(parsed.duration / 60);
    const mins = parsed.duration % 60;
    const timeStr = hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}m` : ''}` : `${mins}m`;
    previews.push(`⏱️ ${timeStr}`);
  }
  if (parsed.recurring) {
    previews.push(`🔁 ${parsed.recurring.frequency}`);
  }
  if (parsed.tags && parsed.tags.length > 0) {
    previews.push(`🏷️ ${parsed.tags.map(t => `#${t}`).join(' ')}`);
  }

  return previews;
}
