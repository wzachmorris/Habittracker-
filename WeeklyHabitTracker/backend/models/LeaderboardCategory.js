// /backend/models/LeaderboardCategory.js
const mongoose = require('mongoose');

const LeaderboardCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  emoji: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('LeaderboardCategory', LeaderboardCategorySchema);