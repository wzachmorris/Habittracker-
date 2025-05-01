// /backend/controllers/leaderboard.js
const LeaderboardCategory = require('../models/LeaderboardCategory');
const LeaderboardEntry = require('../models/LeaderboardEntry');
const Activity = require('../models/Activity');
const User = require('../models/User');
const initialCategories = require('../data/leaderboardCategories');
const mongoose = require('mongoose');

// Helper function to calculate streak for a habit
const calculateStreak = (activity) => {
  if (!activity.completions || Object.keys(activity.completions).length === 0) {
    return 0;
  }
  
  // Get all completion dates where value is true
  const completionDates = Object.entries(activity.completions)
    .filter(([_, isCompleted]) => isCompleted === true)
    .map(([date]) => date)
    .sort((a, b) => new Date(b) - new Date(a)); // Sort from newest to oldest
  
  if (completionDates.length === 0) {
    return 0;
  }
  
  // Get today and yesterday dates as strings
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  // Check if completed today
  const isCompletedToday = completionDates.includes(todayStr);
  
  // If not completed today or yesterday, streak is broken
  if (!isCompletedToday && !completionDates.includes(yesterdayStr)) {
    return 0;
  }
  
  // Start with streak of 1 if completed today
  let streak = isCompletedToday ? 1 : 0;
  
  // If completed yesterday, add to streak and check consecutive days
  if (completionDates.includes(yesterdayStr)) {
    streak = Math.max(streak, 1);
    
    // Check consecutive days before yesterday
    let checkDate = new Date(yesterday);
    let checking = true;
    
    while (checking) {
      checkDate.setDate(checkDate.getDate() - 1);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      if (completionDates.includes(dateStr)) {
        streak++;
      } else {
        checking = false;
      }
    }
  }
  
  return streak;
};

// Function to seed initial categories - will be called automatically when needed
const seedInitialCategories = async () => {
  try {
    // Check if we have any categories at all
    const count = await LeaderboardCategory.countDocuments();
    if (count === 0) {
      console.log('No leaderboard categories found. Seeding initial categories...');
      
      // Insert all initial categories
      await LeaderboardCategory.insertMany(initialCategories);
      console.log(`Successfully seeded ${initialCategories.length} leaderboard categories`);
    }
  } catch (error) {
    console.error('Error seeding initial categories:', error);
  }
};

