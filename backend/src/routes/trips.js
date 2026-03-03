const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getCityByCode } = require('../data/cities');
const { searchFlights } = require('../data/flights');
const { searchTrains } = require('../services/train.service'); // NOW USES MONGODB
const { searchTrains: searchTrainsJSON } = require('../data/trains'); // Fallback
const { searchHotels } = require('../data/hotels');
const { getLocalTransportOptions, getQuickFareEstimate } = require('../data/localTransport');
const BudgetService = require('../services/budget.service');
const ScoringService = require('../services/scoring.service');
const SmartSelectionService = require('../services/smart-selection.service');
const TripAlgorithmService = require('../services/trip-algorithm.service');
const {
  transformFlights,
  transformTrains,
  transformHotels,
  generateMealOptions,
  generateActivityOptions,
  combineTransportOptions
} = require('../utils/option-transformer');
const TRIP_CONFIG = require('../config/trip.config');
const { authMiddleware, optionalAuthMiddleware } = require('./auth');
const Trip = require('../models/Trip');
const User = require('../models/User');

// In-memory storage for trips (in production, use MongoDB)
const trips = new Map();

/**
 * Calculate actual arrival date/time at destination based on transport timing
 * This is CRITICAL for accurate hotel night calculation
 * 
 * @param {string} startDate - Departure date (YYYY-MM-DD)
 * @param {string} departureTime - Time of departure (HH:MM format)
 * @param {Object|string} duration - Duration as object {hours, minutes} or string "Xh Ym"
 * @param {number} requestedNights - Originally requested hotel nights
 * @returns {Object} - Arrival info including adjusted hotel nights
 */
