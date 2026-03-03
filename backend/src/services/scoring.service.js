/**
 * Scoring Service
 * Scores and ranks transport and accommodation options
 */

const TRIP_CONFIG = require('../config/trip.config');

class ScoringService {
    /**
     * Score a transport option based on multiple factors
     * @param {Object} option - Transport option
     * @param {number} allocatedBudget - Budget allocated for transport
     * @param {Object} priorities - User priorities (budget/time/comfort)
     * @returns {number} Score between 0 and 1
     */
    static scoreTransportOption(option, allocatedBudget, priorities = {}) {
        const weights = this.getWeights(priorities);

        // Calculate individual scores (0-1 scale)
        const budgetScore = this.calculateBudgetScore(option.price, allocatedBudget);
        const timeScore = this.calculateTimeScore(option.durationMinutes || this.estimateDuration(option));
        const comfortScore = option.comfortScore || this.estimateComfortScore(option);
        const convenienceScore = this.calculateConvenienceScore(option.transfers || option.stops || 0);

        // Weighted sum
        const totalScore =
            budgetScore * weights.budget +
            timeScore * weights.time +
            comfortScore * weights.comfort +
            convenienceScore * weights.convenience;

        return Math.round(totalScore * 100) / 100;
    }

    /**
     * Calculate budget fit score
     * 1.0 = perfectly within budget (80-95% utilization)
     * Lower scores for under or over utilization
     */
    static calculateBudgetScore(cost, budget) {
        if (cost > budget) return 0;

        const utilizationRatio = cost / budget;

        // Optimal utilization is 80-95% of budget
        if (utilizationRatio >= 0.8 && utilizationRatio <= 0.95) {
            return 1.0;
        } else if (utilizationRatio < 0.8) {
            // Under-utilization penalty
            return 0.8 + (utilizationRatio / 0.8) * 0.2;
        } else {
            // Over-utilization (too close to limit)
            return Math.max(0, 1.0 - ((utilizationRatio - 0.95) / 0.05) * 0.3);
        }
    }

    /**
     * Calculate time efficiency score
     * Higher score for shorter duration
     */
    static calculateTimeScore(durationMinutes) {
        // Max acceptable is 24 hours (1440 minutes)
        const maxAcceptable = 1440;

        if (durationMinutes > maxAcceptable) return 0;

        return Math.round((1 - (durationMinutes / maxAcceptable)) * 100) / 100;
    }

    /**
     * Calculate convenience score based on transfers/stops
     */
    static calculateConvenienceScore(transfers) {
        return Math.max(0, 1 - transfers * 0.2);
    }

    /**
     * Estimate duration from transport option if not provided
     */
    static estimateDuration(option) {
        if (option.duration) {
            // Parse duration string like "2h 30m" or "12h"
            const match = option.duration.match(/(\d+)h\s*(\d+)?m?/);
            if (match) {
                return parseInt(match[1]) * 60 + (parseInt(match[2]) || 0);
            }
        }
        // Default estimates by type
        switch (option.type) {
            case 'flight': return 120;
            case 'train': return 480;
            case 'bus': return 600;
            default: return 360;
        }
    }

    /**
     * Estimate comfort score based on transport class
     */
    static estimateComfortScore(option) {
        const classScores = {
            // Flights
            'business': 0.95,
            'first': 0.98,
            'premium-economy': 0.8,
            'economy': 0.6,
            // Trains
            '1A': 0.9,
            '2A': 0.75,
            '3A': 0.6,
            'CC': 0.65,
            'SL': 0.4,
            'GN': 0.2,
            // Buses
            'ac-sleeper': 0.7,
            'ac-seater': 0.5,
            'non-ac': 0.3,
        };

        const transportClass = option.class || option.travelClass || 'economy';
        return classScores[transportClass] || 0.5;
    }

    /**
     * Get scoring weights based on user priorities
     */
    static getWeights(priorities = {}) {
        const { budget = 0.5, time = 0.5, comfort = 0.5 } = priorities;

        if (budget > 0.7) return TRIP_CONFIG.SCORING_WEIGHTS.BUDGET_PRIORITY;
        if (time > 0.7) return TRIP_CONFIG.SCORING_WEIGHTS.TIME_PRIORITY;
        if (comfort > 0.7) return TRIP_CONFIG.SCORING_WEIGHTS.COMFORT_PRIORITY;

        return TRIP_CONFIG.SCORING_WEIGHTS.BALANCED;
    }

    /**
     * Score accommodation option
     */
    static scoreAccommodation(option, budgetPerNight, priorities = {}) {
        const priceScore = this.calculateBudgetScore(option.pricePerNight || option.price, budgetPerNight);
        const ratingScore = (option.rating || 4.0) / 5.0;
        const starScore = (option.stars || option.starRating || 3) / 5.0;

        // Weight: 50% price, 30% rating, 20% stars
        return Math.round((priceScore * 0.5 + ratingScore * 0.3 + starScore * 0.2) * 100) / 100;
    }

    /**
     * Rank transport options by score
     */
    static rankTransportOptions(options, allocatedBudget, priorities) {
        return options
            .map(option => ({
                ...option,
                score: this.scoreTransportOption(option, allocatedBudget, priorities),
            }))
            .sort((a, b) => b.score - a.score);
    }

    /**
     * Rank accommodation options by score
     */
    static rankAccommodationOptions(options, budgetPerNight, priorities) {
        return options
            .map(option => ({
                ...option,
                score: this.scoreAccommodation(option, budgetPerNight, priorities),
            }))
            .sort((a, b) => b.score - a.score);
    }

    /**
     * Generate plan name based on score
     */
    static generatePlanName(score) {
        if (score > 0.8) return 'Optimal Choice';
        if (score > 0.6) return 'Great Value';
        if (score > 0.4) return 'Budget Saver';
        return 'Basic Option';
    }

    /**
     * Generate plan badge based on score
     */
    static generatePlanBadge(score) {
        if (score > 0.8) return { text: 'Best Match', color: 'bg-green-500' };
        if (score > 0.6) return { text: 'Popular', color: 'bg-primary' };
        if (score > 0.4) return { text: 'Best Value', color: 'bg-blue-500' };
        return { text: 'Budget', color: 'bg-gray-500' };
    }
}

module.exports = ScoringService;
