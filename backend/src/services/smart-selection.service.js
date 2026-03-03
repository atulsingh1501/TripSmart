/**
 * Smart Selection Service
 * 
 * Intelligent selection algorithm that:
 * 1. Prioritizes user-selected options within budget allocation
 * 2. Falls back to cheaper alternatives when budget doesn't fit
 * 3. Returns warnings with suggestions when compromises are needed
 */

const TRIP_CONFIG = require('../config/trip.config');

class SmartSelectionService {
    // Priority order for transport modes (highest to lowest)
    static TRANSPORT_PRIORITY = ['flights', 'trains', 'buses', 'carRentals'];

    // Priority order for accommodation (highest to lowest)
    static ACCOMMODATION_PRIORITY = ['hotels', 'resorts', 'homestays', 'hostels'];

    // Priority order for meal tiers
    static MEAL_PRIORITY = ['EXPENSIVE', 'MEDIUM', 'BUDGET'];

    /**
     * Select best transport option based on budget fit and user preferences
     * @param {Object} params - Selection parameters
     * @returns {{ selected: Object, warning: Object|null, alternatives: Array }}
     */
    static selectTransport(params) {
        const {
            userPreferences = [], // User's selected transport modes ['flights', 'trains', etc.]
            availableOptions = {}, // { flights: [], trains: [], buses: [], carRentals: [] }
            budgetAllocation,      // Allocated budget for transport
            travelers = 1,
            isReturnTrip = true,
            distance = 0           // Distance in km for car rental calculation
        } = params;

        const warnings = [];
        const alternatives = [];
        let selected = null;

        // Step 1: Get user-preferred options in priority order
        const preferredModes = this.TRANSPORT_PRIORITY.filter(mode =>
            userPreferences.includes(mode)
        );

        // Step 2: Try each preferred option in priority order
        for (const mode of preferredModes) {
            const options = availableOptions[mode] || [];
            if (options.length === 0) continue;

            // Get cheapest option of this mode
            const cheapestOption = this._getCheapestTransport(options, mode, travelers, isReturnTrip);

            if (cheapestOption && cheapestOption.totalCost <= budgetAllocation) {
                // Found an option that fits budget!
                selected = {
                    mode,
                    option: cheapestOption.option,
                    cost: cheapestOption.totalCost,
                    fitsbudget: true
                };
                break;
            } else if (cheapestOption) {
                // Save as alternative (doesn't fit budget)
                alternatives.push({
                    mode,
                    option: cheapestOption.option,
                    cost: cheapestOption.totalCost,
                    excess: cheapestOption.totalCost - budgetAllocation
                });
            }
        }

        // Step 3: If no preferred option fits, select cheapest user-preferred option
        if (!selected && alternatives.length > 0) {
            // Sort alternatives by cost
            alternatives.sort((a, b) => a.cost - b.cost);
            const cheapest = alternatives[0];

            selected = {
                mode: cheapest.mode,
                option: cheapest.option,
                cost: cheapest.cost,
                fitsBudget: false
            };

            warnings.push({
                type: 'BUDGET_EXCEEDED',
                category: 'transport',
                message: `Selected ${cheapest.mode} exceeds transport budget by ₹${cheapest.excess.toLocaleString()}`,
                selectedMode: cheapest.mode,
                excessAmount: cheapest.excess
            });
        }

        // Step 4: If still no selection, try non-preferred modes
        if (!selected) {
            const nonPreferredModes = this.TRANSPORT_PRIORITY.filter(mode =>
                !userPreferences.includes(mode)
            );

            for (const mode of nonPreferredModes) {
                const options = availableOptions[mode] || [];
                if (options.length === 0) continue;

                const cheapestOption = this._getCheapestTransport(options, mode, travelers, isReturnTrip);

                if (cheapestOption) {
                    const fitsBudget = cheapestOption.totalCost <= budgetAllocation;

                    selected = {
                        mode,
                        option: cheapestOption.option,
                        cost: cheapestOption.totalCost,
                        fitsBudget,
                        userPreferred: false
                    };

                    warnings.push({
                        type: 'ALTERNATIVE_SELECTED',
                        category: 'transport',
                        message: `No preferred transport fits budget. ${mode} selected as alternative.`,
                        selectedMode: mode,
                        savings: budgetAllocation - cheapestOption.totalCost
                    });
                    break;
                }
            }
        }

        // Step 5: If still no selection, budget is too low
        if (!selected) {
            warnings.push({
                type: 'BUDGET_TOO_LOW',
                category: 'transport',
                message: 'Budget is too low for any available transport option',
                minimumRequired: alternatives.length > 0 ? alternatives[0].cost : 0
            });
        }

        return {
            selected,
            warnings,
            alternatives: alternatives.filter(a => a.mode !== selected?.mode).slice(0, 3)
        };
    }

