import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const LanguageSelector = ({ size = 'md' }) => {
  const { language, changeLanguage, languages } = useLanguage();
  
  return (
    <div className="language-selector">
      {/* Custom styled select with flag icons */}
      <div className="position-relative">
        <select 
          value={language} 
          onChange={(e) => changeLanguage(e.target.value)}
          className={`form-select form-select-${size}`}
          style={{
            minWidth: '140px',
            borderRadius: '8px',
            padding: size === 'sm' ? '4px 8px 4px 32px' : '8px 12px 8px 40px',
            cursor: 'pointer',
            appearance: 'auto' // Keep default appearance for better visibility of dropdown arrow
          }}
          aria-label="Select language"
        >
          {languages.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
        {/* Show current language flag - only displayed in the dropdown button, not in the options */}
        <div 
          className="position-absolute" 
          style={{ 
            top: '50%', 
            left: size === 'sm' ? '8px' : '12px', 
            transform: 'translateY(-50%)',
            fontSize: size === 'sm' ? '0.9rem' : '1.1rem',
            pointerEvents: 'none'
          }}
        >
          {languages.find(lang => lang.code === language)?.flag}
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;