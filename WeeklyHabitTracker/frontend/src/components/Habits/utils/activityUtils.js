// activityUtils.js - Utility functions for activities and habits
import { formatDateKey } from './dateUtils';

/**
 * Check if a habit should occur on a specific day of week
 * @param {Object} habit - Habit object 
 * @param {number} dayIndex - Day of week index (0-6)
 * @returns {boolean} Whether habit should occur on this day
 */
export const shouldOccurOnDay = (habit, dayIndex) => {
  if (!habit || !habit.repeatDays || habit.repeatDays.length === 0) {
    return true; // If no days specified, assume all days
  }
  return habit.repeatDays.includes(dayIndex);
};

/**
 * Check if a habit is complete on a specific date
 * @param {string} habitId - Habit ID
 * @param {Date} date - Date to check
 * @param {Object} completions - Completions by habit ID for current day
 * @param {Object} dateCompletions - Historical completions by habit ID and date
 * @returns {boolean} Whether habit is complete on this date
 */
export const isHabitCompleteOnDate = (habitId, date, completions = {}, dateCompletions = {}) => {
  if (!habitId || !date) return false;

  const dateKey = formatDateKey(date);
  const today = formatDateKey(new Date());

  // For today's date
  if (dateKey === today) {
    // Check in-memory completions first
    if (completions[habitId] !== undefined) {
      return !!completions[habitId];
    }
    // Fall back to dateCompletions
    return dateCompletions[habitId] && 
           dateCompletions[habitId][dateKey] !== undefined ? 
           !!dateCompletions[habitId][dateKey] : false;
  }

  // For other dates, check dateCompletions
  return dateCompletions[habitId] && 
         dateCompletions[habitId][dateKey] !== undefined ? 
         !!dateCompletions[habitId][dateKey] : false;
};

/**
 * Calculate adaptive height for an activity card based on duration
 * @param {Object} activity - Activity object
 * @param {boolean} isMobileView - Whether in mobile view
 * @returns {number} Height in pixels
 */
export const getActivityHeight = (activity, isMobileView = false) => {
  const minHeight = isMobileView ? 40 : 55;
  const heightFactor = isMobileView ? 0.8 : 1.2;
  
  if (!activity || !activity.duration) {
    return minHeight;
  }
  
  return Math.max(minHeight, Math.min(200, activity.duration * heightFactor));
};

/**
 * Process activity array to calculate and assign default order values
 * @param {Array} activities - Array of activity objects
 * @returns {Array} Processed activities with order values
 */
export const processActivitiesWithOrder = (activities) => {
  if (!activities || !activities.length) return [];
  
  // Group by period
  const groupedByPeriod = activities.reduce((acc, activity) => {
    const period = activity.period || 'morning'; // Default to morning
    if (!acc[period]) acc[period] = [];
    acc[period].push(activity);
    return acc;
  }, {});
  
  // Sort each group and assign orders if missing
  Object.entries(groupedByPeriod).forEach(([period, periodActivities]) => {
    // Sort first by existing order if available
    periodActivities.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // Then assign incremental orders if missing
    periodActivities.forEach((activity, index) => {
      if (activity.order === undefined) {
        activity.order = index * 10;
      }
    });
  });
  
  // Return flattened array
  return Object.values(groupedByPeriod).flat();
};