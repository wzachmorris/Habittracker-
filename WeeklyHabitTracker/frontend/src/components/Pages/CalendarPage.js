import React from 'react';
import PageWrapper from '../PageWrapper';

function CalendarPage() {
  return (
    <PageWrapper>
      <div className="container mt-4 main-content">
        <h2>Calendar</h2>
        <p>View your activities and habits in a calendar view.</p>
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Coming Soon</h5>
            <p className="card-text">The calendar view is under development.</p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

export default CalendarPage;