    /**
     * Select best accommodation option based on budget fit
     */
    static selectAccommodation(params) {
        const {
            userPreferences = [],
            availableOptions = [],
            budgetAllocation,
            nights = 1,
            travelers = 1
        } = params;

        const warnings = [];
        const alternatives = [];
        let selected = null;

        // Filter by user preferences first
        const preferredHotels = availableOptions.filter(hotel => {
            if (userPreferences.starRating && hotel.stars < userPreferences.starRating) {
                return false;
            }
            return true;
        });

        // Sort by price (cheapest first)
        const sortedHotels = [...preferredHotels].sort((a, b) => {
            const priceA = a.rooms?.[0]?.pricePerNight || 0;
            const priceB = b.rooms?.[0]?.pricePerNight || 0;
            return priceA - priceB;
        });

        // Calculate rooms needed
        const roomsNeeded = Math.ceil(travelers / 2);

        // Try each hotel
        for (const hotel of sortedHotels) {
            const pricePerNight = hotel.rooms?.[0]?.pricePerNight || 0;
            const totalCost = pricePerNight * nights * roomsNeeded;

            if (totalCost <= budgetAllocation) {
                selected = {
                    hotel,
                    cost: totalCost,
                    pricePerNight,
                    fitsBudget: true
                };
                break;
            } else {
                alternatives.push({
                    hotel,
                    cost: totalCost,
                    excess: totalCost - budgetAllocation
                });
            }
        }

        // If no selection, pick cheapest with warning
        if (!selected && alternatives.length > 0) {
            alternatives.sort((a, b) => a.cost - b.cost);
            const cheapest = alternatives[0];

            selected = {
                hotel: cheapest.hotel,
                cost: cheapest.cost,
                fitsBudget: false
            };

            warnings.push({
                type: 'BUDGET_EXCEEDED',
                category: 'accommodation',
                message: `Cheapest accommodation exceeds budget by ₹${cheapest.excess.toLocaleString()}`,
                excessAmount: cheapest.excess
            });
        }

        return {
            selected,
            warnings,
            alternatives: alternatives.slice(0, 3)
        };
    }

    /**
     * Select meal tier based on budget allocation
     */
    static selectMealTier(params) {
        const {
            budgetPerMeal,
            travelers = 1,
            durationDays = 1
        } = params;

        const mealsPerDay = 3;
        const totalMeals = mealsPerDay * durationDays;
        const perMealBudget = budgetPerMeal / (totalMeals * travelers);

        // Try each tier in priority order
        for (const tier of this.MEAL_PRIORITY) {
            const tierCosts = TRIP_CONFIG.MEAL_COSTS[tier];
            if (perMealBudget >= tierCosts.min) {
                return {
                    tier,
                    avgCostPerMeal: (tierCosts.min + tierCosts.max) / 2,
                    totalEstimated: ((tierCosts.min + tierCosts.max) / 2) * totalMeals * travelers,
                    fitsBudget: true
                };
            }
        }

        // Fall back to budget tier
        return {
            tier: 'BUDGET',
            avgCostPerMeal: TRIP_CONFIG.MEAL_COSTS.BUDGET.min,
            totalEstimated: TRIP_CONFIG.MEAL_COSTS.BUDGET.min * totalMeals * travelers,
            fitsBudget: false,
            warning: 'Budget is too low for standard meals'
        };
    }

