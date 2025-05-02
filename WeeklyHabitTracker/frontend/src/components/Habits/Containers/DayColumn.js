// src/components/Habits/Containers/DayColumn.js
import React from 'react';
import '../Styles/dayColumn.css';
import TimePeriod from './TimePeriod';
import AllDayEvents from './AllDayEvents';
import { formatDateDisplay } from '../utils/dateUtils';

const DayColumn = ({
  dayIndex,
  dayName,
  date,
  isPast = false,
  isToday = false,
  isFuture = false,
  onAddEvent,
  getActivitiesForDayAndPeriod,
  getEventsForDayAndPeriod,
  getAllDayEventsForDay,
  updateActivityPeriod,
  handleReorderActivity,
  toggleHabitCompletion,
  handleEditEvent,
  handleDeleteEvent,
  completions = {},
  dateCompletions = {},
  justToggled = {},
  isMobileView = false,
  refreshFlag = 0
}) => {
  // Get all-day events
  const allDayEvents = getAllDayEventsForDay ? getAllDayEventsForDay(dayIndex) : [];
  
  // Get activities and events for each time period
  const morningActivities = getActivitiesForDayAndPeriod ? 
    getActivitiesForDayAndPeriod(dayIndex, 'morning') : [];
  const afternoonActivities = getActivitiesForDayAndPeriod ? 
    getActivitiesForDayAndPeriod(dayIndex, 'afternoon') : [];
  const eveningActivities = getActivitiesForDayAndPeriod ? 
    getActivitiesForDayAndPeriod(dayIndex, 'evening') : [];
  
  const morningEvents = getEventsForDayAndPeriod ? 
    getEventsForDayAndPeriod(dayIndex, 'morning') : [];
  const afternoonEvents = getEventsForDayAndPeriod ? 
    getEventsForDayAndPeriod(dayIndex, 'afternoon') : [];
  const eveningEvents = getEventsForDayAndPeriod ? 
    getEventsForDayAndPeriod(dayIndex, 'evening') : [];
  
  // Column styling
  const columnClassName = `day-column ${isToday ? 'today' : ''} ${isPast ? 'past-day' : ''}`;
  
  // Get formatted date
  const formattedDate = date ? formatDateDisplay(date) : '';
  
  return (
    <div className={columnClassName}>
      <div className={`day-header ${isToday ? 'today-header' : ''}`}>
        <div className="day-name-container">
          <div className="day-name">
            {dayName}
            {isToday && <span className="today-badge">Today</span>}
          </div>
          <div className="day-date">{formattedDate}</div>
        </div>
        
        {/* Only show add event button for today and future */}
        {(isToday || isFuture) && (
          <button 
            className="add-event-btn"
            onClick={() => onAddEvent && onAddEvent(dayIndex)}
          >
            + Event
          </button>
        )}
      </div>
      
      <div className="day-content">
        {/* All-day events section */}
        {allDayEvents && allDayEvents.length > 0 && (
          <AllDayEvents 
            events={allDayEvents} 
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
          />
        )}
        
        {/* Morning section */}
        <TimePeriod
          title="MORNING"
          period="morning"
          dayIndex={dayIndex}
          activities={morningActivities}
          events={morningEvents}
          isPast={isPast}
          isToday={isToday}
          isFuture={isFuture}
          completions={completions}
          dateCompletions={dateCompletions}
          justToggled={justToggled}
          updateActivityPeriod={updateActivityPeriod}
          handleReorderActivity={handleReorderActivity}
          toggleHabitCompletion={toggleHabitCompletion}
          onEditEvent={handleEditEvent}
          onDeleteEvent={handleDeleteEvent}
          isMobileView={isMobileView}
          refreshFlag={refreshFlag}
        />
        
        {/* Afternoon section */}
        <TimePeriod
          title="AFTERNOON"
          period="afternoon"
          dayIndex={dayIndex}
          activities={afternoonActivities}
          events={afternoonEvents}
          isPast={isPast}
          isToday={isToday}
          isFuture={isFuture}
          completions={completions}
          dateCompletions={dateCompletions}
          justToggled={justToggled}
          updateActivityPeriod={updateActivityPeriod}
          handleReorderActivity={handleReorderActivity}
          toggleHabitCompletion={toggleHabitCompletion}
          onEditEvent={handleEditEvent}
          onDeleteEvent={handleDeleteEvent}
          isMobileView={isMobileView}
          refreshFlag={refreshFlag}
        />
        
        {/* Evening section */}
        <TimePeriod
          title="EVENING"
          period="evening"
          dayIndex={dayIndex}
          activities={eveningActivities}
          events={eveningEvents}
          isPast={isPast}
          isToday={isToday}
          isFuture={isFuture}
          completions={completions}
          dateCompletions={dateCompletions}
          justToggled={justToggled}
          updateActivityPeriod={updateActivityPeriod}
          handleReorderActivity={handleReorderActivity}
          toggleHabitCompletion={toggleHabitCompletion}
          onEditEvent={handleEditEvent}
          onDeleteEvent={handleDeleteEvent}
          isMobileView={isMobileView}
          refreshFlag={refreshFlag}
        />
        
        {/* Empty state */}
        {morningActivities.length === 0 && 
         afternoonActivities.length === 0 &&
         eveningActivities.length === 0 && 
         morningEvents.length === 0 &&
         afternoonEvents.length === 0 &&
         eveningEvents.length === 0 && 
         allDayEvents.length === 0 && (
          <div className="no-activities">
            <div style={{ marginBottom: '10px' }}>No activities or events</div>
            
            {process.env.NODE_ENV === 'development' && (
              <div style={{ 
                fontSize: '10px', 
                color: '#999', 
                backgroundColor: '#f5f5f5', 
                padding: '8px', 
                borderRadius: '4px',
                marginTop: '10px'
              }}>
                <div>Debug Info:</div>
                <div>Day Index: {dayIndex}</div>
                <div>Day: {dayName}</div>
                <div>Date: {formattedDate}</div>
                <div>Is Today: {isToday ? 'Yes' : 'No'}</div>
                <div>Is Past: {isPast ? 'Yes' : 'No'}</div>
                <div>Is Future: {isFuture ? 'Yes' : 'No'}</div>
                <div style={{ marginTop: '5px' }}>
                  <div>Activity Counts:</div>
                  <div>Morning: {morningActivities.length}</div>
                  <div>Afternoon: {afternoonActivities.length}</div>
                  <div>Evening: {eveningActivities.length}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DayColumn;