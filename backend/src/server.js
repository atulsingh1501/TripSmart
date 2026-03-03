const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import database connection
const connectDB = require('./config/db');

// Import routes
const cityRoutes = require('./routes/cities');
const flightRoutes = require('./routes/flights');
const trainRoutes = require('./routes/trains');
const hotelRoutes = require('./routes/hotels');
const tripRoutes = require('./routes/trips');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

// Connect to MongoDB
connectDB();

// Initialize express app
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/cities', cityRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/trains', trainRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'TripSmart API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 TripSmart API Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
