/**
 * Date utility functions for the application
 */

/**
 * Format date as YYYY-MM-DD
 */
export const formatDateKey = (date) => {
  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
};

/**
 * Calculate a date that's offset from today
 */
export const getDateFromOffset = (offset) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date;
};

/**
 * Format date for display (e.g., "Oct 12")
 */
export const formatDateDisplay = (date) => {
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric' 
  }).format(date);
};

/**
 * Extract hour (0-23) from time string like "8:30 AM"
 */
export const getHourFromTimeString = (timeString) => {
  const match = timeString.match(/(\d+):(\d+) (AM|PM)/);
  if (!match) return 0;
  
  let hour = parseInt(match[1]);
  const isPM = match[3] === 'PM';
  
  // Convert to 24-hour format
  if (isPM && hour !== 12) hour += 12;
  if (!isPM && hour === 12) hour = 0;
  
  return hour;
};

/**
 * Compare two time strings for sorting
 */
export const compareTimeStrings = (timeA, timeB) => {
  const hourA = getHourFromTimeString(timeA);
  const hourB = getHourFromTimeString(timeB);
  
  if (hourA !== hourB) return hourA - hourB;
  
  // If hours are equal, compare minutes
  const minuteA = parseInt(timeA.match(/(\d+):(\d+)/)[2]);
  const minuteB = parseInt(timeB.match(/(\d+):(\d+)/)[2]);
  
  return minuteA - minuteB;
};

/**
 * Convert a timestamp or ISO string to a YYYY-MM-DD string in local timezone
 */
export const toLocalDateString = (dateInput) => {
  const date = new Date(dateInput);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

/**
 * Create a UTC midnight date from a YYYY-MM-DD string
 */
export const toUTCMidnightISOString = (dateString) => {
  return dateString + 'T00:00:00.000Z';
};

/**
 * Normalize a date to midnight UTC
 */
export const normalizeToUTCMidnight = (dateInput) => {
  // Return the date unchanged to preserve the original time
  const date = new Date(dateInput);
  return date.toISOString();
};