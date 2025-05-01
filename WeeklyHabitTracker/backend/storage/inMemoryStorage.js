// In-memory storage fallback for when MongoDB is not available

// In-memory storage
const activities = new Map();
const users = new Map();
const countdownEvents = new Map();
const calendarEvents = new Map();
let nextId = 1;

// Create a test activity with day-specific notes (comment out in production)
const testActivity = {
  _id: 'day_notes_test',
  name: 'Test Day-Specific Notes',
  duration: 30,
  period: 'morning',
  userId: 'user123',
  isHabit: true,
  repeatDays: [0, 1, 2, 3, 4, 5, 6], // All days
  daySpecificNotes: true,
  notes: {
    0: 'Sunday: This note is specific to Sunday',
    1: 'Monday: This note is specific to Monday',
    2: 'Tuesday: This note is specific to Tuesday',
    3: 'Wednesday: This note is specific to Wednesday',
    4: 'Thursday: This note is specific to Thursday',
    5: 'Friday: This note is specific to Friday',
    6: 'Saturday: This note is specific to Saturday'
  },
  createdAt: new Date()
};
activities.set('day_notes_test', testActivity);

// Create a test activity with recurring and next session notes
const recurringNotesActivity = {
  _id: 'recurring_notes_test',
  name: 'Guitar Practice',
  duration: 45,
  period: 'afternoon',
  userId: 'user123',
  isHabit: true,
  repeatDays: [0, 1, 2, 3, 4, 5, 6], // All days
  daySpecificNotes: true,
  // Regular session notes
  notes: {
    0: 'Practiced finger exercises and "Stairway to Heaven"',
    1: 'Worked on chord transitions',
    2: 'Practiced scales and arpeggios',
    3: 'Focused on rhythm exercises',
    4: 'Worked on "Dust in the Wind" fingerpicking pattern',
    5: 'Practiced barre chords',
    6: 'Jam session practice with backing tracks'
  },
  // Recurring reminders for each day
  recurringNotes: {
    0: 'Remember to stretch hands before playing',
    1: 'Focus on clean chord changes today',
    2: 'Try playing scales with a metronome',
    3: 'Work on timing and rhythm today',
    4: 'Remember to tune the guitar first',
    5: 'Practice F barre chord especially',
    6: 'Have fun with improvisation today'
  },
  // Next session notes (future reminders)
  nextSessionNotes: {
    0: 'Continue working on the solo section',
    1: 'Try the new picking pattern we learned',
    2: 'Remember to practice the bridge section',
    3: 'Work on the difficult transition at measure 32',
    4: 'Try the alternate tuning we discussed',
    5: 'Focus on dynamics in the chorus',
    6: 'Record yourself to review progress'
  },
  createdAt: new Date()
};
activities.set('recurring_notes_test', recurringNotesActivity);

// Create a sample user
const testUser = {
  userId: 'user123',
  name: 'Test User',
  email: 'test@example.com',
  avatar: 'https://via.placeholder.com/150',
  goals: [
    { text: 'Complete 7 day streak', completed: false },
    { text: 'Meditate daily', completed: true },
    { text: 'Drink more water', completed: false }
  ],
  theme: 'light',
  dailyTarget: '3',
  joinDate: new Date('2023-01-01'),
  bio: 'I am a test user trying to build better habits!',
  createdAt: new Date(),
  updatedAt: new Date()
};
users.set('user123', testUser);

// Add some sample calendar events
const sampleCalendarEvents = [
  {
    _id: 'cal_sample_1',
    title: 'Team Meeting',
    startTime: '9:00 AM',
    endTime: '10:00 AM',
    day: 1, // Monday
    period: 'morning',
    source: 'google',
    userId: 'user123',
    createdAt: new Date()
  },
  {
    _id: 'cal_sample_2',
    title: 'Gym Session',
    startTime: '6:00 PM',
    endTime: '7:30 PM',
    day: 3, // Wednesday
    period: 'evening',
    source: 'app',
    userId: 'user123',
    createdAt: new Date()
  }
];

sampleCalendarEvents.forEach(event => {
  calendarEvents.set(event._id, event);
});

// Add sample countdown events including recurring ones
const sampleCountdownEvents = [
  {
    _id: 'countdown_sample_1',
    name: 'Vacation',
    date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
    description: 'Annual family trip to Hawaii',
    notes: 'Remember to pack sunscreen and beach gear',
    userId: 'user123',
    color: 'blue',
    isRecurring: false,
    createdAt: new Date()
  },
  {
    _id: 'countdown_sample_2',
    name: 'Weekly Team Meeting',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    description: 'Status updates and sprint planning',
    notes: 'Prepare project status report',
    userId: 'user123',
    color: 'yellow',
    isRecurring: true,
    recurrenceType: 'weekly',
    recurrenceInterval: 1,
    daysOfWeek: [1], // Monday
    recurrenceEndDate: null,
    createdAt: new Date()
  },
  {
    _id: 'countdown_sample_3',
    name: 'Daily Meditation',
    date: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours from now
    description: '15-minute morning meditation practice',
    notes: 'Focus on breathing techniques',
    userId: 'user123',
    color: 'teal',
    isRecurring: true,
    recurrenceType: 'daily',
    recurrenceInterval: 1,
    recurrenceEndDate: null,
    createdAt: new Date()
  }
];

