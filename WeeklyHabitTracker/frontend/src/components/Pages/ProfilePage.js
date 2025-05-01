import React, { useState, useEffect } from 'react';
import PageWrapper from '../PageWrapper';
import Header from '../Header';
import { getUserProfile, updateUserProfile } from '../../services/api';
import { applyTheme } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';

function ProfilePage() {
  // Get authentication context data
  const { user, isAuthenticated, loading } = useAuth();
  
  // Get language context and translation
  const { language, changeLanguage, languages } = useLanguage();
  const { t } = useTranslation('common');
  
  // User profile state
  const [profile, setProfile] = useState(null);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({});
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // MongoDB connection state
  const [isMongoConnected, setIsMongoConnected] = useState(true);
  const [storageMode, setStorageMode] = useState('MongoDB');
  
  // Helper function to load user data
  const loadUserData = async () => {
    // Ensure we have a user ID before attempting to fetch
    if (!user?.userId) {
      console.log("Profile page: No userId available yet, waiting for auth context");
      return;
    }
    
    try {
      setIsLoading(true);
      console.log("Profile page: Loading data for user ID:", user.userId);
      
      // Fetch user profile with userId from auth context
      const userProfile = await getUserProfile(user.userId);
      console.log("Profile page: Received profile data:", userProfile);
      
      setProfile(userProfile);
      setFormData(userProfile);
      
      // Check if we got a proper MongoDB response or a localStorage fallback
      if (userProfile._id || userProfile.fromMongo) {
        setIsMongoConnected(true);
        setStorageMode('MongoDB');
      } else {
        setIsMongoConnected(false);
        setStorageMode('Local Storage');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      setIsMongoConnected(false);
      setStorageMode('Local Storage');
      setIsLoading(false);
    }
  };
  
  // Load profile when auth context is ready and not loading
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      console.log("Auth context ready, loading profile for:", user.name);
      loadUserData();
    }
  }, [loading, isAuthenticated, user]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Update form data
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Apply theme immediately if theme is changed
    if (name === 'theme') {
      applyTheme(value);
    }
  };
  
  // Handle goals (adding and removing)
  const handleAddGoal = () => {
    if (formData.newGoal && formData.newGoal.trim()) {
      const updatedGoals = [...(formData.goals || []), formData.newGoal.trim()];
      setFormData({
        ...formData,
        goals: updatedGoals,
        newGoal: ''
      });
    }
  };
  
  const handleRemoveGoal = (index) => {
    const updatedGoals = [...formData.goals];
    updatedGoals.splice(index, 1);
    setFormData({
      ...formData,
      goals: updatedGoals
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Update user profile via API
      console.log("Profile page: Submitting updated profile");
      const result = await updateUserProfile(formData, user.userId);
      console.log("Profile page: Update result:", result);
      
      // Check if response indicates MongoDB was used
      if (result.profile && (result.profile._id || result.profile.fromMongo)) {
        setIsMongoConnected(true);
        setStorageMode('MongoDB');
      } else {
        setIsMongoConnected(false);
        setStorageMode('Local Storage');
      }
      
      // Reload user data to ensure everything is in sync
      await loadUserData();
      
      // Exit edit mode
      setIsEditing(false);
      
      // Show success message with storage info
      if (isMongoConnected) {
        alert('Profile updated successfully and stored in MongoDB!');
      } else {
        alert('Profile updated successfully but stored locally (MongoDB unavailable).');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setIsMongoConnected(false);
      setStorageMode('Local Storage');
      alert('Error connecting to database. Profile saved to local storage.');
    }
  };
  
  // If auth is still loading or we don't have a user, show loading
  if (loading || !user) {
    return (
      <PageWrapper>
        <Header title="User Profile" />
        <div className="d-flex justify-content-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading authentication...</span>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Header title="User Profile" />
      {isLoading ? (
        <div className="d-flex justify-content-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading profile data...</span>
          </div>
        </div>
      ) : (
      <div className="container mt-4 main-content">
        <div className="row">
          <div className="col-md-12 mb-4">
            <h2>User Profile</h2>
            <p className="text-muted">Manage your profile settings and preferences</p>
            <p className="text-muted">Authenticated as: {user.name} ({user.email})</p>
            
            <div className="row mt-4">
              {/* Profile Card */}
              <div className="col-md-12 mb-4">
                <div className="card">
                  <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <div>
                      <h3 className="mb-0">Your Profile</h3>
                      <small>
                        {isMongoConnected ? (
                          <span title="Data stored in MongoDB">
                            <i className="fas fa-database me-1"></i> MongoDB
                          </span>
                        ) : (
                          <span title="Using local storage (MongoDB unavailable)">
                            <i className="fas fa-save me-1"></i> Local Storage
                          </span>
                        )}
                      </small>
                    </div>
                    {!isEditing && profile && (
                      <button 
                        className="btn btn-light btn-sm"
                        onClick={() => setIsEditing(true)}
                      >
                        ✏️ Edit Profile
                      </button>
                    )}
                  </div>
                  
                  <div className="card-body">
                    {!profile && !isLoading ? (
                      <div className="alert alert-warning">
                        Unable to load profile data. Please try refreshing the page.
                      </div>
                    ) : isEditing ? (
                      // Edit Form
                      <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                          <label htmlFor="name" className="form-label">Name</label>
                          <input
                            type="text"
                            className="form-control"
                            id="name"
                            name="name"
                            value={formData.name || ''}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label htmlFor="email" className="form-label">Email</label>
                          <input
                            type="email"
                            className="form-control"
                            id="email"
                            name="email"
                            value={formData.email || ''}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label htmlFor="avatar" className="form-label">Profile Picture URL</label>
                          <input
                            type="url"
                            className="form-control"
                            id="avatar"
                            name="avatar"
                            value={formData.avatar || ''}
                            onChange={handleChange}
                            placeholder="https://example.com/your-avatar.jpg"
                          />
                          {formData.avatar && (
                            <div className="mt-2">
                              <img 
                                src={formData.avatar} 
                                alt="Profile Preview" 
                                className="img-thumbnail" 
                                style={{maxHeight: '100px'}} 
                              />
                            </div>
                          )}
                        </div>
                        
                        <div className="mb-3">
                          <label htmlFor="bio" className="form-label">Bio</label>
                          <textarea
                            className="form-control"
                            id="bio"
                            name="bio"
                            rows="3"
                            value={formData.bio || ''}
                            onChange={handleChange}
                            placeholder="Tell us a bit about yourself..."
                          ></textarea>
                        </div>
                        
                        <div className="mb-3">
                          <label htmlFor="theme" className="form-label">{t('profile.theme')}</label>
                          <select
                            className="form-select"
                            id="theme"
                            name="theme"
                            value={formData.theme || 'light'}
                            onChange={handleChange}
                          >
                            <option value="light">{t('profile.lightMode')}</option>
                            <option value="dark">{t('profile.darkMode')}</option>
                            <option value="system">System Default</option>
                          </select>
                        </div>
                        
                        {/* Language Selector */}
                        <div className="mb-3">
                          <label htmlFor="language" className="form-label">{t('profile.language')}</label>
                          <div className="position-relative">
                            <select
                              className="form-select"
                              id="language"
                              value={language}
                              onChange={(e) => changeLanguage(e.target.value)}
                              style={{
                                paddingLeft: '40px'
                              }}
                            >
                              {languages.map(lang => (
                                <option key={lang.code} value={lang.code}>
                                  {lang.name}
                                </option>
                              ))}
                            </select>
                            <div 
                              className="position-absolute" 
                              style={{ 
                                top: '50%', 
                                left: '12px', 
                                transform: 'translateY(-50%)',
                                fontSize: '1.1rem',
                                pointerEvents: 'none'
                              }}
                            >
                              {languages.find(lang => lang.code === language)?.flag}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <label htmlFor="dailyTarget" className="form-label">Daily Activity Target</label>
                          <input
                            type="number"
                            className="form-control"
                            id="dailyTarget"
                            name="dailyTarget"
                            min="1"
                            max="20"
                            value={formData.dailyTarget || '3'}
                            onChange={handleChange}
                          />
                          <div className="form-text">Set a target for how many activities you aim to complete each day</div>
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label">Personal Goals</label>
                          <div className="input-group mb-2">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Add a new goal..."
                              value={formData.newGoal || ''}
                              onChange={(e) => setFormData({...formData, newGoal: e.target.value})}
                            />
                            <button 
                              type="button" 
                              className="btn btn-outline-primary"
                              onClick={handleAddGoal}
                            >
                              Add
                            </button>
                          </div>
                          <ul className="list-group">
                            {(formData.goals || []).map((goal, index) => (
                              <li 
                                key={index} 
                                className="list-group-item d-flex justify-content-between align-items-center"
                              >
                                {goal}
                                <button 
                                  type="button" 
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleRemoveGoal(index)}
                                >
                                  &times;
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="d-flex justify-content-end mt-4">
                          <button
                            type="button"
                            className="btn btn-outline-secondary me-2"
                            onClick={() => {
                              setIsEditing(false);
                              setFormData({...profile});
                            }}
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            className="btn btn-primary"
                          >
                            Save Profile
                          </button>
                        </div>
                      </form>
                    ) : profile ? (
                      // Profile Display
                      <div className="row">
                        <div className="col-md-4 text-center mb-3">
                          {profile.avatar ? (
                            <img 
                              src={profile.avatar} 
                              alt={profile.name} 
                              className="img-fluid rounded-circle mb-3" 
                              style={{maxHeight: '150px'}} 
                            />
                          ) : (
                            <div 
                              className="bg-light rounded-circle mx-auto d-flex align-items-center justify-content-center mb-3" 
                              style={{width: '150px', height: '150px', fontSize: '3rem'}}
                            >
                              {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
                            </div>
                          )}
                          <h4>{profile.name || 'Anonymous User'}</h4>
                          <p className="text-muted mb-0">Member since {new Date(profile.joinDate).toLocaleDateString()}</p>
                        </div>
                        
                        <div className="col-md-8">
                          {profile.bio && (
                            <div className="mb-3">
                              <h5>About Me</h5>
                              <p>{profile.bio}</p>
                            </div>
                          )}
                          
                          <div className="mb-3">
                            <h5>Contact</h5>
                            <p className="mb-0">
                              <strong>Email:</strong> {profile.email || 'Not provided'}
                            </p>
                          </div>
                          
                          <div className="mb-3">
                            <h5>Preferences</h5>
                            <p className="mb-0">
                              <strong>{t('profile.theme')}:</strong> {profile.theme ? profile.theme.charAt(0).toUpperCase() + profile.theme.slice(1) : 'Light'}
                            </p>
                            <p className="mb-0">
                              <strong>{t('profile.language')}:</strong> {languages.find(lang => lang.code === language)?.flag} {languages.find(lang => lang.code === language)?.name}
                            </p>
                            <p className="mb-0">
                              <strong>Daily Target:</strong> {profile.dailyTarget || '3'} activities
                            </p>
                          </div>
                          
                          {profile.goals && profile.goals.length > 0 && (
                            <div className="mb-3">
                              <h5>Personal Goals</h5>
                              <ul className="list-group">
                                {profile.goals.map((goal, index) => (
                                  <li key={index} className="list-group-item">{goal}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Storage status indicator */}
                          <div className="mt-4 text-muted">
                            <small>
                              <strong>Data Storage:</strong> {storageMode}
                              {!isMongoConnected && (
                                <span className="ms-2 text-warning">
                                  (MongoDB connection unavailable)
                                </span>
                              )}
                            </small>
                          </div>
                          
                          {/* Buy Me a Coffee Button */}
                          <div className="mt-4 text-center">
                            <a 
                              href="https://buy.stripe.com/8wM9CR1KNgGGfhS6oy" 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="btn btn-outline-warning btn-sm"
                              style={{ borderRadius: '20px', fontSize: '0.9rem' }}
                            >
                              <i className="fas fa-coffee me-1"></i>
                              Buy the creator a coffee
                            </a>
                            <p className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                              Enjoying the app? Consider supporting future development. Thanks!
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </PageWrapper>
  );
}

export default ProfilePage;