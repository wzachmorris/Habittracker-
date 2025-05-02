// EventFormModal.js - Modal for adding/editing events
import React from 'react';

const EventFormModal = ({
  showEventForm,
  currentEvent,
  quickAddDay,
  todayOffset,
  onSave,
  onDelete,
  onClose
}) => {
  if (!showEventForm) return null;
  
  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {currentEvent ? 'Edit Event' : 'Add New Event'}
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            {/* Placeholder for event form content */}
            <div className="form-placeholder">
              <p>This is a placeholder for the event form content.</p>
              <p>The actual implementation will include fields for:</p>
              <ul>
                <li>Event name/title</li>
                <li>Date and time</li>
                <li>Duration/end time</li>
                <li>Recurring options</li>
                <li>Color selection</li>
                <li>All-day toggle</li>
                <li>Notes/description</li>
              </ul>
              <div className="d-flex justify-content-end gap-2 mt-3">
                {currentEvent && (
                  <button 
                    className="btn btn-danger" 
                    onClick={() => onDelete && onDelete(currentEvent._id)}
                  >
                    Delete
                  </button>
                )}
                <button className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={() => onSave && onSave({})}>
                  {currentEvent ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventFormModal;