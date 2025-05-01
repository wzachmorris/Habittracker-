//frontend/src/components/Habits/DayColumn.js

import React from 'react';
import TimePeriod from './TimePeriod';
import { formatDateDisplay, getDateFromOffset } from './utils/dateUtils';

/**
 * Day Column Component
 */

const DayColumn = ({
  dayIndex, 
  dayName, 
  findDayOffset,
  getActivitiesForDayAndPeriod,
  getCalendarEventsForDayAndPeriod,
  getAllDayEventsForDay, // New function to get all-day events
  updateActivityPeriod,
  handleReorderActivity,
  toggleHabitCompletion,
  handleQuickAddEvent,
  handleEditEvent,
  handleDeleteEvent,
  completions,
  dateCompletions,
  justToggled,
  isMobileView,
  columnRef,
  columnHeight,
  refreshFlag
}) => {
  const today = new Date();
  const dayOffset = findDayOffset(dayIndex);
  const date = getDateFromOffset(dayOffset);
  
  // Check if this is today by comparing the date string
  const isToday = date.toDateString() === today.toDateString();
  
  // Check if this is a past day
  const isPastDay = date < today && date.toDateString() !== today.toDateString();
  
  // Format date for display
  const formattedDate = formatDateDisplay(date);
  
  // Column style with dynamic height
  const columnStyle = {
    flex: '1 0 0', // Grow equally, don't shrink, 0 basis
    transition: 'all 0.3s ease',
    zIndex: isToday ? 2 : 1,
    height: 'auto', // Allow each column to expand as needed
    minHeight: '600px',
    minWidth: '220px',
    maxWidth: '350px',
    overflow: 'visible' // Ensure content doesn't get cut off
  };
  
  // Get activities and events for each time period
  const morningActivities = getActivitiesForDayAndPeriod(dayIndex, 'morning');
  const afternoonActivities = getActivitiesForDayAndPeriod(dayIndex, 'afternoon');
  const eveningActivities = getActivitiesForDayAndPeriod(dayIndex, 'evening');
  
  const morningEvents = getCalendarEventsForDayAndPeriod(dayIndex, 'morning');
  const afternoonEvents = getCalendarEventsForDayAndPeriod(dayIndex, 'afternoon');
  const eveningEvents = getCalendarEventsForDayAndPeriod(dayIndex, 'evening');
  
  // Get all-day events
  const allDayEvents = getAllDayEventsForDay(dayIndex);
  
  return (
    <div 
      className={`day-column ${isToday ? 'today' : ''} ${isPastDay ? 'past-day' : ''} expanded`}
      style={{...columnStyle}}
      ref={columnRef}
    >
      <div className={`day-header ${isToday ? 'today-header' : ''} ${isPastDay ? 'past-day-header' : ''}`} style={{
        backgroundColor: isToday ? '#28a745' : isPastDay ? '#f2f2f2' : '#f8f9fa',
        color: isToday ? 'white' : '#212529',
        padding: isToday ? '10px 8px' : '8px 6px',
        borderBottom: '1px solid #dee2e6',
        opacity: isPastDay ? 0.9 : 1
      }}>
        <div className="d-flex justify-content-between align-items-center mb-1">
          <div className="day-name" style={{
            fontWeight: isToday ? '600' : '500',
            fontSize: isToday ? '1.1rem' : '0.9rem',
            display: 'flex',
            alignItems: 'center'
          }}>
            {isToday ? (
              <span className="today-badge" style={{ 
                backgroundColor: 'white', 
                color: '#28a745', 
                fontSize: '0.9rem',
                padding: '3px 10px',
                marginLeft: '0',
                fontWeight: '600'
              }}>Today</span>
            ) : dayOffset === 1 ? (
              <>Tomorrow <span className="offset-badge" style={{ backgroundColor: '#e9ecef', color: '#495057', padding: '2px 5px', fontSize: '0.7rem', borderRadius: '3px' }}>+1</span></>
            ) : dayOffset === -1 ? (
              <>Yesterday <span className="offset-badge" style={{ backgroundColor: '#e9ecef', color: '#495057', padding: '2px 5px', fontSize: '0.7rem', borderRadius: '3px' }}>-1</span></>
            ) : (
              <>{dayName} <span className="offset-badge" style={{ backgroundColor: '#e9ecef', color: '#495057', padding: '2px 5px', fontSize: '0.7rem', borderRadius: '3px' }}>{dayOffset > 0 ? `+${dayOffset}` : dayOffset}</span></>
            )}
          </div>
          
          {/* Add event button - only for today or future */}
          {!isPastDay && (
            <button 
              className={`btn ${isToday ? 'btn-light' : 'btn-outline-secondary'} add-event-btn`}
              title="Add Event"
              style={{
                fontWeight: '500',
                padding: isToday ? '4px 12px' : '3px 8px',
                boxShadow: isToday ? '0 2px 4px rgba(0, 0, 0, 0.15)' : 'none',
                border: isToday ? '1px solid white' : '1px solid #6c757d',
                fontSize: isToday ? '0.8rem' : '0.7rem',
                backgroundColor: isToday ? 'white' : 'transparent',
                color: isToday ? '#28a745' : '#6c757d'
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleQuickAddEvent(dayIndex);
              }}
            >
              {isToday ? '+ Add Event' : '+ Event'}
            </button>
          )}
        </div>
        <div className="day-date" style={{
          fontSize: '0.75rem',
          opacity: 0.85,
          fontWeight: isToday ? '500' : 'normal',
          color: isToday ? 'rgba(255, 255, 255, 0.9)' : '#6c757d'
        }}>{formattedDate}</div>
      </div>
      
      <div className="day-content">
        {/* Time periods */}
        <div className="time-slotted-view" style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          height: 'auto',
          minHeight: '500px'
        }}>
          {/* All Day Events section */}
          {allDayEvents.length > 0 && (
            <div className="all-day-events" style={{
              borderBottom: '1px solid #e0e0e0',
              marginBottom: '8px',
              paddingBottom: '8px',
              backgroundColor: 'rgba(240, 240, 245, 0.3)'
            }}>
              <div className="period-header" style={{
                padding: '6px 10px',
                background: 'rgba(0, 123, 255, 0.08)',
                borderRadius: '4px 4px 0 0',
                fontWeight: '500',
                fontSize: '0.85rem',
                color: '#495057'
              }}>
                All Day
              </div>
              <div className="all-day-events-list" style={{ padding: '6px 6px 2px' }}>
                {allDayEvents.map(event => (
                  <div 
                    key={`all-day-${event.displayId || event._id}`}
                    className="calendar-event-card" 
                    style={{
                      backgroundColor: event.color ? `${event.color}10` : '#f8f9fa',
                      borderLeft: `3px solid ${event.color || '#6c757d'}`,
                      borderRadius: '4px',
                      padding: '6px 8px',
                      margin: '0 0 4px 0',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s',
                      position: 'relative'
                    }}
                    onClick={(e) => {
                      // Prevent event click when delete button is clicked
                      if (e.target.classList.contains('event-delete-btn')) {
                        return;
                      }
                      handleEditEvent(event);
                    }}
                  >
                    <button 
                      className="event-delete-btn" 
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent event bubble to card click
                        handleDeleteEvent(event._id);
                      }}
                      style={{
                        position: 'absolute',
                        top: '3px',
                        right: '3px',
                        background: 'none',
                        border: 'none',
                        fontSize: '14px',
                        color: '#dc3545',
                        padding: '2px 6px',
                        cursor: 'pointer',
                        opacity: 0.7,
                        zIndex: 2
                      }}
                      title="Delete event"
                    >
                      ×
                    </button>
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="event-title text-truncate" style={{ fontWeight: '500', maxWidth: '150px' }}>
                        {event.title}
                      </div>
                    </div>
                    <div className="d-flex align-items-center mt-1" style={{ fontSize: '0.65rem', color: '#666' }}>
                      {event.recurringPattern === 'yearly' && (
                        <span className="badge bg-success bg-opacity-10 text-success me-1 d-flex align-items-center">
                          Yearly
                          {event.isRecurring && (
                            <span style={{ 
                              display: 'inline-block',
                              marginLeft: '3px',
                              fontSize: '0.8rem'
                            }}>↻</span>
                          )}
                        </span>
                      )}
                      {event.recurringPattern === 'monthly' && (
                        <span className="badge bg-info bg-opacity-10 text-info me-1 d-flex align-items-center">
                          Monthly
                          {event.isRecurring && (
                            <span style={{ 
                              display: 'inline-block',
                              marginLeft: '3px',
                              fontSize: '0.8rem'
                            }}>↻</span>
                          )}
                        </span>
                      )}
                      {event.recurringPattern === 'weekly' && (
                        <span className="badge bg-primary bg-opacity-10 text-primary me-1 d-flex align-items-center">
                          Weekly
                          {event.isRecurring && (
                            <span style={{ 
                              display: 'inline-block',
                              marginLeft: '3px',
                              fontSize: '0.8rem'
                            }}>↻</span>
                          )}
                        </span>
                      )}
                      {event.recurringPattern === 'daily' && (
                        <span className="badge bg-warning bg-opacity-10 text-warning me-1 d-flex align-items-center">
                          Daily
                          {event.isRecurring && (
                            <span style={{ 
                              display: 'inline-block',
                              marginLeft: '3px',
                              fontSize: '0.8rem'
                            }}>↻</span>
                          )}
                        </span>
                      )}
                      
                      {/* If it's not recurring but it's an event, show a placeholder */}
                      {(!event.recurringPattern || event.recurringPattern === null) && 
                       (!event.isRecurring || event.isRecurring === false) && (
                        <span className="badge bg-secondary bg-opacity-10 text-secondary me-1">
                          Event
                        </span>
                      )}
                      
                      {event.source === 'countdown' && (
                        <span className="badge bg-purple bg-opacity-10 text-purple ms-1" style={{fontSize: '0.65rem'}}>
                          Countdown
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Morning section */}
          <TimePeriod
            period="morning"
            title="Morning"
            dayIndex={dayIndex}
            activities={morningActivities}
            calendarEvents={morningEvents}
            findDayOffset={findDayOffset}
            updateActivityPeriod={updateActivityPeriod}
            handleReorderActivity={handleReorderActivity}
            toggleHabitCompletion={toggleHabitCompletion}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
            completions={completions}
            dateCompletions={dateCompletions}
            justToggled={justToggled}
            isMobileView={isMobileView}
            refreshFlag={refreshFlag}
          />
          
          {/* Afternoon section */}
          <TimePeriod 
            period="afternoon" 
            title="Afternoon" 
            dayIndex={dayIndex}
            activities={afternoonActivities}
            calendarEvents={afternoonEvents}
            updateActivityPeriod={updateActivityPeriod}
            handleReorderActivity={handleReorderActivity}
            toggleHabitCompletion={toggleHabitCompletion}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
            findDayOffset={findDayOffset}
            completions={completions}
            dateCompletions={dateCompletions}
            justToggled={justToggled}
            isMobileView={isMobileView}
            refreshFlag={refreshFlag}
          />
          
          {/* Evening section */}
          <TimePeriod 
            period="evening" 
            title="Evening" 
            dayIndex={dayIndex}
            activities={eveningActivities}
            calendarEvents={eveningEvents}
            findDayOffset={findDayOffset}
            updateActivityPeriod={updateActivityPeriod}
            handleReorderActivity={handleReorderActivity}
            toggleHabitCompletion={toggleHabitCompletion}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
            completions={completions}
            dateCompletions={dateCompletions}
            justToggled={justToggled}
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
            <div className="no-activities" style={{
              padding: '20px',
              textAlign: 'center',
              color: '#6c757d',
              fontStyle: 'italic'
            }}>
              No activities
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DayColumn;