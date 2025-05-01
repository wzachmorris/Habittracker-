import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toUTCMidnightISOString } from '../components/Habits/utils/dateUtils';

// Time slot options
const TIME_SLOTS = [
  '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
  '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM',
  '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM',
];

const DEFAULT_EVENT = {
  title: '',
  startTime: '9:00 AM',
  endTime: '10:00 AM',
  day: 0, // 0 = Sunday
  period: 'morning', // morning, afternoon, evening
  description: '',
  source: 'app', // app, google, apple, outlook
  location: '',
  isRecurring: false,
  recurringPattern: 'weekly', // daily, weekly, monthly, yearly
  recurringDays: [], // Relevant for weekly
  color: '#4285f4', // Default blue color
  isAllDay: false, // All day event flag
};

function EventForm({ event = null, onSave, onCancel, onDelete, dayIndex = 0 }) {
  // Get current user from auth context
  const { user } = useAuth();
  
  // Initialize form state with default or provided event
  // Note: day will be properly initialized in useEffect
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showRecurringOptions, setShowRecurringOptions] = useState(false);
  
  // Available colors
  const colorOptions = [
    { value: '#4285f4', name: 'Blue' },
    { value: '#0f9d58', name: 'Green' },
    { value: '#f4b400', name: 'Yellow' },
    { value: '#db4437', name: 'Red' },
    { value: '#673ab7', name: 'Purple' },
    { value: '#ff6d01', name: 'Orange' },
    { value: '#795548', name: 'Brown' },
    { value: '#607d8b', name: 'Gray' },
  ];
  
  // Week day labels for recurring selection
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Initialize formData state with defaults before useEffect
  const [formData, setFormData] = useState(() => {
    // Set default end time to one hour after start time
    const startTime = DEFAULT_EVENT.startTime;
    const startTimeIndex = TIME_SLOTS.indexOf(startTime);
    // Find a slot that's 1 hour later (usually 2 slots away since slots are 30 min apart)
    const defaultEndTime = startTimeIndex < TIME_SLOTS.length - 2 
                           ? TIME_SLOTS[startTimeIndex + 2] 
                           : TIME_SLOTS[startTimeIndex + 1];
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0];
    
    return {
      ...DEFAULT_EVENT,
      day: dayIndex,  // This ensures the day is properly set initially
      userId: user ? user.userId : null,
      syncToCountdown: true,
      endTime: defaultEndTime, // Make the default end time 1 hour after start
      hasDuration: true, // By default, events have duration
      eventDate: todayFormatted // Default to today's date
    };
  });

  // Initialize form with provided event data if exists
  useEffect(() => {
    if (event) {
      // Extract date from event.date if available or use today
      let eventDate = '';
      if (event.date) {
        // Convert the ISO date to YYYY-MM-DD
        const dateObj = new Date(event.date);
        const today = new Date();
        
        // Ensure the date is not in the past
        if (dateObj < today) {
          console.log("Event date is in the past, using today instead:", dateObj);
          eventDate = today.toISOString().split('T')[0];
        } else {
          eventDate = dateObj.toISOString().split('T')[0];
        }
      } else if (event.originalDate) {
        // Sometimes the date is in originalDate field
        const dateObj = new Date(event.originalDate);
        const today = new Date();
        
        // Ensure the date is not in the past
        if (dateObj < today) {
          console.log("Event original date is in the past, using today instead:", dateObj);
          eventDate = today.toISOString().split('T')[0];
        } else {
          eventDate = dateObj.toISOString().split('T')[0];
        }
      } else {
        // Fallback to today's date
        eventDate = new Date().toISOString().split('T')[0];
      }
      
      setFormData({
        ...event,
        // Set default values for any missing fields
        recurringDays: event.recurringDays || [],
        isRecurring: !!event.isRecurring,
        recurringPattern: event.recurringPattern || 'weekly',
        location: event.location || '',
        color: event.color || '#4285f4',
        userId: event.userId || (user ? user.userId : null),
        syncToCountdown: true, // Always sync to countdown
        hasDuration: event.hasDuration !== undefined ? event.hasDuration : true, // Use provided value or default to true
        isAllDay: event.isAllDay || false, // Check if it's an all-day event
        eventDate: eventDate // Set the event date
      });
      
      if (event.isRecurring) {
        setShowRecurringOptions(true);
      }
    } else {
      // For new events, set the day to the provided dayIndex and include userId
      const startTime = DEFAULT_EVENT.startTime;
      const startTimeIndex = TIME_SLOTS.indexOf(startTime);
      const defaultEndTime = startTimeIndex < TIME_SLOTS.length - 2 
                           ? TIME_SLOTS[startTimeIndex + 2] 
                           : TIME_SLOTS[startTimeIndex + 1];
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      const todayFormatted = today.toISOString().split('T')[0];
      
      // If a specific day was selected when adding an event, adjust the date to match that day
      let dateObj = new Date(today);
      if (dayIndex !== today.getDay()) {
        // Calculate days to add to get to the selected day
        const daysToAdd = (dayIndex - today.getDay() + 7) % 7;
        dateObj.setDate(dateObj.getDate() + daysToAdd);
      }
      const dateFormatted = dateObj.toISOString().split('T')[0];
      
      setFormData({
        ...DEFAULT_EVENT,
        day: dayIndex, // Still need this for recurring events
        userId: user ? user.userId : null,
        syncToCountdown: true, // Default to syncing for new events
        endTime: defaultEndTime, // Make the default end time 1 hour after start
        hasDuration: true, // By default, events have duration
        eventDate: dateFormatted // Use date that matches the selected day
      });
    }
  }, [event, dayIndex, user]);
  
  // Determine period based on start time
  useEffect(() => {
    if (formData.startTime) {
      const hour = parseInt(formData.startTime.split(':')[0]);
      const isPM = formData.startTime.includes('PM');
      
      let period;
      const hourIn24 = isPM && hour !== 12 ? hour + 12 : !isPM && hour === 12 ? 0 : hour;
      
      if (hourIn24 >= 6 && hourIn24 < 12) {
        period = 'morning';
      } else if (hourIn24 >= 12 && hourIn24 < 18) {
        period = 'afternoon';
      } else {
        period = 'evening';
      }
      
      setFormData(prev => ({ ...prev, period }));
    }
  }, [formData.startTime]);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      if (name === 'isAllDay') {
        setFormData(prev => {
          const updates = { 
            ...prev, 
            [name]: checked 
          };
          if (checked) {
            updates.startTime = 'All day';
            updates.hasDuration = false;
            updates.endTime = null;
          } else {
            updates.startTime = '9:00 AM';
            updates.hasDuration = true;
            updates.endTime = '10:00 AM';
          }
          return updates;
        });
        return;
      }
      
      if (name === 'hasDuration') {
        setFormData(prev => { 
          // If hasDuration is being turned on/off, manage the endTime accordingly
          const updates = {
            ...prev, 
            [name]: checked
          };
          
          if (checked) {
            // If hasDuration is turned on and no endTime exists, set a default
            if (!prev.endTime) {
              // Set end time to 1 hour after start time
              const startTimeIndex = TIME_SLOTS.indexOf(prev.startTime);
              const defaultEndTime = startTimeIndex < TIME_SLOTS.length - 2 
                ? TIME_SLOTS[startTimeIndex + 2] 
                : TIME_SLOTS[startTimeIndex + 1];
              updates.endTime = defaultEndTime;
            }
          } else {
            // If hasDuration is turned off, no need for endTime
            updates.endTime = null;
          }
          
          console.log("Updated hasDuration:", updates);
          return updates;
        });
      } else {
        setFormData(prev => ({ ...prev, [name]: checked }));
      }
      return;
    }
    
    if (name === 'eventDate') {
      console.log("eventDate input value:", value); // Debug log
      const dateObj = new Date(value);
      const dayOfWeek = dateObj.getDay();
      setFormData(prev => {
        let updatedRecurringDays = prev.recurringDays;
        if (prev.isRecurring && prev.recurringPattern === 'weekly') {
          if (!updatedRecurringDays.includes(dayOfWeek)) {
            updatedRecurringDays = [...new Set([...updatedRecurringDays, dayOfWeek])];
          }
        }
        const newFormData = {
          ...prev,
          [name]: value,
          day: dayOfWeek.toString(),
          recurringDays: updatedRecurringDays
        };
        console.log("Updated formData after eventDate change:", newFormData); // Debug log
        return newFormData;
      });
      return;
    }
    
    if (name === 'startTime') {
      setFormData(prev => {
        const newStartTime = value;
        const currentEndTime = prev.endTime;
        const parseTime = (timeStr) => {
          if (!timeStr) return 0; // Handle null/undefined time strings
          const match = timeStr.match(/(\d+):(\d+) (AM|PM)/);
          if (!match) return 0;
          let hour = parseInt(match[1]);
          const minute = parseInt(match[2]);
          const isPM = match[3] === 'PM';
          if (isPM && hour !== 12) hour += 12;
          if (!isPM && hour === 12) hour = 0;
          return hour * 60 + minute;
        };
        const startMinutes = parseTime(newStartTime);
        const endMinutes = parseTime(currentEndTime);
        if (endMinutes <= startMinutes) {
          const startIndex = TIME_SLOTS.indexOf(newStartTime);
          const newEndTime = startIndex < TIME_SLOTS.length - 1 
            ? TIME_SLOTS[startIndex + 1] 
            : TIME_SLOTS[startIndex];
          console.log(`Auto-adjusting end time because ${currentEndTime} <= ${newStartTime}. New end time: ${newEndTime}`);
          return { ...prev, [name]: value, endTime: newEndTime };
        }
        return { ...prev, [name]: value };
      });
    } else if (name === 'recurringPattern') {
      // Special handling for recurring pattern changes
      setFormData(prev => {
        const newFormData = { ...prev, [name]: value };
        
        // When changing to weekly pattern, ensure the current day is included in recurringDays
        if (value === 'weekly' && prev.isRecurring) {
          const eventDate = new Date(prev.eventDate);
          const eventDay = eventDate.getDay();
          
          if (!prev.recurringDays.includes(eventDay)) {
            newFormData.recurringDays = [...new Set([...prev.recurringDays, eventDay])];
          }
        }
        
        console.log("Updated formData after changing recurring pattern:", newFormData); // Debug log
        return newFormData;
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Handle color selection
  const handleColorSelect = (color) => {
    setFormData(prev => ({ ...prev, color }));
    setShowColorPicker(false);
  };
  
  // Function to handle recurring day toggle
  const handleRecurringDayToggle = (dayIndex) => {
    setFormData(prev => {
      const updatedDays = [...prev.recurringDays];
      
      if (updatedDays.includes(dayIndex)) {
        // Remove if already included, but ensure we have at least one day selected
        if (updatedDays.length > 1) {
          return { 
            ...prev, 
            recurringDays: updatedDays.filter(d => d !== dayIndex) 
          };
        }
        return prev; // Don't allow removing the last day
      } else {
        // Add if not included
        return { 
          ...prev, 
          recurringDays: [...updatedDays, dayIndex] 
        };
      }
    });
  };
  
  // Function to handle isRecurring checkbox specifically
  const handleIsRecurringChange = (e) => {
    const { checked } = e.target;
    
    setFormData(prev => {
      // When enabling recurring, automatically select current day
      if (checked && prev.recurringPattern === 'weekly') {
        // Get the day from the selected date
        const eventDate = new Date(prev.eventDate);
        const eventDay = eventDate.getDay();
        
        const newFormData = {
          ...prev,
          isRecurring: checked,
          recurringDays: [eventDay] // Use the day from the selected date
        };
        
        console.log("Updated formData after enabling weekly recurring:", newFormData); // Debug log
        return newFormData;
      }
      
      const newFormData = {
        ...prev,
        isRecurring: checked,
        // Clear recurring days if turning off recurring
        recurringDays: checked ? prev.recurringDays : []
      };
      
      console.log("Updated formData after toggling recurring:", newFormData); // Debug log
      return newFormData;
    });
    
    setShowRecurringOptions(checked);
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    
    if (name === 'isRecurring') {
      // Use our specialized handler for recurring checkbox
      handleIsRecurringChange(e);
    } else {
      // For other checkboxes, use normal behavior
      setFormData(prev => ({ ...prev, [name]: checked }));
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    console.log("Form data at submission:", formData); // Debug log of complete form data

    try {
      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }

      if (!formData.userId && user) {
        formData.userId = user.userId;
      }

      if (!formData.userId) {
        throw new Error('User ID is required - please sign in again');
      }

      if (!formData.eventDate) {
        throw new Error('Event date is required');
      }

      if (!formData.isAllDay && formData.startTime !== 'All day') {
        const startParts = formData.startTime?.match(/(\d+):(\d+) (AM|PM)/);
        const endParts = formData.endTime?.match(/(\d+):(\d+) (AM|PM)/);

        if (startParts && endParts) {
          const startHour = parseInt(startParts[1]) + (startParts[3] === 'PM' && startParts[1] !== '12' ? 12 : 0);
          const startMinute = parseInt(startParts[2]);
          const endHour = parseInt(endParts[1]) + (endParts[3] === 'PM' && endParts[1] !== '12' ? 12 : 0);
          const endMinute = parseInt(endParts[2]);
          const startTotal = startHour * 60 + startMinute;
          const endTotal = endHour * 60 + endMinute;

          if (endTotal <= startTotal) {
            throw new Error('End time must be after start time');
          }
        }
      }

      const eventToSave = { ...formData };
      const dateObj = new Date(eventToSave.eventDate);

      if (eventToSave.isAllDay || eventToSave.startTime === 'All day') {
        dateObj.setUTCHours(12, 0, 0, 0);
        eventToSave.date = dateObj.toISOString();
        eventToSave.hasDuration = false;
        eventToSave.endDate = null;
      } else {
        const timeParts = eventToSave.startTime?.match(/(\d+):(\d+) (AM|PM)/);
        if (timeParts) {
          let hours = parseInt(timeParts[1]);
          const minutes = parseInt(timeParts[2]);
          const isPM = timeParts[3] === 'PM';
          if (isPM && hours !== 12) hours += 12;
          if (!isPM && hours === 12) hours = 0;
          dateObj.setHours(hours, minutes, 0, 0);
          eventToSave.date = dateObj.toISOString();
        } else {
          eventToSave.date = toUTCMidnightISOString(eventToSave.eventDate); // Normalize to UTC midnight
        }

        if (eventToSave.hasDuration && eventToSave.endTime) {
          const endDateObj = new Date(eventToSave.eventDate);
          const endTimeParts = eventToSave.endTime?.match(/(\d+):(\d+) (AM|PM)/);
          if (endTimeParts) {
            let hours = parseInt(endTimeParts[1]);
            const minutes = parseInt(endTimeParts[2]);
            const isPM = endTimeParts[3] === 'PM';
            if (isPM && hours !== 12) hours += 12;
            if (!isPM && hours === 12) hours = 0;
            endDateObj.setHours(hours, minutes, 0, 0);
            eventToSave.endDate = endDateObj.toISOString();
          } else {
            eventToSave.endDate = null;
          }
        } else {
          eventToSave.endDate = null;
        }
      }

      if (eventToSave.isRecurring) {
        const recurDate = new Date(eventToSave.eventDate);
        const eventDay = recurDate.getDay();

        if (eventToSave.recurringPattern === 'weekly') {
          if (!eventToSave.recurringDays || eventToSave.recurringDays.length === 0) {
            eventToSave.recurringDays = [eventDay]; // Use day from eventDate
          } else if (!eventToSave.recurringDays.includes(eventDay)) {
            eventToSave.recurringDays = [...eventToSave.recurringDays, eventDay]; // Ensure eventDay is included
          }
          eventToSave.dayOfMonth = null;
          eventToSave.monthOfYear = null;
        } else if (eventToSave.recurringPattern === 'yearly') {
          eventToSave.dayOfMonth = recurDate.getDate();
          eventToSave.monthOfYear = recurDate.getMonth();
          eventToSave.recurringDays = null;
        } else if (eventToSave.recurringPattern === 'monthly') {
          eventToSave.dayOfMonth = recurDate.getDate();
          eventToSave.monthOfYear = null;
          eventToSave.recurringDays = null;
        } else {
          eventToSave.recurringDays = null;
          eventToSave.dayOfMonth = null;
          eventToSave.monthOfYear = null;
        }
      } else {
        // For non-recurring events, clear all recurrence properties
        eventToSave.recurringDays = null;
        eventToSave.dayOfMonth = null;
        eventToSave.monthOfYear = null;
        eventToSave.recurringPattern = null; // Set to null, not 'weekly'
      }
      
      // Final debugging log to see what we're about to send
      console.log("Final event data to be saved:", eventToSave);

      if (onSave) {
        console.log("Sending final eventToSave to parent component:", eventToSave); // Final debug log
        onSave(eventToSave);
      }
    } catch (error) {
      console.error('Error preparing event:', error);
      setError(error.message || 'Failed to save event');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle event deletion - pass to parent handler
  const handleDelete = async () => {
    if (!formData._id) return;
    
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Pass to parent handler which will use the countdown events API
      if (onDelete) {
        onDelete(formData._id);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      setError('Failed to delete event');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="event-form">
      <div className="form-header mb-3">
        <h5>{event ? 'Edit Event' : 'Create New Event'}</h5>
        <p className="text-muted">
          {formData.isRecurring 
            ? 'This is a recurring event that will appear on multiple days' 
            : 'This is a one-time event'}
        </p>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Title input */}
        <div className="form-group mb-3">
          <label htmlFor="title">Event Title *</label>
          <input
            type="text"
            className="form-control"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Meeting, Appointment, etc."
            required
          />
        </div>
        
        {/* Location input */}
        <div className="form-group mb-3">
          <label htmlFor="location">Location</label>
          <input
            type="text"
            className="form-control"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Office, Home, etc."
          />
        </div>
        
        {/* All day toggle */}
        <div className="form-check mb-3">
          <input
            type="checkbox"
            className="form-check-input"
            id="isAllDay"
            name="isAllDay"
            checked={formData.isAllDay}
            onChange={handleChange}
          />
          <label className="form-check-label" htmlFor="isAllDay">
            All day event
          </label>
          <small className="form-text text-muted d-block mt-1">
            Check this box if the event lasts the entire day.
          </small>
        </div>
        
        {/* Duration toggle - only show if not an all-day event */}
        {!formData.isAllDay && (
          <div className="form-check mb-3">
            <input
              type="checkbox"
              className="form-check-input"
              id="hasDuration"
              name="hasDuration"
              checked={formData.hasDuration}
              onChange={handleChange}
            />
            <label className="form-check-label" htmlFor="hasDuration">
              Event has duration
            </label>
            <small className="form-text text-muted d-block mt-1">
              Check this box if the event takes a specific amount of time.
            </small>
          </div>
        )}
        
        {/* Time selection - only show if not an all-day event */}
        {!formData.isAllDay && (
          <div>
            {/* Start Time Row */}
            <div className="form-group mb-3">
              <label htmlFor="startTime">Start Time *</label>
              <div className="d-flex gap-2">
                <select
                  className="form-select"
                  id="startHour"
                  name="startHour"
                  value={formData.startTime ? formData.startTime.match(/(\d+):/)[1] : "6"}
                  onChange={(e) => {
                    const hour = e.target.value;
                    const minutes = formData.startTime ? formData.startTime.match(/:(\d+)/)[1] : "00";
                    const ampm = formData.startTime ? formData.startTime.match(/(AM|PM)/)[1] : "PM";
                    const newTime = `${hour}:${minutes} ${ampm}`;
                    
                    const event = {
                      target: {
                        name: "startTime",
                        value: newTime,
                        type: "select"
                      }
                    };
                    handleChange(event);
                  }}
                  required
                >
                  {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((hour) => (
                    <option key={`start-hour-${hour}`} value={hour}>{hour}</option>
                  ))}
                </select>

                <select
                  className="form-select"
                  id="startMinute"
                  name="startMinute"
                  value={formData.startTime ? formData.startTime.match(/:(\d+)/)[1] : "00"}
                  onChange={(e) => {
                    const minutes = e.target.value;
                    const hour = formData.startTime ? formData.startTime.match(/(\d+):/)[1] : "6";
                    const ampm = formData.startTime ? formData.startTime.match(/(AM|PM)/)[1] : "PM";
                    const newTime = `${hour}:${minutes} ${ampm}`;
                    
                    const event = {
                      target: {
                        name: "startTime",
                        value: newTime,
                        type: "select"
                      }
                    };
                    handleChange(event);
                  }}
                  required
                >
                  <option value="00">00</option>
                  <option value="05">05</option>
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="20">20</option>
                  <option value="25">25</option>
                  <option value="30">30</option>
                  <option value="35">35</option>
                  <option value="40">40</option>
                  <option value="45">45</option>
                  <option value="50">50</option>
                  <option value="55">55</option>
                </select>

                <select
                  className="form-select"
                  id="startAmPm"
                  name="startAmPm"
                  value={formData.startTime ? formData.startTime.match(/(AM|PM)/)[1] : "PM"}
                  onChange={(e) => {
                    const ampm = e.target.value;
                    const hour = formData.startTime ? formData.startTime.match(/(\d+):/)[1] : "6";
                    const minutes = formData.startTime ? formData.startTime.match(/:(\d+)/)[1] : "00";
                    const newTime = `${hour}:${minutes} ${ampm}`;
                    
                    const event = {
                      target: {
                        name: "startTime",
                        value: newTime,
                        type: "select"
                      }
                    };
                    handleChange(event);
                  }}
                  required
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            {/* End Time Row - Only shown if event has duration */}
            {formData.hasDuration && (
              <div className="form-group mb-3">
                <label htmlFor="endTime">End Time *</label>
                <div className="d-flex gap-2">
                  <select
                    className="form-select"
                    id="endHour"
                    name="endHour"
                    value={formData.endTime ? formData.endTime.match(/(\d+):/)[1] : "7"}
                    onChange={(e) => {
                      const hour = e.target.value;
                      const minutes = formData.endTime ? formData.endTime.match(/:(\d+)/)[1] : "00";
                      const ampm = formData.endTime ? formData.endTime.match(/(AM|PM)/)[1] : "PM";
                      const newTime = `${hour}:${minutes} ${ampm}`;
                      
                      const event = {
                        target: {
                          name: "endTime",
                          value: newTime,
                          type: "select"
                        }
                      };
                      handleChange(event);
                    }}
                    required
                  >
                    {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((hour) => (
                      <option key={`end-hour-${hour}`} value={hour}>{hour}</option>
                    ))}
                  </select>

                  <select
                    className="form-select"
                    id="endMinute"
                    name="endMinute"
                    value={formData.endTime ? formData.endTime.match(/:(\d+)/)[1] : "00"}
                    onChange={(e) => {
                      const minutes = e.target.value;
                      const hour = formData.endTime ? formData.endTime.match(/(\d+):/)[1] : "7";
                      const ampm = formData.endTime ? formData.endTime.match(/(AM|PM)/)[1] : "PM";
                      const newTime = `${hour}:${minutes} ${ampm}`;
                      
                      const event = {
                        target: {
                          name: "endTime",
                          value: newTime,
                          type: "select"
                        }
                      };
                      handleChange(event);
                    }}
                    required
                  >
                    <option value="00">00</option>
                    <option value="05">05</option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="20">20</option>
                    <option value="25">25</option>
                    <option value="30">30</option>
                    <option value="35">35</option>
                    <option value="40">40</option>
                    <option value="45">45</option>
                    <option value="50">50</option>
                    <option value="55">55</option>
                  </select>

                  <select
                    className="form-select"
                    id="endAmPm"
                    name="endAmPm"
                    value={formData.endTime ? formData.endTime.match(/(AM|PM)/)[1] : "PM"}
                    onChange={(e) => {
                      const ampm = e.target.value;
                      const hour = formData.endTime ? formData.endTime.match(/(\d+):/)[1] : "7";
                      const minutes = formData.endTime ? formData.endTime.match(/:(\d+)/)[1] : "00";
                      const newTime = `${hour}:${minutes} ${ampm}`;
                      
                      const event = {
                        target: {
                          name: "endTime",
                          value: newTime,
                          type: "select"
                        }
                      };
                      handleChange(event);
                    }}
                    required
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Date picker */}
        <div className="form-group mb-3">
          <label htmlFor="eventDate">Date *</label>
          <input
            type="date"
            className="form-control"
            id="eventDate"
            name="eventDate"
            value={formData.eventDate || new Date().toISOString().split('T')[0]}
            min={new Date().toISOString().split('T')[0]} // Set minimum date to today
            onChange={handleChange}
            required
          />
          <small className="form-text text-muted">
            {formData.isRecurring
              ? 'This is the start date for recurring events.'
              : 'This is the specific date when the event will occur.'}
          </small>
        </div>
        
        {/* Color selection */}
        <div className="form-group mb-3">
          <label>Event Color</label>
          <div className="d-flex align-items-center">
            <div 
              className="color-preview me-2"
              style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                backgroundColor: formData.color,
                border: '1px solid #ddd',
                cursor: 'pointer'
              }}
              onClick={() => setShowColorPicker(!showColorPicker)}
            ></div>
            <button 
              type="button" 
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setShowColorPicker(!showColorPicker)}
            >
              {showColorPicker ? 'Hide Colors' : 'Select Color'}
            </button>
          </div>
          
          {showColorPicker && (
            <div className="color-picker mt-2">
              <div className="d-flex flex-wrap">
                {colorOptions.map(color => (
                  <div 
                    key={color.value}
                    className="color-option me-2 mb-2"
                    style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '4px',
                      backgroundColor: color.value,
                      cursor: 'pointer',
                      border: formData.color === color.value ? '2px solid #000' : '1px solid #ddd'
                    }}
                    title={color.name}
                    onClick={() => handleColorSelect(color.value)}
                  ></div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Description textarea */}
        <div className="form-group mb-3">
          <label htmlFor="description">Description</label>
          <textarea
            className="form-control"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            placeholder="Additional details about this event..."
          ></textarea>
        </div>
        
        {/* Recurring checkbox */}
        <div className="form-check mb-3">
          <input
            type="checkbox"
            className="form-check-input"
            id="isRecurring"
            name="isRecurring"
            checked={formData.isRecurring}
            onChange={handleCheckboxChange}
          />
          <label className="form-check-label" htmlFor="isRecurring">
            Recurring Event
          </label>
          <small className="form-text text-muted d-block mt-1">
            Check this box if you want this event to repeat regularly.
          </small>
        </div>
        
        {/* Removed sync to countdown checkbox as it's now automatic */}
        
        {/* Recurring options */}
        {showRecurringOptions && (
          <div className="recurring-options p-3 mb-3 bg-light rounded border">
            <div className="form-group mb-3">
              <label htmlFor="recurringPattern">Repeat Pattern</label>
              <select
                className="form-select"
                id="recurringPattern"
                name="recurringPattern"
                value={formData.recurringPattern}
                onChange={handleChange}
              >
                <option value="daily">Every Day</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly (on same date)</option>
                <option value="yearly">Yearly (on same date)</option>
              </select>
            </div>
            
            {formData.recurringPattern === 'weekly' && (
              <div className="form-group mb-3">
                <label>Repeat on these days</label>
                <div className="d-flex flex-wrap gap-1 mt-2">
                  {weekDays.map((day, index) => (
                    <div 
                      key={day} 
                      className={`
                        day-selector 
                        ${formData.recurringDays.includes(index) ? 'selected' : ''}
                      `}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: formData.recurringDays.includes(index) 
                          ? '1px solid #4285f4' 
                          : '1px solid #dee2e6',
                        backgroundColor: formData.recurringDays.includes(index) 
                          ? '#e8f0fe' 
                          : 'white',
                        cursor: 'pointer',
                        fontWeight: formData.recurringDays.includes(index) 
                          ? '500' 
                          : 'normal',
                      }}
                      onClick={() => handleRecurringDayToggle(index)}
                    >
                      {day}
                      {parseInt(formData.day) === index && (
                        <span 
                          className="ms-1"
                          style={{
                            fontSize: '0.75rem',
                            color: '#666'
                          }}
                        >
                          (current)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-muted mt-2" style={{ fontSize: '0.8rem' }}>
                  <i className="bi bi-info-circle me-1"></i>
                  Click days to add or remove them. At least one day must be selected.
                </div>
              </div>
            )}
            
            {formData.recurringPattern === 'daily' && (
              <div className="text-muted mt-2" style={{ fontSize: '0.9rem' }}>
                This event will repeat every day
              </div>
            )}
            
            {formData.recurringPattern === 'monthly' && (
              <div className="text-muted mt-2" style={{ fontSize: '0.9rem' }}>
                This event will repeat on the same date each month
              </div>
            )}
            
            {formData.recurringPattern === 'yearly' && (
              <div className="text-muted mt-2" style={{ fontSize: '0.9rem' }}>
                This event will repeat on the same date each year
              </div>
            )}
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="alert alert-danger mb-3" role="alert">
            {error}
          </div>
        )}
        
        {/* Form buttons */}
        <div className="d-flex justify-content-between">
          <div>
            <button
              type="submit"
              className="btn btn-primary me-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (formData._id ? 'Update Event' : 'Create Event')}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
          
          {formData._id && (
            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              Delete
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default EventForm;