function calculateArrivalInfo(startDate, departureTime, duration, requestedNights) {
  // Parse departure date and time
  const depDate = new Date(startDate);

  // Handle departureTime being an object like {time: "06:30", terminal: "T2"} or a string
  let depTimeStr = '09:00';
  if (typeof departureTime === 'string') {
    depTimeStr = departureTime;
  } else if (typeof departureTime === 'object' && departureTime !== null) {
    depTimeStr = departureTime.time || departureTime.departure || '09:00';
  }

  const [depHour, depMin] = depTimeStr.split(':').map(Number);
  depDate.setHours(depHour || 9, depMin || 0, 0, 0);

  // Parse duration into minutes
  let durationMinutes = 0;
  if (typeof duration === 'object' && duration !== null) {
    if (duration.hours !== undefined) {
      durationMinutes = (duration.hours * 60) + (duration.minutes || 0);
    }
  } else if (typeof duration === 'string') {
    // Parse strings like "12h 30m", "2h", "1h 45m"
    // Also handle just "34h" or "30m"
    const hoursMatch = duration.match(/(\d+)\s*h/i);
    const minsMatch = duration.match(/(\d+)\s*m/i);

    if (hoursMatch) durationMinutes += parseInt(hoursMatch[1]) * 60;
    if (minsMatch) durationMinutes += parseInt(minsMatch[1]);

    // Fallback: If no 'h' or 'm' but looks like number
    if (!hoursMatch && !minsMatch && !isNaN(parseInt(duration))) {
      const val = parseInt(duration);
      // specific heuristic: if > 30 likely minutes, else hours
      durationMinutes = val < 30 ? val * 60 : val;
    }
  } else if (typeof duration === 'number') {
    // Assume minutes if large, hours if small
    durationMinutes = duration < 48 ? duration * 60 : duration;
  }

  // Default to 2 hours if parsing failed
  if (durationMinutes === 0) {
    durationMinutes = 120;
  }

  // Calculate arrival time
  const arrivalDate = new Date(depDate.getTime() + durationMinutes * 60 * 1000);

  // Calculate nights spent in transit (how many calendar days are crossed)
  // This counts the number of "midnights" crossed during travel
  // Example 1: Depart Feb 7 22:30, Arrive Feb 8 01:15 → 1 night in transit
  // Example 2: Depart Feb 7 23:50, Arrive Feb 9 19:45 → 2 nights in transit
  const depDayStart = new Date(depDate);
  depDayStart.setHours(0, 0, 0, 0);

  const arrDayStart = new Date(arrivalDate);
  arrDayStart.setHours(0, 0, 0, 0);

  const nightsInTransit = Math.round((arrDayStart - depDayStart) / (24 * 60 * 60 * 1000));
  const isNextDay = nightsInTransit > 0;

  // Reduce hotel nights by the number of nights spent traveling
  const adjustedNights = Math.max(0, requestedNights - nightsInTransit);

  console.log(`🚆 Travel calculation: Depart ${startDate} ${depTimeStr}, Duration ${durationMinutes}min, ` +
    `Arrive ${arrivalDate.toISOString().split('T')[0]} → ${nightsInTransit} nights in transit, ` +
    `Hotel nights: ${requestedNights} → ${adjustedNights}`);

  // Format times for display
  const formatTime = (date) =>
    `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

  const arrivalInfo = {
    departureDate: startDate,
    departureTime: formatTime(depDate),
    arrivalDate: arrivalDate.toISOString().split('T')[0],
    arrivalTime: formatTime(arrivalDate),
    isNextDayArrival: isNextDay,
    nightsInTransit,
    durationMinutes,
    requestedNights,
    adjustedNights,
    hotelCheckInDate: arrivalDate.toISOString().split('T')[0]
  };

  console.log(`\n🕐 Arrival Calculation:`, JSON.stringify(arrivalInfo, null, 2));

  return arrivalInfo;
}

/**
 * Generate a complete trip plan
 */
const generateTripPlan = async (preferences) => {
  const {
    source,
    destination,
    startDate,
    endDate,
    travelers,
    budget,
    tripType,
    noStay,
    isReturnTrip,
    stayNights = 1,  // NEW: For one-way trips - user-specified nights to stay
    includeActivities = true,  // User can opt-out of activities for direct travel
    transportation = [], // User's selected transport modes
    flightClasses = [],
    trainClasses = [],
    starRating = 3,       // User's preferred hotel star rating
    accommodations = [],  // User's selected accommodation types
    preferences: tripPreferences
  } = preferences;

  const sourceCity = getCityByCode(source);
  const destCity = getCityByCode(destination);

  if (!sourceCity || !destCity) {
    throw new Error(`Invalid source or destination city. Source: ${source}, Destination: ${destination}`);
  }

  // Get city codes for search functions
  const sourceCode = sourceCity.code;
  const destCode = destCity.code;

  // Calculate trip duration
  // For return trips: calculate from dates
  // For one-way trips: use stayNights specified by user
  const start = new Date(startDate);
  const end = new Date(endDate);
  const nights = isReturnTrip
    ? Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)))
    : stayNights;  // Use user-specified nights for one-way trips

  console.log(`\n📅 Trip Duration: ${nights} nights (isReturnTrip: ${isReturnTrip}, stayNights: ${stayNights})`);

  // Get transport options using city codes
  console.log(`\n🔍 Searching for transport options:`);
  console.log(`   Route: ${sourceCode} → ${destCode}`);
  console.log(`   Transport modes selected: [${transportation.join(', ')}]`);
  
  const flightResults = searchFlights({
    from: sourceCode,
    to: destCode,
    date: startDate,
    returnDate: endDate,
    travelers,
    cabinClass: 'economy'
  });

  console.log(`   Flights found: ${flightResults.outbound?.length || 0}`);

  // Search trains - now uses MongoDB (async)
  // Use first selected class, or default to cheapest (SL) for budget-friendly search
  const preferredTrainClass = trainClasses?.[0] || 'SL';
  console.log(`\n🚂 Train Search: User selected classes: [${trainClasses.join(', ')}], using: ${preferredTrainClass}`);
  const trainResults = await searchTrains({
    from: sourceCode,
    to: destCode,
    date: startDate,
    travelClass: preferredTrainClass
  });

  // === NEW: Search for RETURN transport separately on return date ===
  let returnFlightResults = { outbound: [] };
  let returnTrainResults = { trains: [] };

  if (isReturnTrip && endDate) {
    console.log(`\n🔄 Return Transport Search: Searching for return journey on ${endDate}`);

    // Search return flights
    returnFlightResults = searchFlights({
      from: destCode,  // Reversed: destination -> source
      to: sourceCode,
      date: endDate,   // Return date
      travelers,
      cabinClass: 'economy'
    });

    // Search return trains
    returnTrainResults = await searchTrains({
      from: destCode,  // Reversed: destination -> source
      to: sourceCode,
      date: endDate,   // Return date
      travelClass: preferredTrainClass
    });

    console.log(`   Return flights found: ${returnFlightResults.outbound?.length || 0}`);
    console.log(`   Return trains found: ${returnTrainResults.trains?.length || 0}`);
  } else {
    // One-way trip: Skip return transport search entirely
    console.log(`\n⏭️ Skipping return transport search: One-way trip (isReturnTrip: ${isReturnTrip})`);
  }

  // Get hotel options (skip if noStay is true OR nights is 0)
  let hotelResults = { hotels: [] };
  if (!noStay && nights > 0) {
    // Compute checkout from nights so same-day trips (startDate === endDate) still get hotels
    const hotelCheckOutDate = new Date(new Date(startDate).getTime() + nights * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    console.log(`\n🏨 Searching hotels: city=${destCode}, nights=${nights}, checkIn=${startDate}, checkOut=${hotelCheckOutDate}`);
    hotelResults = searchHotels({
      city: destCode,
      checkIn: startDate,
      checkOut: hotelCheckOutDate,
      rooms: Math.ceil(travelers / 2),
      guests: travelers
    });
    console.log(`   Hotels found from search: ${hotelResults.hotels?.length || 0}`);
    if (hotelResults.hotels && hotelResults.hotels.length > 0) {
      console.log(`   Sample hotel: ${hotelResults.hotels[0].name} - ${hotelResults.hotels[0].stars}★ - ₹${hotelResults.hotels[0].rooms?.[0]?.pricePerNight || 'N/A'}`);
    }
  } else {
    console.log(`⏭️ Skipping hotel search: noStay=${noStay}, nights=${nights}`);
  }

  // Get local transport options
  const estimatedDailyKm = 30; // Average 30km daily local travel
  const durationDays = nights + 1;
  const localTransportOptions = getLocalTransportOptions(estimatedDailyKm, durationDays, travelers, destCode);

  // === NEW: Calculate budget allocation using BudgetService ===
  const userBudget = budget || 50000; // Default budget if not provided

  const budgetAllocation = BudgetService.calculateAllocation({
    tripType: tripType || 'tour',
    durationDays,
    budget: userBudget * travelers, // Total budget for all travelers
    destination: destCity.name,
    priorities: tripPreferences?.priorities || { budget: 0.5, time: 0.5, comfort: 0.5 },
  });

  // Validate budget is sufficient
  const budgetValidation = BudgetService.validateBudget({
    tripType: tripType || 'tour',
    durationDays,
    travelers,
    budget: userBudget * travelers,
  });

  if (!budgetValidation.valid) {
    console.warn('Budget warning:', budgetValidation.message);
    // Continue with generation but note the warning
  }

  // Generate three trip plan tiers
  const plans = [];
  const warnings = []; // Collect warnings for frontend

  // Check if we have transport and hotel options
  const hasFlights = flightResults.outbound && flightResults.outbound.length > 0;
  const hasTrains = trainResults.trains && trainResults.trains.length > 0;
  const hasHotels = hotelResults.hotels && hotelResults.hotels.length > 0;

  // ========================================
  // === NEW ALGORITHM INTEGRATION ===
  // ========================================

  // 1. Transform raw search results into TripOption format
  console.log(`\n🔄 Transforming Transport Options:`);
  console.log(`   hasFlights: ${hasFlights}, flightResults.outbound length: ${flightResults.outbound?.length || 0}`);
  console.log(`   hasTrains: ${hasTrains}, trainResults.trains length: ${trainResults.trains?.length || 0}`);
  console.log(`   User selected transport modes: [${transportation.join(', ')}]`);
  
  const transformedFlights = transformFlights(
    hasFlights ? flightResults.outbound : [],
    flightClasses,
    travelers,
    isReturnTrip
  );

  const transformedTrains = transformTrains(
    hasTrains ? trainResults.trains : [],
    trainClasses,
    travelers,
    isReturnTrip
  );

  const transformedHotels = transformHotels(
    hasHotels ? hotelResults.hotels : [],
    starRating  // User's preferred star rating from request
  );

  // 2. Combine transport options with priority based on user preferences
  const allTransportOptions = combineTransportOptions(
    transformedFlights,
    transformedTrains,
    transportation // User's preferred modes ['trains', 'flights']
  );

  // Debug logging
  console.log(`\n📊 Transport Options Debug:`);
  console.log(`   Raw trains found: ${trainResults.trains?.length || 0}`);
  console.log(`   Transformed trains: ${transformedTrains.length}`);
  console.log(`   Raw flights found: ${flightResults.outbound?.length || 0}`);
  console.log(`   Transformed flights: ${transformedFlights.length}`);
  console.log(`   Combined transport: ${allTransportOptions.length}`);
  console.log(`\n🏨 Hotel Options Debug:`);
  console.log(`   Preferred star rating: ${starRating}`);
  console.log(`   Raw hotels found: ${hotelResults.hotels?.length || 0}`);
  console.log(`   Transformed hotels: ${transformedHotels.length}`);
  if (transformedHotels.length > 0) {
    console.log(`   Top 5 hotels (sorted by preference):`);
    transformedHotels.slice(0, 5).forEach((h, i) => {
      console.log(`      ${i + 1}. ${h.stars}★ ${h.name.substring(0, 20)} - ₹${h.price} (priority: ${h.priority})`);
    });
  }

  // 3. Generate meal and activity options
  const mealOptions = generateMealOptions(tripPreferences?.mealTier || 'MEDIUM');
  const activityOptions = generateActivityOptions(
    destCity.attractions || [],
    tripPreferences?.activityTier || 'standard'
  );

  // Safety check: If no transport options available, add warning
  if (allTransportOptions.length === 0) {
    console.error(`\n❌ ERROR: No transport options available after filtering!`);
    console.error(`   transformedFlights: ${transformedFlights.length}`);
    console.error(`   transformedTrains: ${transformedTrains.length}`);
    console.error(`   User preferences: [${transportation.join(', ')}]`);
    
    const errorMessage = transformedFlights.length === 0 && transformedTrains.length === 0
      ? `No transport options found for route ${sourceCode} → ${destCode}. This route may not be available in our system. Please try a different route or contact support.`
      : `No ${transportation.join(' or ')} options found for route ${sourceCode} → ${destCode}. The ${transportation.join(' and ')} you selected may not operate on this route. Try selecting different transport modes.`;
    
    warnings.push({
      type: 'NO_TRANSPORT_OPTIONS',
      category: 'transport',
      message: errorMessage,
      availableFlights: transformedFlights.length,
      availableTrains: transformedTrains.length,
      userSelectedModes: transportation,
      suggestAlternatives: transformedFlights.length > 0 || transformedTrains.length > 0
    });
    
    // Return early with error response
    return {
      id: uuidv4(),
      source: sourceCity,
      destination: destCity,
      startDate,
      endDate,
      nights,
      travelers,
      tripType,
      isReturnTrip,
      includeActivities,
      plans: [],  // Empty plans
      warnings,
      error: errorMessage,
      itinerary: [],
      destinationAttractions: [],
      inCityTransportOptions: []
    };
  }

  // 4. Run the Algorithm!
  const algorithmResult = TripAlgorithmService.generateTripPlans({
    budget: userBudget,
    travelers,
    durationDays,
    nights,
    tripType: tripType || 'tour',
    noStay,
    includeActivities,  // NEW: User preference for activities
    budgetFlexibility: preferences.budgetFlexibility || 'moderate',  // NEW: Budget flexibility
    options: {
      transport: allTransportOptions,
      accommodation: transformedHotels,
      meal: mealOptions,
      activity: activityOptions
    }
  });

  // 5. Algorithm warnings are what we show to users (ignore legacy warnings)
  if (algorithmResult.warnings && algorithmResult.warnings.length > 0) {
    // Ensure warnings are always strings before pushing
    algorithmResult.warnings.forEach(w => {
      warnings.push(typeof w === 'string' ? w : (w.message || JSON.stringify(w)));
    });
  }

  // Note: We intentionally don't add legacy transportSelection warnings
  // since the new algorithm handles all plan generation

  // 6. Log algorithm results
  console.log(`\n🎯 Algorithm Results: ${algorithmResult.plans.length} plans found`);
  if (algorithmResult.plans.length > 0) {
    console.log(`   Best Plan Score: ${algorithmResult.plans[0].score}`);
    console.log(`   Best Plan Cost: ₹${algorithmResult.plans[0].totalCost.toLocaleString()}`);
  }

  // 7. Convert Algorithm Plans to Final Response Format
  const convertAlgorithmPlan = (algoPlan, tier, index) => {
    const transport = algoPlan.selections.transport;
    const accommodation = algoPlan.selections.accommodation;

    // Calculate per-plan arrival info based on this plan's transport
    const planDepartureTime = transport.details?.departure || '09:00';
    const planDuration = transport.details?.duration || transport.duration || '2h';
    const planArrivalInfo = calculateArrivalInfo(startDate, planDepartureTime, planDuration, nights);

    // Use the nights calculated by the algorithm (which accounts for overnight travel)
    const actualNightsUsed = algoPlan.breakdown.nightsUsed ?? planArrivalInfo.adjustedNights;

    return {
      tier: tier,
      name: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan`,
      totalCost: algoPlan.totalCost,
      score: algoPlan.score,
      breakdown: algoPlan.breakdown,
      // NEW: Per-plan adjusted nights based on this plan's transport timing
      nights: actualNightsUsed,
      requestedNights: nights,  // Original requested nights for reference
      arrivalInfo: {
        isNextDayArrival: planArrivalInfo.isNextDayArrival,
        departureTime: planArrivalInfo.departureTime,
        arrivalTime: planArrivalInfo.arrivalTime,
        arrivalDate: planArrivalInfo.arrivalDate
      },
      transport: {
        type: transport.mode || transport.type,
        mode: transport.mode,
        class: transport.class,
        name: transport.name,
        cost: transport.totalCost,
        details: {
          ...(transport.details || {}),
          // Add transport name to details for frontend compatibility
          trainName: transport.mode === 'train' ? transport.name : undefined,
          airline: transport.mode === 'flight' ? (transport.details?.airline || transport.name) : undefined,
          flightNumber: transport.mode === 'flight' ? transport.details?.flightNumber : undefined,
          trainNumber: transport.mode === 'train' ? transport.details?.trainNumber : undefined
        }
      },
      accommodation: accommodation ? {
        name: accommodation.name,
        stars: accommodation.stars,
        pricePerNight: accommodation.price,
        totalCost: algoPlan.breakdown.accommodationTotal,
        nights: actualNightsUsed,  // Use algorithm-calculated nights
        details: accommodation.details || accommodation
      } : null,
      meals: {
        tier: algoPlan.selections.meal?.type || 'medium',
        dailyCost: algoPlan.selections.meal?.price || 150,
        totalCost: algoPlan.breakdown.foodTotal
      },
      activities: {
        tier: algoPlan.selections.activity?.type || 'standard',
        dailyCost: algoPlan.selections.activity?.price || 100,
        totalCost: algoPlan.breakdown.activityTotal
      }
    };
  };

  // Use algorithm results for plans if available
  let algorithmPlans = [];
  if (algorithmResult.plans.length > 0) {
    // Map algorithm plans to tier names with category labels
    const tierNames = ['budget', 'comfort', 'premium', 'popular', 'alternative'];
    // Generate MORE plans - take up to 10 best plans
    algorithmPlans = algorithmResult.plans.slice(0, 10).map((plan, idx) => {
      const tierName = plan.category ? plan.category.toLowerCase().replace(/\s+/g, '-') : tierNames[idx] || 'comfort';
      return convertAlgorithmPlan(plan, tierName, idx);
    });
    console.log(`✅ Using ${algorithmPlans.length} plans from new algorithm`);
  }

  // NEW: If no legacy plans generated, convert algorithm plans to legacy format
  if (plans.length === 0 && algorithmPlans.length > 0) {
    console.log('🔄 Converting algorithm plans to legacy format');
    // Convert MORE plans for user choice - up to 5
    for (let i = 0; i < Math.min(5, algorithmPlans.length); i++) {
      const algoPlan = algorithmPlans[i];
      const tierNames = ['Budget', 'Comfort', 'Premium'];
      // Safely get transport name as string
      const transportName = typeof algoPlan.transport?.name === 'string'
        ? algoPlan.transport.name
        : (algoPlan.transport?.name?.toString() || 'Transport');
      
      console.log(`\n   Plan ${i + 1} (${tierNames[i]}):`);
      console.log(`      Transport: ${algoPlan.transport?.mode} - ${transportName} (₹${algoPlan.breakdown.transportTotal})`);
      console.log(`      Accommodation: ${algoPlan.accommodation?.name} ${algoPlan.accommodation?.stars}★ (₹${algoPlan.breakdown.accommodationTotal})`);
      console.log(`      Meals: ₹${algoPlan.breakdown.foodTotal}, Activities: ₹${algoPlan.breakdown.activityTotal}`);
      console.log(`      Total: ₹${algoPlan.totalCost.toLocaleString()}`);
      
      plans.push({
        id: uuidv4(),
        tier: tierNames[i] || 'Comfort',
        description: algoPlan.name,
        nights: algoPlan.nights,  // Per-plan adjusted nights
        requestedNights: algoPlan.requestedNights,
        arrivalInfo: algoPlan.arrivalInfo,
        transport: algoPlan.transport,
        localTransport: null,
        hotel: algoPlan.accommodation,
        costs: {
          transport: algoPlan.breakdown.transportTotal || 0,
          localTransport: 0,
          accommodation: algoPlan.breakdown.accommodationTotal || 0,
          activities: algoPlan.breakdown.activityTotal || 0,
          meals: algoPlan.breakdown.foodTotal || 0,
          miscellaneous: 0,
          total: algoPlan.totalCost || 0
        },
        highlights: [
          `Score: ${algoPlan.score}`,
          `₹${algoPlan.totalCost.toLocaleString()} total`,
          transportName,
          algoPlan.accommodation?.name || 'No accommodation'
        ]
      });
    }
  }

  // ========================================
  // === LEGACY SMART SELECTION (only runs if no algorithm plans) ===
  // ========================================

  // Prepare available transport options by mode (for legacy code and fallback)
  const availableTransport = {
    flights: hasFlights ? flightResults.outbound : [],
    trains: hasTrains ? trainResults.trains : [],
    buses: [], // TODO: Add bus data
    carRentals: [] // Will be calculated separately using intercity car rental
  };

  // Add intercity car rental as an option if user selected it
  const transportModes = transportation || [];
  if (transportModes.includes('carRentals') || transportModes.includes('car')) {
    // Inline distance calculation for car rental
    const R = 6371;
    const lat1 = sourceCity.coordinates?.lat || 0;
    const lon1 = sourceCity.coordinates?.lng || 0;
    const lat2 = destCity.coordinates?.lat || 0;
    const lon2 = destCity.coordinates?.lng || 0;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = Math.round(R * c);
    const carRental = SmartSelectionService.calculateIntercityCarRental({
      distance,
      isReturnTrip,
      carType: 'sedan'
    });
    availableTransport.carRentals = [{
      type: 'intercity-car',
      totalFare: carRental.cost,
      distance,
      carType: 'sedan',
      details: carRental
    }];
  }

  // Smart transport selection (always run for fallback/itinerary)
  const transportSelection = SmartSelectionService.selectTransport({
    userPreferences: transportModes,
    availableOptions: availableTransport,
    budgetAllocation: budgetAllocation.transport,
    travelers,
    isReturnTrip
  });

  // Don't add legacy warnings - new algorithm warnings are more accurate
  // if (transportSelection.warnings.length > 0) {
  //   warnings.push(...transportSelection.warnings);
  // }

  // Convert selection to the format expected by plan generation
  const convertSelection = (selection) => {
    if (!selection) return null;

    switch (selection.mode) {
      case 'flights':
        return { type: 'flight', details: selection.option, cost: selection.cost };
      case 'trains':
        return { type: 'train', details: selection.option, cost: selection.cost };
      case 'buses':
        return { type: 'bus', details: selection.option, cost: selection.cost };
      case 'carRentals':
        return { type: 'car-rental', details: selection.option, cost: selection.cost };
      default:
        return null;
    }
  };

  // Get selected transport
  const selectedTransport = convertSelection(transportSelection.selected);

  // Helper function to calculate distance between cities (approximate)
  function calculateDistance(city1, city2) {
    // Use coordinates to calculate approximate distance
    const R = 6371; // Earth's radius in km
    const lat1 = city1.coordinates?.lat || 0;
    const lon1 = city1.coordinates?.lng || 0;
    const lat2 = city2.coordinates?.lat || 0;
    const lon2 = city2.coordinates?.lng || 0;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  // === Budget Plan ===
  // Use selectedTransport from SmartSelectionService
  const budgetTransport = selectedTransport; // Smart selection already picked the best option

  const budgetHotel = hasHotels ? hotelResults.hotels
    .filter(h => h.stars <= 3)
    .sort((a, b) => (a.rooms[0]?.pricePerNight || 0) - (b.rooms[0]?.pricePerNight || 0))[0] : null;

  if (algorithmPlans.length === 0 && budgetTransport && (budgetHotel || noStay)) {
    // Calculate arrival info for THIS plan's transport
    const budgetDepartureTime = typeof budgetTransport.details?.departure === 'object'
      ? (budgetTransport.details.departure.time || '09:00')
      : (budgetTransport.details?.departure || budgetTransport.departure || '09:00');
    const budgetDuration = budgetTransport.details?.duration || budgetTransport.duration || '2h';
    const budgetArrivalInfo = calculateArrivalInfo(startDate, budgetDepartureTime, budgetDuration, nights);
    const budgetNights = budgetArrivalInfo.adjustedNights;

    // Use cost from smart selection or calculate if not provided
    const transportCost = budgetTransport.cost || (budgetTransport.type === 'train'
      ? (budgetTransport.details?.fare?.total || 1500) * travelers * (isReturnTrip ? 2 : 1)
      : (budgetTransport.details?.prices?.economy?.total || 5000) * travelers * (isReturnTrip ? 2 : 1));

    // Get budget local transport (auto or bike)
    const budgetLocalTransport = localTransportOptions.find(t => t.type === 'Auto Rickshaw' || t.type === 'Bike Rental') || localTransportOptions[0];
    const localTransportCost = budgetLocalTransport ? budgetLocalTransport.totalFare : 0;

    // Use budgetAllocation for cost limits, but calculate actual costs WITH ADJUSTED NIGHTS
    const hotelCost = budgetHotel ? (budgetHotel.rooms[0]?.pricePerNight || 1500) * budgetNights * Math.ceil(travelers / 2) : 0;

    // Calculate meal costs using BudgetService
    const departureHour = new Date(startDate).getHours() || 8;
    const mealPlan = BudgetService.planMealCosts(departureHour, tripType || 'tour', durationDays, budgetAllocation.food, travelers);
    const mealsCost = mealPlan.totalEstimated || (TRIP_CONFIG.MEAL_COSTS.BUDGET.max * 3 * durationDays * travelers);

    // Calculate activities cost - ONLY for tour trips, NOT direct travel
    let activitiesCost = 0;
    if (tripType === 'tour') {
      const attractionFees = destCity.attractions?.reduce((sum, a) => sum + (a.entryFee || 0), 0) || 0;
      const activitiesPerDay = 2; // Assume 2 activities per day
      activitiesCost = Math.min(
        attractionFees * travelers, // Actual entry fees for all attractions
        150 * budgetNights * travelers * activitiesPerDay // Max ₹150 per activity (Indian pricing)
      );
    }
    const miscCost = Math.max(500, (transportCost + hotelCost) * 0.05); // 5% buffer, min ₹500

    // Score this transport option
    const transportScore = ScoringService.scoreTransportOption(
      { price: transportCost, type: budgetTransport.type, durationMinutes: 480, transfers: 0 },
      budgetAllocation.transport,
      tripPreferences?.priorities
    );

    plans.push({
      id: uuidv4(),
      tier: 'Budget',
      score: transportScore,
      badge: ScoringService.generatePlanBadge(transportScore),
      description: noStay ? 'Best value for a day trip' : 'Best value for money with comfortable travel and stay',
      nights: budgetNights,  // Per-plan adjusted nights
      arrivalInfo: budgetArrivalInfo,  // Arrival calculation details
      transport: budgetTransport,
      localTransport: budgetLocalTransport ? {
        type: budgetLocalTransport.type,
        totalFare: budgetLocalTransport.totalFare,
        ratePerKm: budgetLocalTransport.ratePerKm,
        notes: budgetLocalTransport.notes
      } : null,
      hotel: budgetHotel ? {
        name: budgetHotel.name,
        stars: budgetHotel.stars,
        location: budgetHotel.location,
        pricePerNight: budgetHotel.rooms[0]?.pricePerNight || 0,
        roomType: budgetHotel.rooms[0]?.name || 'Standard',
        amenities: budgetHotel.amenities?.slice(0, 5) || []
      } : null,
      costs: {
        transport: Math.round(transportCost),
        localTransport: Math.round(localTransportCost),
        accommodation: Math.round(hotelCost),
        activities: Math.round(activitiesCost),
        meals: Math.round(mealsCost),
        miscellaneous: Math.round(miscCost),
        total: Math.round(transportCost + localTransportCost + hotelCost + activitiesCost + mealsCost + miscCost)
      },
      mealPlan: {
        tier: mealPlan.tier,
        meals: mealPlan.meals,
        avgCostPerMeal: mealPlan.avgCostPerMeal,
      },
      budgetAllocation: {
        transport: Math.round(budgetAllocation.transport),
        accommodation: Math.round(budgetAllocation.accommodation),
        food: Math.round(budgetAllocation.food),
        activities: Math.round(budgetAllocation.activities),
        buffer: Math.round(budgetAllocation.buffer),
      },
      highlights: noStay ? [
        `${budgetTransport.type === 'train' ? 'Train' : 'Flight'} tickets included`,
        budgetLocalTransport ? `Local travel by ${budgetLocalTransport.type} (₹${budgetLocalTransport.ratePerKm}/km)` : null,
        'Day trip - no accommodation',
        'Basic sightseeing covered'
      ].filter(Boolean) : [
        `${budgetNights} nights stay at ${budgetHotel?.name || 'Budget Hotel'}`,
        `${budgetTransport.type === 'train' ? 'Train' : 'Flight'} tickets included`,
        budgetLocalTransport ? `Local travel by ${budgetLocalTransport.type}` : null,
        'Basic sightseeing covered',
        `Meals: ${mealPlan.tier} tier`
      ].filter(Boolean)
    });
  }

  // === Comfort Plan ===
  // Use same transport as budget (smart selection), but with higher tier hotels/meals
  const comfortTransport = selectedTransport;

  const comfortHotel = hasHotels ? hotelResults.hotels
    .filter(h => h.stars >= 3 && h.stars <= 4)
    .sort((a, b) => b.rating - a.rating)[0] : null;

  if (algorithmPlans.length === 0 && comfortTransport && (comfortHotel || noStay)) {
    // Calculate arrival info for THIS plan's transport
    const comfortDepartureTime = typeof comfortTransport.details?.departure === 'object'
      ? (comfortTransport.details.departure.time || '09:00')
      : (comfortTransport.details?.departure || comfortTransport.departure || '09:00');
    const comfortDuration = comfortTransport.details?.duration || comfortTransport.duration || '2h';
    const comfortArrivalInfo = calculateArrivalInfo(startDate, comfortDepartureTime, comfortDuration, nights);
    const comfortNights = comfortArrivalInfo.adjustedNights;

    // Use cost from smart selection
    const transportCost = comfortTransport.cost || (comfortTransport.type === 'train'
      ? (comfortTransport.details?.fare?.total || 2500) * travelers * (isReturnTrip ? 2 : 1)
      : (comfortTransport.details?.prices?.economy?.total || 6000) * travelers * (isReturnTrip ? 2 : 1));

    // Get comfort local transport (sedan car)
    const comfortLocalTransport = localTransportOptions.find(t => t.carType === 'sedan') ||
      localTransportOptions.find(t => t.type === 'Car Rental') ||
      localTransportOptions[localTransportOptions.length - 2];
    const localTransportCost = comfortLocalTransport ? comfortLocalTransport.totalFare : 0;

    const hotelCost = comfortHotel ? (comfortHotel.rooms[1]?.pricePerNight || comfortHotel.rooms[0]?.pricePerNight || 0) : 0;
    const totalHotelCost = hotelCost * comfortNights * Math.ceil(travelers / 2);
    // Activities only for tour trips, NOT direct travel
    let activitiesCost = 0;
    if (tripType === 'tour') {
      const comfortAttractionFees = destCity.attractions?.reduce((sum, a) => sum + (a.entryFee || 0), 0) || 0;
      activitiesCost = Math.min(comfortAttractionFees * travelers * 1.2, 250 * comfortNights * travelers * 2);
    }
    const mealsCost = TRIP_CONFIG.MEAL_COSTS.MEDIUM.max * 3 * (comfortNights + 1) * travelers;
    const miscCost = Math.max(800, (transportCost + totalHotelCost) * 0.05);

    plans.push({
      id: uuidv4(),
      tier: 'Comfort',
      description: noStay ? 'Comfortable day trip' : 'Balance of comfort and value with quality experiences',
      nights: comfortNights,  // Per-plan adjusted nights
      arrivalInfo: comfortArrivalInfo,  // Arrival calculation details
      transport: comfortTransport,
      localTransport: comfortLocalTransport ? {
        type: comfortLocalTransport.type,
        carType: comfortLocalTransport.carType,
        totalFare: comfortLocalTransport.totalFare,
        ratePerKm: comfortLocalTransport.ratePerKm,
        notes: comfortLocalTransport.notes
      } : null,
      hotel: comfortHotel ? {
        name: comfortHotel.name,
        stars: comfortHotel.stars,
        location: comfortHotel.location,
        pricePerNight: hotelCost,
        roomType: comfortHotel.rooms[1]?.name || comfortHotel.rooms[0]?.name || 'Standard',
        amenities: comfortHotel.amenities?.slice(0, 7) || []
      } : null,
      costs: {
        transport: Math.round(transportCost),
        localTransport: Math.round(localTransportCost),
        accommodation: Math.round(totalHotelCost),
        activities: Math.round(activitiesCost),
        meals: Math.round(mealsCost),
        miscellaneous: Math.round(miscCost),
        total: Math.round(transportCost + localTransportCost + totalHotelCost + activitiesCost + mealsCost + miscCost)
      },
      highlights: noStay ? [
        'Round-trip flights included',
        comfortLocalTransport ? `Private ${comfortLocalTransport.carType || 'car'} with driver` : null,
        'Day trip - no accommodation',
        'Guided tours and activities'
      ].filter(Boolean) : [
        `${comfortNights} nights at ${comfortHotel?.stars || 3}-star ${comfortHotel?.name || 'Hotel'}`,
        'Round-trip flights included',
        comfortLocalTransport ? `Private ${comfortLocalTransport.carType || 'car'} with driver` : null,
        'Guided tours and activities',
        'Breakfast included'
      ].filter(Boolean)
    });
  }

  // === Premium Plan ===
  // Use same transport as others, but with premium local transport and hotels
  const premiumTransport = selectedTransport;

  const premiumHotel = hasHotels ? hotelResults.hotels
    .filter(h => h.stars >= 4)
    .sort((a, b) => b.rating - a.rating)[0] : null;

  if (algorithmPlans.length === 0 && premiumTransport && (premiumHotel || noStay)) {
    // Calculate arrival info for THIS plan's transport
    const premiumDepartureTime = typeof premiumTransport.details?.departure === 'object'
      ? (premiumTransport.details.departure.time || '09:00')
      : (premiumTransport.details?.departure || premiumTransport.departure || '09:00');
    const premiumDuration = premiumTransport.details?.duration || premiumTransport.duration || '2h';
    const premiumArrivalInfo = calculateArrivalInfo(startDate, premiumDepartureTime, premiumDuration, nights);
    const premiumNights = premiumArrivalInfo.adjustedNights;

    // Use cost from smart selection with premium multiplier
    const transportCost = (premiumTransport.cost || (premiumTransport.type === 'train'
      ? (premiumTransport.details?.fare?.total || 4000) * travelers * (isReturnTrip ? 2 : 1)
      : (premiumTransport.details?.prices?.economy?.total || 10000) * travelers * (isReturnTrip ? 2 : 1))) * 1.3; // Premium class multiplier

    // Get premium local transport (luxury car)
    const premiumLocalTransport = localTransportOptions.find(t => t.carType === 'luxury') ||
      localTransportOptions.find(t => t.carType === 'suv') ||
      localTransportOptions[localTransportOptions.length - 1];
    const localTransportCost = premiumLocalTransport ? premiumLocalTransport.totalFare : 0;

    const hotelRoom = premiumHotel ? (premiumHotel.rooms.find(r => r.type === 'suite' || r.type === 'deluxe') || premiumHotel.rooms[0]) : null;
    const totalHotelCost = hotelRoom ? hotelRoom.pricePerNight * premiumNights * Math.ceil(travelers / 2) : 0;
    // Activities only for tour trips, NOT direct travel
    let activitiesCost = 0;
    if (tripType === 'tour') {
      const premiumAttractionFees = destCity.attractions?.reduce((sum, a) => sum + (a.entryFee || 0), 0) || 0;
      activitiesCost = Math.min(premiumAttractionFees * travelers * 2, 500 * premiumNights * travelers * 2);
    }
    const mealsCost = TRIP_CONFIG.MEAL_COSTS.EXPENSIVE.max * 3 * (premiumNights + 1) * travelers;
    const miscCost = Math.max(1000, (transportCost + totalHotelCost) * 0.05);

    plans.push({
      id: uuidv4(),
      tier: 'Premium',
      description: noStay ? 'Premium day trip with premium class' : 'Luxury travel with premium accommodations and exclusive experiences',
      nights: premiumNights,  // Per-plan adjusted nights
      arrivalInfo: premiumArrivalInfo,  // Arrival calculation details
      transport: premiumTransport,
      localTransport: premiumLocalTransport ? {
        type: premiumLocalTransport.type,
        carType: premiumLocalTransport.carType,
        totalFare: premiumLocalTransport.totalFare,
        ratePerKm: premiumLocalTransport.ratePerKm,
        carOptions: premiumLocalTransport.carOptions,
        notes: premiumLocalTransport.notes
      } : null,
      hotel: premiumHotel ? {
        name: premiumHotel.name,
        stars: premiumHotel.stars,
        location: premiumHotel.location,
        pricePerNight: hotelRoom?.pricePerNight || 0,
        roomType: hotelRoom?.name || 'Suite',
        amenities: premiumHotel.amenities || []
      } : null,
      costs: {
        transport: Math.round(transportCost),
        localTransport: Math.round(localTransportCost),
        accommodation: Math.round(totalHotelCost),
        activities: Math.round(activitiesCost),
        meals: Math.round(mealsCost),
        miscellaneous: Math.round(miscCost),
        total: Math.round(transportCost + localTransportCost + totalHotelCost + activitiesCost + mealsCost + miscCost)
      },
      highlights: noStay ? [
        'Business class flights',
        premiumLocalTransport ? `Luxury ${premiumLocalTransport.carType || 'car'} with chauffeur` : null,
        'Premium day trip experience',
        'Private tours and experiences',
        'All meals included'
      ].filter(Boolean) : [
        `${premiumNights} nights at ${premiumHotel?.stars || 5}-star ${premiumHotel?.name || 'Hotel'}`,
        'Business class flights',
        premiumLocalTransport ? `Luxury ${premiumLocalTransport.carType || 'car'} with chauffeur` : null,
        'Private tours and premium experiences',
        'All meals included',
        'Airport transfers',
        'Spa and wellness access'
      ].filter(Boolean)
    });
  }

  // If no plans generated, create a basic plan
  if (plans.length === 0) {
    const basicCost = travelers * 5000 + (noStay ? 0 : nights * 2000);
    plans.push({
      id: uuidv4(),
      tier: 'Basic',
      description: 'A simple trip plan based on your requirements',
      transport: { type: 'self-arranged', details: null },
      hotel: null,
      costs: {
        transport: 0,
        accommodation: 0,
        activities: Math.round(basicCost * 0.5),
        meals: Math.round(basicCost * 0.3),
        miscellaneous: Math.round(basicCost * 0.2),
        total: basicCost
      },
      highlights: [
        'Flexible itinerary',
        'Self-arranged transport',
        noStay ? 'Day trip' : `${nights} accommodation to be arranged`
      ]
    });
  }

  // Generate itinerary with transport timing details
  // Extract transport details from the best plan to determine overnight travel
  const bestTransport = algorithmResult.plans[0]?.selections?.transport || transportSelection.selected?.option || {};

  // DEBUG: Log transport details to understand structure
  console.log('\n🕐 Transport Timing Debug:');
  console.log('   Best transport:', JSON.stringify(bestTransport, null, 2).substring(0, 500));
  console.log('   details.departure:', bestTransport.details?.departure);
  console.log('   departure direct:', bestTransport.departure);

  // Extract departure time - handle multiple possible locations
  // Train data: details.departure is a string like "23:30"
  // Flight data: details.departure.time is the time
  let departureTime = '09:00';
  if (typeof bestTransport.details?.departure === 'string') {
    departureTime = bestTransport.details.departure; // Train format: "23:30"
  } else if (typeof bestTransport.details?.departure?.time === 'string') {
    departureTime = bestTransport.details.departure.time; // Flight format
  } else if (typeof bestTransport.departure === 'string') {
    departureTime = bestTransport.departure;
  }

  // Extract and format transport duration
  let formattedDuration = '2h';
  const rawDuration = bestTransport.duration || bestTransport.details?.duration;
  if (rawDuration) {
    if (typeof rawDuration === 'object' && rawDuration.hours !== undefined) {
      // Duration is an object like {hours: 27, minutes: 30}
      formattedDuration = rawDuration.minutes > 0
        ? `${rawDuration.hours}h ${rawDuration.minutes}m`
        : `${rawDuration.hours}h`;
    } else if (typeof rawDuration === 'string') {
      formattedDuration = rawDuration;
    }
  }

  // === NEW: Calculate actual arrival using helper function ===
  const arrivalInfo = calculateArrivalInfo(startDate, departureTime, rawDuration, nights);
  const adjustedNights = arrivalInfo.adjustedNights;

  console.log(`\n🏨 Hotel Nights Calculation:`);
  console.log(`   Requested nights: ${nights}`);
  console.log(`   Adjusted nights (based on arrival): ${adjustedNights}`);
  console.log(`   Overnight travel: ${arrivalInfo.isNextDayArrival}`);
  console.log(`   Hotel check-in date: ${arrivalInfo.hotelCheckInDate}`);

  const transportTimingDetails = {
    outboundDeparture: arrivalInfo.departureTime,
    outboundArrival: arrivalInfo.arrivalTime,
    isOvernightTravel: arrivalInfo.isNextDayArrival,
    returnDeparture: null,
    returnDate: endDate,
    // Transport display info
    transportName: bestTransport.name || bestTransport.trainName || bestTransport.flightNumber || 'Transport',
    transportPrice: bestTransport.price || 0,
    transportDuration: formattedDuration,
    sourceCity: sourceCity.name,
    destCity: destCity.name,
    // NEW: Actual arrival info for frontend
    actualArrivalDate: arrivalInfo.arrivalDate,
    actualArrivalTime: arrivalInfo.arrivalTime,
    hotelCheckInDate: arrivalInfo.hotelCheckInDate
  };

  // Extract hotel details from best plan for itinerary display
  const bestHotel = algorithmResult.plans[0]?.selections?.accommodation || {};
  const hotelDetails = {
    hotelName: bestHotel.name || 'Hotel',
    pricePerNight: bestHotel.price || 0
  };

  // Use adjusted nights for itinerary (accounts for overnight travel)
  const itinerary = generateItinerary(destCity, adjustedNights, tripType, transportTimingDetails, hotelDetails, isReturnTrip);

  // Get destination attractions for user selection
  const destinationAttractions = destCity.attractions?.map(a => ({
    id: a.name.toLowerCase().replace(/\s+/g, '-'),
    name: a.name,
    type: a.type,
    entryFee: a.entryFee || 0,
    duration: a.duration
  })) || [];

  // Get in-city transport options
  const inCityOptions = SmartSelectionService.getInCityTransportOptions({
    dailyKm: 30,
    days: nights + 1,
    travelers,
    destination: destCity.name
  });

  return {
    id: uuidv4(),
    source: sourceCity,
    destination: destCity,
    startDate,
    endDate,
    nights,
    adjustedNights,  // NEW: Actual hotel nights after accounting for travel time
    travelers,
    tripType,
    isReturnTrip,  // NEW: Pass through for frontend
    includeActivities,  // NEW: Whether activities are included in plans
    plans,
    // NEW: Algorithm-generated plans (priority-based backtracking)
    algorithmPlans: algorithmPlans.length > 0 ? algorithmPlans : null,
    algorithmMetadata: {
      plansGenerated: algorithmResult.plans.length,
      cheapestPossible: algorithmResult.cheapestPossible,
      iterations: algorithmResult.iterations,
      activitiesIncluded: includeActivities
    },
    itinerary,
    // NEW: Arrival info for frontend itinerary synchronization
    arrivalInfo: {
      departureDate: arrivalInfo.departureDate,
      departureTime: arrivalInfo.departureTime,
      arrivalDate: arrivalInfo.arrivalDate,
      arrivalTime: arrivalInfo.arrivalTime,
      isNextDayArrival: arrivalInfo.isNextDayArrival,
      hotelCheckInDate: arrivalInfo.hotelCheckInDate,
      requestedNights: arrivalInfo.requestedNights,
      adjustedNights: arrivalInfo.adjustedNights
    },
    // Transport timing for display
    transportTiming: transportTimingDetails,
    // New fields for smart selection
    warnings: warnings.length > 0 ? warnings : null,
    destinationAttractions: includeActivities ? destinationAttractions : [],  // Empty if no activities
    inCityTransportOptions: inCityOptions,
    transportAlternatives: transportSelection.alternatives,
    createdAt: new Date().toISOString()
  };
};

