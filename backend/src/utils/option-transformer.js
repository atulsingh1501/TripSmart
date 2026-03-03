/**
 * Option Transformer Utility
 * 
 * Converts existing data structures (flights, trains, hotels) into the 
 * standardized TripOption format required by TripAlgorithmService.
 * 
 * CATEGORIES:
 *   - transport: INTER-CITY ONLY (Flights, Trains, Buses, Car Rentals)
 *   - accommodation: Hotels, Hostels, etc.
 *   - meal: Food budget tiers
 *   - activity: Attractions + LOCAL TRANSPORT (Autos, Bikes, Cabs)
 *              Local transport costs are calculated in the algorithm, not here.
 * 
 * Each transformer assigns priorities based on:
 *   - User's explicit preferences (if provided)
 *   - Quality/class hierarchy (1AC > 2AC > 3AC)
 *   - Price (more expensive = higher priority for luxury seekers)
 */

const TRIP_CONFIG = require('../config/trip.config');

/**
 * Transport Mode Priority (when user hasn't specified preference)
 * Lower number = higher priority
 */
const DEFAULT_TRANSPORT_PRIORITY = {
    'flight': 1,
    'train': 2,
    'bus': 3,
    'car-rental': 4
};

/**
 * Train Class Priority (1AC is highest quality)
 * Priority order: 1st AC, 2nd AC, 3rd AC, AC Chair Car, Sleeper, Second Sitting
 */
const TRAIN_CLASS_PRIORITY = {
    '1A': 1,   // 1st AC (Highest priority)
    '2A': 2,   // 2nd AC
    '3A': 3,   // 3rd AC
    'CC': 4,   // AC Chair Car
    'SL': 5,   // Sleeper
    '2S': 6    // Second Sitting (Lowest priority)
};

/**
 * Transform flight search results into TripOption format
 * @param {Array} flights - Raw flight results from searchFlights
 * @param {Array} userPreferences - User's preferred classes ['business', 'economy']
 * @param {number} travelers - Number of travelers
 * @param {boolean} isRoundTrip - Whether this is a round trip
 * @returns {TripOption[]} - Sorted by priority
 */
function transformFlights(flights, userPreferences = [], travelers = 1, isRoundTrip = true) {
    if (!flights || flights.length === 0) {
        console.log('⚠️  transformFlights: No flights provided');
        return [];
    }

    console.log(`\n✈️  Transforming ${flights.length} flights...`);

    const transformed = flights.map((flight, idx) => {
        // Extract price with multiple fallback options
        const price = flight.prices?.economy?.total || 
                     flight.prices?.economy?.base ||
                     flight.price || 
                     5000;
        const totalCost = price * travelers * (isRoundTrip ? 2 : 1);

        // Extract airline name - handle both object and string formats
        const airlineName = typeof flight.airline === 'object'
            ? flight.airline?.name
            : flight.airline;

        // Extract departure time - handle both object and string formats
        const departureTime = typeof flight.departure === 'object'
            ? flight.departure?.time
            : flight.departure;

        // Extract arrival time - handle both object and string formats
        const arrivalTime = typeof flight.arrival === 'object'
            ? flight.arrival?.time
            : flight.arrival;

        const flightOption = {
            id: flight.id || flight.flightNumber || `flight-${idx}`,
            type: 'flight',
            mode: 'flight',
            name: `${airlineName || 'Flight'} ${flight.flightNumber || ''}`.trim(),
            class: 'economy',
            price: price,
            totalCost: totalCost,
            priority: DEFAULT_TRANSPORT_PRIORITY['flight'],
            category: 'transport',
            rating: flight.rating || 4,
            details: {
                airline: airlineName,  // Store as string, not object
                flightNumber: flight.flightNumber,
                departure: departureTime,
                arrival: arrivalTime,
                duration: flight.duration,
                stops: flight.stops || 0
            }
        };

        if (idx === 0) {
            console.log(`   Sample flight option:`, JSON.stringify(flightOption, null, 2).substring(0, 300));
        }

        return flightOption;
    });

    // Sort by price (cheapest first for same priority)
    const sorted = transformed.sort((a, b) => a.totalCost - b.totalCost);
    console.log(`   ✅ Transformed ${sorted.length} flights successfully`);
    return sorted;
}

