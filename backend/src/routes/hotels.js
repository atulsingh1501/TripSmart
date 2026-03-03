const express = require('express');
const router = express.Router();
const {
  hotelChains,
  roomTypes,
  generateHotels,
  searchHotels,
  getHotelById
} = require('../data/hotels');

/**
 * @route   GET /api/hotels/search
 * @desc    Search for hotels
 * @access  Public
 */
router.get('/search', (req, res) => {
  try {
    const {
      city,
      checkIn,
      checkOut,
      rooms = 1,
      guests = 2,
      minStars,
      maxPrice,
      hotelType,
      amenities,
      sortBy = 'recommended'
    } = req.query;

    // Validate required parameters
    if (!city || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: city, checkIn, checkOut'
      });
    }

    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({
        success: false,
        error: 'Check-out date must be after check-in date'
      });
    }

    // Build filters
    const filters = {};
    if (minStars) filters.minStars = parseInt(minStars);
    if (maxPrice) filters.maxPrice = parseInt(maxPrice);
    if (hotelType) filters.hotelType = hotelType;
    if (amenities) filters.amenities = amenities.split(',');

    // Search hotels
    const results = searchHotels({
      city: city.toUpperCase(),
      checkIn,
      checkOut,
      rooms: parseInt(rooms),
      guests: parseInt(guests),
      filters,
      sortBy
    });

    res.json({
      success: true,
      ...results
    });
  } catch (error) {
    console.error('Error searching hotels:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while searching hotels'
    });
  }
});

/**
 * @route   POST /api/hotels/search
 * @desc    Search for hotels (POST for complex queries)
 * @access  Public
 */
router.post('/search', (req, res) => {
  try {
    const {
      city,
      checkIn,
      checkOut,
      rooms = 1,
      guests = 2,
      filters = {},
      sortBy = 'recommended'
    } = req.body;

    if (!city || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: city, checkIn, checkOut'
      });
    }

    const results = searchHotels({
      city: city.toUpperCase(),
      checkIn,
      checkOut,
      rooms: parseInt(rooms),
      guests: parseInt(guests),
      filters,
      sortBy
    });

    res.json({
      success: true,
      ...results
    });
  } catch (error) {
    console.error('Error searching hotels:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while searching hotels'
    });
  }
});

/**
 * @route   GET /api/hotels/chains
 * @desc    Get all hotel chains
 * @access  Public
 */
router.get('/chains', (req, res) => {
  try {
    const { type, minStars } = req.query;

    let chains = [...hotelChains];

    if (type) {
      chains = chains.filter(c => c.type === type);
    }

    if (minStars) {
      chains = chains.filter(c => c.stars >= parseInt(minStars));
    }

    res.json({
      success: true,
      count: chains.length,
      data: chains
    });
  } catch (error) {
    console.error('Error fetching hotel chains:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching hotel chains'
    });
  }
});

/**
 * @route   GET /api/hotels/room-types
 * @desc    Get all room types
 * @access  Public
 */
router.get('/room-types', (req, res) => {
  try {
    res.json({
      success: true,
      count: roomTypes.length,
      data: roomTypes
    });
  } catch (error) {
    console.error('Error fetching room types:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching room types'
    });
  }
});

/**
 * @route   GET /api/hotels/popular
 * @desc    Get popular hotels across cities
 * @access  Public
 */
router.get('/popular', (req, res) => {
  try {
    // Get a sample of luxury hotels from major cities
    const popularCities = ['DEL', 'BOM', 'GOI', 'JAI', 'UDR'];
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextWeekEnd = new Date(today.getTime() + 9 * 24 * 60 * 60 * 1000);
    
    const checkIn = nextWeek.toISOString().split('T')[0];
    const checkOut = nextWeekEnd.toISOString().split('T')[0];

    const popularHotels = [];

    popularCities.forEach(city => {
      const hotels = generateHotels(city, checkIn, checkOut);
      // Get top 2 luxury hotels from each city
      const luxuryHotels = hotels
        .filter(h => h.stars >= 4)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 2);
      popularHotels.push(...luxuryHotels);
    });

    res.json({
      success: true,
      count: popularHotels.length,
      data: popularHotels.map(hotel => ({
        id: hotel.id,
        name: hotel.name,
        chain: hotel.chain,
        city: hotel.city,
        location: hotel.location,
        stars: hotel.stars,
        rating: hotel.rating,
        startingPrice: Math.min(...hotel.rooms.map(r => r.pricePerNight)),
        type: hotel.type,
        heritage: hotel.heritage
      }))
    });
  } catch (error) {
    console.error('Error fetching popular hotels:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching popular hotels'
    });
  }
});

