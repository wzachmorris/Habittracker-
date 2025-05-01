import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function BottomNavigation() {
  const location = useLocation();
  const { t } = useTranslation('common');
  
  // Helper function to determine if a link is active
  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };
  
  return (
    <div className="bottom-nav-container">
      <nav className="bottom-nav">
        <Link to="/" className={`bottom-nav-item ${isActive('/') ? 'active' : ''}`}>
          <div className="bottom-nav-icon">🏠</div>
          <span>{t('navigation.home')}</span>
        </Link>
        
        <Link to="/activities" className={`bottom-nav-item ${isActive('/activities') ? 'active' : ''}`}>
          <div className="bottom-nav-icon">📋</div>
          <span>{t('navigation.activities')}</span>
        </Link>
        
        <Link to="/countdown" className={`bottom-nav-item ${isActive('/countdown') ? 'active' : ''}`}>
          <div className="bottom-nav-icon">⏱️</div>
          <span>{t('navigation.countdown')}</span>
        </Link>
        
        <Link to="/habits" className={`bottom-nav-item ${isActive('/habits') ? 'active' : ''}`}>
          <div className="bottom-nav-icon">📅</div>
          <span>{t('navigation.habits')}</span>
        </Link>
        
        <Link to="/streaks" className={`bottom-nav-item ${isActive('/streaks') ? 'active' : ''}`}>
          <div className="bottom-nav-icon">🔥</div>
          <span>{t('navigation.streaks')}</span>
        </Link>
        
        <Link to="/insights" className={`bottom-nav-item ${isActive('/insights') ? 'active' : ''}`}>
          <div className="bottom-nav-icon">📊</div>
          <span>{t('navigation.insights')}</span>
        </Link>
        
        <Link to="/leaderboard" className={`bottom-nav-item ${isActive('/leaderboard') ? 'active' : ''}`}>
          <div className="bottom-nav-icon">🏆</div>
          <span>{t('navigation.leaderboard')}</span>
        </Link>
        
        <Link to="/profile" className={`bottom-nav-item ${isActive('/profile') ? 'active' : ''}`}>
          <div className="bottom-nav-icon">👤</div>
          <span>{t('navigation.profile')}</span>
        </Link>
      </nav>
    </div>
  );
}

export default BottomNavigation;