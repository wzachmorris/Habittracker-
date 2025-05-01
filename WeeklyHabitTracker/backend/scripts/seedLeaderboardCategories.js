// /backend/scripts/seedLeaderboardCategories.js
const mongoose = require('mongoose');
const LeaderboardCategory = require('../models/LeaderboardCategory');
require('dotenv').config();

// MongoDB connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/habit-tracker';

// Categories to seed
const categoriesToSeed = [
  { name: 'Sleeping', emoji: '😴', description: 'Track your sleep habits and consistency', isActive: true },
  { name: 'Going to the Gym', emoji: '🏋️', description: 'Regular exercise and gym attendance', isActive: true },
  { name: 'Reading', emoji: '📚', description: 'Daily reading of books, articles, or other materials', isActive: true },
  { name: 'Running', emoji: '🏃', description: 'Jogging, running, and other cardio activities', isActive: true },
  { name: 'Walking', emoji: '🚶', description: 'Daily steps and walking routines', isActive: true },
  { name: 'Playing Guitar', emoji: '🎸', description: 'Practice sessions for guitar or other musical instruments', isActive: true },
  { name: 'Meditation', emoji: '🧘', description: 'Mindfulness, meditation, and breathing exercises', isActive: true },
  { name: 'Writing', emoji: '✍️', description: 'Journal entries, creative writing, or professional writing', isActive: true },
  { name: 'Cooking', emoji: '👨‍🍳', description: 'Preparing healthy meals and improving cooking skills', isActive: true },
  { name: 'Cycling', emoji: '🚴', description: 'Outdoor or indoor cycling workouts', isActive: true },
  { name: 'Yoga', emoji: '🧘‍♀️', description: 'Yoga sessions and flexibility training', isActive: true },
  { name: 'Learning Languages', emoji: '🗣️', description: 'Daily language learning practice', isActive: true }
];

async function seedCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete existing categories if you want to start fresh
    // Uncomment the next line if you want to remove existing categories first
    // await LeaderboardCategory.deleteMany({});

    // Check which categories already exist to avoid duplicates
    const existingCategories = await LeaderboardCategory.find({});
    const existingNames = existingCategories.map(cat => cat.name.toLowerCase());

    // Filter out categories that already exist
    const newCategories = categoriesToSeed.filter(
      cat => !existingNames.includes(cat.name.toLowerCase())
    );

    if (newCategories.length === 0) {
      console.log('All categories already exist in the database. No new categories added.');
    } else {
      // Insert new categories
      const result = await LeaderboardCategory.insertMany(newCategories);
      console.log(`Successfully seeded ${result.length} new categories:`);
      result.forEach(cat => {
        console.log(`- ${cat.emoji} ${cat.name} (${cat._id})`);
      });
    }

    // Log all categories in the database
    const allCategories = await LeaderboardCategory.find({});
    console.log(`\nTotal categories in database: ${allCategories.length}`);
    allCategories.forEach(cat => {
      console.log(`- ${cat.emoji} ${cat.name} (${cat._id}) - ${cat.isActive ? 'Active' : 'Inactive'}`);
    });

  } catch (error) {
    console.error('Error seeding categories:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the seed function
seedCategories();