// controllers/passwordReset.js
const User = require('../models/User');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Request a password reset
exports.requestReset = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    console.log(`Password reset requested for email: ${email}`);
    
    // Find the user
    const user = await User.findOne({ email });
    
    if (!user) {
      // For security, don't reveal that the user doesn't exist
      return res.status(200).json({ 
        message: 'If a user with that email exists, a password reset link has been sent.' 
      });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Set token expiration (1 hour from now)
    const resetExpires = Date.now() + 3600000; // 1 hour in milliseconds
    
    // Save token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();
    
    // In a real implementation, send an email with the reset link
    // For now, just return the token in the response (for testing)
    
    console.log(`Reset token generated for ${email}: ${resetToken}`);
    
    res.status(200).json({
      message: 'If a user with that email exists, a password reset link has been sent.',
      // Remove this in production, only for testing:
      token: resetToken
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Server error during password reset request' });
  }
};

// Verify a reset token
exports.verifyToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }
    
    console.log(`Verifying reset token: ${token}`);
    
    // Find user with this token and check if token is still valid
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
    console.log(`Token valid for user: ${user.email}`);
    
    // Token is valid
    res.status(200).json({ message: 'Token is valid', userId: user.userId });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ message: 'Server error during token verification' });
  }
};

// Reset password with token
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    console.log(`Resetting password with token: ${token}`);
    
    // Find user with this token and check if token is still valid
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    // Save the updated user
    await user.save();
    
    console.log(`Password reset successful for user: ${user.email}`);
    
    // Generate a new JWT token for automatic login
    const jwtToken = jwt.sign(
      { userId: user.userId, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(200).json({ 
      message: 'Password reset successful',
      token: jwtToken
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
};