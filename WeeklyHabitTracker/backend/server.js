// Main entry point for the server
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose'); // Make sure to add this import

// Load environment variables from the appropriate .env file
require('dotenv').config({
  path: path.resolve(__dirname, `.env.${process.env.NODE_ENV || 'development'}`)
});

// Log which environment we're using
console.log(`Running in ${process.env.NODE_ENV || 'development'} environment`);
console.log('Env file path:', path.resolve(__dirname, `.env.${process.env.NODE_ENV || 'development'}`));
console.log('File exists:', require('fs').existsSync(path.resolve(__dirname, `.env.${process.env.NODE_ENV || 'development'}`)));
console.log('MONGODB_URI after loading:', process.env.MONGODB_URI ? 'defined' : 'undefined');

// Import database connection
const connectDB = require('./config/db');

// Create the Express app
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection - with fallback to in-memory storage
let usingInMemoryStorage = false;

// Connect to MongoDB with detailed logging
console.log('Attempting to connect to MongoDB...');
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'URI is defined' : 'URI is not defined');

// Import module to get public IP
const { publicIp, publicIpv6 } = require('public-ip');

// Get public IP for MongoDB Atlas whitelist
(async () => {
  try {
    const ip = await publicIp();
    console.log('Your public IP address is:', ip);
    console.log('Make sure this IP is whitelisted in MongoDB Atlas under Network Access');
  } catch (err) {
    console.log('Could not determine public IP:', err.message);
  }
})();

if (process.env.MONGODB_URI) {
  // Log a sanitized version of the URI (hiding password)
  const sanitizedUri = process.env.MONGODB_URI.replace(/:([^:@]+)@/, ':****@');
  console.log('Using connection string (sanitized):', sanitizedUri);
  
  // Check if database name is in the connection string
  if (!sanitizedUri.includes('/habits?')) {
    console.log('WARNING: Database name "habits" not found in connection string. The default "test" database might be used.');
  } else {
    console.log('Database name "habits" found in connection string.');
  }
  
  console.log('\nMONGODB CONNECTION TROUBLESHOOTING:');
  console.log('1. Check if your IP is whitelisted in MongoDB Atlas');
  console.log('2. Verify username and password are correct');
  console.log('3. Ensure the cluster is running');
  console.log('4. Try using the "Allow Access from Anywhere" setting in Atlas for testing');
}

connectDB()
  .then((conn) => {
    console.log('Connected to MongoDB successfully');
    console.log('MongoDB host:', conn.connection.host);
    console.log('MongoDB database name:', conn.connection.name);
    console.log(`MongoDB connection state: ${conn.connection.readyState} (1 = connected)`);
    
    // Load all models
    require('./models/CountdownEvent');
    require('./models/Activity');
    require('./models/User');
    // Add any other models here

    // Log registered models
    console.log('\n--- MONGOOSE MODELS DIAGNOSTIC ---');
    console.log('Registered models:', Object.keys(mongoose.models));
    
    // Check the CountdownEvent model schema
    if (mongoose.models.CountdownEvent) {
      const countdownEventSchemaInfo = {};
      const schemaObj = mongoose.models.CountdownEvent.schema.obj;
      
      // Log each field and its type
      console.log('\nCountdownEvent Schema Fields:');
      Object.keys(schemaObj).forEach(field => {
        const fieldType = schemaObj[field].type ? 
          (schemaObj[field].type.name || schemaObj[field].type) : 
          typeof schemaObj[field];
          
        countdownEventSchemaInfo[field] = fieldType;
        console.log(`- ${field}: ${fieldType}`);
      });
      
      // Specifically check for recurrence fields
      console.log('\nRecurrence Fields Check:');
      const requiredFields = ['isRecurring', 'recurrenceType', 'recurrenceInterval', 'daysOfWeek'];
      requiredFields.forEach(field => {
        console.log(`- ${field}: ${field in schemaObj ? 'Present' : 'MISSING'}`);
      });
    } else {
      console.log('WARNING: CountdownEvent model is not registered!');
    }
    
    // Test find with CountdownEvent
    setTimeout(async () => {
      try {
        const CountdownEvent = mongoose.model('CountdownEvent');
        const example = await CountdownEvent.findOne();
        console.log('\nSample CountdownEvent from DB:', example ? 'Found' : 'None found');
        if (example) {
          console.log('Fields in sample document:', Object.keys(example._doc));
          console.log('Has isRecurring field:', 'isRecurring' in example._doc);
        }
      } catch (err) {
        console.error('Error testing CountdownEvent model:', err.message);
      }
    }, 1000);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.log('Using in-memory storage instead');
    usingInMemoryStorage = true;
  });

// Import routes
const apiRoutes = require('./routes/api');

// API routes
app.use('/api', apiRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  console.log('Running in production mode - serving static frontend assets');
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`API available at http://localhost:${PORT}/api`);
  
  if (process.env.NODE_ENV === 'production') {
    console.log(`Frontend served from ${path.join(__dirname, '../frontend/build')}`);
  } else {
    console.log('Frontend should be started separately in development mode');
  }
});