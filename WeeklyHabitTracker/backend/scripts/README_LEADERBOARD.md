# Leaderboard Feature Implementation Guide

This guide explains how to set up the new leaderboard feature for the Weekly Habit Tracker app.

## Setup Instructions

### 1. Start the MongoDB Server

Make sure your MongoDB server is running. If you're using the default configuration, it should be available at `mongodb://localhost:27017/`.

### 2. Restart the Backend Server

After adding the new leaderboard files, you need to restart the backend server to pick up the changes:

```bash
# Navigate to the backend directory
cd /path/to/WeeklyHabitTracker/backend

# Stop the current server (Ctrl+C) and restart it
npm start
```

### 3. Seed the Database with Initial Categories

Run the script to create initial leaderboard categories:

```bash
# From the backend directory
node scripts/seedLeaderboardCategories.js
```

This will create several default categories in the database that users can use for their habits.

## Testing the Leaderboard Feature

1. **Browse Categories**: Go to the Leaderboard page to see all available categories
2. **Sync a Habit**: Click on any category, then click "Sync Your Habit" to connect one of your habits to that category
3. **View Leaderboards**: After syncing, you should see your entry in the leaderboard

## Troubleshooting

- If you see "This is a sample category" error, it means you're clicking on a default category that doesn't exist in the database yet. Run the seed script.
- If you get a 404 for leaderboard endpoints, make sure you've restarted the backend server.
- If you get a 500 error, check the backend server logs for more details.

## Additional Notes

- Streaks are calculated based on actual habit completion data
- The leaderboard automatically updates when habits are completed
- New category suggestions require admin approval before becoming active

## Admin Tasks

Future enhancements could include an admin interface for:
1. Approving new category suggestions
2. Managing existing categories
3. Moderating leaderboard entries

For now, these tasks require direct database access.