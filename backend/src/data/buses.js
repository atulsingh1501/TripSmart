// Indian Bus Services Data
// Based on popular bus operators and routes in India

const busOperators = [
  { id: 'rsrtc', name: 'RSRTC (Rajasthan Roadways)', type: 'government', rating: 3.8 },
  { id: 'ksrtc', name: 'KSRTC (Karnataka)', type: 'government', rating: 4.0 },
  { id: 'apsrtc', name: 'APSRTC (Andhra Pradesh)', type: 'government', rating: 3.9 },
  { id: 'tsrtc', name: 'TSRTC (Telangana)', type: 'government', rating: 3.8 },
  { id: 'gsrtc', name: 'GSRTC (Gujarat)', type: 'government', rating: 3.7 },
  { id: 'msrtc', name: 'MSRTC (Maharashtra)', type: 'government', rating: 3.6 },
  { id: 'upsrtc', name: 'UPSRTC (Uttar Pradesh)', type: 'government', rating: 3.5 },
  { id: 'hrtc', name: 'HRTC (Himachal Pradesh)', type: 'government', rating: 4.1 },
  { id: 'ktcl', name: 'KTCL (Goa)', type: 'government', rating: 3.9 },
  
  // Private operators
  { id: 'vrl', name: 'VRL Travels', type: 'private', rating: 4.2 },
  { id: 'srs', name: 'SRS Travels', type: 'private', rating: 4.1 },
  { id: 'neeta', name: 'Neeta Tours & Travels', type: 'private', rating: 4.0 },
  { id: 'paulo', name: 'Paulo Travels', type: 'private', rating: 4.3 },
  { id: 'orange', name: 'Orange Tours', type: 'private', rating: 4.1 },
  { id: 'intercity', name: 'IntrCity SmartBus', type: 'private', rating: 4.4 },
  { id: 'greenline', name: 'Greenline Travels', type: 'private', rating: 4.0 },
  { id: 'abhibus', name: 'Chartered Bus (AbhiBus)', type: 'aggregator', rating: 4.0 },
  { id: 'yatra', name: 'Yatra Bus', type: 'private', rating: 3.9 }
];

const busTypes = [
  { code: 'ORD', name: 'Ordinary', ac: false, sleeper: false, priceMultiplier: 1.0 },
  { code: 'EXP', name: 'Express', ac: false, sleeper: false, priceMultiplier: 1.2 },
  { code: 'DLX', name: 'Deluxe', ac: false, sleeper: false, priceMultiplier: 1.4 },
  { code: 'SUP', name: 'Super Deluxe', ac: false, sleeper: false, priceMultiplier: 1.6 },
  { code: 'SLP', name: 'Sleeper', ac: false, sleeper: true, priceMultiplier: 1.8 },
  { code: 'ACC', name: 'AC Seater', ac: true, sleeper: false, priceMultiplier: 2.0 },
  { code: 'ACS', name: 'AC Sleeper', ac: true, sleeper: true, priceMultiplier: 2.5 },
  { code: 'VOL', name: 'Volvo AC', ac: true, sleeper: false, priceMultiplier: 2.8 },
  { code: 'VOS', name: 'Volvo AC Sleeper', ac: true, sleeper: true, priceMultiplier: 3.2 },
  { code: 'MUL', name: 'Multi-Axle Volvo', ac: true, sleeper: true, priceMultiplier: 3.5 },
  { code: 'SCN', name: 'Scania', ac: true, sleeper: true, priceMultiplier: 3.8 },
  { code: 'MER', name: 'Mercedes', ac: true, sleeper: true, priceMultiplier: 4.0 }
];

