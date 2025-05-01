import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    console.log('ProtectedRoute: Auth state -', { isAuthenticated, loading });
    if (user) console.log('ProtectedRoute: User is loaded:', user.name);
  }, [isAuthenticated, loading, user]);

  // Show loading spinner while checking authentication
  if (loading) {
    console.log('ProtectedRoute: Still loading, showing spinner');
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect to login page if not authenticated
  if (!isAuthenticated) {
    console.log('ProtectedRoute: Not authenticated, redirecting to login');
    return <Navigate to="/login" />;
  }

  // Render children if authenticated
  console.log('ProtectedRoute: Authenticated, rendering children');
  return children;
};

export default ProtectedRoute;