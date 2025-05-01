const CountdownEvent = require('../models/CountdownEvent');
const inMemoryStorage = require('../storage/inMemoryStorage');
const { isMongoConnected } = require('../config/db');

/**
 * Calculate the next occurrence date for a recurring event
 */
const calculateNextOccurrence = (event) => {
  const currentDate = new Date(event.date);
  let nextDate = new Date(currentDate);
  
  switch (event.recurrenceType) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + (event.recurrenceInterval || 1));
      break;
      
    case 'weekly':
      if (!event.daysOfWeek || event.daysOfWeek.length === 0) {
        // If no days specified, just add 7 days
        nextDate.setDate(nextDate.getDate() + (7 * (event.recurrenceInterval || 1)));
      } else {
        // Find the next day in the sequence
        const currentDayOfWeek = currentDate.getDay();
        const selectedDays = [...event.daysOfWeek].sort((a, b) => a - b);
        
        let nextDayOfWeek = selectedDays.find(day => day > currentDayOfWeek);
        
        if (nextDayOfWeek === undefined) {
          // If no days are greater than the current day, wrap around to the first day next week
          nextDayOfWeek = selectedDays[0];
          nextDate.setDate(currentDate.getDate() + (7 - currentDayOfWeek + nextDayOfWeek) + 
                          (7 * ((event.recurrenceInterval || 1) - 1)));
        } else {
          nextDate.setDate(currentDate.getDate() + (nextDayOfWeek - currentDayOfWeek));
        }
      }
      break;
      
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + (event.recurrenceInterval || 1));
      
      // Handle day of month (if specified)
      if (event.dayOfMonth) {
        const daysInMonth = new Date(
          nextDate.getFullYear(), 
          nextDate.getMonth() + 1, 
          0
        ).getDate();
        
        nextDate.setDate(Math.min(event.dayOfMonth, daysInMonth));
      }
      break;
      
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + (event.recurrenceInterval || 1));
      
      // Handle month and day (if specified)
      if (event.monthOfYear !== undefined) {
        nextDate.setMonth(event.monthOfYear);
      }
      
      if (event.dayOfMonth) {
        const daysInMonth = new Date(
          nextDate.getFullYear(), 
          nextDate.getMonth() + 1, 
          0
        ).getDate();
        
        nextDate.setDate(Math.min(event.dayOfMonth, daysInMonth));
      }
      break;
      
    default:
      nextDate.setDate(nextDate.getDate() + 1);
  }
  
  // Check if we've passed the recurrence end date (if specified)
  if (event.recurrenceEndDate && nextDate > new Date(event.recurrenceEndDate)) {
    return null;
  }
  
  return nextDate;
};

/**
 * Determine the period of the day based on hour
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
 */
const updateEndDateForNextOccurrence = (event, nextDate) => {
  // If the event has no duration, return null for endDate
  if (!event.hasDuration || !event.endDate) {
    return null;
  }
  
  // Calculate the duration of the original event in milliseconds
  const originalStartDate = new Date(event.date);
  const originalEndDate = new Date(event.endDate);
  const durationMs = originalEndDate.getTime() - originalStartDate.getTime();
  
  // Apply the same duration to the new start date
  const newEndDate = new Date(nextDate.getTime() + durationMs);
  return newEndDate;
};

