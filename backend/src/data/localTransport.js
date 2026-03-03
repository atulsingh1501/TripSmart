// Local Transport Data for Indian Cities
// Realistic fares based on Indian market rates

/**
 * Auto Rickshaw Fares
 * Base rate: ₹20/km (3-seater)
 * Minimum fare: ₹30
 * Waiting charges: ₹3/minute
 */
const autoRickshawRates = {
  base: {
    perKm: 20,           // ₹20 per km
    minimumFare: 30,     // Minimum ₹30
    waitingPerMin: 3,    // ₹3 per minute waiting
    maxPassengers: 3,    // 3 seater
  },
  // City-specific adjustments
  cityMultipliers: {
    'DEL': 1.0,   // Delhi
    'BOM': 1.2,   // Mumbai (higher rates)
    'BLR': 0.9,   // Bangalore
    'MAA': 0.85,  // Chennai
    'HYD': 0.9,   // Hyderabad
    'CCU': 0.8,   // Kolkata
    'GOI': 1.1,   // Goa (tourist area)
    'JAI': 0.85,  // Jaipur
    'default': 1.0
  }
};

/**
 * Bike Rental Fares
 * Base rate: ₹10/km (half of auto)
 * Daily rental: ₹300-500
 * Fuel not included
 */
const bikeRentalRates = {
  perKm: 10,              // ₹10 per km
  dailyRental: {
    scooter: 300,         // Activa, Access, etc.
    bike125cc: 400,       // Pulsar 125, Shine, etc.
    bike150cc: 500,       // Pulsar 150, Apache, etc.
    bullet: 800,          // Royal Enfield
  },
  maxPassengers: 2,       // Pillion allowed
  fuelEstimate: 40,       // ₹40 per liter estimate
  mileage: {
    scooter: 45,          // km per liter
    bike125cc: 55,
    bike150cc: 45,
    bullet: 30,
  }
};

/**
 * Car Rental Fares
 * Base rate: ₹20-40/km (auto to double)
 * Daily rental with driver
 * Fuel included in most cases
 */
const carRentalRates = {
  categories: {
    hatchback: {
      perKm: 12,
      dailyRental: 1500,
      maxKmPerDay: 80,
      extraKmCharge: 12,
      cars: ['Swift', 'i20', 'Baleno', 'Tiago'],
      maxPassengers: 4
    },
    sedan: {
      perKm: 15,
      dailyRental: 2000,
      maxKmPerDay: 80,
      extraKmCharge: 15,
      cars: ['Dzire', 'Honda City', 'Ciaz', 'Verna'],
      maxPassengers: 4
    },
    suv: {
      perKm: 20,
      dailyRental: 3000,
      maxKmPerDay: 80,
      extraKmCharge: 20,
      cars: ['Innova', 'Ertiga', 'XUV500', 'Scorpio'],
      maxPassengers: 7
    },
    luxury: {
      perKm: 35,
      dailyRental: 6000,
      maxKmPerDay: 80,
      extraKmCharge: 35,
      cars: ['Toyota Camry', 'BMW 3 Series', 'Mercedes C-Class'],
      maxPassengers: 4
    },
    tempo: {
      perKm: 25,
      dailyRental: 4000,
      maxKmPerDay: 100,
      extraKmCharge: 25,
      cars: ['Tempo Traveller 12 Seater', 'Force Traveller'],
      maxPassengers: 12
    }
  },
  extras: {
    driverAllowance: 300,    // Night halt allowance
    tollCharges: 'actual',   // Pass-through
    parkingCharges: 'actual' // Pass-through
  }
};

/**
 * Calculate auto rickshaw fare
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} waitingMinutes - Waiting time in minutes
 * @param {string} cityCode - City code for rate adjustment
 * @returns {object} Fare breakdown
 */
const calculateAutoFare = (distanceKm, waitingMinutes = 0, cityCode = 'default') => {
  const multiplier = autoRickshawRates.cityMultipliers[cityCode] || autoRickshawRates.cityMultipliers.default;
  
  const distanceFare = distanceKm * autoRickshawRates.base.perKm * multiplier;
  const waitingFare = waitingMinutes * autoRickshawRates.base.waitingPerMin;
  const totalFare = Math.max(distanceFare + waitingFare, autoRickshawRates.base.minimumFare);
  
  return {
    type: 'Auto Rickshaw',
    distance: distanceKm,
    distanceFare: Math.round(distanceFare),
    waitingFare: Math.round(waitingFare),
    totalFare: Math.round(totalFare),
    maxPassengers: autoRickshawRates.base.maxPassengers,
    ratePerKm: Math.round(autoRickshawRates.base.perKm * multiplier),
    notes: '3-seater auto, meter rates may vary'
  };
};

/**
 * Calculate bike rental fare
 * @param {number} distanceKm - Distance in kilometers (or 0 for daily rental)
 * @param {string} bikeType - Type of bike
 * @param {number} days - Number of days (for daily rental)
 * @returns {object} Fare breakdown
 */
