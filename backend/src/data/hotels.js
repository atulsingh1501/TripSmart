// Realistic Indian Hotels and Accommodation Data
// Based on actual hotel chains and pricing patterns in India

const fs = require('fs');
const path = require('path');

// Load real hotel data from CSV
let realHotelData = [];
try {
  const csvPath = path.join(__dirname, '../../hotel_details.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n').slice(1); // Skip header

  realHotelData = lines
    .filter(line => line.trim())
    .map(line => {
      // Parse CSV line (handling quoted fields with commas)
      const matches = line.match(/("([^"]*)")|([^,]+)/g) || [];
      const fields = matches.map(f => f.replace(/^"|"$/g, '').trim());

      const [name, place, description, condition, rating, reviews] = fields;

      // Parse rating to number (e.g., "8.4" -> 8.4)
      const numRating = parseFloat(rating) || 0;

      // Parse reviews count (e.g., "2,509 reviews" -> 2509)
      const reviewCount = parseInt((reviews || '0').replace(/,/g, '').replace(' reviews', '')) || 0;

      // Extract city from place (e.g., "Taj Ganj, Agra" -> "Agra")
      const cityMatch = place?.match(/,?\s*([A-Za-z]+)$/);
      const city = cityMatch ? cityMatch[1] : place;

      return {
        name: name || '',
        place: place || '',
        city: city || '',
        description: description || '',
        condition: condition || '',
        rating: numRating,
        reviewCount: reviewCount,
        // Map rating (out of 10) to stars (out of 5)
        stars: numRating >= 9 ? 5 :
          numRating >= 8 ? 4 :
            numRating >= 7 ? 3 :
              numRating >= 6 ? 2 : 1
      };
    })
    .filter(h => h.name && h.city);

  console.log(`Loaded ${realHotelData.length} hotels from hotel_details.csv`);
} catch (error) {
  console.warn('Could not load hotel_details.csv:', error.message);
}

// City name to code mapping
const cityNameToCode = {
  'Agra': 'AGR',
  'Ahmedabad': 'AMD',
  'Ajmer': 'AJM',
  'Alleppey': 'ALP',
  'Bangalore': 'BLR',
  'Mumbai': 'BOM',
  'Chennai': 'MAA',
  'Delhi': 'DEL',
  'Goa': 'GOI',
  'Hyderabad': 'HYD',
  'Jaipur': 'JAI',
  'Kolkata': 'CCU',
  'Kochi': 'COK',
  'Udaipur': 'UDR',
  'Varanasi': 'VNS',
  'Srinagar': 'SXR',
  'Leh': 'IXL',
  'Amritsar': 'ATR',
  'Pune': 'PNE',
  'Shimla': 'SML',
  'Manali': 'MNL',
  'Rishikesh': 'RSK'
};

// Reverse mapping
const cityCodeToName = Object.fromEntries(
  Object.entries(cityNameToCode).map(([name, code]) => [code, name])
);

