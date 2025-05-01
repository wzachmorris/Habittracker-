// ActivityList.js
import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ActivityCard from './ActivityCard';
import { processNextSessionNotes } from '../services/api';
import './ActivityList.css'; // Import custom styles for mobile touch support

const SelectableActivityItem = ({
  activity,
  index,
  isToday,
  completions,
  onEdit,
  onDelete,
  onToggleComplete,
  isSelected,
  onSelect,
}) => {
  // Note: We're keeping the onSelect for compatibility, but we're no longer
  // showing the activity controller panel on the homepage

  return (
    <div className={`selectable-activity ${isSelected ? 'selected' : ''}`}>
      <ActivityCard
        activity={activity}
        isCompleted={completions[activity._id] || false}
        isToday={isToday}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleComplete={onToggleComplete}
        index={index}
        isSelected={isSelected}
      />
    </div>
  );
};

function ActivityList({
  activities,
  completions = {},
  isToday = true,
  onEdit,
  onDelete,
  onToggleComplete,
  selectedActivity,
  onSelectActivity,
  onReorder,
  onMove,
  onMovePeriod,
  moveInProgress = false,
  refreshFlag = 0
}) {
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  
  // Add resize listener to detect mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  useEffect(() => {
    const processAllNextSessionNotes = async () => {
      for (const activity of activities) {
        if (activity.nextSessionNotes) {
          try {
            await processNextSessionNotes(activity);
          } catch (error) {
            console.error('Error processing next session notes for activity:', activity._id, error);
          }
        }
      }
    };

    if (activities && activities.length > 0) {
      processAllNextSessionNotes();
    }
  }, [activities, refreshFlag]); // Add refreshFlag to dependencies

  const sortByOrder = (a, b) => {
    if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
    return a._id > b._id ? 1 : -1;
  };

  const periods = {
    morning: activities.filter(a => a.period === 'morning').sort(sortByOrder),
    afternoon: activities.filter(a => a.period === 'afternoon').sort(sortByOrder),
    evening: activities.filter(a => a.period === 'evening').sort(sortByOrder),
  };

  const calculateTotal = (acts) => acts.reduce((sum, a) => sum + a.duration, 0);

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Enhanced drag handlers with better mobile support
  const handleDragStart = (start) => {
    // Add a class to the body when dragging starts for visual feedback
    document.body.classList.add('dragging-in-progress');
    
    // Vibrate on mobile devices when drag starts (if supported)
    if (isMobileView && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50); // Short vibration for haptic feedback
    }
    
    console.log(`[DragStart] Started dragging ${start.draggableId}`);
  };
  
  const handleDragEnd = (result) => {
    // Remove dragging class
    document.body.classList.remove('dragging-in-progress');
    
    const { source, destination, draggableId } = result;
    // Skip if already in progress, no destination, or same position
    if (moveInProgress || !destination || source.index === destination.index) return;
    
    // Provide haptic feedback when drag completes (if supported)
    if (isMobileView && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate([30, 30, 30]); // Pattern for completion
    }
    
    console.log(`[DragEnd] Result:`, {
      draggableId,
      source: { droppableId: source.droppableId, index: source.index },
      destination: { droppableId: destination.droppableId, index: destination.index }
    });
    
    const dragged = activities.find(a => a._id === draggableId);
    if (!dragged) {
      console.error(`[DragEnd] Could not find activity with id: ${draggableId}`);
      return;
    }
    
    console.log(`[DragEnd] Dragged activity:`, {
      id: dragged._id,
      name: dragged.name,
      period: dragged.period,
      order: dragged.order
    });
    
    // Two possibilities: reordering within same period or moving to a different period
    if (source.droppableId === destination.droppableId) {
      // Reordering within the same time period
      console.log(`[DragEnd] Reordering ${dragged.name} from index ${source.index} to ${destination.index} in ${source.droppableId}`);
      
      // Verify the period matches
      if (dragged.period !== source.droppableId) {
        console.warn(`[DragEnd] Period mismatch! Activity period: ${dragged.period}, droppableId: ${source.droppableId}`);
      }
      
      onReorder(dragged._id, dragged.period, destination.index);
    } else {
      // Moving between time periods
      console.log(`[DragEnd] Cross-period drop: moving ${dragged.name} from ${source.droppableId} to ${destination.droppableId} at index ${destination.index}`);
      
      // First change the period, then handle reordering
      if (onMovePeriod) {
        // If we have a dedicated onMovePeriod function, use it
        onMovePeriod(dragged._id, destination.droppableId, destination.index);
      } else if (onMove) {
        // If we only have onMove, use that
        onMove(dragged._id, destination.droppableId);
      } else {
        console.warn('[DragEnd] No handler for cross-period drops provided');
      }
    }
  };

  const renderPeriodSection = (label, emoji, key) => (
    <div className="card mb-4">
      <div className="card-header bg-light d-flex justify-content-between align-items-center">
        <h5 className="mb-0">{emoji} {label}</h5>
        <div className="d-flex align-items-center">
          <span className="me-1 text-muted small">Total:</span>
          <span className="badge bg-primary">{formatDuration(calculateTotal(periods[key]))}</span>
        </div>
      </div>
      <Droppable droppableId={key}>
        {(provided, snapshot) => (
          <div
            className={`card-body ${snapshot.isDraggingOver ? 'droppable-hover' : ''}`}
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              background: snapshot.isDraggingOver ? '#e0f7fa' : 'white',
              minHeight: '100px', // Ensure the drop area is large enough
              padding: '10px',
              transition: 'background-color 0.2s ease',
              border: snapshot.isDraggingOver ? '2px dashed #0288d1' : '2px solid transparent',
              borderRadius: '4px'
            }}
          >
            {periods[key].map((activity, index) => (
              <Draggable 
                key={activity._id} 
                draggableId={activity._id} 
                index={index}
                // Add touchable class to improve hit area on mobile
                disableInteractiveElementBlocking={isMobileView}>
                {(provided, snapshot) => (
                  <div 
                    ref={provided.innerRef} 
                    {...provided.draggableProps} 
                    {...provided.dragHandleProps}
                    // Add styling to enhance touch feedback
                    className={`draggable-item ${snapshot.isDragging ? 'is-dragging' : ''} ${isMobileView ? 'mobile-drag-item' : ''}`}
                    style={{
                      ...provided.draggableProps.style,
                      ...(snapshot.isDragging ? { 
                        boxShadow: '0 5px 15px rgba(0,0,0,0.15)', 
                        zIndex: 9999,
                        opacity: 0.8,
                        transform: `${provided.draggableProps.style.transform} scale(1.02)`
                      } : {}),
                      ...(isMobileView ? { touchAction: 'none' } : {}),
                      margin: '0 0 8px 0'
                    }}>
                    <SelectableActivityItem
                      activity={activity}
                      index={index}
                      isToday={isToday}
                      completions={completions}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onToggleComplete={onToggleComplete}
                      isSelected={selectedActivity && selectedActivity._id === activity._id}
                      onSelect={onSelectActivity}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {periods[key].length === 0 && (
              <div className="text-center text-muted py-3" style={{ opacity: snapshot.isDraggingOver ? 0.5 : 1 }}>
                Drop here to add {label.toLowerCase()} activities
              </div>
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );

  return (
    <div className={`vertical-stack ${moveInProgress ? 'activities-updating' : ''}`}>
      {moveInProgress && (
        <div className="activity-loading-overlay">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
      
      {!isToday && (
        <div className="alert alert-info mb-3 text-center" role="alert">
          <i className="bi bi-info-circle me-2"></i>
          You are viewing activities for a different day. Completion can only be marked for today.
        </div>
      )}
      
      {/* Use the properties needed for touch support */}
      <DragDropContext 
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd} 
                      enableDefaultSensors={true}
                      touchSensorOptions={isMobileView ? { 
                        delayTouchStart: 200, // Short delay to recognize drag vs tap
                        enableMouseEvents: true // Allow both touch and mouse events
                      } : undefined}>
        {/* Use refreshFlag in the key to force re-rendering when it changes */}
        <div key={`period-container-refresh-${refreshFlag}`}>
          {renderPeriodSection('Morning', '☀️', 'morning')}
          {renderPeriodSection('Afternoon', '🌇', 'afternoon')}
          {renderPeriodSection('Evening', '🌙', 'evening')}
        </div>
      </DragDropContext>
    </div>
  );
}

export default ActivityList;