// Popular bus routes with base prices (per km rate in paisa)
const busRoutes = [
  // Delhi routes
  { from: 'DEL', to: 'JAI', distance: 280, duration: 5.5, basePricePerKm: 150, operators: ['rsrtc', 'vrl', 'intercity'] },
  { from: 'DEL', to: 'AGR', distance: 200, duration: 4, basePricePerKm: 140, operators: ['upsrtc', 'intercity'] },
  { from: 'DEL', to: 'SHL', distance: 350, duration: 8, basePricePerKm: 160, operators: ['hrtc', 'intercity'] },
  { from: 'DEL', to: 'DHR', distance: 290, duration: 6, basePricePerKm: 150, operators: ['hrtc'] },
  { from: 'DEL', to: 'RIK', distance: 250, duration: 6, basePricePerKm: 145, operators: ['upsrtc', 'intercity'] },
  { from: 'DEL', to: 'VNS', distance: 800, duration: 14, basePricePerKm: 130, operators: ['upsrtc', 'neeta'] },
  { from: 'DEL', to: 'LKO', distance: 550, duration: 9, basePricePerKm: 135, operators: ['upsrtc', 'intercity'] },
  
  // Mumbai routes
  { from: 'BOM', to: 'GOI', distance: 590, duration: 10, basePricePerKm: 140, operators: ['msrtc', 'paulo', 'neeta'] },
  { from: 'BOM', to: 'PNQ', distance: 150, duration: 3.5, basePricePerKm: 160, operators: ['msrtc', 'neeta', 'intercity'] },
  { from: 'BOM', to: 'BLR', distance: 980, duration: 16, basePricePerKm: 130, operators: ['vrl', 'srs', 'orange'] },
  { from: 'BOM', to: 'HYD', distance: 710, duration: 12, basePricePerKm: 135, operators: ['vrl', 'orange'] },
  { from: 'BOM', to: 'AMD', distance: 530, duration: 8, basePricePerKm: 145, operators: ['gsrtc', 'neeta', 'vrl'] },
  { from: 'BOM', to: 'NAG', distance: 840, duration: 14, basePricePerKm: 125, operators: ['msrtc', 'vrl'] },
  
  // Bangalore routes
  { from: 'BLR', to: 'MAA', distance: 350, duration: 6, basePricePerKm: 150, operators: ['ksrtc', 'srs', 'orange'] },
  { from: 'BLR', to: 'HYD', distance: 570, duration: 9, basePricePerKm: 140, operators: ['ksrtc', 'orange', 'srs'] },
  { from: 'BLR', to: 'GOI', distance: 560, duration: 10, basePricePerKm: 145, operators: ['ksrtc', 'paulo', 'vrl'] },
  { from: 'BLR', to: 'MYS', distance: 150, duration: 3, basePricePerKm: 155, operators: ['ksrtc'] },
  { from: 'BLR', to: 'COK', distance: 550, duration: 10, basePricePerKm: 145, operators: ['ksrtc'] },
  { from: 'BLR', to: 'OOT', distance: 270, duration: 6, basePricePerKm: 160, operators: ['ksrtc'] },
  
  // Hyderabad routes
  { from: 'HYD', to: 'MAA', distance: 630, duration: 10, basePricePerKm: 135, operators: ['tsrtc', 'orange'] },
  { from: 'HYD', to: 'BLR', distance: 570, duration: 9, basePricePerKm: 140, operators: ['tsrtc', 'orange', 'srs'] },
  { from: 'HYD', to: 'VIZ', distance: 600, duration: 10, basePricePerKm: 130, operators: ['apsrtc', 'orange'] },
  { from: 'HYD', to: 'TIR', distance: 550, duration: 9, basePricePerKm: 135, operators: ['apsrtc', 'tsrtc'] },
  
  // Goa routes
  { from: 'GOI', to: 'BOM', distance: 590, duration: 10, basePricePerKm: 140, operators: ['ktcl', 'paulo', 'neeta'] },
  { from: 'GOI', to: 'BLR', distance: 560, duration: 10, basePricePerKm: 145, operators: ['ktcl', 'paulo', 'vrl'] },
  { from: 'GOI', to: 'PNQ', distance: 450, duration: 8, basePricePerKm: 145, operators: ['ktcl', 'paulo'] },
  
  // Rajasthan routes
  { from: 'JAI', to: 'UDR', distance: 400, duration: 7, basePricePerKm: 145, operators: ['rsrtc', 'intercity'] },
  { from: 'JAI', to: 'JDH', distance: 340, duration: 6, basePricePerKm: 140, operators: ['rsrtc'] },
  { from: 'JAI', to: 'JSM', distance: 560, duration: 10, basePricePerKm: 135, operators: ['rsrtc'] },
  { from: 'JAI', to: 'DEL', distance: 280, duration: 5.5, basePricePerKm: 150, operators: ['rsrtc', 'vrl', 'intercity'] },
  
  // Kerala routes
  { from: 'COK', to: 'TVM', distance: 220, duration: 5, basePricePerKm: 150, operators: ['ksrtc'] },
  { from: 'COK', to: 'MUN', distance: 130, duration: 4, basePricePerKm: 160, operators: ['ksrtc'] },
  { from: 'COK', to: 'ALY', distance: 55, duration: 1.5, basePricePerKm: 170, operators: ['ksrtc'] }
];

