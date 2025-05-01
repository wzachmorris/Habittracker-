import React from 'react';

function ActivityCard({ 
  activity, 
  isCompleted = false, 
  isToday = true, 
  onEdit, 
  onDelete, 
  onToggleComplete, 
  index,
  isSelected = false
}) {
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };
  
  const handleToggleComplete = () => {
    // Only allow toggling completion if viewing today
    if (isToday && onToggleComplete) {
      onToggleComplete(activity._id);
    }
  };
  
  // Selection styles instead of drag and drop
  
  // Calculate card height based on duration - completely linear scale from 5 to 90 minutes
  const getCardStyle = () => {
    const durationInMinutes = parseInt(activity.duration);
    
    // Make minimum height enough for name, duration label and larger buttons
    const minHeight = 100; // Further increased minimum height for larger text and better tap targets
    
    // Use a simple linear scale from 5 to 90 minutes
    const maxDuration = 90; // Maximum expected duration in minutes
    const maxHeight = 280; // Maximum height for the longest activity (90 minutes)
    
    // Calculate the pixels per minute
    const durationRange = maxDuration - 5; // From 5 to 90 minutes
    const heightRange = maxHeight - minHeight; // From minHeight to maxHeight
    const pixelsPerMinute = heightRange / durationRange;
    
    // Linear formula: y = mx + b
    // where m is pixelsPerMinute, x is (duration - 5), and b is minHeight
    let calculatedHeight = minHeight + (durationInMinutes - 5) * pixelsPerMinute;
    
    // Cap at the maximum height in case of activities longer than our max
    calculatedHeight = Math.min(calculatedHeight, maxHeight);
    
    return {
      height: `${calculatedHeight}px`,
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
      opacity: 1,
      cursor: 'pointer',
      borderLeft: isSelected ? '5px solid #007bff' : 'none',
      backgroundColor: isSelected ? 'rgba(0, 123, 255, 0.1)' : undefined
    };
  };
  
  // Open activity detail directly
  const openActivityDetail = () => {
    // Store the activity in localStorage to pass data between tabs
    localStorage.setItem('currentActivity', JSON.stringify(activity));
    // Open activity detail page directly using the correct route format
    window.open(`/activities/${activity._id}`, '_blank');
  };

  // Check if activity has visible notes (only recurring and next session notes count)
  const hasNotes = () => {
    const todayIndex = new Date().getDay();
    
    // Only check for recurring and next session notes - these are the only ones visible on the card
    const hasRecurringNotes = activity.recurringNotes && 
      activity.recurringNotes[todayIndex] && 
      activity.recurringNotes[todayIndex].trim().length > 0;
      
    const hasNextNotes = activity.nextSessionNotes && 
      activity.nextSessionNotes[todayIndex] && 
      activity.nextSessionNotes[todayIndex].trim().length > 0;
    
    return hasRecurringNotes || hasNextNotes;
  };
  
  // Get the recurring notes for today
  const getRecurringNotes = () => {
    if (!activity.recurringNotes) return null;
    
    const todayIndex = new Date().getDay();
    const recurringNote = activity.recurringNotes[todayIndex];
    
    if (!recurringNote || recurringNote.trim().length === 0) return null;
    
    return recurringNote;
  };
  
  // Get the next session notes for today - with added check for LocalStorage
  const getNextSessionNotes = () => {
    const todayIndex = new Date().getDay();
    
    // IMPORTANT: This block adds a critical fallback to get the most up-to-date data
    // Try to get the latest activity data from localStorage if it exists
    try {
      // ATTEMPT 1: Check localStorage for currentActivity
      const storedActivity = localStorage.getItem('currentActivity');
      if (storedActivity) {
        const parsedActivity = JSON.parse(storedActivity);
        if (parsedActivity._id === activity._id && parsedActivity.nextSessionNotes) {
          const nextNoteFromStorage = parsedActivity.nextSessionNotes[todayIndex];
          if (nextNoteFromStorage && nextNoteFromStorage.trim().length > 0) {
            return nextNoteFromStorage;
          }
        }
      }
      
      // ATTEMPT 2: Check sessionStorage for direct backup
      const sessionStorageKey = `next_session_note_${activity._id}_${todayIndex}`;
      const sessionNote = sessionStorage.getItem(sessionStorageKey);
      if (sessionNote && sessionNote.trim().length > 0) {
        return sessionNote;
      }

      // ATTEMPT 3: Check if refresh was triggered
      if (sessionStorage.getItem('refresh_activities') === 'true') {
        // Clear the flag
        sessionStorage.removeItem('refresh_activities');
        // Force a re-render by triggering a refresh
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
      
    } catch (e) {
      console.error("Error checking storage:", e);
    }
    
    // If we didn't find anything in localStorage, continue with the original logic
    // Check if there's any next session notes object
    if (!activity.nextSessionNotes) {
      return null;
    }
    
    // Get the next note for today
    const nextNote = activity.nextSessionNotes[todayIndex];
    
    // Check if it's empty
    if (!nextNote || nextNote.trim().length === 0) {
      return null;
    }
    
    return nextNote;
  };
  
  // Define the deep green color that complements blue
  const deepGreen = '#1e7e34'; // Deeper green that pairs well with Bootstrap blue
  
  // Get appropriate card styling based on completion status
  const getCardBackgroundStyle = () => {
    if (isCompleted) {
      return {
        backgroundColor: 'rgba(40, 167, 69, 0.1)', // Light green for completed
        borderTop: '2px solid #28a745',
        borderBottom: '2px solid #28a745'
      };
    } else {
      return {
        backgroundColor: 'rgba(0, 123, 255, 0.05)', // Light blue for not completed
        borderTop: '2px solid transparent',
        borderBottom: '2px solid transparent'
      };
    }
  };

  return (
    <div 
      className={`card mb-3 position-relative card-main ${isSelected ? 'selected' : ''} ${isCompleted ? 'completed' : 'not-completed'}`} 
      style={getCardStyle()}
    >
      <div className="card-body-container">
        <div className="d-flex w-100 h-100">
          {/* Button group at left - Open and Check buttons side by side */}
          <div className="button-container touch-friendly-btns">
            {/* Open activity button (blue arrow) */}
            <button 
              className="open-button touch-target activity-btn"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                openActivityDetail();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              title="Open activity details"
            >
              →
            </button>
            
            {/* Check button */}
            <button 
              className={`check-button touch-target activity-btn ${isCompleted ? 'completed' : 'not-completed'} ${!isToday ? 'disabled' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleToggleComplete();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              title={
                !isToday 
                  ? "Completion can only be marked for today" 
                  : (isCompleted ? 'Mark as incomplete' : 'Mark as complete')
              }
              disabled={!isToday}
            >
              ✓
              {!isToday && (
                <div className="check-disabled-overlay">
                  <span className="check-disabled-slash">/</span>
                </div>
              )}
            </button>
          </div>
          
          {/* Activity info in the middle */}
          <div className="activity-info">
            <div className={`activity-title ${isCompleted ? 'completed' : ''}`}>
              {activity.name} {hasNotes() && window.location.pathname === '/activities' && (
                <span title="Has reminders or notes for today" style={{ color: '#0056b3', fontSize: '0.9rem' }}>
                  {activity.nextSessionNotes && activity.nextSessionNotes[new Date().getDay()] ? 
                    "🔔 📝" : // Show both icons when next session notes exist
                    "🔔"      // Show just bell for recurring notes
                  }
                </span>
              )}
            </div>
            <div className={`activity-time ${isCompleted ? 'completed' : ''}`}>
              {formatDuration(activity.duration)}
            </div>
            
            {/* Notes container - only show on Activities page */}
            {window.location.pathname === '/activities' && (
              <div className="notes-container">
                {/* Recurring Notes Container */}
                {getRecurringNotes() && (
                  <div className="recurring-note-style">
                    <span title={getRecurringNotes()}>
                      ✨ {getRecurringNotes()}
                    </span>
                  </div>
                )}
                
                {/* Next session notes */}
                {getNextSessionNotes() && (
                  <div className="next-session-note-style">
                    <span title={getNextSessionNotes()} data-testid="next-session-note">
                      → {getNextSessionNotes()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Edit and Delete buttons on the right */}
          <div className="button-container touch-friendly-btns">
            <button 
              className="edit-button touch-target activity-btn"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onEdit(activity);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              title="Edit activity"
            >
              ✎
            </button>
            <button 
              className="delete-button touch-target activity-btn"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (window.confirm(`Delete "${activity.name}"?`)) {
                  onDelete(activity._id);
                }
              }}
              onMouseDown={(e) => e.stopPropagation()}
              title="Delete activity"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActivityCard;