// PastDayView.js - View for past days (read-only)
import React from 'react';
import DayColumn from '../Containers/DayColumn';
import TimePeriod from '../Containers/TimePeriod';
import AllDayEvents from '../Containers/AllDayEvents';

const PastDayView = ({ 
  dayIndex,
  dayName, 
  date,
  activities, 
  events,
  completions
}) => {
  // Group activities and events by time period
  const morningItems = activities.filter(a => a.period === 'morning');
  const afternoonItems = activities.filter(a => a.period === 'afternoon');
  const eveningItems = activities.filter(a => a.period === 'evening');
  const allDayEvents = events.filter(e => e.isAllDay);
  
  return (
    <DayColumn 
      dayIndex={dayIndex}
      dayName={dayName}
      date={date}
      isPast={true}
    >
      <AllDayEvents events={allDayEvents} />
      
      <TimePeriod 
        title="MORNING"
        activities={morningItems}
        events={events.filter(e => e.period === 'morning')}
        isPast={true}
        completions={completions}
      />
      
      <TimePeriod 
        title="AFTERNOON"
        activities={afternoonItems}
        events={events.filter(e => e.period === 'afternoon')}
        isPast={true}
        completions={completions}
      />
      
      <TimePeriod 
        title="EVENING"
        activities={eveningItems}
        events={events.filter(e => e.period === 'evening')}
        isPast={true}
        completions={completions}
      />
    </DayColumn>
  );
};

export default PastDayView;