/**
 * Transform train search results into TripOption format
 * @param {Array} trains - Raw train results from searchTrains
 * @param {Array} userClasses - User's preferred classes ['2A', '3A', 'SL']
 * @param {number} travelers - Number of travelers
 * @param {boolean} isRoundTrip - Whether this is a round trip
 * @returns {TripOption[]} - Sorted by priority then price
 */
function transformTrains(trains, userClasses = [], travelers = 1, isRoundTrip = true) {
    if (!trains || trains.length === 0) return [];

    const transformed = trains.map((train, idx) => {
        const fare = train.fare?.total || train.price || 1500;
        const totalCost = fare * travelers * (isRoundTrip ? 2 : 1);
        const trainClass = train.class || '3A';

        // Priority based on user preference or class hierarchy
        let priority;
        if (userClasses.length > 0) {
            const prefIndex = userClasses.indexOf(trainClass);
            priority = prefIndex >= 0 ? prefIndex + 1 : userClasses.length + (TRAIN_CLASS_PRIORITY[trainClass] || 999);
        } else {
            priority = TRAIN_CLASS_PRIORITY[trainClass] || 3;
        }

        return {
            id: train.id || `train-${idx}`,
            type: 'train',
            mode: 'train',
            name: `${train.trainName || train.name || 'Train'} (${trainClass})`,
            class: trainClass,
            price: fare,
            totalCost: totalCost,
            priority: priority,
            category: 'transport',
            rating: train.rating || 4,
            details: {
                trainNumber: train.trainNumber,
                departure: train.departure,
                arrival: train.arrival,
                duration: train.duration,
                trainType: train.trainType
            }
        };
    });

    // Sort by priority first, then by price within same priority
    return transformed.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.totalCost - b.totalCost;
    });
}

/**
 * Transform hotel search results into TripOption format
 * 
 * PRIORITY LOGIC (user requested change):
 * - 5★ hotels are ALWAYS highest priority
 * - 4★ hotels are next
 * - 3★ hotels are next (if >= user's minimum)
 * - Hotels BELOW user's minimum rating are EXCLUDED
 * 
 * Example: If user selects 3★ minimum, we show 5★ → 4★ → 3★ (excludes 1-2★)
 * 
 * @param {Array} hotels - Raw hotel results from searchHotels
 * @param {number} preferredStars - User's MINIMUM acceptable star rating
 * @returns {TripOption[]} - Sorted by stars (desc) then price
 */
function transformHotels(hotels, preferredStars = 3) {
    if (!hotels || hotels.length === 0) {
        console.log(`⚠️  transformHotels: No hotels provided`);
        return [];
    }

    console.log(`\n🏨 Transforming ${hotels.length} hotels (preferred stars: ${preferredStars})...`);

    // User's minimum acceptable star rating
    const minStars = Array.isArray(preferredStars)
        ? Math.min(...preferredStars)
        : preferredStars;

    console.log(`   Minimum acceptable stars: ${minStars}`);

    // Filter out hotels below minimum rating and transform
    const transformed = hotels
        .filter(hotel => {
            const stars = hotel.stars || 3;
            const passes = stars >= minStars;
            if (!passes && hotels.indexOf(hotel) < 3) {
                console.log(`   ❌ Filtering out: ${hotel.name} (${stars}★ < ${minStars}★)`);
            }
            return passes; // Exclude hotels below minimum
        })
        .map((hotel, idx) => {
            const pricePerNight = hotel.rooms?.[0]?.pricePerNight || hotel.pricePerNight || 1500;
            const stars = hotel.stars || 3;

            // Priority: 5★ = 1 (highest), 4★ = 2, 3★ = 3, etc.
            // Lower number = higher priority in algorithm
            const priority = (6 - stars); // 5★ → 1, 4★ → 2, 3★ → 3, 2★ → 4, 1★ → 5

            return {
                id: hotel.id || `hotel-${idx}`,
                type: 'hotel',
                name: hotel.name || 'Hotel',
                stars: stars,
                price: pricePerNight,
                pricePerNight: pricePerNight,
                priority: priority,
                category: 'accommodation',
                rating: hotel.rating || stars,
                details: {
                    location: hotel.location,
                    amenities: hotel.amenities,
                    roomType: hotel.rooms?.[0]?.name || 'Standard'
                }
            };
        });

    // Sort by priority (5★ first), then by price within same star rating
    const sorted = transformed.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.price - b.price; // Cheapest first within same star rating
    });

    console.log(`   ✅ Transformed ${sorted.length} hotels (filtered out ${hotels.length - sorted.length})`);
    if (sorted.length > 0) {
        console.log(`   Sample: ${sorted[0].name} - ${sorted[0].stars}★ - ₹${sorted[0].price}/night`);
    }

    return sorted;
}

