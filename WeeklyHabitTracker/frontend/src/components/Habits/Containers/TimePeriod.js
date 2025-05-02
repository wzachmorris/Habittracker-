// src/components/Habits/Containers/TimePeriod.js
import React, { useMemo, useEffect, useRef } from 'react';
import '../Styles/timePeriod.css';
import DraggableHabit from '../DragAndDrop/DraggableHabit';
import CalendarEvent from '../UI/CalendarEvent';
import DroppableSection from '../DragAndDrop/DroppableSection';

const TimePeriod = ({
  title,
  period,
  dayIndex,
  activities = [],
  events = [],
  isPast = false,
  isToday = false,
  isFuture = false,
  completions = {},
  dateCompletions = {},
  justToggled = {},
  updateActivityPeriod,
  handleReorderActivity,
  toggleHabitCompletion,
  onEditEvent,
  onDeleteEvent,
  isMobileView = false,
  refreshFlag = 0
}) => {
  // Create refs for the content container
  const contentRef = useRef(null);
  
  // CRITICAL FIX: Directly add activities to DOM when props change
  useEffect(() => {
    // Skip during initial render
    if (!contentRef.current) return;
    
    // Log current state
    console.log(`DIRECT DOM FIX: Adding ${activities.length} activities to ${period} period for day ${dayIndex}`);
    
    const container = contentRef.current;
    
    // Only run this as a backup if no activities are visible
    const existingActivityCards = container.querySelectorAll('.activity-card:not(.debug-placeholder)');
    if (existingActivityCards.length > 0) {
      console.log(`DIRECT DOM FIX: Found ${existingActivityCards.length} existing activity cards in the DOM, skipping backup rendering`);
      return;
    }
    
    // Get container where activity cards should appear
    if (activities.length > 0) {
      // For each activity, create a DOM element
      activities.forEach(activity => {
        if (!activity || !activity._id) return;
        
        // Skip if it already exists
        if (container.querySelector(`[data-activity-id="${activity._id}"]`)) return;
        
        // Create a placeholder element
        const card = document.createElement('div');
        card.className = 'activity-card backup-rendered';
        card.dataset.activityId = activity._id;
        card.dataset.period = activity.period;
        card.style.backgroundColor = '#e3f2fd';
        card.style.border = '2px solid #2196f3';
        card.style.borderRadius = '8px';
        card.style.padding = '10px';
        card.style.margin = '10px 0';
        card.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        
        // Add content
        card.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 5px;">
            ${activity.name || 'Unnamed Activity'}
          </div>
          <div style="color: #666; font-size: 0.9em;">
            ${activity.duration || 30} min - ${period} period
          </div>
          <div style="color: #666; font-size: 0.8em; margin-top: 5px;">
            Backup render - ID: ${activity._id}
          </div>
        `;
        
        // Append to container
        container.appendChild(card);
        console.log(`DIRECT DOM FIX: Added backup DOM element for ${activity.name} (${activity._id})`);
      });
    } else {
      // Add an empty placeholder
      const placeholder = document.createElement('div');
      placeholder.className = 'activity-card debug-placeholder';
      placeholder.style.padding = '10px';
      placeholder.style.border = '1px dashed #ccc';
      placeholder.style.backgroundColor = '#f9f9f9';
      placeholder.innerHTML = `<p>No activities for ${period}</p>`;
      
      container.appendChild(placeholder);
    }
  }, [activities, period, dayIndex, refreshFlag]);
  // Debug logging removed for production
  
  // Force rendering all items regardless of length
  const forceShowItems = true;

  // Combine activities and events and sort by order
  const items = useMemo(() => {
    // Ensure activities and events are arrays
    const safeActivities = Array.isArray(activities) ? activities : [];
    const safeEvents = Array.isArray(events) ? events : [];
    
    // Convert activities and events to a common format for sorting (with more error protection)
    const activityItems = safeActivities
      .filter(activity => activity != null) // Remove null/undefined items
      .map(activity => ({
        type: 'activity',
        data: activity,
        order: activity.order || 0
      }));
    
    const eventItems = safeEvents
      .filter(event => event != null) // Remove null/undefined items
      .map(event => ({
        type: 'event',
        data: event,
        order: event.order || 0
      }));
    
    // Combine and sort by order
    const sortedItems = [...activityItems, ...eventItems]
      .sort((a, b) => a.order - b.order);
    
    // Debugging removed
    
    return sortedItems;
  }, [activities, events, refreshFlag, title, dayIndex, isPast, isToday, isFuture]);
  
  // Handle dropping an item into this time period
  const handleDrop = (itemId, targetPeriod, targetIndex) => {
    if (updateActivityPeriod && handleReorderActivity) {
      if (targetPeriod !== period) {
        // Moving from another period
        updateActivityPeriod(itemId, period, dayIndex);
      } else {
        // Reordering within the same period
        handleReorderActivity(itemId, period, targetIndex, dayIndex);
      }
    }
  };
  
  // Determine if this period can accept drops
  const canDrop = isToday || isFuture;
  
  // Get period-specific styling
  const getPeriodStyle = () => {
    switch (period) {
      case 'morning':
        return { backgroundColor: '#f0f8ff', icon: '🌅' };
      case 'afternoon':
        return { backgroundColor: '#fff8e1', icon: '☀️' };
      case 'evening':
        return { backgroundColor: '#e8eaf6', icon: '🌙' };
      default:
        return { backgroundColor: '#f5f5f5', icon: '⏱️' };
    }
  };
  
  const { backgroundColor, icon } = getPeriodStyle();
  
  
  return (
    <div className={`time-period ${period}`} style={{ backgroundColor: isPast ? '#f5f5f5' : backgroundColor }}>
      <div className="time-period-header">
        <span className="period-icon">{icon}</span>
        <span className="period-title">{title}</span>
      </div>
      
      {canDrop ? (
        <DroppableSection
          id={`${period}-${dayIndex}`}
          title={title}
          period={period}
          dayIndex={dayIndex}
          onDrop={handleDrop}
        >
          <div className="time-period-content" 
            ref={contentRef}
            style={{ 
              border: "1px dashed #ccc", 
              minHeight: "100px", 
              position: "relative" 
            }} 
            data-period={period} 
            data-day-index={dayIndex}
          >
          
            {/* Directly render items using Array.map */}
            {items.length > 0 ? (
              items.map((item, index) => (
                <React.Fragment key={`${item.type}-${item.data._id}`}>
                  {item.type === 'activity' ? (
                    <DraggableHabit
                      activity={item.data}
                      isCompleted={completions[item.data._id]}
                      isPast={isPast}
                      isJustToggled={justToggled[item.data._id]}
                      onToggle={toggleHabitCompletion}
                      index={index}
                      isDraggable={canDrop}
                      isMobileView={isMobileView}
                    />
                  ) : (
                    <CalendarEvent
                      event={item.data}
                      onEdit={onEditEvent}
                      onDelete={onDeleteEvent}
                    />
                  )}
                </React.Fragment>
              ))
            ) : (
              <div className="empty-period" style={{ 
                padding: "20px", 
                backgroundColor: "#f8f9fa",
                textAlign: "center",
                color: "#6c757d",
                borderRadius: "8px",
                fontStyle: "italic"
              }}>
                <span>Drag activities here</span>
              </div>
            )}
            
          </div>
        </DroppableSection>
      ) : (
        <div className="time-period-content read-only" 
          ref={contentRef}
          style={{ 
            border: "1px dashed #ccc", 
            minHeight: "100px",
            position: "relative" 
          }}
          data-period={period} 
          data-day-index={dayIndex}
        >
          
          {/* Directly render items, simplified logic */}
          {items.length > 0 ? (
            items.map((item, index) => (
              <React.Fragment key={`${item.type}-${item.data._id}`}>
                {item.type === 'activity' ? (
                  <div 
                    className={`activity-card ${
                      completions[item.data._id] ? 'completed' : (isPast ? 'missed' : '')
                    }`}
                    data-activity-id={item.data._id}
                    data-period={item.data.period}
                    style={{ display: "block", visibility: "visible" }}
                  >
                    <div className="activity-card-header">
                      <span className="activity-name">{item.data.name}</span>
                    </div>
                    <div className="activity-card-body">
                      <span className="activity-duration">{item.data.duration} min</span>
                    </div>
                  </div>
                ) : (
                  <CalendarEvent
                    event={item.data}
                    onEdit={null} // Read-only
                    onDelete={null} // Read-only
                  />
                )}
              </React.Fragment>
            ))
          ) : (
            <div className="empty-period" style={{ 
              padding: "20px", 
              backgroundColor: "#f8f9fa",
              textAlign: "center",
              color: "#6c757d",
              borderRadius: "8px",
              fontStyle: "italic"
            }}>
              <span>No activities for this period</span>
            </div>
          )}
          
        </div>
      )}
    </div>
  );
};

export default TimePeriod;