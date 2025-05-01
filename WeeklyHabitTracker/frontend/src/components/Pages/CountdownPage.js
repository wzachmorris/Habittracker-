import React, { useState, useEffect } from 'react';
import PageWrapper from '../PageWrapper';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { 
  fetchCountdownEvents, 
  createCountdownEvent, 
  updateCountdownEvent, 
  deleteCountdownEvent, 
  completeRecurringEvent
} from '../../services/countdownEvents';
import { fetchCalendarEvents, deleteCalendarEvent } from '../../services/api';

// Added color options for customization
const colorOptions = [
  { name: 'Blue', value: 'blue', bgClass: 'bg-primary bg-opacity-10', progressClass: 'bg-primary' },
  { name: 'Green', value: 'green', bgClass: 'bg-success bg-opacity-10', progressClass: 'bg-success' },
  { name: 'Yellow', value: 'yellow', bgClass: 'bg-warning bg-opacity-10', progressClass: 'bg-warning' },
  { name: 'Red', value: 'red', bgClass: 'bg-danger bg-opacity-10', progressClass: 'bg-danger' },
  { name: 'Purple', value: 'purple', bgClass: 'bg-purple bg-opacity-10', progressClass: 'bg-purple' },
  { name: 'Teal', value: 'teal', bgClass: 'bg-info bg-opacity-10', progressClass: 'bg-info' },
];

// Custom CSS for additional colors
const customColors = `
  .bg-purple {
    background-color: #6f42c1 !important;
  }
  .bg-purple.bg-opacity-10 {
    background-color: rgba(111, 66, 193, 0.1) !important;
  }
  .form-toggle-btn {
    padding: 0.75rem 1.5rem;
    border-radius: 0.375rem;
    font-weight: 500;
    transition: all 0.2s;
  }
  .form-toggle-btn.active {
    background-color: #0d6efd;
    color: white;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }
  .form-toggle-btn:not(.active) {
    background-color: #f8f9fa;
    color: #6c757d;
  }
  .form-toggle-btn:not(.active):hover {
    background-color: #e9ecef;
  }
  .time-group-header {
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #dee2e6;
    font-weight: 600;
  }
  .recurring-badge {
    margin-left: 0.5rem;
    font-size: 0.75rem;
    padding: 0.2rem 0.5rem;
    border-radius: 0.25rem;
  }
`;

