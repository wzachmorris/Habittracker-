//frontend/src/components/Habits/index.js

// Re-export components for easier imports elsewhere
// Container components
export { default as DayColumn } from './Containers/DayColumn';
export { default as TimePeriod } from './Containers/TimePeriod';
export { default as AllDayEvents } from './Containers/AllDayEvents';

// Drag and Drop components
export { default as DraggableHabit } from './DragAndDrop/DraggableHabit';
export { default as DroppableSection } from './DragAndDrop/DroppableSection';
export { default as DroppableTimeSlot } from './DragAndDrop/DroppableTimeSlot';

// UI components
export { default as NavigationHeader } from './UI/NavigationHeader';
export { default as CalendarEvent } from './UI/CalendarEvent';
export { default as EventFormModal } from './UI/EventFormModal';

// View components
export { default as TodayView } from './Views/TodayView';
export { default as FutureDayView } from './Views/FutureDayView';
export { default as PastDayView } from './Views/PastDayView';

// Main Page Component
export { default as HabitsPage } from './Pages/HabitsPage';