/**
 * Generate day-by-day itinerary with proper travel time accounting
 * 
 * TRAVEL TIME LOGIC:
 * - If departure is after 18:00 (evening train/flight), consider it overnight travel
 * - Overnight travel: Day 1 = Departure (in transit), Day 2 = Arrival at destination
 * - Regular travel: Day 1 = Arrival at destination
 * 
 * Example (Overnight):
 *   - Train departs 21:30 on Dec 27 (Day 1)
 *   - Train arrives 09:45 on Dec 28 (Day 2)
 *   - User reaches hotel by ~10:30 (Day 2)
 *   - Day 2 activities: Check-in, lunch, evening activities
 *   - Return transport on Day N (user's return date)
 * 
 * @param {Object} city - Destination city data
 * @param {number} nights - Number of hotel nights
 * @param {string} tripType - 'tour' or 'direct'
 * @param {Object} transportDetails - Outbound and return transport info
 * @param {Object} hotelDetails - Hotel name and price per night
 * @param {boolean} isReturnTrip - Whether this is a round trip (affects last day)
 */
const generateItinerary = (city, nights, tripType, transportDetails = {}, hotelDetails = {}, isReturnTrip = true) => {
  const itinerary = [];
  const attractions = city.attractions || [];
  const { hotelName = 'Hotel', pricePerNight = 0 } = hotelDetails;

  // Extract transport timing info
  const {
    outboundDeparture = '09:00',  // Departure time from source
    outboundArrival = '12:00',    // Arrival time at destination
    isOvernightTravel = false,    // Does the journey span midnight?
    returnDeparture = null,       // Return transport departure time
    returnDate = null,            // User's return date
    transportName = 'Transport',  // Transport name (train/flight name)
    transportPrice = 0,           // Transport price
    transportDuration = '2h',     // Transport duration
    sourceCity = '',              // Source city name
    destCity = ''                 // Destination city name
  } = transportDetails;

  // Parse departure hour to determine if it's evening/overnight travel
  const departureHour = parseInt(outboundDeparture.split(':')[0], 10) || 9;
  const isEveningDeparture = departureHour >= 18; // After 6 PM is considered evening
  const calculatedOvernightTravel = isOvernightTravel || isEveningDeparture;

  console.log('\n📅 Itinerary Generation:');
  console.log(`   Departure hour: ${departureHour}, Is afternoon/evening: ${isEveningDeparture}`);
  console.log(`   Overnight travel: ${calculatedOvernightTravel}`);
  console.log(`   Nights requested: ${nights}`);

  // Calculate total trip days
  // IMPORTANT: Total days = nights + 1 (arrival day + nights + departure day consolidated)
  // For overnight travel, the structure changes but total days stay the same:
  // - Day 1: Departure (evening, in transit)
  // - Day 2 to Day N-1: Actual hotel nights (N-2 nights total)  
  // - Day N: Departure from destination
  // 
  // For regular travel:
  // - Day 1: Arrival (morning/afternoon)
  // - Day 2 to Day N-1: Full exploration days
  // - Day N: Departure
  const totalDays = nights + 1;

  console.log(`   Total days in itinerary: ${totalDays}`);

  for (let day = 1; day <= totalDays; day++) {
    const dayPlan = {
      day,
      title: '',
      activities: []
    };

    // Day 1: Departure Day
    if (day === 1) {
      if (calculatedOvernightTravel) {
        // Overnight travel - Day 1 is departure, user is traveling
        dayPlan.title = 'Departure Day (In Transit)';
        dayPlan.activities = [
          {
            time: outboundDeparture,
            activity: `${transportName}: ${sourceCity} → ${destCity}`,
            type: 'transport',
            description: `Duration: ${transportDuration} • Overnight journey`,
            cost: transportPrice
          },
          {
            time: 'Night',
            activity: 'In transit (no hotel stay)',
            type: 'travel',
            description: 'Traveling overnight'
          }
        ];
      } else {
        // Same-day arrival - Day 1 includes arrival and hotel check-in
        // Standard hotel check-in is at 14:00 minimum
        dayPlan.title = 'Arrival Day';
        const arrivalHour = parseInt(outboundArrival.split(':')[0], 10) || 12;

        // Check-in is at 14:00 or later (never before 14:00)
        const checkInHour = Math.max(14, arrivalHour + 1);
        const checkInTime = `${checkInHour}:00`;

        if (arrivalHour < 12) {
          // Morning arrival - free time until 14:00 check-in
          dayPlan.activities = [
            { time: outboundDeparture, activity: `${transportName}: ${sourceCity} → ${destCity}`, type: 'transport', description: `Duration: ${transportDuration}`, cost: transportPrice },
            { time: outboundArrival, activity: `Arrive at ${city.name}`, type: 'travel' },
            { time: `${arrivalHour + 1}:00`, activity: 'Store luggage at hotel / Free time until check-in', type: 'leisure', description: 'Explore nearby or relax at lobby' },
            { time: checkInTime, activity: `Check-in: ${hotelName}`, type: 'accommodation', cost: pricePerNight, costLabel: 'Per Night' },
            { time: '15:00', activity: 'Freshen up and rest', type: 'leisure' },
            { time: '17:00', activity: 'Explore local area and evening walk', type: 'leisure' },
            { time: '19:30', activity: 'Dinner', type: 'meal', cost: 500 }
          ];
        } else if (arrivalHour < 18) {
          // Afternoon arrival - check-in at 14:00 or arrival+1
          dayPlan.activities = [
            { time: outboundDeparture, activity: `${transportName}: ${sourceCity} → ${destCity}`, type: 'transport', description: `Duration: ${transportDuration}`, cost: transportPrice },
            { time: outboundArrival, activity: `Arrive at ${city.name}`, type: 'travel' },
            { time: checkInTime, activity: `Check-in: ${hotelName}`, type: 'accommodation', cost: pricePerNight, costLabel: 'Per Night' },
            { time: 'Evening', activity: 'Explore local area and evening walk', type: 'leisure' },
            { time: '19:30', activity: 'Dinner', type: 'meal', cost: 500 }
          ];
        } else {
          // Evening arrival - check-in upon arrival
          dayPlan.activities = [
            { time: outboundDeparture, activity: `${transportName}: ${sourceCity} → ${destCity}`, type: 'transport', description: `Duration: ${transportDuration}`, cost: transportPrice },
            { time: outboundArrival, activity: `Arrive at ${city.name}`, type: 'travel' },
            { time: `${Math.min(arrivalHour + 1, 22)}:00`, activity: `Check-in: ${hotelName}`, type: 'accommodation', cost: pricePerNight, costLabel: 'Per Night' },
            { time: 'Night', activity: 'Dinner and rest', type: 'meal', cost: 400 }
          ];
        }
      }
    }
    // Day 2 (for overnight travel): Actual arrival at destination
    else if (day === 2 && calculatedOvernightTravel) {
      dayPlan.title = 'Arrival Day';
      const arrivalHour = parseInt(outboundArrival.split(':')[0], 10) || 10;

      // Check-in is at 14:00 or later (never before 14:00)
      const checkInHour = Math.max(14, arrivalHour + 1);
      const checkInTime = `${checkInHour}:00`;

      if (arrivalHour < 12) {
        // Morning arrival after overnight travel - free time until 14:00
        dayPlan.activities = [
          { time: outboundArrival, activity: `Arrive at ${city.name}`, type: 'travel' },
          { time: `${arrivalHour + 1}:00`, activity: 'Store luggage at hotel / Free time', type: 'leisure', description: 'Explore nearby or relax at lobby' },
          { time: checkInTime, activity: `Check-in: ${hotelName}`, type: 'accommodation', cost: pricePerNight, costLabel: 'Per Night' },
          { time: '15:00', activity: 'Freshen up and rest', type: 'leisure' },
          { time: '17:00', activity: 'Explore nearby area', type: 'leisure' },
          { time: '19:30', activity: 'Dinner', type: 'meal', cost: 500 }
        ];
      } else {
        // Afternoon/evening arrival - check-in on arrival
        dayPlan.activities = [
          { time: outboundArrival, activity: `Arrive at ${city.name}`, type: 'travel' },
          { time: checkInTime, activity: `Check-in: ${hotelName}`, type: 'accommodation', cost: pricePerNight, costLabel: 'Per Night' },
          { time: '15:00', activity: 'Explore nearby area', type: 'leisure' },
          { time: '19:30', activity: 'Dinner', type: 'meal', cost: 500 }
        ];
      }
    }
    // Last Day: Departure/Return (different for one-way vs round trip)
    else if (day === totalDays) {
      if (!isReturnTrip) {
        // ONE-WAY TRIP: Last day is just check-out, no return transport
        dayPlan.title = 'Check-out Day';
        dayPlan.activities = [
          { time: '08:00', activity: 'Breakfast at hotel', type: 'meal', cost: 200 },
          { time: '10:00', activity: 'Hotel check-out', type: 'travel' },
          { time: '11:00', activity: 'Free time / Trip ends', type: 'leisure', description: 'One-way trip ends - no return transport planned' }
        ];
      } else {
        // ROUND TRIP: Include return transport
        dayPlan.title = 'Departure Day';
        const departTime = returnDeparture || '18:00';
        const departHour = parseInt(departTime.split(':')[0], 10) || 18;

        if (departHour >= 18) {
          // Evening departure - full day available
          dayPlan.activities = [
            { time: '08:00', activity: 'Breakfast at hotel', type: 'meal', cost: 200 },
            { time: '09:00', activity: 'Hotel check-out', type: 'travel' },
            { time: '10:00', activity: 'Last-minute sightseeing or shopping', type: 'leisure' },
            { time: '13:00', activity: 'Lunch', type: 'meal', cost: 300 },
            { time: '15:00', activity: 'Head to station/airport', type: 'travel' },
            { time: departTime, activity: `${transportName}: ${destCity} → ${sourceCity}`, type: 'transport', description: `Duration: ${transportDuration}`, cost: transportPrice }
          ];
        } else if (departHour >= 12) {
          // Afternoon departure
          dayPlan.activities = [
            { time: '08:00', activity: 'Breakfast at hotel', type: 'meal', cost: 200 },
            { time: '09:00', activity: 'Hotel check-out', type: 'travel' },
            { time: '10:00', activity: 'Last-minute shopping', type: 'leisure' },
            { time: `${departHour - 2}:00`, activity: 'Head to station/airport', type: 'travel' },
            { time: departTime, activity: `${transportName}: ${destCity} → ${sourceCity}`, type: 'transport', description: `Duration: ${transportDuration}`, cost: transportPrice }
          ];
        } else {
          // Morning departure
          dayPlan.activities = [
            { time: '06:00', activity: 'Early breakfast', type: 'meal', cost: 200 },
            { time: '07:00', activity: 'Hotel check-out', type: 'travel' },
            { time: `${departHour - 1}:00`, activity: 'Head to station/airport', type: 'travel' },
            { time: departTime, activity: `${transportName}: ${destCity} → ${sourceCity}`, type: 'transport', description: `Duration: ${transportDuration}`, cost: transportPrice }
          ];
        }
      }
    }
    // Middle Days: Exploration
    else {
      // Calculate which exploration day this is (excluding arrival day)
      // For overnight: Day 3 is first exploration (index 0), Day 4 is second (index 1)
      // For regular: Day 2 is first exploration (index 0), Day 3 is second (index 1)
      const explorationDayIndex = calculatedOvernightTravel ? day - 3 : day - 2;
      const dayAttractions = attractions.slice(explorationDayIndex * 2, explorationDayIndex * 2 + 2);

      dayPlan.title = `Day ${day} - Explore ${city.name}`;
      dayPlan.activities = [
        { time: '08:00', activity: 'Breakfast at hotel', type: 'meal', cost: 200 },
        {
          time: '09:00 - 12:00',
          activity: dayAttractions[0]?.name || 'Local sightseeing',
          type: 'attraction',
          details: dayAttractions[0]
        },
        { time: '12:30', activity: 'Lunch at local restaurant', type: 'meal', cost: 300 },
        {
          time: '14:00 - 17:00',
          activity: dayAttractions[1]?.name || 'Explore markets and local culture',
          type: 'attraction',
          details: dayAttractions[1]
        },
        { time: '17:30', activity: 'Tea break and relaxation', type: 'leisure' },
        { time: '19:30', activity: 'Dinner', type: 'meal', cost: 500 }
      ];
    }

    itinerary.push(dayPlan);
  }

  return itinerary;
};