// Get all leaderboard categories
exports.getCategories = async (req, res) => {
  try {
    // First check if we need to seed initial categories
    await seedInitialCategories();
    
    // Only return active categories
    const categories = await LeaderboardCategory.find({ isActive: true });
    
    // Add participant count to each category
    const categoriesWithCounts = await Promise.all(categories.map(async (category) => {
      const count = await LeaderboardEntry.countDocuments({ 
        categoryId: category._id,
        showOnLeaderboard: true
      });
      
      // Get highest streak in category
      const topEntry = await LeaderboardEntry.findOne({ 
        categoryId: category._id,
        showOnLeaderboard: true
      }).sort({ currentStreak: -1 }).limit(1);
      
      return {
        id: category._id,
        name: category.name,
        emoji: category.emoji,
        description: category.description,
        count: count,
        topStreak: topEntry ? topEntry.currentStreak : 0
      };
    }));
    
    res.json(categoriesWithCounts);
  } catch (error) {
    console.error('Error fetching leaderboard categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get entries for a specific category
exports.getCategoryEntries = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // Find all entries for this category, sorted by streak
    const entries = await LeaderboardEntry.find({ 
      categoryId,
      showOnLeaderboard: true
    }).sort({ currentStreak: -1 }).limit(100);
    
    res.json(entries);
  } catch (error) {
    console.error('Error fetching leaderboard entries:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add an entry to a leaderboard
exports.addEntry = async (req, res) => {
  try {
    // Fix: Extract userId from req.user instead of req directly
    const userId = req.user.userId;
    const { categoryId, activityId } = req.body;
    
    // Check if category exists
    const category = await LeaderboardCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Check if activity exists and belongs to the user
    const activity = await Activity.findOne({ _id: activityId, userId });
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found or does not belong to you' });
    }
    
    // Get the user for username
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Calculate current streak
    const currentStreak = calculateStreak(activity);
    
    // Check if entry already exists for this user and category
    const existingEntry = await LeaderboardEntry.findOne({ userId, categoryId });
    
    if (existingEntry) {
      // Update existing entry
      existingEntry.activityId = activityId;
      existingEntry.currentStreak = currentStreak;
      existingEntry.lastUpdated = Date.now();
      existingEntry.showOnLeaderboard = true;
      
      await existingEntry.save();
      
      return res.json(existingEntry);
    }
    
    // Create new entry
    const newEntry = new LeaderboardEntry({
      userId,
      categoryId,
      activityId,
      username: user.name || 'Anonymous User',
      avatar: user.avatar || '😀',
      currentStreak,
      lastUpdated: Date.now(),
      showOnLeaderboard: true
    });
    
    await newEntry.save();
    
    res.status(201).json(newEntry);
  } catch (error) {
    console.error('Error adding leaderboard entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove an entry from a leaderboard
exports.removeEntry = async (req, res) => {
  try {
    // Fix: Extract userId from req.user instead of req directly
    const userId = req.user.userId;
    const { categoryId } = req.params;
    
    // Find and update the entry (don't actually delete, just hide)
    const entry = await LeaderboardEntry.findOne({ userId, categoryId });
    
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    
    // Set flag to hide from leaderboard
    entry.showOnLeaderboard = false;
    await entry.save();
    
    res.json({ message: 'Entry removed from leaderboard' });
  } catch (error) {
    console.error('Error removing leaderboard entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update leaderboard entries (to be called by cron job or manually)
exports.updateLeaderboardEntries = async (req, res) => {
  try {
    // Find all visible entries
    const entries = await LeaderboardEntry.find({ showOnLeaderboard: true });
    
    // Update streak for each entry
    const updates = await Promise.all(entries.map(async (entry) => {
      try {
        const activity = await Activity.findById(entry.activityId);
        
        if (!activity) {
          // Activity no longer exists, hide from leaderboard
          entry.showOnLeaderboard = false;
          await entry.save();
          return { id: entry._id, status: 'hidden' };
        }
        
        // Calculate current streak
        const currentStreak = calculateStreak(activity);
        
        // Update entry
        entry.currentStreak = currentStreak;
        entry.lastUpdated = Date.now();
        await entry.save();
        
        return { id: entry._id, status: 'updated', streak: currentStreak };
      } catch (error) {
        console.error(`Error updating entry ${entry._id}:`, error);
        return { id: entry._id, status: 'error' };
      }
    }));
    
    res.json({
      message: 'Leaderboard entries updated',
      updates
    });
  } catch (error) {
    console.error('Error updating leaderboard entries:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Suggest a new category
exports.suggestCategory = async (req, res) => {
  try {
    const { name, emoji, description } = req.body;
    
    // Validate inputs
    if (!name || !emoji) {
      return res.status(400).json({ message: 'Name and emoji are required' });
    }
    
    // Check if category already exists
    const existingCategory = await LeaderboardCategory.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existingCategory) {
      return res.status(400).json({ message: 'A category with this name already exists' });
    }
    
    // Create new category (inactive by default, to be reviewed)
    const newCategory = new LeaderboardCategory({
      name,
      emoji,
      description: description || '',
      isActive: false // Requires admin approval
    });
    
    await newCategory.save();
    
    res.status(201).json({
      message: 'Category suggestion submitted for review',
      category: {
        id: newCategory._id,
        name: newCategory.name,
        emoji: newCategory.emoji
      }
    });
  } catch (error) {
    console.error('Error suggesting leaderboard category:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's synced habits
exports.getUserSyncedHabits = async (req, res) => {
  try {
    // Fix: Extract userId from req.user instead of req directly
    const userId = req.user.userId;
    
    // Find all entries for this user
    const entries = await LeaderboardEntry.find({ userId }).populate('categoryId');
    
    // For each entry, get the activity details
    const syncedHabits = await Promise.all(entries.map(async (entry) => {
      const activity = await Activity.findById(entry.activityId);
      
      return {
        entryId: entry._id,
        categoryId: entry.categoryId._id,
        categoryName: entry.categoryId.name,
        categoryEmoji: entry.categoryId.emoji,
        activityId: entry.activityId,
        activityName: activity ? activity.name : 'Unknown Activity',
        streak: entry.currentStreak,
        showOnLeaderboard: entry.showOnLeaderboard,
        lastUpdated: entry.lastUpdated
      };
    }));
    
    res.json(syncedHabits);
  } catch (error) {
    console.error('Error fetching user synced habits:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's available habits for syncing
exports.getUserHabitsForSync = async (req, res) => {
  try {
    // Fix: Extract userId from req.user instead of req directly
    const userId = req.user.userId;
    
    console.log(`[Leaderboard] Getting habits for syncing for user: ${userId}`);
    
    // Get all habits for this user
    const habits = await Activity.find({ userId, isHabit: true });
    
    console.log(`[Leaderboard] Found ${habits.length} habits for user ${userId}`);
    
    if (habits.length === 0) {
      // Log the reason why we're not finding habits
      console.log(`[Leaderboard] No habits found for user with userId=${userId}. Possible reasons:`);
      console.log('1. User has no habits created');
      console.log('2. Habits exist but userId mismatch');
      
      // Let's check how many total habits exist to help debug
      const totalHabits = await Activity.countDocuments({ isHabit: true });
      console.log(`[Leaderboard] Total habits in database: ${totalHabits}`);
      
      // Check if any activities at all exist for this user
      const totalUserActivities = await Activity.countDocuments({ userId });
      console.log(`[Leaderboard] Total activities for this user: ${totalUserActivities}`);
      
      // If there are activities but no habits, they might not be marked as habits
      if (totalUserActivities > 0) {
        console.log('[Leaderboard] User has activities but none marked as habits. Showing all activities instead:');
        const allActivities = await Activity.find({ userId });
        console.log(allActivities.map(a => ({ id: a._id, name: a.name, isHabit: a.isHabit })));
        
        // Return all activities instead, even if not marked as habits
        const activitiesWithStreaks = allActivities.map(activity => {
          const streak = calculateStreak(activity);
          
          return {
            id: activity._id,
            name: activity.name,
            period: activity.period,
            streak: streak,
            isHabit: activity.isHabit || false
          };
        });
        
        return res.json(activitiesWithStreaks);
      }
    }
    
    // Calculate current streak for each habit
    const habitsWithStreaks = habits.map(habit => {
      // Try to calculate streak, defaulting to 0 if it fails
      let streak = 0;
      try {
        streak = calculateStreak(habit);
      } catch (e) {
        console.error(`[Leaderboard] Error calculating streak for habit ${habit._id}:`, e);
      }
      
      return {
        id: habit._id,
        name: habit.name,
        period: habit.period,
        streak: streak
      };
    });
    
    res.json(habitsWithStreaks);
  } catch (error) {
    console.error('Error fetching user habits for sync:', error);
    res.status(500).json({ message: 'Server error' });
  }
};