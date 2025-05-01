// /frontend/src/services/admin.js
import { API_URL } from './api';

// Get all categories (both active and inactive)
export const getAllCategories = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/admin/categories`, {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch categories');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching all categories:', error);
    throw error;
  }
};

// Approve a category
export const approveCategory = async (categoryId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/admin/categories/${categoryId}/approve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to approve category');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error approving category:', error);
    throw error;
  }
};

// Reject and delete a category
export const rejectCategory = async (categoryId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/admin/categories/${categoryId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to reject category');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error rejecting category:', error);
    throw error;
  }
};

// Get admin dashboard stats
export const getDashboardStats = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/admin/stats`, {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch stats');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    throw error;
  }
};