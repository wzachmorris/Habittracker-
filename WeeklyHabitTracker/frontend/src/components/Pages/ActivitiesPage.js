import React, { useState, useEffect } from 'react';
import { fetchActivities } from '../../services/api';
import PageWrapper from '../PageWrapper';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

function ActivitiesPage() {
  const { t } = useTranslation();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Get user ID from authentication
  const { user } = useAuth();
  const userId = user?.userId || localStorage.getItem('userId');
  
  useEffect(() => {
    loadActivities();
    
    // Set up a refresh listener for when notes are changed in the detail page
    const handleStorageChange = (e) => {
      // When localStorage changes, check if it's an activity update
      if (e.key && e.key === 'currentActivity') {
        console.log("Detected activity update in localStorage - refreshing activities");
        loadActivities();
      }
    };
    
    // Listen for storage events
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await fetchActivities(userId);
      setActivities(data);
    } catch (err) {
      console.error('Error loading activities:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <PageWrapper>
      <div className="container mt-4 main-content">
        {/* Welcome Header */}
        <div className="welcome-container mb-4">
          <div className="welcome-message">
            <h4>{t('activities.management')}</h4>
            <p>{t('activities.managementDesc')}</p>
          </div>
          
          <button 
            className="btn btn-primary add-habit-btn" 
            onClick={() => {
              // Navigate to the home page where activities can be added
              window.location.href = '/';
            }}
          >
            + {t('activities.addNew')}
          </button>
        </div>
        
        {loading ? (
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">{t('common.loading')}</span>
            </div>
          </div>
        ) : (
          <div className="row">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <div className="col-md-6 mb-3" key={activity._id}>
                  <div className="card h-100">
                    <div className="card-header bg-light">
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="card-title mb-0">{activity.name}</h5>
                        {(() => {
                          // Get today's day index
                          const todayIndex = new Date().getDay();
                          const badges = [];
                          
                          // Check for recurring notes
                          if (activity.recurringNotes && 
                              activity.recurringNotes[todayIndex] && 
                              activity.recurringNotes[todayIndex].trim().length > 0) {
                            badges.push(
                              <span key="recurring" title={t('activities.hasReminders')} className="badge bg-primary me-1">✨ {t('activities.recurring')}</span>
                            );
                          }
                          
                          // Check for next session notes
                          if (activity.nextSessionNotes && 
                              activity.nextSessionNotes[todayIndex] && 
                              activity.nextSessionNotes[todayIndex].trim().length > 0) {
                            badges.push(
                              <span key="next" title="Has notes for today's session" className="badge bg-success me-1">→ Today's Note</span>
                            );
                          }
                          
                          // Check for day-specific session notes
                          if (activity.daySpecificNotes && activity.notes && 
                              activity.notes[todayIndex] && 
                              activity.notes[todayIndex].trim().length > 0) {
                            badges.push(
                              <span key="day" title="Has session journal entries" className="badge bg-secondary">📝 Journal</span>
                            );
                          } else if (!activity.daySpecificNotes) {
                            // Check regular notes
                            const notes = localStorage.getItem(`notes_${activity._id}`);
                            if (notes && notes.trim().length > 0) {
                              badges.push(
                                <span key="regular" title="Has session journal entries" className="badge bg-secondary">📝 Journal</span>
                              );
                            }
                          }
                          
                          return badges.length > 0 ? badges : null;
                        })()}
                      </div>
                      <h6 className="card-subtitle mt-1 text-muted">
                        {activity.duration} minutes • {activity.period}
                        {activity.isHabit && <span className="ms-2 badge bg-info">Recurring</span>}
                      </h6>
                    </div>
                    <div className="card-body">
                      {(() => {
                        const todayIndex = new Date().getDay();
                        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        const previews = []; // Array to hold JSX for previews

                        // --- Check for Recurring Notes INDEPENDENTLY ---
                        if (activity.recurringNotes &&
                            activity.recurringNotes[todayIndex] &&
                            activity.recurringNotes[todayIndex].trim().length > 0) {
                          previews.push(
                            <div key="recurring-preview" className="notes-preview mb-3">
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <div className="fw-semibold small text-primary">✨ {t('activities.recurringReminder')}</div>
                                <span className="badge bg-info">{t('activities.every')} {dayNames[todayIndex]}</span>
                              </div>
                              <div className="bg-primary bg-opacity-10 border border-primary rounded p-2 text-primary"
                                   style={{ fontSize: '0.9rem', maxHeight: '80px', overflow: 'auto' }}>
                                {activity.recurringNotes[todayIndex]}
                              </div>
                            </div>
                          );
                        }

                        // --- Check for Next Session Notes INDEPENDENTLY ---
                        if (activity.nextSessionNotes &&
                            activity.nextSessionNotes[todayIndex] &&
                            activity.nextSessionNotes[todayIndex].trim().length > 0) {
                          previews.push(
                            <div key="next-preview" className="notes-preview mb-3">
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <div className="fw-semibold small text-success">→ {t('activities.nextSession')}</div>
                                <span className="badge bg-success">{t('activities.planningNote')}</span>
                              </div>
                              <div className="bg-success bg-opacity-10 border border-success rounded p-2 text-success"
                                   style={{ fontSize: '0.9rem', maxHeight: '80px', overflow: 'auto' }}>
                                {activity.nextSessionNotes[todayIndex]}
                              </div>
                            </div>
                          );
                        }

                        // Remove the session journal notes section completely - 
                        // We're not showing session journal notes on the Activities page anymore

                        // --- Show default message if NO notes of any kind were found ---
                        if (previews.length === 0) {
                          previews.push(
                            <div key="no-notes" className="card-text text-muted fst-italic">
                              <p>{t('activities.noNotes')}</p>
                              <ul className="small mb-0 mt-1">
                                <li>{t('activities.addReminders')}</li>
                                <li>{t('activities.createNote')}</li>
                                <li className="text-primary">{t('activities.journalNote')}</li>
                              </ul>
                            </div>
                          );
                        }

                        // --- Render all collected previews ---
                        return previews;
                      })()}
                      
                      <div className="d-flex justify-content-between mt-3">
                        <span className="text-muted small">
                          {activity.isHabit 
                            ? t('activities.isRecurring')
                            : t('activities.isOneTime')}
                        </span>
                        <button 
                          className="btn btn-primary"
                          onClick={() => {
                            // Store the activity in localStorage
                            localStorage.setItem('currentActivity', JSON.stringify(activity));
                            // Navigate to the detail page using the correct route format
                            window.location.href = `/activities/${activity._id}`;
                          }}
                        >
                          {t('activities.openDetails')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-12">
                <div className="alert alert-info">
                  {t('activities.noActivities')}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

export default ActivitiesPage;