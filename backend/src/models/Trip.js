const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow anonymous trips
  },
  source: {
    code: String,
    name: String,
    state: String
  },
  destination: {
    code: String,
    name: String,
    state: String
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  nights: Number,
  travelers: {
    type: Number,
    default: 1,
    min: 1
  },
  tripType: {
    type: String,
    enum: ['direct', 'tour'],
    default: 'direct'
  },
  noStay: {
    type: Boolean,
    default: false
  },
  budget: {
    amount: Number,
    currency: { type: String, default: 'INR' },
    flexibility: { type: String, enum: ['strict', 'moderate', 'flexible'], default: 'moderate' }
  },
  preferences: {
    accommodations: [String],
    starRating: Number,
    roomType: String,
    transportation: [String],
    flightClass: String,
    trainClass: String,
    busType: String,
    priority: String,
    travelStyle: String,
    interests: [String],
    dietaryRestrictions: [String],
    accessibilityNeeds: [String],
    specialRequirements: String
  },
  stops: [{
    city: String,
    nights: Number,
    order: Number
  }],
  plans: [{
    tier: { type: String, enum: ['Budget', 'Comfort', 'Premium', 'Basic', 'Budget Saver', 'Best Value', 'Comfort Choice', 'Premium Choice'] },
    description: String,
    transport: mongoose.Schema.Types.Mixed,
    localTransport: mongoose.Schema.Types.Mixed,
    hotel: mongoose.Schema.Types.Mixed,
    costs: {
      transport: Number,
      localTransport: Number,
      accommodation: Number,
      activities: Number,
      meals: Number,
      miscellaneous: Number,
      total: Number
    },
    highlights: [String]
  }],
  itinerary: [{
    day: Number,
    title: String,
    activities: [mongoose.Schema.Types.Mixed]
  }],
  booking: {
    status: {
      type: String,
      enum: ['draft', 'pending', 'confirmed', 'cancelled', 'completed'],
      default: 'draft'
    },
    selectedPlan: String,
    bookingId: String,
    paymentMethod: String,
    contactInfo: {
      firstName: String,
      lastName: String,
      email: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      pincode: String
    },
    totalAmount: Number,
    bookedAt: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
tripSchema.index({ userId: 1, createdAt: -1 });
tripSchema.index({ 'destination.code': 1 });
tripSchema.index({ startDate: 1 });

const Trip = mongoose.model('Trip', tripSchema);

module.exports = Trip;
