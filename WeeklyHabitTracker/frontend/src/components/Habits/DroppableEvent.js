// /frontend/src/components/Habits/DroppableEvent.js

import React from 'react';
import { useDrop } from 'react-dnd';
import CalendarEvent from './CalendarEvent';

const ItemTypes = {
  ACTIVITY: 'activity'
};

const DroppableEvent = ({
  event,
  index,
  period,
  dayIndex,
  updateActivityPeriod,
  handleReorderActivity,
  onEditEvent,
  onDeleteEvent
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.ACTIVITY,
    hover: (item, monitor) => {
      // Add hover feedback for better UX
      if (monitor.isOver({shallow: true})) {
        document.body.classList.add('hovering-event');
      }
    },
    drop: (item) => {
      console.log(`Dropping habit "${item.name}" around event "${event.title || event.name}" in ${period} at index ${index}`);
      
      // Clean up hover effects
      document.body.classList.remove('hovering-event');
      
      // When dropping, treat this event like an anchor point for reordering
      // Explicitly pass the target index to the handler
      handleReorderActivity(item.id, period, index, dayIndex);
      
      // Visual feedback
      document.body.classList.add('event-dropping');
      setTimeout(() => {
        document.body.classList.remove('event-dropping');
      }, 300);
      
      return { moved: true, targetIndex: index };
    },
    canDrop: (item) => true, // Always allow dropping around events
    collect: monitor => ({
      isOver: monitor.isOver({shallow: true}),
      canDrop: monitor.canDrop()
    })
  });

  return (
    <div
      ref={drop}
      className={`droppable-event-container ${isOver && canDrop ? 'can-drop-period' : ''}`}
      style={{
        marginBottom: '8px',
        padding: '4px',
        backgroundColor: isOver && canDrop ? 'rgba(0, 123, 255, 0.08)' : 'transparent',
        borderRadius: '6px',
        transition: 'background-color 0.2s'
      }}
    >
      <CalendarEvent event={event} onEditEvent={onEditEvent} onDeleteEvent={onDeleteEvent} />
    </div>
  );
};

export default DroppableEvent;
