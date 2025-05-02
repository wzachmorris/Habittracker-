// NavigationHeader.js - Navigation header for the habits page
import React from 'react';

const NavigationHeader = ({ 
  navigationMode, 
  navigateBack, 
  navigateForward, 
  resetView,
  isMobileView,
  debugCallback  // Added debug callback
}) => {
  const baseOffset = navigationMode * (isMobileView ? 1 : 4);
  const daysShown = isMobileView ? 1 : 4;
  const isCurrentView = navigationMode === 0;
  const isPastView = navigationMode < 0;
  const isFutureView = navigationMode > 0;
  
  let headerText = '';
  if (isCurrentView) {
    headerText = isMobileView ? "Today" : "This Week (Today & Next 3 Days)";
  } else if (isMobileView) {
    headerText = baseOffset < 0 
      ? `${Math.abs(baseOffset)} Day${Math.abs(baseOffset) !== 1 ? 's' : ''} Ago`
      : `${baseOffset} Day${baseOffset !== 1 ? 's' : ''} From Now`;
  } else {
    headerText = `Days ${baseOffset} to ${baseOffset + (daysShown - 1)} from Today`;
  }
  
  let headerClass = 'time-navigation-header ';
  headerClass += isPastView ? 'past-header' : isFutureView ? 'future-header' : 'current-header';
  
  return (
    <div className="time-navigation-header-container">
      <div className={headerClass}>
        <button 
          className="btn btn-sm navigation-btn"
          onClick={navigateBack}
          title="View earlier days"
        >
          <span className="navigation-arrow">←</span> {isMobileView ? 'Yesterday' : 'Earlier'}
        </button>
        
        <div className="header-title">
          <h5 className="mb-0">{headerText}</h5>
          <div className="mt-2 action-button-container">
            {!isCurrentView && (
              <button className="btn btn-sm btn-today" onClick={resetView}>
                {isMobileView ? 'Today' : 'Back to Today'}
              </button>
            )}
            
          </div>
        </div>
        
        <button 
          className="btn btn-sm navigation-btn"
          onClick={navigateForward}
          title="View later days"
        >
          {isMobileView ? 'Tomorrow' : 'Later'} <span className="navigation-arrow">→</span>
        </button>
      </div>
    </div>
  );
};

export default NavigationHeader;