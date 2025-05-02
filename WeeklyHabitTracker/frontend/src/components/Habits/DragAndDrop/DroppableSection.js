// src/components/Habits/DragAndDrop/DroppableSection.js
import React from 'react';
import { useDrop } from 'react-dnd';

const DroppableSection = ({ 
  id, 
  period, 
  dayIndex, 
  onDrop,
  children 
}) => {
  // Set up drop functionality using react-dnd
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'HABIT',
    drop: (item, monitor) => {
      // Handle drop based on where it's coming from
      if (onDrop) {
        if (item.currentPeriod !== period) {
          // Coming from a different period
          onDrop(item.id, period, -1); // -1 means append to end
        } else {
          // Reordering within same period
          onDrop(item.id, period, item.index);
        }
      }
      
      return { 
        dropped: true, 
        inSection: id,
        toPeriod: period,
        dayIndex
      };
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  }), [id, period, dayIndex, onDrop]);
  
  // Determine appropriate class names
  const className = `
    droppable-area
    ${isOver ? 'can-drop' : ''}
  `;
  
  // Log drop state changes
  React.useEffect(() => {
    if (isOver) {
      console.log(`DroppableSection: Item is over ${period} section for day ${dayIndex}`);
    }
  }, [isOver, period, dayIndex]);

  return (
    <div 
      ref={drop}
      className={className}
      style={{
        backgroundColor: isOver && canDrop ? 'rgba(0, 123, 255, 0.1)' : 'transparent',
        padding: isOver && canDrop ? '5px' : '0',
        transition: 'all 0.2s',
        border: isOver && canDrop ? '2px dashed #0d6efd' : 'none',
        position: 'relative'
      }}
      data-period={period}
      data-day-index={dayIndex}
    >
      {children}
      
      {/* Visual indicator when dragging over */}
      {isOver && canDrop && (
        <div style={{
          position: 'absolute',
          top: '5px',
          right: '5px',
          background: 'rgba(13, 110, 253, 0.8)',
          color: 'white',
          padding: '2px 5px',
          borderRadius: '3px',
          fontSize: '10px',
          zIndex: 10
        }}>
          Drop Here
        </div>
      )}
    </div>
  );
};

export default DroppableSection;