// Get hotels from CSV by city
const getHotelsFromCSV = (cityCode) => {
  const cityName = cityCodeToName[cityCode];
  if (!cityName) return [];

  return realHotelData.filter(h =>
    h.city.toLowerCase() === cityName.toLowerCase()
  );
};
const hotelChains = [
  // Luxury (5-star)
  { id: 'taj', name: 'Taj Hotels', stars: 5, type: 'luxury', priceRange: { min: 12000, max: 80000 } },
  { id: 'oberoi', name: 'The Oberoi Group', stars: 5, type: 'luxury', priceRange: { min: 15000, max: 100000 } },
  { id: 'itc', name: 'ITC Hotels', stars: 5, type: 'luxury', priceRange: { min: 10000, max: 50000 } },
  { id: 'leela', name: 'The Leela Palaces', stars: 5, type: 'luxury', priceRange: { min: 12000, max: 75000 } },
  { id: 'marriott', name: 'JW Marriott', stars: 5, type: 'luxury', priceRange: { min: 10000, max: 45000 } },
  { id: 'hyatt', name: 'Grand Hyatt', stars: 5, type: 'luxury', priceRange: { min: 9000, max: 40000 } },

  // Premium (4-5 star)
  { id: 'radisson', name: 'Radisson', stars: 4, type: 'premium', priceRange: { min: 5000, max: 20000 } },
  { id: 'holiday-inn', name: 'Holiday Inn', stars: 4, type: 'premium', priceRange: { min: 4500, max: 15000 } },
  { id: 'courtyard', name: 'Courtyard by Marriott', stars: 4, type: 'premium', priceRange: { min: 5000, max: 18000 } },
  { id: 'novotel', name: 'Novotel', stars: 4, type: 'premium', priceRange: { min: 4000, max: 15000 } },
  { id: 'vivanta', name: 'Vivanta by Taj', stars: 4, type: 'premium', priceRange: { min: 6000, max: 20000 } },
  { id: 'lemon-tree', name: 'Lemon Tree Premier', stars: 4, type: 'premium', priceRange: { min: 3500, max: 10000 } },

  // Mid-Range (3-4 star)
  { id: 'fortune', name: 'Fortune Hotels', stars: 3, type: 'mid-range', priceRange: { min: 2500, max: 8000 } },
  { id: 'lemon-tree-std', name: 'Lemon Tree', stars: 3, type: 'mid-range', priceRange: { min: 2500, max: 6000 } },
  { id: 'ibis', name: 'Ibis', stars: 3, type: 'mid-range', priceRange: { min: 2000, max: 5500 } },
  { id: 'ginger', name: 'Ginger Hotels', stars: 3, type: 'mid-range', priceRange: { min: 1800, max: 4500 } },
  { id: 'fern', name: 'The Fern', stars: 3, type: 'mid-range', priceRange: { min: 2500, max: 7000 } },
  { id: 'pride', name: 'Pride Hotels', stars: 3, type: 'mid-range', priceRange: { min: 2200, max: 6000 } },

  // Budget (2-3 star)
  { id: 'oyo', name: 'OYO Rooms', stars: 2, type: 'budget', priceRange: { min: 800, max: 2500 } },
  { id: 'treebo', name: 'Treebo Hotels', stars: 2, type: 'budget', priceRange: { min: 1000, max: 3000 } },
  { id: 'fabhotel', name: 'FabHotels', stars: 2, type: 'budget', priceRange: { min: 900, max: 2800 } },
  { id: 'zostel', name: 'Zostel', stars: 2, type: 'hostel', priceRange: { min: 400, max: 1500 } },
  { id: 'goibibo-go', name: 'goSTAYS', stars: 2, type: 'budget', priceRange: { min: 700, max: 2000 } },

  // Boutique & Heritage
  { id: 'neemrana', name: 'Neemrana Hotels', stars: 4, type: 'heritage', priceRange: { min: 5000, max: 25000 } },
  { id: 'cgh-earth', name: 'CGH Earth', stars: 4, type: 'boutique', priceRange: { min: 8000, max: 35000 } },
  { id: 'evolve-back', name: 'Evolve Back', stars: 5, type: 'boutique', priceRange: { min: 20000, max: 80000 } },
  { id: 'suryagarh', name: 'Suryagarh', stars: 5, type: 'heritage', priceRange: { min: 15000, max: 50000 } },

  // Resorts
  { id: 'club-mahindra', name: 'Club Mahindra', stars: 4, type: 'resort', priceRange: { min: 6000, max: 20000 } },
  { id: 'sterling', name: 'Sterling Resorts', stars: 3, type: 'resort', priceRange: { min: 4000, max: 12000 } },
  { id: 'taj-exotica', name: 'Taj Exotica', stars: 5, type: 'resort', priceRange: { min: 20000, max: 100000 } }
];

// Room types with amenities
const roomTypes = [
  { type: 'standard', name: 'Standard Room', sizeRange: '180-250 sq ft', priceMultiplier: 1.0 },
  { type: 'superior', name: 'Superior Room', sizeRange: '250-350 sq ft', priceMultiplier: 1.3 },
  { type: 'deluxe', name: 'Deluxe Room', sizeRange: '350-450 sq ft', priceMultiplier: 1.6 },
  { type: 'premium', name: 'Premium Room', sizeRange: '400-500 sq ft', priceMultiplier: 2.0 },
  { type: 'suite', name: 'Suite', sizeRange: '600-800 sq ft', priceMultiplier: 2.8 },
  { type: 'executive-suite', name: 'Executive Suite', sizeRange: '800-1200 sq ft', priceMultiplier: 3.5 },
  { type: 'presidential', name: 'Presidential Suite', sizeRange: '1500+ sq ft', priceMultiplier: 6.0 }
];