function CountdownPage() {
  const { t } = useTranslation();
  
  // Get userId from auth context or localStorage
  const { user } = useAuth();
  const userId = user?.userId || localStorage.getItem('userId');
  
  // State for countdown events
  const [events, setEvents] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for form selection (one-time vs recurring)
  const [activeForm, setActiveForm] = useState('one-time');
  
  // State for one-time event form
  const [otEventName, setOtEventName] = useState('');
  const [otEventDate, setOtEventDate] = useState('');
  const [otEventDescription, setOtEventDescription] = useState('');
  const [otEventColor, setOtEventColor] = useState('blue');
  // New state for duration options
  const [otEventHasDuration, setOtEventHasDuration] = useState(false);
  const [otEventEndDate, setOtEventEndDate] = useState('');
  const [otEventIsAllDay, setOtEventIsAllDay] = useState(false);
  
  // One-time event time components
  const [otEventHour, setOtEventHour] = useState('8');
  const [otEventMinute, setOtEventMinute] = useState('00');
  const [otEventAmPm, setOtEventAmPm] = useState('AM');
  const [otEventEndHour, setOtEventEndHour] = useState('9');
  const [otEventEndMinute, setOtEventEndMinute] = useState('00');
  const [otEventEndAmPm, setOtEventEndAmPm] = useState('AM');
  
  // State for recurring event form
  const [rEventName, setREventName] = useState('');
  const [rEventTime, setREventTime] = useState('');
  const [rEventDescription, setREventDescription] = useState('');
  const [rEventColor, setREventColor] = useState('blue');
  const [recurrenceType, setRecurrenceType] = useState('daily');
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState([1, 2, 3, 4, 5]);  // Default to weekdays
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [monthOfYear, setMonthOfYear] = useState(0); // January
  // New state for recurring event duration
  const [rEventHasDuration, setREventHasDuration] = useState(false);
  const [rEventDuration, setREventDuration] = useState(60); // Default 60 minutes
  const [rEventIsAllDay, setREventIsAllDay] = useState(false);
  
  // New state for time components (instead of a single time string)
  const [rEventHour, setREventHour] = useState('8'); // Default to 8
  const [rEventMinute, setREventMinute] = useState('00'); // Default to 00
  const [rEventAmPm, setREventAmPm] = useState('AM'); // Default to AM
  
  // State for notes editing
  const [editingNotes, setEditingNotes] = useState(null); // ID of event being edited
  const [noteContent, setNoteContent] = useState('');
  
  // Current date/time helper
  const getTodayDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    // Round minutes to nearest 5
    const roundedMinutes = Math.round(minutes / 5) * 5;
    const formattedMinutes = String(roundedMinutes === 60 ? 0 : roundedMinutes).padStart(2, '0');
    const formattedHours = String(roundedMinutes === 60 ? (parseInt(hours) + 1) : hours).padStart(2, '0');
    
    return `${year}-${month}-${day}T${formattedHours}:${formattedMinutes}`;
  };
  
  // Function to set default end time (1 hour after start)
  const setDefaultEndTime = (startDateTime) => {
    const startDate = new Date(startDateTime);
    const endDate = new Date(startDate.getTime());
    endDate.setHours(endDate.getHours() + 1);
    
    // Format as YYYY-MM-DDTHH:MM
    const year = endDate.getFullYear();
    const month = String(endDate.getMonth() + 1).padStart(2, '0');
    const day = String(endDate.getDate()).padStart(2, '0');
    const hours = String(endDate.getHours()).padStart(2, '0');
    const minutes = String(endDate.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  
  // Initialize time components for all events
  const initializeTimeComponents = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const roundedMinutes = Math.round(minutes / 5) * 5;
    const formattedMinutes = String(roundedMinutes === 60 ? 0 : roundedMinutes).padStart(2, '0');
    
    // Convert to 12-hour format
    const amPm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    
    // Set recurring event time components
    setREventHour(String(hours));
    setREventMinute(formattedMinutes);
    setREventAmPm(amPm);
    
    // Set one-time event time components
    setOtEventHour(String(hours));
    setOtEventMinute(formattedMinutes);
    setOtEventAmPm(amPm);
    
    // Set end time to 1 hour later
    let endHours = hours + 1;
    if (endHours > 12) {
      endHours = endHours - 12;
      setOtEventEndAmPm(amPm === 'AM' ? 'PM' : 'AM');
    } else {
      setOtEventEndAmPm(amPm);
    }
    setOtEventEndHour(String(endHours));
    setOtEventEndMinute(formattedMinutes);
  };
  
  // Function to get time string from components
  const getTimeFromComponents = (hour, minute, amPm) => {
    // Convert hour from 12-hour format to 24-hour format
    let h = parseInt(hour, 10);
    if (amPm === 'PM' && h < 12) h += 12;
    if (amPm === 'AM' && h === 12) h = 0;
    
    return `${h.toString().padStart(2, '0')}:${minute}`;
  };
  
  // Function to get time string from recurring event components
  const getCurrentTimeFromComponents = () => {
    return getTimeFromComponents(rEventHour, rEventMinute, rEventAmPm);
  };
  
  // Function to get time string from one-time event components
  const getOtEventTimeFromComponents = () => {
    return getTimeFromComponents(otEventHour, otEventMinute, otEventAmPm);
  };
  
  // Function to get time string from one-time event end components
  const getOtEventEndTimeFromComponents = () => {
    return getTimeFromComponents(otEventEndHour, otEventEndMinute, otEventEndAmPm);
  };
  
  // Function to determine event period based on time
  const determinePeriod = (eventDate) => {
    const date = new Date(eventDate);
    const hour = date.getHours();
    
    if (hour < 12) {
      return 'morning';
    } else if (hour < 17) { // 5 PM
      return 'afternoon';
    } else {
      return 'evening';
    }
  };
  
  // Set default date/time when component loads
  useEffect(() => {
    const defaultStart = getTodayDateTime();
    setOtEventDate(defaultStart);
    setOtEventEndDate(setDefaultEndTime(defaultStart));
    
    // Initialize recurring event time components
    initializeTimeComponents();
    
    // Set day of month to current day
    const now = new Date();
    setDayOfMonth(now.getDate());
    setMonthOfYear(now.getMonth());
  }, []);
  
  // Keep the time string updated when components change
  useEffect(() => {
    setREventTime(getCurrentTimeFromComponents());
  }, [rEventHour, rEventMinute, rEventAmPm]);
  
  // Update otEventDate when time components change
  useEffect(() => {
    // Only update if we have a date component already
    if (otEventDate) {
      const dateComponent = otEventDate.split('T')[0];
      const timeComponent = getOtEventTimeFromComponents();
      setOtEventDate(`${dateComponent}T${timeComponent}`);
    }
  }, [otEventHour, otEventMinute, otEventAmPm]);
  
  // Update otEventEndDate when end time components change
  useEffect(() => {
    // Only update if we have a date component already
    if (otEventEndDate) {
      const dateComponent = otEventEndDate.split('T')[0];
      const timeComponent = getOtEventEndTimeFromComponents();
      setOtEventEndDate(`${dateComponent}T${timeComponent}`);
    }
  }, [otEventEndHour, otEventEndMinute, otEventEndAmPm]);
  
  // Handle one-time event date change (date only)
  const handleOtEventDateChange = (e) => {
    const newDate = e.target.value;
    const timeComponent = getOtEventTimeFromComponents();
    const newStartDateTime = `${newDate}T${timeComponent}`;
    setOtEventDate(newStartDateTime);
    
    // Only update end date if it's before the new start date
    if (new Date(otEventEndDate) < new Date(newStartDateTime)) {
      const newEndDate = newDate;
      const endTimeComponent = getOtEventEndTimeFromComponents();
      setOtEventEndDate(`${newEndDate}T${endTimeComponent}`);
    }
  };
  
  // State to track if we're in edit mode
  const [editMode, setEditMode] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);

  // Load events from the API
  useEffect(() => {
    if (!userId) {
      console.warn('CountdownPage: No userId available for loading countdown events');
      setLoading(false);
      return;
    }
    
    async function loadEvents() {
      setLoading(true);
      try {
        console.log('Loading countdown events from API for user:', userId);
        
        // Load countdown events only (removed calendar events since the endpoint doesn't exist)
        const fetchedEvents = await fetchCountdownEvents(userId);
        
        // Initialize calendar events as empty array since endpoint doesn't exist
        setCalendarEvents([]);
        
        if (fetchedEvents && fetchedEvents.length > 0) {
          console.log(`Loaded ${fetchedEvents.length} countdown events`);
          setEvents(fetchedEvents);
          
          // Check if we were redirected here to edit a specific event
          const editEventId = localStorage.getItem('editCountdownEventId');
          if (editEventId) {
            console.log('Found event to edit:', editEventId);
            // Find the event in our loaded events
            const eventToEdit = fetchedEvents.find(event => event._id === editEventId);
            if (eventToEdit) {
              // Switch to the appropriate form based on event type
              setActiveForm(eventToEdit.isRecurring ? 'recurring' : 'one-time');
              setEditMode(true);
              setEditingEventId(editEventId);
              
              // Populate form fields based on event type
              if (eventToEdit.isRecurring) {
                populateRecurringEventForm(eventToEdit);
              } else {
                populateOneTimeEventForm(eventToEdit);
              }
            }
            // Clear the localStorage item so it doesn't trigger again on refresh
            localStorage.removeItem('editCountdownEventId');
          }
        } else {
          console.log('No countdown events found, setting defaults');
          createDefaultEvents();
        }
      } catch (error) {
        console.error('Error loading countdown events:', error);
        createDefaultEvents();
      } finally {
        setLoading(false);
      }
    }
    
    async function createDefaultEvents() {
      // Sample data if no events exist
      const defaultEvents = [
        {
          name: 'Summer Vacation',
          date: new Date(2025, 5, 15, 17, 0, 0).toISOString(), // June 15, 2025, 5:00 PM
          description: 'Annual family trip to Hawaii',
          userId,
          color: 'blue',
          isRecurring: false,
          hasDuration: true,
          endDate: new Date(2025, 5, 22, 10, 0, 0).toISOString(), // June 22, 2025, 10:00 AM
          isAllDay: false
        },
        {
          name: 'Marathon',
          date: new Date(2025, 4, 4, 7, 0, 0).toISOString(), // May 4, 2025, 7:00 AM
          description: 'City Marathon - 26.2 miles',
          userId,
          color: 'green',
          isRecurring: false,
          hasDuration: true,
          endDate: new Date(2025, 4, 4, 12, 0, 0).toISOString(), // May 4, 2025, 12:00 PM
          isAllDay: false
        },
        {
          name: 'Consider Supporting the Creator',
          date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
          description: 'If you\'re still enjoying the app after 60 days, consider buying the creator a coffee!',
          notes: 'This app will always remain free to use, but your support helps with continued development and new features. If this app has been valuable to you, please consider a small contribution: https://buy.stripe.com/8wM9CR1KNgGGfhS6oy',
          userId,
          color: 'purple',
          isRecurring: false,
          hasDuration: false,
          isAllDay: false
        },
        // Added default recurring events
        {
          name: 'Weekly Team Meeting',
          date: getNextOccurrence(new Date(), 1, 9, 30), // Next Monday at 9:30 AM
          description: 'Status updates and sprint planning',
          userId,
          color: 'yellow',
          isRecurring: true,
          recurrenceType: 'weekly',
          recurrenceInterval: 1,
          daysOfWeek: [1], // Monday
          recurrenceEndDate: null,
          hasDuration: true,
          endDate: null, // Will be calculated in getNextOccurrence with duration
          isAllDay: false
        },
        {
          name: 'Daily Meditation',
          date: getNextOccurrence(new Date(), null, 6, 0), // Tomorrow at 6:00 AM
          description: '15-minute morning meditation practice',
          userId,
          color: 'teal',
          isRecurring: true,
          recurrenceType: 'daily',
          recurrenceInterval: 1,
          recurrenceEndDate: null,
          hasDuration: true,
          endDate: null, // Will be calculated based on duration
          isAllDay: false
        }
      ];
      
      try {
        console.log('Creating default countdown events');
        const createdEvents = await Promise.all(
          defaultEvents.map(event => createCountdownEvent(event))
        );
        setEvents(createdEvents);
      } catch (error) {
        console.error('Error creating default events:', error);
        // If API fails, just set the events in state
        setEvents(defaultEvents.map((event, index) => ({
          ...event,
          _id: `default_${index}`,
          _offline: true
        })));
      }
    }
    
    loadEvents();
  }, [userId]);
  
  // Helper function to get next occurrence of a recurring event
  function getNextOccurrence(baseDate, dayOfWeek = null, hours = 0, minutes = 0, durationMinutes = 0) {
    const now = new Date();
    let nextDate = new Date(baseDate);
    
    // Set the time
    nextDate.setHours(hours);
    nextDate.setMinutes(minutes);
    nextDate.setSeconds(0);
    nextDate.setMilliseconds(0);
    
    // If a specific day of week is requested (for weekly events)
    if (dayOfWeek !== null) {
      // Get current day of week (0-6, where 0 is Sunday)
      const currentDayOfWeek = nextDate.getDay();
      
      // Calculate days to add to get to the target day of week
      let daysToAdd = dayOfWeek - currentDayOfWeek;
      if (daysToAdd <= 0) {
        daysToAdd += 7; // Move to next week if today or already passed this week
      }
      
      nextDate.setDate(nextDate.getDate() + daysToAdd);
    } else {
      // For daily events, if the time has already passed today, move to tomorrow
      if (nextDate.getTime() <= now.getTime()) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
    }
    
    // Return start time
    const startISOString = nextDate.toISOString();
    
    // If duration is specified, calculate end time
    if (durationMinutes > 0) {
      const endDate = new Date(nextDate.getTime() + durationMinutes * 60000);
      return {
        startDate: startISOString,
        endDate: endDate.toISOString()
      };
    }
    
    return startISOString;
  }

  // Calculate event date for recurring events
  function calculateRecurringEventDate() {
    const today = new Date();
    let eventDate;
    
    // Parse the time from the components
    // This now uses the computed time string from components
    const [hoursStr, minutesStr] = rEventTime.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    
    switch (recurrenceType) {
      case 'daily': {
        // Start with today
        eventDate = new Date(today);
        eventDate.setHours(hours, minutes, 0, 0);
        
        // If time already passed today, move to tomorrow
        if (eventDate < today) {
          eventDate.setDate(eventDate.getDate() + 1);
        }
        
        // Apply day selection if any
        if (selectedDaysOfWeek.length > 0) {
          // Find the next day that matches one of the selected days
          let found = false;
          let daysChecked = 0;
          
          while (!found && daysChecked < 7) {
            if (selectedDaysOfWeek.includes(eventDate.getDay())) {
              found = true;
            } else {
              eventDate.setDate(eventDate.getDate() + 1);
              daysChecked++;
            }
          }
        }
        break;
      }
      
      case 'weekly': {
        // Find the next occurrence of the selected day(s)
        if (selectedDaysOfWeek.length === 0) {
          // If no days selected, default to today
          eventDate = new Date(today);
          eventDate.setHours(hours, minutes, 0, 0);
        } else {
          // Find the next occurrence of any selected day
          const todayDay = today.getDay();
          
          // Sort days to find the next upcoming one
          const sortedDays = [...selectedDaysOfWeek].sort((a, b) => {
            const dayA = (a - todayDay + 7) % 7;
            const dayB = (b - todayDay + 7) % 7;
            return dayA - dayB;
          });
          
          // Use the first upcoming day
          const nextDay = sortedDays[0];
          const daysToAdd = (nextDay - todayDay + 7) % 7;
          
          // Set the date and time
          eventDate = new Date(today);
          eventDate.setDate(eventDate.getDate() + (daysToAdd === 0 ? 7 : daysToAdd));
          eventDate.setHours(hours, minutes, 0, 0);
        }
        break;
      }
      case 'monthly': {
        // For monthly events, use the selected day of month
        eventDate = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
        eventDate.setHours(hours, minutes, 0, 0);
        
        // If this date has already passed this month, move to next month
        if (eventDate < today) {
          eventDate.setMonth(eventDate.getMonth() + 1);
        }
        break;
      }

      case 'yearly': {
        // For yearly events, use the selected month and day
        eventDate = new Date(today.getFullYear(), monthOfYear, dayOfMonth);
        eventDate.setHours(hours, minutes, 0, 0);
        
        // If this date has already passed this year, move to next year
        if (eventDate < today) {
          eventDate.setFullYear(eventDate.getFullYear() + 1);
        }
        break;
      }
      
      default:
        // Unknown type, use current date and time
        eventDate = new Date();
        eventDate.setHours(hours, minutes, 0, 0);
    }
    
    return eventDate.toISOString();
  }
  
  // Function to calculate time remaining
  const getTimeRemaining = (targetDate) => {
    const now = new Date();
    const target = new Date(targetDate);
    const difference = target.getTime() - now.getTime();
    
    // Return 0 if the date is in the past
    if (difference <= 0) {
      return {
        total: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isPast: true
      };
    }
    
    // Calculate time units
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    
    return {
      total: difference,
      days,
      hours,
      minutes,
      seconds,
      isPast: false
    };
  };
  
  // Format countdown for display
  const formatCountdown = (timeRemaining) => {
    if (timeRemaining.isPast) {
      return "Event has passed";
    }
    
    const parts = [];
    
    if (timeRemaining.days > 0) {
      parts.push(`${timeRemaining.days} ${timeRemaining.days === 1 ? 'day' : 'days'}`);
    }
    
    if (timeRemaining.hours > 0) {
      parts.push(`${timeRemaining.hours} ${timeRemaining.hours === 1 ? 'hour' : 'hours'}`);
    }
    
    if (timeRemaining.days === 0 && timeRemaining.minutes > 0) {
      parts.push(`${timeRemaining.minutes} ${timeRemaining.minutes === 1 ? 'minute' : 'minutes'}`);
    }
    
    if (timeRemaining.days === 0 && timeRemaining.hours === 0 && timeRemaining.seconds > 0) {
      parts.push(`${timeRemaining.seconds} ${timeRemaining.seconds === 1 ? 'second' : 'seconds'}`);
    }
    
    return parts.join(', ');
  };
  
  // Format event time display including duration if available
  const formatEventTimeDisplay = (event) => {
    const startDate = new Date(event.date);
    let timeDisplay = formatDate(startDate);
    
    if (event.isAllDay) {
      return `${timeDisplay.split(',')[0]} (All day)`;
    }
    
    if (event.hasDuration && event.endDate) {
      const endDate = new Date(event.endDate);
      
      // If same day, just show end time
      if (endDate.toDateString() === startDate.toDateString()) {
        const endTimeStr = endDate.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit'
        });
        timeDisplay += ` - ${endTimeStr}`;
      } else {
        // Different days, show full end date
        const endDateStr = endDate.toLocaleDateString(undefined, {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
        const endTimeStr = endDate.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit'
        });
        timeDisplay += ` - ${endDateStr}, ${endTimeStr}`;
      }
    }
    
    return timeDisplay;
  };
  
  // Get background color based on time remaining or custom color
  const getBgColor = (timeRemaining, color) => {
    if (timeRemaining.isPast) {
      return 'bg-secondary';
    }
    
    // If a custom color is provided, use it
    if (color) {
      const colorOption = colorOptions.find(option => option.value === color);
      if (colorOption) {
        return colorOption.bgClass;
      }
    }
    
    // Default color logic based on time remaining
    if (timeRemaining.days <= 7) {
      return 'bg-danger bg-opacity-10';
    }
    
    if (timeRemaining.days <= 30) {
      return 'bg-warning bg-opacity-10';
    }
    
    if (timeRemaining.days <= 90) {
      return 'bg-info bg-opacity-10';
    }
    
    return 'bg-success bg-opacity-10';
  };
  
  // Get progress bar color based on time remaining or custom color
  const getProgressColor = (timeRemaining, color) => {
    if (timeRemaining.isPast) {
      return 'bg-secondary';
    }
    
    // If a custom color is provided, use it
    if (color) {
      const colorOption = colorOptions.find(option => option.value === color);
      if (colorOption) {
        return colorOption.progressClass;
      }
    }
    
    // Default color logic based on time remaining
    if (timeRemaining.days <= 7) {
      return 'bg-danger';
    }
    
    if (timeRemaining.days <= 30) {
      return 'bg-warning';
    }
    
    if (timeRemaining.days <= 90) {
      return 'bg-info';
    }
    
    return 'bg-success';
  };
  
  // Add or update a one-time countdown event
  const addOneTimeEvent = async (e) => {
    e.preventDefault();
    
    console.log('==== Start of addOneTimeEvent function ====');
    console.log('otEventName:', otEventName);
    console.log('otEventDate:', otEventDate);
    console.log('otEventDescription:', otEventDescription);
    console.log('userId:', userId);
    console.log('otEventColor:', otEventColor);
    console.log('otEventHasDuration:', otEventHasDuration);
    console.log('otEventEndDate:', otEventEndDate);
    console.log('otEventIsAllDay:', otEventIsAllDay);
    console.log('==== Event Time Components ====');
    console.log('otEventHour:', otEventHour);
    console.log('otEventMinute:', otEventMinute);
    console.log('otEventAmPm:', otEventAmPm);
    console.log('Period:', otEventIsAllDay ? 'All Day' : determinePeriod(otEventDate));
    
    if (!otEventName || !otEventDate || !userId) return;
    
    try {
      // Build the event object
      const eventData = {
        name: otEventName,
        date: otEventDate,
        description: otEventDescription || '',
        notes: '',
        userId,
        color: otEventColor,
        isRecurring: false,
        hasDuration: otEventHasDuration,
        endDate: otEventHasDuration ? otEventEndDate : null,
        isAllDay: otEventIsAllDay,
        period: otEventIsAllDay ? null : determinePeriod(otEventDate)
      };
      
      console.log('==== Event Data Object ====');
      console.log('Constructed eventData:', JSON.stringify(eventData, null, 2));
      
      let resultEvent;
      
      // Check if we're in edit mode
      if (editMode && editingEventId) {
        console.log('Updating existing one-time event:', editingEventId);
        
        // Preserve existing notes if available
        const existingEvent = events.find(event => event._id === editingEventId);
        if (existingEvent && existingEvent.notes) {
          eventData.notes = existingEvent.notes;
        }
        
        console.log('SENDING UPDATED ONE-TIME EVENT DATA TO API:', JSON.stringify(eventData, null, 2));
        
        // Update the event
        await updateEvent(editingEventId, eventData);
        
        // Reset edit mode
        setEditMode(false);
        setEditingEventId(null);
      } else {
        console.log('Creating new one-time event');
        console.log('SENDING ONE-TIME EVENT DATA TO API:', JSON.stringify(eventData, null, 2));
        
        // Create event in the database
        const createdEvent = await createCountdownEvent(eventData);
        
        console.log('RECEIVED EVENT FROM API:', JSON.stringify(createdEvent, null, 2));
        console.log('Event date from API response:', createdEvent.date);
        console.log('Event endDate from API response:', createdEvent.endDate);
        
        // Update the local state
        setEvents([...events, createdEvent]);
        
        console.log('New one-time countdown event created:', createdEvent);
      }
      
      console.log('==== Form Reset ====');
      // Reset form
      setOtEventName('');
      setOtEventDate(getTodayDateTime());
      setOtEventDescription('');
      setOtEventColor('blue');
      setOtEventHasDuration(false);
      setOtEventEndDate(setDefaultEndTime(getTodayDateTime()));
      setOtEventIsAllDay(false);
      console.log('==== End of addOneTimeEvent function ====');
    } catch (error) {
      console.error('Error with one-time countdown event:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert('Failed to save countdown event. Please try again.');
    }
  };
  
  // Add or update a recurring countdown event
  const addRecurringEvent = async (e) => {
    e.preventDefault();
    
    if (!rEventName || !rEventTime || !userId) return;
    
    try {
      // Calculate the event date based on recurrence settings
      let eventDate;
      if (editMode && editingEventId) {
        // For editing, preserve the original date to avoid shifting the schedule
        const existingEvent = events.find(event => event._id === editingEventId);
        if (existingEvent) {
          // Use existing date but update the time
          const existingDate = new Date(existingEvent.date);
          const [hours, minutes] = rEventTime.split(':').map(Number);
          
          existingDate.setHours(hours, minutes, 0, 0);
          eventDate = existingDate.toISOString();
        } else {
          // Fall back to calculating a new date
          eventDate = calculateRecurringEventDate();
        }
      } else {
        // For new events, calculate the date normally
        eventDate = calculateRecurringEventDate();
      }
      
      console.log('Event date:', new Date(eventDate).toLocaleString());
      
      // Calculate end date if the event has duration
      let endDate = null;
      if (rEventHasDuration) {
        const startDate = new Date(eventDate);
        endDate = new Date(startDate.getTime() + rEventDuration * 60000); // Convert minutes to milliseconds
        endDate = endDate.toISOString();
      }
      
      const eventData = {
        name: rEventName,
        date: eventDate,
        description: rEventDescription || '',
        notes: '',
        userId,
        color: rEventColor,
        isRecurring: true,
        recurrenceType,
        recurrenceInterval,
        daysOfWeek: (recurrenceType === 'weekly' || recurrenceType === 'daily') ? 
                    selectedDaysOfWeek : 
                    null,
        dayOfMonth: (recurrenceType === 'monthly' || recurrenceType === 'yearly') ? 
                   dayOfMonth : 
                   null,
        monthOfYear: recurrenceType === 'yearly' ? 
                    monthOfYear : 
                    null,
        recurrenceEndDate: null,
        hasDuration: rEventHasDuration,
        endDate: endDate,
        isAllDay: rEventIsAllDay,
        period: rEventIsAllDay ? null : determinePeriod(eventDate)
      };
      
      // Check if we're in edit mode
      if (editMode && editingEventId) {
        console.log('Updating existing recurring event:', editingEventId);
        
        // Preserve existing notes if available
        const existingEvent = events.find(event => event._id === editingEventId);
        if (existingEvent && existingEvent.notes) {
          eventData.notes = existingEvent.notes;
        }
        
        console.log('SENDING UPDATED RECURRING EVENT DATA TO API:', JSON.stringify(eventData, null, 2));
        
        // Update the event
        await updateEvent(editingEventId, eventData);
        
        // Reset edit mode
        setEditMode(false);
        setEditingEventId(null);
      } else {
        console.log('Creating new recurring event with type:', recurrenceType);
        console.log('SENDING RECURRING EVENT DATA TO API:', JSON.stringify(eventData, null, 2));
        
        // Create event in the database
        const createdEvent = await createCountdownEvent(eventData);
        
        console.log('RECEIVED EVENT FROM API:', JSON.stringify(createdEvent, null, 2));
        
        // Check for missing recurrence data
        if (!createdEvent.isRecurring || !createdEvent.recurrenceType) {
          console.warn('RECURRENCE DATA MISSING IN RESPONSE - Adding locally');
          // Add recurrence data back to the created event for UI purposes
          createdEvent.isRecurring = true;
          createdEvent.recurrenceType = recurrenceType;
          createdEvent.recurrenceInterval = recurrenceInterval;
          createdEvent.daysOfWeek = selectedDaysOfWeek;
          createdEvent.dayOfMonth = dayOfMonth;
          createdEvent.monthOfYear = monthOfYear;
          createdEvent.hasDuration = rEventHasDuration;
          createdEvent.endDate = endDate;
          createdEvent.isAllDay = rEventIsAllDay;
          createdEvent.period = rEventIsAllDay ? null : determinePeriod(eventDate);
        }
        
        // Update the local state
        setEvents([...events, createdEvent]);
        
        console.log('New recurring countdown event created:', createdEvent);
      }
      
      // Reset form
      setREventName('');
      initializeTimeComponents(); // Reset time components
      setREventDescription('');
      setREventColor('blue');
      setREventHasDuration(false);
      setREventDuration(60);
      setREventIsAllDay(false);
    } catch (error) {
      console.error('Error with recurring countdown event:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert('Failed to save countdown event. Please try again.');
    }
  };
  
  // Handle recurrence type change
  const handleRecurrenceTypeChange = (e) => {
    const type = e.target.value;
    setRecurrenceType(type);
    
    // Reset related fields
    if (type === 'daily') {
      // Default to all weekdays (M-F) for daily recurrence
      setSelectedDaysOfWeek([1, 2, 3, 4, 5]);
    } else if (type === 'weekly') {
      // Default to Monday for weekly
      setSelectedDaysOfWeek([1]);
    } else if (type === 'monthly') {
      // Default to current day of month
      const today = new Date();
      setDayOfMonth(today.getDate());
    } else if (type === 'yearly') {
      // Default to current month and day
      const today = new Date();
      setMonthOfYear(today.getMonth());
      setDayOfMonth(today.getDate());
    }
  };
  
  // Handle day of week selection
  const handleDayOfWeekChange = (day) => {
    if (selectedDaysOfWeek.includes(day)) {
      // Don't remove if it's the last selected day
      if (selectedDaysOfWeek.length > 1) {
        setSelectedDaysOfWeek(selectedDaysOfWeek.filter(d => d !== day));
      }
    } else {
      setSelectedDaysOfWeek([...selectedDaysOfWeek, day]);
    }
  };
  
  // Delete a countdown event with confirmation
  const deleteEvent = async (id) => {
    // Find the event to display its name in the confirmation dialog
    const eventToDelete = events.find(event => event._id === id);
    
    if (!eventToDelete) {
      console.error('Event not found for deletion:', id);
      return;
    }
    
    // Show confirmation dialog
    if (window.confirm(`Are you sure you want to delete "${eventToDelete.name}"?`)) {
      try {
        // Delete the countdown event from the database
        await deleteCountdownEvent(id, userId);
        
        // Find any corresponding calendar events and delete them too
        // We need to find calendar events with source='countdown' and matching countdown event ID
        const matchingCalendarEvents = calendarEvents.filter(
          calEvent => calEvent.source === 'countdown' && 
                     calEvent.originalEvent && 
                     calEvent.originalEvent._id === id
        );
        
        // Delete any matching calendar events
        for (const calEvent of matchingCalendarEvents) {
          console.log(`Deleting corresponding calendar event: ${calEvent._id}`);
          try {
            await deleteCalendarEvent(calEvent._id);
          } catch (err) {
            console.error(`Error deleting calendar event ${calEvent._id}:`, err);
          }
        }
        
        // Update the local state
        setEvents(events.filter(event => event._id !== id));
        setCalendarEvents(calendarEvents.filter(event => 
          !(event.source === 'countdown' && event.originalEvent && event.originalEvent._id === id)
        ));
        
        // Notify user of success
        console.log(`Countdown event deleted: ${id} along with ${matchingCalendarEvents.length} calendar event(s)`);
      } catch (error) {
        console.error('Error deleting countdown event:', error);
        alert('Failed to delete countdown event. Please try again.');
      }
    }
  };

  // Function to handle completing a recurring event
  const handleCompleteRecurringEvent = async (event) => {
    try {
      console.log('Completing recurring event:', event._id);
      
      // Call the API to complete and update the event
      const updatedEvent = await completeRecurringEvent(event._id, { userId });
      
      if (updatedEvent) {
        // Update the local state
        setEvents(events.map(e => e._id === event._id ? updatedEvent : e));
        console.log('Event updated with next occurrence:', updatedEvent);
      } else {
        console.error('Failed to complete recurring event - no data returned');
      }
    } catch (error) {
      console.error('Error completing recurring event:', error);
      alert('Failed to update recurring event. Please try again.');
    }
  };
  
  // Start editing notes for an event
  const startEditingNotes = (event) => {
    setEditingNotes(event._id);
    setNoteContent(event.notes || "");
  };
  
  // Save notes for an event
  const saveNotes = async (id) => {
    const event = events.find(e => e._id === id);
    
    if (!event) {
      console.error('Event not found for updating notes:', id);
      return;
    }
    
    try {
      // Update in the database
      const updatedEvent = await updateCountdownEvent(id, {
        ...event,
        notes: noteContent
      });
      
      // Update the local state
      setEvents(events.map(e => e._id === id ? updatedEvent : e));
      
      console.log('Countdown event notes updated:', id);
    } catch (error) {
      console.error('Error updating countdown event notes:', error);
      alert('Failed to save notes. Please try again.');
    }
    
    setEditingNotes(null);
  };
  
  // Cancel editing notes
  const cancelEditingNotes = () => {
    setEditingNotes(null);
    setNoteContent("");
  };
  
  // Format date in a user-friendly way
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get the recurrence description
  const getRecurrenceDescription = (event) => {
    if (!event.isRecurring) return '';
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    switch (event.recurrenceType) {
      case 'daily':
        if (!event.daysOfWeek || event.daysOfWeek.length === 0 || event.daysOfWeek.length === 7) {
          return event.recurrenceInterval === 1 
            ? 'Repeats daily' 
            : `Repeats every ${event.recurrenceInterval} days`;
        } else {
          const selectedDays = event.daysOfWeek.map(day => dayNames[day]).join(', ');
          return `Repeats daily on ${selectedDays}`;
        }
        
      case 'weekly':
        if (!event.daysOfWeek || event.daysOfWeek.length === 0) {
          return event.recurrenceInterval === 1 
            ? 'Repeats weekly' 
            : `Repeats every ${event.recurrenceInterval} weeks`;
        }
        
        const selectedDays = event.daysOfWeek.map(day => dayNames[day]).join(', ');
        return event.recurrenceInterval === 1 
          ? `Repeats weekly on ${selectedDays}` 
          : `Repeats every ${event.recurrenceInterval} weeks on ${selectedDays}`;
        
      case 'monthly':
        return event.recurrenceInterval === 1 
          ? `Repeats monthly on day ${event.dayOfMonth}` 
          : `Repeats every ${event.recurrenceInterval} months on day ${event.dayOfMonth}`;
        
      case 'yearly':
        const month = monthNames[event.monthOfYear];
        
        return event.recurrenceInterval === 1 
          ? `Repeats yearly on ${month} ${event.dayOfMonth}` 
          : `Repeats every ${event.recurrenceInterval} years on ${month} ${event.dayOfMonth}`;
        
      default:
        return 'Repeats';
    }
  };

  // Helper to get recurrence description color
  const getRecurrenceDescriptionStyle = () => {
    return 'text-info';
  };
  
  // Function to check if an event spans multiple periods
  const spansMultiplePeriods = (event) => {
    if (!event.hasDuration || !event.endDate || event.isAllDay) {
      return false;
    }
    
    const startDate = new Date(event.date);
    const endDate = new Date(event.endDate);
    
    // Get periods for start and end
    const startPeriod = determinePeriod(startDate);
    const endPeriod = determinePeriod(endDate);
    
    // Check if they're different
    return startPeriod !== endPeriod;
  };
  
  // Function to get all applicable periods for an event
  const getEventPeriods = (event) => {
    if (event.isAllDay) {
      // All-day events appear in all periods
      return ['morning', 'afternoon', 'evening'];
    }
    
    if (!event.hasDuration || !event.endDate) {
      // Single-point events only appear in their respective period
      return [determinePeriod(event.date)];
    }
    
    // For events with duration, check if they span multiple periods
    const startDate = new Date(event.date);
    const endDate = new Date(event.endDate);
    const startPeriod = determinePeriod(startDate);
    const endPeriod = determinePeriod(endDate);
    
    // If start and end are in the same period, just return that period
    if (startPeriod === endPeriod) {
      return [startPeriod];
    }
    
    // Otherwise, include all periods between start and end
    const periods = ['morning', 'afternoon', 'evening'];
    const startIndex = periods.indexOf(startPeriod);
    const endIndex = periods.indexOf(endPeriod);
    
    return periods.slice(startIndex, endIndex + 1);
  };
  
  // Function to categorize events by time proximity
const categorizeByProximity = (events) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  // Next 7 days (including today) for "This Week" section
  const nextSevenDays = new Date(today);
  nextSevenDays.setDate(today.getDate() + 7);
  
  // Instead of calendar month end, use 30 days from now
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  
  const thisYearEnd = new Date(today.getFullYear(), 11, 31);
  
  // Make categories mutually exclusive using filter conditions that build on each other
  return {
    today: events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= today && eventDate < tomorrow;
    }),
    thisWeek: events.filter(event => {
      const eventDate = new Date(event.date);
      // Changed to show next 7 days (after today)
      return eventDate >= tomorrow && eventDate < nextSevenDays;
    }),
    thisMonth: events.filter(event => {
      const eventDate = new Date(event.date);
      // Any event within 30 days but not in today or this week
      return eventDate >= nextSevenDays && eventDate <= thirtyDaysFromNow;
    }),
    thisYear: events.filter(event => {
      const eventDate = new Date(event.date);
      // Any event this year but not in previous categories
      return eventDate > thirtyDaysFromNow && eventDate <= thisYearEnd;
    }),
    future: events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate > thisYearEnd;
    }),
    past: events.filter(event => {
      const timeRemaining = getTimeRemaining(event.date);
      return timeRemaining.isPast;
    })
  };
};
  
  // Sort all events by date (closest first)
  const sortedEvents = [...events].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
  
  // Categorize events by time proximity
  const categorizedEvents = categorizeByProximity(sortedEvents);
  
  // Helper function to populate one-time event form with an existing event
  const populateOneTimeEventForm = (event) => {
    // Set basic fields
    setOtEventName(event.name);
    setOtEventDescription(event.description || '');
    setOtEventColor(event.color || 'blue');
    setOtEventIsAllDay(event.isAllDay || false);
    setOtEventHasDuration(event.hasDuration || false);
    
    // Set date and time fields from the event date
    const startDate = new Date(event.date);
    
    // Format the date as YYYY-MM-DD
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, '0');
    const day = String(startDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // Format the time components
    let hours = startDate.getHours();
    const minutes = startDate.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    
    // Set the form fields
    setOtEventHour(String(hours));
    setOtEventMinute(String(minutes).padStart(2, '0'));
    setOtEventAmPm(ampm);
    
    // Set the full ISO date string
    const timeStr = getTimeFromComponents(hours, String(minutes).padStart(2, '0'), ampm);
    setOtEventDate(`${dateStr}T${timeStr}`);
    
    // Handle end date and time if available
    if (event.hasDuration && event.endDate) {
      const endDate = new Date(event.endDate);
      
      // Format the end date
      const endYear = endDate.getFullYear();
      const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
      const endDay = String(endDate.getDate()).padStart(2, '0');
      const endDateStr = `${endYear}-${endMonth}-${endDay}`;
      
      // Format the end time components
      let endHours = endDate.getHours();
      const endMinutes = endDate.getMinutes();
      const endAmpm = endHours >= 12 ? 'PM' : 'AM';
      endHours = endHours % 12;
      endHours = endHours ? endHours : 12; // Convert 0 to 12
      
      // Set the end time form fields
      setOtEventEndHour(String(endHours));
      setOtEventEndMinute(String(endMinutes).padStart(2, '0'));
      setOtEventEndAmPm(endAmpm);
      
      // Set the full ISO end date string
      const endTimeStr = getTimeFromComponents(endHours, String(endMinutes).padStart(2, '0'), endAmpm);
      setOtEventEndDate(`${endDateStr}T${endTimeStr}`);
    } else {
      // Set default end date (1 hour after start)
      setOtEventEndDate(setDefaultEndTime(event.date));
    }
  };
  
  // Helper function to populate recurring event form with an existing event
  const populateRecurringEventForm = (event) => {
    // Set basic fields
    setREventName(event.name);
    setREventDescription(event.description || '');
    setREventColor(event.color || 'blue');
    setREventIsAllDay(event.isAllDay || false);
    setREventHasDuration(event.hasDuration || false);
    
    // Set recurrence pattern
    setRecurrenceType(event.recurrenceType || 'daily');
    setRecurrenceInterval(event.recurrenceInterval || 1);
    
    // Set days of week if available
    if (event.daysOfWeek && Array.isArray(event.daysOfWeek)) {
      setSelectedDaysOfWeek(event.daysOfWeek);
    } else if (event.recurrenceType === 'weekly') {
      // Default to Monday if not specified
      setSelectedDaysOfWeek([1]);
    } else if (event.recurrenceType === 'daily') {
      // Default to weekdays if not specified
      setSelectedDaysOfWeek([1, 2, 3, 4, 5]);
    }
    
    // Set monthly/yearly options if needed
    if (event.dayOfMonth) {
      setDayOfMonth(event.dayOfMonth);
    }
    
    if (event.monthOfYear !== undefined && event.monthOfYear !== null) {
      setMonthOfYear(event.monthOfYear);
    }
    
    // Set time from event date
    const startDate = new Date(event.date);
    
    // Format the time components
    let hours = startDate.getHours();
    const minutes = startDate.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    
    // Set the form fields
    setREventHour(String(hours));
    setREventMinute(String(minutes).padStart(2, '0'));
    setREventAmPm(ampm);
    
    // Set the time string
    setREventTime(getTimeFromComponents(hours, String(minutes).padStart(2, '0'), ampm));
    
    // Set duration if available
    if (event.hasDuration && event.endDate) {
      const endDate = new Date(event.endDate);
      const startDate = new Date(event.date);
      const durationMs = endDate.getTime() - startDate.getTime();
      const durationMinutes = Math.round(durationMs / 60000); // Convert ms to minutes
      
      setREventDuration(durationMinutes || 60); // Default to 60 if calculation is off
    } else {
      setREventDuration(60); // Default to 60 minutes
    }
  };

  // Function to update an existing event
  const updateEvent = async (eventId, eventData) => {
    try {
      // Call the API to update the event
      const updatedEvent = await updateCountdownEvent(eventId, eventData);
      
      // Update local state
      setEvents(events.map(event => event._id === eventId ? updatedEvent : event));
      
      // Reset form and edit mode
      setEditMode(false);
      setEditingEventId(null);
      
      // Reset form fields based on form type
      if (activeForm === 'one-time') {
        setOtEventName('');
        setOtEventDate(getTodayDateTime());
        setOtEventDescription('');
        setOtEventColor('blue');
        setOtEventHasDuration(false);
        setOtEventEndDate(setDefaultEndTime(getTodayDateTime()));
        setOtEventIsAllDay(false);
      } else {
        setREventName('');
        initializeTimeComponents();
        setREventDescription('');
        setREventColor('blue');
        setREventHasDuration(false);
        setREventDuration(60);
        setREventIsAllDay(false);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to update event. Please try again.');
      return false;
    }
  };

  // Forced rerender every second to update countdowns
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Event card component
  const EventCard = ({ event }) => {
    const timeRemaining = getTimeRemaining(event.date);
    const formattedTime = formatCountdown(timeRemaining);
    const bgColor = getBgColor(timeRemaining, event.color);
    const progressColor = getProgressColor(timeRemaining, event.color);
    const isPast = timeRemaining.isPast;
    
    // Calculate progress percentage
    let progressPercent = 0;
    
    if (event.isRecurring) {
      if (event.recurrenceType === 'daily') {
        // For daily, use hours in the day
        const hoursInDay = 24;
        const hoursRemaining = timeRemaining.hours + (timeRemaining.days * 24);
        progressPercent = Math.min(100, (hoursInDay - hoursRemaining) / hoursInDay * 100);
      } else if (event.recurrenceType === 'weekly') {
        // For weekly, use days in the week
        const daysInWeek = 7;
        progressPercent = Math.min(100, (daysInWeek - timeRemaining.days) / daysInWeek * 100);
      } else if (timeRemaining.days <= 30) {
        // Default for longer periods
        progressPercent = Math.min(100, (30 - timeRemaining.days) / 30 * 100);
      }
    } else {
      if (timeRemaining.days <= 90) {
        progressPercent = Math.min(100, (90 - timeRemaining.days) / 90 * 100);
      }
    }
    
    // Use _id for MongoDB compatibility
    const eventId = event._id || event.id;
    
    return (
      <div className="col">
        <div className={`card h-100 ${isPast ? 'opacity-50' : ''}`}>
          <div className={`card-header ${bgColor}`}>
            <div className="d-flex justify-content-between align-items-start">
              <h5 className="mb-0">
                {event.name}
                {event.isRecurring && (
                  <span className="badge bg-info bg-opacity-10 text-info recurring-badge">
                    Recurring
                  </span>
                )}
              </h5>
              <div>
                {event.isRecurring && (
                  <button
                    className="btn btn-sm btn-link text-success me-2"
                    onClick={() => handleCompleteRecurringEvent(event)}
                    aria-label="Mark as complete"
                    title="Mark as complete and set next occurrence"
                  >
                    ✓
                  </button>
                )}
                <button
                  className="btn btn-sm btn-link text-danger"
                  onClick={() => deleteEvent(eventId)}
                  aria-label="Delete countdown"
                >
                  🗑️
                </button>
              </div>
            </div>
            <div className="small text-muted mt-1">
              {formatEventTimeDisplay(event)}
            </div>
            {event.isAllDay && (
              <span className="badge bg-info bg-opacity-10 text-info ms-2">All day</span>
            )}
            {event.isRecurring && (
              <div className={`badge bg-info bg-opacity-10 ${getRecurrenceDescriptionStyle()} mt-1`}>
                {getRecurrenceDescription(event)}
              </div>
            )}
          </div>
          <div className="card-body">
            {event.description && (
              <p className="card-text">{event.description}</p>
            )}
            
            <h4 className="mt-3 mb-1">
              {isPast ? (
                <div className="d-flex align-items-center">
                  <span className="text-muted me-2">
                    {event.isRecurring ? "Event is due" : "Event has passed"}
                  </span>
                  {event.isRecurring && (
                    <button 
                      className="btn btn-sm btn-success" 
                      onClick={() => handleCompleteRecurringEvent(event)}
                    >
                      Complete & Reset
                    </button>
                  )}
                </div>
              ) : (
                formattedTime
              )}
            </h4>
            
            {/* Notes section */}
            <div className="mt-3 border-top pt-2">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <h6 className="mb-0">Notes</h6>
                {editingNotes !== eventId && (
                  <button 
                    className="btn btn-sm btn-link p-0" 
                    onClick={() => startEditingNotes(event)}
                  >
                    Edit
                  </button>
                )}
              </div>
              
              {editingNotes === eventId ? (
                <div>
                  <textarea 
                    className="form-control mb-2" 
                    rows="3"
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Add notes about this event..."
                  ></textarea>
                  <div className="d-flex justify-content-end gap-2">
                    <button 
                      className="btn btn-sm btn-outline-secondary" 
                      onClick={cancelEditingNotes}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn btn-sm btn-primary" 
                      onClick={() => saveNotes(eventId)}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border p-2 bg-light rounded" style={{ minHeight: '60px' }}>
                  {event.notes ? (
                    <p className="mb-0">{event.notes}</p>
                  ) : (
                    <p className="text-muted mb-0 fst-italic">No notes added yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>
          {!isPast && (
            <div className="card-footer bg-white">
              <div className="progress" style={{ height: '8px' }}>
                <div
                  className={`progress-bar ${progressColor}`}
                  role="progressbar"
                  style={{ width: `${progressPercent}%` }}
                  aria-valuenow={progressPercent}
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Time group section component
  const TimeGroupSection = ({ title, events, showIfEmpty = false }) => {
    if (events.length === 0 && !showIfEmpty) {
      return null;
    }
    
    return (
      <>
        <h4 className="time-group-header">{title}</h4>
        {events.length === 0 ? (
          <div className="text-center py-3 bg-light rounded mb-3">
            <p className="text-muted mb-0">No events in this time period.</p>
          </div>
        ) : (
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 mb-4">
            {events.map(event => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </>
    );
  };
  return (
    <PageWrapper>
      {/* Custom CSS for additional colors */}
      <style>{customColors}</style>
      
      <div className="container mt-4 main-content">
        {/* Welcome Container */}
        <div className="welcome-container mb-4">
          <div className="welcome-message">
            <h4>{t('countdown.title')}</h4>
            <p>{t('countdown.extendedDescription')}</p>
          </div>
          
          <div className="btn-group" role="group" aria-label="Form selection">
            <button 
              type="button" 
              className={`btn ${activeForm === 'one-time' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveForm('one-time')}
            >
              + {t('countdown.oneTimeEvent')}
            </button>
            <button 
              type="button" 
              className={`btn ${activeForm === 'recurring' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveForm('recurring')}
            >
              + {t('countdown.recurringEvent')}
            </button>
          </div>
        </div>
        
        {loading && (
          <div className="text-center my-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">{t('countdown.loading')}</p>
          </div>
        )}
        
        {/* One-time Event Form */}
        {activeForm === 'one-time' && (
          <div className="card mb-4 shadow-sm">
            <div className="card-header bg-light">
              <h5 className="mb-0 text-primary">{t('countdown.createOneTime')}</h5>
            </div>
            <div className="card-body">
              <p className="text-muted small mb-3">{t('countdown.oneTimeDescription')}</p>
              <form onSubmit={addOneTimeEvent}>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="ot-event-name" className="form-label">{t('countdown.eventName')}</label>
                    <input
                      id="ot-event-name"
                      type="text"
                      className="form-control"
                      value={otEventName}
                      onChange={(e) => setOtEventName(e.target.value)}
                      placeholder={t('countdown.eventNameExample')}
                      required
                    />
                  </div>
                  
                  <div className="col-md-6">
                    <label htmlFor="ot-event-date" className="form-label">{t('countdown.eventStart')}</label>
                    <div className="row">
                      <div className="col-md-6 mb-2 mb-md-0">
                        <input
                          id="ot-event-date-calendar"
                          type="date"
                          className="form-control"
                          value={otEventDate.split('T')[0] || ''}
                          onChange={handleOtEventDateChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex">
                          {/* Hour selection */}
                          <select
                            className="form-select me-2"
                            value={otEventHour}
                            onChange={(e) => setOtEventHour(e.target.value)}
                            aria-label="Hour"
                          >
                            {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(hour => (
                              <option key={hour} value={String(hour)}>
                                {hour}
                              </option>
                            ))}
                          </select>
                          
                          {/* Minute selection */}
                          <select
                            className="form-select me-2"
                            value={otEventMinute}
                            onChange={(e) => setOtEventMinute(e.target.value)}
                            aria-label="Minute"
                          >
                            {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(minute => (
                              <option key={minute} value={minute}>
                                {minute}
                              </option>
                            ))}
                          </select>
                          
                          {/* AM/PM selection */}
                          <select
                            className="form-select"
                            value={otEventAmPm}
                            onChange={(e) => setOtEventAmPm(e.target.value)}
                            aria-label="AM/PM"
                          >
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="form-check mb-3">
                  <input
                    id="ot-event-all-day"
                    type="checkbox"
                    className="form-check-input"
                    checked={otEventIsAllDay}
                    onChange={(e) => setOtEventIsAllDay(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="ot-event-all-day">
                    {t('countdown.allDay')}
                  </label>
                </div>
                
                <div className="form-check mb-3">
                  <input
                    id="ot-event-has-duration"
                    type="checkbox"
                    className="form-check-input"
                    checked={otEventHasDuration}
                    onChange={(e) => setOtEventHasDuration(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="ot-event-has-duration">
                    {t('countdown.hasDuration')}
                  </label>
                </div>
                
                {otEventHasDuration && !otEventIsAllDay && (
                  <div className="mb-3">
                    <label htmlFor="ot-event-end-date" className="form-label">{t('countdown.eventEnd')}</label>
                    <div className="row">
                      <div className="col-md-6 mb-2 mb-md-0">
                        <input
                          id="ot-event-end-date-calendar"
                          type="date"
                          className="form-control"
                          value={otEventEndDate.split('T')[0] || ''}
                          onChange={(e) => {
                            const timeComponent = getOtEventEndTimeFromComponents();
                            setOtEventEndDate(`${e.target.value}T${timeComponent}`);
                          }}
                          required
                          min={otEventDate.split('T')[0]} // Ensure end date is not before start date
                        />
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex">
                          {/* Hour selection */}
                          <select
                            className="form-select me-2"
                            value={otEventEndHour}
                            onChange={(e) => setOtEventEndHour(e.target.value)}
                            aria-label="Hour"
                          >
                            {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(hour => (
                              <option key={hour} value={String(hour)}>
                                {hour}
                              </option>
                            ))}
                          </select>
                          
                          {/* Minute selection */}
                          <select
                            className="form-select me-2"
                            value={otEventEndMinute}
                            onChange={(e) => setOtEventEndMinute(e.target.value)}
                            aria-label="Minute"
                          >
                            {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(minute => (
                              <option key={minute} value={minute}>
                                {minute}
                              </option>
                            ))}
                          </select>
                          
                          {/* AM/PM selection */}
                          <select
                            className="form-select"
                            value={otEventEndAmPm}
                            onChange={(e) => setOtEventEndAmPm(e.target.value)}
                            aria-label="AM/PM"
                          >
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="ot-event-description" className="form-label">{t('countdown.descriptionField')}</label>
                    <input
                      id="ot-event-description"
                      type="text"
                      className="form-control"
                      value={otEventDescription}
                      onChange={(e) => setOtEventDescription(e.target.value)}
                      placeholder={t('countdown.descriptionPlaceholder')}
                    />
                  </div>
                  
                  <div className="col-md-6">
                    <label htmlFor="ot-event-color" className="form-label">{t('countdown.color')}</label>
                    <select
                      id="ot-event-color"
                      className="form-select"
                      value={otEventColor}
                      onChange={(e) => setOtEventColor(e.target.value)}
                    >
                      {colorOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="d-flex mt-3 gap-2">
                  {editMode && (
                    <button type="button" className="btn btn-outline-secondary flex-grow-1" onClick={() => {
                      setEditMode(false);
                      setEditingEventId(null);
                      setOtEventName('');
                      setOtEventDate(getTodayDateTime());
                      setOtEventDescription('');
                      setOtEventColor('blue');
                      setOtEventHasDuration(false);
                      setOtEventEndDate(setDefaultEndTime(getTodayDateTime()));
                      setOtEventIsAllDay(false);
                    }}>
                      {t('countdown.cancelEdit')}
                    </button>
                  )}
                  <button type="submit" className="btn btn-primary flex-grow-1">
                    {editMode ? t('countdown.updateEvent') : t('countdown.createEvent')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Recurring Event Form */}
        {activeForm === 'recurring' && (
          <div className="card mb-4 shadow-sm">
            <div className="card-header bg-light">
              <h5 className="mb-0 text-primary">Create a Recurring Event</h5>
            </div>
            <div className="card-body">
              <p className="text-muted small mb-3">Set up regular events like meetings, workouts, or reminders</p>
              <form onSubmit={addRecurringEvent}>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="r-event-name" className="form-label">Event Name</label>
                    <input
                      id="r-event-name"
                      type="text"
                      className="form-control"
                      value={rEventName}
                      onChange={(e) => setREventName(e.target.value)}
                      placeholder="Team Meeting, Daily Workout, etc."
                      required
                    />
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label">Time of Day</label>
                    <div className="d-flex">
                      {/* Hour selection */}
                      <select
                        className="form-select me-2"
                        value={rEventHour}
                        onChange={(e) => setREventHour(e.target.value)}
                        aria-label="Hour"
                      >
                        {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(hour => (
                          <option key={hour} value={String(hour)}>
                            {hour}
                          </option>
                        ))}
                      </select>
                      
                      {/* Minute selection */}
                      <select
                        className="form-select me-2"
                        value={rEventMinute}
                        onChange={(e) => setREventMinute(e.target.value)}
                        aria-label="Minute"
                      >
                        {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(minute => (
                          <option key={minute} value={minute}>
                            {minute}
                          </option>
                        ))}
                      </select>
                      
                      {/* AM/PM selection */}
                      <select
                        className="form-select"
                        value={rEventAmPm}
                        onChange={(e) => setREventAmPm(e.target.value)}
                        aria-label="AM/PM"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="form-check mb-3">
                  <input
                    id="r-event-all-day"
                    type="checkbox"
                    className="form-check-input"
                    checked={rEventIsAllDay}
                    onChange={(e) => setREventIsAllDay(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="r-event-all-day">
                    All-day event
                  </label>
                </div>
                
                <div className="form-check mb-3">
                  <input
                    id="r-event-has-duration"
                    type="checkbox"
                    className="form-check-input"
                    checked={rEventHasDuration}
                    onChange={(e) => setREventHasDuration(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="r-event-has-duration">
                    Event has duration
                  </label>
                </div>
                
                {rEventHasDuration && !rEventIsAllDay && (
                  <div className="mb-3">
                    <label htmlFor="r-event-duration" className="form-label">Event Duration (minutes)</label>
                    <select
                      id="r-event-duration"
                      className="form-select"
                      value={rEventDuration}
                      onChange={(e) => setREventDuration(parseInt(e.target.value))}
                      required
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="90">1.5 hours</option>
                      <option value="120">2 hours</option>
                      <option value="180">3 hours</option>
                      <option value="240">4 hours</option>
                      <option value="480">8 hours</option>
                    </select>
                  </div>
                )}
                
                <div className="bg-light p-3 rounded mb-3">
                  <div className="mb-3">
                    <label htmlFor="recurrence-type" className="form-label">Recurrence Pattern</label>
                    <select
                      id="recurrence-type"
                      className="form-select"
                      value={recurrenceType}
                      onChange={handleRecurrenceTypeChange}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="recurrence-interval" className="form-label">
                      {recurrenceType === 'daily' && 'Repeat every X days'}
                      {recurrenceType === 'weekly' && 'Repeat every X weeks'}
                      {recurrenceType === 'monthly' && 'Repeat every X months'}
                      {recurrenceType === 'yearly' && 'Repeat every X years'}
                    </label>
                    <input
                      id="recurrence-interval"
                      type="number"
                      className="form-control"
                      min="1"
                      max="99"
                      value={recurrenceInterval}
                      onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  
                  {/* Days of Week Selection - For both daily and weekly */}
                  {(recurrenceType === 'daily' || recurrenceType === 'weekly') && (
                    <div className="mb-3">
                      <label className="form-label d-block">
                        {recurrenceType === 'daily' ? 'Days to Include' : 'Days of Week'}
                      </label>
                      <div className="btn-group" role="group" aria-label="Days of week">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                          <button
                            key={index}
                            type="button"
                            className={`btn ${selectedDaysOfWeek.includes(index) ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={(e) => {
                              e.preventDefault();
                              handleDayOfWeekChange(index);
                            }}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                      {selectedDaysOfWeek.length === 0 && (
                        <div className="text-danger mt-1">Please select at least one day</div>
                      )}
                    </div>
                  )}
                  
                  {/* Day of Month Selection - For monthly and yearly */}
                  {(recurrenceType === 'monthly' || recurrenceType === 'yearly') && (
                    <div className="mb-3">
                      <label htmlFor="day-of-month" className="form-label">Day of Month</label>
                      <select
                        id="day-of-month"
                        className="form-select"
                        value={dayOfMonth}
                        onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {/* Month Selection - For yearly */}
                  {recurrenceType === 'yearly' && (
                    <div className="mb-3">
                      <label htmlFor="month-of-year" className="form-label">Month</label>
                      <select
                        id="month-of-year"
                        className="form-select"
                        value={monthOfYear}
                        onChange={(e) => setMonthOfYear(parseInt(e.target.value))}
                      >
                        {['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'].map((month, index) => (
                          <option key={index} value={index}>{month}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="r-event-description" className="form-label">Description (Optional)</label>
                    <input
                      id="r-event-description"
                      type="text"
                      className="form-control"
                      value={rEventDescription}
                      onChange={(e) => setREventDescription(e.target.value)}
                      placeholder="Add details about this event..."
                    />
                  </div>
                  
                  <div className="col-md-6">
                    <label htmlFor="r-event-color" className="form-label">Color</label>
                    <select
                      id="r-event-color"
                      className="form-select"
                      value={rEventColor}
                      onChange={(e) => setREventColor(e.target.value)}
                    >
                      {colorOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="d-flex mt-3 gap-2">
                  {editMode && (
                    <button type="button" className="btn btn-outline-secondary flex-grow-1" onClick={() => {
                      setEditMode(false);
                      setEditingEventId(null);
                      setREventName('');
                      initializeTimeComponents();
                      setREventDescription('');
                      setREventColor('blue');
                      setREventHasDuration(false);
                      setREventDuration(60);
                      setREventIsAllDay(false);
                    }}>
                      Cancel Edit
                    </button>
                  )}
                  <button type="submit" className="btn btn-primary flex-grow-1">
                    {editMode ? 'Update Recurring Event' : 'Create Recurring Event'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Events organized by time proximity */}
        <h3 className="mt-4 mb-3">Upcoming Events</h3>
        {!loading && events.length === 0 ? (
          <div className="text-center py-4 bg-light rounded mb-4">
            <p className="text-muted">No events yet. Add your first event using the form above.</p>
          </div>
        ) : (
          <>
            {/* Today's events */}
            <TimeGroupSection 
              title="Today" 
              events={categorizedEvents.today} 
            />
            
            {/* Next 7 days events */}
            <TimeGroupSection 
              title="Next 7 Days" 
              events={categorizedEvents.thisWeek} 
            />
            
            {/* This month's events */}
            <TimeGroupSection 
              title="This Month" 
              events={categorizedEvents.thisMonth} 
            />
            
            {/* This year's events */}
            <TimeGroupSection 
              title="This Year" 
              events={categorizedEvents.thisYear} 
            />
            
            {/* Future events */}
            <TimeGroupSection 
              title="Beyond This Year" 
              events={categorizedEvents.future} 
            />
            
            {/* Past events */}
            <TimeGroupSection 
              title="Past Events" 
              events={categorizedEvents.past} 
            />
          </>
        )}
      </div>
    </PageWrapper>
  );
}

export default CountdownPage;