/**
 * @route   POST /api/trips/plan
 * @desc    Generate a trip plan (public access, saves to user if authenticated)
 * @access  Public
 */
router.post('/plan', optionalAuthMiddleware, async (req, res) => {
  try {
    const {
      source,
      destination,
      startDate,
      endDate,
      travelers = 2,
      budget,
      tripType = 'leisure',
      noStay = false,
      isReturnTrip = true,
      stayNights = 1,           // NEW: For one-way trips
      transportation = [],
      flightClasses = [],
      trainClasses = [],
      starRating = 3,           // NEW: Hotel star preference
      includeActivities = true, // NEW: Whether to include activities
      accommodations = [],      // NEW: Accommodation types
      preferences = {}
    } = req.body;

    // 🐛 DEBUG: Log all received data
    console.log('\n📥 POST /plan received data:');
    console.log(`   isReturnTrip: ${isReturnTrip}, stayNights: ${stayNights}, noStay: ${noStay}`);
    console.log(`   trainClasses: [${trainClasses?.join(', ') || 'none'}]`);
    console.log(`   flightClasses: [${flightClasses?.join(', ') || 'none'}]`);
    console.log(`   starRating: ${starRating}, includeActivities: ${includeActivities}`);
    console.log(`   transportation: [${transportation?.join(', ') || 'none'}]`);

    // Validate required fields
    if (!source || !destination || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: source, destination, startDate, endDate'
      });
    }

    // Validate dates - allow same day for day trips
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return res.status(400).json({
        success: false,
        error: 'End date cannot be before start date'
      });
    }

    // Generate trip plan
    const tripPlan = await generateTripPlan({
      source,
      destination,
      startDate,
      endDate,
      travelers,
      noStay,
      budget,
      tripType,
      isReturnTrip,
      stayNights,           // Pass to trip generator
      transportation,
      flightClasses,
      trainClasses,
      starRating,           // Pass to trip generator
      includeActivities,    // Pass to trip generator
      accommodations,       // Pass to trip generator
      preferences
    });

    // Save trip to MongoDB only if user is authenticated
    let mongoId = null;
    if (req.userId) {
      try {
        const trip = new Trip({
          userId: req.userId,
          source: tripPlan.source,
          destination: tripPlan.destination,
          startDate: start,
          endDate: end,
          nights: tripPlan.nights,
          travelers,
          tripType,
          noStay,
          budget: {
            amount: budget,
            currency: 'INR',
            flexibility: preferences.budgetFlexibility || 'moderate'
          },
          preferences: {
            accommodations: preferences.accommodations || [],
            starRating: preferences.starRating,
            roomType: preferences.roomType,
            transportation,
            flightClass: flightClasses.join(','),
            trainClass: trainClasses.join(','),
            priority: preferences.priority,
            travelStyle: preferences.travelStyle,
            interests: preferences.interests || [],
            specialRequirements: preferences.specialRequirements
          },
          plans: tripPlan.plans,
          itinerary: tripPlan.itinerary
        });

        await trip.save();

        // Add trip to user's savedTrips
        await User.findByIdAndUpdate(req.userId, {
          $push: { savedTrips: trip._id }
        });

        mongoId = trip._id.toString();
      } catch (dbError) {
        console.error('Error saving trip to database:', dbError);
        // Continue without saving - don't fail the request
      }
    }

    // Store in memory for quick retrieval
    trips.set(tripPlan.id, { ...tripPlan, mongoId });

    res.json({
      success: true,
      data: { ...tripPlan, mongoId, savedToAccount: !!mongoId }
    });
  } catch (error) {
    console.error('Error generating trip plan:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error while generating trip plan'
    });
  }
});

