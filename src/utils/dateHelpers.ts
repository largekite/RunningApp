import { addDays, addWeeks, format, startOfWeek, differenceInWeeks, differenceInCalendarDays } from 'date-fns';

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd');
}

/**
 * Get date for a specific day of the week
 */
export function getDateForDay(startDate: Date | string, dayOffset: number): Date {
  const d = typeof startDate === 'string' ? new Date(startDate) : startDate;
  return addDays(d, dayOffset);
}

/**
 * Get start of week for a given date
 */
export function getWeekStart(date: Date | string, weekStartsOn: 0 | 1 = 0): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  return startOfWeek(d, { weekStartsOn });
}

/**
 * Calculate number of weeks between two dates
 */
export function getWeeksBetween(start: Date | string, end: Date | string): number {
  const startD = typeof start === 'string' ? new Date(start) : start;
  const endD = typeof end === 'string' ? new Date(end) : end;
  return differenceInWeeks(endD, startD);
}

/**
 * Get date N weeks from now
 */
export function getDateWeeksFromNow(weeks: number, from?: Date | string): Date {
  const startDate = from
    ? (typeof from === 'string' ? new Date(from) : from)
    : new Date();
  return addWeeks(startDate, weeks);
}

/**
 * Get all dates for a week starting from a given date
 */
export function getWeekDates(startDate: Date | string): string[] {
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    dates.push(formatDate(getDateForDay(startDate, i)));
  }
  return dates;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  return formatDate(new Date());
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  return formatDate(date1) === formatDate(date2);
}

/**
 * Calculate the number of days until a target date
 */
export function getDaysUntil(targetDate: Date | string): number {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  return differenceInCalendarDays(target, new Date());
}

/**
 * Calculate the dynamic current week number (1-based) from plan start date
 */
export function getDynamicWeekNumber(startDate: string, totalWeeks: number): number {
  const start = new Date(startDate);
  const daysSinceStart = differenceInCalendarDays(new Date(), start);
  return Math.max(1, Math.min(Math.ceil((daysSinceStart + 1) / 7), totalWeeks));
}
