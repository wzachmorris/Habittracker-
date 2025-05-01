import React, { useState, useEffect } from 'react';

function ActivityForm({ activity, onSave, onClose, onDuplicate }) {
  const [formData, setFormData] = useState({
    name: '',
    duration: '',
    period: 'morning',
    isHabit: true, // Default to true - recurring by default
    repeatDays: [0, 1, 2, 3, 4, 5, 6], // Default to all days selected
    oneTimeOnly: false, // New field for one-time activities
    customDays: false // New field to toggle custom days selection
  });
  
  useEffect(() => {
    if (activity) {
      setFormData({
        ...activity,
        duration: activity.duration.toString(),
        // If no repeatDays field exists, default to all days for existing activities
        repeatDays: activity.repeatDays?.length ? activity.repeatDays : [0, 1, 2, 3, 4, 5, 6],
        // Set customDays based on whether all days are selected
        customDays: activity.repeatDays && activity.repeatDays.length < 7,
        // Set oneTimeOnly to false if not specified
        oneTimeOnly: activity.oneTimeOnly || false
      });
    } else {
      // For new activities, set defaults
      setFormData({
        name: '',
        duration: '30', // Set a default duration
        period: 'morning',
        isHabit: true,
        repeatDays: [0, 1, 2, 3, 4, 5, 6], // Default to all days
        oneTimeOnly: false,
        customDays: false
      });
    }
  }, [activity]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'isHabit') {
        setFormData(prev => ({ ...prev, isHabit: checked }));
      } else if (name === 'oneTimeOnly') {
        // If it's a one-time activity, it can't be a habit
        setFormData(prev => ({ 
          ...prev, 
          oneTimeOnly: checked,
          isHabit: checked ? false : prev.isHabit
        }));
      } else if (name === 'customDays') {
        // Toggle between custom days and all days
        setFormData(prev => ({ 
          ...prev, 
          customDays: checked,
          // If turning off custom days, reset to all days
          repeatDays: checked ? prev.repeatDays : [0, 1, 2, 3, 4, 5, 6]
        }));
      } else {
        // Handle repeatDays checkboxes
        const day = parseInt(name.split('-')[1], 10);
        
        setFormData(prev => {
          const repeatDays = [...(prev.repeatDays || [])];
          
          if (checked) {
            repeatDays.push(day);
          } else {
            const index = repeatDays.indexOf(day);
            if (index !== -1) {
              repeatDays.splice(index, 1);
            }
          }
          
          return { ...prev, repeatDays };
        });
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // (Day-specific notes feature removed)

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const updatedActivity = {
      ...formData,
      duration: parseInt(formData.duration, 10),
      // If oneTimeOnly is true, make sure isHabit is false
      isHabit: formData.oneTimeOnly ? false : formData.isHabit,
      // Only include repeatDays if it's a habit and has custom days
      repeatDays: formData.isHabit && formData.customDays ? formData.repeatDays : [0, 1, 2, 3, 4, 5, 6]
    };
    
    // Remove fields that shouldn't be sent to the API
    delete updatedActivity.customDays;
    
    onSave(updatedActivity);
    onClose();
  };
  
  const handleDuplicate = () => {
    if (onDuplicate && activity) {
      onDuplicate(activity);
    }
  };
  
  const isDay = (day) => {
    return formData.repeatDays && formData.repeatDays.includes(day);
  };
  
  return (
    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{activity ? 'Edit Activity' : 'Add Activity'}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="name" className="form-label">Activity Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="duration" className="form-label">Duration (minutes)</label>
                <select
                  className="form-select"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                >
                  {/* Generate options in 5-minute intervals from 5 to 90 minutes (1.5 hours) */}
                  {Array.from({ length: 18 }, (_, i) => (i + 1) * 5).map(minutes => (
                    <option key={minutes} value={minutes}>
                      {minutes} minutes {minutes >= 60 ? `(${Math.floor(minutes / 60)}h ${minutes % 60 > 0 ? `${minutes % 60}m` : ''})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-3">
                <label htmlFor="period" className="form-label">Time Period</label>
                <select
                  className="form-select"
                  id="period"
                  name="period"
                  value={formData.period}
                  onChange={handleChange}
                  required
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                </select>
              </div>
              
              <div className="mb-3 form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="oneTimeOnly"
                  name="oneTimeOnly"
                  checked={formData.oneTimeOnly}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="oneTimeOnly">
                  This activity only occurs once
                </label>
              </div>
              
              {!formData.oneTimeOnly && (
                <>
                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="isHabit"
                      name="isHabit"
                      checked={formData.isHabit}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="isHabit">
                      This is a recurring habit
                    </label>
                  </div>
                  
                  {formData.isHabit && (
                    <>
                      <div className="mb-3 form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="customDays"
                          name="customDays"
                          checked={formData.customDays}
                          onChange={handleChange}
                        />
                        <label className="form-check-label" htmlFor="customDays">
                          This habit doesn't occur every day
                        </label>
                      </div>
                      
                      {formData.customDays && (
                        <div className="mb-3">
                          <label className="form-label">Repeat on days:</label>
                          <div className="day-selector">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                              <div key={index} className="form-check">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  id={`day-${index}`}
                                  name={`day-${index}`}
                                  checked={isDay(index)}
                                  onChange={handleChange}
                                />
                                <label className="form-check-label" htmlFor={`day-${index}`}>
                                  {day}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Day-specific notes feature removed */}
                    </>
                  )}
                </>
              )}
              
              <div className="modal-footer">
                {activity && onDuplicate && (
                  <button 
                    type="button" 
                    className="btn btn-info me-auto" 
                    onClick={handleDuplicate}
                  >
                    Duplicate
                  </button>
                )}
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActivityForm;