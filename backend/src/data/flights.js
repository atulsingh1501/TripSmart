// Realistic Indian Flight Data
// Based on actual routes, airlines, and approximate pricing in Indian market

const airlines = [
  { code: 'AI', name: 'Air India', type: 'full-service', logo: '/airlines/air-india.png' },
  { code: '6E', name: 'IndiGo', type: 'low-cost', logo: '/airlines/indigo.png' },
  { code: 'SG', name: 'SpiceJet', type: 'low-cost', logo: '/airlines/spicejet.png' },
  { code: 'UK', name: 'Vistara', type: 'full-service', logo: '/airlines/vistara.png' },
  { code: 'G8', name: 'Go First', type: 'low-cost', logo: '/airlines/go-first.png' },
  { code: 'QP', name: 'Akasa Air', type: 'low-cost', logo: '/airlines/akasa.png' },
  { code: 'I5', name: 'Air India Express', type: 'low-cost', logo: '/airlines/ai-express.png' }
];

// Realistic flight routes with base prices (in INR)
// Prices vary by: class, airline type, demand, time of booking, seasonality
const routes = [
  // Delhi connections
  { from: 'DEL', to: 'BOM', distance: 1150, duration: 130, basePrice: { economy: 4500, business: 12000 } },
  { from: 'DEL', to: 'BLR', distance: 1745, duration: 160, basePrice: { economy: 5200, business: 14000 } },
  { from: 'DEL', to: 'MAA', distance: 1760, duration: 170, basePrice: { economy: 5000, business: 13500 } },
  { from: 'DEL', to: 'CCU', distance: 1305, duration: 130, basePrice: { economy: 4800, business: 12500 } },
  { from: 'DEL', to: 'HYD', distance: 1260, duration: 130, basePrice: { economy: 4500, business: 12000 } },
  { from: 'DEL', to: 'JAI', distance: 265, duration: 55, basePrice: { economy: 3200, business: 8000 } },
  { from: 'DEL', to: 'GOI', distance: 1550, duration: 145, basePrice: { economy: 5500, business: 15000 } },
  { from: 'DEL', to: 'SXR', distance: 650, duration: 80, basePrice: { economy: 4000, business: 10000 } },
  { from: 'DEL', to: 'IXL', distance: 615, duration: 80, basePrice: { economy: 5500, business: 14000 } },
  { from: 'DEL', to: 'ATQ', distance: 450, duration: 65, basePrice: { economy: 3500, business: 9000 } },
  { from: 'DEL', to: 'UDR', distance: 580, duration: 75, basePrice: { economy: 4200, business: 11000 } },
  { from: 'DEL', to: 'VNS', distance: 680, duration: 80, basePrice: { economy: 3800, business: 9500 } },
  { from: 'DEL', to: 'IXZ', distance: 2775, duration: 210, basePrice: { economy: 8000, business: 22000 } },
  { from: 'DEL', to: 'COK', distance: 2070, duration: 180, basePrice: { economy: 5800, business: 15000 } },

  // Mumbai connections
  { from: 'BOM', to: 'DEL', distance: 1150, duration: 130, basePrice: { economy: 4500, business: 12000 } },
  { from: 'BOM', to: 'BLR', distance: 845, duration: 95, basePrice: { economy: 3500, business: 9500 } },
  { from: 'BOM', to: 'MAA', distance: 1030, duration: 110, basePrice: { economy: 3800, business: 10000 } },
  { from: 'BOM', to: 'CCU', distance: 1665, duration: 155, basePrice: { economy: 5200, business: 14000 } },
  { from: 'BOM', to: 'HYD', distance: 620, duration: 80, basePrice: { economy: 3200, business: 8500 } },
  { from: 'BOM', to: 'GOI', distance: 440, duration: 60, basePrice: { economy: 2800, business: 7500 } },
  { from: 'BOM', to: 'JAI', distance: 935, duration: 105, basePrice: { economy: 4000, business: 10500 } },
  { from: 'BOM', to: 'COK', distance: 920, duration: 100, basePrice: { economy: 3500, business: 9000 } },
  { from: 'BOM', to: 'SXR', distance: 1480, duration: 140, basePrice: { economy: 6000, business: 16000 } },
  { from: 'BOM', to: 'IXZ', distance: 2560, duration: 195, basePrice: { economy: 7500, business: 20000 } },

  // Bangalore connections
  { from: 'BLR', to: 'DEL', distance: 1745, duration: 160, basePrice: { economy: 5200, business: 14000 } },
  { from: 'BLR', to: 'BOM', distance: 845, duration: 95, basePrice: { economy: 3500, business: 9500 } },
  { from: 'BLR', to: 'MAA', distance: 290, duration: 50, basePrice: { economy: 2500, business: 6500 } },
  { from: 'BLR', to: 'CCU', distance: 1560, duration: 150, basePrice: { economy: 5000, business: 13500 } },
  { from: 'BLR', to: 'HYD', distance: 500, duration: 70, basePrice: { economy: 2800, business: 7500 } },
  { from: 'BLR', to: 'GOI', distance: 520, duration: 70, basePrice: { economy: 2500, business: 7000 } },
  { from: 'BLR', to: 'COK', distance: 355, duration: 55, basePrice: { economy: 2200, business: 6000 } },

  // Chennai connections
  { from: 'MAA', to: 'DEL', distance: 1760, duration: 170, basePrice: { economy: 5000, business: 13500 } },
  { from: 'MAA', to: 'BOM', distance: 1030, duration: 110, basePrice: { economy: 3800, business: 10000 } },
  { from: 'MAA', to: 'BLR', distance: 290, duration: 50, basePrice: { economy: 2500, business: 6500 } },
  { from: 'MAA', to: 'CCU', distance: 1370, duration: 135, basePrice: { economy: 4500, business: 12000 } },
  { from: 'MAA', to: 'HYD', distance: 520, duration: 65, basePrice: { economy: 2500, business: 7000 } },
  { from: 'MAA', to: 'IXZ', distance: 1190, duration: 130, basePrice: { economy: 5000, business: 13000 } },
  { from: 'MAA', to: 'COK', distance: 530, duration: 70, basePrice: { economy: 2800, business: 7500 } },

  // Kolkata connections
  { from: 'CCU', to: 'DEL', distance: 1305, duration: 130, basePrice: { economy: 4800, business: 12500 } },
  { from: 'CCU', to: 'BOM', distance: 1665, duration: 155, basePrice: { economy: 5200, business: 14000 } },
  { from: 'CCU', to: 'BLR', distance: 1560, duration: 150, basePrice: { economy: 5000, business: 13500 } },
  { from: 'CCU', to: 'MAA', distance: 1370, duration: 135, basePrice: { economy: 4500, business: 12000 } },
  { from: 'CCU', to: 'IXB', distance: 565, duration: 70, basePrice: { economy: 3200, business: 8500 } },
  { from: 'CCU', to: 'GOI', distance: 1635, duration: 155, basePrice: { economy: 5500, business: 15000 } },
  { from: 'CCU', to: 'IXZ', distance: 1650, duration: 160, basePrice: { economy: 6500, business: 17000 } },

  // Hyderabad connections
  { from: 'HYD', to: 'DEL', distance: 1260, duration: 130, basePrice: { economy: 4500, business: 12000 } },
  { from: 'HYD', to: 'BOM', distance: 620, duration: 80, basePrice: { economy: 3200, business: 8500 } },
  { from: 'HYD', to: 'BLR', distance: 500, duration: 70, basePrice: { economy: 2800, business: 7500 } },
  { from: 'HYD', to: 'MAA', distance: 520, duration: 65, basePrice: { economy: 2500, business: 7000 } },
  { from: 'HYD', to: 'CCU', distance: 1180, duration: 125, basePrice: { economy: 4200, business: 11000 } },
  { from: 'HYD', to: 'GOI', distance: 595, duration: 75, basePrice: { economy: 3000, business: 8000 } },

  // Goa connections
  { from: 'GOI', to: 'DEL', distance: 1550, duration: 145, basePrice: { economy: 5500, business: 15000 } },
  { from: 'GOI', to: 'BOM', distance: 440, duration: 60, basePrice: { economy: 2800, business: 7500 } },
  { from: 'GOI', to: 'BLR', distance: 520, duration: 70, basePrice: { economy: 2500, business: 7000 } },

  // Tourist destinations
  { from: 'GOI', to: 'DEL', distance: 1550, duration: 145, basePrice: { economy: 5500, business: 15000 } },
  { from: 'JAI', to: 'BOM', distance: 935, duration: 105, basePrice: { economy: 4000, business: 10500 } },
  { from: 'JAI', to: 'DEL', distance: 265, duration: 55, basePrice: { economy: 3200, business: 8000 } },
  { from: 'UDR', to: 'DEL', distance: 580, duration: 75, basePrice: { economy: 4200, business: 11000 } },
  { from: 'UDR', to: 'BOM', distance: 670, duration: 85, basePrice: { economy: 3800, business: 10000 } },
  { from: 'SXR', to: 'DEL', distance: 650, duration: 80, basePrice: { economy: 4000, business: 10000 } },
  { from: 'SXR', to: 'BOM', distance: 1480, duration: 140, basePrice: { economy: 6000, business: 16000 } },
  { from: 'IXL', to: 'DEL', distance: 615, duration: 80, basePrice: { economy: 5500, business: 14000 } },
  { from: 'VNS', to: 'DEL', distance: 680, duration: 80, basePrice: { economy: 3800, business: 9500 } },
  { from: 'COK', to: 'DEL', distance: 2070, duration: 180, basePrice: { economy: 5800, business: 15000 } },
  { from: 'COK', to: 'BOM', distance: 920, duration: 100, basePrice: { economy: 3500, business: 9000 } },
  { from: 'COK', to: 'BLR', distance: 355, duration: 55, basePrice: { economy: 2200, business: 6000 } },
  { from: 'IXZ', to: 'MAA', distance: 1190, duration: 130, basePrice: { economy: 5000, business: 13000 } },
  { from: 'IXZ', to: 'CCU', distance: 1650, duration: 160, basePrice: { economy: 6500, business: 17000 } },
  { from: 'IXZ', to: 'DEL', distance: 2775, duration: 210, basePrice: { economy: 8000, business: 22000 } }
];