sampleCountdownEvents.forEach(event => {
  countdownEvents.set(event._id, event);
});

// Helper to generate string IDs similar to MongoDB
const generateId = () => {
  return `mock_${nextId++}`;
};

// Helper to generate calendar event IDs
const generateCalendarEventId = () => {
  return `cal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Helper to generate countdown event IDs
const generateCountdownEventId = () => {
  return `countdown_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Helper function to calculate the next occurrence date for a recurring event
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

// Get all activities for a user
const getActivities = async (userId) => {
  return Array.from(activities.values())
    .filter(activity => activity.userId === userId);
};

// Get a single activity by ID
const getActivity = async (id) => {
  return activities.get(id) || null;
};

// Create a new activity
const createActivity = async (activityData) => {
  const id = generateId();
  
  // Ensure the activity has an order field (defaults to 0 if not provided)
  const order = activityData.order !== undefined ? activityData.order : 0;
  
  const activity = {
    _id: id,
    ...activityData,
    order,
    createdAt: new Date()
  };
  
  activities.set(id, activity);
  return activity;
};

// Update an activity
const updateActivity = async (id, activityData) => {
  const activity = activities.get(id);
  
  if (!activity) {
    return null;
  }
  
  const updatedActivity = {
    ...activity,
    ...activityData,
    _id: id // Ensure ID doesn't change
  };
  
  activities.set(id, updatedActivity);
  return updatedActivity;
};

// Delete an activity
const deleteActivity = async (id) => {
  if (!activities.has(id)) {
    return false;
  }
  
  activities.delete(id);
  return true;
};

// Complete an activity
const completeActivity = async (activityId, userId, date) => {
  // In a real app, this would store completion status for each day
  // Here we just return a mock success response
  return {
    _id: generateId(),
    activityId,
    userId,
    completedDate: date,
    createdAt: new Date()
  };
};

// User functions
const getUserProfile = async (userId) => {
  return users.get(userId) || null;
};

const getUserByEmail = async (email) => {
  // Find user by email
  for (const [id, user] of users.entries()) {
    if (user.email && user.email.toLowerCase() === email.toLowerCase()) {
      return user;
    }
  }
  return null;
};

const createUser = async (userData) => {
  // Simple password hashing for in-memory storage
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userData.password, salt);
  
  const newUser = {
    ...userData,
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  users.set(userData.userId, newUser);
  return newUser;
};

const verifyPassword = async (email, password) => {
  const user = await getUserByEmail(email);
  if (!user) return false;
  
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(password, user.password);
};

const updateUserProfile = async (userId, userData) => {
  const user = users.get(userId);
  
  if (!user) {
    // Create new user if it doesn't exist
    const newUser = {
      userId,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    users.set(userId, newUser);
    return newUser;
  }
  
  // Handle password updates
  if (userData.password && userData.password !== user.password) {
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    userData.password = await bcrypt.hash(userData.password, salt);
  }
  
  // Update existing user
  const updatedUser = {
    ...user,
    ...userData,
    userId, // Ensure ID doesn't change
    updatedAt: new Date()
  };
  
  users.set(userId, updatedUser);
  return updatedUser;
};

// Countdown event functions
const getCountdownEvents = async (userId) => {
  const events = Array.from(countdownEvents.values())
    .filter(event => event.userId === userId);
  
  // Check for past recurring events and update them
  const now = new Date();
  let hasChanges = false;
  
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    
    if (event.isRecurring && new Date(event.date) < now) {
      // Calculate the next occurrence date
      const nextDate = calculateNextOccurrence(event);
      
      // If there is no next occurrence (past end date), skip updating
      if (!nextDate) continue;
      
      // Update the event with the new date
      const updatedEvent = {
        ...event,
        date: nextDate instanceof Date ? nextDate.toISOString() : nextDate
      };
      
      countdownEvents.set(event._id, updatedEvent);
      
      // Update the event in the response
      events[i] = updatedEvent;
      hasChanges = true;
      
      console.log(`[InMemoryStorage] Updated recurring event date: ${event._id}, next occurrence: ${nextDate}`);
    }
  }
  
  // Sort by date (closest first)
  return events.sort((a, b) => new Date(a.date) - new Date(b.date));
};

const getCountdownEventById = async (id) => {
  return countdownEvents.get(id) || null;
};

const createCountdownEvent = async (eventData) => {
  const id = generateCountdownEventId();
  const event = {
    _id: id,
    ...eventData,
    createdAt: new Date()
  };
  
  // Ensure required fields for recurring events
  if (event.isRecurring) {
    event.recurrenceType = event.recurrenceType || 'daily';
    event.recurrenceInterval = event.recurrenceInterval || 1;
    
    // Set appropriate default values based on recurrence type
    if (event.recurrenceType === 'weekly' && (!event.daysOfWeek || event.daysOfWeek.length === 0)) {
      // Default to Monday if none specified
      event.daysOfWeek = [1];
    } else if (event.recurrenceType === 'monthly' && !event.dayOfMonth) {
      // Default to 1st day of month
      event.dayOfMonth = 1;
    } else if (event.recurrenceType === 'yearly') {
      if (event.monthOfYear === undefined) event.monthOfYear = 0; // January
      if (!event.dayOfMonth) event.dayOfMonth = 1; // 1st day
    }
  }
  
  countdownEvents.set(id, event);
  console.log(`[InMemoryStorage] Created countdown event: ${id}, isRecurring: ${event.isRecurring}`);
  return event;
};

const updateCountdownEvent = async (id, eventData) => {
  const event = countdownEvents.get(id);
  
  if (!event) {
    return null;
  }
  
  const updatedEvent = {
    ...event,
    ...eventData,
    _id: id // Ensure ID doesn't change
  };
  
  // Ensure required fields for recurring events remain
  if (updatedEvent.isRecurring) {
    if (!updatedEvent.recurrenceType) {
      updatedEvent.recurrenceType = 'daily';
    }
    if (!updatedEvent.recurrenceInterval) {
      updatedEvent.recurrenceInterval = 1;
    }
  }
  
  countdownEvents.set(id, updatedEvent);
  console.log(`[InMemoryStorage] Updated countdown event: ${id}`);
  return updatedEvent;
};

const deleteCountdownEvent = async (id) => {
  if (!countdownEvents.has(id)) {
    return false;
  }
  
  const deleted = countdownEvents.get(id);
  countdownEvents.delete(id);
  console.log(`[InMemoryStorage] Deleted countdown event: ${id}`);
  return deleted;
};

// Complete a recurring countdown event
const completeRecurringEvent = async (id) => {
  const event = countdownEvents.get(id);
  
  if (!event) {
    return null;
  }
  
  // Verify this is a recurring event
  if (!event.isRecurring) {
    console.log(`[InMemoryStorage] Cannot complete event ${id} - not recurring`);
    return null;
  }
  
  // Calculate the next occurrence date
  const nextDate = calculateNextOccurrence(event);
  
  // If there is no next occurrence (past end date), return
  if (!nextDate) {
    console.log(`[InMemoryStorage] No more occurrences for event ${id} - reached end date`);
    return null;
  }
  
  // Update the event with the new date
  const updatedEvent = {
    ...event,
    date: nextDate instanceof Date ? nextDate.toISOString() : nextDate
  };
  
  countdownEvents.set(id, updatedEvent);
  console.log(`[InMemoryStorage] Completed recurring event: ${id}, next occurrence: ${nextDate}`);
  return updatedEvent;
};

// Update user password
const updateUserPassword = async (userId, hashedPassword) => {
  const user = users.get(userId);
  
  if (!user) {
    return false;
  }
  
  // Update password
  user.password = hashedPassword;
  user.updatedAt = new Date();
  
  // Save back to map
  users.set(userId, user);
  return true;
};

// Calendar event functions
const getCalendarEvents = async (userId) => {
  return Array.from(calendarEvents.values())
    .filter(event => event.userId === userId)
    .sort((a, b) => {
      // First sort by day
      if (a.day !== b.day) {
        return a.day - b.day;
      }
      
      // Then by start time if available
      if (a.startTime && b.startTime) {
        return a.startTime.localeCompare(b.startTime);
      }
      
      return 0;
    });
};

const getCalendarEvent = async (id) => {
  return calendarEvents.get(id) || null;
};

const createCalendarEvent = async (eventData) => {
  const id = generateCalendarEventId();
  const event = {
    _id: id,
    ...eventData,
    createdAt: new Date()
  };
  
  calendarEvents.set(id, event);
  console.log(`[InMemoryStorage] Created calendar event: ${id}`);
  return event;
};

const updateCalendarEvent = async (id, eventData) => {
  const event = calendarEvents.get(id);
  
  if (!event) {
    return null;
  }
  
  const updatedEvent = {
    ...event,
    ...eventData,
    _id: id, // Ensure ID doesn't change
    updatedAt: new Date()
  };
  
  calendarEvents.set(id, updatedEvent);
  console.log(`[InMemoryStorage] Updated calendar event: ${id}`);
  return updatedEvent;
};

const deleteCalendarEvent = async (id) => {
  if (!calendarEvents.has(id)) {
    return false;
  }
  
  const deleted = calendarEvents.get(id);
  calendarEvents.delete(id);
  console.log(`[InMemoryStorage] Deleted calendar event: ${id}`);
  return deleted;
};

module.exports = {
  // Activity functions
  getActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
  completeActivity,
  
  // User functions
  getUserProfile,
  getUserByEmail,
  createUser,
  verifyPassword,
  updateUserProfile,
  updateUserPassword,
  
  // Countdown event functions
  getCountdownEvents,
  getCountdownEventById,
  createCountdownEvent,
  updateCountdownEvent,
  deleteCountdownEvent,
  completeRecurringEvent,
  
  // Calendar event functions
  getCalendarEvents,
  getCalendarEvent,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  
  // Helper function exposed for other modules
  calculateNextOccurrence
};