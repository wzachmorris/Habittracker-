// /backend/models/LeaderboardEntry.js
const mongoose = require('mongoose');

const LeaderboardEntrySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LeaderboardCategory',
    required: true
  },
  activityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: '😀'
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  showOnLeaderboard: {
    type: Boolean,
    default: true
  }
});

// Compound index to ensure a user can only have one entry per category
LeaderboardEntrySchema.index({ userId: 1, categoryId: 1 }, { unique: true });

module.exports = mongoose.model('LeaderboardEntry', LeaderboardEntrySchema);