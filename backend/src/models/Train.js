const mongoose = require('mongoose');

/**
 * Train Schema for MongoDB
 * Stores train data from EXP-TRAINS.json with indexed fields for fast querying
 */
const trainStopSchema = new mongoose.Schema({
    sno: String,
    stationName: String,
    stationCode: String,  // Extracted from stationName for indexing
    arrives: String,
    departs: String,
    distance: String,
    day: String
}, { _id: false });

const trainSchema = new mongoose.Schema({
    trainNumber: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    trainName: {
        type: String,
        required: true,
        index: true
    },
    route: String,  // e.g., "MUMBAI to DELHI"
    trainType: {
        type: String,
        enum: ['RAJ', 'SHA', 'VAN', 'DUR', 'GAR', 'SF', 'EXP', 'SPL', 'PASS'],
        default: 'EXP'
    },
    runningDays: {
        SUN: { type: Boolean, default: false },
        MON: { type: Boolean, default: false },
        TUE: { type: Boolean, default: false },
        WED: { type: Boolean, default: false },
        THU: { type: Boolean, default: false },
        FRI: { type: Boolean, default: false },
        SAT: { type: Boolean, default: false }
    },
    trainRoute: [trainStopSchema],
    // Indexed fields for fast searching
    stationCodes: [{
        type: String,
        index: true
    }],
    stationNames: [{
        type: String,
        index: true
    }],
    // Computed fields
    sourceStation: String,
    destinationStation: String,
    totalDistance: Number,
    totalStops: Number,
    // Metadata
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound indexes for common queries
trainSchema.index({ stationCodes: 1, 'runningDays.MON': 1 });
trainSchema.index({ stationCodes: 1, 'runningDays.TUE': 1 });
trainSchema.index({ stationCodes: 1, 'runningDays.WED': 1 });
trainSchema.index({ stationCodes: 1, 'runningDays.THU': 1 });
trainSchema.index({ stationCodes: 1, 'runningDays.FRI': 1 });
trainSchema.index({ stationCodes: 1, 'runningDays.SAT': 1 });
trainSchema.index({ stationCodes: 1, 'runningDays.SUN': 1 });

// Text index for station name search
trainSchema.index({ stationNames: 'text', trainName: 'text' });

// Pre-save hook to extract station codes and names
trainSchema.pre('save', function (next) {
    if (this.trainRoute && this.trainRoute.length > 0) {
        // Extract station codes and names for indexing
        this.stationCodes = this.trainRoute.map(stop => {
            const parts = stop.stationName?.split(' - ');
            return parts && parts.length > 1 ? parts[1].trim() : stop.stationName;
        }).filter(Boolean);

        this.stationNames = this.trainRoute.map(stop => {
            const parts = stop.stationName?.split(' - ');
            return parts ? parts[0].trim().toUpperCase() : '';
        }).filter(Boolean);

        // Set source and destination
        this.sourceStation = this.trainRoute[0].stationName;
        this.destinationStation = this.trainRoute[this.trainRoute.length - 1].stationName;

        // Calculate total distance
        const lastStop = this.trainRoute[this.trainRoute.length - 1];
        this.totalDistance = parseInt(lastStop.distance) || 0;
        this.totalStops = this.trainRoute.length;
    }

    this.updatedAt = new Date();
    next();
});

// Static method to search trains between cities
trainSchema.statics.searchBetweenCities = async function (fromKeywords, toKeywords, dayOfWeek) {
    const dayField = `runningDays.${dayOfWeek}`;

    // Build query to find trains that have both source and destination stations
    const query = {
        [dayField]: true,
        $or: fromKeywords.map(keyword => ({
            stationNames: { $regex: keyword, $options: 'i' }
        }))
    };

    const trains = await this.find(query).lean();

    // Filter to ensure proper order (from before to)
    return trains.filter(train => {
        let fromIdx = -1;
        let toIdx = -1;

        for (let i = 0; i < train.trainRoute.length; i++) {
            const stationName = train.trainRoute[i].stationName?.toUpperCase() || '';

            if (fromIdx === -1) {
                for (const keyword of fromKeywords) {
                    if (stationName.includes(keyword.toUpperCase())) {
                        fromIdx = i;
                        break;
                    }
                }
            }

            if (fromIdx !== -1 && toIdx === -1) {
                for (const keyword of toKeywords) {
                    if (stationName.includes(keyword.toUpperCase())) {
                        toIdx = i;
                        break;
                    }
                }
            }
        }

        return fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx;
    });
};

const Train = mongoose.model('Train', trainSchema);

module.exports = Train;
