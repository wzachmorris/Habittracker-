// TestOverlay.js - A fixed overlay for testing that doesn't depend on React rendering
import React, { useState, useEffect } from 'react';

const TestOverlay = ({ 
  isVisible = true, 
  userId, 
  activities = [], 
  refreshFlag = 0,
  findDayOffset,
  getActivitiesForDay,
  getActivitiesForDayAndPeriod,
  daysOfWeek
}) => {
  const [localActivities, setLocalActivities] = useState([]);
  const [testActivities, setTestActivities] = useState([]);
  const [counter, setCounter] = useState(0);
  
  // Sync with passed activities
  useEffect(() => {
    setLocalActivities(activities);
    console.log("TestOverlay: Updated local activities from props", activities.length);
  }, [activities, refreshFlag]);
  
  // Add test activities function
  const addTestActivities = () => {
    const timestamp = new Date().getTime();
    const newTestActivities = [
      {
        _id: `test-morning-${timestamp}`,
        name: `Test Morning ${counter}`,
        period: 'morning',
        isHabit: true,
        repeatDays: [0, 1, 2, 3, 4, 5, 6],
        order: 0,
        duration: 30
      },
      {
        _id: `test-afternoon-${timestamp}`,
        name: `Test Afternoon ${counter}`,
        period: 'afternoon',
        isHabit: true,
        repeatDays: [0, 1, 2, 3, 4, 5, 6],
        order: 0,
        duration: 30
      },
      {
        _id: `test-evening-${timestamp}`,
        name: `Test Evening ${counter}`,
        period: 'evening',
        isHabit: true,
        repeatDays: [0, 1, 2, 3, 4, 5, 6],
        order: 0,
        duration: 30
      }
    ];
    
    setTestActivities([...testActivities, ...newTestActivities]);
    setCounter(prev => prev + 1);
    
    console.log("Added test activities:", newTestActivities);
  };
  
  // Get today's index
  const today = new Date();
  const todayIndex = today.getDay();
  
  // Get days to show
  const daysToShow = findDayOffset ? 
    [0, 1, 2, 3, 4, 5, 6].filter(day => findDayOffset(day) >= 0) :
    [0, 1, 2, 3, 4, 5, 6];
  
  if (!isVisible) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: '50px',
      right: '10px',
      zIndex: 10000,
      backgroundColor: 'rgba(255,255,255,0.95)',
      padding: '10px',
      borderRadius: '8px',
      boxShadow: '0 0 10px rgba(0,0,0,0.2)',
      maxWidth: '300px',
      maxHeight: '80vh',
      overflow: 'auto'
    }}>
      <h4 style={{ marginBottom: '10px', color: '#333' }}>Debug Panel</h4>
      
      <div style={{ marginBottom: '10px' }}>
        <button
          onClick={addTestActivities}
          style={{
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '4px',
            fontWeight: 'bold'
          }}
        >
          Add Test Activities
        </button>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <p><strong>User ID:</strong> {userId || 'None'}</p>
        <p><strong>Activities:</strong> {localActivities.length}</p>
        <p><strong>Test Activities:</strong> {testActivities.length}</p>
        <p><strong>Today:</strong> {daysOfWeek?.[todayIndex] || todayIndex}</p>
      </div>
      
      <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <h5>Test Activities:</h5>
        <div style={{ maxHeight: '200px', overflow: 'auto' }}>
          {testActivities.map((activity, index) => (
            <div 
              key={activity._id} 
              style={{
                marginBottom: '5px',
                padding: '5px',
                backgroundColor: '#e9ecef',
                borderRadius: '3px',
                fontSize: '12px'
              }}
            >
              <div><strong>{activity.name}</strong></div>
              <div>Period: {activity.period}</div>
            </div>
          ))}
          
          {testActivities.length === 0 && (
            <p style={{ color: '#6c757d', fontSize: '12px' }}>No test activities yet.</p>
          )}
        </div>
      </div>
      
      {/* Current Day Activities */}
      <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <h5>Current Activities:</h5>
        <div style={{ maxHeight: '200px', overflow: 'auto' }}>
          {daysToShow.map(dayIndex => (
            <div key={`day-${dayIndex}`}>
              <h6>{daysOfWeek?.[dayIndex] || `Day ${dayIndex}`}</h6>
              <div style={{ fontSize: '11px', marginBottom: '5px' }}>
                Morning: {getActivitiesForDayAndPeriod ? getActivitiesForDayAndPeriod(dayIndex, 'morning').length : 'N/A'},
                Afternoon: {getActivitiesForDayAndPeriod ? getActivitiesForDayAndPeriod(dayIndex, 'afternoon').length : 'N/A'},
                Evening: {getActivitiesForDayAndPeriod ? getActivitiesForDayAndPeriod(dayIndex, 'evening').length : 'N/A'}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Direct Render Test Activities */}
      <div style={{ marginTop: '15px' }}>
        <h5>Test Activities (Direct Render):</h5>
        
        <div style={{ marginTop: '5px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#495057' }}>Morning:</div>
          {testActivities
            .filter(a => a.period === 'morning')
            .map(activity => (
              <div 
                key={activity._id}
                style={{
                  backgroundColor: '#e3f2fd',
                  border: '1px solid #90caf9',
                  borderRadius: '4px',
                  padding: '8px',
                  marginBottom: '5px',
                  fontSize: '12px'
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{activity.name}</div>
                <div style={{ fontSize: '10px', color: '#555' }}>ID: {activity._id.substring(0, 10)}...</div>
              </div>
            ))
          }
        </div>
        
        <div style={{ marginTop: '10px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#495057' }}>Afternoon:</div>
          {testActivities
            .filter(a => a.period === 'afternoon')
            .map(activity => (
              <div 
                key={activity._id}
                style={{
                  backgroundColor: '#fff3e0',
                  border: '1px solid #ffe0b2',
                  borderRadius: '4px',
                  padding: '8px',
                  marginBottom: '5px',
                  fontSize: '12px'
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{activity.name}</div>
                <div style={{ fontSize: '10px', color: '#555' }}>ID: {activity._id.substring(0, 10)}...</div>
              </div>
            ))
          }
        </div>
        
        <div style={{ marginTop: '10px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#495057' }}>Evening:</div>
          {testActivities
            .filter(a => a.period === 'evening')
            .map(activity => (
              <div 
                key={activity._id}
                style={{
                  backgroundColor: '#e8eaf6',
                  border: '1px solid #c5cae9',
                  borderRadius: '4px',
                  padding: '8px',
                  marginBottom: '5px',
                  fontSize: '12px'
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{activity.name}</div>
                <div style={{ fontSize: '10px', color: '#555' }}>ID: {activity._id.substring(0, 10)}...</div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

export default TestOverlay;