// Amenities by hotel type
const amenitiesByType = {
  luxury: ['Free WiFi', 'Swimming Pool', 'Spa', 'Fitness Center', '24/7 Room Service', 'Restaurant', 'Bar', 'Concierge', 'Valet Parking', 'Business Center', 'Laundry Service', 'Airport Transfer'],
  premium: ['Free WiFi', 'Swimming Pool', 'Fitness Center', 'Restaurant', 'Room Service', 'Parking', 'Business Center', 'Laundry'],
  'mid-range': ['Free WiFi', 'Restaurant', 'Room Service', 'Parking', 'Laundry'],
  budget: ['Free WiFi', 'Housekeeping', 'TV'],
  hostel: ['Free WiFi', 'Common Kitchen', 'Lockers', 'Common Room'],
  heritage: ['Free WiFi', 'Heritage Walk', 'Cultural Activities', 'Restaurant', 'Spa', 'Pool'],
  boutique: ['Free WiFi', 'Unique Decor', 'Restaurant', 'Personalized Service', 'Local Experiences'],
  resort: ['Free WiFi', 'Swimming Pool', 'Spa', 'Multiple Restaurants', 'Activities', 'Kids Club', 'Beach/Mountain Access']
};

// City-specific hotel listings
const cityHotels = {
  DEL: [
    { chainId: 'taj', propertyName: 'Taj Palace', location: 'Diplomatic Enclave', rating: 4.8 },
    { chainId: 'oberoi', propertyName: 'The Oberoi', location: 'Dr. Zakir Hussain Marg', rating: 4.9 },
    { chainId: 'itc', propertyName: 'ITC Maurya', location: 'Diplomatic Enclave', rating: 4.7 },
    { chainId: 'leela', propertyName: 'The Leela Palace', location: 'Diplomatic Enclave', rating: 4.9 },
    { chainId: 'marriott', propertyName: 'JW Marriott Aerocity', location: 'Aerocity', rating: 4.6 },
    { chainId: 'radisson', propertyName: 'Radisson Blu Plaza', location: 'Mahipalpur', rating: 4.3 },
    { chainId: 'holiday-inn', propertyName: 'Holiday Inn Aerocity', location: 'Aerocity', rating: 4.2 },
    { chainId: 'lemon-tree', propertyName: 'Lemon Tree Premier', location: 'Aerocity', rating: 4.0 },
    { chainId: 'ibis', propertyName: 'Ibis New Delhi Aerocity', location: 'Aerocity', rating: 3.8 },
    { chainId: 'ginger', propertyName: 'Ginger New Delhi', location: 'Railway Colony', rating: 3.5 },
    { chainId: 'oyo', propertyName: 'OYO Townhouse', location: 'Karol Bagh', rating: 3.3 },
    { chainId: 'zostel', propertyName: 'Zostel Delhi', location: 'Paharganj', rating: 4.0 }
  ],
  BOM: [
    { chainId: 'taj', propertyName: 'Taj Mahal Palace', location: 'Apollo Bunder', rating: 4.9, heritage: true },
    { chainId: 'oberoi', propertyName: 'The Oberoi Mumbai', location: 'Nariman Point', rating: 4.8 },
    { chainId: 'itc', propertyName: 'ITC Maratha', location: 'Andheri East', rating: 4.6 },
    { chainId: 'trident', propertyName: 'Trident Nariman Point', location: 'Nariman Point', rating: 4.7 },
    { chainId: 'marriott', propertyName: 'JW Marriott Mumbai Juhu', location: 'Juhu', rating: 4.5 },
    { chainId: 'hyatt', propertyName: 'Grand Hyatt Mumbai', location: 'Santacruz East', rating: 4.6 },
    { chainId: 'radisson', propertyName: 'Radisson Blu Mumbai', location: 'Andheri MIDC', rating: 4.2 },
    { chainId: 'novotel', propertyName: 'Novotel Mumbai Juhu Beach', location: 'Juhu', rating: 4.1 },
    { chainId: 'lemon-tree-std', propertyName: 'Lemon Tree Mumbai', location: 'Andheri East', rating: 3.7 },
    { chainId: 'ginger', propertyName: 'Ginger Mumbai Andheri', location: 'Andheri East', rating: 3.5 },
    { chainId: 'treebo', propertyName: 'Treebo Trip', location: 'Andheri', rating: 3.6 }
  ],
  GOI: [
    { chainId: 'taj-exotica', propertyName: 'Taj Exotica Resort & Spa', location: 'Benaulim', rating: 4.9 },
    { chainId: 'leela', propertyName: 'The Leela Goa', location: 'Cavelossim', rating: 4.8 },
    { chainId: 'marriott', propertyName: 'Goa Marriott Resort', location: 'Miramar', rating: 4.5 },
    { chainId: 'novotel', propertyName: 'Novotel Goa Dona Sylvia', location: 'Cavelossim', rating: 4.3 },
    { chainId: 'radisson', propertyName: 'Radisson Goa Candolim', location: 'Candolim', rating: 4.2 },
    { chainId: 'fortune', propertyName: 'Fortune Miramar', location: 'Panaji', rating: 3.9 },
    { chainId: 'club-mahindra', propertyName: 'Club Mahindra Varca Beach', location: 'Varca', rating: 4.1 },
    { chainId: 'oyo', propertyName: 'OYO Calangute', location: 'Calangute', rating: 3.4 },
    { chainId: 'zostel', propertyName: 'Zostel Goa Anjuna', location: 'Anjuna', rating: 4.2 }
  ],
  JAI: [
    { chainId: 'oberoi', propertyName: 'The Oberoi Rajvilas', location: 'Goner Road', rating: 4.9 },
    { chainId: 'taj', propertyName: 'Rambagh Palace', location: 'Bhawani Singh Road', rating: 4.9, heritage: true },
    { chainId: 'itc', propertyName: 'ITC Rajputana', location: 'Palace Road', rating: 4.6 },
    { chainId: 'leela', propertyName: 'The Leela Palace Jaipur', location: 'Outside City', rating: 4.8 },
    { chainId: 'marriott', propertyName: 'Fairmont Jaipur', location: 'Kukas', rating: 4.5 },
    { chainId: 'radisson', propertyName: 'Radisson Jaipur City Center', location: 'Tonk Road', rating: 4.2 },
    { chainId: 'holiday-inn', propertyName: 'Holiday Inn Jaipur', location: 'Amer Road', rating: 4.0 },
    { chainId: 'lemon-tree-std', propertyName: 'Lemon Tree Jaipur', location: 'Kukas', rating: 3.8 },
    { chainId: 'treebo', propertyName: 'Treebo Trend Heritage', location: 'MI Road', rating: 3.5 },
    { chainId: 'zostel', propertyName: 'Zostel Jaipur', location: 'Bani Park', rating: 4.1 }
  ],
  UDR: [
    { chainId: 'oberoi', propertyName: 'The Oberoi Udaivilas', location: 'Lake Pichola', rating: 4.9 },
    { chainId: 'taj', propertyName: 'Taj Lake Palace', location: 'Lake Pichola', rating: 4.9, heritage: true },
    { chainId: 'leela', propertyName: 'The Leela Palace Udaipur', location: 'Lake Pichola', rating: 4.8 },
    { chainId: 'itc', propertyName: 'Trident Udaipur', location: 'Lake Pichola', rating: 4.5 },
    { chainId: 'radisson', propertyName: 'Radisson Udaipur', location: 'Goverdhan Vilas', rating: 4.1 },
    { chainId: 'lemon-tree-std', propertyName: 'Lemon Tree Udaipur', location: 'Bhilon Ki Chowki', rating: 3.7 },
    { chainId: 'treebo', propertyName: 'Treebo Trend', location: 'Lake Palace Road', rating: 3.4 },
    { chainId: 'zostel', propertyName: 'Zostel Udaipur', location: 'Gangaur Ghat', rating: 4.2 }
  ],
  VNS: [
    { chainId: 'taj', propertyName: 'Taj Ganges', location: 'Nadesar', rating: 4.7 },
    { chainId: 'radisson', propertyName: 'Radisson Hotel Varanasi', location: 'The Mall', rating: 4.2 },
    { chainId: 'marriott', propertyName: 'Fairfield by Marriott', location: 'Sigra', rating: 4.1 },
    { chainId: 'fortune', propertyName: 'Fortune D Savoy', location: 'Cantt', rating: 3.8 },
    { chainId: 'treebo', propertyName: 'Treebo Trend', location: 'Assi Ghat', rating: 3.5 },
    { chainId: 'oyo', propertyName: 'OYO Ghat View', location: 'Dashashwamedh', rating: 3.3 },
    { chainId: 'zostel', propertyName: 'Zostel Varanasi', location: 'Assi Ghat', rating: 4.3 }
  ],
  COK: [
    { chainId: 'taj', propertyName: 'Taj Malabar Resort & Spa', location: 'Willingdon Island', rating: 4.7 },
    { chainId: 'marriott', propertyName: 'Kochi Marriott Hotel', location: 'Lulu Mall Road', rating: 4.5 },
    { chainId: 'cgh-earth', propertyName: 'Brunton Boatyard', location: 'Fort Kochi', rating: 4.6, heritage: true },
    { chainId: 'radisson', propertyName: 'Radisson Blu Kochi', location: 'Kaloor', rating: 4.2 },
    { chainId: 'holiday-inn', propertyName: 'Holiday Inn Cochin', location: 'Ernakulam', rating: 4.0 },
    { chainId: 'treebo', propertyName: 'Treebo Trend Fort Kochi', location: 'Fort Kochi', rating: 3.6 },
    { chainId: 'zostel', propertyName: 'Zostel Kochi', location: 'Fort Kochi', rating: 4.1 }
  ],
  BLR: [
    { chainId: 'taj', propertyName: 'Taj West End', location: 'Race Course Road', rating: 4.8 },
    { chainId: 'oberoi', propertyName: 'The Oberoi', location: 'MG Road', rating: 4.7 },
    { chainId: 'itc', propertyName: 'ITC Gardenia', location: 'Residency Road', rating: 4.6 },
    { chainId: 'leela', propertyName: 'The Leela Palace', location: 'HAL Airport Road', rating: 4.9 },
    { chainId: 'marriott', propertyName: 'JW Marriott', location: 'Vittal Mallya Road', rating: 4.5 },
    { chainId: 'hyatt', propertyName: 'Conrad Bengaluru', location: 'Ulsoor', rating: 4.6 },
    { chainId: 'radisson', propertyName: 'Radisson Blu Atria', location: 'Palace Road', rating: 4.2 },
    { chainId: 'novotel', propertyName: 'Novotel Bengaluru Techpark', location: 'ITPL', rating: 4.1 },
    { chainId: 'lemon-tree-std', propertyName: 'Lemon Tree Premier', location: 'Whitefield', rating: 3.8 },
    { chainId: 'ginger', propertyName: 'Ginger Bangalore', location: 'Whitefield', rating: 3.5 },
    { chainId: 'oyo', propertyName: 'OYO Townhouse', location: 'Koramangala', rating: 3.4 },
    { chainId: 'zostel', propertyName: 'Zostel Bangalore', location: 'Indiranagar', rating: 4.0 }
  ],
  MAA: [
    { chainId: 'taj', propertyName: 'Taj Coromandel', location: 'Nungambakkam', rating: 4.7 },
    { chainId: 'itc', propertyName: 'ITC Grand Chola', location: 'Guindy', rating: 4.8 },
    { chainId: 'leela', propertyName: 'The Leela Palace', location: 'Adyar', rating: 4.7 },
    { chainId: 'marriott', propertyName: 'Chennai Marriott', location: 'OMR', rating: 4.4 },
    { chainId: 'hyatt', propertyName: 'Hyatt Regency', location: 'Anna Salai', rating: 4.5 },
    { chainId: 'radisson', propertyName: 'Radisson Blu', location: 'Egmore', rating: 4.2 },
    { chainId: 'novotel', propertyName: 'Novotel Chennai', location: 'Sipcot', rating: 4.0 },
    { chainId: 'lemon-tree-std', propertyName: 'Lemon Tree', location: 'Guindy', rating: 3.7 },
    { chainId: 'zostel', propertyName: 'Zostel Chennai', location: 'Nungambakkam', rating: 4.0 }
  ],
  HYD: [
    { chainId: 'taj', propertyName: 'Taj Falaknuma Palace', location: 'Falaknuma', rating: 4.9, heritage: true },
    { chainId: 'itc', propertyName: 'ITC Kakatiya', location: 'Begumpet', rating: 4.6 },
    { chainId: 'marriott', propertyName: 'Hyderabad Marriott', location: 'Tank Bund', rating: 4.5 },
    { chainId: 'hyatt', propertyName: 'Park Hyatt Hyderabad', location: 'Banjara Hills', rating: 4.7 },
    { chainId: 'radisson', propertyName: 'Radisson Blu Plaza', location: 'Banjara Hills', rating: 4.2 },
    { chainId: 'novotel', propertyName: 'Novotel HICC', location: 'HICC', rating: 4.1 },
    { chainId: 'lemon-tree-std', propertyName: 'Lemon Tree', location: 'Gachibowli', rating: 3.7 },
    { chainId: 'treebo', propertyName: 'Treebo Trend', location: 'Jubilee Hills', rating: 3.5 },
    { chainId: 'zostel', propertyName: 'Zostel Hyderabad', location: 'Banjara Hills', rating: 4.1 }
  ],
  CCU: [
    { chainId: 'taj', propertyName: 'Taj Bengal', location: 'Alipore', rating: 4.7 },
    { chainId: 'oberoi', propertyName: 'The Oberoi Grand', location: 'Chowringhee', rating: 4.8, heritage: true },
    { chainId: 'itc', propertyName: 'ITC Sonar', location: 'New Town', rating: 4.5 },
    { chainId: 'marriott', propertyName: 'JW Marriott', location: 'Park Street', rating: 4.4 },
    { chainId: 'hyatt', propertyName: 'Hyatt Regency', location: 'Salt Lake', rating: 4.3 },
    { chainId: 'radisson', propertyName: 'Radisson Kolkata', location: 'Rajarhat', rating: 4.1 },
    { chainId: 'novotel', propertyName: 'Novotel Kolkata', location: 'Sector 5', rating: 4.0 },
    { chainId: 'lemon-tree-std', propertyName: 'Lemon Tree', location: 'Salt Lake', rating: 3.6 },
    { chainId: 'treebo', propertyName: 'Treebo Trend', location: 'Park Street', rating: 3.5 },
    { chainId: 'zostel', propertyName: 'Zostel Kolkata', location: 'Sudder Street', rating: 4.0 }
  ],
  SXR: [
    { chainId: 'taj', propertyName: 'Taj Dal Lake', location: 'Dal Lake', rating: 4.8 },
    { chainId: 'vivanta', propertyName: 'Vivanta Dal View', location: 'Boulevard Road', rating: 4.4 },
    { chainId: 'radisson', propertyName: 'Radisson Srinagar', location: 'Boulevard Road', rating: 4.1 },
    { chainId: 'fortune', propertyName: 'Fortune Resort Heevan', location: 'Nehru Park', rating: 3.8 },
    { chainId: 'oyo', propertyName: 'OYO Premium Dal Lake', location: 'Nageen', rating: 3.5 }
  ],
  IXL: [
    { chainId: 'taj', propertyName: 'The Grand Dragon', location: 'Old Road', rating: 4.6 },
    { chainId: 'fortune', propertyName: 'Fortune Kargil', location: 'Near Airport', rating: 3.9 },
    { chainId: 'zostel', propertyName: 'Zostel Leh', location: 'Changspa', rating: 4.3 },
    { chainId: 'oyo', propertyName: 'OYO Leh View', location: 'Main Bazar', rating: 3.4 }
  ],
  IXZ: [
    { chainId: 'taj-exotica', propertyName: 'Taj Exotica Resort', location: 'Radhanagar Beach', rating: 4.8 },
    { chainId: 'fortune', propertyName: 'Fortune Resort Bay Island', location: 'Marine Hill', rating: 4.0 },
    { chainId: 'oyo', propertyName: 'OYO Port Blair', location: 'Aberdeen Bazar', rating: 3.4 }
  ]
};

