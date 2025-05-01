import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import PageWrapper from '../PageWrapper';
import { useTranslation } from 'react-i18next';
import { 
  fetchLeaderboardCategories, 
  fetchCategoryEntries, 
  syncHabitToLeaderboard, 
  removeHabitFromLeaderboard, 
  suggestLeaderboardCategory,
  fetchUserHabitsForSync
} from '../../services/leaderboard';

// Default categories (used as fallback if API fails)
const DEFAULT_CATEGORIES = [
  { id: 'default_sleep', name: 'Sleeping', count: 0, emoji: '😴' },
  { id: 'default_gym', name: 'Going to the Gym', count: 0, emoji: '🏋️' },
  { id: 'default_reading', name: 'Reading', count: 0, emoji: '📚' },
  { id: 'default_running', name: 'Running', count: 0, emoji: '🏃' },
  { id: 'default_walking', name: 'Walking', count: 0, emoji: '🚶' },
  { id: 'default_guitar', name: 'Playing Guitar', count: 0, emoji: '🎸' },
  { id: 'default_meditation', name: 'Meditation', count: 0, emoji: '🧘' }
];

function LeaderboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userId = user?.userId || localStorage.getItem('userId');
  
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [leaderboardEntries, setLeaderboardEntries] = useState([]);
  const [userHabits, setUserHabits] = useState([]);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: '', emoji: '🏆', description: '' });
  
  // For new category form
  const [selectedEmoji, setSelectedEmoji] = useState('🏆');
  
  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      try {
        const categoriesData = await fetchLeaderboardCategories();
        if (categoriesData && categoriesData.length > 0) {
          setCategories(categoriesData);
        }
      } catch (err) {
        console.error('Error loading leaderboard categories:', err);
        setError('Failed to load leaderboard categories');
      } finally {
        setLoading(false);
      }
    };
    
    loadCategories();
  }, []);
  
  // Load leaderboard entries when a category is selected
  useEffect(() => {
    const loadLeaderboardEntries = async () => {
      if (!selectedCategory) return;
      
      // Check if we're dealing with a default category (which won't have data in the API)
      if (typeof selectedCategory === 'string' && selectedCategory.startsWith('default_')) {
        // For default categories, just clear entries and don't make the API call
        setLeaderboardEntries([]);
        // Instead of an error, show a more helpful message
        setError("This is a sample category. Real leaderboard data will be available once the database is populated.");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const entriesData = await fetchCategoryEntries(selectedCategory);
        setLeaderboardEntries(entriesData);
      } catch (err) {
        console.error('Error loading leaderboard entries:', err);
        setError('Failed to load leaderboard entries');
        setLeaderboardEntries([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadLeaderboardEntries();
  }, [selectedCategory]);
  
  // Load user habits when sync modal is opened
  useEffect(() => {
    const loadUserHabits = async () => {
      if (!showSyncModal) return;
      
      try {
        const habitsData = await fetchUserHabitsForSync();
        setUserHabits(habitsData);
      } catch (err) {
        console.error('Error loading user habits:', err);
        setError('Failed to load your habits');
        setUserHabits([]);
      }
    };
    
    loadUserHabits();
  }, [showSyncModal]);
  
  // Filter categories based on search query
  const filteredCategories = categories.filter(
    category => category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Rank the leaderboard entries
  const rankedLeaderboard = [...leaderboardEntries].sort((a, b) => b.currentStreak - a.currentStreak);
  
  // Helper function to safely extract category ID
  const getCategoryId = (category) => {
    // If it's a string ID (from DEFAULT_CATEGORIES), it won't work with the API
    // This check helps prevent API calls with invalid IDs
    if (typeof category.id === 'string' && category.id.startsWith('default_')) {
      return null;
    }
    return category.id;
  };
  
  // Handle selecting a category
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
  };
  
  // Handle going back to category list
  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setLeaderboardEntries([]);
  };
  
  // Handle selecting a habit to sync
  const handleHabitSelect = (habitId) => {
    setSelectedHabit(habitId);
  };
  
  // Handle syncing a habit
  const handleSyncHabit = async () => {
    if (!selectedHabit || !selectedCategory) {
      setError('Please select a habit to sync');
      return;
    }
    
    try {
      await syncHabitToLeaderboard(selectedCategory, selectedHabit);
      setShowSyncModal(false);
      
      // Refresh leaderboard entries
      const entriesData = await fetchCategoryEntries(selectedCategory);
      setLeaderboardEntries(entriesData);
    } catch (err) {
      console.error('Error syncing habit:', err);
      setError('Failed to sync habit to leaderboard');
    }
  };
  
  // Handle emoji selection for new category
  const handleEmojiSelect = (emoji) => {
    setSelectedEmoji(emoji);
    setNewCategory({ ...newCategory, emoji });
  };
  
  // Handle creating a new category
  const handleCreateCategory = async () => {
    if (!newCategory.name || !newCategory.emoji) {
      setError('Please provide a name and emoji for the new category');
      return;
    }
    
    try {
      await suggestLeaderboardCategory(newCategory.name, newCategory.emoji, newCategory.description);
      setShowNewCategoryModal(false);
      
      // Reset form
      setNewCategory({ name: '', emoji: '🏆', description: '' });
      
      // Show success message
      alert('Category suggestion submitted for review!');
    } catch (err) {
      console.error('Error suggesting category:', err);
      setError('Failed to submit category suggestion');
    }
  };
  
  // Get the selected category name and emoji
  const selectedCategoryObj = categories.find(cat => cat.id === selectedCategory) || {};
  const selectedCategoryName = selectedCategoryObj.name || '';
  const selectedCategoryEmoji = selectedCategoryObj.emoji || '';
  
  return (
    <PageWrapper>
      <div className="container mt-4 main-content">
        {/* Welcome Container */}
        <div className="welcome-container mb-4">
          <div className="welcome-message">
            <h4>{t('leaderboard.title')}</h4>
            <p>{t('leaderboard.extendedDescription')}</p>
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setError(null)}
              aria-label="Close"
            ></button>
          </div>
        )}
        
        {/* Loading indicator */}
        {loading && (
          <div className="text-center my-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">{t('common.loading')}</span>
            </div>
            <p className="mt-2">{t('leaderboard.loading')}</p>
            <p className="text-muted small">{t('leaderboard.waitMessage')}</p>
          </div>
        )}
        
        <div className="card">
          {selectedCategory ? (
            // Leaderboard view for selected category
            <div>
              <div className="card-header bg-white">
                <div className="d-flex align-items-center mb-3">
                  <button 
                    onClick={handleBackToCategories}
                    className="btn btn-sm btn-outline-secondary me-2"
                  >
                    <i className="bi bi-arrow-left"></i>
                  </button>
                  <h5 className="card-title mb-0">
                    {selectedCategoryEmoji} {selectedCategoryName} {t('leaderboard.title')}
                  </h5>
                </div>
                
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <span className="text-muted small">
                      {rankedLeaderboard.length} {t('leaderboard.competing')}
                    </span>
                  </div>
                  <div>
                    <button
                      onClick={() => setShowSyncModal(true)}
                      className="btn btn-sm btn-outline-primary"
                    >
                      <i className="bi bi-arrow-repeat me-1"></i> {t('leaderboard.syncHabit')}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Leaderboard entries */}
              <div className="card-body">
                <div className="list-group">
                  {rankedLeaderboard.map((entry, index) => (
                    <div 
                      key={entry.id}
                      className="list-group-item list-group-item-action d-flex align-items-center p-3"
                    >
                      <div className="fw-bold text-center" style={{width: '40px'}}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                      </div>
                      
                      <div className="ms-3 d-flex align-items-center flex-grow-1">
                        {entry.avatar && entry.avatar.startsWith('http') ? (
                          <div className="rounded-circle overflow-hidden" style={{width: '40px', height: '40px'}}>
                            <img src={entry.avatar} alt={entry.username} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                          </div>
                        ) : (
                          <div className="rounded-circle bg-light d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                            {entry.avatar || '😀'}
                          </div>
                        )}
                        <div className="ms-3">
                          <div className="fw-medium">
                            {entry.username}
                          </div>
                          {/* Social badges - conditionally render if entry.socials exists */}
                          {entry.socials && entry.socials.length > 0 && (
                            <div className="d-flex mt-1 gap-2">
                              {entry.socials.includes('twitter') && (
                                <span className="badge bg-info text-white">Twitter</span>
                              )}
                              {entry.socials.includes('instagram') && (
                                <span className="badge bg-danger text-white">Instagram</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-end">
                        <div className="fw-bold text-success">
                          {entry.currentStreak || entry.streak || 0} <span className="fw-normal small">days</span>
                        </div>
                        <div className="text-muted small">
                          {t('leaderboard.currentStreak')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Category selection view
            <div>
              <div className="card-header bg-white">
                <h5 className="card-title mb-3">{t('leaderboard.categories')}</h5>
                
                <div className="d-flex align-items-center justify-content-between">
                  <div className="position-relative flex-grow-1 me-3">
                    <input
                      type="text"
                      placeholder={t('leaderboard.searchCategories')}
                      className="form-control"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <span className="position-absolute top-50 end-0 translate-middle-y pe-3 text-muted">
                      🔍
                    </span>
                  </div>
                  
                  <button
                    onClick={() => setShowNewCategoryModal(true)}
                    className="btn btn-primary"
                  >
                    <i className="bi bi-plus me-1"></i> {t('leaderboard.newCategory')}
                  </button>
                </div>
              </div>
              
              {/* Categories grid */}
              <div className="card-body">
                <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                  {filteredCategories.map(category => (
                    <div
                      key={category.id}
                      className="col"
                    >
                      <div 
                        className="card h-100 border-0 shadow-sm cursor-pointer"
                        onClick={() => handleCategorySelect(category.id)}
                        style={{cursor: 'pointer'}}
                      >
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="fs-3">{category.emoji}</div>
                            <div className="small text-muted d-flex align-items-center">
                              <i className="bi bi-people me-1"></i>
                              {category.count} {t('leaderboard.peopleCompeting')}
                            </div>
                          </div>
                          
                          <h6 className="card-title">{category.name}</h6>
                          
                          <div className="mt-2 small d-flex align-items-center text-muted">
                            <i className="bi bi-trophy text-warning me-1"></i>
                            Leader: {category.count > 0 ? 
                              `${category.topStreak || 0} day streak` : 
                              'No entries yet'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Sync Modal - improved for mobile */}
      {showSyncModal && (
        <div className="modal-container mobile-friendly-modal" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: '15px'
        }}>
          <div 
            className="modal-backdrop" 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: -1
            }}
            onClick={() => setShowSyncModal(false)}
          ></div>
          <div className="modal-dialog modal-dialog-centered w-100 m-0">
            <div className="modal-content shadow" style={{ 
              backgroundColor: 'var(--card-bg)', 
              color: 'var(--text-color)',
              borderRadius: '12px',
              overflow: 'hidden',
              maxHeight: '90vh'
            }}>
              <div className="modal-header" style={{ 
                borderBottomColor: 'rgba(0,0,0,0.1)',
                padding: '15px 20px'
              }}>
                <h5 className="modal-title fs-6">
                  Sync Your Habit to "{selectedCategoryName}"
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  style={{
                    border: '1px solid #dee2e6',
                    borderRadius: '50%',
                    padding: '8px',
                    backgroundColor: '#fff'
                  }}
                  onClick={() => setShowSyncModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body" style={{ 
                padding: '20px',
                overflowY: 'auto',
                maxHeight: 'calc(70vh - 130px)'
              }}>
                <p className="alert alert-info mb-3">
                  Choose one of your habits to sync with this category. Your streak will be displayed on the leaderboard.
                </p>
                
                {userHabits.length > 0 ? (
                  <div className="list-group mb-3">
                    {userHabits.map(habit => (
                      <div 
                        key={habit.id}
                        className={`list-group-item list-group-item-action cursor-pointer ${selectedHabit === habit.id ? 'active' : ''}`}
                        style={{
                          cursor: 'pointer',
                          padding: '12px 15px',
                          borderRadius: '8px',
                          marginBottom: '8px'
                        }}
                        onClick={() => handleHabitSelect(habit.id)}
                      >
                        <div className="fw-medium">{habit.name}</div>
                        <div className="small mt-1" style={{color: selectedHabit === habit.id ? '#fff' : '#6c757d'}}>
                          {habit.streak} day streak • {habit.period}
                          {habit.isHabit === false && <span className="badge bg-warning ms-2">Activity</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="alert alert-info">
                    <div className="d-flex align-items-center">
                      <div className="me-3 fs-4">😢</div>
                      <div>
                        <p className="mb-0">You don't have any habits to sync. Create some habits first!</p>
                        <small className="text-muted mt-2 d-block">
                          To create a habit, go to the home page and add a new activity with the "Habit" option checked.
                          <br />
                          If you already have habits, try restarting the server to ensure proper data loading.
                        </small>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer d-flex justify-content-between" style={{ 
                borderTopColor: 'rgba(0,0,0,0.1)',
                padding: '15px 20px',
                flexWrap: 'nowrap'
              }}>
                <button 
                  type="button" 
                  className="btn btn-secondary flex-grow-1 me-2" 
                  style={{
                    borderRadius: '8px',
                    minHeight: '46px'
                  }}
                  onClick={() => {
                    setShowSyncModal(false);
                    setSelectedHabit(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary flex-grow-1"
                  style={{
                    borderRadius: '8px',
                    minHeight: '46px'
                  }}
                  onClick={handleSyncHabit}
                  disabled={!selectedHabit || userHabits.length === 0}
                >
                  Sync Habit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* New Category Modal - improved for mobile */}
      {showNewCategoryModal && (
        <div className="modal-container mobile-friendly-modal" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: '15px'
        }}>
          <div 
            className="modal-backdrop" 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: -1
            }}
            onClick={() => setShowNewCategoryModal(false)}
          ></div>
          <div className="modal-dialog modal-dialog-centered w-100 m-0">
            <div className="modal-content shadow" style={{ 
              backgroundColor: 'var(--card-bg)', 
              color: 'var(--text-color)',
              borderRadius: '12px',
              overflow: 'hidden',
              maxHeight: '90vh'
            }}>
              <div className="modal-header" style={{ 
                borderBottomColor: 'rgba(0,0,0,0.1)',
                padding: '15px 20px'
              }}>
                <h5 className="modal-title fs-6">
                  Suggest New Habit Category
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  style={{
                    border: '1px solid #dee2e6',
                    borderRadius: '50%',
                    padding: '8px',
                    backgroundColor: '#fff'
                  }}
                  onClick={() => setShowNewCategoryModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body" style={{ 
                padding: '20px',
                overflowY: 'auto',
                maxHeight: 'calc(70vh - 130px)'
              }}>
                <p className="alert alert-info mb-3">
                  Your suggestion will be reviewed by our team to ensure it doesn't duplicate existing categories.
                </p>
                
                <div className="mb-3">
                  <label className="form-label">
                    Category Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Gardening, Journaling, etc."
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '16px' /* prevent zoom on iOS */
                    }}
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">
                    Category Description
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Briefly describe what this habit category is about..."
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '16px' /* prevent zoom on iOS */
                    }}
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">
                    Choose an Emoji
                  </label>
                  <div className="d-flex flex-wrap gap-3">
                    {['🏋️', '🧘', '🏃', '🚶', '🍱', '🧠', '📚', '✍️', '🎯', '🎸', '🎨', '🌱'].map(emoji => (
                      <div 
                        key={emoji}
                        className={`d-flex align-items-center justify-content-center border rounded p-2 ${emoji === selectedEmoji ? 'border-primary bg-light' : ''}`}
                        style={{
                          width: '48px', 
                          height: '48px', 
                          cursor: 'pointer',
                          fontSize: '24px'
                        }}
                        onClick={() => handleEmojiSelect(emoji)}
                      >
                        {emoji}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer d-flex justify-content-between" style={{ 
                borderTopColor: 'rgba(0,0,0,0.1)',
                padding: '15px 20px',
                flexWrap: 'nowrap'
              }}>
                <button 
                  type="button" 
                  className="btn btn-secondary flex-grow-1 me-2" 
                  style={{
                    borderRadius: '8px',
                    minHeight: '46px'
                  }}
                  onClick={() => {
                    setShowNewCategoryModal(false);
                    setNewCategory({ name: '', emoji: '🏆', description: '' });
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary flex-grow-1"
                  style={{
                    borderRadius: '8px',
                    minHeight: '46px'
                  }}
                  onClick={handleCreateCategory}
                  disabled={!newCategory.name || !newCategory.emoji}
                >
                  Submit for Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

export default LeaderboardPage;