    /**
     * Calculate intercity car rental cost
     */
    static calculateIntercityCarRental(params) {
        const {
            distance,
            isReturnTrip = true,
            carType = 'sedan' // sedan, suv, luxury
        } = params;

        // Base rates per km (one-way)
        const baseRates = {
            sedan: { basePrice: 2000, perKm: 12 },
            suv: { basePrice: 3000, perKm: 15 },
            luxury: { basePrice: 5000, perKm: 20 }
        };

        const rate = baseRates[carType] || baseRates.sedan;

        // Calculate one-way cost
        const oneWayCost = rate.basePrice + (distance * rate.perKm);

        // Return trip is ~1.2x one-way (not double - package deal)
        const returnCost = isReturnTrip ? oneWayCost * 1.2 : oneWayCost;

        // Apply minimum prices based on user's examples
        // 8000₹ for 300km direct, 9500₹ for 300km return, 45000₹ for 1000km return
        const minPrices = {
            direct: { 300: 8000, 500: 12000, 1000: 24000 },
            return: { 300: 9500, 500: 15000, 1000: 45000 }
        };

        // Find nearest distance bracket
        const bracket = isReturnTrip ? 'return' : 'direct';
        const nearestDistance = Object.keys(minPrices[bracket])
            .map(Number)
            .sort((a, b) => Math.abs(a - distance) - Math.abs(b - distance))[0];

        // Interpolate price based on distance
        const referencePrice = minPrices[bracket][nearestDistance];
        const adjustedCost = (distance / nearestDistance) * referencePrice;

        return {
            cost: Math.round(Math.max(returnCost, adjustedCost)),
            distance,
            isReturnTrip,
            carType,
            breakdown: {
                basePrice: rate.basePrice,
                perKmRate: rate.perKm,
                estimatedKms: isReturnTrip ? distance * 2 : distance
            }
        };
    }

    /**
     * Get in-city transport options
     */
    static getInCityTransportOptions(params) {
        const {
            dailyKm = 30,
            days = 1,
            travelers = 1,
            destination
        } = params;

        const totalKm = dailyKm * days;

        return [
            {
                type: 'Auto Rickshaw',
                category: 'budget',
                ratePerKm: 15,
                totalFare: totalKm * 15,
                notes: 'Economical, best for short distances',
                capacity: 3
            },
            {
                type: 'Bike Rental',
                category: 'adventure',
                dailyRate: 400,
                totalFare: 400 * days,
                notes: 'For solo travelers, requires license',
                capacity: 1
            },
            {
                type: 'Car Rental (Self-Drive)',
                category: 'comfort',
                dailyRate: 2000,
                totalFare: 2000 * days,
                ratePerKm: 0, // Unlimited km usually
                notes: 'Freedom to explore, requires license',
                capacity: 4,
                carType: 'hatchback'
            },
            {
                type: 'Car Rental (With Driver)',
                category: 'comfort',
                dailyRate: 2500,
                ratePerKm: 10,
                totalFare: (2500 * days) + (Math.max(0, totalKm - 100) * 10), // 100km included
                notes: 'Convenient, driver included',
                capacity: 4,
                carType: 'sedan'
            },
            {
                type: 'Cab (On-Demand)',
                category: 'flexible',
                ratePerKm: 18,
                totalFare: totalKm * 18,
                notes: 'Pay per ride, most flexible',
                capacity: 4
            }
        ].map(opt => ({
            ...opt,
            suitableFor: travelers <= opt.capacity ? 'suitable' : 'may need multiple'
        }));
    }

    // ==================== PRIVATE HELPERS ====================

    /**
     * Get cheapest transport option from a list
     * @private
     */
    static _getCheapestTransport(options, mode, travelers, isReturnTrip) {
        if (!options || options.length === 0) return null;

        let cheapest = null;
        let cheapestCost = Infinity;

        for (const option of options) {
            let cost = 0;

            switch (mode) {
                case 'flights':
                    // Flight prices are per person
                    const flightPrice = option.prices?.economy?.total ||
                        option.price ||
                        5000;
                    cost = flightPrice * travelers * (isReturnTrip ? 2 : 1);
                    break;

                case 'trains':
                    // Train fare is per person
                    const trainFare = option.fare?.total ||
                        option.price ||
                        1500;
                    cost = trainFare * travelers * (isReturnTrip ? 2 : 1);
                    break;

                case 'buses':
                    // Bus fare is per person
                    const busFare = option.fare ||
                        option.price ||
                        800;
                    cost = busFare * travelers * (isReturnTrip ? 2 : 1);
                    break;

                case 'carRentals':
                    // Car rental is flat rate (not per person)
                    cost = option.totalFare || option.price || 10000;
                    break;
            }

            if (cost < cheapestCost) {
                cheapestCost = cost;
                cheapest = { option, totalCost: cost };
            }
        }

        return cheapest;
    }
}

module.exports = SmartSelectionService;
