import React from 'react';
import { useDrop } from 'react-dnd';
import DraggableActivity from './DraggableActivity';
import { getDateFromOffset } from './utils/dateUtils';

// Define item types
const ItemTypes = {
  ACTIVITY: 'activity'
};

/**
 * Droppable Activity Item Component
 */
const DroppableActivity = ({ 
  activity, 
  index, 
  period, 
  dayIndex, 
  findDayOffset, 
  updateActivityPeriod, 
  handleReorderActivity, 
  toggleHabitCompletion,
  completions,
  dateCompletions,
  justToggled,
  isMobileView
}) => {
  // Get day offset and determine the actual date
  const dayOffset = findDayOffset(dayIndex);
  const today = new Date();
  // Import needed utility function
  const date = getDateFromOffset(dayOffset);
  
  // Check if this date is before today (actual date comparison)
  const isPastDay = date < today && date.toDateString() !== today.toDateString();
  
  // Only today or future days are droppable
  const isDroppable = !isPastDay;
  
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.ACTIVITY,
    hover: (item) => {
      // Skip if hovering over itself
      if (item.id === activity._id) return;
      
      // Visual feedback during hover
      document.body.classList.add('hovering-activity');
    },
    drop: (item) => {
      // Clean up hover effect
      document.body.classList.remove('hovering-activity');
      
      // If from a different period, handle as a move
      if (item.currentPeriod !== period) {
        console.log(`Moving activity ${item.id} from ${item.currentPeriod} to ${period} for day ${dayIndex}`);
        updateActivityPeriod(item.id, period, dayIndex);
        return { moved: true, toPeriod: period };
      }
      
      // If from same period but different position, handle as reorder
      if (item.id !== activity._id) {
        console.log(`Reordering activity ${item.id} to index ${index} in ${period} for day ${dayIndex}`);
        
        // Visual feedback for drop
        document.body.classList.add('activity-dropping');
        setTimeout(() => {
          document.body.classList.remove('activity-dropping');
        }, 250);
        
        // Call reorder with the target index and dayIndex
        handleReorderActivity(item.id, period, index, dayIndex);
        return { reordered: true, toIndex: index };
      }
      
      return undefined;
    },
    canDrop: (item) => {
      // Can drop if:
      // 1. This is a today or future day item
      // 2. Not dropping onto itself
      return isDroppable && item.id !== activity._id;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop() && monitor.getItem()?.id !== activity._id
    }),
  });
  
  return (
    <div 
      ref={drop}
      className={`
        drop-target
        ${isOver && canDrop ? 'can-drop' : ''}
      `}
      style={{
        position: 'relative',
        padding: isOver && canDrop ? '10px 0' : '0',
        marginBottom: '10px',
        transition: 'padding 0.2s',
        border: isOver ? '1px dashed #007bff' : 'none'
      }}
    >
      {/* Drop indicator shown when hovering */}
      {isOver && canDrop && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: '#007bff',
          borderRadius: '3px',
          zIndex: 10
        }}/>
      )}
      
      <DraggableActivity 
        activity={activity} 
        dayIndex={dayIndex}
        findDayOffset={findDayOffset}
        toggleHabitCompletion={toggleHabitCompletion}
        completions={completions}
        dateCompletions={dateCompletions}
        justToggled={justToggled}
        isMobileView={isMobileView}
      />
      
      {/* Bottom drop indicator */}
      {isOver && canDrop && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: '#007bff',
          borderRadius: '3px',
          zIndex: 10
        }}/>
      )}
    </div>
  );
};

export default DroppableActivity;