/**
 * @route   GET /api/hotels/deals
 * @desc    Get current hotel deals
 * @access  Public
 */
router.get('/deals', (req, res) => {
  try {
    // Simulate some hotel deals
    const deals = [
      {
        id: 'deal-1',
        title: 'Goa Beach Getaway',
        description: 'Up to 40% off on beach resorts in Goa',
        discount: 40,
        validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cities: ['GOI'],
        hotelTypes: ['resort', 'luxury']
      },
      {
        id: 'deal-2',
        title: 'Heritage Stay Offer',
        description: 'Stay at historic properties with 25% discount',
        discount: 25,
        validTill: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        cities: ['JAI', 'UDR', 'VNS'],
        hotelTypes: ['heritage']
      },
      {
        id: 'deal-3',
        title: 'Budget Traveler Special',
        description: 'Flat ₹500 off on all budget hotels',
        discount: null,
        flatOff: 500,
        validTill: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        cities: ['all'],
        hotelTypes: ['budget']
      }
    ];

    res.json({
      success: true,
      count: deals.length,
      data: deals
    });
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching deals'
    });
  }
});

/**
 * @route   GET /api/hotels/:hotelId
 * @desc    Get hotel details by ID
 * @access  Public
 */
router.get('/:hotelId', (req, res) => {
  try {
    // In production, this would fetch from database
    // For now, return informative response
    res.json({
      success: false,
      error: 'Hotel lookup by ID requires search context. Use /search endpoint to get hotel details.'
    });
  } catch (error) {
    console.error('Error fetching hotel:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching hotel'
    });
  }
});

/**
 * @route   GET /api/hotels/:hotelId/reviews
 * @desc    Get hotel reviews
 * @access  Public
 */
router.get('/:hotelId/reviews', (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Generate mock reviews
    const reviews = Array.from({ length: parseInt(limit) }, (_, i) => ({
      id: `review-${i + 1}`,
      rating: (Math.random() * 2 + 3).toFixed(1),
      title: ['Great stay!', 'Wonderful experience', 'Good value for money', 'Amazing service', 'Beautiful property'][Math.floor(Math.random() * 5)],
      content: 'This was a wonderful stay. The staff was very helpful and the rooms were clean and comfortable.',
      author: `Guest${Math.floor(Math.random() * 1000)}`,
      date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      helpful: Math.floor(Math.random() * 50),
      verified: Math.random() > 0.3
    }));

    res.json({
      success: true,
      hotelId: req.params.hotelId,
      page: parseInt(page),
      limit: parseInt(limit),
      totalReviews: 247,
      averageRating: 4.3,
      data: reviews
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching reviews'
    });
  }
});

/**
 * @route   POST /api/hotels/:hotelId/check-availability
 * @desc    Check room availability for specific dates
 * @access  Public
 */
router.post('/:hotelId/check-availability', (req, res) => {
  try {
    const { checkIn, checkOut, roomType, rooms = 1 } = req.body;

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: checkIn, checkOut'
      });
    }

    // Simulate availability check
    const available = Math.random() > 0.2;
    const availableRooms = available ? Math.floor(Math.random() * 5) + 1 : 0;

    res.json({
      success: true,
      hotelId: req.params.hotelId,
      checkIn,
      checkOut,
      roomType: roomType || 'standard',
      requested: parseInt(rooms),
      available: availableRooms >= parseInt(rooms),
      availableRooms,
      pricePerNight: Math.floor(Math.random() * 5000) + 2000,
      message: availableRooms >= parseInt(rooms) ? 
        'Rooms available' : 
        `Only ${availableRooms} room(s) available`
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while checking availability'
    });
  }
});

module.exports = router;
