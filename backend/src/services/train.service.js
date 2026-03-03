/**
 * Train Service - MongoDB Version
 * 
 * Provides train search functionality using MongoDB instead of JSON file.
 * Falls back to JSON file if MongoDB is not available.
 */

const mongoose = require('mongoose');
const Train = require('../models/Train');

// City name mappings for search
const CITY_NAME_MAPPINGS = {
    'DEL': ['DELHI', 'NEW DELHI', 'NDLS', 'HAZRAT', 'NIZAMUDDIN'],
    'BOM': ['MUMBAI', 'BOMBAY', 'CSTM', 'LTT', 'BCT', 'BANDRA', 'DADAR', 'LOKMANYA'],
    'BLR': ['BANGALORE', 'BENGALURU', 'SBC', 'YPR', 'YESVANTPUR'],
    'MAA': ['CHENNAI', 'MADRAS', 'MGR', 'CENTRAL'],
    'CCU': ['KOLKATA', 'CALCUTTA', 'HOWRAH', 'HWH', 'SDAH', 'SEALDAH'],
    'HYD': ['HYDERABAD', 'SECUNDERABAD', 'NAMPALLY'],
    'JAI': ['JAIPUR', 'JP'],
    'AGR': ['AGRA', 'CANTT'],
    'GOI': ['GOA', 'MADGAON', 'MARGAO', 'VASCO', 'THIVIM'],
    'VNS': ['VARANASI', 'BANARAS', 'BSB'],
    'COK': ['KOCHI', 'COCHIN', 'ERNAKULAM', 'ERS'],
    'ATR': ['AMRITSAR', 'ASR'],
    'PNE': ['PUNE', 'POONA'],
    'LKO': ['LUCKNOW', 'CHARBAGH'],
    'PAT': ['PATNA', 'PNBE'],
    'AHM': ['AHMEDABAD', 'ADI'],
    'NGP': ['NAGPUR', 'NGP'],
    'BPL': ['BHOPAL', 'BPL'],
    'IDR': ['INDORE', 'INDB'],
    'JPR': ['JODHPUR', 'JU'],
    'UDR': ['UDAIPUR', 'UDZ'],
    'JMU': ['JAMMU', 'JAT'],
    'GUW': ['GUWAHATI', 'GHY'],
    'RNC': ['RANCHI', 'RNC'],
    'TVC': ['TRIVANDRUM', 'THIRUVANANTHAPURAM', 'TVC'],
    'MYS': ['MYSORE', 'MYSURU', 'MYS']
};

// Train class prices
const TRAIN_CLASS_PRICES = {
    '1A': { multiplier: 4.5, name: 'First Class AC' },
    '2A': { multiplier: 2.8, name: 'AC 2-Tier' },
    '3A': { multiplier: 1.8, name: 'AC 3-Tier' },
    '3E': { multiplier: 1.5, name: 'AC 3-Tier Economy' },
    'CC': { multiplier: 1.3, name: 'AC Chair Car' },
    'EC': { multiplier: 2.2, name: 'Executive Chair' },
    'SL': { multiplier: 0.5, name: 'Sleeper Class' },
    '2S': { multiplier: 0.3, name: 'Second Sitting' },
    'GN': { multiplier: 0.2, name: 'General' }
};

/**
 * Calculate fare based on distance and class
 */
function calculateFare(baseFare, travelClass, isPremium = false) {
    const classInfo = TRAIN_CLASS_PRICES[travelClass] || TRAIN_CLASS_PRICES['3A'];
    let fare = baseFare * classInfo.multiplier;

    if (isPremium) {
        fare *= 1.3; // Premium train surcharge
    }

    // Add standard charges
    const reservationCharge = 40;
    const superfastCharge = isPremium ? 75 : 30;
    const gst = Math.round(fare * 0.05);

    return {
        baseFare: Math.round(fare),
        reservationCharge,
        superfastCharge,
        gst,
        total: Math.round(fare + reservationCharge + superfastCharge + gst)
    };
}

/**
 * Parse time string to minutes from midnight
 */