// Get all countdown events for a user
exports.getCountdownEvents = async (req, res) => {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }
    
    let events;
    
    if (isMongoConnected()) {
      // Use MongoDB
      events = await CountdownEvent.find({ userId }).sort({ date: 1 });
      console.log(`Retrieved ${events.length} countdown events from MongoDB for user ${userId}`);
    } else {
      // Use in-memory storage
      events = await inMemoryStorage.getCountdownEvents(userId);
      console.log(`Retrieved ${events.length} countdown events from in-memory storage for user ${userId}`);
    }
    
    // Check if any recurring events need to be updated
    const now = new Date();
    let hasChanges = false;
    
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      
      if (event.isRecurring && new Date(event.date) < now) {
        // Calculate the next occurrence date
        const nextDate = calculateNextOccurrence(event);
        
        // If there is no next occurrence (past end date), skip updating
        if (!nextDate) continue;
        
        // Update end date if the event has duration
        const newEndDate = updateEndDateForNextOccurrence(event, nextDate);
        
        // Update the event with the new dates
        const updateData = { date: nextDate };
        if (event.hasDuration) {
          updateData.endDate = newEndDate;
        }
        
        // Recalculate period if needed and not an all-day event
        if (!event.isAllDay) {
          updateData.period = determinePeriod(nextDate);
        }
        
        if (isMongoConnected()) {
          await CountdownEvent.findByIdAndUpdate(
            event._id,
            { $set: updateData },
            { new: true }
          );
        } else {
          inMemoryStorage.updateCountdownEvent(event._id, {
            ...event,
            ...updateData
          });
        }
        
        // Update the event in the response
        events[i] = { ...events[i], ...updateData };
        hasChanges = true;
      }
    }
    
    // Re-fetch events if there were changes
    if (hasChanges && isMongoConnected()) {
      events = await CountdownEvent.find({ userId }).sort({ date: 1 });
    }
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching countdown events:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new countdown event
exports.createCountdownEvent = async (req, res) => {
  try {
    console.log('FULL REQUEST BODY:', JSON.stringify(req.body, null, 2));
    const eventData = req.body;
    const { name, date, userId } = eventData;
    
    if (!name || !date || !userId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Set default values for new fields if not provided
    const processedEventData = {
      ...eventData,
      hasDuration: eventData.hasDuration || false,
      endDate: (eventData.hasDuration && eventData.endDate) ? eventData.endDate : null,
      isAllDay: eventData.isAllDay || false
    };
    
    // Set period based on the time of day if not all-day event
    if (!processedEventData.isAllDay && !processedEventData.period) {
      processedEventData.period = determinePeriod(processedEventData.date);
    } else if (processedEventData.isAllDay) {
      // All-day events don't have a specific period
      processedEventData.period = null;
    }
    
    let savedEvent;
    
    if (isMongoConnected()) {
      // Use MongoDB
      const event = new CountdownEvent(processedEventData);
      console.log('EVENT BEFORE SAVE:', JSON.stringify(event, null, 2));
      
      savedEvent = await event.save();
      console.log('SAVED EVENT FROM DB:', JSON.stringify(savedEvent, null, 2));
      console.log(`Created new countdown event in MongoDB: ${savedEvent.name} for user ${userId}`);
    } else {
      // Use in-memory storage
      savedEvent = await inMemoryStorage.createCountdownEvent(processedEventData);
      console.log('SAVED EVENT FROM MEMORY:', JSON.stringify(savedEvent, null, 2));
      console.log(`Created new countdown event in in-memory storage: ${processedEventData.name} for user ${userId}`);
    }
    
    res.status(201).json(savedEvent);
  } catch (error) {
    console.error('Error creating countdown event:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a countdown event
exports.updateCountdownEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Handle period update based on time changes and all-day setting
    if (updateData.date || updateData.isAllDay !== undefined) {
      // Find existing event to get current values
      let existingEvent;
      if (isMongoConnected()) {
        existingEvent = await CountdownEvent.findById(id);
      } else {
        existingEvent = await inMemoryStorage.getCountdownEventById(id);
      }
      
      if (!existingEvent) {
        return res.status(404).json({ message: 'Countdown event not found' });
      }
      
      // Set isAllDay based on the update or existing value
      const isAllDay = updateData.isAllDay !== undefined ? 
        updateData.isAllDay : existingEvent.isAllDay;
      
      if (isAllDay) {
        // All-day events don't have a specific period
        updateData.period = null;
      } else if (updateData.date) {
        // Only update period if date is changing
        updateData.period = determinePeriod(updateData.date);
      }
      
      // If hasDuration is being changed to false, clear endDate
      if (updateData.hasDuration === false) {
        updateData.endDate = null;
      }
    }
    
    let event;
    
    if (isMongoConnected()) {
      // Use MongoDB
      event = await CountdownEvent.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );
      console.log(`Updated countdown event in MongoDB: ${event?._id || id}`);
    } else {
      // Use in-memory storage
      event = await inMemoryStorage.updateCountdownEvent(id, updateData);
      console.log(`Updated countdown event in in-memory storage: ${id}`);
    }
    
    if (!event) {
      return res.status(404).json({ message: 'Countdown event not found' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Error updating countdown event:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a countdown event
exports.deleteCountdownEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    let result;
    
    if (isMongoConnected()) {
      // Use MongoDB
      result = await CountdownEvent.findByIdAndDelete(id);
      console.log(`Deleted countdown event from MongoDB: ${result?._id || id}`);
    } else {
      // Use in-memory storage
      result = await inMemoryStorage.deleteCountdownEvent(id);
      console.log(`Deleted countdown event from in-memory storage: ${id}`);
    }
    
    if (!result) {
      return res.status(404).json({ message: 'Countdown event not found' });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting countdown event:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single countdown event by ID
exports.getCountdownEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    let event;
    
    if (isMongoConnected()) {
      // Use MongoDB
      event = await CountdownEvent.findById(id);
      console.log(`Retrieved countdown event from MongoDB: ${event?._id || id}`);
    } else {
      // Use in-memory storage
      event = await inMemoryStorage.getCountdownEventById(id);
      console.log(`Retrieved countdown event from in-memory storage: ${id}`);
    }
    
    if (!event) {
      return res.status(404).json({ message: 'Countdown event not found' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Error fetching countdown event:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Mark a recurring event as complete and set the next occurrence
 */
exports.completeRecurringEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }
    
    // Find the event first to verify it exists and is recurring
    let event;
    
    if (isMongoConnected()) {
      event = await CountdownEvent.findById(id);
    } else {
      event = await inMemoryStorage.getCountdownEventById(id);
    }
    
    if (!event) {
      return res.status(404).json({ message: 'Countdown event not found' });
    }
    
    // Verify this is a recurring event
    if (!event.isRecurring) {
      return res.status(400).json({ message: 'This is not a recurring event' });
    }
    
    // Calculate the next occurrence date
    const nextDate = calculateNextOccurrence(event);
    
    // If there is no next occurrence (past end date), inform the client
    if (!nextDate) {
      return res.status(400).json({ 
        message: 'No more occurrences - event has reached its end date',
        eventEnded: true
      });
    }
    
    // Update end date if event has duration
    const newEndDate = updateEndDateForNextOccurrence(event, nextDate);
    
    // Prepare update data
    const updateData = {
      date: nextDate instanceof Date ? nextDate.toISOString() : nextDate
    };
    
    // Include endDate if event has duration
    if (event.hasDuration) {
      updateData.endDate = newEndDate instanceof Date ? newEndDate.toISOString() : newEndDate;
    }
    
    // Recalculate period if not an all-day event
    if (!event.isAllDay) {
      updateData.period = determinePeriod(nextDate);
    }
    
    let savedEvent;
    
    if (isMongoConnected()) {
      savedEvent = await CountdownEvent.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      );
      console.log(`Updated recurring event in MongoDB: ${savedEvent?._id || id}`);
    } else {
      savedEvent = await inMemoryStorage.updateCountdownEvent(id, {
        ...event,
        ...updateData
      });
      console.log(`Updated recurring event in in-memory storage: ${id}`);
    }
    
    if (!savedEvent) {
      return res.status(404).json({ message: 'Failed to update recurring event' });
    }
    
    res.json(savedEvent);
  } catch (error) {
    console.error('Error completing recurring event:', error);
    res.status(500).json({ message: 'Server error' });
  }
};