/**
 * Generate meal options from TRIP_CONFIG
 * @param {string} preferredTier - User's preferred tier ('BUDGET', 'MEDIUM', 'EXPENSIVE')
 * @returns {TripOption[]} - Meal options sorted by priority
 */
function generateMealOptions(preferredTier = 'MEDIUM') {
    const tiers = ['EXPENSIVE', 'MEDIUM', 'BUDGET'];
    const mealCosts = TRIP_CONFIG.MEAL_COSTS || {
        EXPENSIVE: { min: 400, max: 800 },
        MEDIUM: { min: 200, max: 400 },
        BUDGET: { min: 100, max: 200 }
    };

    return tiers.map((tier, idx) => {
        const costs = mealCosts[tier];
        const avgPrice = costs ? (costs.min + costs.max) / 2 : 150;

        // Priority based on user preference
        let priority;
        if (tier === preferredTier) {
            priority = 1;
        } else {
            priority = idx + 2;
        }

        return {
            id: `meal-${tier.toLowerCase()}`,
            type: tier.toLowerCase(),
            name: `${tier.charAt(0)}${tier.slice(1).toLowerCase()} Dining`,
            price: avgPrice,
            priority: priority,
            category: 'meal',
            rating: tier === 'EXPENSIVE' ? 5 : tier === 'MEDIUM' ? 3.5 : 2.5,
            details: {
                tier: tier,
                priceRange: `₹${costs?.min || 100} - ₹${costs?.max || 200}/meal`
            }
        };
    }).sort((a, b) => a.priority - b.priority);
}

/**
 * Generate activity options from city attractions
 * @param {Array} attractions - City attractions array
 * @param {string} preferredTier - 'premium', 'standard', 'budget'
 * @returns {TripOption[]} - Activity options sorted by priority
 */
function generateActivityOptions(attractions = [], preferredTier = 'standard') {
    // If no attractions, generate default tiers
    if (!attractions || attractions.length === 0) {
        return [
            {
                id: 'activity-premium',
                type: 'premium',
                name: 'Premium Experiences',
                price: 500,
                priority: preferredTier === 'premium' ? 1 : 2,
                category: 'activity',
                rating: 5,
                details: { description: 'Private tours, exclusive experiences' }
            },
            {
                id: 'activity-standard',
                type: 'standard',
                name: 'Standard Sightseeing',
                price: 200,
                priority: preferredTier === 'standard' ? 1 : 2,
                category: 'activity',
                rating: 4,
                details: { description: 'Popular attractions, guided tours' }
            },
            {
                id: 'activity-budget',
                type: 'budget',
                name: 'Budget Exploration',
                price: 50,
                priority: preferredTier === 'budget' ? 1 : 3,
                category: 'activity',
                rating: 3,
                details: { description: 'Free attractions, self-guided walks' }
            }
        ].sort((a, b) => a.priority - b.priority);
    }

    // Transform attractions into options
    const transformed = attractions.slice(0, 10).map((attraction, idx) => {
        const price = attraction.entryFee || attraction.price || 100;

        return {
            id: attraction.id || `activity-${idx}`,
            type: 'attraction',
            name: attraction.name,
            price: price,
            priority: idx + 1, // First attractions are typically most popular
            category: 'activity',
            rating: attraction.rating || 4,
            details: {
                type: attraction.type,
                duration: attraction.duration,
                description: attraction.description
            }
        };
    });

    return transformed;
}

