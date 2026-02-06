/**
 * Calendar Skill - Google Calendar Integration
 *
 * Provides Claude with the ability to view and manage family calendar events.
 * Currently using mock data - will be connected to Google Calendar API.
 *
 * @module lib/skills/calendar
 */

import {
  Skill,
  SkillExecutionResult,
  ClaudeToolDefinition,
} from './index';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Calendar event structure
 */
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string; // ISO datetime
  end: string; // ISO datetime
  location?: string;
  attendees?: string[];
  color?: string;
  recurring?: boolean;
  allDay?: boolean;
  calendarId?: string;
  calendarName?: string;
}

/**
 * Input for creating a calendar event
 */
export interface CreateEventInput {
  title: string;
  start: string; // ISO datetime
  end: string; // ISO datetime
  description?: string;
  location?: string;
  attendees?: string[];
  calendarId?: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

/**
 * Generate mock calendar events for testing
 */
function generateMockEvents(startDate: Date, endDate: Date): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const current = new Date(startDate);

  // Sample event templates
  const eventTemplates = [
    { title: 'Team Standup', duration: 30, color: '#4285F4', calendarName: 'Work' },
    { title: 'School Pickup', duration: 30, color: '#34A853', calendarName: 'Family' },
    { title: 'Soccer Practice', duration: 90, color: '#FBBC04', calendarName: 'Kids' },
    { title: 'Dentist Appointment', duration: 60, color: '#EA4335', calendarName: 'Health' },
    { title: 'Family Dinner', duration: 120, color: '#34A853', calendarName: 'Family' },
    { title: 'Project Review', duration: 60, color: '#4285F4', calendarName: 'Work' },
    { title: 'Grocery Shopping', duration: 60, color: '#34A853', calendarName: 'Personal' },
    { title: 'Piano Lesson', duration: 45, color: '#FBBC04', calendarName: 'Kids' },
  ];

  let eventId = 1;

  while (current <= endDate) {
    // Add 2-4 events per day
    const eventsToday = Math.floor(Math.random() * 3) + 2;

    for (let i = 0; i < eventsToday; i++) {
      const template = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
      const hour = 8 + Math.floor(Math.random() * 10); // 8am - 6pm
      const minute = Math.random() > 0.5 ? 0 : 30;

      const eventStart = new Date(current);
      eventStart.setHours(hour, minute, 0, 0);

      const eventEnd = new Date(eventStart);
      eventEnd.setMinutes(eventEnd.getMinutes() + template.duration);

      events.push({
        id: `event_${eventId++}`,
        title: template.title,
        start: eventStart.toISOString(),
        end: eventEnd.toISOString(),
        color: template.color,
        calendarName: template.calendarName,
        calendarId: template.calendarName.toLowerCase(),
        description: `${template.title} - automatically generated event`,
      });
    }

    current.setDate(current.getDate() + 1);
  }

  // Sort by start time
  events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return events;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get calendar events within a date range
 *
 * @param startDate - Start of the date range (ISO string or Date)
 * @param endDate - End of the date range (ISO string or Date)
 * @returns Array of calendar events
 */
export async function getEvents(
  startDate: string | Date,
  endDate: string | Date
): Promise<SkillExecutionResult<{
  events: CalendarEvent[];
  total: number;
  dateRange: { start: string; end: string };
}>> {
  try {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return {
        success: false,
        error: 'Invalid date format. Use ISO format (e.g., 2024-01-15T00:00:00Z)',
      };
    }

    if (start > end) {
      return {
        success: false,
        error: 'Start date must be before end date',
      };
    }

    // TODO: Replace with actual Google Calendar API call
    // For now, return mock data
    const events = generateMockEvents(start, end);

    return {
      success: true,
      data: {
        events,
        total: events.length,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      },
      metadata: {
        source: 'google_calendar',
        cached: false,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to get calendar events: ${errorMessage}`,
    };
  }
}

/**
 * Create a new calendar event
 *
 * @param details - Event details
 * @returns The created event
 */
export async function createEvent(
  details: CreateEventInput
): Promise<SkillExecutionResult<{
  event: CalendarEvent;
  message: string;
}>> {
  try {
    // Validate required fields
    if (!details.title) {
      return {
        success: false,
        error: 'Event title is required',
      };
    }

    if (!details.start || !details.end) {
      return {
        success: false,
        error: 'Event start and end times are required',
      };
    }

    const startDate = new Date(details.start);
    const endDate = new Date(details.end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return {
        success: false,
        error: 'Invalid date format. Use ISO format (e.g., 2024-01-15T10:00:00Z)',
      };
    }

    if (startDate >= endDate) {
      return {
        success: false,
        error: 'Event end time must be after start time',
      };
    }

    // TODO: Replace with actual Google Calendar API call
    // For now, return mock created event
    const createdEvent: CalendarEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: details.title,
      description: details.description,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      location: details.location,
      attendees: details.attendees,
      calendarId: details.calendarId || 'primary',
      calendarName: 'Primary',
    };

    return {
      success: true,
      data: {
        event: createdEvent,
        message: `Event "${details.title}" created successfully`,
      },
      metadata: {
        source: 'google_calendar',
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to create calendar event: ${errorMessage}`,
    };
  }
}

/**
 * Get today's events
 */
export async function getTodayEvents(): Promise<SkillExecutionResult<{
  events: CalendarEvent[];
  total: number;
}>> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const result = await getEvents(today, tomorrow);

