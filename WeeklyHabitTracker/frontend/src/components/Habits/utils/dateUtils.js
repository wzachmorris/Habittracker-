// dateUtils.js - Date utility functions
export const formatDateKey = (date) => {
  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
};

export const getDateFromOffset = (offset) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date;
};

export const formatDateDisplay = (date) => {
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric' 
  }).format(date);
};

export const determinePeriod = (dateString) => {
  const date = new Date(dateString);
  const hour = date.getHours();
  
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};