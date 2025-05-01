import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageWrapper from '../PageWrapper';
import { useAuth } from '../../context/AuthContext';

function ActivityDetailPage() {
  const [searchParams] = useSearchParams(); // eslint-disable-line no-unused-vars
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [notes, setNotes] = useState('');
  const [recurringNotes, setRecurringNotes] = useState('');
  const [nextNotes, setNextNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [editingRecurringNotes, setEditingRecurringNotes] = useState(false);
  const [editingNextNotes, setEditingNextNotes] = useState(false);
  
  // Get user ID from authentication
  const { user } = useAuth();
  const userId = user?.userId || localStorage.getItem('userId');
  const [noteType, setNoteType] = useState('session'); // 'session', 'recurring', or 'next'
  const [currentDayIndex, setCurrentDayIndex] = useState(new Date().getDay()); // Default to today's day index
  const [timer, setTimer] = useState({
    isRunning: false,
    timeLeft: 0,
    initialTime: 0
  });
  
  useEffect(() => {
    // Try to get activity ID from URL params first
    const id = window.location.pathname.split('/').pop();
    
    // Retrieve activity from localStorage (previously stored)
    const storedActivity = localStorage.getItem('currentActivity');
    
    if (!storedActivity) {
      alert('No activity data found');
      navigate('/activities');
      return;
    }
    
    const activityData = JSON.parse(storedActivity);
    
    // If we have an ID from the URL and it doesn't match the stored activity,
    // we should fetch the activity from the API instead
    if (id && activityData._id !== id) {
      // Fetch the activity by ID from the API
      const token = localStorage.getItem('token');
      fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4001/api'}/activities/${id}`, {
        headers: {
          'x-auth-token': token
        }
      })
        .then(response => {
          if (!response.ok) throw new Error('Activity not found');
          return response.json();
        })
        .then(data => {
          setActivity(data);
          // Store it in localStorage for future reference
          localStorage.setItem('currentActivity', JSON.stringify(data));
        })
        .catch(err => {
          console.error('Error fetching activity:', err);
          alert('Error loading activity details');
          navigate('/activities');
        });
    } else {
      // Use the activity from localStorage
      setActivity(activityData);
    }
    
    // Update document title with activity name
    document.title = `${activityData.name} | Habit Tracker`;
    
    // Set initial timer duration (in seconds)
    const durationInSeconds = parseInt(activityData.duration) * 60;
    setTimer({
      isRunning: false,
      timeLeft: durationInSeconds,
      initialTime: durationInSeconds
    });
    
    // Get today's day of week index (0-6, Sunday-Saturday)
    const todayIndex = new Date().getDay();
    setCurrentDayIndex(todayIndex);
    
    // Check if it has day-specific notes
    if (activityData.daySpecificNotes && activityData.notes) {
      // Load the notes for the current day if they exist
      const dayNotes = activityData.notes[todayIndex];
      if (dayNotes) {
        setNotes(dayNotes);
      } else {
        setNotes('');
      }
    } else {
      // For backward compatibility with old notes format
      const savedNotes = localStorage.getItem(`notes_${activityData._id}`);
      if (savedNotes) {
        setNotes(savedNotes);
      }
    }
    
    // Load recurring notes if they exist
    if (activityData.recurringNotes && activityData.recurringNotes[todayIndex]) {
      setRecurringNotes(activityData.recurringNotes[todayIndex]);
    } else {
      setRecurringNotes('');
    }
    
    // Load next session notes if they exist
    if (activityData.nextSessionNotes && activityData.nextSessionNotes[todayIndex]) {
      setNextNotes(activityData.nextSessionNotes[todayIndex]);
    } else {
      setNextNotes('');
    }
    
    // Cleanup function to restore title
    return () => {
      document.title = "Habit Tracker";
    };
  }, [navigate]);
  
  useEffect(() => {
    // Timer functionality
    let interval = null;
    
    if (timer.isRunning && timer.timeLeft > 0) {
      interval = setInterval(() => {
        setTimer(prevTimer => ({
          ...prevTimer,
          timeLeft: prevTimer.timeLeft - 1
        }));
      }, 1000);
    } else if (timer.timeLeft === 0 && timer.isRunning) {
      setTimer(prevTimer => ({
        ...prevTimer,
        isRunning: false
      }));
      
      // Play sound when timer ends
      const audio = new Audio('/timer-done.mp3');
      audio.play().catch(err => console.error('Audio error:', err));
      
      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification('Timer Finished!', {
          body: `Your ${activity?.name} timer is complete`,
          icon: '/favicon.ico'
        });
      }
      
      // Show completion popup with timeout to allow sound to play first
      setTimeout(() => {
        if (window.confirm(`${activity?.name} timer is complete! Would you like to mark this activity as completed and return home?`)) {
          try {
            // Save notes before navigating
            if (notes) {
              localStorage.setItem(`notes_${activity._id}`, notes);
            }
            
            // Save completion status to local storage for the main app to read
            // This serves as a backup in case the API call fails
            const completions = JSON.parse(localStorage.getItem('completions') || '{}');
            completions[activity._id] = true;
            localStorage.setItem('completions', JSON.stringify(completions));
            
            // Try to update the completion status via API using the user ID from above
            // Get auth token for the API call
            const token = localStorage.getItem('token');
            
            // Make sure toggleActivityCompletion uses the token
            fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4001/api'}/activities/${activity._id}/complete`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
              },
              body: JSON.stringify({
                userId,
                date: new Date().toISOString()
              }),
            })
              .then(() => {
                console.log('Activity completion status updated on server');
              })
              .catch(err => {
                console.error('Error updating completion status on server:', err);
                // The local storage approach will still work as backup
              });
            
            // Navigate back to home
            navigate('/');
          } catch (err) {
            console.error('Error marking activity as complete:', err);
            // Still navigate home even if there's an error
            navigate('/');
          }
        }
      }, 500); // Small delay to allow sound to play
    }
    
    return () => clearInterval(interval);
  }, [timer, activity, navigate, notes, userId]);
  
  const handleStartTimer = () => {
    // Request notification permission if needed
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
    
    setTimer(prevTimer => ({
      ...prevTimer,
      isRunning: true
    }));
  };
  
  const handlePauseTimer = () => {
    setTimer(prevTimer => ({
      ...prevTimer,
      isRunning: false
    }));
  };
  
  const handleResetTimer = () => {
    setTimer(prevTimer => ({
      ...prevTimer,
      isRunning: false,
      timeLeft: prevTimer.initialTime
    }));
  };
  
  const handleMarkComplete = async () => {
    try {
      // Save notes before marking complete
      if (notes && activity) {
        localStorage.setItem(`notes_${activity._id}`, notes);
      }
      
      // Save completion status to local storage for the main app to read
      const completions = JSON.parse(localStorage.getItem('completions') || '{}');
      completions[activity._id] = true;
      localStorage.setItem('completions', JSON.stringify(completions));
      
      // Try to update the completion status via API
      // Use the user ID from authentication instead of hardcoded value
      // Get auth token for the API call
      const token = localStorage.getItem('token');
      
      // Make sure toggleActivityCompletion uses the token
      await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4001/api'}/activities/${activity._id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          userId,
          date: new Date().toISOString()
        }),
      });
      
      // Show success message
      alert(`${activity.name} marked as complete!`);
      
      // Navigate back to home
      navigate('/');
    } catch (err) {
      console.error('Error marking activity as complete:', err);
      alert('There was an error marking the activity as complete. Please try again.');
    }
  };
  
  const handleSaveNotes = async () => {
    // Save notes based on activity type
    if (activity) {
      try {
        // Add timestamp to the notes
        const now = new Date();
        const timestamp = `[${now.toLocaleDateString()} ${now.toLocaleTimeString()}]`;
        const timestampedNotes = notes.trim() 
          ? `${timestamp}\n${notes}`
          : `${timestamp}\n(No notes added for this session)`;
        
        if (activity.daySpecificNotes) {
          // For day-specific notes, update the activity's notes object via API
          // Get token for auth
          const token = localStorage.getItem('token');
          
          // Create updated activity with the new notes
          let updatedActivityData = { ...activity };
          // Create or update notes object
          const updatedNotes = { ...(activity.notes || {}) };
          updatedNotes[currentDayIndex] = timestampedNotes;
          updatedActivityData.notes = updatedNotes;
          
          // Update via API directly
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4001/api'}/activities/${activity._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-auth-token': token
            },
            body: JSON.stringify(updatedActivityData),
          });
          
          if (!response.ok) {
            throw new Error('Failed to update activity notes');
          }
          
          const updatedActivity = await response.json();
          
          // Update local state
          setActivity(updatedActivity);
          
          // Store updated activity in localStorage
          localStorage.setItem('currentActivity', JSON.stringify(updatedActivity));
        } else {
          // For regular notes, use the old localStorage method
          localStorage.setItem(`notes_${activity._id}`, timestampedNotes);
        }
        
        setEditingNotes(false); // Exit editing mode after saving
      } catch (error) {
        console.error('Error saving notes:', error);
        alert('Error saving notes. Please try again.');
      }
    }
  };
  
  // Function to toggle day-specific notes feature
  const handleToggleDaySpecificNotes = async () => {
    if (!activity) return;
    
    try {
      const updatedActivity = { 
        ...activity, 
        daySpecificNotes: !activity.daySpecificNotes 
      };
      
      // If enabling day-specific notes, initialize notes object if it doesn't exist
      if (!activity.daySpecificNotes) {
        // Initialize notes object with current notes (if any) for today's day
        const todayIndex = new Date().getDay();
        updatedActivity.notes = { 
          ...(updatedActivity.notes || {}),
          [todayIndex]: notes || '' 
        };
        setCurrentDayIndex(todayIndex);
      } else {
        // Turning OFF day-specific notes - save the current day's notes to the regular notes
        // Store it in localStorage since that's where regular notes are kept
        if (notes) {
          localStorage.setItem(`notes_${activity._id}`, notes);
        }
      }
      
      // Update the activity via API
      // Get token for auth
      const token = localStorage.getItem('token');
      
      // Update via API directly
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4001/api'}/activities/${activity._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(updatedActivity),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update activity');
      }
      
      const result = await response.json();
      
      // Update local state
      setActivity(result);
      localStorage.setItem('currentActivity', JSON.stringify(result));
      
      // If switching to day-specific notes, set notes to the current day's notes
      if (!activity.daySpecificNotes) {
        setNotes(result.notes?.[currentDayIndex] || '');
      } else {
        // If switching to regular notes, load from localStorage
        const savedNotes = localStorage.getItem(`notes_${activity._id}`);
        if (savedNotes) {
          setNotes(savedNotes);
        }
      }
    } catch (error) {
      console.error('Error toggling day-specific notes:', error);
      alert('Error updating activity settings. Please try again.');
    }
  };

  // Function to switch between days for day-specific notes
  const switchDay = async (dayIndex) => {
    if (!activity) return;
    
    // Save all current notes before switching days
    if (editingNotes || editingRecurringNotes || editingNextNotes) {
      try {
        let updatedActivity = { ...activity };
        
        // Save session notes if editing
        if (editingNotes && activity.daySpecificNotes) {
          // Update the notes object
          const updatedNotes = { ...(activity.notes || {}) };
          updatedNotes[currentDayIndex] = notes;
          updatedActivity.notes = updatedNotes;
        }
        
        // Save recurring notes if editing
        if (editingRecurringNotes) {
          // Update the recurring notes object
          const updatedRecurringNotes = { ...(activity.recurringNotes || {}) };
          updatedRecurringNotes[currentDayIndex] = recurringNotes;
          updatedActivity.recurringNotes = updatedRecurringNotes;
        }
        
        // Save next session notes if editing
        if (editingNextNotes) {
          // Update the next session notes object
          const updatedNextNotes = { ...(activity.nextSessionNotes || {}) };
          updatedNextNotes[currentDayIndex] = nextNotes;
          updatedActivity.nextSessionNotes = updatedNextNotes;
        }
        
        // Update the activity via API
        // Get token for auth
        const token = localStorage.getItem('token');
        
        // Update via API directly
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4001/api'}/activities/${activity._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          },
          body: JSON.stringify(updatedActivity),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update activity');
        }
        
        const result = await response.json();
        
        // Update local state
        setActivity(result);
        localStorage.setItem('currentActivity', JSON.stringify(result));
      } catch (error) {
        console.error('Error saving notes during day switch:', error);
        // Continue with switching even if save fails
      }
    }
    
    // Switch to selected day
    setCurrentDayIndex(dayIndex);
    
    // Load notes for the selected day based on the current note type
    if (activity.daySpecificNotes) {
      setNotes(activity.notes?.[dayIndex] || '');
    }
    
    // Load recurring notes
    setRecurringNotes(activity.recurringNotes?.[dayIndex] || '');
    
    // Load next session notes
    setNextNotes(activity.nextSessionNotes?.[dayIndex] || '');
    
    // Exit all editing modes when switching days
    setEditingNotes(false);
    setEditingRecurringNotes(false);
    setEditingNextNotes(false);
  };
  
  const startEditingNotes = () => {
    setEditingNotes(true);
  };
  
  // Functions for recurring notes
  const handleSaveRecurringNotes = async () => {
    if (!activity) return;
    
    try {
      console.log("Saving recurring notes. Current value:", recurringNotes);
      
      // Create a DEEP copy of the activity to avoid reference issues
      const updatedActivity = {
        ...activity,
        notes: { ...(activity.notes || {}) },
        recurringNotes: { ...(activity.recurringNotes || {}) },
        nextSessionNotes: { ...(activity.nextSessionNotes || {}) }
      };
      
      // Update the recurring notes for this day
      updatedActivity.recurringNotes[currentDayIndex] = recurringNotes;
      
      console.log("FULL updated activity object:", updatedActivity);
      console.log("recurringNotes after update:", updatedActivity.recurringNotes);
      console.log("nextSessionNotes preserved:", updatedActivity.nextSessionNotes);
      
      // Update the activity via API
      // Get token for auth
      const token = localStorage.getItem('token');
      
      // Update via API directly
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4001/api'}/activities/${activity._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(updatedActivity),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update activity');
      }
      
      const result = await response.json();
      
      console.log("API result after saving recurring notes:", result);
      
      // Update local state
      setActivity(result);
      localStorage.setItem('currentActivity', JSON.stringify(result));
      
      // Exit editing mode
      setEditingRecurringNotes(false);
      
      // Show success message
      alert(`Recurring note for ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDayIndex]} saved!`);
    } catch (error) {
      console.error('Error saving recurring notes:', error);
      alert('Error saving recurring note. Please try again.');
    }
  };
  
  // Functions for next session notes
  const handleSaveNextNotes = async () => {
    if (!activity) return;
    
    try {
      console.log("Saving next session notes. Current value:", nextNotes);
      
      // Create a DEEP copy of the activity to avoid reference issues
      const updatedActivity = {
        ...activity,
        notes: { ...(activity.notes || {}) },
        recurringNotes: { ...(activity.recurringNotes || {}) },
        nextSessionNotes: { ...(activity.nextSessionNotes || {}) }
      };
      
      // Update the next session notes for this day
      updatedActivity.nextSessionNotes[currentDayIndex] = nextNotes;
      
      console.log("FULL updated activity object:", updatedActivity);
      console.log("nextSessionNotes after update:", updatedActivity.nextSessionNotes);
      console.log("recurringNotes preserved:", updatedActivity.recurringNotes);
      
      // Update the activity via API
      // Get token for auth
      const token = localStorage.getItem('token');
      
      // Update via API directly
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4001/api'}/activities/${activity._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(updatedActivity),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update activity');
      }
      
      const result = await response.json();
      
      console.log("API result after saving next session notes:", result);
      
      // Update local state
      setActivity(result);
      localStorage.setItem('currentActivity', JSON.stringify(result));
      
      // Exit editing mode
      setEditingNextNotes(false);
      
      // Show success message
      alert(`Note for next ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDayIndex]} saved!`);
      
      // Log activity in localStorage for debugging
      console.log("Activity in localStorage after saving:", 
        JSON.parse(localStorage.getItem('currentActivity')));
      
      // Try to force refresh the opener window
      try {
        if (window.opener) {
          console.log("Attempting to refresh opener window");
          window.opener.location.reload();
        }
      } catch (e) {
        console.error("Error refreshing opener:", e);
      }
    } catch (error) {
      console.error('Error saving next session notes:', error);
      alert('Error saving note for next session. Please try again.');
    }
  };
  
  const formatTime = (timeInSeconds) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;
    
    return `${hours > 0 ? `${hours.toString().padStart(2, '0')}:` : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const progressPercentage = timer.timeLeft > 0 ? (timer.timeLeft / timer.initialTime) * 100 : 0;
  
  if (!activity) {
    return <div className="container mt-4 main-content">Loading activity details...</div>;
  }
  
  return (
    <PageWrapper>
      <div className="container mt-4 main-content">
        <div className="row">
          <div className="col-md-12 mb-4">
            {/* Card for activity header */}
            <div className="card mb-3">
              <div className="card-header bg-primary text-white">
                <h4 className="mb-0">{activity.name}</h4>
              </div>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <p className="mb-0">Track your progress, set reminders, and leave notes for future sessions</p>
                  <button 
                    className="btn btn-outline-secondary" 
                    onClick={() => navigate('/activities')}
                  >
                    ← Back to Activities
                  </button>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="card-header bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 text-primary">Activity Details</h5>
                  <span className="badge bg-primary">Duration: {Math.floor(activity.duration / 60)}h {activity.duration % 60}m</span>
                </div>
              </div>
              
              <div className="card-body">
                {/* Timer section - hidden on mobile with d-none d-md-block */}
                <div className="timer-section mb-4 d-none d-md-block">
                  <h3>Timer</h3>
                  <div className="progress mb-3" style={{ height: '30px' }}>
                    <div 
                      className="progress-bar bg-primary" 
                      role="progressbar" 
                      style={{ width: `${progressPercentage}%` }}
                      aria-valuenow={progressPercentage}
                      aria-valuemin="0" 
                      aria-valuemax="100"
                    >
                      {formatTime(timer.timeLeft)}
                    </div>
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="btn-group">
                      {!timer.isRunning ? (
                        <button 
                          className="btn btn-success me-2"
                          onClick={handleStartTimer}
                        >
                          Start
                        </button>
                      ) : (
                        <button 
                          className="btn btn-warning me-2"
                          onClick={handlePauseTimer}
                        >
                          Pause
                        </button>
                      )}
                      <button 
                        className="btn btn-secondary"
                        onClick={handleResetTimer}
                      >
                        Reset
                      </button>
                    </div>
                    
                    <button 
                      className="btn btn-primary"
                      onClick={handleMarkComplete}
                    >
                      <span className="me-1">✓</span> Mark Complete
                    </button>
                  </div>
                </div>
                
                {/* Mobile-only mark complete button - shown only on mobile */}
                <div className="mobile-mark-complete d-md-none mb-4">
                  <button 
                    className="btn btn-primary btn-lg w-100"
                    onClick={handleMarkComplete}
                  >
                    <span className="me-1">✓</span> Mark Activity Complete
                  </button>
                </div>
                
                <div className="notes-section">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h3>Notes System</h3>
                    <div className="d-flex align-items-center">
                      <div className="form-check form-switch me-3">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="daySpecificNotesToggle"
                          checked={activity.daySpecificNotes}
                          onChange={handleToggleDaySpecificNotes}
                        />
                        <label className="form-check-label" htmlFor="daySpecificNotesToggle">
                          Day-specific notes
                        </label>
                      </div>
                      <small className="text-muted">Notes are saved automatically when you complete the activity</small>
                    </div>
                  </div>
                  
                  <div className="card mb-3 bg-light">
                    <div className="card-body">
                      <h5 className="card-title mb-3">Choose Note Type:</h5>
                      <ul className="nav nav-pills mb-0" role="tablist">
                        <li className="nav-item me-2" role="presentation">
                          <button
                            className={`nav-link ${noteType === 'session' ? 'active' : ''}`}
                            type="button"
                            onClick={() => setNoteType('session')}
                          >
                            <i className="bi bi-journal-text me-1"></i> Session Journal
                            <div className="small text-muted">Records with timestamps</div>
                          </button>
                        </li>
                        <li className="nav-item me-2" role="presentation">
                          <button
                            className={`nav-link ${noteType === 'recurring' ? 'active' : ''}`}
                            type="button"
                            onClick={() => setNoteType('recurring')}
                          >
                            <i className="bi bi-calendar-check me-1"></i> Recurring Reminders
                            <div className="small text-muted">Shown on activity cards</div>
                          </button>
                        </li>
                        <li className="nav-item" role="presentation">
                          <button
                            className={`nav-link ${noteType === 'next' ? 'active' : ''}`}
                            type="button"
                            onClick={() => setNoteType('next')}
                          >
                            <i className="bi bi-arrow-right-circle me-1"></i> Next Session Notes
                            <div className="small text-muted">Planning notes for next time</div>
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  {/* Day tabs for day-specific notes */}
                  {activity.daySpecificNotes && (
                    <div className="card mb-3">
                      <div className="card-header bg-light">
                        <ul className="nav nav-tabs card-header-tabs" role="tablist">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                            <li className="nav-item" key={index} role="presentation">
                              <button 
                                className={`nav-link ${index === currentDayIndex ? 'active' : ''}`}
                                type="button"
                                onClick={() => switchDay(index)}
                              >
                                {day}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  {noteType === 'session' && (
                    <div className={`card ${editingNotes ? 'bg-white' : 'bg-light'} mb-3`}>
                      <div className="card-header bg-primary text-white">
                        <div className="d-flex justify-content-between align-items-center">
                          <h5 className="mb-0">📝 Session Journal</h5>
                          <span className="badge bg-info">Private - Not Visible on Activity Cards</span>
                        </div>
                      </div>
                      <div className="card-body">
                        {!editingNotes && (
                          <div className="alert alert-secondary mb-3">
                            <p className="mb-1"><strong>How to use Session Journal:</strong></p>
                            <ul className="mb-0 small">
                              <li>Record your thoughts, progress, or observations after each session</li>
                              <li>Each entry is automatically timestamped to create a journal of your progress</li>
                              <li>Notes are organized by day when day-specific notes are enabled</li>
                              <li>These notes are private and only visible here, not on activity cards</li>
                            </ul>
                          </div>
                        )}
                        
                        {editingNotes ? (
                          // Edit mode - white background textarea and save buttons
                          <>
                            <textarea 
                              className="form-control mb-3" 
                              rows="6"
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder={activity.daySpecificNotes 
                                ? `Add your session notes for ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDayIndex]}...\nA timestamp will be automatically added when you save.`
                                : "Add your session notes, reflections, or thoughts here...\nA timestamp will be automatically added when you save."}
                              style={{ fontSize: '0.95rem' }}
                              autoFocus
                            ></textarea>
                            
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <small className="text-muted">
                                  {notes ? `${notes.length} characters` : 'No notes added yet'}
                                </small>
                              </div>
                              <div className="btn-group">
                                <button 
                                  className="btn btn-outline-secondary"
                                  onClick={() => setEditingNotes(false)}
                                >
                                  Cancel
                                </button>
                                <button 
                                  className="btn btn-primary"
                                  onClick={handleSaveNotes}
                                  disabled={!notes.trim()}
                                >
                                  💾 Save Notes
                                </button>
                              </div>
                            </div>
                          </>
                        ) : (
                          // View mode - grey background with edit button
                          <>
                            <div className="d-flex justify-content-between mb-2">
                              <div className="text-muted small fw-semibold">
                                {activity.daySpecificNotes 
                                  ? `Your Notes for ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDayIndex]}:`
                                  : 'Your Notes:'}
                              </div>
                              <button 
                                className="btn btn-sm btn-outline-primary"
                                onClick={startEditingNotes}
                              >
                                ✎ Edit
                              </button>
                            </div>
                            
                            {notes ? (
                              <div 
                                className="p-3 rounded border bg-white mb-2" 
                                style={{ 
                                  minHeight: '120px', 
                                  whiteSpace: 'pre-wrap',
                                  fontSize: '0.95rem' 
                                }}
                              >
                                {notes}
                              </div>
                            ) : (
                              <div className="p-3 rounded border bg-white mb-2 text-muted fst-italic" style={{ minHeight: '120px' }}>
                                {activity.daySpecificNotes 
                                  ? `No notes added for ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDayIndex]} yet. Click "Edit" to add notes.`
                                  : 'No notes added yet. Click "Edit" to add notes about this activity.'}
                              </div>
                            )}
                            
                            <div className="text-end">
                              <small className="text-muted">
                                {notes ? `${notes.length} characters` : ''}
                              </small>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Recurring Notes Section */}
                  {noteType === 'recurring' && (
                    <div className={`card ${editingRecurringNotes ? 'bg-white' : 'bg-light'} mb-3`}>
                      <div className="card-header bg-primary text-white">
                        <div className="d-flex justify-content-between align-items-center">
                          <h5 className="mb-0">✨ Recurring Reminders for {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDayIndex]}</h5>
                          <span className="badge bg-info">Visible on Activity Cards</span>
                        </div>
                      </div>
                      <div className="card-body">
                        {!editingRecurringNotes && (
                          <div className="alert alert-secondary mb-3">
                            <p className="mb-1"><strong>How to use Recurring Reminders:</strong></p>
                            <ul className="mb-0 small">
                              <li>Add reminders that appear <strong>every {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDayIndex]}</strong> on your activity card</li>
                              <li>These are ideal for consistent reminders like "Stretch before starting" or "Focus on technique"</li>
                              <li>Keep them short and specific - they're visible at a glance on the activities page</li>
                              <li>These notes remain the same week after week until you change them</li>
                            </ul>
                          </div>
                        )}
                        {editingRecurringNotes ? (
                          <>
                            <textarea 
                              className="form-control mb-3" 
                              rows="3"
                              value={recurringNotes}
                              onChange={(e) => setRecurringNotes(e.target.value)}
                              placeholder={`Add a recurring reminder for every ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDayIndex]}...`}
                              style={{ fontSize: '0.95rem' }}
                              autoFocus
                            ></textarea>
                            
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <small className="text-muted">
                                  This note will appear on the activity card every {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDayIndex]}
                                </small>
                              </div>
                              <div className="btn-group">
                                <button 
                                  className="btn btn-outline-secondary"
                                  onClick={() => setEditingRecurringNotes(false)}
                                >
                                  Cancel
                                </button>
                                <button 
                                  className="btn btn-primary"
                                  onClick={handleSaveRecurringNotes}
                                >
                                  💾 Save Recurring Note
                                </button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="d-flex justify-content-between mb-2">
                              <div className="text-muted small fw-semibold">
                                This note appears on every {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDayIndex]}:
                              </div>
                              <button 
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => setEditingRecurringNotes(true)}
                              >
                                ✎ Edit
                              </button>
                            </div>
                            
                            {recurringNotes ? (
                              <div 
                                className="p-3 rounded border bg-white mb-2" 
                                style={{ 
                                  minHeight: '60px', 
                                  whiteSpace: 'pre-wrap',
                                  fontSize: '0.95rem' 
                                }}
                              >
                                {recurringNotes}
                              </div>
                            ) : (
                              <div className="p-3 rounded border bg-white mb-2 text-muted fst-italic" style={{ minHeight: '60px' }}>
                                No recurring note set for {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDayIndex]}. 
                                This could be a reminder or tip that appears every week.
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Next Session Notes Section */}
                  {noteType === 'next' && (
                    <div className={`card ${editingNextNotes ? 'bg-white' : 'bg-light'} mb-3`}>
                      <div className="card-header bg-success text-white">
                        <div className="d-flex justify-content-between align-items-center">
                          <h5 className="mb-0">→ Note for Next {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDayIndex]}</h5>
                          <span className="badge bg-warning text-dark">Visible Only On {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDayIndex]}</span>
                        </div>
                      </div>
                      <div className="card-body">
                        {!editingNextNotes && (
                          <div className="alert alert-secondary mb-3">
                            <p className="mb-1"><strong>How to use Next Session Notes:</strong></p>
                            <ul className="mb-0 small">
                              <li>Leave a message for yourself to read <strong>during your next {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDayIndex]}</strong> session</li>
                              <li>Perfect for reminders like "Continue where you left off" or "Remember to bring your new book"</li>
                              <li>This note will be visible on the activity card <strong>only on {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDayIndex]}</strong></li>
                              <li>It will be automatically added to your session journal after the day passes</li>
                            </ul>
                          </div>
                        )}
                        {editingNextNotes ? (
                          <>
                            <textarea 
                              className="form-control mb-3" 
                              rows="3"
                              value={nextNotes}
                              onChange={(e) => setNextNotes(e.target.value)}
                              placeholder={`Add a note for next ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDayIndex]}'s session...`}
                              style={{ fontSize: '0.95rem' }}
                              autoFocus
                            ></textarea>
                            
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <small className="text-muted">
                                  This note will appear on your activity card only on {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDayIndex]}
                                </small>
                              </div>
                              <div className="btn-group">
                                <button 
                                  className="btn btn-outline-secondary"
                                  onClick={() => setEditingNextNotes(false)}
                                >
                                  Cancel
                                </button>
                                <button 
                                  className="btn btn-success"
                                  onClick={async () => {
                                    console.log("SAVING NEXT SESSION NOTES - Button clicked");
                                    await handleSaveNextNotes();
                                    
                                    // Store the note in sessionStorage too as an additional backup
                                    try {
                                      const backupKey = `next_session_note_${activity._id}_${currentDayIndex}`;
                                      sessionStorage.setItem(backupKey, nextNotes);
                                      console.log(`Stored backup in sessionStorage with key ${backupKey}:`, nextNotes);
                                    } catch (e) {
                                      console.error("Error saving to sessionStorage:", e);
                                    }
                                    
                                    // Force activity refresh in parent window if possible
                                    console.log("Attempting to notify parent window to refresh");
                                    
                                    // Explicitly refresh the activities list
                                    setTimeout(() => {
                                      try {
                                        if (window.opener) {
                                          // Before refreshing, try to pass the data via sessionStorage
                                          sessionStorage.setItem('refresh_activities', 'true');
                                          window.opener.location.reload();
                                        }
                                      } catch (e) {
                                        console.error("Error refreshing opener:", e);
                                      }
                                    }, 500);
                                  }}
                                >
                                  💾 Save for Next Session
                                </button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="d-flex justify-content-between mb-2">
                              <div className="text-muted small fw-semibold">
                                Note for your next {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDayIndex]} session:
                              </div>
                              <button 
                                className="btn btn-sm btn-outline-success"
                                onClick={() => setEditingNextNotes(true)}
                              >
                                ✎ Edit
                              </button>
                            </div>
                            
                            {nextNotes ? (
                              <div 
                                className="p-3 rounded border bg-white mb-2" 
                                style={{ 
                                  minHeight: '60px', 
                                  whiteSpace: 'pre-wrap',
                                  fontSize: '0.95rem' 
                                }}
                              >
                                {nextNotes}
                              </div>
                            ) : (
                              <div className="p-3 rounded border bg-white mb-2 text-muted fst-italic" style={{ minHeight: '60px' }}>
                                No note for next {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDayIndex]}'s session. 
                                This could be a reminder of where you left off or what to focus on next time.
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

export default ActivityDetailPage;