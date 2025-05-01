// Theme utility to manage theme across application

// Initialize theme from localStorage
export const initTheme = () => {
  const storedTheme = localStorage.getItem('userTheme') || 'light';
  applyTheme(storedTheme);
  
  return storedTheme;
};

// Apply theme to document body
export const applyTheme = (theme) => {
  document.body.setAttribute('data-theme', theme);
  
  // For mobile browsers, also set meta theme-color
  const metaThemeColor = document.querySelector('meta[name=theme-color]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'dark' ? '#343a40' : '#007bff');
  }
};

// Toggle between light and dark themes
export const toggleTheme = () => {
  const currentTheme = document.body.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  localStorage.setItem('userTheme', newTheme);
  applyTheme(newTheme);
  
  return newTheme;
};

// Get current theme
export const getCurrentTheme = () => {
  return document.body.getAttribute('data-theme') || 'light';
};