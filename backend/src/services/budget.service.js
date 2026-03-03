/**
 * Budget Service
 * Handles dynamic budget allocation based on trip parameters
 */

const TRIP_CONFIG = require('../config/trip.config');

class BudgetService {
    /**
     * Calculate dynamic budget allocation based on trip parameters
     * @param {Object} preferences - Trip preferences
     * @returns {Object} Budget allocation breakdown
     */
    static calculateAllocation(preferences) {
        const { tripType, durationDays, budget, destination, priorities = {} } = preferences;

        let allocation;

        if (tripType === 'tour') {
            // Determine trip length category
            let category;
            if (durationDays <= 3) category = 'SHORT';
            else if (durationDays <= 7) category = 'MEDIUM';
            else category = 'LONG';

            const baseAllocation = TRIP_CONFIG.BUDGET_ALLOCATION.TOUR[category];

            allocation = {
                transport: budget * baseAllocation.transport,
                accommodation: budget * baseAllocation.accommodation,
                food: budget * baseAllocation.food,
                activities: budget * baseAllocation.activities,
                buffer: budget * 0.05, // 5% buffer
            };
        } else {
            // Direct travel - NO activities, only transport + food + optional accommodation
            const stayNights = durationDays - 1; // Days between arrival and departure

            let baseAllocation;
            if (stayNights === 0) {
                // Same day return
                baseAllocation = TRIP_CONFIG.BUDGET_ALLOCATION.DIRECT.SAME_DAY;
            } else if (stayNights === 1) {
                // Single night stay
                baseAllocation = TRIP_CONFIG.BUDGET_ALLOCATION.DIRECT.OVERNIGHT;
            } else {
                // Multi-day stay (2+ nights)
                baseAllocation = TRIP_CONFIG.BUDGET_ALLOCATION.DIRECT.MULTI_DAY;
            }

            // Check if user opted for no accommodation
            const needsAccommodation = preferences.noStay !== true && stayNights > 0;

            allocation = {
                transport: budget * baseAllocation.transport,
                accommodation: needsAccommodation ? budget * (baseAllocation.accommodation || 0.35) : 0,
                food: budget * baseAllocation.food,
                activities: 0, // Direct travel NEVER has activities
                buffer: budget * (baseAllocation.misc || 0.05),
            };
        }

        // Apply destination multiplier
        allocation = this.applyDestinationMultiplier(allocation, destination);

        // Adjust based on user priorities
        if (priorities && Object.keys(priorities).length > 0) {
            allocation = this.adjustForPriorities(allocation, priorities);
        }

        return allocation;
    }

    /**
     * Apply destination cost multiplier for expensive cities
     */
    static applyDestinationMultiplier(allocation, destination) {
        if (!destination) return allocation;

        let multiplier = TRIP_CONFIG.DESTINATION_MULTIPLIERS.BUDGET;

        if (TRIP_CONFIG.EXPENSIVE_CITIES.includes(destination)) {
            multiplier = TRIP_CONFIG.DESTINATION_MULTIPLIERS.EXPENSIVE;
        } else if (TRIP_CONFIG.MEDIUM_CITIES.includes(destination)) {
            multiplier = TRIP_CONFIG.DESTINATION_MULTIPLIERS.MEDIUM;
        }

        // Only apply multiplier to accommodation, food, activities
        return {
            ...allocation,
            accommodation: allocation.accommodation * multiplier,
            food: allocation.food * multiplier,
            activities: allocation.activities * multiplier,
        };
    }

    /**
     * Adjust allocation based on user priorities (budget/time/comfort)
     */
    static adjustForPriorities(allocation, priorities) {
        const adjusted = { ...allocation };

        // If user prioritizes comfort, increase accommodation budget
        if (priorities.comfort > 0.5) {
            const shift = adjusted.food * 0.1;
            adjusted.accommodation += shift;
            adjusted.food -= shift;
        }

        // If user prioritizes time, increase transport budget (for faster options)
        if (priorities.time > 0.5) {
            const shift = adjusted.activities * 0.2;
            adjusted.transport += shift;
            adjusted.activities -= shift;
        }

        // If user prioritizes budget, add more to buffer
        if (priorities.budget > 0.5) {
            const shift = adjusted.activities * 0.1;
            adjusted.buffer += shift;
            adjusted.activities -= shift;
        }

        return adjusted;
    }

    /**
     * Validate if budget is sufficient for the trip
     */
    static validateBudget(preferences) {
        const { tripType, durationDays, travelers, budget } = preferences;

        // Calculate absolute minimum costs
        // Calculate absolute minimum costs
        // For direct travel, nights > 0 only if it's multi-day and user didn't select 'noStay'
        let nights = 0;
        if (tripType === 'tour') {
            nights = Math.max(durationDays - 1, 0);
        } else {
            // Direct travel
            const isNoStay = preferences.noStay === true;
            if (!isNoStay) {
                nights = Math.max(durationDays - 1, 0);
            }
        }
        const meals = durationDays * 3;

        const minTransport = 2000 * travelers; // Minimum round trip
        const minAccommodation = nights * 500 * travelers; // Cheapest hostel
        const minFood = meals * 50 * travelers; // Budget meals
        const minActivities = tripType === 'tour' ? 500 * travelers : 0;

        const minimumNeeded = minTransport + minAccommodation + minFood + minActivities;

        if (budget < minimumNeeded) {
            return {
                valid: false,
                minimumNeeded,
                message: `Budget insufficient. Minimum needed: ₹${minimumNeeded.toLocaleString('en-IN')}`,
            };
        }

        return { valid: true };
    }

    /**
     * Get meal cost tier based on budget
     */
    static getMealTier(budgetPerMeal) {
        if (budgetPerMeal > 180) return 'EXPENSIVE';
        if (budgetPerMeal > 100) return 'MEDIUM';
        return 'BUDGET';
    }

    /**
     * Calculate meal costs based on departure time
     */
    static planMealCosts(departureHour, tripType, durationDays, foodBudget, travelers) {
        const mealsPerDay = 3;
        const totalMeals = durationDays * mealsPerDay;
        const budgetPerMeal = foodBudget / totalMeals / travelers;

        const tier = this.getMealTier(budgetPerMeal);
        const costs = TRIP_CONFIG.MEAL_COSTS[tier];
        const avgCost = (costs.min + costs.max) / 2;

        const meals = [];

        // Plan meals based on departure time for first day
        if (departureHour < 10) {
            // Morning departure - include breakfast
            meals.push(
                { type: 'breakfast', estimatedCost: avgCost, tier: tier.toLowerCase() },
                { type: 'lunch', estimatedCost: avgCost, tier: tier.toLowerCase() }
            );
        } else if (departureHour < 15) {
            // Afternoon departure - lunch onwards
            meals.push({ type: 'lunch', estimatedCost: avgCost, tier: tier.toLowerCase() });
        }
        // Always include dinner
        meals.push({ type: 'dinner', estimatedCost: avgCost, tier: tier.toLowerCase() });

        return {
            meals,
            tier: tier.toLowerCase(),
            avgCostPerMeal: avgCost,
            totalEstimated: meals.length * avgCost * travelers,
        };
    }
}

module.exports = BudgetService;
