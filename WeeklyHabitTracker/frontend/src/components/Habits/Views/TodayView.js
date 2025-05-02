// TodayView.js - View for today with drag-and-drop functionality
import React, { useMemo } from 'react';
import DayColumn from '../Containers/DayColumn';
import TimePeriod from '../Containers/TimePeriod';
import AllDayEvents from '../Containers/AllDayEvents';
import DroppableTimeSlot from '../DragAndDrop/DroppableTimeSlot';

const TodayView = ({ 
  dayIndex,
  dayName, 
  date,
  activities, 
  events,
  completions,
  justToggled,
  isMobileView,
  getActivitiesForDayAndPeriod,
  getEventsForDayAndPeriod,
  getAllDayEventsForDay,
  updateActivityPeriod,
  handleReorderActivity,
  handleToggleCompletion,
  handleAddEvent,
  handleEditEvent,
  handleDeleteEvent,
  refreshFlag
}) => {
  console.log(`TodayView rendering for day ${dayIndex}, activities: ${activities.length}, events: ${events.length}`);
  
  // Group activities and events by time period using helper functions
  const morningItems = useMemo(() => {
    console.log(`Getting morning activities for day ${dayIndex}`);
    return getActivitiesForDayAndPeriod(dayIndex, 'morning');
  }, [dayIndex, getActivitiesForDayAndPeriod, refreshFlag]);
  
  const afternoonItems = useMemo(() => {
    console.log(`Getting afternoon activities for day ${dayIndex}`);
    return getActivitiesForDayAndPeriod(dayIndex, 'afternoon');
  }, [dayIndex, getActivitiesForDayAndPeriod, refreshFlag]);
  
  const eveningItems = useMemo(() => {
    console.log(`Getting evening activities for day ${dayIndex}`);
    return getActivitiesForDayAndPeriod(dayIndex, 'evening');
  }, [dayIndex, getActivitiesForDayAndPeriod, refreshFlag]);
  
  // Get events by period using helper functions
  const morningEvents = useMemo(() => {
    return getEventsForDayAndPeriod(dayIndex, 'morning');
  }, [dayIndex, getEventsForDayAndPeriod, refreshFlag]);
  
  const afternoonEvents = useMemo(() => {
    return getEventsForDayAndPeriod(dayIndex, 'afternoon');
  }, [dayIndex, getEventsForDayAndPeriod, refreshFlag]);
  
  const eveningEvents = useMemo(() => {
    return getEventsForDayAndPeriod(dayIndex, 'evening');
  }, [dayIndex, getEventsForDayAndPeriod, refreshFlag]);
  
  // All-day events
  const allDayEvents = useMemo(() => {
    return getAllDayEventsForDay(dayIndex);
  }, [dayIndex, getAllDayEventsForDay, refreshFlag]);
  
  return (
    <DayColumn 
      dayIndex={dayIndex}
      dayName={dayName}
      date={date}
      isToday={true}
      onAddEvent={handleAddEvent}
    >
      <AllDayEvents events={allDayEvents} />
      
      <DroppableTimeSlot 
        period="morning" 
        onDrop={(itemId) => updateActivityPeriod(itemId, "morning", dayIndex)}
      >
        <TimePeriod 
          title="MORNING"
          period="morning"
          dayIndex={dayIndex}
          activities={morningItems}
          events={morningEvents}
          isToday={true}
          completions={completions}
          justToggled={justToggled}
          updateActivityPeriod={updateActivityPeriod}
          handleReorderActivity={handleReorderActivity}
          toggleHabitCompletion={handleToggleCompletion}
          onEditEvent={handleEditEvent}
          onDeleteEvent={handleDeleteEvent}
          isMobileView={isMobileView}
          refreshFlag={refreshFlag}
        />
      </DroppableTimeSlot>
      
      <DroppableTimeSlot 
        period="afternoon"
        onDrop={(itemId) => updateActivityPeriod(itemId, "afternoon", dayIndex)}
      >
        <TimePeriod 
          title="AFTERNOON"
          period="afternoon"
          dayIndex={dayIndex}
          activities={afternoonItems}
          events={afternoonEvents}
          isToday={true}
          completions={completions}
          justToggled={justToggled}
          updateActivityPeriod={updateActivityPeriod}
          handleReorderActivity={handleReorderActivity}
          toggleHabitCompletion={handleToggleCompletion}
          onEditEvent={handleEditEvent}
          onDeleteEvent={handleDeleteEvent}
          isMobileView={isMobileView}
          refreshFlag={refreshFlag}
        />
      </DroppableTimeSlot>
      
      <DroppableTimeSlot 
        period="evening"
        onDrop={(itemId) => updateActivityPeriod(itemId, "evening", dayIndex)}
      >
        <TimePeriod 
          title="EVENING"
          period="evening"
          dayIndex={dayIndex}
          activities={eveningItems}
          events={eveningEvents}
          isToday={true}
          completions={completions}
          justToggled={justToggled}
          updateActivityPeriod={updateActivityPeriod}
          handleReorderActivity={handleReorderActivity}
          toggleHabitCompletion={handleToggleCompletion}
          onEditEvent={handleEditEvent}
          onDeleteEvent={handleDeleteEvent}
          isMobileView={isMobileView}
          refreshFlag={refreshFlag}
        />
      </DroppableTimeSlot>
    </DayColumn>
  );
};

export default TodayView;