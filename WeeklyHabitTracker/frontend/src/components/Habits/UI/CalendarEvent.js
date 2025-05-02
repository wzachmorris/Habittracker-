// src/components/Habits/UI/CalendarEvent.js
import React from 'react';

const CalendarEvent = ({ 
  event, 
  onEdit, 
  onDelete 
}) => {
  if (!event) return null;
  
  const { 
    _id, 
    title, 
    startTime, 
    endTime, 
    color = '#007bff', 
    location = '', 
    isRecurring = false 
  } = event;
  
  return (
    <div 
      className="calendar-event"
      onClick={() => onEdit && onEdit(event)}
      style={{
        borderLeft: `4px solid ${color}`,
        backgroundColor: `${color}10`,
        padding: '10px 12px',
        borderRadius: '6px',
        marginBottom: '10px',
        position: 'relative',
        cursor: onEdit ? 'pointer' : 'default'
      }}
    >
      <div className="calendar-event-header">
        <div className="calendar-event-title" style={{ fontWeight: '500', marginBottom: '4px' }}>
          {title || event.name}
        </div>
        
        {onDelete && (
          <button 
            className="calendar-event-delete" 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(_id);
            }}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'none',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer',
              color: '#dc3545'
            }}
          >
            ×
          </button>
        )}
      </div>
      
      <div className="calendar-event-time" style={{ fontSize: '0.75rem', color: '#6c757d' }}>
        {startTime}
        {endTime && startTime !== endTime && ` - ${endTime}`}
      </div>
      
      {location && (
        <div className="calendar-event-location" style={{ fontSize: '0.75rem', color: '#6c757d', marginTop: '2px' }}>
          📍 {location}
        </div>
      )}
      
      {isRecurring && (
        <div className="calendar-event-recurring" style={{ 
          fontSize: '0.7rem', 
          opacity: 0.7,
          marginTop: '4px',
          fontStyle: 'italic'
        }}>
          🔄 Recurring event
        </div>
      )}
    </div>
  );
};

export default CalendarEvent;