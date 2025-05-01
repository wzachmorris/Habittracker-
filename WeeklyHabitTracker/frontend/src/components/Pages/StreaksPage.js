// /frontend/src/components/Pages/StreaksPage.js
import React, { useState, useEffect } from 'react';
import { fetchActivities, toggleActivityCompletion } from '../../services/api';
import PageWrapper from '../PageWrapper';
import { useAuth } from '../../context/AuthContext';
import EventBus from '../../utils/eventBus';
import { useTranslation } from 'react-i18next';

function StreaksPage() {
  const { t } = useTranslation();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [streakData, setStreakData] = useState({});
  const [testResults, setTestResults] = useState([]);
  const [testing, setTesting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Get user ID from authentication
  const { user } = useAuth();
  const userId = user?.userId || localStorage.getItem('userId');
  
  useEffect(() => {
    console.log('[StreaksPage] Setting up event listeners');
    loadHabits();
    
    // Make the loadHabits function available globally for direct calls from other components
    window.reloadStreaksPage = () => {
      console.log('[StreaksPage] Direct reload called');
      setRefreshTrigger(prev => prev + 1);
    };
    
    // Subscribe to activity completion events using EventBus
    const unsubscribe = EventBus.subscribe('activity-completion-changed', (data) => {
      console.log('[StreaksPage] Received activity-completion-changed event:', data);
      setRefreshTrigger(prev => prev + 1);
    });
    
    // Also listen for activity created/updated/deleted events
    const unsubscribeCreated = EventBus.subscribe('activity-created', () => {
      console.log('[StreaksPage] Received activity-created event');
      setRefreshTrigger(prev => prev + 1);
    });
    
    const unsubscribeUpdated = EventBus.subscribe('activity-updated', () => {
      console.log('[StreaksPage] Received activity-updated event');
      setRefreshTrigger(prev => prev + 1);
    });
    
    const unsubscribeDeleted = EventBus.subscribe('activity-deleted', () => {
      console.log('[StreaksPage] Received activity-deleted event');
      setRefreshTrigger(prev => prev + 1);
    });
    
    // Also listen for DOM events for backward compatibility
    const handleHabitUpdated = () => {
      console.log('[StreaksPage] Received habit-updated DOM event');
      setRefreshTrigger(prev => prev + 1);
    };
    
    window.addEventListener('habit-updated', handleHabitUpdated);
    window.addEventListener('force-reload-streaks', handleHabitUpdated);
    
    // Listen for localStorage changes to completions
    const handleStorageChange = (e) => {
      if (e.key === 'completions') {
        console.log('[StreaksPage] Detected completions change in localStorage');
        setRefreshTrigger(prev => prev + 1);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Clean up event listeners
    return () => {
      console.log('[StreaksPage] Removing event listeners and global functions');
      window.reloadStreaksPage = null;
      unsubscribe();
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
      window.removeEventListener('habit-updated', handleHabitUpdated);
      window.removeEventListener('force-reload-streaks', handleHabitUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Use a refreshTrigger to force reloads
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadHabits();
    }
  }, [refreshTrigger]);
  
  const loadHabits = async () => {
    setLoading(true);
    try {
      // Get habits from the API to ensure we're showing what's really there
      const allActivities = await fetchActivities(userId);
      
      console.log('[StreaksPage] Fetched activities from API:', allActivities.length);
      
      // Filter only habits
      const habits = allActivities.filter(activity => activity.isHabit);
      
      // Log all habits and their completion data for debugging
      habits.forEach(habit => {
        const completionCount = habit.completions ? 
          Object.entries(habit.completions).filter(([_, isCompleted]) => isCompleted === true).length : 0;
        
        console.log(`[StreaksPage] Habit ${habit.name} (${habit._id}) has ${completionCount} completions`);
        if (habit.completions && Object.keys(habit.completions).length > 0) {
          console.log(`[StreaksPage] All completion entries for ${habit.name}:`, habit.completions);
        }
      });
      
      // Set habits from the API
      setHabits(habits);
      
      // Calculate streak data based on actual completions
      calculateStreakData(habits);
      
      console.log(`[StreaksPage] Loaded ${habits.length} habits from the API`);
    } catch (err) {
      console.error('[StreaksPage] Error loading habits:', err);
      // If we can't reach the API, still show an empty list
      setHabits([]);
    } finally {
      setLoading(false);
    }
  };
  
  const calculateStreakData = (habitsList) => {
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    console.log(`[StreaksPage] Today's date for calculations: ${todayStr}`);
    
    // Calculate real streak data from completions
    const newStreakData = {};
    
    habitsList.forEach(habit => {
      console.log(`[StreaksPage] Processing streak data for habit: ${habit.name} (${habit._id})`);
      
      // Initialize streak data
      const streakData = {
        currentStreak: 0,
        longestStreak: 0,
        lastCompleted: null,
        totalCompletions: 0
      };
      
      // Build a comprehensive list of completion dates from database
      let completedDates = [];
      if (habit.completions) {
        // Only consider dates where completions is EXPLICITLY true (not just present)
        completedDates = Object.entries(habit.completions)
          .filter(([_, isCompleted]) => isCompleted === true)
          .map(([date]) => date);
      }
      
      // Update total completions count
      streakData.totalCompletions = completedDates.length;
      
      // Log the final list of completion dates for debugging
      console.log(`[StreaksPage] Habit ${habit.name} has ${completedDates.length} true completions`);
      if (completedDates.length > 0) {
        console.log(`[StreaksPage] True completion dates for ${habit.name}:`, completedDates);
      }
      
      // If there are completions, set the most recent one and calculate streak
      if (completedDates.length > 0) {
        // Sort dates from newest to oldest
        completedDates.sort((a, b) => new Date(b) - new Date(a));
        
        // Set the most recent completion date
        streakData.lastCompleted = completedDates[0];
        console.log(`[StreaksPage] Last completed date for ${habit.name}: ${streakData.lastCompleted}`);
        
        // Check if habit is completed today
        const isCompletedToday = completedDates.includes(todayStr);
        console.log(`[StreaksPage] Habit ${habit.name} completed today: ${isCompletedToday}`);
        
        // Get yesterday's date string
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        // Check if habit was completed yesterday
        const isCompletedYesterday = completedDates.includes(yesterdayStr);
        console.log(`[StreaksPage] Habit ${habit.name} completed yesterday: ${isCompletedYesterday}`);
        
        // Initialize current streak to 0, we'll calculate it properly
        streakData.currentStreak = 0;
        
        // If completed today, start with streak = 1
        if (isCompletedToday) {
          streakData.currentStreak = 1;
          
          // Check for consecutive days before today
          let checkDate = new Date(yesterday);
          let checking = true;
          
          while (checking) {
            const dateStr = checkDate.toISOString().split('T')[0];
            if (completedDates.includes(dateStr)) {
              // This previous day was completed, increment streak
              streakData.currentStreak++;
              // Move to the day before
              checkDate.setDate(checkDate.getDate() - 1);
            } else {
              // Chain broken
              checking = false;
            }
          }
        } 
        // If not completed today but completed yesterday, streak starts from yesterday
        else if (isCompletedYesterday) {
          streakData.currentStreak = 1;
          
          // Check for consecutive days before yesterday
          let checkDate = new Date(yesterday);
          checkDate.setDate(checkDate.getDate() - 1);
          let checking = true;
          
          while (checking) {
            const dateStr = checkDate.toISOString().split('T')[0];
            if (completedDates.includes(dateStr)) {
              // This previous day was completed, increment streak
              streakData.currentStreak++;
              // Move to the day before
              checkDate.setDate(checkDate.getDate() - 1);
            } else {
              // Chain broken
              checking = false;
            }
          }
        } 
        // If neither today nor yesterday completed, find most recent streak
        else {
          // Most recent completion is not today or yesterday
          // So current streak should be 0 (broken)
          streakData.currentStreak = 0;
          
          // Calculate longest streak from historical data
          let longest = 0;
          let current = 0;
          let sortedDates = [...completedDates].sort((a, b) => new Date(a) - new Date(b));
          
          for (let i = 0; i < sortedDates.length; i++) {
            if (i === 0) {
              current = 1;
            } else {
              const currentDate = new Date(sortedDates[i]);
              const prevDate = new Date(sortedDates[i-1]);
              
              // Check if dates are consecutive
              const diffTime = Math.abs(currentDate - prevDate);
              const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays === 1) {
                current++;
              } else {
                // Reset current streak
                current = 1;
              }
            }
            
            // Update longest streak
            longest = Math.max(longest, current);
          }
          
          // Set longest streak from historical data
          streakData.longestStreak = longest;
        }
        
        // Calculate longest streak
        if (isCompletedToday || isCompletedYesterday) {
          // Get previously stored longest streak from localStorage
          const storedLongestStreak = parseInt(localStorage.getItem(`longestStreak_${habit._id}`) || '0');
          
          // Update longest streak with the maximum of current streak and stored longest streak
          streakData.longestStreak = Math.max(streakData.currentStreak, storedLongestStreak);
          
          // Store the updated longest streak
          localStorage.setItem(`longestStreak_${habit._id}`, streakData.longestStreak.toString());
        }
        
        console.log(`[StreaksPage] Calculated streak for ${habit.name}: current=${streakData.currentStreak}, longest=${streakData.longestStreak}`);
      }
      
      newStreakData[habit._id] = streakData;
      console.log(`[StreaksPage] Final streak for ${habit.name}: current=${streakData.currentStreak}, longest=${streakData.longestStreak}`);
    });
    
    setStreakData(newStreakData);
    localStorage.setItem('habit-streaks', JSON.stringify(newStreakData));
    console.log('[StreaksPage] Updated streak data and saved to localStorage');
  };
  
  // Inside the markHabitComplete function in StreaksPage.js after successful completion:
  const markHabitComplete = async (habitId) => {
    try {
      // Find current completion state
      const habit = habits.find(h => h._id === habitId);
      const today = new Date().toISOString().split('T')[0];
      const isCurrentlyComplete = habit.completions && habit.completions[today] === true;
      
      console.log(`[StreaksPage] ${isCurrentlyComplete ? 'Unmarking' : 'Marking'} habit ${habitId} "${habit.name}" ${isCurrentlyComplete ? 'incomplete' : 'complete'}`);
      
      // Mark as complete using the API
      const result = await toggleActivityCompletion(habitId, userId, new Date());
      
      console.log(`[StreaksPage] Toggled completion result:`, result);
      
      // Force reload
      setRefreshTrigger(prev => prev + 1);
      
      // The EventBus in the API function will take care of notifying components
      return result;
    } catch (error) {
      console.error('[StreaksPage] Error marking habit complete:', error);
      return null;
    }
  };
  
  // Function to get the appropriate streak emoji based on count
  const getStreakEmoji = (count) => {
    if (count >= 100) return '🔥🔥🔥'; // Triple flame for 100+
    if (count >= 50) return '🔥🔥';    // Double flame for 50-99
    if (count >= 25) return '🔥';      // Single flame for 25-49
    if (count >= 10) return '✨';      // Sparkles for 10-24
    if (count >= 5) return '💧';       // Droplet for 5-9
    if (count >= 1) return '🌱';       // Seedling for 1-4
    return '❄️';                      // Snowflake for 0
  };
  
  // Calculate days since creation properly
  const getDaysSinceCreation = (createdAt) => {
    if (!createdAt) return 0;
    
    // Parse both dates
    const creationDate = new Date(createdAt);
    const now = new Date();
    
    // Set both to start of day to compare just the date portions
    creationDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    
    // Calculate difference in days
    const diffTime = now - creationDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  // Check if streak is active (completed within the last day)
  const isStreakActive = (lastCompleted) => {
    if (!lastCompleted) return false;
    
    const lastDate = new Date(lastCompleted);
    const now = new Date();
    
    // Reset hours to compare just the dates
    lastDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    
    // Calculate the difference in days
    const diffTime = now.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Streak is active if completed today or yesterday
    return diffDays <= 1;
  };
  
  // Function to get streak container background color
  const getStreakBackground = (streak, isActive) => {
    if (!isActive) return 'bg-light';
    
    if (streak >= 100) return 'bg-danger bg-opacity-10';
    if (streak >= 50) return 'bg-warning bg-opacity-10';
    if (streak >= 25) return 'bg-success bg-opacity-10';
    if (streak >= 10) return 'bg-info bg-opacity-10';
    
    return 'bg-light';
  };
  
  // Check completion status accurately from the database
  const isHabitCompletedToday = (habit) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Check database for explicit true value
    if (habit.completions && habit.completions[today] === true) {
      return true;
    }
    
    return false;
  };
  
  // Reset ALL activities and habits data and refresh the page
  const resetAllHabits = async () => {
    if (window.confirm("Are you sure you want to erase ALL activities and habits? This cannot be undone.")) {
      setLoading(true);
      
      try {
        // 1. Get all activities from the API
        const allActivities = await fetchActivities(userId);
        
        // 2. Delete ALL activities (both habits and regular activities like "popo")
        const deletePromises = allActivities.map(activity => {
          // Make a DELETE request for each activity
          return fetch(`${process.env.REACT_APP_API_URL || '/api'}/activities/${activity._id}`, {
            method: 'DELETE',
            headers: {
              'x-auth-token': localStorage.getItem('token')
            }
          });
        });
        
        // 3. Wait for all delete operations to complete
        await Promise.all(deletePromises);
        console.log(`[StreaksPage] Deleted ${allActivities.length} activities from the API`);
        
        // 4. Clear ALL activity and habit related data from localStorage
        localStorage.removeItem('habit-streaks');
        localStorage.removeItem('completions');
        localStorage.removeItem('dateCompletions');
        localStorage.removeItem('currentActivity');
        
        // Show success message
        alert(`Successfully deleted ${allActivities.length} activities. The app will now reload.`);
        
        // 5. Reload the page to see changes take effect across the app
        window.location.reload();
      } catch (err) {
        console.error("[StreaksPage] Error deleting activities:", err);
        alert("There was an error deleting activities. Some activities may remain.");
        setLoading(false);
      }
    }
  };

  // Test habit synchronization
  const runSyncTests = async () => {
    setTesting(true);
    setTestResults([]);
    
    try {
      // Step 1: Test if we can fetch habits from the API
      addTestResult('Fetching habits from API...', 'info');
      const apiActivities = await fetchActivities(userId);
      const apiHabits = apiActivities.filter(activity => activity.isHabit);
      addTestResult(`Found ${apiHabits.length} habits in the API`, 'success');
      
      // Step 2: Create a test habit via the API
      addTestResult('Creating a test habit via API...', 'info');
      const testHabit = {
        name: `Test Habit ${Date.now()}`,
        duration: 15,
        period: 'morning',
        userId: userId, 
        isHabit: true,
        repeatDays: [1, 3, 5] // Monday, Wednesday, Friday
      };
      
      const createResponse = await fetch(`${process.env.REACT_APP_API_URL || '/api'}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify(testHabit),
      });
      
      if (!createResponse.ok) {
        throw new Error('Failed to create test habit');
      }
      
      const createdHabit = await createResponse.json();
      addTestResult(`Successfully created test habit "${createdHabit.name}" with ID ${createdHabit._id}`, 'success');
      
      // Mark the habit as complete to test streak functionality
      addTestResult('Marking test habit as complete for today...', 'info');
      await markHabitComplete(createdHabit._id);
      
      // Step 3: Check if localStorage is updated properly when reloading habits
      addTestResult('Testing localStorage synchronization...', 'info');
      await loadHabits();
      
      const storedStreakData = localStorage.getItem('habit-streaks');
      if (!storedStreakData) {
        addTestResult('Failed: habit-streaks not found in localStorage after loadHabits', 'error');
      } else {
        const parsedStreakData = JSON.parse(storedStreakData);
        if (parsedStreakData[createdHabit._id]) {
          addTestResult('Success: New habit correctly added to localStorage streak data', 'success');
          
          if (parsedStreakData[createdHabit._id].currentStreak >= 1) {
            addTestResult('Success: Streak started immediately after first completion', 'success');
          } else {
            addTestResult('Failed: Streak did not start after first completion', 'error');
          }
        } else {
          addTestResult('Failed: New habit not found in localStorage streak data', 'error');
        }
      }
      
      // Step 4: Verify habit appears in UI by reloading
      addTestResult('Testing UI update...', 'info');
      const updatedHabits = await fetchActivities(userId);
      const updatedHabitList = updatedHabits.filter(a => a.isHabit);
      const foundInUI = updatedHabitList.some(h => h._id === createdHabit._id);
      
      if (foundInUI) {
        addTestResult('Success: New habit found in updated habit list', 'success');
      } else {
        addTestResult('Failed: New habit not found in updated habit list', 'error');
      }
      
      // Step 5: Delete the test habit to clean up
      addTestResult('Cleaning up test habit...', 'info');
      const deleteResponse = await fetch(`${process.env.REACT_APP_API_URL || '/api'}/activities/${createdHabit._id}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': localStorage.getItem('token')
        }
      });
      
      if (deleteResponse.ok) {
        addTestResult('Test habit successfully deleted from API', 'success');
      } else {
        addTestResult('Warning: Could not delete test habit', 'warning');
      }
      
      // Final results
      addTestResult('All synchronization tests completed', 'info');
      
    } catch (error) {
      console.error("Test error:", error);
      addTestResult(`Error during testing: ${error.message}`, 'error');
    } finally {
      setTesting(false);
      // Reload habits one more time to ensure clean state
      loadHabits();
    }
  };
  
  const addTestResult = (message, type) => {
    setTestResults(prev => [...prev, { message, type, timestamp: new Date().toISOString() }]);
  };

  return (
    <PageWrapper>
      <div className="container mt-4 main-content">
        {/* Welcome Container */}
        <div className="welcome-container mb-4">
          <div className="welcome-message">
            <h4>{t('streaks.title')}</h4>
            <p>{t('streaks.description')}</p>
          </div>
        </div>
        
        {/* Streak Emoji Legend */}
        <div className="card mb-4">
          <div className="card-header bg-light">
            <h5 className="mb-0">{t('streaks.emojiGuide')}</h5>
          </div>
          <div className="card-body">
            <div className="row text-center g-3">
              <div className="col-4 col-lg-2">
                <div className="border rounded py-2">
                  <div style={{ fontSize: '1.5rem' }}>🌱</div>
                  <div className="small mt-1">{t('streaks.dayRanges.seedling')}</div>
                </div>
              </div>
              <div className="col-4 col-lg-2">
                <div className="border rounded py-2">
                  <div style={{ fontSize: '1.5rem' }}>💧</div>
                  <div className="small mt-1">{t('streaks.dayRanges.droplet')}</div>
                </div>
              </div>
              <div className="col-4 col-lg-2">
                <div className="border rounded py-2">
                  <div style={{ fontSize: '1.5rem' }}>✨</div>
                  <div className="small mt-1">{t('streaks.dayRanges.sparkles')}</div>
                </div>
              </div>
              <div className="col-4 col-lg-2">
                <div className="border rounded py-2">
                  <div style={{ fontSize: '1.5rem' }}>🔥</div>
                  <div className="small mt-1">{t('streaks.dayRanges.flame')}</div>
                </div>
              </div>
              <div className="col-4 col-lg-2">
                <div className="border rounded py-2">
                  <div style={{ fontSize: '1.5rem' }}>🔥🔥</div>
                  <div className="small mt-1">{t('streaks.dayRanges.doubleFlame')}</div>
                </div>
              </div>
              <div className="col-4 col-lg-2">
                <div className="border rounded py-2">
                  <div style={{ fontSize: '1.5rem' }}>🔥🔥🔥</div>
                  <div className="small mt-1">{t('streaks.dayRanges.tripleFlame')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Test Results Section */}
        {testResults.length > 0 && (
          <div className="card mb-4">
            <div className="card-header bg-light">
              <h5 className="mb-0">Synchronization Test Results</h5>
            </div>
            <div className="card-body">
              <div className="test-results" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {testResults.map((result, index) => (
                  <div 
                    key={index} 
                    className={`alert alert-${result.type === 'error' ? 'danger' : 
                              result.type === 'success' ? 'success' : 
                              result.type === 'warning' ? 'warning' : 'info'} py-2 mb-2`}
                  >
                    {result.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            {habits.length > 0 ? (
              <>
                {/* Active Habits Section */}
                <div className="mb-5">
                  <h3 className="mb-3">{t('streaks.yourHabits')}</h3>
                  <div className="row">
                    {habits
                      .map(habit => {
                        const habitStreak = streakData[habit._id] || { 
                          currentStreak: 0, 
                          longestStreak: 0,
                          lastCompleted: null,
                          totalCompletions: 0
                        };
                        
                        const isActive = isStreakActive(habitStreak.lastCompleted);
                        const streakEmoji = getStreakEmoji(habitStreak.currentStreak);
                        const bgColor = getStreakBackground(habitStreak.currentStreak, isActive);
                        
                        // Check if habit is completed today directly from database
                        const isCompletedToday = isHabitCompletedToday(habit);
                        
                        // Calculate days since creation properly
                        const daysSinceCreation = getDaysSinceCreation(habit.createdAt);
                        
                        return (
                          <div className="col-md-6 col-lg-4 mb-4" key={habit._id}>
                            <div className={`card h-100 ${!isActive ? 'border-danger' : ''}`}>
                              <div className={`card-header ${bgColor}`}>
                                <h5 className="card-title mb-0">{habit.name}</h5>
                                <div className="text-muted small">
                                  {habit.duration} min • {habit.period}
                                </div>
                              </div>
                              
                              <div className="card-body text-center">
                                <div className="streak-display mb-3">
                                  <div className="streak-emoji mb-2" style={{ fontSize: '2rem' }}>
                                    {streakEmoji}
                                  </div>
                                  <h2 className="streak-count mb-0">
                                    {habitStreak.currentStreak}
                                    <span className="text-muted h5"> days</span>
                                  </h2>
                                  {!isActive && (
                                    <div className="alert alert-danger py-1 mt-2">
                                      {t('streaks.streakBroken')}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="streak-stats">
                                  <div className="row g-2 text-center">
                                    <div className="col-6">
                                      <div className="border rounded py-2">
                                        <div className="stat-label small text-muted">{t('streaks.longestStreak')}</div>
                                        <div className="stat-value fw-bold">{habitStreak.longestStreak} {t('common.days')}</div>
                                      </div>
                                    </div>
                                    <div className="col-6">
                                      <div className="border rounded py-2">
                                        <div className="stat-label small text-muted">{t('streaks.totalCompletions')}</div>
                                        <div className="stat-value fw-bold">{habitStreak.totalCompletions}</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Add quick completion button */}
                                <div className="mt-3">
                                  <button 
                                    className={`btn ${isCompletedToday ? 'btn-success' : 'btn-outline-primary'} w-100`}
                                    onClick={() => markHabitComplete(habit._id)}
                                  >
                                    {isCompletedToday ? `✓ ${t('streaks.completedToday')}` : t('streaks.markComplete')}
                                  </button>
                                </div>
                              </div>
                              
                              <div className="card-footer bg-white">
                                <div className="d-flex justify-content-between align-items-center small text-muted">
                                  <span>
                                    {t('streaks.startedDaysAgo', { days: daysSinceCreation })}
                                  </span>
                                  <span>
                                    {isActive ? `✅ ${t('streaks.active')}` : `❌ ${t('streaks.inactive')}`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    {habits.length === 0 && (
                      <div className="col-12">
                        <div className="alert alert-info">
                          No active habits found.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="alert alert-info">
                {t('streaks.noHabits')}
              </div>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  );
}

export default StreaksPage;