import React from 'react';
import BottomNavigation from './BottomNavigation';

// A wrapper component to ensure the bottom navigation appears on all pages
function PageWrapper({ children }) {
  return (
    <div className="page-container">
      <div className="main-content">
        {children}
      </div>
      <BottomNavigation />
    </div>
  );
}

export default PageWrapper;