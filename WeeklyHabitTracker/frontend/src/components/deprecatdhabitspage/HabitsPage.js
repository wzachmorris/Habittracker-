//frontend/src/components/pages/HabitsPage.js

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { fetchActivities, toggleActivityCompletion, updateActivity } from '../../services/api';
import { fetchCountdownEvents, createCountdownEvent, deleteCountdownEvent } from '../../services/countdownEvents';
import PageWrapper from '../PageWrapper';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import DayColumn from '../Habits/DayColumn';
import NavigationHeader from '../Habits/NavigationHeader';
import EventFormModal from '../Habits/EventFormModal';
import habitsStyles from '../Habits/utils/styles';

function PastDayView({ dayIndex, dayName, activities, events, completions, dateCompletions, findDayOffset, getActivitiesForDayAndPeriod, getCalendarEventsForDayAndPeriod, getAllDayEventsForDay }) {
  return (
    <DayColumn
      key={`day-${dayIndex}`}
      dayIndex={dayIndex}
      dayName={dayName}
      findDayOffset={findDayOffset}
      getActivitiesForDayAndPeriod={getActivitiesForDayAndPeriod}
      getCalendarEventsForDayAndPeriod={getCalendarEventsForDayAndPeriod}
      getAllDayEventsForDay={getAllDayEventsForDay}
      activities={activities}
      events={events}
      completions={completions}
      dateCompletions={dateCompletions}
      isPast={true}
    />
  );
}

function TodayView({ dayIndex, dayName, activities, events, completions, dateCompletions, justToggled, isMobileView, columnRef, columnHeight, refreshFlag, findDayOffset, getActivitiesForDayAndPeriod, getCalendarEventsForDayAndPeriod, getAllDayEventsForDay, updateActivityPeriod, handleReorderActivity, toggleHabitCompletion, handleQuickAddEvent, handleEditEvent, handleDeleteEvent }) {
  return (
    <DayColumn
      key={`day-${dayIndex}-refresh-${refreshFlag}`}
      dayIndex={dayIndex}
      dayName={dayName}
      findDayOffset={findDayOffset}
      getActivitiesForDayAndPeriod={getActivitiesForDayAndPeriod}
      getCalendarEventsForDayAndPeriod={getCalendarEventsForDayAndPeriod}
      getAllDayEventsForDay={getAllDayEventsForDay}
      updateActivityPeriod={updateActivityPeriod}
      handleReorderActivity={handleReorderActivity}
      toggleHabitCompletion={toggleHabitCompletion}
      handleQuickAddEvent={handleQuickAddEvent}
      handleEditEvent={handleEditEvent}
      handleDeleteEvent={handleDeleteEvent}
      activities={activities}
      events={events}
      completions={completions}
      dateCompletions={dateCompletions}
      justToggled={justToggled}
      isMobileView={isMobileView}
      columnRef={columnRef}
      columnHeight={columnHeight}
      refreshFlag={refreshFlag}
    />
  );
}

function FutureDayView({ dayIndex, dayName, activities, events, isMobileView, refreshFlag, findDayOffset, getActivitiesForDayAndPeriod, getCalendarEventsForDayAndPeriod, getAllDayEventsForDay, updateActivityPeriod, handleReorderActivity, handleQuickAddEvent, handleEditEvent, handleDeleteEvent }) {
  return (
    <DayColumn
      key={`day-${dayIndex}-refresh-${refreshFlag}`}
      dayIndex={dayIndex}
      dayName={dayName}
      findDayOffset={findDayOffset}
      getActivitiesForDayAndPeriod={getActivitiesForDayAndPeriod}
      getCalendarEventsForDayAndPeriod={getCalendarEventsForDayAndPeriod}
      getAllDayEventsForDay={getAllDayEventsForDay}
      updateActivityPeriod={updateActivityPeriod}
      handleReorderActivity={handleReorderActivity}
      handleQuickAddEvent={handleQuickAddEvent}
      handleEditEvent={handleEditEvent}
      handleDeleteEvent={handleDeleteEvent}
      activities={activities}
      events={events}
      isMobileView={isMobileView}
      refreshFlag={refreshFlag}
    />
  );
}

