// /frontend/src/components/Habits/GapDropZone.js
import React from 'react';
import { useDrop } from 'react-dnd';

const ItemTypes = {
  ACTIVITY: 'activity'
};

const GapDropZone = ({ onDrop, index, style }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.ACTIVITY,
    drop: (item) => {
      console.log(`Dropped in GapDropZone at index: ${index}`, 'Item:', item);
      
      // Visual feedback for drop
      document.body.classList.add('gap-dropping');
      setTimeout(() => {
        document.body.classList.remove('gap-dropping');
      }, 250);
      
      // Pass both the item and the index to the parent handler
      onDrop(item, index);
      
      return { dropped: true, inGap: true, atIndex: index };
    },
    hover: (item, monitor) => {
      if (monitor.isOver({ shallow: true })) {
        // Add a class to the body for global styling if needed
        document.body.classList.add('hovering-gap');
        
        // Reduce hover logging frequency to avoid console spam
        if (Math.random() < 0.05) { // Only log ~5% of hover events
          console.log(`Hovering over GapDropZone at index: ${index}`);
        }
      } else {
        document.body.classList.remove('hovering-gap');
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop()
    })
  });

  return (
    <div
      ref={drop}
      className={`drop-zone ${isOver && canDrop ? 'can-drop-period' : ''}`}
      style={{
        height: '20px', // Increased height for better touch targets
        margin: '4px 0',
        borderRadius: '4px',
        backgroundColor: isOver && canDrop ? 'rgba(0, 123, 255, 0.2)' : 'transparent',
        transition: 'all 0.2s',
        // Make drop zone more visible during development
        outline: isOver ? '2px dashed #007bff' : (canDrop ? '1px dashed rgba(0, 123, 255, 0.3)' : 'none'),
        // Add subtle visual indicator even when not hovering
        boxShadow: isOver ? '0 0 5px rgba(0, 123, 255, 0.3)' : 'none',
        // Scale up slightly when hovered for more visual feedback
        transform: isOver ? 'scaleY(1.2)' : 'scaleY(1)'
      }}
      data-testid={`gap-drop-zone-${index !== undefined ? index : 'unknown'}`}
      data-index={index}
    ></div>
  );
};

export default GapDropZone;
