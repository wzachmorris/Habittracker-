//frontend/src/components/Habits/EventFormModal.js


import React from 'react';
import EventForm from '../EventForm';

/**
 * Event Form Modal Component
 */
const EventFormModal = ({ 
  showEventForm, 
  currentEvent, 
  quickAddDay, 
  todayIndex, 
  handleSaveEvent, 
  handleDeleteEvent, 
  closeForm 
}) => {
  if (!showEventForm) return null;
  
  return (
    <div className="modal-backdrop" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1050,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div className="modal-dialog" style={{
        maxWidth: '500px',
        width: '100%',
        margin: '30px auto',
        zIndex: 1051
      }}>
        <div className="modal-content" style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}>
          <div className="modal-header" style={{
            padding: '12px 16px',
            borderBottom: '1px solid #dee2e6',
            backgroundColor: '#f8f9fa',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px'
          }}>
            <h5 className="modal-title">{currentEvent ? 'Edit Event' : 'Add New Event'}</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={closeForm}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body" style={{ 
            padding: '16px',
            backgroundColor: 'white'
          }}>
            <EventForm 
              event={currentEvent} 
              dayIndex={quickAddDay !== null ? quickAddDay : currentEvent?.day || todayIndex}
              onSave={handleSaveEvent}
              onCancel={closeForm}
              onDelete={handleDeleteEvent}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventFormModal;