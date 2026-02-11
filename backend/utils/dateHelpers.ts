/**
 * Date Helpers for Events Feature
 * Monday-to-Monday event window calculations and cron expression building
 */

import { DateTime } from 'luxon';
import { createLogger } from '../shared/utils/logger';

const logger = createLogger('DateHelpers');

// ============================================================================
// Event Window Calculations
// ============================================================================

/**
 * Get the next Monday at noon from now in the specified timezone
 * If today is Monday and current time is before noon, returns today at noon
 * Otherwise returns next Monday at noon
 *
 * @param timezone IANA timezone string (e.g., "America/Los_Angeles")
 * @returns Date object for next Monday at noon
 */
export function getNextMondayNoon(timezone: string = 'America/Los_Angeles'): Date {
  const now = DateTime.now().setZone(timezone);

  // Set target time to noon (12:00 PM)
  let target = now.set({
    hour: 12,
    minute: 0,
    second: 0,
    millisecond: 0,
  });

  const currentDayOfWeek = now.weekday; // 1 = Monday, 7 = Sunday

  if (currentDayOfWeek === 1) {
    // Today is Monday
    if (now.hour < 12 || (now.hour === 12 && now.minute === 0)) {
      // Current time is before or at noon - use today
      logger.debug('Next Monday noon is today', {
        currentTime: now.toISO(),
        targetTime: target.toISO(),
      });
      return target.toJSDate();
    } else {
      // After noon - use next Monday
      target = target.plus({ weeks: 1 });
    }
  } else {
    // Calculate days until next Monday
    const daysUntilMonday = (8 - currentDayOfWeek) % 7 || 7;
    target = target.plus({ days: daysUntilMonday });
  }

  logger.debug('Calculated next Monday noon', {
    currentTime: now.toISO(),
    targetTime: target.toISO(),
    timezone,
  });

  return target.toJSDate();
}

/**
 * Get the following Monday at 11:59 AM from a given start date
 * This creates a full week window (Mon 12:00 PM → Mon 11:59 AM)
 *
 * @param startDate The start Monday (typically at noon)
 * @param timezone IANA timezone string
 * @returns Date object for the following Monday at 11:59 AM
 */
export function getFollowingMondayEnd(
  startDate: Date,
  timezone: string = 'America/Los_Angeles'
): Date {
  const start = DateTime.fromJSDate(startDate).setZone(timezone);

  // Add 7 days to get to next Monday
  const nextMonday = start.plus({ days: 7 });

  // Set time to 11:59 AM
  const end = nextMonday.set({
    hour: 11,
    minute: 59,
    second: 0,
    millisecond: 0,
  });

  logger.debug('Calculated following Monday end', {
    startDate: start.toISO(),
    endDate: end.toISO(),
    timezone,
  });

  return end.toJSDate();
}

/**
 * Get complete event window (Monday noon → next Monday 11:59 AM)
 * This provides a full week of events starting from the next Monday at noon
 *
 * @param timezone IANA timezone string
 * @returns Object with start and end Date objects
 */
export function getEventWindow(timezone: string = 'America/Los_Angeles'): {
  start: Date;
  end: Date;
} {
  const start = getNextMondayNoon(timezone);
  const end = getFollowingMondayEnd(start, timezone);

  logger.info('Event window calculated', {
    start: DateTime.fromJSDate(start).toISO(),
    end: DateTime.fromJSDate(end).toISO(),
    timezone,
  });

  return { start, end };
}

// ============================================================================
// Cron Expression Building
// ============================================================================

/**
 * Build a cron expression from schedule configuration
 * Format: minute hour dayOfWeek * *
 *
 * @param minute Minute (0-59)
 * @param hour Hour in 24-hour format (0-23)
 * @param dayOfWeek Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @returns Cron expression string
 *
 * @throws Error if parameters are out of valid ranges
 *
 * @example
 * buildCronExpression(0, 12, 1) // "0 12 * * 1" = Every Monday at 12:00 PM
 * buildCronExpression(30, 18, 5) // "30 18 * * 5" = Every Friday at 6:30 PM
 */
