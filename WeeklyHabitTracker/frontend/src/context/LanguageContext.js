import React, { createContext, useState, useEffect, useContext } from 'react';
import i18n from '../i18n';

// Create the language context
const LanguageContext = createContext();

// Custom hook to use the language context
export const useLanguage = () => useContext(LanguageContext);

// Provider component
export const LanguageProvider = ({ children }) => {
  // Get initial language from localStorage or set to 'en'
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');
  
  // Handle language change
  const changeLanguage = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
    i18n.changeLanguage(newLang);
    
    // If we want to save to user profile in the future, we can add API call here
  };
  
  // Initialize the language on component mount
  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);
  
  // Context value
  const value = {
    language,
    changeLanguage,
    // Add language names and flags for the UI
    languages: [
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'es', name: 'Español', flag: '🇪🇸' },
      { code: 'pt', name: 'Português', flag: '🇧🇷' }
    ]
  };
  
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;