// Price modifiers
const priceModifiers = {
  season: {
    peak: 1.5,   // Dec-Jan, festivals
    high: 1.25,  // Oct-Nov, Feb-Mar
    normal: 1.0  // Apr-Sep (except hill stations)
  },
  dayOfWeek: {
    weekend: 1.2,
    weekday: 1.0
  },
  advanceBooking: {
    lastMinute: 1.3,  // 0-3 days
    short: 1.15,      // 4-7 days
    normal: 1.0,      // 8-30 days
    advance: 0.9      // 30+ days
  }
};

// Generate hotel options for a city (using CSV data with fallback to cityHotels)
const generateHotels = (city, checkIn, checkOut, rooms = 1, guests = 2) => {
  console.log(`\n🏨 generateHotels called: city=${city}, checkIn=${checkIn}, checkOut=${checkOut}, rooms=${rooms}`);
  
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

  console.log(`   Calculated nights: ${nights}`);

  if (nights <= 0) {
    console.log(`   ❌ Invalid nights (${nights}), returning empty array`);
    return [];
  }

  // Calculate season modifier
  const month = checkInDate.getMonth();
  let seasonMod = priceModifiers.season.normal;
  if ([11, 0].includes(month)) seasonMod = priceModifiers.season.peak;
  else if ([9, 10, 1, 2].includes(month)) seasonMod = priceModifiers.season.high;

  // Day of week modifier
  const dayMod = [0, 6].includes(checkInDate.getDay()) ?
    priceModifiers.dayOfWeek.weekend : priceModifiers.dayOfWeek.weekday;

  // Advance booking modifier
  const daysAdvance = Math.ceil((checkInDate - new Date()) / (1000 * 60 * 60 * 24));
  let advanceMod = priceModifiers.advanceBooking.normal;
  if (daysAdvance <= 3) advanceMod = priceModifiers.advanceBooking.lastMinute;
  else if (daysAdvance <= 7) advanceMod = priceModifiers.advanceBooking.short;
  else if (daysAdvance > 30) advanceMod = priceModifiers.advanceBooking.advance;

  // Get hotels from CSV data first
  let csvHotels = getHotelsFromCSV(city);
  console.log(`   CSV hotels found for ${city}: ${csvHotels.length}`);

  // ✅ FALLBACK: If no CSV hotels, generate from cityHotels fallback data
  if (csvHotels.length === 0 && cityHotels[city]) {
    console.log(`⚠️ No CSV hotels for ${city}, using fallback cityHotels data`);
    csvHotels = cityHotels[city].map(hInfo => {
      const chain = hotelChains.find(c => c.id === hInfo.chainId);
      return {
        name: hInfo.propertyName + (chain ? ` (${chain.name})` : ''),
        place: hInfo.location + ', ' + (cityCodeToName[city] || city),
        city: cityCodeToName[city] || city,
        description: chain ? `${chain.type} hotel` : 'Hotel',
        condition: 'Well-rated',
        rating: hInfo.rating * 2, // Convert 5-scale to 10-scale for consistency
        reviewCount: Math.floor(Math.random() * 500) + 100,
        stars: chain ? chain.stars : 3
      };
    });
  }

  // Return up to 30 hotels
  return csvHotels.slice(0, 30).map((hotel, idx) => {
    // Skip invalid hotels
    if (!hotel || !hotel.name) return null;

    const hotelName = hotel.name.toLowerCase();

    // Price estimation based on stars
    const basePrice = hotel.stars === 5 ? 8000 + Math.random() * 12000 :
      hotel.stars === 4 ? 3000 + Math.random() * 5000 :
        hotel.stars === 3 ? 1500 + Math.random() * 2500 :
          800 + Math.random() * 1200;

    const pricePerNight = Math.round(basePrice * seasonMod * dayMod * advanceMod);

    // Determine hotel type from name/description
    const type = hotelName.includes('resort') ? 'resort' :
      hotelName.includes('hostel') ? 'hostel' :
        hotelName.includes('homestay') ? 'homestay' :
          hotelName.includes('heritage') ? 'heritage' :
            hotel.stars >= 4 ? 'premium' :
              hotel.stars >= 3 ? 'mid-range' : 'budget';

    // Get amenities based on hotel type
    const amenities = amenitiesByType[type] || amenitiesByType['mid-range'];

    // Available room types based on hotel class
    const availableRooms = hotel.stars >= 4 ?
      roomTypes.slice(0, 5) :
      hotel.stars >= 3 ? roomTypes.slice(0, 3) : roomTypes.slice(0, 2);

    return {
      id: `hotel-${city}-${idx}-${hotelName.replace(/\s+/g, '-').substring(0, 20)}`,
      name: hotel.name,
      chain: null,
      location: hotel.place,
      city: city,
      stars: hotel.stars,
      type: type,
      rating: hotel.rating / 2, // Convert 10-scale to 5-scale
      reviewCount: hotel.reviewCount,
      heritage: hotelName.includes('heritage'),
      amenities: amenities,
      rooms: availableRooms.map(room => ({
        type: room.type,
        name: room.name,
        size: room.sizeRange,
        pricePerNight: Math.round(pricePerNight * room.priceMultiplier),
        totalPrice: Math.round(pricePerNight * room.priceMultiplier * nights * rooms),
        available: Math.floor(Math.random() * 10) + 1,
        maxOccupancy: room.type === 'standard' ? 2 : room.type === 'suite' ? 4 : 3,
        bedType: room.type === 'standard' ? 'Queen' : room.type === 'suite' ? 'King + Sofa' : 'King',
        amenities: hotel.stars >= 4 ?
          ['AC', 'TV', 'Mini Bar', 'Safe', 'Tea/Coffee Maker'] :
          ['AC', 'TV', 'Attached Bathroom']
      })),
      checkIn: '14:00',
      checkOut: '12:00',
      cancellation: hotel.stars >= 4 ?
        { free: true, deadline: '48 hours before check-in', penalty: '1 night charge after deadline' } :
        { free: hotel.stars >= 3, refundable: hotel.stars >= 3 },
      description: hotel.description || `${hotel.condition} accommodation in ${hotel.city}`,
      images: [],
      coordinates: { lat: 20 + Math.random() * 15, lng: 70 + Math.random() * 20 },
      distanceFromCenter: `${(Math.random() * 10 + 1).toFixed(1)} km`,
      nearbyAttractions: []
    };
  }).filter(Boolean);
};