function HabitsPage() {
  // Date utility functions to replace dateUtils.js dependency
  const formatDateKey = useCallback((date) => {
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
  }, []);

  const getDateFromOffset = useCallback((offset) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date;
  }, []);
  
  const toLocalDateString = useCallback((dateInput) => {
    const date = new Date(dateInput);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }, []);
  
  // Define utility functions first to avoid initialization issues
  const determinePeriod = useCallback(dateString => {
    // Convert to local time zone and extract hour
    const date = new Date(dateString);
    const hour = date.getHours();
    // Match the same criteria as CountdownPage.js
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon'; // 5 PM cutoff between afternoon and evening
    return 'evening';
  }, []);

  const convertColorNameToHex = useCallback(colorName => {
    const colorMap = {
      blue: '#007bff',
      green: '#28a745',
      red: '#dc3545',
      yellow: '#ffc107',
      purple: '#6f42c1',
      teal: '#17a2b8',
    };
    return colorMap[colorName] || '#007bff';
  }, []);
  
  // Component state
  const [activities, setActivities] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completions, setCompletions] = useState({});
  const [dateCompletions, setDateCompletions] = useState({});
  const [justToggled, setJustToggled] = useState({});
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [showEventForm, setShowEventForm] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [quickAddDay, setQuickAddDay] = useState(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [customDayOrders, setCustomDayOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('weeklyViewCustomOrders');
      return saved ? JSON.parse(saved) : {};
    } catch (err) {
      console.error('Error loading custom orders from localStorage:', err);
      return {};
    }
  });
  const [navigationMode, setNavigationMode] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [slideDirection, setSlideDirection] = useState('');

  const { t } = useTranslation('common');
  const { user } = useAuth();
  const userId = user?.userId || localStorage.getItem('userId');
  const weeklyViewRef = useRef(null);
  const todayColumnRef = useRef(null);
  const [todayColumnHeight, setTodayColumnHeight] = useState(0);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date();
  const todayIndex = today.getDay();

  useEffect(() => {
    const checkMobileView = () => setIsMobileView(window.innerWidth < 768);
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('weeklyViewCustomOrders', JSON.stringify(customDayOrders));
    } catch (err) {
      console.error('Error saving custom orders to localStorage:', err);
    }
  }, [customDayOrders]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedActivities, fetchedEvents] = await Promise.all([
        fetchActivities(userId),
        fetchCountdownEvents(userId),
      ]);

      console.log(`[HabitsPage] Loaded ${fetchedActivities.length} activities and ${fetchedEvents.length} countdown events`);

      setActivities(fetchedActivities);
      setEvents(fetchedEvents);

      setCustomDayOrders(prev => {
        const todayKey = todayIndex.toString();
        const todayActivities = prev[todayKey] || {};
        const updatedTodayActivities = {};
        fetchedActivities.forEach(activity => {
          if (!todayActivities[activity._id]) {
            updatedTodayActivities[activity._id] = {
              period: activity.period,
              order: activity.order || 0,
            };
          }
        });
        return {
          ...prev,
          [todayKey]: {
            ...todayActivities,
            ...updatedTodayActivities,
          },
        };
      });

      const startDate = getDateFromOffset(-7);
      const endDate = getDateFromOffset(7);
      const completionData = await extractCompletionData(fetchedActivities, startDate, endDate);
      setDateCompletions(completionData);

      const todayStr = formatDateKey(today);
      const todayCompletions = {};
      fetchedActivities.forEach(activity => {
        todayCompletions[activity._id] = activity.completions && activity.completions[todayStr] !== undefined ? !!activity.completions[todayStr] : false;
      });

      setCompletions(prev => ({ ...prev, ...todayCompletions }));
      localStorage.setItem('completions', JSON.stringify(todayCompletions));
      localStorage.setItem('completions_last_sync_date', todayStr);

      setRefreshFlag(prev => prev + 1);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, todayIndex]);

  useEffect(() => {
    document.title = `${t('navigation.habits')} | ${t('app.name')}`;
    loadData();

    const syncCompletions = () => {
      const todayStr = formatDateKey(new Date());
      const lastSyncDate = localStorage.getItem('completions_last_sync_date');
      if (lastSyncDate && lastSyncDate !== todayStr) {
        console.log(`[HabitsPage] Date changed from ${lastSyncDate} to ${todayStr}. Resetting completions.`);
        localStorage.setItem('completions', JSON.stringify({}));
        localStorage.setItem('completions_last_sync_date', todayStr);
        setCompletions({});
      }
    };

    syncCompletions();
    const syncInterval = setInterval(syncCompletions, 2000);

    const handleStorageChange = (e) => {
      if (e.key === 'completions') {
        syncCompletions();
      } else if (e.key === 'countdown_events_updated') {
        loadData();
      } else if (e.key === 'weeklyViewCustomOrders') {
        try {
          const savedOrders = localStorage.getItem('weeklyViewCustomOrders');
          if (savedOrders) {
            setCustomDayOrders(JSON.parse(savedOrders));
            setRefreshFlag(prev => prev + 1);
          }
        } catch (err) {
          console.error('Error loading custom orders from storage:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    if (todayColumnRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          setTodayColumnHeight(entry.contentRect.height);
        }
      });
      resizeObserver.observe(todayColumnRef.current);
      return () => resizeObserver.disconnect();
    }

    return () => {
      document.title = t('app.name');
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(syncInterval);
    };
  }, [loadData, t, todayIndex]);

  const extractCompletionData = async (activities, startDate, endDate) => {
    const completionData = {};
    activities.forEach(activity => {
      // Initialize an empty object for every activity to prevent undefined errors
      completionData[activity._id] = {};
      if (activity.completions) {
        Object.entries(activity.completions).forEach(([dateKey, completed]) => {
          completionData[activity._id][dateKey] = !!completed;
        });
      }
    });
    console.log('[HabitsPage] Extracted completion data:', completionData);
    return completionData;
  };

  const getFixedDayOffsets = useCallback(() => {
    const baseOffset = navigationMode * (isMobileView ? 1 : 4);
    return isMobileView ? [baseOffset] : [baseOffset, baseOffset + 1, baseOffset + 2, baseOffset + 3];
  }, [navigationMode, isMobileView]);

  const getFourDays = useCallback(() => {
    const dayOffsets = getFixedDayOffsets();
    return dayOffsets.map(offset => {
      let actualIndex = (todayIndex + offset) % 7;
      if (actualIndex < 0) actualIndex += 7;
      return actualIndex;
    });
  }, [getFixedDayOffsets, todayIndex]);

  const orderedDayIndices = useMemo(() => getFourDays(), [getFourDays]);

  const findDayOffset = useCallback(dayIndex => {
    const dayOffsets = getFixedDayOffsets();
    const currentViewIndices = dayOffsets.map(offset => {
      let actualIndex = (todayIndex + offset) % 7;
      if (actualIndex < 0) actualIndex += 7;
      return { actualIndex, offset };
    });
    const foundDay = currentViewIndices.find(day => day.actualIndex === dayIndex);
    if (foundDay) return foundDay.offset;
    for (let i = 0; i < 7; i++) {
      if (dayIndex === (todayIndex + i) % 7) return i;
      if (dayIndex === (todayIndex - i + 7) % 7) return -i;
    }
    return 0;
  }, [getFixedDayOffsets, todayIndex]);

  const formatEventForDisplay = useCallback(event => {
    const eventDate = new Date(event.date);
    const localDateStr = toLocalDateString(eventDate); // Normalize to local date
    
    // Use toLocaleTimeString for consistent timezone handling
    const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    const startTime = event.isAllDay ? 'All day' : eventDate.toLocaleTimeString(undefined, timeOptions);

    let endTime = startTime;
    if (event.hasDuration && event.endDate) {
      const endDate = new Date(event.endDate);
      endTime = endDate.toLocaleTimeString(undefined, timeOptions);
    }

    const isRecurringValue = event.isRecurring === false ? false : !!event.isRecurring;
    const recurringPatternValue = isRecurringValue ? event.recurrenceType : null;
    const dayOfWeek = eventDate.getDay();
    const displayId = isRecurringValue
      ? `${event._id}_${dayOfWeek}`
      : `${event._id}_${localDateStr}`; // Use normalized date string

    return {
      _id: event._id,
      title: event.name,
      startTime,
      endTime: event.isAllDay ? '' : endTime,
      day: dayOfWeek,
      period: event.period,
      order: event.order || 0,
      color: convertColorNameToHex(event.color || 'blue'),
      isRecurring: isRecurringValue,
      recurringPattern: recurringPatternValue,
      recurringDays: event.daysOfWeek,
      location: event.description || '',
      originalEvent: event,
      displayId,
      originalDate: event.date,
      eventDate: localDateStr, // Add normalized date for consistency
    };
  }, [convertColorNameToHex, toLocalDateString]);

  const getActivitiesForDay = useCallback(
    dayIndex => {
      const dayOffset = findDayOffset(dayIndex);
      const date = getDateFromOffset(dayOffset);
      if (dayOffset < 0) {
        return activities.filter(activity => activity.isHabit && shouldOccurOnDay(activity, dayIndex));
      }
      return activities.filter(activity => {
        if (!activity.isHabit) {
          if (activity.date) {
            const activityDate = new Date(activity.date);
            return formatDateKey(activityDate) === formatDateKey(date);
          }
          return dayIndex === todayIndex;
        }
        return shouldOccurOnDay(activity, dayIndex);
      });
    },
    [activities, findDayOffset, todayIndex]
  );

  const shouldOccurOnDay = useCallback((habit, dayIndex) => {
    if (!habit.repeatDays) return true;
    return habit.repeatDays.includes(dayIndex);
  }, []);

  const getActivitiesForDayAndPeriod = useCallback(
    (dayIndex, period) => {
      const dayKey = dayIndex.toString();
      const customOrders = customDayOrders[dayKey] || {};
      return getActivitiesForDay(dayIndex)
        .map(activity => {
          const customOrder = customOrders[activity._id];
          return customOrder ? { ...activity, period: customOrder.period, order: customOrder.order } : activity;
        })
        .filter(activity => activity.period === period)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    },
    [getActivitiesForDay, customDayOrders]
  );

  // Helper function to calculate the next occurrence date for recurring events
  const calculateNextOccurrenceDate = useCallback((event, targetDayIndex = null) => {
    if (!event.isRecurring) return new Date(event.date);
    
    const now = new Date();
    const origDate = new Date(event.date);
    
    // Handle weekly recurring events
    if (event.recurrenceType === 'weekly' && targetDayIndex !== null) {
      let nextDate = new Date(now);
      
      // Keep the original time
      nextDate.setHours(origDate.getHours());
      nextDate.setMinutes(origDate.getMinutes());
      nextDate.setSeconds(0);
      nextDate.setMilliseconds(0);
      
      // Calculate days to add to get to the target day of week
      const currentDayOfWeek = nextDate.getDay();
      let daysToAdd = targetDayIndex - currentDayOfWeek;
      if (daysToAdd < 0) {
        daysToAdd += 7; // Move to next week if target day is earlier in the week
      } else if (daysToAdd === 0) {
        // If today is the target day, check if the event time has already passed
        if (nextDate.getHours() > origDate.getHours() || 
            (nextDate.getHours() === origDate.getHours() && nextDate.getMinutes() > origDate.getMinutes())) {
          daysToAdd = 7; // Move to next week if the event time has already passed today
        }
      }
      
      nextDate.setDate(nextDate.getDate() + daysToAdd);
      return nextDate;
    }
    
    // Handle yearly recurring events
    if (event.recurrenceType === 'yearly') {
      const currentYear = now.getFullYear();
      const eventMonth = event.monthOfYear !== undefined ? event.monthOfYear : origDate.getMonth();
      const eventDay = event.dayOfMonth || origDate.getDate();
      
      // Create date for this year's occurrence
      let nextDate = new Date(currentYear, eventMonth, eventDay);
      nextDate.setHours(origDate.getHours());
      nextDate.setMinutes(origDate.getMinutes());
      nextDate.setSeconds(0);
      nextDate.setMilliseconds(0);
      
      // If this year's date is in the past, use next year
      if (nextDate < now) {
        nextDate.setFullYear(currentYear + 1);
      }
      
      return nextDate;
    }
    
    // Handle monthly recurring events
    if (event.recurrenceType === 'monthly') {
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const eventDay = event.dayOfMonth || origDate.getDate();
      
      // Create date for this month's occurrence
      let nextDate = new Date(currentYear, currentMonth, eventDay);
      nextDate.setHours(origDate.getHours());
      nextDate.setMinutes(origDate.getMinutes());
      nextDate.setSeconds(0);
      nextDate.setMilliseconds(0);
      
      // If this month's date is in the past, use next month
      if (nextDate < now) {
        nextDate.setMonth(currentMonth + 1);
      }
      
      return nextDate;
    }
    
    // Handle daily recurring events (fallback)
    if (event.recurrenceType === 'daily') {
      let nextDate = new Date(now);
      nextDate.setHours(origDate.getHours());
      nextDate.setMinutes(origDate.getMinutes());
      nextDate.setSeconds(0);
      nextDate.setMilliseconds(0);
      
      // If today's occurrence has passed, move to tomorrow
      if (nextDate < now) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
      
      return nextDate;
    }
    
    // Fallback: return original date
    return origDate;
  }, []);

  const getCalendarEventsForDayAndPeriod = useCallback(
    (dayIndex, period) => {
      const dayDate = getDateFromOffset(findDayOffset(dayIndex));
      const targetDateStr = toLocalDateString(dayDate);
      
      return events
        .filter(event => {
          if (event.isAllDay) return false;
          
          // For non-recurring events, check if they fall on the requested day
          if (!event.isRecurring || event.isRecurring === false) {
            const eventDateStr = toLocalDateString(event.date);
            if (eventDateStr !== targetDateStr) return false;
            
            // Create a date in local time
            const eventDate = new Date(event.date);
            // Get hour in local time zone
            const startHour = eventDate.getHours();
            // Period determination should match CountdownPage.js logic (hour < 12 = morning, hour < 17 = afternoon, else evening)
            if (startHour < 12) return period === 'morning';
            if (startHour < 17) return period === 'afternoon';
            return period === 'evening';
          }
          
          // For weekly recurring events
          if (event.recurrenceType === 'weekly') {
            if (!event.daysOfWeek?.includes(dayIndex)) return false;
            const origDate = new Date(event.date);
            const startHour = origDate.getHours();
            if (startHour < 12) return period === 'morning';
            if (startHour < 17) return period === 'afternoon';
            return period === 'evening';
          }
          
          // For yearly recurring events
          if (event.recurrenceType === 'yearly') {
            const origDate = new Date(event.date);
            const eventMonth = event.monthOfYear !== undefined ? event.monthOfYear : origDate.getMonth();
            const eventDay = event.dayOfMonth || origDate.getDate();
            if (dayDate.getMonth() === eventMonth && dayDate.getDate() === eventDay) {
              const startHour = origDate.getHours();
              if (startHour < 12) return period === 'morning';
              if (startHour < 17) return period === 'afternoon';
              return period === 'evening';
            }
            return false;
          }
          
          // For monthly recurring events
          if (event.recurrenceType === 'monthly') {
            const origDate = new Date(event.date);
            const eventDay = event.dayOfMonth || origDate.getDate();
            if (dayDate.getDate() === eventDay) {
              const startHour = origDate.getHours();
              if (startHour < 12) return period === 'morning';
              if (startHour < 17) return period === 'afternoon';
              return period === 'evening';
            }
            return false;
          }
          
          // For daily recurring events
          if (event.recurrenceType === 'daily') {
            const origDate = new Date(event.date);
            const startHour = origDate.getHours();
            if (startHour < 12) return period === 'morning';
            if (startHour < 17) return period === 'afternoon';
            return period === 'evening';
          }
          
          return false;
        })
        .map(event => {
          if (event.isRecurring) {
            const adjustedEvent = {...event};
            let needsAdjustment = false;
            
            if (event.recurrenceType === 'weekly') {
              if (event.daysOfWeek?.includes(dayIndex)) needsAdjustment = true;
            } else if (event.recurrenceType === 'yearly') {
              const origDate = new Date(event.date);
              const eventMonth = event.monthOfYear !== undefined ? event.monthOfYear : origDate.getMonth();
              const eventDay = event.dayOfMonth || origDate.getDate();
              if (dayDate.getMonth() === eventMonth && dayDate.getDate() === eventDay) needsAdjustment = true;
            } else if (event.recurrenceType === 'monthly') {
              const origDate = new Date(event.date);
              const eventDay = event.dayOfMonth || origDate.getDate();
              if (dayDate.getDate() === eventDay) needsAdjustment = true;
            } else if (event.recurrenceType === 'daily') {
              needsAdjustment = true;
            }
            
            if (needsAdjustment) {
              const specificDayIndex = event.recurrenceType === 'weekly' ? dayIndex : null;
              // Calculate next occurrence while preserving the original time
              const calculatedDate = calculateNextOccurrenceDate(event, specificDayIndex);
              
              // Keep the original time but set the date to match the current day we're viewing
              calculatedDate.setFullYear(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
              adjustedEvent.date = calculatedDate.toISOString();
              
              if (event.hasDuration && event.endDate) {
                const origEndDate = new Date(event.endDate);
                const origDate = new Date(event.date);
                const durationMs = origEndDate.getTime() - origDate.getTime();
                const newEndDate = new Date(calculatedDate.getTime() + durationMs);
                adjustedEvent.endDate = newEndDate.toISOString();
              }
              
              return formatEventForDisplay(adjustedEvent);
            }
          }
          
          return formatEventForDisplay(event);
        })
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    },
    [events, findDayOffset, getDateFromOffset, formatEventForDisplay, calculateNextOccurrenceDate, toLocalDateString]
  );

  const getAllDayEventsForDay = useCallback(
    (dayIndex) => {
      const dayDate = getDateFromOffset(findDayOffset(dayIndex));
      const targetDateStr = toLocalDateString(dayDate);

      return events
        .filter(event => {
          if (!event.isAllDay) return false;

          if (!event.isRecurring || event.isRecurring === false) {
            const eventDateStr = toLocalDateString(event.date);
            return eventDateStr === targetDateStr;
          }

          if (event.recurrenceType === 'weekly') {
            return event.daysOfWeek?.includes(dayIndex);
          }

          if (event.recurrenceType === 'yearly') {
            const origDate = new Date(event.date);
            const eventMonth = event.monthOfYear !== undefined ? event.monthOfYear : origDate.getMonth();
            const eventDay = event.dayOfMonth || origDate.getDate();
            return dayDate.getMonth() === eventMonth && dayDate.getDate() === eventDay;
          }

          if (event.recurrenceType === 'monthly') {
            const origDate = new Date(event.date);
            const eventDay = event.dayOfMonth || origDate.getDate();
            return dayDate.getDate() === eventDay;
          }

          if (event.recurrenceType === 'daily') {
            return true;
          }

          return false;
        })
        .map(event => {
          if (event.isRecurring) {
            const adjustedEvent = { ...event };
            let needsAdjustment = false;

            if (event.recurrenceType === 'weekly') {
              if (event.daysOfWeek?.includes(dayIndex)) needsAdjustment = true;
            } else if (event.recurrenceType === 'yearly') {
              const origDate = new Date(event.date);
              const eventMonth = event.monthOfYear !== undefined ? event.monthOfYear : origDate.getMonth();
              const eventDay = event.dayOfMonth || origDate.getDate();
              if (dayDate.getMonth() === eventMonth && dayDate.getDate() === eventDay) needsAdjustment = true;
            } else if (event.recurrenceType === 'monthly') {
              const origDate = new Date(event.date);
              const eventDay = event.dayOfMonth || origDate.getDate();
              if (dayDate.getDate() === eventDay) needsAdjustment = true;
            } else if (event.recurrenceType === 'daily') {
              needsAdjustment = true;
            }

            if (needsAdjustment) {
              const specificDayIndex = event.recurrenceType === 'weekly' ? dayIndex : null;
              // Calculate next occurrence while preserving the original time
              const calculatedDate = calculateNextOccurrenceDate(event, specificDayIndex);
              
              // Keep the original time but set the date to match the current day we're viewing
              calculatedDate.setFullYear(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
              adjustedEvent.date = calculatedDate.toISOString();
              
              if (event.hasDuration && event.endDate) {
                const origEndDate = new Date(event.endDate);
                const origDate = new Date(event.date);
                const durationMs = origEndDate.getTime() - origDate.getTime();
                const newEndDate = new Date(calculatedDate.getTime() + durationMs);
                adjustedEvent.endDate = newEndDate.toISOString();
              }

              return formatEventForDisplay(adjustedEvent);
            }
          }

          return formatEventForDisplay(event);
        });
    },
    [events, findDayOffset, getDateFromOffset, formatEventForDisplay, calculateNextOccurrenceDate, toLocalDateString]
  );

  const toggleHabitCompletion = useCallback(
    async habitId => {
      const todayStr = formatDateKey(new Date());
      const hasDbData = dateCompletions[habitId] && dateCompletions[habitId][todayStr] !== undefined;
      const currentStatus = hasDbData ? !!dateCompletions[habitId][todayStr] : !!completions[habitId];
      const newStatus = !currentStatus;

      try {
        setCompletions(prev => ({ ...prev, [habitId]: newStatus }));
        setJustToggled(prev => ({ ...prev, [habitId]: true }));
        setTimeout(() => setJustToggled(prev => ({ ...prev, [habitId]: false })), 500);

        localStorage.setItem('completions', JSON.stringify({ ...JSON.parse(localStorage.getItem('completions') || '{}'), [habitId]: newStatus }));
        localStorage.setItem('completions_last_sync_date', todayStr);

        const result = await toggleActivityCompletion(habitId, userId, new Date());
        if (result && result.completion) {
          const { activityId, date, completed } = result.completion;
          const dateKey = formatDateKey(new Date(date));
          setDateCompletions(prev => {
            const updated = { ...prev };
            if (!updated[activityId]) updated[activityId] = {};
            updated[activityId][dateKey] = completed;
            return updated;
          });
          setCompletions(prev => ({ ...prev, [activityId]: completed }));
        }
      } catch (err) {
        console.error('Error toggling habit completion:', err);
        setCompletions(prev => ({ ...prev, [habitId]: currentStatus }));
        localStorage.setItem('completions', JSON.stringify({ ...JSON.parse(localStorage.getItem('completions') || '{}'), [habitId]: currentStatus }));
        setJustToggled(prev => ({ ...prev, [habitId]: false }));
      }
    },
    [completions, dateCompletions, userId]
  );

  const updateActivityPeriod = useCallback(
    async (activityId, newPeriod, dayIndex) => {
      const activityToUpdate = activities.find(a => a._id === activityId);
      if (!activityToUpdate) return;

      if (dayIndex === todayIndex) {
        const updatedActivities = activities.map(activity =>
          activity._id === activityId ? { ...activity, period: newPeriod } : activity
        );
        setActivities(updatedActivities);

        try {
          const targetPeriodActivities = activities
            .filter(a => a.period === newPeriod && a._id !== activityId)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          const newOrder = targetPeriodActivities.length > 0 ? (targetPeriodActivities[targetPeriodActivities.length - 1].order || 0) + 10 : 10;

          await updateActivity(activityId, { ...activityToUpdate, period: newPeriod, order: newOrder });
        } catch (err) {
          console.error('Error updating activity in database:', err);
          setActivities(activities);
        }
      } else {
        setCustomDayOrders(prev => {
          const dayKey = dayIndex.toString();
          const dayActivities = prev[dayKey] || {};
          return {
            ...prev,
            [dayKey]: {
              ...dayActivities,
              [activityId]: {
                order: dayActivities[activityId]?.order || 0,
                period: newPeriod,
              },
            },
          };
        });
      }
    },
    [activities, todayIndex]
  );

  const handleReorderActivity = useCallback(
    async (activityId, targetPeriod, targetIndex, dayIndex) => {
      const activityToReorder = activities.find(a => a._id === activityId);
      if (!activityToReorder) return;

      const activitiesForDay = getActivitiesForDay(dayIndex);
      const periodItems = [];

      const periodEvents = getCalendarEventsForDayAndPeriod(dayIndex, targetPeriod);
      periodEvents.forEach(event => periodItems.push({ type: 'event', data: event }));

      const habitsInPeriod = activitiesForDay.filter(
        activity => activity._id !== activityId && (customDayOrders[dayIndex.toString()]?.[activity._id]?.period || activity.period) === targetPeriod
      );
      habitsInPeriod.forEach(habit => periodItems.push({ type: 'habit', data: habit }));

      periodItems.sort((a, b) => (a.data.order || 0) - (b.data.order || 0));

      let targetHabitOrder;
      if (targetIndex === 0) {
        const nextItem = periodItems[0];
        const nextOrder = nextItem ? (nextItem.data.order || 0) : 0;
        targetHabitOrder = nextOrder - 10;
      } else if (targetIndex >= periodItems.length) {
        const prevItem = periodItems[periodItems.length - 1];
        const prevOrder = prevItem ? (prevItem.data.order || 0) : 0;
        targetHabitOrder = prevOrder + 10;
      } else {
        const prevItem = periodItems[targetIndex - 1];
        const nextItem = periodItems[targetIndex];
        const prevOrder = prevItem ? (prevItem.data.order || 0) : -10;
        const nextOrder = nextItem ? (nextItem.data.order || 0) : prevOrder + 20;
        targetHabitOrder = prevOrder + (nextOrder - prevOrder) / 2;
      }

      if (isNaN(targetHabitOrder)) targetHabitOrder = 0;

      setCustomDayOrders(prev => {
        const dayKey = dayIndex.toString();
        const dayActivities = prev[dayKey] || {};
        return {
          ...prev,
          [dayKey]: {
            ...dayActivities,
            [activityId]: {
              period: targetPeriod,
              order: targetHabitOrder,
            },
          },
        };
      });

      if (dayIndex === todayIndex) {
        try {
          await updateActivity(activityId, { ...activityToReorder, period: targetPeriod, order: targetHabitOrder });
        } catch (err) {
          console.error('Error updating activity in database:', err);
          setCustomDayOrders(prev => {
            const dayKey = dayIndex.toString();
            const newDayActivities = { ...prev[dayKey] };
            delete newDayActivities[activityId];
            return { ...prev, [dayKey]: newDayActivities };
          });
        }
      }

      setTimeout(() => setRefreshFlag(prev => prev + 1), 50);
    },
    [activities, getActivitiesForDay, getCalendarEventsForDayAndPeriod, customDayOrders, todayIndex]
  );

  const handleQuickAddEvent = useCallback(dayIndex => {
    const today = new Date();
    
    const newEvent = {
      title: '',
      startTime: '6:00 PM',
      endTime: '7:00 PM',
      day: dayIndex.toString(),
      period: 'evening',
      location: '',
      color: '#007bff',
      isRecurring: false,
      hasDuration: true, // Set this to true since we have an endTime
      isAllDay: false,
      recurringPattern: null, // Explicitly set to null since it's not recurring
    };

    // Calculate days to add to reach the selected day, in the current week
    const daysToAdd = (dayIndex - today.getDay() + 7) % 7;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysToAdd);
    
    newEvent.eventDate = toLocalDateString(targetDate);
    console.log("Initial event data in handleQuickAddEvent:", newEvent); // Debug log

    setCurrentEvent(newEvent);
    setQuickAddDay(null);
    setShowEventForm(true);
  }, [toLocalDateString]);

  const handleEditEvent = useCallback(
    event => {
      if (!event) return;
      // Extract date from original event
      let eventDate = '';
      if (event.date) {
        eventDate = new Date(event.date).toISOString().split('T')[0];
      } else if (event.originalDate) {
        eventDate = new Date(event.originalDate).toISOString().split('T')[0];
      } else {
        eventDate = new Date().toISOString().split('T')[0];
      }
      
      // Extract time and determine period directly from the event date
      const eventDateObj = new Date(event.date || event.originalDate || new Date());
      const period = event.period || determinePeriod(eventDateObj.toISOString());
      
      // Get recurrence information
      let recurringPattern = event.recurringPattern || event.recurrenceType || 'weekly';
      let recurringDays = event.recurringDays || event.daysOfWeek || [event.day || todayIndex];
      let isAllDay = event.isAllDay || event.startTime === 'All day';
      
      // Set startTime correctly for all-day events
      let startTime = isAllDay ? 'All day' : (event.startTime || '9:00 AM');
      let endTime = isAllDay ? null : (event.endTime || event.startTime || '10:00 AM');
      
      const formattedEvent = {
        _id: event._id,
        title: event.title || event.name || '',
        startTime,
        endTime,
        day: typeof event.day === 'number' ? event.day : todayIndex,
        period: period,
        location: event.location || event.description || '',
        color: event.color?.startsWith('#') ? event.color : convertColorNameToHex(event.color || 'blue'),
        isRecurring: event.isRecurring || !!event.recurrenceType,
        recurringPattern: recurringPattern,
        recurringDays: recurringDays,
        // Also pass the original recurrence metadata
        dayOfMonth: event.dayOfMonth,
        monthOfYear: event.monthOfYear,
        originalEvent: event,
        userId,
        eventDate: eventDate,
        isAllDay,
        hasDuration: event.hasDuration !== undefined ? event.hasDuration : (!isAllDay),
      };
      setCurrentEvent(formattedEvent);
      setQuickAddDay(null);
      setShowEventForm(true);
    },
    [todayIndex, userId, determinePeriod, convertColorNameToHex]
  );

  const handleDeleteEvent = useCallback(
    async eventId => {
      if (window.confirm('Are you sure you want to delete this event?')) {
        try {
          await deleteCountdownEvent(eventId, userId);
          setEvents(prev => prev.filter(e => e._id !== eventId));
          localStorage.setItem('countdown_events_updated', Date.now().toString());
        } catch (err) {
          console.error('Error deleting event:', err);
          alert('Failed to delete event. Please try again.');
        }
      }
    },
    [userId]
  );

  const handleSaveEvent = useCallback(
    async event => {
      try {
        console.log("EventForm data before processing:", event);
        
        // Ensure day matches the eventDate (user may have changed date in the form)
        const dateObj = new Date(event.eventDate);
        const calculatedDay = dateObj.getDay();

        // Synchronize the day with the eventDate
        let updatedEvent = { ...event };
        if (parseInt(event.day) !== calculatedDay) {
          console.log(`Correcting day from ${event.day} to ${calculatedDay} to match eventDate`);
          updatedEvent = { ...event, day: calculatedDay.toString() };
        }

        const timeParts = updatedEvent.startTime.match(/(\d+):(\d+) (AM|PM)/);
        let eventDate, eventEndDate;

        // Get the date selected in the form (YYYY-MM-DD)
        const selectedDate = updatedEvent.eventDate;
        console.log("Using date directly from form:", selectedDate);
        
        // We already have dateObj from earlier in the function
        console.log("Using existing dateObj:", dateObj);

        if (timeParts) {
          // Get time components
          let hours = parseInt(timeParts[1]);
          const minutes = parseInt(timeParts[2]);
          const isPM = timeParts[3] === 'PM';
          if (isPM && hours !== 12) hours += 12;
          if (!isPM && hours === 12) hours = 0;
          
          // Format time as HH:MM
          const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
          
          // Combine selected date with time and add Z to indicate UTC time (YYYY-MM-DDThh:mm:00.000Z)
          eventDate = `${selectedDate}T${timeStr}:00.000Z`;
          
          console.log("Combined with time:", timeStr);
          console.log("Final event date:", eventDate);

          if (updatedEvent.endTime) {
            const endTimeParts = updatedEvent.endTime.match(/(\d+):(\d+) (AM|PM)/);
            if (endTimeParts) {
              let endHours = parseInt(endTimeParts[1]);
              const endMinutes = parseInt(endTimeParts[2]);
              const isEndPM = endTimeParts[3] === 'PM';
              if (isEndPM && endHours !== 12) endHours += 12;
              if (!isEndPM && endHours === 12) endHours = 0;
              
              // Format end time and combine with selected date
              const endTimeStr = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
              eventEndDate = `${selectedDate}T${endTimeStr}:00.000Z`;
            }
          }
        } else {
          // Handle case where there's no time parts (this shouldn't happen normally)
          console.warn("No time parts found in startTime:", updatedEvent.startTime);
          // Set a default time of noon to avoid issues
          eventDate = `${selectedDate}T12:00:00.000Z`;
        }

        if (updatedEvent.isAllDay || updatedEvent.startTime === 'All day') {
          // For all-day events, use the selected date at a fixed time (noon)
          // Don't use toUTCMidnightISOString as it can shift the date because of UTC conversion
          eventDate = `${selectedDate}T12:00:00.000Z`;
          console.log("All-day event date using selectedDate directly:", eventDate);
          eventEndDate = null;
        }

        // All date related operations use selectedDate (from form) and dateObj
        // adjustedDay is used for recurring events day selection
        let adjustedDay = updatedEvent.day;
        
        // Log final details for debugging
        console.log("Final date object:", dateObj);
        console.log("Final selected date:", selectedDate);
        console.log("Adjusted day:", adjustedDay);

        const countdownEvent = {
          name: updatedEvent.title,
          description: updatedEvent.location || '',
          notes: '',
          userId,
          date: eventDate, // This is correctly set to the formatted date+time string from the form
          color: updatedEvent.color === '#007bff' ? 'blue' : updatedEvent.color === '#28a745' ? 'green' : updatedEvent.color === '#dc3545' ? 'red' : updatedEvent.color === '#ffc107' ? 'yellow' : updatedEvent.color === '#6f42c1' ? 'purple' : updatedEvent.color === '#17a2b8' ? 'teal' : 'blue',
          isRecurring: updatedEvent.isRecurring || false,
          hasDuration: updatedEvent.hasDuration,
          endDate: updatedEvent.hasDuration ? eventEndDate : null,
          isAllDay: updatedEvent.startTime === 'All day',
          period: updatedEvent.isAllDay ? null : updatedEvent.period,
        };
        
        console.log("Final countdown event date being sent to API:", countdownEvent.date);

        if (updatedEvent.isRecurring) {
          countdownEvent.recurrenceType = updatedEvent.recurringPattern || 'weekly';
          countdownEvent.recurrenceInterval = 1;

          if (updatedEvent.recurringPattern === 'weekly') {
            countdownEvent.daysOfWeek = updatedEvent.recurringDays && updatedEvent.recurringDays.length > 0 ? updatedEvent.recurringDays : [parseInt(adjustedDay)];
            countdownEvent.dayOfMonth = null;
            countdownEvent.monthOfYear = null;
          } else if (updatedEvent.recurringPattern === 'yearly') {
            // Use the dateObj created at beginning of this function
            countdownEvent.dayOfMonth = dateObj.getDate();
            countdownEvent.monthOfYear = dateObj.getMonth();
            countdownEvent.daysOfWeek = null;
          } else if (updatedEvent.recurringPattern === 'monthly') {
            // Get the day of month from the selected date
            countdownEvent.dayOfMonth = dateObj.getDate();
            countdownEvent.monthOfYear = null;
            countdownEvent.daysOfWeek = null;
            console.log("Monthly event day of month:", countdownEvent.dayOfMonth);
          } else {
            countdownEvent.daysOfWeek = null;
            countdownEvent.dayOfMonth = null;
            countdownEvent.monthOfYear = null;
          }
        }

        const createdEvent = await createCountdownEvent(countdownEvent);
        setEvents(prev => [...prev, createdEvent]);
        localStorage.setItem('countdown_events_updated', Date.now().toString());
        setShowEventForm(false);
        setCurrentEvent(null);
        setQuickAddDay(null);
      } catch (err) {
        console.error('Error creating countdown event:', err);
        alert('Error creating event. Please try again.');
      }
    },
    [userId, determinePeriod]
  );

  const navigateBack = useCallback(() => {
    setSlideDirection('slide-right');
    setNavigationMode(prev => prev - 1);
    setTimeout(() => setSlideDirection(''), 300);
  }, []);

  const navigateForward = useCallback(() => {
    setSlideDirection('slide-left');
    setNavigationMode(prev => prev + 1);
    setTimeout(() => setSlideDirection(''), 300);
  }, []);

  const resetView = useCallback(() => {
    setNavigationMode(0);
  }, []);

  const DndBackend = isMobileView ? TouchBackend : HTML5Backend;
  const backendOptions = isMobileView ? { enableMouseEvents: true } : {};

  return (
    <PageWrapper>
      <style>{habitsStyles}</style>
      <DndProvider backend={DndBackend} options={backendOptions}>
        <div className="container mt-4 main-content" style={{ paddingBottom: '100px' }}>
          <div className="text-center mb-4">
            <h2>{t('habits.title')}</h2>
            <div
              className="description-box"
              style={{
                maxWidth: '800px',
                margin: '0 auto',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #dee2e6',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              }}
            >
              <p className="mb-2" style={{ fontWeight: '500' }}>
                {t('habits.description')}
              </p>
              <ul className="text-start mb-2" style={{ listStyleType: 'none', padding: '0 10px' }}>
                <li>
                  <i className="bi bi-check2-circle" style={{ color: '#28a745' }}></i> {t('habits.featurePoints.temporal')}
                </li>
                <li>
                  <i className="bi bi-arrows-move" style={{ color: '#007bff' }}></i> {t('habits.featurePoints.rearrange')}
                </li>
                <li>
                  <i className="bi bi-calendar-plus" style={{ color: '#6f42c1' }}></i> {t('habits.featurePoints.create')}
                </li>
                <li>
                  <i className="bi bi-layout-three-columns" style={{ color: '#fd7e14' }}></i> {t('habits.featurePoints.multiday')}
                </li>
              </ul>
              <p className="mb-0 small text-muted">{t('habits.navigationHelp')}</p>
            </div>
          </div>

          <div className="time-navigation-header-container">
            <NavigationHeader
              navigationMode={navigationMode}
              isMobileView={isMobileView}
              getFixedDayOffsets={getFixedDayOffsets}
              resetView={resetView}
              navigateBack={navigateBack}
              navigateForward={navigateForward}
            />
          </div>

          {loading ? (
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">{t('common.loading')}</span>
              </div>
            </div>
          ) : (
            <div className="weekly-view-container" style={{ overflow: 'visible' }}>
              <div
                className="weekly-view"
                style={{
                  minHeight: '600px',
                  overflow: 'visible',
                  width: '100%',
                  maxWidth: '1400px',
                  margin: '0 auto',
                }}
                ref={weeklyViewRef}
                onTouchStart={e => setTouchStartX(e.touches[0].clientX)}
                onTouchEnd={e => {
                  if (touchStartX) {
                    const touchEndX = e.changedTouches[0].clientX;
                    const diff = touchStartX - touchEndX;
                    if (Math.abs(diff) > 50) {
                      if (diff > 0) navigateForward();
                      else navigateBack();
                    }
                    setTouchStartX(null);
                  }
                }}
              >
                <div className={`four-day-view ${slideDirection}`}>
                  {orderedDayIndices.map((index, displayOrder) => {
                    const dayName = daysOfWeek[index];
                    const dayOffset = findDayOffset(index);
                    const isToday = index === todayIndex;
                    const isPast = dayOffset < 0;
                    const columnRef = isToday ? todayColumnRef : null;

                    const dayActivities = getActivitiesForDay(index);
                    const dayEvents = events.filter(event => {
                      const eventDate = new Date(event.date);
                      const dayOfWeek = eventDate.getDay();
                      if (event.isRecurring && event.recurrenceType === 'weekly' && event.daysOfWeek?.includes(index)) {
                        return true;
                      }
                      return dayOfWeek === index;
                    });

                    if (isPast) {
                      return (
                        <PastDayView
                          key={`day-${index}`}
                          dayIndex={index}
                          dayName={dayName}
                          activities={dayActivities}
                          events={dayEvents}
                          completions={completions}
                          dateCompletions={dateCompletions}
                          findDayOffset={findDayOffset}
                          getActivitiesForDayAndPeriod={getActivitiesForDayAndPeriod}
                          getCalendarEventsForDayAndPeriod={getCalendarEventsForDayAndPeriod}
                          getAllDayEventsForDay={getAllDayEventsForDay}
                        />
                      );
                    } else if (isToday) {
                      return (
                        <TodayView
                          key={`day-${index}-refresh-${refreshFlag}`}
                          dayIndex={index}
                          dayName={dayName}
                          activities={dayActivities}
                          events={dayEvents}
                          completions={completions}
                          dateCompletions={dateCompletions}
                          justToggled={justToggled}
                          isMobileView={isMobileView}
                          columnRef={columnRef}
                          columnHeight={todayColumnHeight}
                          refreshFlag={refreshFlag}
                          findDayOffset={findDayOffset}
                          getActivitiesForDayAndPeriod={getActivitiesForDayAndPeriod}
                          getCalendarEventsForDayAndPeriod={getCalendarEventsForDayAndPeriod}
                          getAllDayEventsForDay={getAllDayEventsForDay}
                          updateActivityPeriod={updateActivityPeriod}
                          handleReorderActivity={handleReorderActivity}
                          toggleHabitCompletion={toggleHabitCompletion}
                          handleQuickAddEvent={handleQuickAddEvent}
                          handleEditEvent={handleEditEvent}
                          handleDeleteEvent={handleDeleteEvent}
                        />
                      );
                    } else {
                      return (
                        <FutureDayView
                          key={`day-${index}-refresh-${refreshFlag}`}
                          dayIndex={index}
                          dayName={dayName}
                          activities={dayActivities}
                          events={dayEvents}
                          isMobileView={isMobileView}
                          refreshFlag={refreshFlag}
                          findDayOffset={findDayOffset}
                          getActivitiesForDayAndPeriod={getActivitiesForDayAndPeriod}
                          getCalendarEventsForDayAndPeriod={getCalendarEventsForDayAndPeriod}
                          getAllDayEventsForDay={getAllDayEventsForDay}
                          updateActivityPeriod={updateActivityPeriod}
                          handleReorderActivity={handleReorderActivity}
                          handleQuickAddEvent={handleQuickAddEvent}
                          handleEditEvent={handleEditEvent}
                          handleDeleteEvent={handleDeleteEvent}
                        />
                      );
                    }
                  })}
                </div>
              </div>
            </div>
          )}

          <EventFormModal
            showEventForm={showEventForm}
            currentEvent={currentEvent}
            quickAddDay={quickAddDay}
            todayIndex={todayIndex}
            handleSaveEvent={handleSaveEvent}
            handleDeleteEvent={handleDeleteEvent}
            closeForm={() => {
              setShowEventForm(false);
              setCurrentEvent(null);
              setQuickAddDay(null);
            }}
          />
        </div>
      </DndProvider>
    </PageWrapper>
  );
}

export default HabitsPage;