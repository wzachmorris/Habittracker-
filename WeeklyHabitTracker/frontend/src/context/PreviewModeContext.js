import React, { createContext, useState, useContext } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

// Create preview mode context
export const PreviewModeContext = createContext();

// Custom hook to use preview mode context
export const usePreviewMode = () => useContext(PreviewModeContext);

// Sample data for preview mode
export const SAMPLE_DATA = {
  activities: [
    { 
      _id: 'sample1', 
      name: 'Morning Run', 
      period: 'morning',
      duration: 30,
      color: '#ff9900', 
      isHabit: true,
      repeatDays: [1, 3, 5],
      completions: {},
      notes: { content: 'Sample running notes' },
      nextSessionNotes: { content: 'Remember to stretch properly' },
      recurringNotes: { content: 'Try to increase pace each week' }
    },
    { 
      _id: 'sample2', 
      name: 'Meditation', 
      period: 'morning',
      duration: 15,
      color: '#3366cc', 
      isHabit: true,
      repeatDays: [0, 1, 2, 3, 4, 5, 6],
      completions: {},
      notes: { content: 'Sample meditation notes' }
    },
    { 
      _id: 'sample3', 
      name: 'Reading', 
      period: 'evening',
      duration: 45,
      color: '#669933', 
      isHabit: true,
      repeatDays: [1, 2, 4, 6],
      completions: {},
      notes: { content: 'Currently reading: Sample Book' }
    },
    { 
      _id: 'sample4', 
      name: 'Journaling', 
      period: 'evening',
      duration: 20,
      color: '#9966cc', 
      isHabit: true,
      repeatDays: [0, 2, 4, 6],
      completions: {},
      notes: { content: 'Sample journaling template' }
    },
    { 
      _id: 'sample5', 
      name: 'Lunch Break', 
      period: 'afternoon',
      duration: 60,
      color: '#cc6633', 
      isHabit: false,
      repeatDays: [1, 2, 3, 4, 5],
      completions: {},
      notes: { content: 'Sample meal planning notes' }
    }
  ],
  calendarEvents: [
    {
      _id: 'event1',
      title: 'Team Meeting',
      date: new Date(new Date().setDate(new Date().getDate() + 1)),
      start: '10:00',
      end: '11:00',
      description: 'Weekly team sync',
      color: '#3366ff'
    },
    {
      _id: 'event2',
      title: 'Dentist Appointment',
      date: new Date(new Date().setDate(new Date().getDate() + 3)),
      start: '14:30',
      end: '15:30',
      description: 'Regular checkup',
      color: '#ff6633'
    }
  ],
  countdownEvents: [
    {
      _id: 'countdown1',
      name: 'Vacation',
      date: new Date(new Date().setDate(new Date().getDate() + 30)),
      description: 'Annual summer vacation',
      color: '#33cc99'
    },
    {
      _id: 'countdown2',
      name: 'Project Deadline',
      date: new Date(new Date().setDate(new Date().getDate() + 14)),
      description: 'Final project submission',
      color: '#cc3366'
    }
  ]
};

// PreviewMode provider component
export const PreviewModeProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [promptMessage, setPromptMessage] = useState('');
  
  // Function to show login prompt
  const requestLogin = (message = 'Please login to use this feature') => {
    setPromptMessage(message);
    setShowLoginPrompt(true);
  };
  
  // Function to close login prompt
  const closeLoginPrompt = () => {
    setShowLoginPrompt(false);
  };
  
  // Determine if we're in preview mode
  const isPreviewMode = !isAuthenticated;
  
  // Return provider with context value
  return (
    <PreviewModeContext.Provider 
      value={{ 
        isPreviewMode, 
        showLoginPrompt, 
        promptMessage,
        requestLogin,
        closeLoginPrompt,
        sampleData: SAMPLE_DATA
      }}
    >
      {children}
    </PreviewModeContext.Provider>
  );
};