import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { Dropdown } from 'react-bootstrap';
import LanguageSelector from './LanguageSelector';

function Header({ title }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const { t } = useTranslation('common');
  
  const pageTitle = title || t('app.name');
  const showSubtitle = !title; // Only show subtitle on main page
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <header className="my-4 text-center position-relative">
      <div className="position-absolute" style={{ right: '15px', top: '5px' }}>
        {isAuthenticated ? (
          <Dropdown show={showDropdown} onToggle={(isOpen) => setShowDropdown(isOpen)}>
            <Dropdown.Toggle variant="outline-primary" id="profile-dropdown" className="rounded-circle">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="rounded-circle" 
                  style={{ width: '24px', height: '24px', objectFit: 'cover' }} 
                />
              ) : (
                <i className="bi bi-person"></i>
              )}
            </Dropdown.Toggle>

            <Dropdown.Menu align="end">
              <Dropdown.Item as={Link} to="/profile">{t('navigation.profile')}</Dropdown.Item>
              <Dropdown.Item as={Link} to="/activities">{t('navigation.activities')}</Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        ) : (
          <Link to="/login" className="btn btn-sm btn-outline-primary">
            Login
          </Link>
        )}
      </div>
      <div className="d-flex align-items-center justify-content-center gap-3">
        <div>
          <h1>{pageTitle}</h1>
          {showSubtitle && (
            <p className="text-muted">{t('welcome.subtitle')}</p>
          )}
        </div>
        <div className="d-none d-md-block">
          <LanguageSelector size="sm" />
        </div>
      </div>
    </header>
  );
}

export default Header;