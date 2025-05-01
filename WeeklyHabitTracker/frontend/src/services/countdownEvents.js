// services/countdownEvents.js
import axios from 'axios';

// Base API URL
const API_URL = '/api/countdown-events';

// Fallback to localStorage if API fails
const STORAGE_KEY = 'countdown_events';

/**
 * Determine the period of the day based on hour
 * @param {string|Date} dateTime - The date and time to check
 * @returns {string|null} - 'morning', 'afternoon', 'evening', or null for all-day events
 */
const determinePeriod = (dateTime) => {
  if (!dateTime) return null;
  
  const date = new Date(dateTime);
  const hour = date.getHours();
  
  if (hour < 12) {
    return 'morning';
  } else if (hour < 17) { // 5 PM
    return 'afternoon';
  } else {
    return 'evening';
  }
};

/**
 * Update the end date for a recurring event based on its next occurrence
 * @param {Object} event - The recurring event
 * @param {string|Date} nextStartDate - The next occurrence start date
 * @returns {string|null} - ISO string of the next end date or null if no duration
 */
const updateEndDateForNextOccurrence = (event, nextStartDate) => {
  // If the event has no duration, return null for endDate
  if (!event.hasDuration || !event.endDate) {
    return null;
  }
  
  // Calculate the duration of the original event in milliseconds
  const originalStartDate = new Date(event.date);
  const originalEndDate = new Date(event.endDate);
  const durationMs = originalEndDate.getTime() - originalStartDate.getTime();
  
  // Apply the same duration to the new start date
  const nextStart = new Date(nextStartDate);
  const newEndDate = new Date(nextStart.getTime() + durationMs);
  return newEndDate.toISOString();
};

/**
 * Fetch all countdown events for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - Array of countdown events
 */
export const fetchCountdownEvents = async (userId) => {
  try {
    console.log('Fetching countdown events from API');
    const token = localStorage.getItem('token');
    const response = await axios.get(API_URL, {
      headers: {
        'x-auth-token': token
      },
      params: { userId }
    });
    
    console.log('Successfully fetched countdown events:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching countdown events from API:', error);
    console.log('Falling back to localStorage');
    
    // Fall back to localStorage if API fails
    const storedEvents = localStorage.getItem(STORAGE_KEY);
    if (storedEvents) {
      const events = JSON.parse(storedEvents);
      return events.filter(event => event.userId === userId);
    }
    
    return [];
  }
};

/**
 * Create a new countdown event
 * @param {Object} eventData - The event data to create
 * @returns {Promise<Object>} - The created event
 */
export const createCountdownEvent = async (eventData) => {
  try {
    // Prepare the event data with new fields
    const processedEventData = {
      ...eventData,
      hasDuration: eventData.hasDuration || false,
      endDate: (eventData.hasDuration && eventData.endDate) ? eventData.endDate : null,
      isAllDay: eventData.isAllDay || false
    };
    
    // Set period based on time if not already set and not all-day
    if (!processedEventData.period && !processedEventData.isAllDay) {
      processedEventData.period = determinePeriod(processedEventData.date);
    } else if (processedEventData.isAllDay) {
      // All-day events don't have a specific period
      processedEventData.period = null;
    }
    
    console.log('Creating countdown event via API:', processedEventData);
    const token = localStorage.getItem('token');
    const response = await axios.post(API_URL, processedEventData, {
      headers: {
        'x-auth-token': token
      }
    });
    
    console.log('Successfully created countdown event:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating countdown event via API:', error);
    console.log('Falling back to localStorage');
    
    // Fall back to localStorage if API fails
    const storedEvents = localStorage.getItem(STORAGE_KEY) || '[]';
    const events = JSON.parse(storedEvents);
    
    // Process data for consistency with backend logic
    const processedEventData = {
      ...eventData,
      hasDuration: eventData.hasDuration || false,
      endDate: (eventData.hasDuration && eventData.endDate) ? eventData.endDate : null,
      isAllDay: eventData.isAllDay || false
    };
    
    // Set period based on time if not all-day
    if (!processedEventData.isAllDay) {
      processedEventData.period = determinePeriod(processedEventData.date);
    } else {
      processedEventData.period = null;
    }
    
    // Generate a temporary ID
    const tempEvent = {
      ...processedEventData,
      _id: `local_${Date.now()}`,
      _offline: true
    };
    
    events.push(tempEvent);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    
    return tempEvent;
  }
};

/**
 * Update an existing countdown event
 * @param {string} eventId - The ID of the event to update
 * @param {Object} eventData - The updated event data
 * @returns {Promise<Object>} - The updated event
 */