function parseTimeToMinutes(timeStr) {
    if (!timeStr || timeStr === 'Source' || timeStr === 'Destination') return null;
    const parts = timeStr.split(':');
    if (parts.length !== 2) return null;
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

/**
 * Calculate journey duration
 */
function calculateDuration(departMinutes, arriveMinutes, departDay, arriveDay) {
    if (departMinutes === null || arriveMinutes === null) return null;

    const dayDiff = (parseInt(arriveDay) || 1) - (parseInt(departDay) || 1);
    let totalMinutes = arriveMinutes - departMinutes + (dayDiff * 24 * 60);

    if (totalMinutes < 0) totalMinutes += 24 * 60;

    return {
        hours: Math.floor(totalMinutes / 60),
        minutes: totalMinutes % 60,
        totalMinutes
    };
}

/**
 * Search trains using MongoDB
 */
async function searchTrainsMongoDB(params) {
    const { from, to, date, travelClass = '3A' } = params;

    console.log(`\n🚂 [MongoDB] Searching trains: ${from} → ${to} on ${date}`);

    // Get search keywords
    const fromKeywords = (CITY_NAME_MAPPINGS[from] || [from]).map(k => k.toUpperCase());
    const toKeywords = (CITY_NAME_MAPPINGS[to] || [to]).map(k => k.toUpperCase());

    // Get day of week
    const travelDate = new Date(date);
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const travelDayName = dayNames[travelDate.getDay()];

    console.log(`   Day: ${travelDayName}, From keywords: ${fromKeywords.slice(0, 3).join(', ')}`);

    // Build MongoDB query - search directly in trainRoute.stationName
    // since stationNames array may not be populated (if imported via Atlas)
    const dayField = `runningDays.${travelDayName}`;

    // Create OR conditions for each keyword to match in trainRoute.stationName
    const fromRegexPattern = fromKeywords.join('|');

    const trains = await Train.find({
        [dayField]: true,
        'trainRoute.stationName': { $regex: fromRegexPattern, $options: 'i' }
    }).limit(200).lean();

    console.log(`   Found ${trains.length} trains stopping at origin`);

    // Filter to find trains where origin comes before destination
    const matchingTrains = [];

    for (const train of trains) {
        let fromStation = null;
        let fromIdx = -1;
        let toStation = null;
        let toIdx = -1;

        for (let i = 0; i < train.trainRoute.length; i++) {
            const stationName = (train.trainRoute[i].stationName || '').toUpperCase();

            // Check for origin
            if (fromIdx === -1) {
                for (const keyword of fromKeywords) {
                    if (stationName.includes(keyword)) {
                        fromStation = train.trainRoute[i];
                        fromIdx = i;
                        break;
                    }
                }
            }

            // Check for destination (after origin)
            if (fromIdx !== -1 && toIdx === -1) {
                for (const keyword of toKeywords) {
                    if (stationName.includes(keyword)) {
                        toStation = train.trainRoute[i];
                        toIdx = i;
                        break;
                    }
                }
            }
        }

        if (fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx) {
            // Calculate journey details
            const departTime = fromStation.departs === 'Source' ? '09:00' : fromStation.departs;
            const arriveTime = toStation.arrives === 'Destination' ? '18:00' : toStation.arrives;

            const departMinutes = parseTimeToMinutes(departTime);
            const arriveMinutes = parseTimeToMinutes(arriveTime);
            const duration = calculateDuration(departMinutes, arriveMinutes, fromStation.day, toStation.day);

            // Calculate distance and fare
            const fromDist = parseInt(fromStation.distance) || 0;
            const toDist = parseInt(toStation.distance) || 0;
            const distance = Math.abs(toDist - fromDist);
            const baseFare = Math.round(distance * 0.5) + 100;

            const isPremium = ['RAJ', 'SHA', 'VAN', 'DUR'].includes(train.trainType);
            const fare = calculateFare(baseFare, travelClass, isPremium);

            // Determine available classes
            let availableClasses = ['3A', 'SL', '2S'];
            if (isPremium) {
                availableClasses = ['1A', '2A', '3A', 'CC'];
            }

            matchingTrains.push({
                trainNumber: train.trainNumber,
                trainName: train.trainName,
                trainType: train.trainType,
                from: {
                    code: fromStation.stationCode || fromStation.stationName.split(' - ')[1] || '',
                    name: fromStation.stationName.split(' - ')[0],
                    city: from
                },
                to: {
                    code: toStation.stationCode || toStation.stationName.split(' - ')[1] || '',
                    name: toStation.stationName.split(' - ')[0],
                    city: to
                },
                departure: departTime,
                arrival: arriveTime,
                duration: duration || { hours: 8, minutes: 0, totalMinutes: 480 },
                distance,
                date,
                class: travelClass,
                availability: {
                    status: Math.random() < 0.6 ? 'AVAILABLE' : 'RAC',
                    count: Math.floor(Math.random() * 50) + 1
                },
                fare,
                runningDays: train.runningDays,
                classes: availableClasses,
                amenities: isPremium ? ['AC', 'Meals', 'Bedding'] : ['AC/Non-AC Available']
            });
        }
    }

    console.log(`   Matched ${matchingTrains.length} trains with correct route`);

    return {
        trains: matchingTrains.slice(0, 20),
        totalFound: matchingTrains.length,
        searchParams: { from, to, date, class: travelClass },
        source: 'mongodb'
    };
}

/**
 * Check if MongoDB is connected and has train data
 */
async function isMongoDBAvailable() {
    try {
        if (mongoose.connection.readyState !== 1) {
            return false;
        }
        const count = await Train.countDocuments();
        return count > 0;
    } catch {
        return false;
    }
}

/**
 * Main search function - tries MongoDB first, falls back to JSON
 */
async function searchTrains(params) {
    const mongoAvailable = await isMongoDBAvailable();

    if (mongoAvailable) {
        const mongoResults = await searchTrainsMongoDB(params);

        // If MongoDB returns no results, fall back to JSON
        if (mongoResults.trains.length === 0) {
            console.log(`⚠️  MongoDB returned 0 trains for ${params.from} → ${params.to}, trying JSON fallback`);
            try {
                const { searchTrains: searchTrainsJSON } = require('../data/trains');
                const jsonResults = await searchTrainsJSON(params);
                console.log(`✅ JSON fallback found ${jsonResults.trains?.length || 0} trains`);
                return jsonResults;
            } catch (error) {
                console.log(`❌ JSON fallback failed: ${error.message}`);
                return mongoResults; // Return empty MongoDB results
            }
        }

        return mongoResults;
    } else {
        console.log('⚠️  MongoDB not available, using JSON fallback');
        // Import and use the old JSON-based search
        const { searchTrains: searchTrainsJSON } = require('../data/trains');
        return searchTrainsJSON(params);
    }
}

/**
 * Get train by number from MongoDB
 */
async function getTrainByNumber(trainNumber) {
    return Train.findOne({ trainNumber }).lean();
}

/**
 * Get train count
 */
async function getTrainCount() {
    return Train.countDocuments();
}

module.exports = {
    searchTrains,
    searchTrainsMongoDB,
    getTrainByNumber,
    getTrainCount,
    isMongoDBAvailable,
    CITY_NAME_MAPPINGS,
    TRAIN_CLASS_PRICES
};
