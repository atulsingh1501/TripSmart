/**
 * TripSmart Configuration Constants
 * Budget allocation percentages, costs, and scoring weights
 */

const TRIP_CONFIG = {
    // Budget allocation percentages by trip type and duration
    BUDGET_ALLOCATION: {
        TOUR: {
            SHORT: { transport: 0.45, accommodation: 0.30, food: 0.15, activities: 0.10 },  // ≤3 days
            MEDIUM: { transport: 0.35, accommodation: 0.35, food: 0.18, activities: 0.12 }, // 4-7 days
            LONG: { transport: 0.25, accommodation: 0.40, food: 0.20, activities: 0.15 },   // 8+ days
        },
        DIRECT: {
            SAME_DAY: { transport: 0.90, food: 0.10, accommodation: 0, activities: 0 },
            OVERNIGHT: { transport: 0.75, food: 0.20, accommodation: 0, activities: 0, misc: 0.05 },
            MULTI_DAY: { transport: 0.50, accommodation: 0.35, food: 0.15, activities: 0 }, // 2+ nights
        },
    },

    // Meal costs per person (in INR)
    MEAL_COSTS: {
        EXPENSIVE: { min: 200, max: 300 },
        MEDIUM: { min: 70, max: 150 },
        BUDGET: { min: 50, max: 100 },
    },

    // Accommodation costs per night (in INR)
    ACCOMMODATION_COSTS: {
        LUXURY_HOTEL: { min: 5000, max: 15000 },
        MID_HOTEL: { min: 2000, max: 5000 },
        BUDGET_HOTEL: { min: 800, max: 2000 },
        HOSTEL_PRIVATE: { min: 600, max: 1200 },
        HOSTEL_SHARED: { min: 300, max: 600 },
        AIRBNB: { min: 1500, max: 8000 },
    },

    // Local transport costs (per 10km in INR)
    LOCAL_TRANSPORT: {
        AUTO: 200,
        BIKE: { min: 70, max: 90 },
        CAR: { min: 220, max: 400 },
        BUS: 25,
    },

    // Scoring weights based on user priority
    SCORING_WEIGHTS: {
        BALANCED: { budget: 0.35, time: 0.30, comfort: 0.20, convenience: 0.15 },
        BUDGET_PRIORITY: { budget: 0.60, time: 0.20, comfort: 0.10, convenience: 0.10 },
        TIME_PRIORITY: { budget: 0.15, time: 0.50, comfort: 0.05, convenience: 0.30 },
        COMFORT_PRIORITY: { budget: 0.10, time: 0.10, comfort: 0.50, convenience: 0.30 },
    },

    // Time constraints (in minutes)
    TIME_CONSTRAINTS: {
        AIRPORT_BUFFER_DOMESTIC: 120,
        AIRPORT_BUFFER_INTERNATIONAL: 180,
        TRAIN_BUFFER: 30,
        BUS_BUFFER: 15,
        HOTEL_CHECKOUT_TIME: '11:00',
        MIN_LAYOVER: 60,
        MAX_LAYOVER: 360,
    },

    // Destination cost multipliers
    DESTINATION_MULTIPLIERS: {
        EXPENSIVE: 1.5,
        MEDIUM: 1.2,
        BUDGET: 1.0,
    },

    // Cities with higher costs
    EXPENSIVE_CITIES: ['Mumbai', 'Delhi', 'Bangalore', 'Goa', 'Chennai', 'Kolkata'],
    MEDIUM_CITIES: ['Jaipur', 'Pune', 'Hyderabad', 'Kochi', 'Udaipur', 'Agra'],
};

module.exports = TRIP_CONFIG;