/**
 * @route   POST /api/trips/save
 * @desc    Save a selected trip plan to user's account
 * @access  Private (requires authentication)
 */
router.post('/save', authMiddleware, async (req, res) => {
  try {
    const { plan, tripDetails, formData } = req.body;

    if (!plan) {
      return res.status(400).json({
        success: false,
        error: 'Plan data is required'
      });
    }

    // Extract source/destination info properly
    const sourceCode = formData?.origin || formData?.source || 'UNK';
    const destCode = formData?.destination || 'UNK';
    const sourceCity = getCityByCode(sourceCode);
    const destCity = getCityByCode(destCode);

    // Create trip document matching the Trip schema
    const trip = new Trip({
      userId: req.userId,
      source: {
        code: sourceCity?.code || sourceCode,
        name: sourceCity?.name || sourceCode,
        state: sourceCity?.state || ''
      },
      destination: {
        code: destCity?.code || destCode,
        name: destCity?.name || destCode,
        state: destCity?.state || ''
      },
      startDate: new Date(formData?.departureDate || new Date()),
      endDate: new Date(formData?.returnDate || new Date()),
      nights: tripDetails?.nights || 1,
      travelers: formData?.travelers || 1,
      tripType: formData?.tripType || 'tour',
      noStay: formData?.noStay || false,
      budget: {
        amount: formData?.budget || plan.price || 0,
        currency: 'INR',
        flexibility: formData?.budgetFlexibility || 'moderate'
      },
      preferences: {
        transportation: formData?.transportation || [],
        starRating: formData?.starRating || 3,
        flightClass: formData?.flightClasses?.[0] || 'economy',
        trainClass: formData?.trainClasses?.[0] || 'SL'
      },
      plans: [{
        tier: plan.name || plan.tier || 'Comfort',
        description: plan.badge || 'Saved Plan',
        transport: plan.flight || {},
        hotel: plan.hotel || {},
        costs: {
          transport: plan.breakdown?.transport || 0,
          accommodation: plan.breakdown?.accommodation || 0,
          activities: plan.breakdown?.activities || 0,
          meals: plan.breakdown?.meals || 0,
          miscellaneous: plan.breakdown?.misc || 0,
          total: plan.price || 0
        },
        highlights: plan.highlights || []
      }],
      booking: {
        status: 'draft',
        selectedPlan: plan.name || plan.tier || 'Comfort',
        totalAmount: plan.price || 0
      }
    });

    await trip.save();

    // Add to user's savedTrips
    await User.findByIdAndUpdate(req.userId, {
      $push: { savedTrips: trip._id }
    });

    console.log(`✅ Trip saved for user ${req.userId}: ${trip._id}`);

    res.json({
      success: true,
      message: 'Trip saved successfully!',
      data: {
        tripId: trip._id.toString(),
        source: trip.source.name,
        destination: trip.destination.name,
        startDate: trip.startDate,
        totalCost: trip.plans[0]?.costs?.total || 0
      }
    });
  } catch (error) {
    console.error('Error saving trip:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error while saving trip'
    });
  }
});

