//frontend/src/components/Habits/CalendarEvent.js

import React from 'react';

/**
 * Calendar Event Component
 */
const CalendarEvent = ({ event, onEditEvent, onDeleteEvent }) => {
  // Determine if this is a countdown event that's been converted
  const isCountdownEvent = event.source === 'countdown';
  
  // Handle click to edit event - now disabled to prevent redirection
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('CalendarEvent clicked - editing disabled to prevent redirection');
    // Editing functionality is commented out to prevent redirection
    // if (onEditEvent) {
    //   onEditEvent(event);
    // }
  };
  
  // Format recurring pattern description based on source and pattern
  const getRecurrenceDescription = () => {
    // If isRecurring is explicitly false, don't show any recurrence description
    if (event.isRecurring === false) return '';
    
    if (isCountdownEvent) {
      // Use the appropriate description for countdown events
      const pattern = event.recurringPattern;
      if (pattern === 'daily') return 'Repeats daily';
      if (pattern === 'weekly') return 'Repeats weekly';
      if (pattern === 'monthly') return 'Repeats monthly';
      if (pattern === 'yearly') return 'Repeats yearly';
      return 'Recurring event';
    } else {
      // Default for regular calendar events
      return event.recurringPattern === 'daily' ? 'Repeats daily' : 
             event.recurringPattern === 'weekly' ? 'Repeats weekly' : 
             'Repeats monthly';
    }
  };
  
  return (
    <div 
      className={`calendar-event calendar-source-${event.source}`}
      title={`${event.title} (${event.startTime} - ${event.endTime}) - Click delete button to remove`}
      onClick={handleClick}
      style={{
        cursor: 'default', // Changed to default cursor since editing is disabled
        borderLeft: event.color ? `3px solid ${event.color}` : undefined,
        backgroundColor: event.color ? `${event.color}10` : undefined,
        marginBottom: '12px', // Ensure consistent spacing
        padding: '10px 12px',
        minHeight: '65px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        position: 'relative'
      }}
    >
      {onDeleteEvent && (
        <button 
          className="event-delete-btn" 
          onClick={(e) => {
            e.stopPropagation(); // Prevent event bubble to card click
            onDeleteEvent(event._id);
          }}
          style={{
            position: 'absolute',
            top: '5px',
            right: '5px',
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
      )}
      <div className="calendar-event-title" style={{ 
        fontWeight: '500',
        marginBottom: '4px'
      }}>
        {event.title}
        {isCountdownEvent && (
          <span className="badge bg-info bg-opacity-10 text-info ms-2" style={{fontSize: '0.65rem'}}>
            Countdown
          </span>
        )}
      </div>
      <div className="calendar-event-time" style={{
        fontSize: '0.75rem',
        color: '#666'
      }}>
        {event.startTime}
        {event.endTime && event.startTime !== event.endTime && ` - ${event.endTime}`}
        {event.location && (
          <span className="calendar-event-location ms-2">
            | {event.location}
          </span>
        )}
      </div>
      {event.isRecurring && event.isRecurring !== false && (
        <div className="calendar-event-recurring" style={{ 
          fontSize: '0.7rem', 
          opacity: 0.7,
          marginTop: '4px',
          fontStyle: 'italic'
        }}>
          {getRecurrenceDescription()}
        </div>
      )}
    </div>
  );
};

export default CalendarEvent;