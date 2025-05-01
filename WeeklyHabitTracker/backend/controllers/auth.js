const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { isMongoConnected } = require('../config/db');
const inMemoryStorage = require('../storage/inMemoryStorage');

// JWT Secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';
console.log('Auth Controller: Using JWT_SECRET:', JWT_SECRET.substring(0, 3) + '...');

// Register new user
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    console.log(`Attempting to register user with email: ${email}`);
    
    // Check if MongoDB is connected
    if (isMongoConnected()) {
      console.log('MongoDB connected, checking if user exists');
      
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }
      
      // Generate userId
      const userId = uuidv4();
      
      // Create new user
      const user = new User({
        userId,
        name,
        email,
        password,
        joinDate: new Date(),
      });
      
      // Save user to database
      await user.save();
      console.log(`User registered with userId: ${userId}`);
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.userId, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      // Return user data (without password) and token
      const userData = user.toObject();
      delete userData.password;
      
      res.status(201).json({
        message: 'User registered successfully',
        user: userData,
        token
      });
    } else {
      // Fallback to in-memory storage
      console.log('MongoDB not connected, using in-memory storage for registration');
      
      // Check if user exists in in-memory storage
      const existingUser = await inMemoryStorage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }
      
      // Generate userId
      const userId = uuidv4();
      
      // Create new user (with hashed password in in-memory storage)
      const user = await inMemoryStorage.createUser({
        userId,
        name,
        email,
        password, // This will be hashed in the in-memory storage
        joinDate: new Date(),
      });
      
      console.log(`User registered in-memory with userId: ${userId}`);
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.userId, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      // Return user data (without password) and token
      const userData = { ...user };
      delete userData.password;
      
      res.status(201).json({
        message: 'User registered successfully',
        user: userData,
        token
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      console.log('Login: Email and password are required');
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    console.log(`Login: Attempting to login user with email: ${email}`);
    
    // Check if MongoDB is connected
    if (isMongoConnected()) {
      console.log('Login: MongoDB connected, finding user');
      
      // Find user by email
      const user = await User.findOne({ email });
      
      // Check if user exists
      if (!user) {
        console.log(`Login: User with email ${email} not found`);
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      console.log('Login: User found, checking password');
      
      // Check password
      let isMatch;
      try {
        isMatch = await user.comparePassword(password);
      } catch (err) {
        console.error('Login: Error comparing password:', err);
        return res.status(500).json({ message: 'Server error during authentication' });
      }
      
      if (!isMatch) {
        console.log('Login: Password does not match');
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      console.log(`Login: User login successful for userId: ${user.userId}`);
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.userId, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      // Return user data (without password) and token
      const userData = user.toObject();
      delete userData.password;
      
      console.log('Login: Returning success response with token and user data');
      res.status(200).json({
        message: 'Login successful',
        user: userData,
        token
      });
    } else {
      // Fallback to in-memory storage
      console.log('MongoDB not connected, using in-memory storage for login');
      
      // Find user by email in in-memory storage
      const user = await inMemoryStorage.getUserByEmail(email);
      
      // Check if user exists
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Check password (assumes in-memory storage has password verification)
      const isMatch = await inMemoryStorage.verifyPassword(email, password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      console.log(`User login successful (in-memory) for userId: ${user.userId}`);
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.userId, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      // Return user data (without password) and token
      const userData = { ...user };
      delete userData.password;
      
      res.status(200).json({
        message: 'Login successful',
        user: userData,
        token
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    // Note: user will be attached to req by auth middleware
    if (!req.user || !req.user.userId) {
      console.log('GetMe: No user in request (auth middleware issue)');
      return res.status(401).json({ message: 'Authentication failed' });
    }
    
    const userId = req.user.userId;
    console.log(`GetMe: Getting current user profile for userId: ${userId}`);
    
    // Check if MongoDB is connected
    if (isMongoConnected()) {
      console.log('GetMe: MongoDB connected, finding user');
      
      // Find user by userId
      const user = await User.findOne({ userId });
      
      // Check if user exists
      if (!user) {
        console.log(`GetMe: User with userId ${userId} not found in database`);
        return res.status(404).json({ message: 'User not found' });
      }
      
      console.log(`GetMe: User found: ${user.name}`);
      
      // Return user data without password
      const userData = user.toObject();
      delete userData.password;
      
      console.log('GetMe: Returning user data');
      res.status(200).json(userData);
    } else {
      // Fallback to in-memory storage
      console.log('MongoDB not connected, using in-memory storage');
      
      // Find user by userId in in-memory storage
      const user = await inMemoryStorage.getUserProfile(userId);
      
      // Check if user exists
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Return user data without password
      const userData = { ...user };
      delete userData.password;
      
      res.status(200).json(userData);
    }
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};