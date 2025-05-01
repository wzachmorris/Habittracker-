// /frontend/src/services/api.js
import EventBus from '../utils/eventBus';

// Get base API URL from environment or default
export const API_URL = process.env.REACT_APP_API_URL || '/api';

// Import or check for preview mode context
// We can't directly import usePreviewMode here because this is not a component
// Instead, we'll check localStorage for a preview mode flag set by the preview provider
const isInPreviewMode = () => {
  return !localStorage.getItem('token') && localStorage.getItem('previewMode') === 'true';
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'An error occurred while processing your request'
    }));
    throw new Error(error.message || 'An error occurred');
  }
  
  if (response.status === 204) {
    return null; // No content
  }
  
  return await response.json();
};

// Fetch all activities for a user
export const fetchActivities = async (userId) => {
  try {
    // Check if we're in preview mode
    if (isInPreviewMode()) {
      console.log('[API] Preview mode: returning sample activities');
      // Return sample data for preview - we'll get this from localStorage
      // This data is set by the PreviewModeProvider component
      const sampleData = JSON.parse(localStorage.getItem('previewData') || '{}');
      return sampleData.activities || [];
    }
    
    // Normal authenticated API request
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/activities?userId=${userId}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching activities:', error);
    throw error;
  }
};

// Create a new activity
export const createActivity = async (activityData) => {
  try {
    // Check if we're in preview mode
    if (isInPreviewMode()) {
      console.log('[API] Preview mode: cannot create activities');
      throw new Error('You must login to create activities');
    }
    
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify(activityData)
    });
    
    const newActivity = await handleResponse(response);
    
    // Publish event that a new activity was created
    EventBus.publish('activity-created', { activity: newActivity });
    
    return newActivity;
  } catch (error) {
    console.error('Error creating activity:', error);
    throw error;
  }
};

// Update an existing activity
export const updateActivity = async (id, activityData) => {
  try {
    // Check if we're in preview mode
    if (isInPreviewMode()) {
      console.log('[API] Preview mode: cannot update activities');
      throw new Error('You must login to update activities');
    }
    
    // Log the data being sent to the server, especially the order field
    console.log(`[API] Updating activity ${id}:`, {
      period: activityData.period,
      order: activityData.order,
      name: activityData.name
    });
    
    // Ensure the order field is explicitly included and is a number
    const dataToSend = {
      ...activityData,
      order: activityData.order !== undefined ? Number(activityData.order) : 0
    };
    
    console.log('[API] Request payload: ', dataToSend);
    
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/activities/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify(dataToSend)
    });
    
    const updatedActivity = await handleResponse(response);
    
    // Verify that the order field was included in the response
    console.log('[API] Response from server:', updatedActivity);
    
    if (updatedActivity.order === undefined && activityData.order !== undefined) {
      console.warn('[API] Warning: Order field missing from response. Original value:', activityData.order);
      // Add it back if missing
      updatedActivity.order = activityData.order;
    }
    
    // Publish event that an activity was updated
    EventBus.publish('activity-updated', { 
      activity: updatedActivity,
      orderChanged: activityData.order !== undefined
    });
    
    return updatedActivity;
  } catch (error) {
    console.error('Error updating activity:', error);
    throw error;
  }
};

// Delete an activity
export const deleteActivity = async (id) => {
  try {
    // Check if we're in preview mode
    if (isInPreviewMode()) {
      console.log('[API] Preview mode: cannot delete activities');
      throw new Error('You must login to delete activities');
    }
    
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/activities/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    });
    
    await handleResponse(response);
    
    // Publish event that an activity was deleted
    EventBus.publish('activity-deleted', { activityId: id });
    
    return true;
  } catch (error) {
    console.error('Error deleting activity:', error);
    throw error;
  }
};

// Toggle activity completion
export const toggleActivityCompletion = async (activityId, userId, date) => {
  try {
    console.log(`[api.js] Toggling completion for activity ${activityId}`);
    
    // Check if we're in preview mode
    if (isInPreviewMode()) {
      console.log('[API] Preview mode: cannot toggle activity completion');
      throw new Error('You must login to track activity completions');
    }
    
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/activities/${activityId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({
        userId,
        date: date.toISOString()
      })
    });
    
    const result = await handleResponse(response);
    console.log(`[api.js] Toggle completion API response:`, result);
    
    // IMPORTANT: We no longer update localStorage here. Instead, we rely on the database.
    // We only publish an event to notify components that data has changed.
    EventBus.publish('activity-completion-changed', {
      activityId,
      date: date.toISOString().split('T')[0],
      completed: result.completion.completed
    });
    
    return result;
  } catch (error) {
    console.error('Error toggling activity completion:', error);
    throw error;
  }
};

// Process next session notes for upcoming activities
export const processNextSessionNotes = async (activity) => {
  // This function remains unchanged
  if (!activity.nextSessionNotes) {
    return activity;
  }
  
  // This function processes notes for the next session - it doesn't interact with the database
  // so we can leave it as is
  return activity;
};

// Fetch calendar events
export const fetchCalendarEvents = async () => {
  try {
    // Check if we're in preview mode
    if (isInPreviewMode()) {
      console.log('[API] Preview mode: returning sample calendar events');
      // Return sample data for preview
      const sampleData = JSON.parse(localStorage.getItem('previewData') || '{}');
      return sampleData.calendarEvents || [];
    }
    
    // Normal authenticated API request
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/events`, {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return []; // Return empty array on error
  }
};

// Save calendar event
export const saveCalendarEvent = async (eventData) => {
  try {
    // Check if we're in preview mode
    if (isInPreviewMode()) {
      console.log('[API] Preview mode: cannot save calendar events');
      throw new Error('You must login to save calendar events');
    }
    
    const token = localStorage.getItem('token');
    const method = eventData._id ? 'PUT' : 'POST';
    const url = eventData._id ? `${API_URL}/events/${eventData._id}` : `${API_URL}/events`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify(eventData)
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error saving calendar event:', error);
    throw error;
  }
};

// Delete calendar event
export const deleteCalendarEvent = async (eventId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    });
    
    await handleResponse(response);
    return true;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
};

// Get user profile - UPDATED to include userId as query parameter
export const getUserProfile = async (userId) => {
  try {
    const token = localStorage.getItem('token');
    console.log('[API] getUserProfile - Using userId:', userId);
    
    // Include userId in the query parameters
    const response = await fetch(`${API_URL}/users/profile?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    });
    
    const data = await handleResponse(response);
    console.log('[API] getUserProfile - Received profile data:', data);
    return data;
  } catch (error) {
    console.error('[API] Error fetching user profile:', error);
    throw error;
  }
};

// Update user profile - UPDATED to include userId as query parameter
export const updateUserProfile = async (profileData, userId) => {
  try {
    const token = localStorage.getItem('token');
    console.log('[API] updateUserProfile - Using userId:', userId);
    
    // Include userId in the query parameters
    const response = await fetch(`${API_URL}/users/profile?userId=${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify(profileData)
    });
    
    const updatedProfile = await handleResponse(response);
    console.log('[API] updateUserProfile - Updated profile data:', updatedProfile);
    
    // Publish event that profile was updated
    EventBus.publish('profile-updated', { profile: updatedProfile });
    
    return updatedProfile;
  } catch (error) {
    console.error('[API] Error updating user profile:', error);
    throw error;
  }
};