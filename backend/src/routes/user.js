const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const { authMiddleware } = require('./auth');

/**
 * @route   GET /api/user/trips
 * @desc    Get all trips saved by the current user
 * @access  Private (requires authentication)
 */
router.get('/trips', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;

        // Find all trips for this user
        const trips = await Trip.find({ userId })
            .sort({ createdAt: -1 }) // Most recent first
            .lean();

        // Transform trips to match frontend expected format
        const formattedTrips = trips.map(trip => ({
            _id: trip._id.toString(),
            source: trip.source?.name || trip.source?.code || 'Unknown',
            destination: trip.destination?.name || trip.destination?.code || 'Unknown',
            startDate: trip.startDate,
            endDate: trip.endDate,
            travelers: trip.travelers || 1,
            tripType: trip.tripType || 'tour',
            selectedPlan: {
                tier: trip.plans?.[0]?.tier || trip.booking?.selectedPlan || 'Comfort',
                totalCost: trip.plans?.[0]?.costs?.total || trip.booking?.totalAmount || 0
            },
            status: trip.booking?.status || 'saved',
            createdAt: trip.createdAt
        }));

        console.log(`📋 Found ${formattedTrips.length} trips for user ${userId}`);

        res.json({
            success: true,
            count: formattedTrips.length,
            data: formattedTrips
        });
    } catch (error) {
        console.error('Error fetching user trips:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Server error while fetching trips'
        });
    }
});

/**
 * @route   DELETE /api/user/trips/:tripId
 * @desc    Delete a saved trip
 * @access  Private (requires authentication)
 */
router.delete('/trips/:tripId', authMiddleware, async (req, res) => {
    try {
        const { tripId } = req.params;
        const userId = req.userId;

        // Find and delete trip (only if owned by user)
        const trip = await Trip.findOneAndDelete({
            _id: tripId,
            userId: userId
        });

        if (!trip) {
            return res.status(404).json({
                success: false,
                error: 'Trip not found or not authorized'
            });
        }

        console.log(`🗑️ Deleted trip ${tripId} for user ${userId}`);

        res.json({
            success: true,
            message: 'Trip deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting trip:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Server error while deleting trip'
        });
    }
});

module.exports = router;
