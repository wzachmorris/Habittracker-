// /frontend/src/components/Habits/TimePeriod.js

import React, { useMemo } from 'react';
import DroppableActivity from './DroppableActivity';
import DroppableEvent from './DroppableEvent';
import GapDropZone from './GapDropZone';

const TimePeriod = ({
  period,
  dayIndex,
  activities,
  calendarEvents,
  findDayOffset,
  updateActivityPeriod,
  handleReorderActivity,
  toggleHabitCompletion,
  onEditEvent,
  onDeleteEvent,
  completions,
  dateCompletions,
  justToggled,
  isMobileView,
  refreshFlag
}) => {
  // Build a unified mixed list of events and habits
  const items = useMemo(() => {
    console.log(`TimePeriod rebuilding items array for ${period} with refreshFlag: ${refreshFlag}`);
    
    const eventItems = (calendarEvents || [])
      .filter(event => event.startTime !== 'All day')
      .map(event => ({ type: 'event', data: event }));

    const habitItems = (activities || [])
      .map(activity => ({ type: 'habit', data: activity }));
    
    // Combine and sort by order
    const combinedItems = [...eventItems, ...habitItems];
    
    // Sort by order, with proper fallbacks
    return combinedItems.sort((a, b) => {
      const orderA = a.type === 'habit' ? (a.data.order || 0) : (a.data.order || -50);
      const orderB = b.type === 'habit' ? (b.data.order || 0) : (b.data.order || -50);
      return orderA - orderB;
    });
  }, [calendarEvents, activities, refreshFlag, period]);

  // Handle drop event with index information
  const handleDrop = (draggedItem, dropIndex) => {
    console.log(`TimePeriod handleDrop: item=${draggedItem.id}, period=${period}, dropIndex=${dropIndex}, dayIndex=${dayIndex}`);
    
    // Convert dropIndex to the correct position in the list
    // - Index 0: drop at the beginning
    // - Index > items.length: drop at the end
    // - Otherwise: drop at that position
    let targetIndex;
    
    if (dropIndex === 0) {
      // Drop at beginning
      targetIndex = 0;
      console.log(`Dropping at beginning (index 0)`);
    } else if (dropIndex > items.length) {
      // Drop at end
      targetIndex = items.length;
      console.log(`Dropping at end (index ${items.length})`);
    } else {
      // Drop between items (proper index accounting for 1-based indices for intermediate zones)
      targetIndex = dropIndex - 1;
      console.log(`Dropping between items at index ${targetIndex}`);
    }
    
    // Call the parent handler with the corrected index
    handleReorderActivity(draggedItem.id, period, targetIndex, dayIndex);
  };

  // Render items with consistent gap drop zones
  const renderItems = () => {
    const elements = [];
    
    // Initial drop zone at the beginning (index 0)
    elements.push(
      <GapDropZone
        key="gap-initial"
        index={0}
        onDrop={(draggedItem, dropIndex) => {
          console.log(`Initial drop zone triggered with index ${dropIndex}`);
          handleDrop(draggedItem, dropIndex);
        }}
        style={{ 
          height: '25px',  // Make initial drop zone slightly larger
          backgroundColor: 'rgba(0, 123, 255, 0.03)' // Very subtle highlight
        }}
      />
    );
    
    // Render each item with a drop zone before it
    items.forEach((item, idx) => {
      // Add drop zone before this item (index idx+1)
      // This ensures we have distinct indices: 0 (initial), 1, 2, 3...
      elements.push(
        <GapDropZone
          key={`gap-before-${idx}`}
          index={idx + 1} // Important: starting with 1, not 0
          onDrop={(draggedItem, dropIndex) => {
            console.log(`Item drop zone ${idx + 1} triggered`);
            handleDrop(draggedItem, dropIndex);
          }}
        />
      );
      
      // Render the item (event or habit)
      if (item.type === 'event') {
        elements.push(
          <DroppableEvent
            key={`event-${item.data.displayId || item.data._id || idx}`}
            event={item.data}
            index={idx}
            period={period}
            dayIndex={dayIndex}
            updateActivityPeriod={updateActivityPeriod}
            handleReorderActivity={handleReorderActivity}
            onEditEvent={onEditEvent}
            onDeleteEvent={onDeleteEvent}
          />
        );
      } else {
        elements.push(
          <DroppableActivity
            key={`habit-${item.data._id || idx}`}
            activity={item.data}
            index={idx}
            period={period}
            dayIndex={dayIndex}
            findDayOffset={findDayOffset}
            updateActivityPeriod={updateActivityPeriod}
            handleReorderActivity={handleReorderActivity}
            toggleHabitCompletion={toggleHabitCompletion}
            completions={completions}
            dateCompletions={dateCompletions}
            justToggled={justToggled}
            isMobileView={isMobileView}
          />
        );
      }
    });
    
    // Add a final drop zone at the end of the list
    // Use items.length + 1 to ensure we don't overlap with other indices
    elements.push(
      <GapDropZone
        key="gap-final"
        index={items.length + 1}
        onDrop={(draggedItem, dropIndex) => {
          console.log(`Final drop zone triggered with index ${dropIndex}`);
          handleDrop(draggedItem, dropIndex);
        }}
        style={{ 
          height: '25px',  // Make final drop zone slightly larger
          backgroundColor: 'rgba(0, 123, 255, 0.03)' // Very subtle highlight
        }}
      />
    );
    
    return elements;
  };

  return (
    <>
      <div className="period-wrapper">
        {/* Period Header (Morning / Afternoon / Evening) */}
        <div className="period-header">{period.toUpperCase()}</div>

        {/* Render all items with consistent drop zones */}
        {renderItems()}
      </div>
    </>
  );
};

export default TimePeriod;
