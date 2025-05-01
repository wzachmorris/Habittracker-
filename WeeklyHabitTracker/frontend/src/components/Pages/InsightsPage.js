// /frontend/src/components/Pages/InsightsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { fetchActivities } from '../../services/api';
import PageWrapper from '../PageWrapper';
import { useAuth } from '../../context/AuthContext';
import EventBus from '../../utils/eventBus';
import { useTranslation } from 'react-i18next';

function InsightsPage() {
  const { t } = useTranslation();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completionData, setCompletionData] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [masterStreak, setMasterStreak] = useState({ current: 0, longest: 0 });
  const [perfectDaysCount, setPerfectDaysCount] = useState({ month: 0, year: 0, total: 0 });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Get user ID from authentication
  const { user } = useAuth();
  const userId = user?.userId || localStorage.getItem('userId');
  
  // Calculate actual completion data based on database values
  const calculateActualCompletionData = useCallback((habitsList) => {
    console.log('[InsightsPage] Starting completion data calculation');
    
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const newCompletionData = {};
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    console.log(`[InsightsPage] Today's date: ${todayStr}`);
    console.log(`[InsightsPage] Selected month/year: ${selectedMonth + 1}/${selectedYear}`);
    
    // Generate data for each day in the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth, day);
      
      // Skip future dates
      if (date > today) {
        continue;
      }
      
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const dayOfWeek = date.getDay();
      
      console.log(`[InsightsPage] Processing date: ${dateString} (day of week: ${dayOfWeek})`);
      
      // Get all habits that existed on this date
      const activeHabits = habitsList.filter(habit => {
        if (!habit.createdAt) return false;
        
        // Normalize dates for comparison (remove time part)
        const habitCreationDate = new Date(habit.createdAt);
        habitCreationDate.setHours(0, 0, 0, 0);
        
        const dateToCompare = new Date(date);
        dateToCompare.setHours(0, 0, 0, 0);
        
        return habitCreationDate <= dateToCompare;
      });
      
      if (activeHabits.length === 0) {
        // No active habits on this day
        newCompletionData[dateString] = {
          totalHabits: 0,
          completedHabits: 0,
          completionPercentage: 0,
          isPerfectDay: false
        };
        console.log(`[InsightsPage] No active habits on ${dateString}`);
        continue;
      }
      
      // Count completed habits for this date
      let completedCount = 0;
      
      // For better debugging, log active habits and their completion status
      const habitsStatus = [];
      
      activeHabits.forEach(habit => {
        // Check if habit was completed on this day based on database values
        // IMPORTANT: We now check for explicit true OR if the entry exists and is not false
        let isCompleted = habit.completions && 
                         habit.completions[dateString] === true;
        
        habitsStatus.push({
          id: habit._id,
          name: habit.name,
          completed: isCompleted
        });
        
        if (isCompleted) {
          completedCount++;
        }
      });
      
      console.log(`[InsightsPage] Date ${dateString}: ${completedCount}/${activeHabits.length} habits completed`);
      console.log('[InsightsPage] Habits status:', habitsStatus);
      
      // Calculate completion percentage
      const completionPercentage = Math.round((completedCount / activeHabits.length) * 100);
      const isPerfectDay = completionPercentage === 100;
      
      newCompletionData[dateString] = {
        totalHabits: activeHabits.length,
        completedHabits: completedCount,
        completionPercentage,
        isPerfectDay
      };
      
      if (isPerfectDay) {
        console.log(`[InsightsPage] PERFECT DAY FOUND: ${dateString}`);
      }
    }
    
    setCompletionData(newCompletionData);
    console.log('[InsightsPage] Calculated completion data for', Object.keys(newCompletionData).length, 'days');
  }, [selectedMonth, selectedYear]);
  
  // Calculate perfect days count (month, year, total)
  const calculatePerfectDaysCount = useCallback(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let monthCount = 0;
    let yearCount = 0;
    let totalCount = 0;
    
    // Iterate through all dates in completion data
    Object.entries(completionData).forEach(([dateStr, data]) => {
      if (data.isPerfectDay) {
        // Check if date is in the current month
        const date = new Date(dateStr);
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
          monthCount++;
        }
        
        // Check if date is in the current year
        if (date.getFullYear() === currentYear) {
          yearCount++;
        }
        
        totalCount++;
      }
    });
    
    setPerfectDaysCount({
      month: monthCount,
      year: yearCount,
      total: totalCount
    });
    
    console.log(`[InsightsPage] Perfect days: ${monthCount} this month, ${yearCount} this year, ${totalCount} total`);
  }, [completionData]);
  
  // Calculate the master streak (super streak)
  const calculateMasterStreak = useCallback((habitsList) => {
    // Only calculate if we have habits
    if (habitsList.length === 0) return;
    
    // Get all dates from the last 100 days for checking
    const dates = [];
    for (let i = 0; i < 100; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    // Map of dates to active habits count and completed habits count
    const completionMap = {};
    
    // Initialize the map with all dates
    dates.forEach(date => {
      completionMap[date] = { active: 0, completed: 0 };
    });
    
    // For each habit, check which dates it should be active on and which dates it was completed
    habitsList.forEach(habit => {
      dates.forEach(dateStr => {
        const date = new Date(dateStr);
        
        // Skip days before the habit was created
        const habitCreationDate = habit.createdAt ? new Date(habit.createdAt) : new Date();
        habitCreationDate.setHours(0, 0, 0, 0);
        
        const dateToCompare = new Date(date);
        dateToCompare.setHours(0, 0, 0, 0);
        
        if (dateToCompare < habitCreationDate) {
          return;
        }
        
        // This habit was active on this day
        completionMap[dateStr].active++;
        
        // Check if habit was completed on this day
        let isCompleted = habit.completions && 
                          habit.completions[dateStr] === true;
        
        if (isCompleted) {
          completionMap[dateStr].completed++;
        }
      });
    });
    
    // Calculate current streak
    let currentStreak = 0;
    let i = 0;
    const today = dates[0];
    
    // First, handle today - if there are active habits today and we've completed all of them
    if (completionMap[today].active > 0) {
      if (completionMap[today].completed === completionMap[today].active) {
        // All habits completed today
        currentStreak = 1;
      } else if (completionMap[today].completed > 0) {
        // At least some habits completed today (partial credit)
        // Don't count as streak day but don't break streak either
        // We'll check yesterday next
      } else {
        // No habits completed today - streak is 0
        currentStreak = 0;
        // But we'll still check previous days for historical streaks
      }
    }
    
    // Check previous days until streak is broken
    i = 1; // Start with yesterday
    let streakActive = true;
    
    while (i < dates.length && streakActive) {
      const date = dates[i];
      
      // If no active habits on this day, skip it (don't break streak)
      if (completionMap[date].active === 0) {
        i++;
        continue;
      }
      
      // If all active habits were completed, continue streak
      if (completionMap[date].completed === completionMap[date].active) {
        if (i > 0 || completionMap[today].completed === completionMap[today].active) {
          // Only increment streak if either today is complete or we're not on today
          currentStreak++;
        }
        i++;
      } else {
        // Streak is broken
        streakActive = false;
      }
    }
    
    // Calculate longest streak
    let longest = 0;
    let current = 0;
    
    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      
      // If no habits active on this day, skip it (don't count but don't break streak)
      if (completionMap[date].active === 0) {
        continue;
      }
      
      // If all active habits were completed, continue/start streak
      if (completionMap[date].active > 0 && 
          completionMap[date].completed === completionMap[date].active) {
        current++;
        longest = Math.max(longest, current);
      } else {
        // Streak is broken
        current = 0;
      }
    }
    
    // Store master streak information
    const newMasterStreak = {
      current: currentStreak,
      longest: Math.max(longest, parseInt(localStorage.getItem('longest-master-streak') || '0'))
    };
    
    setMasterStreak(newMasterStreak);
    console.log(`[InsightsPage] Master streak: current=${currentStreak}, longest=${newMasterStreak.longest}`);
    
    // Save longest streak to localStorage for historical purposes
    localStorage.setItem('longest-master-streak', newMasterStreak.longest.toString());
  }, []);
  
  // Function to load habits and calculate insights
  const loadHabitsAndCalculateInsights = useCallback(async () => {
    setLoading(true);
    try {
      console.log('[InsightsPage] Loading habits and calculating insights');
      
      const allActivities = await fetchActivities(userId);
      console.log(`[InsightsPage] Fetched ${allActivities.length} activities from API`);
      
      // Filter only habits
      const habits = allActivities.filter(activity => activity.isHabit);
      
      // Log each habit and its completions for debugging
      habits.forEach(habit => {
        const completionsCount = habit.completions ? Object.keys(habit.completions).length : 0;
        console.log(`[InsightsPage] Habit ${habit.name} (${habit._id}) has ${completionsCount} completions in database`);
        if (completionsCount > 0) {
          console.log(`[InsightsPage] Completion dates:`, Object.keys(habit.completions));
        }
      });
      
      setHabits(habits);
      
      // Calculate completion data based on actual completions
      calculateActualCompletionData(habits);
      calculateMasterStreak(habits);
      
      console.log(`[InsightsPage] Loaded ${habits.length} habits and calculated insights`);
    } catch (err) {
      console.error('[InsightsPage] Error loading habits:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, calculateActualCompletionData, calculateMasterStreak]);
  
  // Calculate perfect days count whenever completionData changes
  useEffect(() => {
    calculatePerfectDaysCount();
  }, [completionData, calculatePerfectDaysCount]);
  
  // Set up event listeners when component mounts
  useEffect(() => {
    console.log('[InsightsPage] Setting up event listeners');
    
    loadHabitsAndCalculateInsights();
    
    // Make the loadInsights function available globally for direct calls
    window.reloadInsightsPage = () => {
      console.log('[InsightsPage] Direct reload called');
      setRefreshTrigger(prev => prev + 1);
    };
    
    // Subscribe to activity completion events using EventBus
    const unsubscribeCompletion = EventBus.subscribe('activity-completion-changed', (data) => {
      console.log('[InsightsPage] Received activity-completion-changed event:', data);
      setRefreshTrigger(prev => prev + 1);
    });
    
    // Also listen for activity created/updated/deleted events
    const unsubscribeCreated = EventBus.subscribe('activity-created', () => {
      console.log('[InsightsPage] Received activity-created event');
      setRefreshTrigger(prev => prev + 1);
    });
    
    const unsubscribeUpdated = EventBus.subscribe('activity-updated', () => {
      console.log('[InsightsPage] Received activity-updated event');
      setRefreshTrigger(prev => prev + 1);
    });
    
    const unsubscribeDeleted = EventBus.subscribe('activity-deleted', () => {
      console.log('[InsightsPage] Received activity-deleted event');
      setRefreshTrigger(prev => prev + 1);
    });
    
    // Also listen for DOM events for backward compatibility
    const handleHabitUpdated = () => {
      console.log('[InsightsPage] Received habit-updated DOM event');
      setRefreshTrigger(prev => prev + 1);
    };
    
    window.addEventListener('habit-updated', handleHabitUpdated);
    window.addEventListener('force-reload-insights', handleHabitUpdated);
    
    // Clean up event listeners
    return () => {
      console.log('[InsightsPage] Removing event listeners and global functions');
      window.reloadInsightsPage = null;
      unsubscribeCompletion();
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
      window.removeEventListener('habit-updated', handleHabitUpdated);
      window.removeEventListener('force-reload-insights', handleHabitUpdated);
    };
  }, [userId, selectedMonth, selectedYear, loadHabitsAndCalculateInsights]);
  
  // Watch for refresh trigger
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadHabitsAndCalculateInsights();
    }
  }, [refreshTrigger, loadHabitsAndCalculateInsights]);
  
  // Helper to get months list
  const getMonths = () => {
    return [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
  };
  
  // Get appropriate emoji for streak count
  const getMasterStreakEmoji = (count) => {
    if (count >= 30) return '🏆'; // Trophy for 30+ days
    if (count >= 21) return '🔥🔥🔥'; // Triple flame for 21+ days
    if (count >= 14) return '🔥🔥'; // Double flame for 14+ days
    if (count >= 7) return '🔥'; // Single flame for 7+ days
    if (count >= 3) return '✨'; // Sparkles for 3+ days
    if (count >= 1) return '🌱'; // Seedling for 1+ days
    return '⭐'; // Star for 0
  };
  
  // Get emoji for perfect day
  const getPerfectDayEmoji = () => {
    return '🌟'; // Gold star for perfect days
  };
  
  // Helper to get days of week
  const getDaysOfWeek = () => {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  };
  
  // Get all days in current month with their proper position in calendar grid
  const getDaysInMonth = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();
    
    const days = [];
    
    // Add empty cells for days before the 1st of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };
  
  // Function to get the color for a day based on completion percentage
  const getDayColor = (day) => {
    if (!day) return 'bg-light'; // Empty cell
    
    const date = new Date(selectedYear, selectedMonth, day);
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const data = completionData[dateString];
    if (!data || data.totalHabits === 0) return 'bg-light'; // No data or no active habits for this day
    
    const percentage = data.completionPercentage;
    
    // Perfect day gets a special gold-tinted background
    if (percentage === 100) return 'bg-warning bg-opacity-25 border-warning';
    
    if (percentage >= 90) return 'bg-success text-white';
    if (percentage >= 75) return 'bg-success bg-opacity-75 text-white';
    if (percentage >= 60) return 'bg-success bg-opacity-50';
    if (percentage >= 40) return 'bg-success bg-opacity-25';
    if (percentage >= 20) return 'bg-success bg-opacity-10';
    if (percentage > 0) return 'bg-light border-success';
    
    return 'bg-light'; // 0% completion
  };
  
  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };
  
  const handleNextMonth = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Don't allow navigating beyond current month
    if (selectedYear === currentYear && selectedMonth >= currentMonth) {
      return;
    }
    
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };
  
  // Debug function to log completion data for specific date
  const debugDateData = (day) => {
    if (!day) return;
    
    const date = new Date(selectedYear, selectedMonth, day);
    const dateString = date.toISOString().split('T')[0];
    
    console.log(`Debug data for ${dateString}:`, {
      completionData: completionData[dateString],
      habits: habits.map(h => ({
        id: h._id,
        name: h.name,
        createdAt: h.createdAt,
        completions: h.completions ? (h.completions[dateString] ? 'Completed' : 'Not completed') : 'No completions',
        dayOfWeek: date.getDay(),
        repeatDays: h.repeatDays,
        isActiveToday: !h.repeatDays || h.repeatDays.includes(date.getDay())
      }))
    });
  };
  
  // Force a refresh of insights data
  const handleRefreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  return (
    <PageWrapper>
      <div className="container mt-4 main-content">
        {/* Welcome Container */}
        <div className="welcome-container mb-4">
          <div className="welcome-message">
            <h4>{t('insights.title')}</h4>
            <p>{t('insights.extendedDescription')}</p>
          </div>
          
          <button 
            className="btn btn-primary"
            onClick={handleRefreshData}
            title="Refresh data from database"
          >
            <i className="bi bi-arrow-clockwise me-1"></i> {t('insights.refreshData')}
          </button>
        </div>
        
        {loading ? (
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            <div className="card mb-4">
              <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">{t('insights.calendar')}</h5>
                  <div className="month-navigator">
                    <button 
                      className="btn btn-sm btn-outline-secondary"
                      onClick={handlePreviousMonth}
                    >
                      ← {t('insights.previous')}
                    </button>
                    <span className="mx-3">
                      {getMonths()[selectedMonth]} {selectedYear}
                    </span>
                    <button 
                      className="btn btn-sm btn-outline-secondary"
                      onClick={handleNextMonth}
                      disabled={selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear()}
                    >
                      {t('insights.next')} →
                    </button>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <p className="text-muted">
                  {t('insights.calendarDescription')}
                </p>
                
                {/* Calendar Grid - Modified to only show relevant days */}
                <div className="calendar-container">
                  {/* Day headers removed as requested */}
                  
                  <div className="habit-calendar">
                    {getDaysInMonth().map((day, index) => {
                      if (day === null) {
                        // Skip empty cells at the beginning of the month
                        return null;
                      }
                      
                      const date = new Date(selectedYear, selectedMonth, day);
                      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
                      const data = completionData[dateString];
                      
                      // Skip days with no habit data
                      if (!data || data.totalHabits === 0) {
                        return null;
                      }
                      
                      const cellColor = getDayColor(day);
                      const isPerfectDay = data && data.isPerfectDay;
                      
                      // Display the day of week alongside the date
                      const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
                      
                      return (
                        <div key={`day-${day}`} className="habit-day-card mb-2">
                          <div 
                            className={`day-cell ${cellColor} text-center border ${isPerfectDay ? 'perfect-day' : ''}`}
                            onClick={() => debugDateData(day)}
                          >
                            <div className="day-header">
                              <span className="day-date">{day}</span>
                              <span className="day-name">{dayOfWeek}</span>
                            </div>
                            <div className="completion-indicator">
                              {isPerfectDay ? (
                                <div className="perfect-indicator">{getPerfectDayEmoji()}</div>
                              ) : null}
                              <div className="percentage-value">{data.completionPercentage}%</div>
                              <div className="small">{data.completedHabits}/{data.totalHabits}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Legend */}
                <div className="mt-4">
                  <h6>Completion Legend:</h6>
                  <div className="d-flex align-items-center flex-wrap">
                    <div className="d-flex align-items-center me-3 mb-2">
                      <div className="badge bg-light border-success me-1" style={{width: '20px', height: '20px'}}></div>
                      <small>1-20%</small>
                    </div>
                    <div className="d-flex align-items-center me-3 mb-2">
                      <div className="badge bg-success bg-opacity-10 me-1" style={{width: '20px', height: '20px'}}></div>
                      <small>20-40%</small>
                    </div>
                    <div className="d-flex align-items-center me-3 mb-2">
                      <div className="badge bg-success bg-opacity-25 me-1" style={{width: '20px', height: '20px'}}></div>
                      <small>40-60%</small>
                    </div>
                    <div className="d-flex align-items-center me-3 mb-2">
                      <div className="badge bg-success bg-opacity-50 me-1" style={{width: '20px', height: '20px'}}></div>
                      <small>60-75%</small>
                    </div>
                    <div className="d-flex align-items-center me-3 mb-2">
                      <div className="badge bg-success bg-opacity-75 text-white me-1" style={{width: '20px', height: '20px'}}></div>
                      <small>75-90%</small>
                    </div>
                    <div className="d-flex align-items-center me-3 mb-2">
                      <div className="badge bg-success text-white me-1" style={{width: '20px', height: '20px'}}></div>
                      <small>90-99%</small>
                    </div>
                    <div className="d-flex align-items-center mb-2">
                      <div className="badge bg-warning bg-opacity-25 border-warning me-1" style={{width: '20px', height: '20px'}}></div>
                      <small>100% {getPerfectDayEmoji()}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Monthly summary */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">{t('insights.monthlySummary', { month: getMonths()[selectedMonth], year: selectedYear })}</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <div className="border rounded p-3 text-center">
                      <h6 className="text-muted">{t('insights.averageCompletion')}</h6>
                      <h3 className="mb-0">
                        {(() => {
                          const values = Object.values(completionData).filter(data => data.totalHabits > 0);
                          if (values.length === 0) return '0%';
                          
                          const sum = values.reduce((acc, data) => acc + data.completionPercentage, 0);
                          return `${Math.round(sum / values.length)}%`;
                        })()}
                      </h3>
                      <small className="text-muted">{t('insights.sinceTracking')}</small>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="border rounded p-3 text-center">
                      <h6 className="text-muted">
                        {t('insights.perfectDays')} {getPerfectDayEmoji()}
                      </h6>
                      <h3 className="mb-0">
                        {Object.values(completionData).filter(data => 
                          data.totalHabits > 0 && data.completionPercentage === 100
                        ).length}
                      </h3>
                      <small className="text-muted">{t('insights.allCompleted')}</small>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="border rounded p-3 text-center">
                      <h6 className="text-muted">{t('insights.totalDays')}</h6>
                      <h3 className="mb-0">
                        {Object.values(completionData).filter(data => data.totalHabits > 0).length}
                      </h3>
                      <small className="text-muted">{t('insights.daysWithHabits')}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Perfect Days Stats Card */}
            <div className="card mb-4">
              <div className="card-header bg-warning bg-opacity-10">
                <h5 className="mb-0">{getPerfectDayEmoji()} {t('insights.perfectDaysStats')}</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <div className="border rounded p-3 text-center">
                      <h6 className="text-muted">{t('insights.thisMonth')}</h6>
                      <h3 className="mb-0">{perfectDaysCount.month}</h3>
                      <small className="text-muted">{t('insights.perfectDays')} - {getMonths()[new Date().getMonth()]}</small>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="border rounded p-3 text-center">
                      <h6 className="text-muted">{t('insights.thisYear')}</h6>
                      <h3 className="mb-0">{perfectDaysCount.year}</h3>
                      <small className="text-muted">{t('insights.perfectDays')} - {new Date().getFullYear()}</small>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="border rounded p-3 text-center">
                      <h6 className="text-muted">{t('insights.allTime')}</h6>
                      <h3 className="mb-0">{perfectDaysCount.total}</h3>
                      <small className="text-muted">{t('insights.perfectDays')}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Perfect Streak Card */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">{t('insights.streak')}</h5>
              </div>
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <div className="streak-emoji me-3" style={{ fontSize: '2.5rem' }}>
                    {getMasterStreakEmoji(masterStreak.current)}
                  </div>
                  <div>
                    <div className="d-flex justify-content-between align-items-baseline">
                      <h2 className="mb-0">
                        {masterStreak.current} {masterStreak.current === 1 ? t('common.day') : t('common.days')}
                      </h2>
                      <div className="text-muted ms-3">
                        {t('insights.best')}: {masterStreak.longest} {masterStreak.longest === 1 ? t('common.day') : t('common.days')}
                      </div>
                    </div>
                    <p className="text-muted">
                      {t('insights.streakDescription')}
                    </p>
                  </div>
                </div>
                
                <div className="progress mb-2" style={{ height: '8px' }}>
                  <div 
                    className="progress-bar bg-success" 
                    style={{ width: `${Math.min(100, (masterStreak.current / 30) * 100)}%` }}
                  ></div>
                </div>
                
                <div className="text-end">
                  <span className="badge bg-light text-dark">
                    {masterStreak.current >= 30 
                      ? t('insights.streakLevels.champion') 
                      : masterStreak.current >= 21 
                        ? t('insights.streakLevels.expert') 
                        : masterStreak.current >= 14 
                          ? t('insights.streakLevels.intermediate') 
                          : masterStreak.current >= 7 
                            ? t('insights.streakLevels.consistent') 
                            : masterStreak.current >= 3 
                              ? t('insights.streakLevels.building') 
                              : masterStreak.current >= 1 
                                ? t('insights.streakLevels.started') 
                                : t('insights.streakLevels.waiting')
                    }
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
      <style jsx="true">{`
        /* New calendar layout styles */
        .habit-calendar {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: flex-start;
          /* Reduced gap for a more compact layout */
        }
        
        .calendar-container {
          padding: 5px;
          /* Add padding to the container for better spacing */
        }
        
        .habit-day-card {
          flex: 0 0 calc(20% - 8px);
          max-width: calc(20% - 8px);
          /* Reduced width to show 5 cards per row with 8px gap */
        }
        
        .day-cell {
          min-height: 80px;
          transition: all 0.2s ease;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          padding: 8px 5px;
          /* More compact padding and reduced height */
        }
        
        .day-cell:hover {
          transform: scale(1.02);
          box-shadow: 0 0 6px rgba(0,0,0,0.1);
          z-index: 10;
        }
        
        .day-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          /* Reduced margin-bottom to make layout more compact */
        }
        
        .day-date {
          font-size: 0.95rem;
          font-weight: bold;
        }
        
        .day-name {
          font-size: 0.75rem;
          opacity: 0.8;
        }
        
        .completion-indicator {
          font-weight: bold;
          font-size: 0.9rem;
          /* Reduced font size for better space usage */
        }
        
        .perfect-day {
          box-shadow: 0 0 8px rgba(255, 193, 7, 0.3);
          transition: all 0.3s ease;
        }
        
        .perfect-day:hover {
          box-shadow: 0 0 12px rgba(255, 193, 7, 0.5);
        }
        
        .perfect-indicator {
          font-size: 1.2rem;
          margin: 0;
          animation: pulse 2s infinite;
          /* Reduced size to take less space */
        }
        
        .percentage-value {
          font-size: 1rem;
          font-weight: bold;
          margin: 2px 0;
          /* More compact size */
        }
        
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
        
        /* Responsive styles */
        @media (min-width: 1200px) {
          .habit-day-card {
            flex: 0 0 calc(16.666% - 8px);
            max-width: calc(16.666% - 8px);
            /* 6 per row on very large screens */
          }
        }
        
        @media (max-width: 1199px) and (min-width: 992px) {
          .habit-day-card {
            flex: 0 0 calc(20% - 8px);
            max-width: calc(20% - 8px);
            /* 5 per row on large screens */
          }
        }
        
        @media (max-width: 991px) and (min-width: 768px) {
          .habit-day-card {
            flex: 0 0 calc(25% - 8px);
            max-width: calc(25% - 8px);
            /* 4 per row on medium screens */
          }
        }
        
        @media (max-width: 767px) and (min-width: 576px) {
          .habit-day-card {
            flex: 0 0 calc(33.333% - 8px);
            max-width: calc(33.333% - 8px);
            /* 3 per row on small screens */
          }
        }
        
        @media (max-width: 575px) {
          .habit-day-card {
            flex: 0 0 calc(50% - 8px);
            max-width: calc(50% - 8px);
            /* 2 per row on very small screens */
          }
          
          .day-cell {
            min-height: 70px;
            padding: 6px 4px;
          }
          
          .day-header {
            margin-bottom: 4px;
          }
          
          .day-date {
            font-size: 0.85rem;
          }
          
          .day-name {
            font-size: 0.7rem;
          }
          
          .completion-indicator {
            font-size: 0.8rem;
          }
          
          .percentage-value {
            font-size: 0.9rem;
            margin: 1px 0;
          }
          
          .perfect-indicator {
            font-size: 1rem;
            margin: 0;
          }
        }
      `}</style>
    </PageWrapper>
  );
}

export default InsightsPage;