/**
 * Combine all transport options (flights + trains) into single priority-sorted list
 * @param {Array} flights - Transformed flight options
 * @param {Array} trains - Transformed train options
 * @param {Array} userTransportPrefs - User's transport mode preferences ['trains', 'flights']
 * @returns {TripOption[]} - Combined and priority-sorted transport options
 */
function combineTransportOptions(flights = [], trains = [], userTransportPrefs = []) {
    let allOptions = [...flights, ...trains];

    console.log(`\n🔗 Combining Transport Options:`);
    console.log(`   Flights: ${flights.length}, Trains: ${trains.length}`);
    console.log(`   User preferences: [${userTransportPrefs.join(', ')}]`);

    // Debug: Log first flight and train if available
    if (flights.length > 0) {
        const f = flights[0];
        console.log(`   First flight: mode="${f.mode}", type="${f.type}", name="${f.name}", price=${f.price}, totalCost=${f.totalCost}`);
    }
    if (trains.length > 0) {
        const t = trains[0];
        console.log(`   First train: mode="${t.mode}", type="${t.type}", name="${t.name}", price=${t.price}, totalCost=${t.totalCost}`);
    }

    // ✅ Filter out options with invalid prices (0 or undefined)
    const beforePriceFilter = allOptions.length;
    allOptions = allOptions.filter(opt => {
        const valid = opt.totalCost > 0 || opt.price > 0;
        if (!valid) {
            console.log(`   ❌ Filtering out ${opt.mode} "${opt.name}" - invalid price (totalCost=${opt.totalCost}, price=${opt.price})`);
        }
        return valid;
    });
    console.log(`   After price filter: ${allOptions.length} options (removed ${beforePriceFilter - allOptions.length})`);

    // ✅ If user selected specific transport modes, ONLY include those modes
    if (userTransportPrefs.length > 0) {
        const beforeFilter = allOptions.length;
        // Filter to only include user's selected transport modes
        allOptions = allOptions.filter(opt => {
            const modeWithS = opt.mode + 's'; // 'train' -> 'trains', 'flight' -> 'flights'
            const included = userTransportPrefs.includes(modeWithS) || userTransportPrefs.includes(opt.mode);
            if (!included) {
                console.log(`   ❌ Excluding ${opt.mode} option: ${opt.name} (mode="${opt.mode}", modeWithS="${modeWithS}", prefs=[${userTransportPrefs.join(',')}])`);
            }
            return included;
        });
        console.log(`   After user preference filter: ${allOptions.length} options (filtered out ${beforeFilter - allOptions.length})`);

        // Re-assign priorities based on user's mode preference order
        allOptions.forEach(opt => {
            const modeWithS = opt.mode + 's';
            const modeIndex = userTransportPrefs.indexOf(modeWithS);
            if (modeIndex >= 0) {
                opt.priority = modeIndex * 100 + opt.priority;
            }
        });
    }

    // Sort by priority (lower = better)
    const sorted = allOptions.sort((a, b) => a.priority - b.priority);
    
    if (sorted.length > 0) {
        console.log(`   Final transport options (sorted by priority):`);
        sorted.slice(0, 3).forEach((opt, idx) => {
            console.log(`      ${idx + 1}. ${opt.mode} - ${opt.name} (₹${opt.totalCost}, priority: ${opt.priority})`);
        });
    }
    
    return sorted;
}

module.exports = {
    transformFlights,
    transformTrains,
    transformHotels,
    generateMealOptions,
    generateActivityOptions,
    combineTransportOptions,
    TRAIN_CLASS_PRIORITY,
    DEFAULT_TRANSPORT_PRIORITY
};
