const User = require('../models/User');
const inMemoryStorage = require('../storage/inMemoryStorage');
const mongoose = require('mongoose');
const { isMongoConnected } = require('../config/db');

// Get user profile by userId
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.query.userId || req.user?.userId;
    console.log(`Getting user profile for userId: ${userId}`);
    
    // Debug MongoDB connection
    console.log(`MongoDB connection state: ${mongoose.connection.readyState}`);
    console.log(`isMongoConnected() returns: ${isMongoConnected()}`);
    if (mongoose.connection.readyState === 1) {
      console.log(`Connected to database: ${mongoose.connection.name}`);
    }
    
    // Debug request details
    console.log('Request URL:', req.originalUrl);
    console.log('Params:', req.params);
    console.log('Body:', req.body);
    console.log('Query:', req.query);
    
    // Use MongoDB if connected, otherwise fallback to in-memory storage
    if (isMongoConnected()) {
      console.log('MongoDB is connected, using MongoDB storage');
      // Find the user or create a default one if not found
      let user;
      try {
        user = await User.findOne({ userId });
        console.log(`User found in MongoDB: ${!!user}`);
      } catch (findError) {
        console.error('Error finding user:', findError);
        return res.status(500).json({ message: 'Error finding user', error: findError.message });
      }
      
      if (!user) {
        console.log(`Creating new user in MongoDB for userId: ${userId}`);
        try {
          // Create new user with default values
          user = new User({ 
            userId,
            email: `${userId}@example.com`, // Add dummy email since it's required
            password: 'temporary123', // Add dummy password since it's required
            name: userId
          });
          await user.save();
          console.log('New user saved to MongoDB');
        } catch (saveError) {
          console.error('Error saving new user:', saveError);
          return res.status(500).json({ message: 'Error creating user', error: saveError.message });
        }
      }
      
      // Add a flag to indicate this data came from MongoDB
      const userData = user.toObject();
      userData.fromMongo = true;
      
      console.log('Returning user data from MongoDB');
      res.status(200).json(userData);
    } else {
      // Fallback to in-memory storage
      console.log('MongoDB not connected, using in-memory storage for user profile');
      const user = await inMemoryStorage.getUserProfile(userId);
      
      if (!user) {
        // Create a new user with default values
        const newUser = await inMemoryStorage.updateUserProfile(userId, { userId });
        // Add flag to indicate this is from in-memory storage
        newUser.fromMongo = false;
        return res.status(200).json(newUser);
      }
      
      // Add flag to indicate this is from in-memory storage
      user.fromMongo = false;
      res.status(200).json(user);
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.query.userId || req.user?.userId;
    const updateData = req.body;
    
    console.log(`Updating user profile for userId: ${userId}`);
    
    // Add updated timestamp
    updateData.updatedAt = Date.now();
    
    // Use MongoDB if connected, otherwise fallback to in-memory storage
    if (isMongoConnected()) {
      console.log('MongoDB is connected, updating profile in MongoDB');
      
      // Update and return the new document
      const user = await User.findOneAndUpdate(
        { userId },
        updateData,
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      
      console.log(`User profile updated in MongoDB: ${!!user}`);
      
      // Add a flag to indicate this data came from MongoDB
      const userData = user.toObject();
      userData.fromMongo = true;
      
      console.log('Returning updated user data from MongoDB');
      res.status(200).json(userData);
    } else {
      // Fallback to in-memory storage
      console.log('MongoDB not connected, using in-memory storage for user profile update');
      const updatedUser = await inMemoryStorage.updateUserProfile(userId, updateData);
      
      // Add a flag to indicate this is from in-memory storage
      updatedUser.fromMongo = false;
      
      res.status(200).json(updatedUser);
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};