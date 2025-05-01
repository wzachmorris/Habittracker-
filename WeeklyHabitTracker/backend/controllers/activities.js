// /backend/controllers/activities.js
const Activity = require('../models/Activity');
const inMemoryStorage = require('../storage/inMemoryStorage');
const { isMongoConnected } = require('../config/db');

// Get all activities for a user
exports.getActivities = async (req, res) => {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }
    
    let activities;
    
    if (isMongoConnected()) {
      // Use MongoDB
      activities = await Activity.find({ userId });
    } else {
      // Use in-memory storage
      activities = await inMemoryStorage.getActivities(userId);
    }
    
    res.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new activity
exports.createActivity = async (req, res) => {
  try {
    const { 
      name, 
      duration, 
      period, 
      userId, 
      repeatDays, 
      isHabit, 
      daySpecificNotes, 
      notes,
      order // Add order to destructured fields
    } = req.body;
    
    if (!name || !duration || !period || !userId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    let savedActivity;
    
    if (isMongoConnected()) {
      // Use MongoDB
      const activity = new Activity({
        name,
        duration,
        period,
        userId,
        repeatDays,
        isHabit,
        daySpecificNotes,
        notes,
        order: order || 0, // Use provided order or default to 0
        completions: {} // Initialize empty completions object
      });
      
      savedActivity = await activity.save();
    } else {
      // Use in-memory storage
      savedActivity = await inMemoryStorage.createActivity({
        name,
        duration,
        period,
        userId,
        repeatDays,
        isHabit,
        daySpecificNotes,
        notes,
        order: order || 0, // Use provided order or default to 0
        completions: {} // Initialize empty completions object
      });
    }
    
    res.status(201).json(savedActivity);
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update an activity
exports.updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    let activity;
    
    if (isMongoConnected()) {
      // Use MongoDB
      activity = await Activity.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );
    } else {
      // Use in-memory storage
      activity = await inMemoryStorage.updateActivity(id, updateData);
    }
    
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    
    res.json(activity);
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete an activity
exports.deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    
    let result;
    
    if (isMongoConnected()) {
      // Use MongoDB
      result = await Activity.findByIdAndDelete(id);
    } else {
      // Use in-memory storage
      result = await inMemoryStorage.deleteActivity(id);
    }
    
    if (!result) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle completion status for an activity
exports.completeActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, date } = req.body;
    
    console.log(`[Backend] Toggling completion for activity ${id}, userId: ${userId}, date: ${date}`);
    
    if (!userId || !date) {
      console.error('[Backend] Missing userId or date in request');
      return res.status(400).json({ message: 'userId and date are required' });
    }
    
    // Format date as YYYY-MM-DD for consistent storage
    const dateStr = new Date(date).toISOString().split('T')[0];
    console.log(`[Backend] Formatted date: ${dateStr}`);
    
    if (isMongoConnected()) {
      // Find the activity
      const activity = await Activity.findById(id);
      
      if (!activity) {
        console.error(`[Backend] Activity ${id} not found`);
        return res.status(404).json({ message: 'Activity not found' });
      }
      
      // Initialize completions object if it doesn't exist
      activity.completions = activity.completions || {};
      
      console.log(`[Backend] BEFORE toggle - Activity completions:`, activity.completions);
      
      // Check current completion status to determine action
      let isNowCompleted;
      
      // IMPORTANT CHANGE: Instead of using $unset, we use $set to make the status explicit
      if (!activity.completions[dateStr] || activity.completions[dateStr] === false) {
        // Currently not complete or explicitly marked false, so mark as true
        isNowCompleted = true;
        console.log(`[Backend] Activity ${id} marked as completed for date ${dateStr}`);
        
        // Update using $set to explicitly set to true
        await Activity.updateOne(
          { _id: id },
          { $set: { [`completions.${dateStr}`]: true } }
        );
      } else {
        // Currently complete, so mark as explicitly false (not removed)
        isNowCompleted = false;
        console.log(`[Backend] Activity ${id} marked as incomplete for date ${dateStr}`);
        
        // Using MongoDB's $set operator to mark as false
        await Activity.updateOne(
          { _id: id },
          { $set: { [`completions.${dateStr}`]: false } }
        );
      }
      
      // Reload the activity to get the updated state for logging
      const updatedActivity = await Activity.findById(id);
      console.log(`[Backend] AFTER update - Activity completions:`, updatedActivity.completions);
      
      console.log(`[Backend] Activity saved to database`);
      
      const response = {
        updated: true,
        completion: {
          activityId: id,
          date: dateStr,
          completed: isNowCompleted
        }
      };
      console.log(`[Backend] Sending response:`, response);
      
      return res.json(response);
    } else {
      // Use in-memory storage
      console.log(`[Backend] Using in-memory storage (MongoDB not connected)`);
      const completion = await inMemoryStorage.completeActivity(id, userId, new Date(date));
      res.json({ updated: true, completion });
    }
  } catch (error) {
    console.error('[Backend] Error completing activity:', error);
    res.status(500).json({ message: 'Server error' });
  }
};