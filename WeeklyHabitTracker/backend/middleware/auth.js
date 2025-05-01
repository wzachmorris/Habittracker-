const jwt = require('jsonwebtoken');

// JWT Secret (same as in auth controller - should be in env vars)
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';

// Authentication middleware
const auth = (req, res, next) => {
  console.log('Auth Middleware: Checking authentication');
  
  // Get token from header
  const token = req.header('x-auth-token');
  
  console.log('Auth Middleware: Token present:', !!token);
  
  // Check if no token
  if (!token) {
    console.log('Auth Middleware: No token provided');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  
  try {
    // Verify token
    console.log('Auth Middleware: Verifying token');
    console.log('Auth Middleware: Using JWT_SECRET:', JWT_SECRET.substring(0, 3) + '...');
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    console.log(`Auth Middleware: Token valid for user: ${decoded.userId}`);
    
    // Add user from payload to request
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Auth Middleware: Token verification failed:', err.message);
    // Return a more detailed error message for debugging
    res.status(401).json({ 
      message: 'Token is invalid',
      error: err.message,
      action: 'Please logout and login again to get a new token.'
    });
  }
};

module.exports = auth;