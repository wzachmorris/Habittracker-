import React, { useState, useEffect } from 'react';
import { fetchActivities, processNextSessionNotes, createActivity, updateActivity } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { usePreviewMode } from '../../context/PreviewModeContext';
import { useTranslation } from 'react-i18next';
import ActivityList from '../ActivityList';
import ActivityForm from '../ActivityForm';
import Header from '../Header';
import BottomNavigation from '../BottomNavigation';
import { Toast, ToastContainer, Alert, Button, ButtonGroup } from 'react-bootstrap';
import PageWrapper from '../PageWrapper';
import './styles/ActivityControls.css';

function HomePage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [completions, setCompletions] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [moveInProgress, setMoveInProgress] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(0);
  
  const { user } = useAuth();
  const { isPreviewMode, requestLogin } = usePreviewMode();
  const { t } = useTranslation('common');
  
  const userId = user?.userId || 'guest';
  const userName = isPreviewMode ? 'there' : (user?.name || 'there');
  
  // Generate array of dates for the week centered on today
  const generateWeekDays = () => {
    const today = new Date();
    const weekDays = [];
    
    // Add previous 3 days
    for (let i = 3; i > 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      weekDays.push(date);
    }
    
    // Add today
    weekDays.push(today);
    
    // Add next 3 days
    for (let i = 1; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      weekDays.push(date);
    }
    
    return weekDays;
  };
  
  useEffect(() => {
    // Check if we need to reset completions because the date changed
    const today = new Date().toISOString().split('T')[0];
    const lastSyncDate = localStorage.getItem('completions_last_sync_date');
    
    if (lastSyncDate && lastSyncDate !== today) {
      console.log(`[HomePage] Date changed from ${lastSyncDate} to ${today}. Resetting completions.`);
      // Clear localStorage completions when day changes
      localStorage.setItem('completions', JSON.stringify({}));
      setCompletions({});
    }
    
    // Always mark current date as last sync date
    localStorage.setItem('completions_last_sync_date', today);
    
    // Load activities from server (source of truth)
    loadActivities();
    
    // Expose modal function globally if needed
    window.openActivityModal = openModal;
    
    return () => {
      window.openActivityModal = null; // Clean up
    };
  }, [userId, selectedDate]); // Added selectedDate to dependency array
  
  // Keep the selected activity in sync after activities are updated
  useEffect(() => {
    if (selectedActivity) {
      // Find the activity in the updated activities array
      const updatedActivity = activities.find(a => a._id === selectedActivity._id);
      if (updatedActivity) {
        console.log(`[HomePage] Syncing selected activity: ${updatedActivity.name} (${updatedActivity._id})`);
        // Update the selected activity reference
        setSelectedActivity(updatedActivity);
      } else {
        console.warn(`[HomePage] Selected activity no longer exists in activities array: ${selectedActivity._id}`);
      }
    }
  }, [activities]);
  
  // Debug log for activities changes
  // Log activity updates (but now we use the database instead of localStorage)
  useEffect(() => {
    if (activities.length > 0) {
      console.log(`[HomePage] Activities updated: ${activities.length} activities loaded`);
      
      // Group by period
      const byPeriod = {
        morning: activities.filter(a => a.period === 'morning').length,
        afternoon: activities.filter(a => a.period === 'afternoon').length,
        evening: activities.filter(a => a.period === 'evening').length
      };
      
      console.log(`[HomePage] Activities by period:`, byPeriod);
      
      // Log order values
      const orderSummary = {};
      activities.forEach((activity) => {
        if (!orderSummary[activity.period]) {
          orderSummary[activity.period] = [];
        }
        
        orderSummary[activity.period].push({
          id: activity._id,
          name: activity.name,
          order: activity.order !== undefined ? activity.order : 0
        });
      });
      
      // Sort and log for debugging
      Object.keys(orderSummary).forEach(period => {
        orderSummary[period].sort((a, b) => a.order - b.order);
        console.log(`[HomePage] ${period} activities order:`, 
          orderSummary[period].map(a => `${a.name} (${a.order})`).join(', '));
      });
    }
  }, [activities, user?.userId]);
  
  const loadActivities = async () => {
    setLoading(true);
    try {
      // Fetch activities for the logged in user
      const data = await fetchActivities(userId);
      console.log('[loadActivities] Raw activities from server:', data.map(a => ({
        id: a._id,
        name: a.name,
        period: a.period,
        order: a.order
      })));
      
      // Process next session notes
      // Wrap in try/catch to handle any issues with individual activities
      const processedActivities = await Promise.all(
        data.map(async (activity) => {
          try {
            // The server should already have order values now
            // If any activity doesn't have an order yet, assign a default
            if (activity.order === undefined) {
              console.warn(`[loadActivities] Activity ${activity.name} has no order value, assigning default`);
              activity.order = 0;
            }
            
            return await processNextSessionNotes(activity);
          } catch (err) {
            console.error(`Error processing activity ${activity._id}:`, err);
            return activity; // Return original activity on error
          }
        })
      );
      
      // Sort activities by period
      const periodOrder = {'morning': 1, 'afternoon': 2, 'evening': 3};
      
      // Debug log of pre-sorted activities with order values
      console.log('[loadActivities] Activities before sorting:', processedActivities.map(a => ({
        id: a._id,
        name: a.name,
        period: a.period,
        order: a.order
      })));
      
      const sortedActivities = [...processedActivities].sort((a, b) => {
        if (periodOrder[a.period] !== periodOrder[b.period]) {
          return periodOrder[a.period] - periodOrder[b.period];
        }
        // If any order is undefined, use a clientside calculation based on position
        if (a.order === undefined || b.order === undefined) {
          // Log this once to avoid spamming the console
          if (!window._orderWarningLogged) {
            console.warn(`[loadActivities] Server did not return order field, using clientside ordering`);
            window._orderWarningLogged = true;
          }
          
          // Use the _id for stable sorting if order is missing
          return a._id.localeCompare(b._id);
        }
        return (a.order || 0) - (b.order || 0);
      });
      
      // Debug log of sorted activities
      console.log('[loadActivities] Activities after sorting by period and order:', sortedActivities.map(a => ({
        id: a._id,
        name: a.name,
        period: a.period,
        order: a.order
      })));
      
      setActivities(sortedActivities);
      
      // Initialize completions from database with selected date
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      
      // Create a new completions object based on the database values for selected date
      const newCompletions = {};
      sortedActivities.forEach(activity => {
        // Only consider explicit true values as completed
        if (activity.completions && activity.completions[selectedDateStr] === true) {
          newCompletions[activity._id] = true;
        } else {
          // All other cases (false, undefined, non-existent) are considered not completed
          newCompletions[activity._id] = false;
        }
      });
      
      console.log(`[HomePage] Setting completions for ${selectedDateStr}:`, newCompletions);
      setCompletions(newCompletions);
      localStorage.setItem('completions', JSON.stringify(newCompletions));
      
      setError(null);
    } catch (err) {
      console.error('Error loading activities:', err);
      setError('Failed to load activities. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const openModal = (activity = null) => {
    if (isPreviewMode) {
      requestLogin('Please login or create an account to add or edit habits');
      return;
    }
    setCurrentActivity(activity);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setCurrentActivity(null);
    setIsModalOpen(false);
  };

  // Helper function to check if selected date is today
  const isSelectedDateToday = () => {
    const today = new Date();
    return selectedDate.toDateString() === today.toDateString();
  };
  
  // Activity manipulation functions for the new controls
  const handleMoveActivity = async (direction) => {
    if (!selectedActivity || moveInProgress) return;
    
    try {
      setMoveInProgress(true);
      console.log(`Moving activity "${selectedActivity.name}" ${direction}...`);
      
      // Store the ID of the activity being moved so we can reselect it
      const activityId = selectedActivity._id;
      const activityName = selectedActivity.name;
      
      // Get all activities in this period, sorted by order
      const periodActivities = activities
        .filter(a => a.period === selectedActivity.period)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      
      console.log(`Found ${periodActivities.length} activities in ${selectedActivity.period} period`);
      
      // Find current index
      const currentIndex = periodActivities.findIndex(a => a._id === activityId);
      console.log(`Current index: ${currentIndex}`);
      if (currentIndex === -1) return;
      
      // Determine new index based on direction
      let newIndex = currentIndex;
      if (direction === 'up' && currentIndex > 0) {
        newIndex = currentIndex - 1;
      } else if (direction === 'down' && currentIndex < periodActivities.length - 1) {
        newIndex = currentIndex + 1;
      } else {
        // Can't move further in this direction
        console.log(`Can't move ${direction} (at ${currentIndex === 0 ? 'top' : 'bottom'} already)`);
        setMoveInProgress(false);
        return;
      }
      
      console.log(`Moving from position ${currentIndex} to ${newIndex}`);
      
      // If new index is different, perform the reorder operation
      if (currentIndex !== newIndex) {
        const success = await handleReorderActivity(activityId, selectedActivity.period, newIndex);
        console.log(`Reorder result: ${success ? 'Success' : 'Failed'}`);
        
        if (success) {
          // Show success message
          setToast({ 
            show: true, 
            message: `${activityName} moved ${direction}`, 
            type: 'success' 
          });
          
          // The activity will be automatically reselected by the useEffect that watches activities
        }
      }
    } catch (err) {
      console.error('Error moving activity:', err);
      setToast({ show: true, message: 'Failed to move activity', type: 'danger' });
    } finally {
      setMoveInProgress(false);
    }
  };
  
  // Simple period change without specifying target index (for button use)
  const handleChangePeriod = async (newPeriod) => {
    if (!selectedActivity || selectedActivity.period === newPeriod || moveInProgress) return;
    
    // Pass to the full handler with -1 as a special index meaning "append to end"
    return handleMovePeriod(selectedActivity._id, newPeriod, -1);
  };
  
  // Full-featured period change with target index for drag & drop
  const handleMovePeriod = async (activityId, newPeriod, targetIndex = -1) => {
    if (moveInProgress) {
      console.log(`[handleMovePeriod] Another move operation is in progress, skipping this request`);
      return false;
    }
    
    try {
      setMoveInProgress(true);
      
      // Find the activity to be moved
      const activity = activities.find(a => a._id === activityId);
      if (!activity) {
        console.error(`[handleMovePeriod] Activity ${activityId} not found`);
        return false;
      }
      
      const oldPeriod = activity.period;
      const activityName = activity.name;
      
      console.log(`[handleMovePeriod] Moving "${activityName}" from ${oldPeriod} to ${newPeriod} at index ${targetIndex}...`);
      
      // Get the activities in the target period, sorted by order
      const targetPeriodActivities = activities
        .filter(a => a.period === newPeriod)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      
      // Clone these activities for order recalculation
      const updatedTargetActivities = [...targetPeriodActivities];
      
      // Update the activity itself in memory first for immediate feedback
      activity.period = newPeriod;
      
      // Determine the new order value based on targetIndex
      let newOrder = 0;
      
      if (targetIndex === -1 || targetIndex >= updatedTargetActivities.length) {
        // Add to the end of the target period
        newOrder = (updatedTargetActivities.length > 0)
          ? ((updatedTargetActivities[updatedTargetActivities.length - 1].order || 0) + 10)
          : 0;
        
        // Also add to the end of the updatedTargetActivities array
        updatedTargetActivities.push(activity);
      } else {
        // Insert at the specific position
        if (targetIndex === 0) {
          // Insert at beginning - use a value lower than the first item
          newOrder = ((updatedTargetActivities[0]?.order || 0) - 10);
        } else {
          // Insert in the middle - use average of surrounding items
          const prevOrder = updatedTargetActivities[targetIndex - 1]?.order || 0;
          const nextOrder = updatedTargetActivities[targetIndex]?.order || prevOrder + 10;
          newOrder = prevOrder + Math.floor((nextOrder - prevOrder) / 2);
        }
        
        // Insert the activity at the target position
        updatedTargetActivities.splice(targetIndex, 0, activity);
      }
      
      // Save the activity's new period and order to the server using the proper API function
      console.log(`[handleMovePeriod] Updating activity period and order in database...`);
      
      // Update the moved activity first
      const updateResult = await updateActivity(activityId, {
        ...activity,
        period: newPeriod,
        order: newOrder
      });
      
      if (!updateResult) {
        throw new Error('Failed to move activity to new period');
      }
      
      // Update orders for all other activities in the target period
      const updatePromises = updatedTargetActivities
        .filter(a => a._id !== activityId) // Skip the already updated activity
        .map(async (a, idx) => {
          // Calculate new order based on position
          // We need to account for the activity we just moved
          let activityIndex = idx;
          
          // Fix: This logic was inverted. If our index is after the targetIndex,
          // we should increment the position value.
          if (targetIndex !== -1 && activityIndex >= targetIndex) {
            activityIndex = idx + 1; // Skip over the spot where our moved activity goes
          }
          
          const newActivityOrder = activityIndex * 10;
          
          // Only update if order actually changed
          if (a.order !== newActivityOrder) {
            console.log(`[handleMovePeriod] Updating order for ${a.name} to ${newActivityOrder}`);
            
            try {
              // Update in-memory version immediately for UI
              a.order = newActivityOrder;
              
              // Also update in database
              return updateActivity(a._id, {
                ...a,
                order: newActivityOrder
              });
            } catch (updateErr) {
              console.error(`[handleMovePeriod] Error updating order for ${a.name}:`, updateErr);
              return null;
            }
          }
          return null; // No update needed
        });
      
      // Wait for all updates to complete
      await Promise.allSettled(updatePromises);
      
      // Show success message
      setToast({ show: true, message: `${activityName} moved to ${newPeriod}`, type: 'success' });
      
      // Force a UI refresh by reloading activities
      await loadActivities();
      
      // Keep the activity selected after moving
      const updatedActivity = activities.find(a => a._id === activityId);
      if (updatedActivity) {
        setSelectedActivity(updatedActivity);
      }
      
      // Force a refresh to ensure UI updates
      setRefreshFlag(prev => prev + 1);
      
      return true;
    } catch (err) {
      console.error('[handleMovePeriod] Error changing period:', err);
      setToast({ show: true, message: 'Failed to change time period', type: 'danger' });
      return false;
    } finally {
      setTimeout(() => {
        setMoveInProgress(false);
      }, 300);
    }
  };
  
  const handleReorderActivity = async (activityId, period, newIndex) => {
    if (moveInProgress) {
      console.log(`[handleReorderActivity] Another move operation is in progress, skipping this request`);
      return false;
    }
    
    try {
      setMoveInProgress(true);
      console.log(`[handleReorderActivity] Reordering activity ${activityId} in ${period} to index ${newIndex}`);
      
      // Find the activity to be reordered
      const activity = activities.find(a => a._id === activityId);
      if (!activity) {
        console.error(`Activity ${activityId} not found`);
        return false;
      }
      
      // Get all activities in this period, sorted by order
      const periodActivities = activities
        .filter(a => a.period === period)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      
      console.log(`[handleReorderActivity] Found ${periodActivities.length} activities in period ${period}`);
      console.log(`[handleReorderActivity] Current ordering:`, periodActivities.map(a => ({name: a.name, id: a._id, order: a.order})));
      
      // Find current index
      const currentIndex = periodActivities.findIndex(a => a._id === activityId);
      console.log(`[handleReorderActivity] Current index: ${currentIndex}, target index: ${newIndex}`);
      
      // If activity is not found in this period or it's already at the target index, do nothing
      if (currentIndex === -1 || currentIndex === newIndex) {
        console.log(`[handleReorderActivity] No change needed (current=${currentIndex}, new=${newIndex})`);
        return false;
      }
      
      // Update orders for all affected activities
      const updatedActivities = [...periodActivities];
      const [movedActivity] = updatedActivities.splice(currentIndex, 1);
      updatedActivities.splice(newIndex, 0, movedActivity);
      
      console.log(`[handleReorderActivity] New ordering:`, updatedActivities.map(a => a.name));
      
      // Update order values for all affected activities - we'll write these to the database
      const updatePromises = updatedActivities.map(async (activity, idx) => {
        const newOrder = idx * 10;
        
        try {
          // Update in our activities array to ensure UI updates immediately
          const inMemoryActivity = activities.find(a => a._id === activity._id);
          if (inMemoryActivity) {
            inMemoryActivity.order = newOrder;
          }
          
          // Save each activity's new order to the database
          console.log(`[handleReorderActivity] Saving new order ${newOrder} for activity ${activity.name} to database`);
          
          // Use the updateActivity function from api.js
          return updateActivity(activity._id, {
            ...activity, 
            order: newOrder
          });
        } catch (updateErr) {
          console.error(`[handleReorderActivity] Error saving order for ${activity.name}:`, updateErr);
          return null;
        }
      });
      
      // Execute all updates in parallel
      const results = await Promise.allSettled(updatePromises);
      
      // Count successful updates
      const successCount = results.filter(result => result.status === 'fulfilled').length;
      console.log(`[handleReorderActivity] Successfully updated ${successCount} of ${updatePromises.length} activities in database`);
      
      // Force a re-render by updating the activities state directly
      setActivities(prev => {
        // Create a new array to trigger re-render
        const updated = [...prev];
        
        // Find and update activities with their new order
        updatedActivities.forEach((activity, idx) => {
          const index = updated.findIndex(a => a._id === activity._id);
          if (index !== -1) {
            // Clone the activity to avoid direct state mutation
            updated[index] = { ...updated[index], order: idx * 10 };
          }
        });
        
        return updated;
      });
      
      // Show a success toast
      setToast({ 
        show: true, 
        message: `Activities reordered and saved to database`, 
        type: 'success' 
      });
      
      // Make sure the selected activity stays selected
      setTimeout(() => {
        if (selectedActivity && selectedActivity._id === activityId) {
          // Find the updated version of the selected activity
          const updatedSelectedActivity = activities.find(a => a._id === activityId);
          if (updatedSelectedActivity) {
            // Update the selected activity reference
            setSelectedActivity(updatedSelectedActivity);
          }
        }
        
        // Force a refresh to ensure UI updates
        setRefreshFlag(prev => prev + 1);
      }, 50);
      
      return true;
    } catch (err) {
      console.error('Error reordering activity:', err);
      setToast({ show: true, message: 'Failed to reorder activity', type: 'danger' });
      return false;
    } finally {
      // Make sure to always clear the loading state
      setTimeout(() => {
        setMoveInProgress(false);
      }, 500); // Small delay to ensure UI updates properly
    }
  };

  return (
    <PageWrapper>
      <Header title={t('app.name')} />
      
      {/* Preview mode banner */}
      {isPreviewMode && (
        <Alert variant="info" className="preview-mode-banner">
          <strong>Preview Mode:</strong> You're exploring the app without an account. 
          <div className="mt-2">
            <button 
              className="btn btn-sm btn-primary me-2" 
              onClick={() => requestLogin('Create an account to save your data')}
            >
              Create Account
            </button>
            or continue exploring the app's features.
          </div>
        </Alert>
      )}
      
      {/* Welcome message and Add button */}
      <div className="welcome-container mobile-optimized">
        <div className="welcome-message">
          <h4>{t('welcome.title').split(' ')[0]} {userName}!</h4>
          <p>{t('welcome.subtitle')}</p>
        </div>
        
        <button 
          className="btn btn-primary add-habit-btn touch-target-lg" 
          onClick={() => openModal()}
        >
          + {t('habits.addHabit')}
        </button>
      </div>
      
      {/* Day tabs */}
      <div className="day-tabs-container mobile-friendly-scroll">
        <div className="day-tabs">
          {generateWeekDays().map((date, index) => {
            const isToday = index === 3; // Center position (today)
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = date.getDate();
            const month = date.toLocaleDateString('en-US', { month: 'short' });
            
            return (
              <div 
                key={index}
                className={`day-tab touch-area ${isSelected ? 'active' : ''} ${isToday ? 'today' : ''}`}
                onClick={() => setSelectedDate(date)}
              >
                <div className="day-name">{dayName}</div>
                <div className="day-num">{dayNum}</div>
                {/* Only show month on first day of month or first tab */}
                {(date.getDate() === 1 || index === 0) && (
                  <div className="day-month">{month}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Activity Control Panel removed - using drag and drop instead */}
      
      {error && (
        <div className="alert alert-danger">{error}</div>
      )}
      
      <div className="main-content container px-0">
        {loading ? (
          <div className="text-center my-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">{t('common.loading')}</span>
            </div>
          </div>
        ) : (
          <ActivityList 
            activities={activities.filter(activity => {
              // Get day of week for selected date (0-6, where 0 is Sunday)
              const selectedDay = selectedDate.getDay();
              
              // Show activity if it has no repeatDays or if it's set to repeat on this day
              return !activity.repeatDays || 
                     activity.repeatDays.length === 0 || 
                     activity.repeatDays.includes(selectedDay);
            })} 
            completions={completions}
            isToday={isSelectedDateToday()} // Pass whether selected date is today
            onEdit={openModal}
            selectedActivity={selectedActivity}
            onSelectActivity={setSelectedActivity}
            onReorder={handleReorderActivity} // Pass the reorder function
            onMove={handleChangePeriod} // For basic period changing (for compatibility)
            onMovePeriod={handleMovePeriod} // For advanced period changing with target index
            moveInProgress={moveInProgress} // Pass loading state
            refreshFlag={refreshFlag} // Pass refreshFlag to force re-renders
            onDelete={async (activityId) => {
              try {
                // Delete activity via API
                const token = localStorage.getItem('token');
                const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4001/api'}/activities/${activityId}`, {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token // Add auth token to the request
                  }
                });
                
                if (!response.ok) {
                  throw new Error('Failed to delete activity');
                }
                
                // Show success toast
                setToast({ show: true, message: 'Activity deleted successfully', type: 'success' });
                
                // Clear selected activity if it was the one deleted
                if (selectedActivity && selectedActivity._id === activityId) {
                  setSelectedActivity(null);
                }
                
                // Reload activities
                loadActivities();
              } catch (err) {
                console.error('Error deleting activity:', err);
                setToast({ show: true, message: 'Failed to delete activity', type: 'danger' });
              }
            }}
            onToggleComplete={async (activityId) => {
              // If in preview mode, show login prompt
              if (isPreviewMode) {
                requestLogin('Please login to track your habit completions');
                return;
              }
              
              // Check if selected date is today
              if (!isSelectedDateToday()) {
                setToast({ 
                  show: true, 
                  message: "You can only mark activities complete for today", 
                  type: 'warning' 
                });
                return;
              }
              
              try {
                // Get the activity
                const activity = activities.find(a => a._id === activityId);
                if (!activity) return;
                
                // Get the current completion status from database first
                const selectedDateStr = selectedDate.toISOString().split('T')[0];
                const currentStatus = activity.completions && 
                                      activity.completions[selectedDateStr] !== undefined ? 
                                      !!activity.completions[selectedDateStr] : 
                                      !!completions[activityId];
                
                // The new status is the opposite of current status
                const newStatus = !currentStatus;
                console.log(`[HomePage] Toggling ${activity.name} from ${currentStatus} to ${newStatus}`);
                
                // Update UI state first for immediate feedback (optimistic update)
                setCompletions(prev => ({
                  ...prev,
                  [activityId]: newStatus
                }));
                
                // Save to localStorage with the current date for sync tracking
                const today = new Date().toISOString().split('T')[0];
                localStorage.setItem('completions', JSON.stringify({
                  ...JSON.parse(localStorage.getItem('completions') || '{}'),
                  [activityId]: newStatus
                }));
                localStorage.setItem('completions_last_sync_date', today);
                
                // Toggle completion via API with selected date (source of truth)
                const token = localStorage.getItem('token');
                const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4001/api'}/activities/${activityId}/complete`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token // Add auth token to the request
                  },
                  body: JSON.stringify({
                    userId: user?.userId || localStorage.getItem('userId'),
                    date: selectedDate.toISOString() // Use selected date instead of current date
                  }),
                });
                
                if (!response.ok) {
                  throw new Error('Failed to toggle completion status');
                }
                
                // Get the response to ensure we're in sync with the backend (source of truth)
                const result = await response.json();
                console.log(`[HomePage] Toggle completion response for ${selectedDateStr}:`, result);
                
                // ALWAYS update completion state based on what the server says
                if (result && result.completion) {
                  const serverStatus = result.completion.completed;
                  
                  // Update our UI state to match server state
                  setCompletions(prev => ({
                    ...prev,
                    [activityId]: serverStatus
                  }));
                  
                  // Update localStorage to match server state
                  const storedCompletions = JSON.parse(localStorage.getItem('completions') || '{}');
                  storedCompletions[activityId] = serverStatus;
                  localStorage.setItem('completions', JSON.stringify(storedCompletions));
                  
                  console.log(`[HomePage] Synced with server: ${activity.name} is now ${serverStatus ? 'completed' : 'not completed'}`);
                  
                  // Also update the activity in our activities array to keep it in sync
                  setActivities(prevActivities => {
                    return prevActivities.map(act => {
                      if (act._id === activityId) {
                        // Create a new completions object if it doesn't exist
                        const updatedCompletions = { ...(act.completions || {}) };
                        updatedCompletions[selectedDateStr] = serverStatus;
                        return { ...act, completions: updatedCompletions };
                      }
                      return act;
                    });
                  });
                }
                
                // Show success message based on server status
                const serverStatus = result?.completion?.completed;
                setToast({ 
                  show: true, 
                  message: `${activity.name} marked as ${serverStatus ? 'complete' : 'incomplete'}`, 
                  type: 'success' 
                });
              } catch (err) {
                console.error('Error toggling completion status:', err);
                setToast({ show: true, message: 'Failed to update completion status', type: 'danger' });
                
                // Find the activity again because we need it for error handling
                const activity = activities.find(a => a._id === activityId);
                if (!activity) {
                  console.error('Activity not found for reverting optimistic update');
                  return;
                }
                
                // Revert the optimistic update if the API call fails
                // Go back to the original status from database
                const selectedDateStr = selectedDate.toISOString().split('T')[0];
                const originalStatus = activity.completions && 
                                      activity.completions[selectedDateStr] !== undefined ? 
                                      !!activity.completions[selectedDateStr] : 
                                      false;
                
                // Revert UI state
                setCompletions(prev => ({
                  ...prev,
                  [activityId]: originalStatus
                }));
                
                // Revert localStorage
                const storedCompletions = JSON.parse(localStorage.getItem('completions') || '{}');
                storedCompletions[activityId] = originalStatus;
                localStorage.setItem('completions', JSON.stringify(storedCompletions));
                
                console.log(`[HomePage] Error during toggle - reverted ${activity.name} to ${originalStatus ? 'completed' : 'not completed'}`);
              }
            }}
          />
        )}
      </div>
      
      {isModalOpen && (
        <ActivityForm 
          activity={currentActivity} 
          onClose={closeModal}
          onSave={async (activity) => {
            try {
              if (activity._id) {
                // Update existing activity
                await updateActivity(activity._id, activity);
              } else {
                // Create new activity
                await createActivity({
                  ...activity,
                  userId: user?.userId || localStorage.getItem('userId')
                });
              }
              // Reload activities
              await loadActivities();
            } catch (err) {
              console.error('Error saving activity:', err);
              setError('Failed to save activity');
            }
          }}
        />
      )}
      
      <ToastContainer position="bottom-end" className="p-3">
        <Toast 
          show={toast.show} 
          onClose={() => setToast({ ...toast, show: false })}
          delay={3000}
          autohide
          bg={toast.type}
        >
          <Toast.Header>
            <strong className="me-auto">Notification</strong>
          </Toast.Header>
          <Toast.Body className={toast.type === 'danger' ? 'text-white' : ''}>
            {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </PageWrapper>
  );
}

export default HomePage;