export const updateCountdownEvent = async (eventId, eventData) => {
  try {
    // Process updates to handle period based on time changes and all-day setting
    const updateData = { ...eventData };
    
    // If updating date or all-day status, update period accordingly
    if (updateData.date || updateData.isAllDay !== undefined) {
      // Find current event to get existing values
      let currentEvent;
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/${eventId}`, {
          headers: {
            'x-auth-token': token
          }
        });
        currentEvent = response.data;
      } catch (e) {
        // If can't get current event from API, try localStorage
        const storedEvents = localStorage.getItem(STORAGE_KEY) || '[]';
        const events = JSON.parse(storedEvents);
        currentEvent = events.find(event => event._id === eventId) || {};
      }
      
      // Determine if this is an all-day event
      const isAllDay = updateData.isAllDay !== undefined ? 
                        updateData.isAllDay : 
                        currentEvent.isAllDay || false;
      
      if (isAllDay) {
        // All-day events don't have a specific period
        updateData.period = null;
      } else if (updateData.date) {
        // Update period based on new time
        updateData.period = determinePeriod(updateData.date);
      }
      
      // If disabling duration, clear end date
      if (updateData.hasDuration === false) {
        updateData.endDate = null;
      }
    }
    
    console.log(`Updating countdown event ${eventId} via API:`, updateData);
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_URL}/${eventId}`, updateData, {
      headers: {
        'x-auth-token': token
      }
    });
    
    console.log('Successfully updated countdown event:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error updating countdown event ${eventId} via API:`, error);
    console.log('Falling back to localStorage');
    
    // Fall back to localStorage if API fails
    const storedEvents = localStorage.getItem(STORAGE_KEY) || '[]';
    const events = JSON.parse(storedEvents);
    
    // Get the current event
    const currentEvent = events.find(event => event._id === eventId) || {};
    
    // Process updates to handle period based on time changes and all-day setting
    const updateData = { ...eventData };
    
    // If updating date or all-day status, update period accordingly
    if (updateData.date || updateData.isAllDay !== undefined) {
      const isAllDay = updateData.isAllDay !== undefined ? 
                        updateData.isAllDay : 
                        currentEvent.isAllDay || false;
      
      if (isAllDay) {
        // All-day events don't have a specific period
        updateData.period = null;
      } else if (updateData.date) {
        // Update period based on new time
        updateData.period = determinePeriod(updateData.date);
      }
      
      // If disabling duration, clear end date
      if (updateData.hasDuration === false) {
        updateData.endDate = null;
      }
    }
    
    const updatedEvents = events.map(event => 
      event._id === eventId ? { ...currentEvent, ...updateData, _id: eventId, _offline: true } : event
    );
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEvents));
    
    return { ...currentEvent, ...updateData, _id: eventId, _offline: true };
  }
};

/**
 * Delete a countdown event
 * @param {string} eventId - The ID of the event to delete
 * @param {string} userId - The user ID (for validation)
 * @returns {Promise<boolean>} - Success indicator
 */
export const deleteCountdownEvent = async (eventId, userId) => {
  try {
    console.log(`Deleting countdown event ${eventId} via API`);
    const token = localStorage.getItem('token');
    await axios.delete(`${API_URL}/${eventId}`, {
      headers: {
        'x-auth-token': token
      },
      params: { userId }
    });
    
    console.log('Successfully deleted countdown event');
    return true;
  } catch (error) {
    console.error(`Error deleting countdown event ${eventId} via API:`, error);
    console.log('Falling back to localStorage');
    
    // Fall back to localStorage if API fails
    const storedEvents = localStorage.getItem(STORAGE_KEY) || '[]';
    const events = JSON.parse(storedEvents);
    
    const filteredEvents = events.filter(event => event._id !== eventId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredEvents));
    
    return true;
  }
};

/**
 * Complete a recurring event and advance it to the next occurrence
 * @param {string} eventId - The ID of the recurring event
 * @param {Object} data - Additional data (like userId)
 * @returns {Promise<Object>} - The updated event with the next occurrence
 */
export const completeRecurringEvent = async (eventId, data = {}) => {
  try {
    console.log(`Completing recurring event ${eventId}`);
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/${eventId}/complete`, data, {
      headers: {
        'x-auth-token': token
      }
    });
    
    console.log('Successfully completed recurring event:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error completing recurring event ${eventId}:`, error);
    
    // Fall back to localStorage and calculate next occurrence if API fails
    const storedEvents = localStorage.getItem(STORAGE_KEY) || '[]';
    const events = JSON.parse(storedEvents);
    const event = events.find(e => e._id === eventId);
    
    if (event && event.isRecurring) {
      // Calculate next date
      const nextDate = getNextOccurrenceDate(event);
      
      // Update end date if event has duration
      let endDate = null;
      if (event.hasDuration && event.endDate) {
        endDate = updateEndDateForNextOccurrence(event, nextDate);
      }
      
      // Update period if not all-day
      let period = event.period;
      if (!event.isAllDay) {
        period = determinePeriod(nextDate);
      }
      
      // Create updated event
      const updatedEvent = { 
        ...event, 
        date: nextDate,
        endDate: endDate,
        period: period
      };
      
      // Update in localStorage
      const updatedEvents = events.map(e => e._id === eventId ? updatedEvent : e);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEvents));
      
      return updatedEvent;
    }
    
    return null;
  }
};

/**
 * Generate the next occurrence date for a recurring event
 * @param {Object} event - The recurring event
 * @returns {string} - ISO string of the next occurrence date
 */
export const getNextOccurrenceDate = (event) => {
  if (!event.isRecurring) return event.date;
  
  const currentDate = new Date(event.date);
  let nextDate;
  
  switch (event.recurrenceType) {
    case 'daily':
      nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + (event.recurrenceInterval || 1));
      break;
      
    case 'weekly':
      if (!event.daysOfWeek || event.daysOfWeek.length === 0) {
        // If no days specified, just add 7 days
        nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + (7 * (event.recurrenceInterval || 1)));
      } else {
        // Find the next day in the sequence
        const currentDayOfWeek = currentDate.getDay();
        const selectedDays = [...event.daysOfWeek].sort((a, b) => a - b);
        
        let nextDayOfWeek = selectedDays.find(day => day > currentDayOfWeek);
        
        if (nextDayOfWeek === undefined) {
          // If no days are greater than the current day, wrap around to the first day next week
          nextDayOfWeek = selectedDays[0];
          nextDate = new Date(currentDate);
          nextDate.setDate(currentDate.getDate() + (7 - currentDayOfWeek + nextDayOfWeek) + 
                          (7 * ((event.recurrenceInterval || 1) - 1)));
        } else {
          nextDate = new Date(currentDate);
          nextDate.setDate(currentDate.getDate() + (nextDayOfWeek - currentDayOfWeek));
        }
      }
      break;
      
    case 'monthly':
      nextDate = new Date(currentDate);
      nextDate.setMonth(nextDate.getMonth() + (event.recurrenceInterval || 1));
      
      // Handle day of month (if specified)
      if (event.dayOfMonth) {
        nextDate.setDate(Math.min(event.dayOfMonth, getDaysInMonth(nextDate.getMonth(), nextDate.getFullYear())));
      }
      break;
      
    case 'yearly':
      nextDate = new Date(currentDate);
      nextDate.setFullYear(nextDate.getFullYear() + (event.recurrenceInterval || 1));
      
      // Handle month and day (if specified)
      if (event.monthOfYear !== undefined) {
        nextDate.setMonth(event.monthOfYear);
      }
      
      if (event.dayOfMonth) {
        nextDate.setDate(Math.min(event.dayOfMonth, getDaysInMonth(nextDate.getMonth(), nextDate.getFullYear())));
      }
      break;
      
    default:
      nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);
  }
  
  return nextDate.toISOString();
};

/**
 * Helper function to get the number of days in a month
 * @param {number} month - The month (0-11)
 * @param {number} year - The year
 * @returns {number} - Number of days in the month
 */
const getDaysInMonth = (month, year) => {
  return new Date(year, month + 1, 0).getDate();
};

/**
 * Check if any recurring events need to be updated
 * (typically called when the app loads)
 * @param {Array} events - The array of countdown events
 * @returns {Promise<Array>} - Updated array of events
 */
export const checkAndUpdateRecurringEvents = async (events) => {
  if (!events || events.length === 0) return events;
  
  const now = new Date();
  const updatedEvents = [];
  let hasChanges = false;
  
  for (const event of events) {
    if (event.isRecurring) {
      const eventDate = new Date(event.date);
      
      // If the recurring event date is in the past, update it
      if (eventDate < now) {
        // Calculate the next occurrence
        const nextDate = getNextOccurrenceDate(event);
        
        // Update end date if event has duration
        let endDate = event.endDate;
        if (event.hasDuration && event.endDate) {
          endDate = updateEndDateForNextOccurrence(event, nextDate);
        }
        
        // Update period if not all-day
        let period = event.period;
        if (!event.isAllDay) {
          period = determinePeriod(nextDate);
        }
        
        const updatedEvent = { 
          ...event, 
          date: nextDate,
          endDate: endDate,
          period: period
        };
        
        try {
          // Update the event in the database
          const savedEvent = await updateCountdownEvent(event._id, updatedEvent);
          updatedEvents.push(savedEvent);
        } catch (error) {
          // If update fails, just use the calculated next date
          updatedEvents.push(updatedEvent);
        }
        
        hasChanges = true;
      } else {
        updatedEvents.push(event);
      }
    } else {
      updatedEvents.push(event);
    }
  }
  
  return hasChanges ? updatedEvents : events;
};

export default {
  fetchCountdownEvents,
  createCountdownEvent,
  updateCountdownEvent,
  deleteCountdownEvent,
  getNextOccurrenceDate,
  checkAndUpdateRecurringEvents,
  completeRecurringEvent
};