const express = require('express');
const router = express.Router();
const {
  trainTypes,
  coachClasses,
  trainRoutes,
  calculateFare,
  searchTrains,
  getTrainByNumber,
  getTrainSchedule
} = require('../data/trains');

/**
 * @route   GET /api/trains/search
 * @desc    Search for trains between two stations
 * @access  Public
 */
router.get('/search', (req, res) => {
  try {
    const { from, to, date, class: travelClass = '3A' } = req.query;

    // Validate required parameters
    if (!from || !to || !date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: from, to, date'
      });
    }

    // Validate date
    const travelDate = new Date(date);
    if (isNaN(travelDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    // Validate class
    const validClasses = coachClasses.map(c => c.code);
    if (!validClasses.includes(travelClass)) {
      return res.status(400).json({
        success: false,
        error: `Invalid class. Valid options: ${validClasses.join(', ')}`
      });
    }

    // Search trains
    const results = searchTrains({
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      date,
      travelClass
    });

    res.json({
      success: true,
      ...results
    });
  } catch (error) {
    console.error('Error searching trains:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while searching trains'
    });
  }
});

/**
 * @route   POST /api/trains/search
 * @desc    Search for trains (POST for complex queries)
 * @access  Public
 */
router.post('/search', (req, res) => {
  try {
    const { from, to, date, travelClass = '3A', filters = {} } = req.body;

    if (!from || !to || !date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: from, to, date'
      });
    }

    const results = searchTrains({
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      date,
      travelClass
    });

    // Apply additional filters if provided
    let filteredTrains = results.trains;

    if (filters.trainTypes && filters.trainTypes.length > 0) {
      filteredTrains = filteredTrains.filter(t => 
        filters.trainTypes.includes(t.trainType)
      );
    }

    if (filters.maxDuration) {
      filteredTrains = filteredTrains.filter(t => 
        t.duration.hours <= filters.maxDuration
      );
    }

    if (filters.departureTimeRange) {
      const [startHour, endHour] = filters.departureTimeRange;
      filteredTrains = filteredTrains.filter(t => {
        const depHour = parseInt(t.departure.split(':')[0]);
        return depHour >= startHour && depHour <= endHour;
      });
    }

    res.json({
      success: true,
      trains: filteredTrains,
      totalFound: filteredTrains.length,
      searchParams: results.searchParams
    });
  } catch (error) {
    console.error('Error searching trains:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while searching trains'
    });
  }
});

/**
 * @route   GET /api/trains/types
 * @desc    Get all train types
 * @access  Public
 */
router.get('/types', (req, res) => {
  try {
    res.json({
      success: true,
      count: trainTypes.length,
      data: trainTypes
    });
  } catch (error) {
    console.error('Error fetching train types:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching train types'
    });
  }
});

/**
 * @route   GET /api/trains/classes
 * @desc    Get all coach classes
 * @access  Public
 */
router.get('/classes', (req, res) => {
  try {
    res.json({
      success: true,
      count: coachClasses.length,
      data: coachClasses
    });
  } catch (error) {
    console.error('Error fetching coach classes:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching coach classes'
    });
  }
});

/**
 * @route   GET /api/trains/popular
 * @desc    Get popular train routes
 * @access  Public
 */
router.get('/popular', (req, res) => {
  try {
    const popularTrains = trainRoutes
      .filter(t => ['RAJ', 'SHA', 'VAN'].includes(t.type))
      .slice(0, 10)
      .map(train => ({
        trainNumber: train.trainNumber,
        name: train.name,
        type: train.type,
        from: train.from,
        to: train.to,
        duration: train.duration,
        classes: train.classes,
        baseFare: train.baseFare
      }));

    res.json({
      success: true,
      count: popularTrains.length,
      data: popularTrains
    });
  } catch (error) {
    console.error('Error fetching popular trains:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching popular trains'
    });
  }
});

/**
 * @route   GET /api/trains/:trainNumber
 * @desc    Get train details by train number
 * @access  Public
 */
