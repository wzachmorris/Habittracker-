# Leaderboard Feature Setup Guide

This guide explains how to set up and use the new leaderboard feature for the Weekly Habit Tracker app.

## Setup Instructions

### 1. Restart your backend server

The most important step is to restart your backend server so it can load the new files:

```bash
# First stop your current server with Ctrl+C
# Then restart it
cd /Users/zacmorris/Documents/GitHub/Habits/WeeklyHabitTracker/backend
npm start
```

This will:
1. Register the new leaderboard API routes
2. Load the new models and controllers
3. Automatically seed the database with initial categories when you first try to access them

### 2. Using the Leaderboard Feature

The leaderboard feature allows you to:

1. **Browse Categories**: View all available habit categories that people are tracking
2. **Sync Your Habits**: Connect your own habits to global leaderboards
3. **Compete**: See your streak compared to other users tracking the same habits
4. **Suggest New Categories**: Recommend new categories for tracking

## Implementation Details

The implementation includes:

1. **New Database Models**:
   - `LeaderboardCategory` - For storing habit categories
   - `LeaderboardEntry` - For tracking user entries in leaderboards

2. **Auto-Seeding**:
   - The system automatically populates categories on first use
   - No separate script needed - just restart the server

3. **Sync With Real Habits**:
   - Your actual habit streak data is used in the leaderboards
   - Streaks update automatically when you complete habits

4. **Category Suggestions**:
   - Users can suggest new categories
   - Suggestions start as inactive and need approval

## Troubleshooting

- **404 Errors**: Make sure you've restarted the backend server
- **MongoDB Connection Issues**: Ensure MongoDB is running or the app will use in-memory storage
- **Missing Categories**: The auto-seeding should take care of this on first access

## Next Steps

In future updates, you could add:
- Admin interface for managing categories
- User profiles and social features
- Achievements and rewards

Enjoy competing and staying motivated with your new leaderboard feature!