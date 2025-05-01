const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Secret (same as in auth controller - should be in env vars)
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
  console.log('Admin Auth Middleware: Checking authentication');
  
  // Get token from header
  const token = req.header('x-auth-token');
  
  // Check if no token
  if (!token) {
    console.log('Admin Auth Middleware: No token provided');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  
  try {
    // Verify token
    console.log('Admin Auth Middleware: Verifying token');
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    console.log(`Admin Auth Middleware: Token valid for user: ${decoded.userId}`);
    
    // Check if the user is an admin
    const user = await User.findOne({ email: decoded.email });
    
    if (!user) {
      console.log('Admin Auth Middleware: User not found');
      return res.status(401).json({ message: 'User not found' });
    }
    
    // List of admin emails
    const adminEmails = ['william.zachmorris@gmail.com', 'zacfala@gmail.com'];
    
    // Check if the user's email is in the admin list
    if (!adminEmails.includes(user.email)) {
      console.log('Admin Auth Middleware: User is not an admin');
      return res.status(403).json({ message: 'Access denied - admin rights required' });
    }
    
    // Set the user's admin status to true if it's not already set
    if (!user.isAdmin) {
      user.isAdmin = true;
      await user.save();
      console.log(`Admin Auth Middleware: Updated user ${user.email} to admin status`);
    }
    
    // Add user from payload to request
    req.user = decoded;
    req.user.isAdmin = true;
    next();
  } catch (err) {
    console.error('Admin Auth Middleware: Token verification failed:', err.message);
    res.status(401).json({ 
      message: 'Token is invalid',
      error: err.message,
      action: 'Please logout and login again to get a new token.'
    });
  }
};

module.exports = adminAuth;