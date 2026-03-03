const express = require('express');
const router = express.Router();
const { 
  cities, 
  searchCities, 
  getCityByCode, 
  getCitiesByType, 
  getCitiesByState,
  getCitiesWithAirports,
  getCitiesWithRailways 
} = require('../data/cities');

/**
 * @route   GET /api/cities
 * @desc    Get all cities with optional filters
 * @access  Public
 */
router.get('/', (req, res) => {
  try {
    const { type, state, hasAirport, hasRailway, search, limit = 50 } = req.query;

    let result = [...cities];

    // Apply filters
    if (type) {
      result = result.filter(city => city.type === type);
    }

    if (state) {
      result = result.filter(city => city.state.toLowerCase() === state.toLowerCase());
    }

    if (hasAirport === 'true') {
      result = result.filter(city => city.transport.hasAirport);
    }

    if (hasRailway === 'true') {
      result = result.filter(city => city.transport.hasRailway);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(city => 
        city.name.toLowerCase().includes(searchLower) ||
        city.fullName.toLowerCase().includes(searchLower) ||
        city.state.toLowerCase().includes(searchLower)
      );
    }

    // Apply limit
    result = result.slice(0, parseInt(limit));

    res.json({
      success: true,
      count: result.length,
      data: result
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching cities'
    });
  }
});

/**
 * @route   GET /api/cities/search
 * @desc    Search cities by query
 * @access  Public
 */
router.get('/search', (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
    }

    const results = searchCities(q);

    res.json({
      success: true,
      count: results.length,
      data: results.slice(0, 10) // Limit to 10 results for autocomplete
    });
  } catch (error) {
    console.error('Error searching cities:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while searching cities'
    });
  }
});

/**
 * @route   GET /api/cities/popular
 * @desc    Get popular tourist destinations
 * @access  Public
 */
router.get('/popular', (req, res) => {
  try {
    const popularCities = cities
      .filter(city => city.type === 'tourist' || city.type === 'metro')
      .slice(0, 12);

    res.json({
      success: true,
      count: popularCities.length,
      data: popularCities
    });
  } catch (error) {
    console.error('Error fetching popular cities:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching popular cities'
    });
  }
});

/**
 * @route   GET /api/cities/airports
 * @desc    Get all cities with airports
 * @access  Public
 */
router.get('/airports', (req, res) => {
  try {
    const airportCities = getCitiesWithAirports().map(city => ({
      code: city.code,
      name: city.name,
      fullName: city.fullName,
      state: city.state,
      airportCode: city.transport.airportCode,
      airportName: city.transport.airportName
    }));

    res.json({
      success: true,
      count: airportCities.length,
      data: airportCities
    });
  } catch (error) {
    console.error('Error fetching airport cities:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching airport cities'
    });
  }
});

/**
 * @route   GET /api/cities/railways
 * @desc    Get all cities with railway stations
 * @access  Public
 */
router.get('/railways', (req, res) => {
  try {
    const railwayCities = getCitiesWithRailways().map(city => ({
      code: city.code,
      name: city.name,
      fullName: city.fullName,
      state: city.state,
      stations: city.transport.railwayStations
    }));

    res.json({
      success: true,
      count: railwayCities.length,
      data: railwayCities
    });
  } catch (error) {
    console.error('Error fetching railway cities:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching railway cities'
    });
  }
});

/**
 * @route   GET /api/cities/:code
 * @desc    Get city by code
 * @access  Public
 */
router.get('/:code', (req, res) => {
  try {
    const city = getCityByCode(req.params.code.toUpperCase());

    if (!city) {
      return res.status(404).json({
        success: false,
        error: 'City not found'
      });
    }

    res.json({
      success: true,
      data: city
    });
  } catch (error) {
    console.error('Error fetching city:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching city'
    });
  }
});

/**
 * @route   GET /api/cities/:code/attractions
 * @desc    Get attractions for a city
 * @access  Public
 */
router.get('/:code/attractions', (req, res) => {
  try {
    const city = getCityByCode(req.params.code.toUpperCase());

    if (!city) {
      return res.status(404).json({
        success: false,
        error: 'City not found'
      });
    }

    res.json({
      success: true,
      city: city.name,
      count: city.attractions?.length || 0,
      data: city.attractions || []
    });
  } catch (error) {
    console.error('Error fetching attractions:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching attractions'
    });
  }
});

module.exports = router;
