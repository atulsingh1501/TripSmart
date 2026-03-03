const express = require('express');
const router = express.Router();
const { 
  airlines, 
  routes, 
  generateFlights, 
  searchFlights, 
  getPopularRoutes 
} = require('../data/flights');

/**
 * @route   GET /api/flights/search
 * @desc    Search for flights
 * @access  Public
 */
router.get('/search', (req, res) => {
  try {
    const { 
      from, 
      to, 
      date, 
      returnDate, 
      travelers = 1, 
      cabinClass = 'economy',
      maxPrice,
      airlines: airlineFilter,
      maxStops,
      departureTime
    } = req.query;

    // Validate required parameters
    if (!from || !to || !date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: from, to, date'
      });
    }

    // Validate date format
    const travelDate = new Date(date);
    if (isNaN(travelDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (travelDate < today) {
      return res.status(400).json({
        success: false,
        error: 'Travel date cannot be in the past'
      });
    }

    // Build filters object
    const filters = {};
    if (maxPrice) filters.maxPrice = parseInt(maxPrice);
    if (airlineFilter) filters.airlines = airlineFilter.split(',');
    if (maxStops !== undefined) filters.maxStops = parseInt(maxStops);
    if (departureTime) filters.departureTime = departureTime;

    // Search flights
    const results = searchFlights({
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      date,
      returnDate,
      travelers: parseInt(travelers),
      cabinClass,
      filters
    });

    res.json({
      success: true,
      ...results
    });
  } catch (error) {
    console.error('Error searching flights:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while searching flights'
    });
  }
});

/**
 * @route   POST /api/flights/search
 * @desc    Search for flights (POST for complex queries)
 * @access  Public
 */
router.post('/search', (req, res) => {
  try {
    const { 
      from, 
      to, 
      date, 
      returnDate, 
      travelers = 1, 
      cabinClass = 'economy',
      filters = {}
    } = req.body;

    // Validate required parameters
    if (!from || !to || !date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: from, to, date'
      });
    }

    // Search flights
    const results = searchFlights({
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      date,
      returnDate,
      travelers: parseInt(travelers),
      cabinClass,
      filters
    });

    res.json({
      success: true,
      ...results
    });
  } catch (error) {
    console.error('Error searching flights:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while searching flights'
    });
  }
});

/**
 * @route   GET /api/flights/airlines
 * @desc    Get all airlines
 * @access  Public
 */
router.get('/airlines', (req, res) => {
  try {
    res.json({
      success: true,
      count: airlines.length,
      data: airlines
    });
  } catch (error) {
    console.error('Error fetching airlines:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching airlines'
    });
  }
});

/**
 * @route   GET /api/flights/routes
 * @desc    Get all available routes
 * @access  Public
 */
router.get('/routes', (req, res) => {
  try {
    const { from } = req.query;

    let filteredRoutes = routes;

    if (from) {
      filteredRoutes = routes.filter(r => r.from === from.toUpperCase());
    }

    res.json({
      success: true,
      count: filteredRoutes.length,
      data: filteredRoutes.map(route => ({
        from: route.from,
        to: route.to,
        distance: route.distance,
        avgDuration: route.duration,
        startingPrice: route.basePrice.economy
      }))
    });
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching routes'
    });
  }
});

/**
 * @route   GET /api/flights/popular
 * @desc    Get popular routes with current pricing
 * @access  Public
 */
router.get('/popular', (req, res) => {
  try {
    const popularRoutes = getPopularRoutes();

    res.json({
      success: true,
      count: popularRoutes.length,
      data: popularRoutes
    });
  } catch (error) {
    console.error('Error fetching popular routes:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching popular routes'
    });
  }
});

/**
 * @route   GET /api/flights/:flightId
 * @desc    Get flight details by ID
 * @access  Public
 */
router.get('/:flightId', (req, res) => {
  try {
    // In a real implementation, this would fetch from a database
    // For now, return a mock response indicating flight lookup
    res.json({
      success: false,
      error: 'Flight lookup by ID requires date context. Use /search endpoint.'
    });
  } catch (error) {
    console.error('Error fetching flight:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching flight'
    });
  }
});

/**
 * @route   POST /api/flights/price-alert
 * @desc    Set a price alert for a route
 * @access  Public (would be Private in production)
 */
router.post('/price-alert', (req, res) => {
  try {
    const { from, to, targetPrice, email } = req.body;

    if (!from || !to || !targetPrice || !email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: from, to, targetPrice, email'
      });
    }

    // In production, this would store the alert in a database
    // and set up a job to check prices periodically
    res.json({
      success: true,
      message: 'Price alert created successfully',
      data: {
        id: `alert-${Date.now()}`,
        from,
        to,
        targetPrice,
        email,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating price alert:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while creating price alert'
    });
  }
});

module.exports = router;
