import React, { createContext, useState, useEffect, useContext } from 'react';
import { getCurrentUser, logout, isAuthenticated } from '../services/auth';

// Create auth context
export const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user on initial render and when authentication changes
  useEffect(() => {
    const loadUser = async () => {
      console.log('AuthContext: Checking authentication...');
      if (!isAuthenticated()) {
        console.log('AuthContext: No auth token found');
        setLoading(false);
        return;
      }

      console.log('AuthContext: Auth token found, fetching user data...');
      try {
        const userData = await getCurrentUser();
        console.log('AuthContext: User data loaded:', userData);
        setUser(userData);
      } catch (error) {
        console.error('AuthContext: Error loading user:', error);
        setError(error.message);
        // Clear token if it's invalid
        if (error.message.includes('token') || error.message.includes('auth')) {
          console.log('AuthContext: Clearing invalid token');
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    // Listen for storage events (login/logout in other tabs)
    const handleStorageChange = (e) => {
      console.log('AuthContext: Storage changed', e?.key);
      if (e?.key === 'token' || e?.key === null) {
        console.log('AuthContext: Token storage changed, reloading user data');
        loadUser();
      }
    };

    // Initial load
    loadUser();

    // Add event listeners for localStorage changes
    window.addEventListener('storage', handleStorageChange);
    
    // This is a custom event we dispatch after login/logout
    window.addEventListener('auth-change', loadUser);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-change', loadUser);
    };
  }, []);

  // Log out user
  const handleLogout = () => {
    logout();
    setUser(null);
  };

  // Update user in context
  const updateUser = (userData) => {
    setUser(userData);
  };

  // Calculate authentication status
  const authStatus = React.useMemo(() => {
    // Check if we have a valid token (even before user data loads)
    const hasToken = isAuthenticated();
    // User might be loaded later, check for user object too
    const hasUser = !!user;
    console.log('AuthContext: Authentication check -', { hasToken, hasUser, loading });
    return hasToken || hasUser;
  }, [user]);

  // Auth context value
  const value = {
    user,
    loading,
    error,
    isAuthenticated: authStatus,
    logout: handleLogout,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};