// Calculate bus fare
const calculateBusFare = (distance, busType, operatorType) => {
  const type = busTypes.find(t => t.code === busType) || busTypes[0];
  const baseFare = distance * 0.8; // Base rate: ₹0.80 per km
  
  let fare = baseFare * type.priceMultiplier;
  
  // Government buses are typically cheaper
  if (operatorType === 'government') {
    fare *= 0.85;
  }
  
  return {
    baseFare: Math.round(fare),
    serviceTax: Math.round(fare * 0.05),
    gst: Math.round(fare * 0.05),
    total: Math.round(fare * 1.10)
  };
};

// Generate bus options for a route
const generateBuses = (from, to, date) => {
  const route = busRoutes.find(r => 
    (r.from === from && r.to === to) || (r.from === to && r.to === from)
  );
  
  if (!route) return [];
  
  const buses = [];
  const travelDate = new Date(date);
  
  // Generate 5-10 bus options
  const numBuses = Math.floor(Math.random() * 6) + 5;
  
  for (let i = 0; i < numBuses; i++) {
    const operator = busOperators.find(o => 
      route.operators.includes(o.id)
    ) || busOperators[Math.floor(Math.random() * busOperators.length)];
    
    // Select bus type based on operator
    const availableTypes = operator.type === 'government' ? 
      busTypes.filter(t => ['ORD', 'EXP', 'DLX', 'SUP', 'SLP', 'ACC'].includes(t.code)) :
      busTypes.filter(t => ['VOL', 'VOS', 'MUL', 'ACS', 'ACC'].includes(t.code));
    
    const busType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    
    // Generate departure time
    const depHour = Math.floor(Math.random() * 18) + 5; // 5 AM to 11 PM
    const depMin = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
    const departureTime = `${depHour.toString().padStart(2, '0')}:${depMin.toString().padStart(2, '0')}`;
    
    // Calculate arrival time
    const durationMinutes = route.duration * 60 + Math.floor(Math.random() * 60) - 30;
    const arrivalMinutes = (depHour * 60 + depMin + durationMinutes) % (24 * 60);
    const arrHour = Math.floor(arrivalMinutes / 60);
    const arrMin = arrivalMinutes % 60;
    const arrivalTime = `${arrHour.toString().padStart(2, '0')}:${arrMin.toString().padStart(2, '0')}`;
    
    const fare = calculateBusFare(route.distance, busType.code, operator.type);
    
    buses.push({
      id: `BUS-${Date.now()}-${i}`,
      operator: {
        id: operator.id,
        name: operator.name,
        type: operator.type,
        rating: operator.rating
      },
      busType: {
        code: busType.code,
        name: busType.name,
        ac: busType.ac,
        sleeper: busType.sleeper
      },
      from,
      to,
      date,
      departure: departureTime,
      arrival: arrivalTime,
      duration: `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`,
      distance: route.distance,
      fare,
      seatsAvailable: Math.floor(Math.random() * 30) + 5,
      amenities: busType.ac ? 
        ['AC', 'Charging Point', 'Reading Light', 'Blanket'] :
        ['Fan', 'Charging Point'],
      boardingPoints: [
        { name: 'Main Bus Stand', time: departureTime },
        { name: 'Highway Pickup', time: `${(depHour + 1).toString().padStart(2, '0')}:${depMin.toString().padStart(2, '0')}` }
      ],
      droppingPoints: [
        { name: 'Main Bus Stand', time: arrivalTime },
        { name: 'City Center', time: `${(arrHour).toString().padStart(2, '0')}:${((arrMin + 15) % 60).toString().padStart(2, '0')}` }
      ],
      cancellationPolicy: operator.type === 'private' ? 
        'Free cancellation up to 24 hours before departure' :
        'Partial refund up to 12 hours before departure'
    });
  }
  
  return buses.sort((a, b) => a.departure.localeCompare(b.departure));
};

// Search buses
const searchBuses = (params) => {
  const { from, to, date } = params;
  
  const buses = generateBuses(from, to, date);
  
  return {
    buses,
    totalFound: buses.length,
    searchParams: { from, to, date },
    priceRange: buses.length > 0 ? {
      min: Math.min(...buses.map(b => b.fare.total)),
      max: Math.max(...buses.map(b => b.fare.total))
    } : null
  };
};

module.exports = {
  busOperators,
  busTypes,
  busRoutes,
  calculateBusFare,
  generateBuses,
  searchBuses
};
