//frontend/src/components/Habits/DraggableActivity.js

import React from 'react';
import { useDrag } from 'react-dnd';
import { getActivityHeight, isHabitCompleteOnDate } from './utils/activityUtils';
import { getDateFromOffset } from './utils/dateUtils';

// Define item types
const ItemTypes = {
  ACTIVITY: 'activity'
};

/**
 * Draggable Activity Card Component
 */
const DraggableActivity = ({ activity, dayIndex, findDayOffset, toggleHabitCompletion, justToggled, completions, dateCompletions, isMobileView }) => {
  // Calculate day offset
  const dayOffset = findDayOffset(dayIndex);
  
  // Get the actual date for this day
  const date = getDateFromOffset(dayOffset);
  
  const isCompleted = isHabitCompleteOnDate(activity._id, date, completions, dateCompletions);
  const isJustToggled = justToggled && justToggled[activity._id];
  
  // Calculate the actual date for this day to determine if it's in the past
  const today = new Date();
  // Using the existing dayOffset and date from earlier in the code
  const activityDate = date; // We already have the date calculated above
  
  // Check if this date is before today (actual date comparison)
  const isPastDay = activityDate < today && activityDate.toDateString() !== today.toDateString();
  
  // Only allow dragging if it's a habit and it's today or a future day
  const canDrag = activity.isHabit && !isPastDay;
  
  // Set up drag functionality
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.ACTIVITY,
    item: { 
      id: activity._id,
      name: activity.name,
      currentPeriod: activity.period,
      order: activity.order || 0,
      index: activity.index
    },
    canDrag: canDrag,
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    end: (item, monitor) => {
      // Check if we have a successful drop
      const dropResult = monitor.getDropResult();
      const didDrop = monitor.didDrop();
      
      if (didDrop && dropResult) {
        console.log(`Drag ended for "${activity.name}". Drop result:`, dropResult);
        
        // Force a refresh animation after drag
        setTimeout(() => {
          document.body.classList.add('refreshing');
          setTimeout(() => {
            document.body.classList.remove('refreshing');
          }, 300);
        }, 50);
      }
    }
  }), [activity, dayIndex]);
  
  // Determine the appropriate status class
  const statusClass = isCompleted ? 'completed' : 
                     (dayOffset < 0 && !isCompleted) ? 'missed' : '';
  
  // Calculate card height based on duration
  const cardHeight = getActivityHeight(activity, isMobileView);
  
  // Determine content display based on card height
  const isCompactView = isMobileView ? (cardHeight < 50) : (cardHeight < 65);
  
  return (
    <div 
      ref={canDrag ? drag : null}
      className={`
        activity-card 
        ${statusClass}
        ${isJustToggled ? 'just-completed' : ''} 
        ${canDrag ? 'draggable-activity' : ''}
        ${isDragging ? 'dragging' : ''}
        ${isPastDay ? 'past-day-activity' : ''}
      `}
      style={{ 
        cursor: canDrag ? 'grab' : 'default',
        opacity: isDragging ? 0.5 : 1,
        height: `${cardHeight}px`,
        minHeight: isCompactView ? 'auto' : (isMobileView ? '35px' : '45px'),
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: isCompactView ? 'center' : 'flex-start',
        pointerEvents: isPastDay ? 'none' : 'auto'
      }}
      onClick={() => !isPastDay && toggleHabitCompletion(activity._id)}
    >
      <div className="activity-card-header">
        <span className="activity-name">{activity.name}</span>
      </div>
      <div className="activity-card-body">
        <span className="activity-duration">{activity.duration} min</span>
        
        {/* Only show more details if we have enough space */}
        {!isCompactView && activity.repeatDays && (
          <div className="activity-repeat-days mt-1" style={{fontSize: '0.7rem', opacity: 0.8}}>
            {activity.repeatDays.length === 7 
              ? 'Every day' 
              : `${activity.repeatDays.length} days per week`}
          </div>
        )}
        
        {/* Visual indicator for taller cards */}
        {cardHeight > 90 && (
          <div className="activity-progress mt-2" style={{
            height: '3px', 
            width: '100%', 
            backgroundColor: 'rgba(0,0,0,0.05)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${isCompleted ? 100 : 0}%`,
              backgroundColor: isCompleted ? '#28a745' : '#6c757d',
              transition: 'width 0.5s ease'
            }}></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DraggableActivity;