const calculateBikeFare = (distanceKm, bikeType = 'scooter', days = 0) => {
  const rate = bikeRentalRates.dailyRental[bikeType] || bikeRentalRates.dailyRental.scooter;
  const mileage = bikeRentalRates.mileage[bikeType] || bikeRentalRates.mileage.scooter;
  
  let totalFare, fuelCost, rentalCost;
  
  if (days > 0) {
    // Daily rental mode
    rentalCost = rate * days;
    fuelCost = Math.ceil(distanceKm / mileage) * bikeRentalRates.fuelEstimate;
    totalFare = rentalCost + fuelCost;
  } else {
    // Per km mode (half of auto rate)
    rentalCost = distanceKm * bikeRentalRates.perKm;
    fuelCost = 0; // Included in per km rate
    totalFare = rentalCost;
  }
  
  return {
    type: 'Bike Rental',
    bikeType: bikeType,
    distance: distanceKm,
    days: days,
    rentalCost: Math.round(rentalCost),
    estimatedFuelCost: Math.round(fuelCost),
    totalFare: Math.round(totalFare),
    maxPassengers: bikeRentalRates.maxPassengers,
    ratePerKm: bikeRentalRates.perKm,
    dailyRate: rate,
    notes: days > 0 ? 'Daily rental, fuel extra' : 'Per km rental with fuel included'
  };
};

/**
 * Calculate car rental fare
 * @param {number} distanceKm - Distance in kilometers
 * @param {string} carType - Type of car (hatchback, sedan, suv, luxury, tempo)
 * @param {number} days - Number of days
 * @returns {object} Fare breakdown
 */
const calculateCarFare = (distanceKm, carType = 'sedan', days = 1) => {
  const category = carRentalRates.categories[carType] || carRentalRates.categories.sedan;
  
  const maxKmIncluded = category.maxKmPerDay * days;
  const extraKm = Math.max(0, distanceKm - maxKmIncluded);
  
  const baseFare = category.dailyRental * days;
  const extraKmCharge = extraKm * category.extraKmCharge;
  const driverAllowance = days > 1 ? carRentalRates.extras.driverAllowance * (days - 1) : 0;
  
  const totalFare = baseFare + extraKmCharge + driverAllowance;
  
  return {
    type: 'Car Rental',
    carType: carType,
    carOptions: category.cars,
    distance: distanceKm,
    days: days,
    baseFare: Math.round(baseFare),
    kmIncluded: maxKmIncluded,
    extraKm: extraKm,
    extraKmCharge: Math.round(extraKmCharge),
    driverAllowance: Math.round(driverAllowance),
    totalFare: Math.round(totalFare),
    maxPassengers: category.maxPassengers,
    ratePerKm: category.perKm,
    dailyRate: category.dailyRental,
    notes: `${category.maxKmPerDay}km/day included, driver with car, fuel included`
  };
};

/**
 * Get local transport options for a trip
 * @param {number} estimatedDailyKm - Estimated daily travel in km
 * @param {number} days - Number of days
 * @param {number} passengers - Number of passengers
 * @param {string} cityCode - City code
 * @returns {Array} Array of transport options with fares
 */
const getLocalTransportOptions = (estimatedDailyKm, days, passengers, cityCode = 'default') => {
  const totalKm = estimatedDailyKm * days;
  const options = [];
  
  // Auto rickshaw (if passengers <= 3)
  if (passengers <= 3) {
    const autoFare = calculateAutoFare(totalKm, 0, cityCode);
    // For multiple days, estimate 4-5 rides per day
    const dailyRides = 4;
    autoFare.totalFare = autoFare.ratePerKm * estimatedDailyKm * days;
    autoFare.dailyEstimate = autoFare.ratePerKm * estimatedDailyKm;
    options.push({
      ...autoFare,
      recommended: passengers <= 2,
      economyRating: 4,
      convenienceRating: 3
    });
  }
  
  // Bike rental (if passengers <= 2)
  if (passengers <= 2) {
    const bikeFare = calculateBikeFare(totalKm, 'scooter', days);
    options.push({
      ...bikeFare,
      recommended: passengers === 1 || passengers === 2,
      economyRating: 5,
      convenienceRating: 4
    });
  }
  
  // Car rental - select appropriate type based on passengers
  let carType = 'hatchback';
  if (passengers > 4 && passengers <= 7) {
    carType = 'suv';
  } else if (passengers > 7) {
    carType = 'tempo';
  } else if (passengers > 2) {
    carType = 'sedan';
  }
  
  const carFare = calculateCarFare(totalKm, carType, days);
  options.push({
    ...carFare,
    recommended: passengers > 3,
    economyRating: 2,
    convenienceRating: 5
  });
  
  // Also add luxury option for premium travelers
  if (passengers <= 4) {
    const luxuryFare = calculateCarFare(totalKm, 'luxury', days);
    options.push({
      ...luxuryFare,
      recommended: false,
      economyRating: 1,
      convenienceRating: 5
    });
  }
  
  return options;
};

/**
 * Get quick fare estimate for display
 * @param {number} distanceKm - Distance in km
 * @param {string} transportType - Type of transport
 * @returns {number} Estimated fare in INR
 */
const getQuickFareEstimate = (distanceKm, transportType) => {
  switch (transportType) {
    case 'auto':
    case 'auto rickshaw':
      return Math.max(30, Math.round(distanceKm * 20)); // ₹20/km, min ₹30
    case 'bike':
    case 'bike rental':
      return Math.round(distanceKm * 10); // ₹10/km
    case 'car':
    case 'car rental':
      return Math.round(distanceKm * 15); // ₹15/km average
    case 'suv':
      return Math.round(distanceKm * 20); // ₹20/km
    case 'luxury':
      return Math.round(distanceKm * 35); // ₹35/km
    default:
      return Math.round(distanceKm * 15);
  }
};

module.exports = {
  autoRickshawRates,
  bikeRentalRates,
  carRentalRates,
  calculateAutoFare,
  calculateBikeFare,
  calculateCarFare,
  getLocalTransportOptions,
  getQuickFareEstimate
};
