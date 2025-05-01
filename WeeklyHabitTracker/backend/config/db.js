const mongoose = require('mongoose');


// Just add this log to confirm environment variables are available
console.log('DB Config: Environment is', process.env.NODE_ENV || 'development');
console.log('DB Config: MongoDB URI is', process.env.MONGODB_URI ? 'defined' : 'undefined');

// Function to check if MongoDB is connected
const isMongoConnected = () => mongoose.connection.readyState === 1;

const connectDB = async () => {
  try {
    // Only try to connect if not already connected
    if (!isMongoConnected()) {
      // Make sure we explicitly set the database name to "habits"
      let connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/habit-tracker';
      
      console.log('Attempting to connect to MongoDB with URI:', connectionString ? 'URI defined' : 'URI undefined');
      
      // Ensure the database name is set in the connection string
      if (connectionString.includes('@') && !connectionString.includes('/habits?')) {
        // Replace any existing configuration after the hostname and before the query parameters
        connectionString = connectionString.replace(/(@[^/?]+)(\?|$)/, '$1/habits$2');
        console.log('Modified connection string to include database name "habits"');
      }
      
      // Set explicit options including database name
      const connOptions = {
        serverSelectionTimeoutMS: 10000, // Increase timeout to 10 seconds
        dbName: 'habits', // Force the database name to be 'habits'
        directConnection: false,
        retryWrites: true,
        w: 'majority'
      };
      
      console.log('Connecting with explicit database name: "habits" and increased timeout');
      console.log('URI format check - includes mongodb+srv://', connectionString.includes('mongodb+srv://'));
      console.log('Connection options:', JSON.stringify(connOptions));
      
      const conn = await mongoose.connect(connectionString, connOptions);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      console.log(`MongoDB Database: ${conn.connection.name}`);
      console.log(`MongoDB State: ${conn.connection.readyState}`);
      return conn;
    } else {
      console.log('MongoDB already connected');
      return mongoose.connection;
    }
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.error('Full error object:', error);
    console.log('Verify your MongoDB Atlas network settings allow connections from your IP address');
    console.log('Using fallback in-memory storage instead');
    // Don't exit process, let the application use fallback storage
    throw error;
  }
};

module.exports = connectDB;
module.exports.isMongoConnected = isMongoConnected;