// Flight time slots (departure times)
const timeSlots = [
  { slot: 'early-morning', label: 'Early Morning', times: ['05:00', '05:30', '06:00', '06:30'] },
  { slot: 'morning', label: 'Morning', times: ['07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30'] },
  { slot: 'afternoon', label: 'Afternoon', times: ['11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30'] },
  { slot: 'evening', label: 'Evening', times: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'] },
  { slot: 'night', label: 'Night', times: ['20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'] }
];

// Price modifiers based on various factors
const priceModifiers = {
  // Day of week (0 = Sunday, 6 = Saturday)
  dayOfWeek: {
    0: 1.15, // Sunday
    1: 0.95, // Monday
    2: 0.90, // Tuesday (cheapest)
    3: 0.92, // Wednesday
    4: 1.00, // Thursday
    5: 1.20, // Friday (most expensive)
    6: 1.18  // Saturday
  },
  // Time slot modifiers
  timeSlot: {
    'early-morning': 0.85, // Cheapest
    'morning': 1.10,       // Popular, more expensive
    'afternoon': 0.95,
    'evening': 1.15,       // Popular
    'night': 0.90
  },
  // Advance booking (days before travel)
  advanceBooking: {
    '1-3': 1.50,   // Last minute
    '4-7': 1.30,
    '8-14': 1.10,
    '15-30': 0.95, // Sweet spot
    '31-60': 0.90, // Best prices
    '61-90': 0.92,
    '90+': 0.95
  },
  // Airline type
  airlineType: {
    'low-cost': 0.80,
    'full-service': 1.25
  },
  // Season (peak vs off-peak)
  season: {
    'peak': 1.35,    // Dec-Jan, Oct (festivals), Apr-May (summer holidays)
    'high': 1.15,    // Nov, Feb, Mar, Jun
    'normal': 1.00   // Jul, Aug, Sep
  }
};

// Generate flight options for a route on a specific date
const generateFlights = (from, to, date, travelers = 1) => {
  const route = routes.find(r => r.from === from && r.to === to);
  if (!route) {
    // Check reverse route
    const reverseRoute = routes.find(r => r.from === to && r.to === from);
    if (!reverseRoute) return [];
  }

  const currentRoute = route || routes.find(r => r.from === to && r.to === from);
  const travelDate = new Date(date);
  const today = new Date();
  const daysAdvance = Math.ceil((travelDate - today) / (1000 * 60 * 60 * 24));

  // Determine modifiers
  const dayMod = priceModifiers.dayOfWeek[travelDate.getDay()];
  
  let advanceMod = 1;
  if (daysAdvance <= 3) advanceMod = priceModifiers.advanceBooking['1-3'];
  else if (daysAdvance <= 7) advanceMod = priceModifiers.advanceBooking['4-7'];
  else if (daysAdvance <= 14) advanceMod = priceModifiers.advanceBooking['8-14'];
  else if (daysAdvance <= 30) advanceMod = priceModifiers.advanceBooking['15-30'];
  else if (daysAdvance <= 60) advanceMod = priceModifiers.advanceBooking['31-60'];
  else if (daysAdvance <= 90) advanceMod = priceModifiers.advanceBooking['61-90'];
  else advanceMod = priceModifiers.advanceBooking['90+'];

  const month = travelDate.getMonth();
  let seasonMod = priceModifiers.season['normal'];
  if ([11, 0, 3, 4, 9].includes(month)) seasonMod = priceModifiers.season['peak']; // Dec, Jan, Apr, May, Oct
  else if ([1, 2, 5, 10].includes(month)) seasonMod = priceModifiers.season['high']; // Feb, Mar, Jun, Nov

  const flights = [];

  // Generate 6-10 flights per route per day
  const numFlights = Math.floor(Math.random() * 5) + 6;
  const selectedAirlines = [...airlines].sort(() => Math.random() - 0.5).slice(0, numFlights);

  selectedAirlines.forEach((airline, index) => {
    // Pick a random time slot and specific time
    const slotIndex = Math.floor(Math.random() * timeSlots.length);
    const slot = timeSlots[slotIndex];
    const departureTime = slot.times[Math.floor(Math.random() * slot.times.length)];
    const timeMod = priceModifiers.timeSlot[slot.slot];
    const airlineMod = priceModifiers.airlineType[airline.type];

    // Calculate prices
    const economyPrice = Math.round(
      currentRoute.basePrice.economy * dayMod * advanceMod * seasonMod * timeMod * airlineMod * (0.9 + Math.random() * 0.2)
    );
    const businessPrice = Math.round(
      currentRoute.basePrice.business * dayMod * advanceMod * seasonMod * timeMod * airlineMod * (0.9 + Math.random() * 0.2)
    );

    // Calculate arrival time
    const [depHour, depMin] = departureTime.split(':').map(Number);
    const durationMinutes = currentRoute.duration + Math.floor(Math.random() * 20) - 10;
    const arrivalMinutes = (depHour * 60 + depMin + durationMinutes) % (24 * 60);
    const arrHour = Math.floor(arrivalMinutes / 60);
    const arrMin = arrivalMinutes % 60;
    const arrivalTime = `${arrHour.toString().padStart(2, '0')}:${arrMin.toString().padStart(2, '0')}`;

    // Generate flight number
    const flightNumber = `${airline.code}${Math.floor(Math.random() * 900) + 100}`;

    // Determine stops (most flights are non-stop for these routes)
    const stops = Math.random() > 0.85 ? 1 : 0;
    const stopInfo = stops > 0 ? {
      stops: 1,
      stopover: ['BOM', 'DEL', 'BLR', 'HYD'].filter(c => c !== from && c !== to)[Math.floor(Math.random() * 3)],
      layover: `${Math.floor(Math.random() * 2) + 1}h ${Math.floor(Math.random() * 50) + 10}m`
    } : { stops: 0 };

    flights.push({
      id: `${flightNumber}-${date}`,
      flightNumber,
      airline: {
        code: airline.code,
        name: airline.name,
        logo: airline.logo,
        type: airline.type
      },
      from,
      to,
      date,
      departure: {
        time: departureTime,
        terminal: `T${Math.floor(Math.random() * 2) + 1}`
      },
      arrival: {
        time: arrivalTime,
        terminal: `T${Math.floor(Math.random() * 2) + 1}`,
        nextDay: arrivalMinutes < depHour * 60 + depMin
      },
      duration: `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`,
      durationMinutes,
      ...stopInfo,
      prices: {
        economy: {
          base: economyPrice,
          taxes: Math.round(economyPrice * 0.18),
          total: Math.round(economyPrice * 1.18)
        },
        business: {
          base: businessPrice,
          taxes: Math.round(businessPrice * 0.18),
          total: Math.round(businessPrice * 1.18)
        }
      },
      seatsAvailable: {
        economy: Math.floor(Math.random() * 30) + 5,
        business: Math.floor(Math.random() * 8) + 2
      },
      amenities: airline.type === 'full-service' 
        ? ['Meal Included', 'Entertainment', 'Wi-Fi', 'Extra Legroom']
        : ['Snacks Available', 'Web Check-in'],
      baggage: {
        cabin: '7 kg',
        checkIn: airline.type === 'full-service' ? '25 kg' : '15 kg'
      },
      refundable: Math.random() > 0.6
    });
  });

  // Sort by departure time
  return flights.sort((a, b) => a.departure.time.localeCompare(b.departure.time));
};

// Search flights with filters
const searchFlights = (params) => {
  const { from, to, date, returnDate, travelers, cabinClass, filters } = params;

  let outboundFlights = generateFlights(from, to, date, travelers);
  let returnFlights = returnDate ? generateFlights(to, from, returnDate, travelers) : [];

  // Apply filters
  if (filters) {
    const applyFilters = (flights) => {
      return flights.filter(flight => {
        // Price filter
        if (filters.maxPrice && flight.prices[cabinClass || 'economy'].total > filters.maxPrice) {
          return false;
        }
        // Airline filter
        if (filters.airlines && filters.airlines.length > 0 && 
            !filters.airlines.includes(flight.airline.code)) {
          return false;
        }
        // Stops filter
        if (filters.maxStops !== undefined && flight.stops > filters.maxStops) {
          return false;
        }
        // Time filter
        if (filters.departureTime) {
          const depHour = parseInt(flight.departure.time.split(':')[0]);
          if (filters.departureTime === 'morning' && (depHour < 6 || depHour >= 12)) return false;
          if (filters.departureTime === 'afternoon' && (depHour < 12 || depHour >= 18)) return false;
          if (filters.departureTime === 'evening' && depHour < 18) return false;
        }
        return true;
      });
    };

    outboundFlights = applyFilters(outboundFlights);
    if (returnFlights.length > 0) {
      returnFlights = applyFilters(returnFlights);
    }
  }

  return {
    outbound: outboundFlights,
    return: returnFlights,
    summary: {
      cheapest: outboundFlights.length > 0 ? 
        Math.min(...outboundFlights.map(f => f.prices.economy.total)) : null,
      fastest: outboundFlights.length > 0 ?
        Math.min(...outboundFlights.map(f => f.durationMinutes)) : null,
      totalOptions: outboundFlights.length
    }
  };
};

// Get popular routes with current pricing
const getPopularRoutes = () => {
  const popularPairs = [
    ['DEL', 'BOM'], ['DEL', 'BLR'], ['BOM', 'BLR'],
    ['DEL', 'GOI'], ['BOM', 'GOI'], ['DEL', 'JAI'],
    ['DEL', 'SXR'], ['BOM', 'HYD'], ['DEL', 'VNS']
  ];

  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const dateStr = nextWeek.toISOString().split('T')[0];

  return popularPairs.map(([from, to]) => {
    const flights = generateFlights(from, to, dateStr);
    const cheapest = flights.length > 0 ?
      Math.min(...flights.map(f => f.prices.economy.total)) : null;
    
    return {
      from,
      to,
      startingFrom: cheapest,
      route: routes.find(r => r.from === from && r.to === to)
    };
  });
};

module.exports = {
  airlines,
  routes,
  timeSlots,
  priceModifiers,
  generateFlights,
  searchFlights,
  getPopularRoutes
};
