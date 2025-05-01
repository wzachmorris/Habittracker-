//frontend/src/components/Habits/utils/styles.js

export const habitsStyles = `
/* Custom colors */
.text-purple {
  color: #6f42c1 !important;
}

.bg-purple {
  background-color: #6f42c1 !important;
}

.bg-purple.bg-opacity-10 {
  background-color: rgba(111, 66, 193, 0.1) !important;
}

.weekly-view {
  display: flex;
  position: relative; /* For absolute positioning of today column */
  min-height: 400px;
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
  height: auto; /* Allow it to grow as needed */
  overflow: visible;
  margin-bottom: 40px; /* Extra space at bottom */
  padding-bottom: 20px; /* Extra padding at bottom */
}

/* Custom scrollbar styling */
.weekly-view::-webkit-scrollbar {
  height: 6px;
}

.weekly-view::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.weekly-view::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.weekly-view::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.day-columns-container {
  display: flex;
  width: 100%;
  position: relative;
  min-height: 400px;
  height: auto;
}

/* Weekly view container with navigation arrows */
.weekly-view-container {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
}

/* Navigation arrows */
.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: #495057;
  cursor: pointer;
  z-index: 3;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.nav-arrow:hover:not(:disabled) {
  background-color: #e9ecef;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-50%) scale(1.05);
}

.nav-arrow:active:not(:disabled) {
  transform: translateY(-50%) scale(0.98);
}

.nav-arrow:disabled {
  opacity: 0.5;
  cursor: default;
}

.left-arrow {
  left: -20px;
}

.right-arrow {
  right: -20px;
}

/* Header navigation buttons */
.navigation-btn {
  min-width: 90px;
  border-radius: 20px;
  transition: all 0.2s ease;
  padding: 4px 10px;
}

.navigation-btn:hover:not(:disabled) {
  background-color: #e9ecef;
  transform: scale(1.05);
}

.navigation-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.navigation-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.navigation-arrow {
  font-weight: bold;
}

/* Four day view container */
.four-day-view {
  display: flex;
  width: 100%;
  justify-content: space-between;
  min-height: 400px;
  height: auto; /* Allow it to grow as needed */
  gap: 15px; /* Increased space between columns */
  padding: 10px;
  transition: all 0.3s ease-in-out;
  animation: fadeSwitch 0.4s ease-in-out;
  position: relative; /* For view indicator */
  flex-wrap: nowrap; /* Prevent wrapping */
  align-items: flex-start; /* Allow columns to have different heights */
}

/* Time navigation header */
.time-navigation-header-container {
  max-width: 900px;
  margin: 0 auto 16px;
  animation: fadeIn 0.3s ease-in-out;
}

.time-navigation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 16px;
  color: white;
}

.past-header {
  background-color: #6c757d;
  background-image: linear-gradient(to right, #495057, #6c757d);
}

.current-header {
  background-color: #007bff;
  background-image: linear-gradient(to right, #0062cc, #007bff);
}

.future-header {
  background-color: #17a2b8;
  background-image: linear-gradient(to right, #138496, #17a2b8);
}

.header-title {
  text-align: center;
  flex-grow: 1;
}

.limit-indicator {
  display: block;
  font-size: 0.75rem;
  opacity: 0.9;
  margin-top: 4px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Navigation buttons in header */
.time-navigation-header .navigation-btn {
  background-color: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  min-width: 90px;
  border-radius: 20px;
  transition: all 0.2s ease;
  padding: 4px 10px;
  margin: 0 8px;
}

.time-navigation-header .navigation-btn:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.time-navigation-header .navigation-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.time-navigation-header .navigation-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Today button */
.btn-today {
  background-color: white;
  color: #007bff;
  border-radius: 15px;
  font-weight: 500;
  border: none;
  padding: 3px 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.btn-today:hover {
  background-color: #f8f9fa;
  transform: scale(1.05);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
}

.btn-today:active {
  transform: scale(0.98);
}

/* Container for keeping consistent header height */
.action-button-container {
  height: 26px; /* Match height of button + margin */
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-div {
  height: 24px; /* Match button height */
  visibility: hidden;
}

/* Animation for switching between past and future views */
@keyframes fadeSwitch {
  0% { opacity: 0.7; transform: translateX(5px); }
  100% { opacity: 1; transform: translateX(0); }
}

/* Carousel-like swipe animations */
@keyframes slideInFromRight {
  0% { transform: translateX(100%); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}

@keyframes slideInFromLeft {
  0% { transform: translateX(-100%); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}

@keyframes slideOutToRight {
  0% { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(100%); opacity: 0; }
}

@keyframes slideOutToLeft {
  0% { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(-100%); opacity: 0; }
}

/* Apply animations based on navigation direction */
.four-day-view.slide-left {
  animation: slideInFromRight 0.3s forwards;
}

.four-day-view.slide-right {
  animation: slideInFromLeft 0.3s forwards;
}

/* Today badge in relative offset mode */
.day-name .offset-badge {
  font-size: 0.65rem;
  color: #6c757d;
  margin-left: 5px;
  font-weight: normal;
}

/* Special styling for the day columns */
.day-column {
  border: 1px solid #dee2e6;
  border-radius: 6px;
  overflow: visible;
  background-color: #fff;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  min-height: 400px;
  height: auto; /* Allow it to grow as needed */
  overflow: visible; /* Don't restrict content */
  transition: all 0.3s ease;
  flex: 1 0 0; /* Grow equally, don't shrink, 0 basis */
  width: 0; /* Let flex handle the width */
  min-width: 220px; /* Minimum width */
  max-width: 350px; /* Maximum width */
}

.day-column.today {
  box-shadow: 0 0 15px rgba(0, 123, 255, 0.3);
  border-color: rgba(0, 123, 255, 0.3);
  background: linear-gradient(to bottom, rgba(0, 123, 255, 0.1), transparent 15%);
  background-color: #f8f9ff;
  border: 1px solid rgba(0, 123, 255, 0.3);
  border-radius: 4px;
}

/* Past day column styling */
.day-column.past-day {
  opacity: 0.85;
  background-color: #f9f9f9;
  border: 1px solid #e9e9e9;
  box-shadow: none;
  background-image: linear-gradient(to bottom, rgba(108, 117, 125, 0.05), transparent 15%);
}

.day-header {
  padding: 8px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  text-align: center;
  color: #212529; /* Ensure text is always visible with dark color */
}

.today-header {
  background-color: #28a745;
  color: white;
  padding: 10px 8px;
}

.day-content {
  flex: 1;
  position: relative;
  overflow: visible;
  height: auto;
  display: flex;
  flex-direction: column;
  min-height: 500px;
}

/* Style for day name and date in collapsed columns */
.day-column:not(.today) .day-name,
.day-column:not(.today) .day-date {
  color: #212529; /* Ensure day text is dark and visible in inactive tabs */
  font-weight: 500; /* Slightly bolder text for better visibility */
}

.collapsed-day-summary {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 10px 0;
  text-align: center;
  color: #212529; /* Dark text color for better visibility */
}

/* Day expander controls */
.day-expander-controls {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  gap: 4px;
}

.day-toggle-button {
  flex: 1;
  padding: 4px 8px;
  font-size: 0.8rem;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  transition: all 0.2s;
  cursor: pointer;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.day-toggle-button.expanded {
  background-color: #e9ecef;
  font-weight: 500;
  border-color: #adb5bd;
}

.day-toggle-button.today {
  background-color: #cfe2ff;
  border-color: #9ec5fe;
}

.day-toggle-button.today.expanded {
  background-color: #9ec5fe;
  border-color: #6ea8fe;
}

/* Calendar Event Styles */
.calendar-event {
  background-color: #e9ecef;
  border-left: 3px solid #6c757d;
  padding: 8px 12px;
  border-radius: 4px;
  position: relative;
  cursor: pointer;
  margin-bottom: 12px;
  min-height: 65px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.calendar-event.calendar-source-google {
  border-left-color: #4285F4;
  background-color: rgba(66, 133, 244, 0.1);
}

.calendar-event.calendar-source-apple {
  border-left-color: #5D6A71;
  background-color: rgba(93, 106, 113, 0.1);
}

.calendar-event.calendar-source-outlook {
  border-left-color: #0078D4;
  background-color: rgba(0, 120, 212, 0.1);
}

.calendar-event-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.calendar-event-time {
  font-size: 0.75rem;
  color: #6c757d;
}

.calendar-event-location {
  margin-left: 0.5rem;
}

.calendar-event-recurring {
  font-size: 0.7rem;
  opacity: 0.7;
  margin-top: 4px;
  font-style: italic;
}

/* Time Period Styles */
.time-period-section {
  display: flex;
  flex-direction: column;
  flex: 1 0 auto; /* Allow flex grow, don't shrink, auto basis */
  min-height: 50px;
  height: auto;
  margin-bottom: 20px; /* Increased margin for better separation */
  overflow: visible; /* Ensure content remains visible */
}

.time-period-header {
  position: relative;
  font-weight: bold;
  padding: 8px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.time-period-header .drop-zone-badge {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  padding: 2px 6px;
  background-color: rgba(0, 123, 255, 0.1);
  color: #6c757d;
  border-radius: 10px;
}

.time-period-content {
  display: flex;
  flex-direction: column;
  padding: 10px 8px;
  min-height: 50px;
  gap: 10px; /* Increased gap between items */
  flex: 1 0 auto; /* Allow growing, don't shrink, auto basis */
  overflow: visible; /* Ensure content remains visible */
  height: auto; /* Allow height to adjust to content */
}

/* Activity Card Styles */
.activity-card {
  position: relative;
  transition: all 0.2s ease;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
}

.activity-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.activity-card-header {
  margin-bottom: 4px;
}

.activity-name {
  font-size: 0.95rem;
  font-weight: 500;
}

.activity-card-body {
  font-size: 0.85rem;
}

.activity-duration {
  color: #6c757d;
}

.activity-repeat-days {
  font-size: 0.7rem;
  opacity: 0.8;
  margin-top: 4px;
}

.activity-progress {
  height: 3px;
  width: 100%;
  background-color: rgba(0,0,0,0.05);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 8px;
}

/* Enhanced completion status styling - visual only without text */
.activity-card.completed {
  border-left: 4px solid #28a745 !important;
  background-color: rgba(40, 167, 69, 0.15) !important;
  box-shadow: 0 2px 8px rgba(40, 167, 69, 0.2) !important;
}

.activity-card.missed {
  border-left: 4px solid #dc3545 !important;
  background-color: rgba(220, 53, 69, 0.1) !important;
  opacity: 0.75;
}

/* Add a subtle checkmark pattern in the background for completed items */
.activity-card.completed::after {
  content: '✓';
  position: absolute;
  bottom: 5px;
  right: 8px;
  font-size: 18px;
  color: rgba(40, 167, 69, 0.2);
  font-weight: bold;
  z-index: 0;
}

/* Add subtle visual for missed items */
.activity-card.missed::after {
  content: '✕';
  position: absolute;
  bottom: 5px;
  right: 8px;
  font-size: 18px;
  color: rgba(220, 53, 69, 0.15);
  font-weight: bold;
  z-index: 0;
}

/* Default styling for future (incomplete) activities */
.activity-card:not(.completed):not(.missed) {
  border-left: 4px solid #6c757d !important;
  background-color: rgba(108, 117, 125, 0.05) !important;
}

/* Add a subtle indicator for upcoming activities */
.activity-card:not(.completed):not(.missed)::after {
  content: '•';
  position: absolute;
  bottom: 5px;
  right: 8px;
  font-size: 18px;
  color: rgba(108, 117, 125, 0.2);
  font-weight: bold;
  z-index: 0;
}

/* Add a subtle activity completion animation */
@keyframes completeActivity {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); box-shadow: 0 0 15px rgba(40, 167, 69, 0.3); }
  100% { transform: scale(1); }
}

.activity-card.just-completed {
  animation: completeActivity 0.5s ease-out;
}

/* Drag and Drop Styles */
.draggable-activity {
  cursor: grab;
}

.draggable-activity.dragging {
  opacity: 0.5;
  transform: scale(0.98);
  box-shadow: 0 5px 15px rgba(0,0,0,0.15);
  z-index: 100;
}

/* Animation states for drag and drop */
.refreshing .activity-card {
  animation: cardRefresh 0.3s ease-out;
}

@keyframes cardRefresh {
  0% { background-color: rgba(0, 123, 255, 0.05); }
  50% { background-color: rgba(0, 123, 255, 0.1); }
  100% { background-color: inherit; }
}

/* Active dropping animation */
.activity-dropping .activity-card {
  transition: all 0.25s ease-out;
}

/* Visual indication when hovering over a drop target */
.hovering-activity .drop-target.can-drop {
  background-color: rgba(0, 123, 255, 0.05);
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.3);
}

.drop-target {
  transition: background-color 0.2s;
}

.drop-target.can-drop {
  background-color: rgba(0, 123, 255, 0.1);
}

/* Modal Styles */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-dialog {
  max-width: 500px;
  width: 100%;
  margin: 30px auto;
  z-index: 1051;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 12px 16px;
  border-bottom: 1px solid #dee2e6;
  background-color: #f8f9fa;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  padding: 16px;
  background-color: white;
}

/* Add Event Button */
.add-event-btn {
  font-weight: 500;
  font-size: 0.8rem;
}

.today .add-event-btn {
  background-color: white;
  color: #28a745;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  border: 1px solid white;
  padding: 4px 12px;
}

/* Empty State */
.no-activities {
  padding: 20px;
  text-align: center;
  color: #6c757d;
  font-style: italic;
}

/* Past Day Activities */
.past-day-activity {
  opacity: 0.8;
  cursor: default !important;
  background-color: rgba(108, 117, 125, 0.1) !important;
  box-shadow: none !important;
  border-color: rgba(108, 117, 125, 0.3) !important;
}

.past-day-activity:hover {
  transform: none !important;
  box-shadow: none !important;
}

/* Responsive Styles */
@media (max-width: 768px) {
  .four-day-view {
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px;
  }
  
  .day-column {
    width: 48% !important;
    flex: 0 0 48% !important;
    margin-bottom: 10px;
  }
  
  .day-column:not(.expanded):not(.today) {
    width: 50px !important;
  }
  
  /* Responsive header */
  .time-navigation-header {
    padding: 10px;
  }
  
  .time-navigation-header .navigation-btn {
    min-width: 60px;
    padding: 3px 6px;
    font-size: 0.75rem;
    margin: 0 4px;
  }
  
  .header-title h5 {
    font-size: 0.95rem;
  }
  
  .btn-today {
    font-size: 0.75rem;
    padding: 2px 10px;
  }
  
  .action-button-container {
    height: 24px; /* Slightly smaller for mobile */
  }
  
  .placeholder-div {
    height: 22px;
  }
  
  .time-period-content {
    padding: 6px 4px;
    gap: 6px;
  }
  
  .activity-card {
    font-size: 0.85rem;
    padding: 6px;
  }
  
  .activity-card-header {
    margin-bottom: 3px;
  }
  
  .activity-name {
    font-size: 0.8rem;
  }
  
  .activity-card-body {
    font-size: 0.7rem;
  }
  
  .day-toggle-button {
    padding: 3px 4px;
    font-size: 0.7rem;
  }
}

@media (max-width: 576px) {
  .four-day-view {
    flex-direction: column;
  }
  
  .day-column {
    width: 100% !important;
    margin-bottom: 10px;
  }
  
  /* Very small screen header adjustments */
  .time-navigation-header {
    flex-direction: column;
    padding: 8px;
    gap: 8px;
  }
  
  .time-navigation-header .navigation-btn {
    width: 100%;
    margin: 4px 0;
    order: 2;
  }
  
  .header-title {
    order: 1;
    margin-bottom: 8px;
  }
  
  .time-navigation-header .navigation-btn:first-child {
    order: 3;
  }
  
  .header-title h5 {
    font-size: 0.9rem;
  }
}

/* Activity Indicators for condensed view */
.activity-indicator {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  text-align: center;
  line-height: 20px;
  font-size: 12px;
  margin: 2px;
}

.activity-indicator.completed {
  background-color: rgba(40, 167, 69, 0.2);
  color: #28a745;
}

.activity-indicator.missed {
  background-color: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}

/* Time Slotted View */
.time-slotted-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: auto;
  min-height: 500px;
}

/* Today Badge */
.today-badge {
  margin-left: 5px;
  font-size: 10px;
  background-color: #007bff;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
}
  .drop-zone {
  height: 10px;
  margin: 4px 0;
  border-radius: 4px;
  background-color: transparent;
  transition: all 0.3s ease;
}

.drop-zone:hover, .drop-zone.can-drop-period {
  height: 15px;
  background-color: rgba(0, 123, 255, 0.15);
  box-shadow: 0 0 4px rgba(0, 123, 255, 0.2);
}

.can-drop-period {
  background-color: rgba(0, 123, 255, 0.15);
}

/* Improved visual feedback for drag interactions */
body.hovering-activity .droppable-event-container {
  box-shadow: 0 0 5px #007bff;
  transform: scale(1.01);
}

body.hovering-gap .drop-zone {
  background-color: rgba(40, 167, 69, 0.15);
  height: 15px;
}

body.hovering-event .calendar-event {
  transform: scale(1.01);
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.2);
  transition: all 0.2s;
}

body.activity-dropping .period-wrapper {
  background-color: rgba(40, 167, 69, 0.05);
  transition: background-color 0.5s;
}

body.event-dropping .calendar-event {
  transform: scale(1.02);
  box-shadow: 0 0 10px rgba(0, 123, 255, 0.3);
  transition: all 0.3s;
}

body.gap-dropping .drop-zone {
  background-color: rgba(40, 167, 69, 0.3);
  height: 18px;
  transition: all 0.5s;
}

/* Make droppable containers more obvious */
.droppable-event-container {
  transition: all 0.2s;
  border-radius: 6px;
  padding: 4px;
}

.droppable-event-container.can-drop-period {
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.4);
  background-color: rgba(0, 123, 255, 0.08);
}
.period-wrapper {
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 6px 10px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.period-header {
  font-weight: 600;
  font-size: 0.85rem;
  margin-bottom: 4px;
  padding: 2px 4px;
  color: #333;
}

  
  /* ... rest of the CSS from the original file ... */
`;

export default habitsStyles;