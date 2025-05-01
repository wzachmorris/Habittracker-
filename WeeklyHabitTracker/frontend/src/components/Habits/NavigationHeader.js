//frontend/src/components/Habits/NavigationHeader.js

import React from 'react';

/**
 * Navigation Header Component for the Habits View
 */
const NavigationHeader = ({ 
  navigationMode, 
  isMobileView, 
  getFixedDayOffsets, 
  resetView, 
  navigateBack, 
  navigateForward 
}) => {
  const baseOffset = navigationMode * (isMobileView ? 1 : 4);
  const daysShown = isMobileView ? 1 : 4;
  
  return (
    <div className={`time-navigation-header ${
      getFixedDayOffsets()[0] < 0 
        ? 'past-header' 
        : getFixedDayOffsets()[0] > 0 || navigationMode > 0 
          ? 'future-header' 
          : 'current-header'
    }`}>
      <button 
        className="btn btn-sm navigation-btn mobile-nav-btn"
        onClick={navigateBack}
        title="View earlier days"
      >
        <span className="navigation-arrow">←</span> {isMobileView ? 'Yesterday' : 'Earlier'}
      </button>
      
      <div className="header-title">
        <h5 className="mb-0">
          {navigationMode === 0 
            ? `${isMobileView ? "Today" : "This Week (Today & Next 3 Days)"}` 
            : isMobileView 
              ? baseOffset < 0 
                ? `${Math.abs(baseOffset)} Day${Math.abs(baseOffset) !== 1 ? 's' : ''} Ago` 
                : `${baseOffset} Day${baseOffset !== 1 ? 's' : ''} From Now`
              : `Days ${baseOffset} to ${baseOffset + (daysShown - 1)} from Today`}
        </h5>
        <div className="mt-2 action-button-container">
          {navigationMode !== 0 
            ? <button className="btn btn-sm btn-today" onClick={resetView}>
                {isMobileView ? 'Today' : 'Back to Today'}
              </button>
            : <div className="placeholder-div"></div>
          }
        </div>
      </div>
      
      <button 
        className="btn btn-sm navigation-btn mobile-nav-btn"
        onClick={navigateForward}
        title="View later days"
      >
        {isMobileView ? 'Tomorrow' : 'Later'} <span className="navigation-arrow">→</span>
      </button>
    </div>
  );
};

export default NavigationHeader;