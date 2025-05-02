// AllDayEvents.js - Container for all-day events
import React, { useEffect } from 'react';
import CalendarEvent from '../UI/CalendarEvent';

const AllDayEvents = ({ 
  events, 
  onEditEvent, 
  onDeleteEvent 
}) => {
  // Debug logging when events change
  useEffect(() => {
    console.log(`AllDayEvents component received ${events?.length || 0} events:`, events);
  }, [events]);
  
  if (!events || events.length === 0) {
    return null;
  }

  return (
    <div className="all-day-events">
      <div className="all-day-header">
        ALL DAY
        <span className="event-count-badge" style={{ marginLeft: '8px', fontSize: '0.8em' }}>
          {events.length}
        </span>
      </div>
      <div className="all-day-content">
        {events.map(event => (
          <CalendarEvent
            key={`all-day-${event._id}`}
            event={event}
            onEdit={onEditEvent}
            onDelete={onDeleteEvent}
          />
        ))}
      </div>
    </div>
  );
};

export default AllDayEvents;