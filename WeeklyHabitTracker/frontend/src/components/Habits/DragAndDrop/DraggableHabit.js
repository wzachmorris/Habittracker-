// src/components/Habits/DragAndDrop/DraggableHabit.js
import React, { useEffect } from 'react';
import { useDrag } from 'react-dnd';

const DraggableHabit = ({ 
  activity, 
  isCompleted, 
  isPast,
  isJustToggled,
  onToggle,
  index,
  isDraggable,
  isMobileView
}) => {
  // Ensure activity is properly displayed
  useEffect(() => {
    // Skip if activity is invalid
    if (!activity) return;
    
    // Ensure this component is visible in the DOM
    const elem = document.querySelector(`[data-activity-id="${activity._id}"]`);
    if (elem) {
      elem.style.display = 'block';
      elem.style.visibility = 'visible';
    }
  }, [activity, isDraggable]);
  
  // Set up drag functionality using react-dnd
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'HABIT',
    item: { 
      id: activity._id,
      type: 'habit',
      name: activity.name, 
      currentPeriod: activity.period,
      index
    },
    canDrag: isDraggable && !isPast, // Can only drag if it's draggable and not in the past
    begin: () => {
      return { 
        id: activity._id,
        type: 'habit',
        name: activity.name, 
        currentPeriod: activity.period,
        index
      };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }), [activity, index, isDraggable, isPast]);
  
  // Calculate height based on duration - longer activities are taller
  const getActivityHeight = () => {
    const minHeight = isMobileView ? 40 : 50;
    const heightFactor = isMobileView ? 0.8 : 1;
    
    // Ensure duration exists and is a number
    const duration = activity.duration && !isNaN(activity.duration) ? activity.duration : 30;
    
    return Math.max(minHeight, Math.min(200, duration * heightFactor));
  };
  
  // Determine appropriate class names
  const cardClassName = `
    activity-card 
    ${isCompleted ? 'completed' : ''}
    ${isPast && !isCompleted ? 'missed' : ''}
    ${isJustToggled ? 'just-completed' : ''}
    ${isDraggable ? 'draggable-item' : ''}
    ${isDragging ? 'dragging' : ''}
  `;
  
  // If activity is invalid, show a placeholder with an error
  if (!activity || !activity._id) {
    return (
      <div className="activity-card error" style={{ backgroundColor: '#ffebee', borderLeft: '4px solid #f44336' }}>
        <div className="activity-card-header">
          <span className="activity-name">Invalid Activity</span>
        </div>
        <div className="activity-card-body">
          <span>Missing data</span>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      ref={isDraggable ? drag : null}
      className={cardClassName}
      style={{ 
        height: `${getActivityHeight()}px`,
        cursor: isDraggable ? 'grab' : 'default',
        opacity: isDragging ? 0.5 : 1,
        position: 'relative'
      }}
      onClick={() => !isPast && onToggle && onToggle(activity._id)}
      data-activity-id={activity._id}
      data-period={activity.period}
    >
      <div className="activity-card-header">
        <span className="activity-name">{activity.name}</span>
      </div>
      <div className="activity-card-body">
        <span className="activity-duration">{activity.duration} min</span>
        
        {/* Show repeat days for activities that don't repeat daily */}
        {activity.repeatDays && activity.repeatDays.length > 0 && 
         activity.repeatDays.length < 7 && (
          <div className="activity-repeat-days">
            {activity.repeatDays.length} days per week
          </div>
        )}
      </div>
      
    </div>
  );
};

export default DraggableHabit;