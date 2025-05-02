//DroppableTimeSlot.js - Droppable container for time periods

import React from 'react';
import { useDrop } from 'react-dnd';

const DroppableTimeSlot = ({ period, children, onDrop }) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'HABIT',
    drop: (item, monitor) => {
      console.log(`DroppableTimeSlot: Item dropped into ${period} period:`, item);
      
      if (onDrop) {
        try {
          onDrop(item.id, period);
          console.log(`DroppableTimeSlot: onDrop handler called for item ${item.id} to period ${period}`);
        } catch (error) {
          console.error('Error in onDrop handler:', error);
        }
      } else {
        console.warn(`DroppableTimeSlot: No onDrop handler provided for ${period} period`);
      }
      
      return { moved: true, toPeriod: period };
    },
    hover: (item, monitor) => {
      // Log when an item is being hovered over this slot
      if (monitor.isOver({ shallow: true })) {
        console.log(`DroppableTimeSlot: Item ${item.id} hovering over ${period} period`);
      }
    },
    collect: monitor => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  }), [period, onDrop]);
  
  // Add visual feedback for drop target
  const style = {
    border: isOver ? '2px dashed #007bff' : 'none',
    padding: isOver ? '2px' : '4px',
    backgroundColor: isOver ? 'rgba(0, 123, 255, 0.05)' : 'transparent',
    transition: 'all 0.2s ease',
    borderRadius: '4px'
  };
  
  return (
    <div
      ref={drop}
      className={`droppable-time-slot ${isOver ? 'can-drop' : ''} ${canDrop ? 'drop-allowed' : ''}`}
      style={style}
      data-period={period}
    >
      {children}
      
      {/* Debug marker to confirm drop zone is working */}
      {process.env.NODE_ENV === 'development' && (
        <div className="drop-zone-marker" style={{
          position: 'absolute',
          top: '2px',
          right: '2px',
          fontSize: '8px',
          color: 'rgba(0,0,0,0.2)'
        }}>
          {period} drop zone
        </div>
      )}
    </div>
  );
};

export default DroppableTimeSlot;