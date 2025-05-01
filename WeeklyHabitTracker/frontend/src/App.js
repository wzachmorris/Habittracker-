import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PreviewModeProvider, SAMPLE_DATA } from './context/PreviewModeContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastContainer } from 'react-bootstrap';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import LoginPromptModal from './components/LoginPromptModal';

// Import i18n configuration
import './i18n';

// Pages
import HomePage from './components/Pages/HomePage';
import LoginPage from './components/Pages/LoginPage';
import RegisterPage from './components/Pages/RegisterPage';
import PasswordResetPage from './components/Pages/PasswordResetPage';
import ProfilePage from './components/Pages/ProfilePage';
import ActivitiesPage from './components/Pages/ActivitiesPage';
import ActivityDetailPage from './components/Pages/ActivityDetailPage';
import CalendarPage from './components/Pages/CalendarPage';
import HabitsPage from './components/Pages/HabitsPage';
import CountdownPage from './components/Pages/CountdownPage';
import LeaderboardPage from './components/Pages/LeaderboardPage';
import StreaksPage from './components/Pages/StreaksPage';
import InsightsPage from './components/Pages/InsightsPage';
import NotFoundPage from './components/Pages/NotFoundPage';
import AdminPage from './components/Pages/AdminPage';

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <RegisterPage />} />
      <Route path="/reset-password" element={isAuthenticated ? <Navigate to="/" /> : <PasswordResetPage />} />
      
      {/* Feature routes that work in preview mode */}
      <Route path="/" element={<HomePage />} />
      <Route path="/activities" element={<ActivitiesPage />} />
      <Route path="/habits" element={<HabitsPage />} />
      <Route path="/countdown" element={<CountdownPage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/streaks" element={<StreaksPage />} />
      <Route path="/insights" element={<InsightsPage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/admin" element={<AdminPage />} />
      
      {/* Routes that still require authentication */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />
      
      <Route path="/activities/:id" element={
        <ProtectedRoute>
          <ActivityDetailPage />
        </ProtectedRoute>
      } />
      
      {/* 404 route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function App() {
  // Initialize preview mode and sample data on first load
  useEffect(() => {
    // If there's no token, we're in preview mode
    if (!localStorage.getItem('token')) {
      localStorage.setItem('previewMode', 'true');
      // Store sample data in localStorage for API service to use
      localStorage.setItem('previewData', JSON.stringify(SAMPLE_DATA));
    } else {
      // If there is a token, we're not in preview mode
      localStorage.removeItem('previewMode');
    }
  }, []);

  return (
    <AuthProvider>
      <LanguageProvider>
        <PreviewModeProvider>
          <div className="app-container">
            <AppRoutes />
            <LoginPromptModal />
            
            <ToastContainer
              position="bottom-end"
              className="p-3"
              style={{ zIndex: 1060 }}
            />
          </div>
        </PreviewModeProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;