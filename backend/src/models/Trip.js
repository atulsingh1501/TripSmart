const mongoose = require('mongoose');

const transportSubSchema = new mongoose.Schema({
  mode: { type: String, enum: ['train', 'flight', 'bus', 'car'] },
  operator: String,
  number: String,
  class: String,
  overnightCount: { type: Number, default: 0 },
  departure: {
    station: String,
    time: String,
    date: String
  },
  arrival: {
    station: String,
    time: String,
    date: String
  },
  duration: {
    hours: Number,
    minutes: Number
  },
  cost: {
    perPerson: Number,
    total: Number
  },
  bookingUrl: String
}, { _id: false, strict: false });

const mealsSubSchema = new mongoose.Schema({
  tier: { type: String, enum: ['BUDGET', 'MEDIUM', 'EXPENSIVE', 'budget', 'medium', 'expensive'] },
  dailyCostPerPerson: Number,
  totalCost: Number,
  breakdown: [{
    day: Number,
    breakfast: Number,
    lunch: Number,
    dinner: Number
  }]
}, { _id: false, strict: false });

const breakdownSubSchema = new mongoose.Schema({
  transportTotal: Number,
  accommodationTotal: Number,
  foodTotal: Number,
  activityTotal: Number,
  nightsUsed: Number,
  overnightCount: { type: Number, default: 0 },
  usableDays: Number,
  nightsAtDestination: Number
}, { _id: false, strict: false });

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
  requestedNights: Number,
  durationDays: Number,
  overnightCount: Number,
  usableDays: Number,
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
    tier: { type: String, enum: ['Budget', 'Comfort', 'Premium', 'Basic', 'Budget Saver', 'Best Value', 'Comfort Choice', 'Premium Choice', 'Premium Experience', 'Saved Plan'] },
    description: String,
    transport: { type: mongoose.Schema.Types.Mixed, default: {} },
    transportDetails: transportSubSchema,
    localTransport: mongoose.Schema.Types.Mixed,
    hotel: mongoose.Schema.Types.Mixed,
    accommodation: mongoose.Schema.Types.Mixed,
    meals: mealsSubSchema,
    activities: mongoose.Schema.Types.Mixed,
    breakdown: breakdownSubSchema,
    costs: {
      transport: Number,
      localTransport: Number,
      accommodation: Number,
      activities: Number,
      meals: Number,
      miscellaneous: Number,
      total: Number
    },
    highlights: [String],
    itinerary: [{
      day: Number,
      title: String,
      date: String,
      activities: [mongoose.Schema.Types.Mixed]
    }]
  }],
  itinerary: [{
    day: Number,
    title: String,
    activities: [mongoose.Schema.Types.Mixed]
  }],
  booking: {
    status: {
      type: String,
      enum: ['draft', 'saved', 'pending', 'confirmed', 'cancelled', 'completed'],
      default: 'saved'
    },
    selectedPlan: String,
    bookingId: String,
    paymentMethod: String,
    razorpayOrderId: String,
    razorpayPaymentId: String,
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
    bookedAt: Date,
    transportBooked: { type: Boolean, default: false },
    hotelBooked: { type: Boolean, default: false },
    transportBookingRef: String,
    hotelBookingRef: String
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