export function buildCronExpression(minute: number, hour: number, dayOfWeek: number): string {
  // Validate inputs
  if (minute < 0 || minute > 59) {
    throw new Error(`Invalid minute: ${minute}. Must be between 0-59.`);
  }

  if (hour < 0 || hour > 23) {
    throw new Error(`Invalid hour: ${hour}. Must be between 0-23.`);
  }

  if (dayOfWeek < 0 || dayOfWeek > 6) {
    throw new Error(`Invalid dayOfWeek: ${dayOfWeek}. Must be between 0-6 (0=Sunday, 6=Saturday).`);
  }

  const cronExpression = `${minute} ${hour} * * ${dayOfWeek}`;

  logger.debug('Built cron expression', {
    minute,
    hour,
    dayOfWeek,
    expression: cronExpression,
  });

  return cronExpression;
}

/**
 * Parse time string (HH:MM format) into hour and minute
 *
 * @param timeString Time in HH:MM or H:MM format (e.g., "14:30" or "9:00")
 * @returns Object with hour and minute as numbers
 * @throws Error if time format is invalid
 *
 * @example
 * parseTimeString("14:30") // { hour: 14, minute: 30 }
 * parseTimeString("9:00") // { hour: 9, minute: 0 }
 */
export function parseTimeString(timeString: string): { hour: number; minute: number } {
  const timeRegex = /^(\d{1,2}):(\d{2})$/;
  const match = timeString.match(timeRegex);

  if (!match) {
    throw new Error(
      `Invalid time format: "${timeString}". Expected HH:MM format (e.g., "14:30" or "9:00").`
    );
  }

  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);

  if (hour < 0 || hour > 23) {
    throw new Error(`Invalid hour: ${hour}. Must be between 0-23.`);
  }

  if (minute < 0 || minute > 59) {
    throw new Error(`Invalid minute: ${minute}. Must be between 0-59.`);
  }

  return { hour, minute };
}

/**
 * Parse day name to day of week number
 *
 * @param dayName Day name (full or abbreviated, case-insensitive)
 * @returns Day of week number (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @throws Error if day name is invalid
 *
 * @example
 * parseDayName("Monday") // 1
 * parseDayName("mon") // 1
 * parseDayName("friday") // 5
 */
export function parseDayName(dayName: string): number {
  const dayMap: Record<string, number> = {
    sunday: 0,
    sun: 0,
    monday: 1,
    mon: 1,
    tuesday: 2,
    tue: 2,
    tues: 2,
    wednesday: 3,
    wed: 3,
    thursday: 4,
    thu: 4,
    thur: 4,
    thurs: 4,
    friday: 5,
    fri: 5,
    saturday: 6,
    sat: 6,
  };

  const normalized = dayName.toLowerCase().trim();
  const dayNumber = dayMap[normalized];

  if (dayNumber === undefined) {
    throw new Error(
      `Invalid day name: "${dayName}". Expected day name like "Monday", "mon", "Friday", etc.`
    );
  }

  return dayNumber;
}

/**
 * Format day of week number to day name
 *
 * @param dayOfWeek Day of week number (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @returns Full day name
 * @throws Error if day number is invalid
 *
 * @example
 * formatDayName(1) // "Monday"
 * formatDayName(5) // "Friday"
 */
export function formatDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (dayOfWeek < 0 || dayOfWeek > 6) {
    throw new Error(`Invalid dayOfWeek: ${dayOfWeek}. Must be between 0-6.`);
  }

  return days[dayOfWeek];
}

/**
 * Validate timezone string
 *
 * @param timezone IANA timezone string
 * @returns true if valid, false otherwise
 *
 * @example
 * isValidTimezone("America/Los_Angeles") // true
 * isValidTimezone("America/New_York") // true
 * isValidTimezone("Invalid/Timezone") // false
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    DateTime.now().setZone(timezone);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get current time in specified timezone
 *
 * @param timezone IANA timezone string
 * @returns DateTime object in the specified timezone
 */
export function getCurrentTime(timezone: string): DateTime {
  return DateTime.now().setZone(timezone);
}

// Export all helpers
export default {
  getNextMondayNoon,
  getFollowingMondayEnd,
  getEventWindow,
  buildCronExpression,
  parseTimeString,
  parseDayName,
  formatDayName,
  isValidTimezone,
  getCurrentTime,
};
