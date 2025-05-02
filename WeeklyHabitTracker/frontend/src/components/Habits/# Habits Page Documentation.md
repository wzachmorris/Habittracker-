# Habits Page Documentation

## Overview

The Habits Page is a calendar-like view that combines habits (from HomePage) and events (from CountdownEvents) in a single interface. It allows users to:

1. View habits and events organized by time period (morning, afternoon, evening)
2. Drag and drop habits between time periods on the current day
3. Position habits before, after, or between events
4. Navigate between past, present, and future days
5. Mark habits as complete for the current day
6. Add new events directly from the calendar view
7. See completion of past habits and past events

## Architecture

The HabitsPage follows a modular component architecture designed for maintainability and clear separation of concerns:

```
/components
  /Habits
    /Pages
      HabitsPage.js (main container/router)
    /Views
      PastDayView.js (read-only view for past days)
      TodayView.js (interactive view with drag-and-drop)
      FutureDayView.js (interactive view with local state)
    /DragAndDrop
      DraggableHabit.js (draggable habit component)
      DroppableTimeSlot.js (drop zone for time periods)
      DroppableSection.js (section drop zone)
    /Containers
      DayColumn.js (container for a day column)
      TimePeriod.js (container for morning/afternoon/evening)
      AllDayEvents.js (container for all-day events)
    /UI
      NavigationHeader.js (navigation controls)
      EventFormModal.js (modal for adding/editing events)
      CalendarEvent.js (event display component)
    /utils
      dateUtils.js (date-related utility functions)
      dragUtils.js (drag-and-drop utilities)
      activityUtils.js (habit-related utilities)
```

## Key Concepts

### Data Flow

1. HabitsPage loads activities and events from the API
2. Data is processed and categorized by day and time period
3. Views are rendered based on the navigation mode (past, present, future)
4. User interactions update local state and persist changes to the server
5. Today's view syncs with the database; future days initially synce the loading position of habit from the database, then use local storage

### Time Periods

Activities and events are organized into three time periods:
- **Morning**: 12:00 AM - 11:59 AM
- **Afternoon**: 12:00 PM - 5:59 PM
- **Evening**: 6:00 PM - 11:59 PM

### Day Navigation

- Users can navigate between days using the header controls
- Mobile view shows one day at a time
- Desktop view shows four days at a time (today + 3 future days)
- Navigation modes:
  - Past (Yesterday + 3 days prior) 
  - Present (today and next 3 days)
  - Future (days beyond today + 3)

### Drag and Drop

The drag and drop system allows:
1. Moving habits between time periods
2. Positioning habits relative to events (in between events, in between events and section headers)
3. Reordering habits within the same time period

Drag and drop is implemented using:
- react-dnd for desktop view
- react-dnd-touch-backend for mobile view

### State Management

- **activities**: Habits fetched from the API
- **events**: Events fetched from the API
- **completions**: Tracking habit completion status
- **customDayOrders**: Local storage for custom ordering of future days
- **navigationMode**: Controls which days are displayed

## Integration Points

### API Services

- fetchActivities: Loads habits from the server
- fetchCountdownEvents: Loads events from the server
- toggleActivityCompletion: Marks habits as complete/incomplete
- updateActivity: Updates habit properties (period, order)
- createCountdownEvent: Creates new events
- deleteCountdownEvent: Deletes events

### Integration with Other Pages

- **HomePage**: Habits created on the HomePage appear on the HabitsPage
- **CountdownEvents**: Events created on the CountdownEvents page appear on the HabitsPage

## Usage Examples

### Adding a New Event

```jsx
const handleAddEvent = (dayIndex) => {
  setQuickAddDay(dayIndex);
  setCurrentEvent(null);
  setShowEventForm(true);
};
```

### Marking a Habit as Complete

```jsx
const handleToggleCompletion = async (habitId) => {
  // Update UI optimistically
  setCompletions(prev => ({
    ...prev,
    [habitId]: !prev[habitId]
  }));
  
  // Persist to server
  await toggleActivityCompletion(habitId, userId, new Date());
};
```

### Moving a Habit Between Periods

```jsx
const handleMovePeriod = async (habitId, newPeriod, dayIndex) => {
  // Find the habit
  const habit = activities.find(a => a._id === habitId);
  
  // Update in state
  const updatedHabit = { ...habit, period: newPeriod };
  setActivities(prev => prev.map(a => 
    a._id === habitId ? updatedHabit : a
  ));
  
  // Persist to server for today
  if (dayIndex === todayIndex) {
    await updateActivity(habitId, updatedHabit);
  } else {
    // Store in local state for future days
    setCustomDayOrders(prev => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        [habitId]: { period: newPeriod }
      }
    }));
  }
};
```

## Common Challenges and Solutions

### Challenge: Order values getting out of sync

Solution: Use the `refreshFlag` to force re-renders after drag operations and ensure consistency between the UI and database.

```jsx
const handleReorderActivity = async (habitId, targetPeriod, targetIndex, dayIndex) => {
  // Implementation details...
  
  // Update server and local state
  
  // Force a re-render
  setRefreshFlag(prev => prev + 1);
};
```

### Challenge: Events not appearing in the correct time period

Solution: Always determine the period based on event time using the `determinePeriod` utility:

```jsx
const determinePeriod = (dateString) => {
  const date = new Date(dateString);
  const hour = date.getHours();
  
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};
```

### Challenge: Drag and drop feels unresponsive

Solution: Add visual feedback using CSS transitions and ensure state updates are immediate:

```css
.draggable-habit {
  transition: transform 0.1s ease;
}

.draggable-habit.dragging {
  transform: scale(1.05);
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
  opacity: 0.8;
}

.drop-target.can-drop {
  background-color: rgba(0, 123, 255, 0.1);
  transition: background-color 0.2s ease;
}
```

## Troubleshooting

### Activities not appearing in the correct time period

- Check that the `period` property is set correctly
- Verify that `customDayOrders` is being applied correctly
- Ensure the day navigation is working as expected

### Drag and drop not working

- Verify that the day is not in the past (drag is disabled for past days)
- Check that the DndProvider is wrapping the components
- Ensure the correct backend is being used (HTML5 for desktop, Touch for mobile)

### Events not showing or appearing in wrong periods

- Confirm that the event's time is correctly set
- Verify the `determinePeriod` function is correctly parsing the event time
- Check that the events are being filtered correctly in each view

## Future Improvements

1. Add timeline visualization to visually represent event timing
2. Implement conflict detection for overlapping events
3. Add color-coding for habits based on category
4. Create weekly goal tracking based on habit completion
5. Add habit streak visualization

## Maintenance Notes

- The `refreshFlag` is critical for ensuring UI updates after drag operations
- Custom ordering for future days is stored in `customDayOrders` and localStorage
- Past days are read-only and optimized for performance
- Event modals reuse the same form component as the CountdownEvents page