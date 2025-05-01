import { formatDateKey } from './dateUtils';

/**
 * Check if a habit should occur on a specific day of week
 * @param {Object} habit - Habit object 
 * @param {number} dayIndex - Day of week index (0-6)
 * @returns {boolean} Whether habit should occur on this day
 */
export const shouldOccurOnDay = (habit, dayIndex) => {
  if (!habit || !habit.repeatDays) return true; // Default to all days if not specified
  return habit.repeatDays.includes(dayIndex);
};

/**
 * Check if a habit is complete on a specific date
 * @param {string} habitId - Habit ID
 * @param {Date} date - Date to check
 * @param {Object} completions - Current day completions (from UI state)
 * @param {Object} dateCompletions - Historical completions (from database)
 * @returns {boolean} Whether habit is complete on this date
 */
export const isHabitCompleteOnDate = (habitId, date, completions = {}, dateCompletions = {}) => {
  if (!habitId || !date) {
    console.warn('[isHabitCompleteOnDate] Missing habitId or date:', { habitId, date });
    return false;
  }

  const dateKey = formatDateKey(date);
  const today = formatDateKey(new Date());

  // For today's date
  if (dateKey === today) {
    // Check dateCompletions (database) as the primary source
    if (dateCompletions && dateCompletions[habitId] && dateCompletions[habitId][dateKey] !== undefined) {
      return !!dateCompletions[habitId][dateKey];
    }
    // Fall back to completions (UI state)
    return !!completions[habitId];
  }

  // For past/future days, check dateCompletions
  return dateCompletions && dateCompletions[habitId] && dateCompletions[habitId][dateKey] !== undefined ? !!dateCompletions[habitId][dateKey] : false;
};

/**
 * Get responsive height for an activity card based on duration
 * @param {Object} activity - Activity object
 * @param {boolean} isMobileView - Whether we're in mobile view
 * @returns {number} Activity height in pixels
 */
export const getActivityHeight = (activity, isMobileView) => {
  // Base minimum height
  const minHeight = isMobileView ? 35 : 45;

  // Height factor depends on screen size
  const heightFactor = isMobileView ? 1.0 : 1.5;

  // Calculate proportional height with minimum
  return Math.max(minHeight, (activity?.duration || 0) * heightFactor);
};

/**
 * Get emoji based on streak length
 * @param {number} count - Streak count
 * @returns {string} Emoji representing streak length
 */
export const getMasterStreakEmoji = (count) => {
  if (count >= 30) return '🏆'; // Trophy for 30+ days
  if (count >= 21) return '🔥🔥🔥'; // Triple flame for 21+ days
  if (count >= 14) return '🔥🔥'; // Double flame for 14+ days
  if (count >= 7) return '🔥'; // Single flame for 7+ days
  if (count >= 3) return '✨'; // Sparkles for 3+ days
  if (count >= 1) return '🌱'; // Seedling for 1+ days
  return '⭐'; // Star for 0
};

/**
 * Get color based on streak category
 * @param {string} category - Streak category (active, archived, all)
 * @returns {string} Color value
 */
export const getStreakCategoryColor = (category) => {
  switch (category) {
    case 'active':
      return '#28a745'; // Green for active habits
    case 'archived':
      return '#6c757d'; // Gray for archived habits
    case 'all':
      return '#007bff'; // Blue for all habits
    default:
      return '#6c757d';
  }
};