/**
 * @route   GET /api/trips/:tripId
 * @desc    Get trip details by ID
 * @access  Public
 */
router.get('/:tripId', (req, res) => {
  try {
    const trip = trips.get(req.params.tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found'
      });
    }

    res.json({
      success: true,
      data: trip
    });
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching trip'
    });
  }
});

/**
 * @route   POST /api/trips/:tripId/book
 * @desc    Book a trip plan
 * @access  Public (would be Private in production)
 */
router.post('/:tripId/book', (req, res) => {
  try {
    const { planTier, paymentMethod, contactInfo } = req.body;
    const trip = trips.get(req.params.tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found'
      });
    }

    if (!planTier || !contactInfo) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: planTier, contactInfo'
      });
    }

    const selectedPlan = trip.plans.find(p => p.tier === planTier);
    if (!selectedPlan) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan tier'
      });
    }

    // Create booking
    const booking = {
      id: `BK${Date.now()}`,
      tripId: trip.id,
      plan: selectedPlan,
      destination: trip.destination?.name || trip.destination || 'Unknown',
      dates: {
        start: trip.startDate,
        end: trip.endDate,
        nights: trip.nights
      },
      travelers: trip.travelers,
      contactInfo,
      paymentMethod: paymentMethod || 'pending',
      totalAmount: selectedPlan.costs.total,
      status: 'confirmed',
      bookedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Booking confirmed!',
      data: booking
    });
  } catch (error) {
    console.error('Error booking trip:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while booking trip'
    });
  }
});

