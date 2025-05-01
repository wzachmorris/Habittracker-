// /frontend/src/services/leaderboard.js
import { API_URL } from './api';

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

// Fetch all leaderboard categories
export const fetchLeaderboardCategories = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/leaderboard/categories`, {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching leaderboard categories:', error);
    throw error;
  }
};

// Fetch entries for a specific category
export const fetchCategoryEntries = async (categoryId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/leaderboard/categories/${categoryId}/entries`, {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching category entries:', error);
    throw error;
  }
};

// Sync a habit to a leaderboard category
export const syncHabitToLeaderboard = async (categoryId, activityId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/leaderboard/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({ categoryId, activityId })
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error syncing habit to leaderboard:', error);
    throw error;
  }
};

// Remove a habit from a leaderboard category
export const removeHabitFromLeaderboard = async (categoryId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/leaderboard/categories/${categoryId}/entries`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error removing habit from leaderboard:', error);
    throw error;
  }
};

// Suggest a new leaderboard category
export const suggestLeaderboardCategory = async (name, emoji, description) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/leaderboard/categories/suggest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({ name, emoji, description })
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error suggesting leaderboard category:', error);
    throw error;
  }
};

// Get user's habits that are synced to leaderboards
export const fetchUserSyncedHabits = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/leaderboard/user/synced-habits`, {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching user synced habits:', error);
    throw error;
  }
};

// Get user's habits available for syncing
export const fetchUserHabitsForSync = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/leaderboard/user/available-habits`, {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching user habits for sync:', error);
    throw error;
  }
};