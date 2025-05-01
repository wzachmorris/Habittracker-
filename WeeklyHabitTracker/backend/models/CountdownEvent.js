const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CountdownEventSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  userId: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: 'blue'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrenceType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    default: null
  },
  recurrenceInterval: {
    type: Number,
    default: 1
  },
  daysOfWeek: {
    type: [Number],
    default: null
  },
  dayOfMonth: {
    type: Number,
    default: null
  },
  monthOfYear: {
    type: Number,
    default: null
  },
  recurrenceEndDate: {
    type: Date,
    default: null
  },
  // Add the new fields here
  hasDuration: {
    type: Boolean,
    default: false
  },
  endDate: {
    type: Date,
    default: null
  },
  isAllDay: {
    type: Boolean,
    default: false
  },
  period: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', null],
    default: null
  },
  order: {
    type: Number,
    default: 0 // Will be calculated based on time
  }
}, {
  timestamps: true
});

// No pre-save hook - we'll use the period and order values provided by the client

module.exports = mongoose.model('CountdownEvent', CountdownEventSchema);