/**
 * @route   GET /api/trips/suggestions/popular
 * @desc    Get popular trip suggestions
 * @access  Public
 */
router.get('/suggestions/popular', (req, res) => {
  try {
    const popularTrips = [
      {
        id: 'pop-1',
        title: 'Golden Triangle Tour',
        destinations: ['Delhi', 'Agra', 'Jaipur'],
        duration: '5-7 days',
        startingPrice: 25000,
        bestTime: 'October - March',
        image: '/images/golden-triangle.jpg'
      },
      {
        id: 'pop-2',
        title: 'Goa Beach Holiday',
        destinations: ['Goa'],
        duration: '4-5 days',
        startingPrice: 15000,
        bestTime: 'November - February',
        image: '/images/goa.jpg'
      },
      {
        id: 'pop-3',
        title: 'Kerala Backwaters',
        destinations: ['Kochi', 'Munnar', 'Alleppey'],
        duration: '6-8 days',
        startingPrice: 30000,
        bestTime: 'September - March',
        image: '/images/kerala.jpg'
      },
      {
        id: 'pop-4',
        title: 'Ladakh Adventure',
        destinations: ['Leh', 'Nubra Valley', 'Pangong Lake'],
        duration: '7-10 days',
        startingPrice: 40000,
        bestTime: 'May - September',
        image: '/images/ladakh.jpg'
      },
      {
        id: 'pop-5',
        title: 'Varanasi Spiritual Journey',
        destinations: ['Varanasi', 'Sarnath'],
        duration: '3-4 days',
        startingPrice: 12000,
        bestTime: 'October - March',
        image: '/images/varanasi.jpg'
      }
    ];

    res.json({
      success: true,
      count: popularTrips.length,
      data: popularTrips
    });
  } catch (error) {
    console.error('Error fetching popular trips:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching popular trips'
    });
  }
});

module.exports = router;