// Search hotels with filters
const searchHotels = (params) => {
  const { city, checkIn, checkOut, rooms = 1, guests = 2, filters } = params;

  let hotels = generateHotels(city, checkIn, checkOut, rooms, guests);
  console.log(`   🏨 Generated ${hotels.length} hotels for ${city}`);

  // Apply filters
  if (filters) {
    console.log(`   📝 Applying filters:`, filters);
    const beforeFilter = hotels.length;
    hotels = hotels.filter(hotel => {
      if (filters.minStars && hotel.stars < filters.minStars) {
        console.log(`      ❌ ${hotel.name}: stars ${hotel.stars} < minStars ${filters.minStars}`);
        return false;
      }
      if (filters.maxPrice) {
        const cheapestRoom = Math.min(...hotel.rooms.map(r => r.pricePerNight));
        if (cheapestRoom > filters.maxPrice) return false;
      }
      if (filters.hotelType && hotel.type !== filters.hotelType) return false;
      if (filters.amenities && filters.amenities.length > 0) {
        const hasAllAmenities = filters.amenities.every(a =>
          hotel.amenities.some(ha => ha.toLowerCase().includes(a.toLowerCase()))
        );
        if (!hasAllAmenities) return false;
      }
      return true;
    });
    console.log(`   📝 After filtering: ${hotels.length} hotels (was ${beforeFilter})`);
  }

  // Sort options
  const sortBy = params.sortBy || 'recommended';
  if (sortBy === 'price-low') {
    hotels.sort((a, b) => a.rooms[0].pricePerNight - b.rooms[0].pricePerNight);
  } else if (sortBy === 'price-high') {
    hotels.sort((a, b) => b.rooms[0].pricePerNight - a.rooms[0].pricePerNight);
  } else if (sortBy === 'rating') {
    hotels.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'stars') {
    hotels.sort((a, b) => b.stars - a.stars);
  }

  return {
    hotels,
    totalFound: hotels.length,
    searchParams: { city, checkIn, checkOut, rooms, guests },
    priceRange: hotels.length > 0 ? {
      min: Math.min(...hotels.flatMap(h => h.rooms.map(r => r.pricePerNight))),
      max: Math.max(...hotels.flatMap(h => h.rooms.map(r => r.pricePerNight)))
    } : null
  };
};

// Get hotel details by ID
const getHotelById = (hotelId) => {
  // In real implementation, this would fetch from database
  // For now, return a mock detailed response
  return null;
};

module.exports = {
  hotelChains,
  roomTypes,
  amenitiesByType,
  priceModifiers,
  generateHotels,
  searchHotels,
  getHotelById,
  getHotelsFromCSV,
  realHotelData,
  cityNameToCode,
  cityCodeToName
};  