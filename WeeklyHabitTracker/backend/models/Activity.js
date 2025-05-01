// /backend/models/Activity.js
const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  period: {
    type: String,
    enum: ['morning', 'afternoon', 'evening'],
    required: true
  },
  // New field to track display order within a period
  order: {
    type: Number,
    default: 0
  },
  repeatDays: {
    type: [Number],
    default: []
  },
  isHabit: {
    type: Boolean,
    default: false
  },
  userId: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Notes functionality fields
  daySpecificNotes: {
    type: Boolean,
    default: false
  },
  notes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // New fields for recurring notes
  recurringNotes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Field for next session notes
  nextSessionNotes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // New field to track completions by date
  completions: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

module.exports = mongoose.model('Activity', ActivitySchema);