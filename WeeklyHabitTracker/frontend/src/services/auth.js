import { API_URL } from './api';

// Register a new user
export const register = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const data = await response.json();
    
    // Save token and user data to localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.user.userId);
    localStorage.setItem('userName', data.user.name);
    localStorage.setItem('userEmail', data.user.email);
    
    // Force reload authentication state - using custom event
    window.dispatchEvent(new Event('auth-change'));
    
    // Small delay to allow auth context to update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Login a user
export const login = async (credentials) => {
  try {
    console.log('auth.js: Logging in with email:', credentials.email);
    
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    console.log('auth.js: Login response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('auth.js: Login error response:', errorData);
      throw new Error(errorData.message || 'Login failed');
    }

    const data = await response.json();
    console.log('auth.js: Login successful, received token and user data');
    
    // Save token and user data to localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.user.userId);
    localStorage.setItem('userName', data.user.name);
    localStorage.setItem('userEmail', data.user.email);
    
    // Force reload authentication state - using custom event to ensure it's caught
    window.dispatchEvent(new Event('auth-change'));
    
    // Small delay to allow auth context to update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return data;
  } catch (error) {
    console.error('auth.js: Login error:', error);
    throw error;
  }
};

// Get the current authenticated user
export const getCurrentUser = async () => {
  try {
    console.log('auth.js: Getting current user');
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.log('auth.js: No token found');
      throw new Error('No authentication token found');
    }
    
    console.log('auth.js: Token found, fetching user data');
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'x-auth-token': token,
      },
    });

    console.log('auth.js: Auth/me response status:', response.status);
    
    if (!response.ok) {
      // If token is invalid, clear localStorage
      if (response.status === 401) {
        console.log('auth.js: Token invalid (401), logging out');
        logout();
      }
      
      const errorData = await response.json();
      console.error('auth.js: Error response from /auth/me:', errorData);
      throw new Error(errorData.message || 'Failed to get user');
    }

    const userData = await response.json();
    console.log('auth.js: User data fetched successfully:', userData.name);
    return userData;
  } catch (error) {
    console.error('auth.js: Get current user error:', error);
    throw error;
  }
};

// Logout a user
export const logout = () => {
  console.log('auth.js: Logging out user');
  
  // Clear authentication data from localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  
  // We'll keep other user data for offline usage, but you could clear it too
  // localStorage.removeItem('userName');
  // localStorage.removeItem('userEmail');
  // ...etc
  
  // Force reload authentication state - using custom event
  window.dispatchEvent(new Event('auth-change'));
  
  return true;
};

// Check if a user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token; // Convert to boolean
};

// Get authentication token
export const getToken = () => {
  return localStorage.getItem('token');
};

// Request password reset
export const requestPasswordReset = async (email) => {
  try {
    const response = await fetch(`${API_URL}/auth/password-reset/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Password reset request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Password reset request error:', error);
    throw error;
  }
};

// Verify reset token
export const verifyResetToken = async (token) => {
  try {
    const response = await fetch(`${API_URL}/auth/password-reset/verify/${token}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Token verification failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Token verification error:', error);
    throw error;
  }
};

// Reset password
export const resetPassword = async (token, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/password-reset/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Password reset failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
};