router.get('/:trainNumber', (req, res) => {
  try {
    const train = getTrainByNumber(req.params.trainNumber);

    if (!train) {
      return res.status(404).json({
        success: false,
        error: 'Train not found'
      });
    }

    const trainType = trainTypes.find(t => t.code === train.type);

    res.json({
      success: true,
      data: {
        ...train,
        typeInfo: trainType,
        fares: train.classes.map(cls => ({
          class: cls,
          classInfo: coachClasses.find(c => c.code === cls),
          fare: calculateFare(train.baseFare, cls, ['RAJ', 'SHA', 'VAN'].includes(train.type))
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching train:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching train'
    });
  }
});

/**
 * @route   GET /api/trains/:trainNumber/schedule
 * @desc    Get train schedule/route
 * @access  Public
 */
router.get('/:trainNumber/schedule', (req, res) => {
  try {
    const schedule = getTrainSchedule(req.params.trainNumber);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Train not found'
      });
    }

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('Error fetching train schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching train schedule'
    });
  }
});

/**
 * @route   GET /api/trains/:trainNumber/availability
 * @desc    Check seat availability for a train on specific dates
 * @access  Public
 */
router.get('/:trainNumber/availability', (req, res) => {
  try {
    const { startDate, endDate, class: travelClass = '3A' } = req.query;
    const train = getTrainByNumber(req.params.trainNumber);

    if (!train) {
      return res.status(404).json({
        success: false,
        error: 'Train not found'
      });
    }

    if (!startDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate is required'
      });
    }

    // Generate availability for next 7 days or specified range
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const availability = [];
    let current = new Date(start);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][current.getDay()];
      
      if (train.days.includes(dayName)) {
        const statuses = ['AVAILABLE', 'RAC', 'WL', 'GNWL'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        availability.push({
          date: dateStr,
          day: dayName,
          class: travelClass,
          status: randomStatus,
          count: randomStatus === 'AVAILABLE' ? 
            Math.floor(Math.random() * 50) + 1 : 
            Math.floor(Math.random() * 30) + 1,
          fare: calculateFare(train.baseFare, travelClass, ['RAJ', 'SHA', 'VAN'].includes(train.type))
        });
      }

      current.setDate(current.getDate() + 1);
    }

    res.json({
      success: true,
      trainNumber: train.trainNumber,
      trainName: train.name,
      from: train.from,
      to: train.to,
      class: travelClass,
      data: availability
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching availability'
    });
  }
});

/**
 * @route   POST /api/trains/fare
 * @desc    Calculate fare for a journey
 * @access  Public
 */
router.post('/fare', (req, res) => {
  try {
    const { trainNumber, travelClass, isTatkal = false, passengers = 1 } = req.body;

    const train = getTrainByNumber(trainNumber);

    if (!train) {
      return res.status(404).json({
        success: false,
        error: 'Train not found'
      });
    }

    if (!train.classes.includes(travelClass)) {
      return res.status(400).json({
        success: false,
        error: `Class ${travelClass} not available on this train. Available: ${train.classes.join(', ')}`
      });
    }

    const isPremium = ['RAJ', 'SHA', 'VAN'].includes(train.type);
    const fare = calculateFare(train.baseFare, travelClass, isPremium, isTatkal);

    res.json({
      success: true,
      data: {
        trainNumber: train.trainNumber,
        trainName: train.name,
        class: travelClass,
        classInfo: coachClasses.find(c => c.code === travelClass),
        isTatkal,
        passengers,
        farePerPerson: fare,
        totalFare: {
          baseFare: fare.baseFare * passengers,
          reservationCharge: fare.reservationCharge * passengers,
          superfastCharge: fare.superfastCharge,
          gst: fare.gst * passengers,
          total: fare.total * passengers
        }
      }
    });
  } catch (error) {
    console.error('Error calculating fare:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while calculating fare'
    });
  }
});

module.exports = router;
