//backend/routes/api.js
const User = require('../models/User');
const express = require('express');
const router = express.Router();
const activitiesController = require('../controllers/activities');
const usersController = require('../controllers/users');
const authController = require('../controllers/auth');
const countdownEventsController = require('../controllers/countdownEvents');
const passwordResetController = require('../controllers/passwordReset');
const leaderboardController = require('../controllers/leaderboard');
const adminController = require('../controllers/admin');
const authMiddleware = require('../middleware/auth');
const adminAuthMiddleware = require('../middleware/adminAuth');

// Health check endpoint - no auth required
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 'unknown'
  });
});

// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authMiddleware, authController.getMe);

// Activity routes - protected by auth middleware
router.get('/activities', authMiddleware, activitiesController.getActivities);
router.post('/activities', authMiddleware, activitiesController.createActivity);
router.put('/activities/:id', authMiddleware, activitiesController.updateActivity);
router.delete('/activities/:id', authMiddleware, activitiesController.deleteActivity);
router.post('/activities/:id/complete', authMiddleware, activitiesController.completeActivity);

// User profile routes - using controller methods with query parameters
router.get('/users/profile', authMiddleware, usersController.getUserProfile);
router.put('/users/profile', authMiddleware, usersController.updateUserProfile);

// Countdown event routes - protected by auth middleware
router.get('/countdown-events', authMiddleware, countdownEventsController.getCountdownEvents);
router.post('/countdown-events', authMiddleware, countdownEventsController.createCountdownEvent);
router.put('/countdown-events/:id', authMiddleware, countdownEventsController.updateCountdownEvent);
router.delete('/countdown-events/:id', authMiddleware, countdownEventsController.deleteCountdownEvent);
// New route for completing recurring countdown events
router.post('/countdown-events/:id/complete', authMiddleware, countdownEventsController.completeRecurringEvent);
router.get('/countdown-events/:id', authMiddleware, countdownEventsController.getCountdownEvent);



// Leaderboard routes - protected by auth middleware
router.get('/leaderboard/categories', authMiddleware, leaderboardController.getCategories);
router.get('/leaderboard/categories/:categoryId/entries', authMiddleware, leaderboardController.getCategoryEntries);
router.post('/leaderboard/entries', authMiddleware, leaderboardController.addEntry);
router.delete('/leaderboard/categories/:categoryId/entries', authMiddleware, leaderboardController.removeEntry);
router.post('/leaderboard/categories/suggest', authMiddleware, leaderboardController.suggestCategory);
router.get('/leaderboard/user/synced-habits', authMiddleware, leaderboardController.getUserSyncedHabits);
router.get('/leaderboard/user/available-habits', authMiddleware, leaderboardController.getUserHabitsForSync);
router.post('/leaderboard/update', authMiddleware, leaderboardController.updateLeaderboardEntries);

// Password reset routes - no auth required
router.post('/auth/password-reset/request', passwordResetController.requestReset);
router.get('/auth/password-reset/verify/:token', passwordResetController.verifyToken);
router.post('/auth/password-reset/reset', passwordResetController.resetPassword);

// Admin routes - protected by admin middleware
router.get('/admin/categories', adminAuthMiddleware, adminController.getAllCategories);
router.patch('/admin/categories/:categoryId/approve', adminAuthMiddleware, adminController.approveCategory);
router.delete('/admin/categories/:categoryId', adminAuthMiddleware, adminController.rejectCategory);
router.get('/admin/stats', adminAuthMiddleware, adminController.getDashboardStats);

module.exports = router;