  if (result.success && result.data) {
    return {
      success: true,
      data: {
        events: result.data.events,
        total: result.data.total,
      },
      metadata: result.metadata,
    };
  }

  return result as SkillExecutionResult<{ events: CalendarEvent[]; total: number }>;
}

/**
 * Find free time slots on a given day
 */
export async function findFreeSlots(
  date: string | Date,
  durationMinutes: number = 60
): Promise<SkillExecutionResult<{
  slots: Array<{ start: string; end: string }>;
  date: string;
}>> {
  try {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    targetDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const eventsResult = await getEvents(targetDate, nextDay);

    if (!eventsResult.success || !eventsResult.data) {
      return {
        success: false,
        error: eventsResult.error || 'Failed to fetch events',
      };
    }

    const events = eventsResult.data.events;

    // Define working hours (8am - 8pm)
    const workStart = new Date(targetDate);
    workStart.setHours(8, 0, 0, 0);

    const workEnd = new Date(targetDate);
    workEnd.setHours(20, 0, 0, 0);

    // Find gaps between events
    const slots: Array<{ start: string; end: string }> = [];
    let currentTime = workStart;

    for (const event of events) {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);

      // Check if there's a gap before this event
      const gapMinutes = (eventStart.getTime() - currentTime.getTime()) / (1000 * 60);

      if (gapMinutes >= durationMinutes) {
        slots.push({
          start: currentTime.toISOString(),
          end: eventStart.toISOString(),
        });
      }

      // Move current time to after this event
      if (eventEnd > currentTime) {
        currentTime = eventEnd;
      }
    }

    // Check for remaining time after last event
    const remainingMinutes = (workEnd.getTime() - currentTime.getTime()) / (1000 * 60);
    if (remainingMinutes >= durationMinutes) {
      slots.push({
        start: currentTime.toISOString(),
        end: workEnd.toISOString(),
      });
    }

    return {
      success: true,
      data: {
        slots,
        date: targetDate.toISOString().split('T')[0],
      },
      metadata: {
        source: 'google_calendar',
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to find free slots: ${errorMessage}`,
    };
  }
}

// ============================================================================
// SKILL DEFINITION
// ============================================================================

/**
 * Calendar skill tool definition for Claude
 */
export const calendarToolDefinition: ClaudeToolDefinition = {
  name: 'calendar',
  description: `Manage family calendar events. Supports viewing, creating, and finding free time on the family's Google Calendar. Available operations:
- get_events: Get events within a date range
- create_event: Create a new calendar event
- today: Get today's events
- free_slots: Find available time slots on a specific day`,
  input_schema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        description: 'The calendar operation to perform',
        enum: ['get_events', 'create_event', 'today', 'free_slots'],
        required: true,
      },
      startDate: {
        type: 'string',
        description: 'Start date for get_events (ISO format, e.g., 2024-01-15T00:00:00Z)',
        required: false,
      },
      endDate: {
        type: 'string',
        description: 'End date for get_events (ISO format)',
        required: false,
      },
      date: {
        type: 'string',
        description: 'Date for free_slots operation (ISO format)',
        required: false,
      },
      duration: {
        type: 'number',
        description: 'Minimum duration in minutes for free_slots (default: 60)',
        required: false,
      },
      title: {
        type: 'string',
        description: 'Event title for create_event',
        required: false,
      },
      description: {
        type: 'string',
        description: 'Event description for create_event',
        required: false,
      },
      location: {
        type: 'string',
        description: 'Event location for create_event',
        required: false,
      },
      attendees: {
        type: 'array',
        description: 'List of attendee email addresses for create_event',
        items: { type: 'string' },
        required: false,
      },
    },
    required: ['operation'],
  },
};

/**
 * Execute the calendar skill
 */
async function executeCalendar(
  params: Record<string, unknown>
): Promise<SkillExecutionResult> {
  const operation = params.operation as string;

  switch (operation) {
    case 'get_events': {
      const startDate = params.startDate as string;
      const endDate = params.endDate as string;

      if (!startDate || !endDate) {
        return {
          success: false,
          error: 'Both startDate and endDate are required for get_events operation',
        };
      }

      return getEvents(startDate, endDate);
    }

    case 'create_event': {
      const title = params.title as string;
      const start = params.startDate as string;
      const end = params.endDate as string;

      if (!title || !start || !end) {
        return {
          success: false,
          error: 'title, startDate, and endDate are required for create_event operation',
        };
      }

      return createEvent({
        title,
        start,
        end,
        description: params.description as string | undefined,
        location: params.location as string | undefined,
        attendees: params.attendees as string[] | undefined,
      });
    }

    case 'today': {
      return getTodayEvents();
    }

    case 'free_slots': {
      const date = params.date as string;
      const duration = (params.duration as number) || 60;

      if (!date) {
        return {
          success: false,
          error: 'date is required for free_slots operation',
        };
      }

      return findFreeSlots(date, duration);
    }

    default:
      return {
        success: false,
        error: `Unknown operation: ${operation}. Use "get_events", "create_event", "today", or "free_slots"`,
      };
  }
}

/**
 * Calendar skill for the Sartor Family Dashboard
 */
export const calendarSkill: Skill = {
  name: 'calendar',
  description: 'View and manage family calendar events from Google Calendar',
  toolDefinition: calendarToolDefinition,
  execute: executeCalendar,
};
