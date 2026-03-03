// Trip Planning Types
import { City, Route } from '../data/indianCities';

export interface TripPreferences {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  travelers: number;
  tripType: 'direct' | 'tour';
  budget: number;
  currency: string;
  budgetFlexibility: 'strict' | 'moderate' | 'flexible';
  accommodations: string[];
  starRating: number;
  roomType: string;
  transportation: string[];
  flightClass: string;
  maxTransfers: number;
  priority: string;
  travelStyle: string;
  interests: string[];
  specialRequirements: string;
  dietaryRestrictions: string[];
  accessibilityNeeds: string[];
}

export interface FlightOption {
  id: string;
  airline: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: number;
  class: string;
}

export interface HotelOption {
  id: string;
  name: string;
  stars: number;
  location: string;
  address: string;
  amenities: string[];
  rating: number;
  reviews: number;
  pricePerNight: number;
  totalPrice: number;
  nights: number;
  roomType: string;
  imageUrl?: string;
}

export interface ActivityOption {
  id: string;
  name: string;
  type: string;
  duration: string;
  price: number;
  description: string;
  rating: number;
  reviews: number;
  location: string;
  timeSlot?: string;
}

export interface DayItinerary {
  day: number;
  date: string;
  city: string;
  activities: ActivityOption[];
  meals: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
  };
  transport?: string;
  accommodation?: string;
}

export interface TripPlan {
  id: number;
  name: string;
  badge: string;
  badgeColor: string;
  price: number;
  rating: number;
  duration: string;
  highlights: string[];
  flight: {
    outbound: FlightOption;
    return: FlightOption;
    totalPrice: number;
  };
  hotel: HotelOption;
  activities: {
    list: ActivityOption[];
    totalPrice: number;
  };
  meals: {
    estimated: number;
    included: string[];
  };
  itinerary: DayItinerary[];
  breakdown: {
    transport: number;
    accommodation: number;
    activities: number;
    meals: number;
    misc: number;
  };
}

// Indian Airlines
const airlines = [
  'IndiGo',
  'Air India',
  'SpiceJet',
  'Vistara',
  'Go First',
  'AirAsia India',
  'Akasa Air',
];

// Hotel chains in India
const hotelChains: Record<number, string[]> = {
  5: ['Taj Hotels', 'Oberoi Hotels', 'ITC Hotels', 'The Leela', 'JW Marriott', 'Hyatt Regency'],
  4: ['Radisson', 'Novotel', 'Holiday Inn', 'Courtyard by Marriott', 'Lemon Tree Premier', 'Pride Hotels'],
  3: ['Ginger Hotels', 'Treebo', 'FabHotel', 'OYO Premium', 'Keys Select', 'Zone by Park'],
  2: ['OYO Rooms', 'Zostel', 'GoStays', 'RedDoorz', 'Hotel 81'],
  1: ['Budget Hostels', 'Backpacker Stays', 'Local Guest Houses'],
};

// Popular activities by interest
const activitiesByInterest: Record<string, ActivityOption[]> = {
  culture: [
    { id: 'c1', name: 'Heritage Walking Tour', type: 'Tour', duration: '3 hours', price: 800, description: 'Explore local heritage with expert guide', rating: 4.7, reviews: 234, location: 'City Center' },
    { id: 'c2', name: 'Museum Visit', type: 'Sightseeing', duration: '2 hours', price: 500, description: 'Visit prominent local museum', rating: 4.5, reviews: 189, location: 'Museum District' },
    { id: 'c3', name: 'Cultural Dance Show', type: 'Entertainment', duration: '2 hours', price: 1200, description: 'Traditional dance performance', rating: 4.8, reviews: 456, location: 'Cultural Center' },
  ],
  adventure: [
    { id: 'a1', name: 'White Water Rafting', type: 'Adventure', duration: '4 hours', price: 2500, description: 'Thrilling rafting experience', rating: 4.9, reviews: 567, location: 'River Point' },
    { id: 'a2', name: 'Paragliding', type: 'Adventure', duration: '1 hour', price: 3500, description: 'Fly over scenic landscapes', rating: 4.8, reviews: 345, location: 'Hill Top' },
    { id: 'a3', name: 'Trekking Expedition', type: 'Adventure', duration: '6 hours', price: 1500, description: 'Guided trek through trails', rating: 4.6, reviews: 234, location: 'Trail Head' },
  ],
  food: [
    { id: 'f1', name: 'Street Food Tour', type: 'Food', duration: '3 hours', price: 1200, description: 'Taste local street delicacies', rating: 4.9, reviews: 789, location: 'Food Street' },
    { id: 'f2', name: 'Cooking Class', type: 'Food', duration: '4 hours', price: 2000, description: 'Learn traditional recipes', rating: 4.7, reviews: 234, location: 'Culinary School' },
    { id: 'f3', name: 'Fine Dining Experience', type: 'Food', duration: '2 hours', price: 3500, description: 'Premium local cuisine', rating: 4.8, reviews: 156, location: 'Restaurant District' },
  ],
  nature: [
    { id: 'n1', name: 'Wildlife Safari', type: 'Nature', duration: '5 hours', price: 4000, description: 'Spot exotic wildlife', rating: 4.8, reviews: 456, location: 'National Park' },
    { id: 'n2', name: 'Bird Watching Tour', type: 'Nature', duration: '3 hours', price: 1000, description: 'Discover local bird species', rating: 4.5, reviews: 123, location: 'Sanctuary' },
    { id: 'n3', name: 'Nature Walk', type: 'Nature', duration: '2 hours', price: 500, description: 'Guided nature exploration', rating: 4.4, reviews: 89, location: 'Forest Area' },
  ],
  beach: [
    { id: 'b1', name: 'Scuba Diving', type: 'Water Sports', duration: '3 hours', price: 4500, description: 'Explore underwater world', rating: 4.9, reviews: 567, location: 'Beach' },
    { id: 'b2', name: 'Sunset Cruise', type: 'Leisure', duration: '2 hours', price: 2000, description: 'Scenic sunset boat ride', rating: 4.7, reviews: 345, location: 'Marina' },
    { id: 'b3', name: 'Beach Yoga Session', type: 'Wellness', duration: '1.5 hours', price: 800, description: 'Relaxing beachside yoga', rating: 4.6, reviews: 234, location: 'Beach' },
  ],
  nightlife: [
    { id: 'nl1', name: 'Pub Hopping Tour', type: 'Nightlife', duration: '4 hours', price: 2500, description: 'Visit best local pubs', rating: 4.5, reviews: 234, location: 'Entertainment District' },
    { id: 'nl2', name: 'Rooftop Bar Experience', type: 'Nightlife', duration: '3 hours', price: 3000, description: 'Premium rooftop bar', rating: 4.7, reviews: 189, location: 'City Center' },
  ],
  shopping: [
    { id: 's1', name: 'Local Market Tour', type: 'Shopping', duration: '3 hours', price: 600, description: 'Explore traditional markets', rating: 4.6, reviews: 345, location: 'Market Area' },
    { id: 's2', name: 'Handicraft Workshop', type: 'Shopping', duration: '2 hours', price: 1500, description: 'Learn local crafts', rating: 4.8, reviews: 123, location: 'Craft Center' },
  ],
  art: [
    { id: 'ar1', name: 'Art Gallery Tour', type: 'Art', duration: '2 hours', price: 800, description: 'Visit prominent galleries', rating: 4.5, reviews: 167, location: 'Art District' },
    { id: 'ar2', name: 'Art Workshop', type: 'Art', duration: '3 hours', price: 1800, description: 'Create your own artwork', rating: 4.7, reviews: 89, location: 'Art Studio' },
  ],
  photography: [
    { id: 'p1', name: 'Photography Walk', type: 'Photography', duration: '3 hours', price: 1200, description: 'Capture iconic spots', rating: 4.8, reviews: 234, location: 'Scenic Points' },
    { id: 'p2', name: 'Sunrise/Sunset Photo Tour', type: 'Photography', duration: '2 hours', price: 1500, description: 'Golden hour photography', rating: 4.9, reviews: 156, location: 'Viewpoint' },
  ],
  sports: [
    { id: 'sp1', name: 'Cricket Match Experience', type: 'Sports', duration: '5 hours', price: 2000, description: 'Watch live cricket', rating: 4.8, reviews: 567, location: 'Stadium' },
    { id: 'sp2', name: 'Golf Day Pass', type: 'Sports', duration: '4 hours', price: 5000, description: 'Play at premium golf course', rating: 4.6, reviews: 89, location: 'Golf Club' },
  ],
};

// Generate random flight option
const generateFlight = (
  origin: string,
  destination: string,
  date: string,
  flightClass: string,
  budgetTier: 'budget' | 'standard' | 'premium'
): FlightOption => {
  const airline = airlines[Math.floor(Math.random() * airlines.length)];
  const basePrice = budgetTier === 'budget' ? 3500 : budgetTier === 'standard' ? 6000 : 12000;
  const classMultiplier = flightClass === 'business' ? 3 : 1;
  const stops = budgetTier === 'premium' ? 0 : Math.floor(Math.random() * 2);
  
  const hours = 1 + Math.floor(Math.random() * 3);
  const minutes = Math.floor(Math.random() * 60);
  
  return {
    id: `FL${Math.random().toString(36).substr(2, 9)}`,
    airline,
    departure: origin,
    arrival: destination,
    departureTime: `${6 + Math.floor(Math.random() * 12)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
    arrivalTime: `${10 + Math.floor(Math.random() * 12)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
    duration: `${hours}h ${minutes}m`,
    stops,
    price: Math.round((basePrice + Math.random() * 2000) * classMultiplier),
    class: flightClass,
  };
};

// Generate hotel option
const generateHotel = (
  stars: number,
  nights: number,
  roomType: string,
  city: string,
  budgetTier: 'budget' | 'standard' | 'premium'
): HotelOption => {
  const chains = hotelChains[stars] || hotelChains[3];
  const hotelName = chains[Math.floor(Math.random() * chains.length)];
  
  const basePricePerNight: Record<number, number> = {
    5: 12000,
    4: 6000,
    3: 3000,
    2: 1500,
    1: 800,
  };
  
  const roomMultiplier: Record<string, number> = {
    standard: 1,
    deluxe: 1.5,
    suite: 2.5,
  };
  
  const pricePerNight = Math.round(
    basePricePerNight[stars] * (roomMultiplier[roomType] || 1) * (0.9 + Math.random() * 0.3)
  );
  
  const amenities = [
    'Free WiFi',
    'AC',
    'TV',
    ...(stars >= 3 ? ['Room Service', 'Restaurant'] : []),
    ...(stars >= 4 ? ['Swimming Pool', 'Gym', 'Spa'] : []),
    ...(stars >= 5 ? ['Concierge', 'Butler Service', 'Valet Parking'] : []),
  ];
  
  return {
    id: `HT${Math.random().toString(36).substr(2, 9)}`,
    name: `${hotelName} ${city}`,
    stars,
    location: `Central ${city}`,
    address: `Main Road, ${city}`,
    amenities,
    rating: 3.5 + (stars * 0.3) + Math.random() * 0.5,
    reviews: 100 + Math.floor(Math.random() * 900),
    pricePerNight,
    totalPrice: pricePerNight * nights,
    nights,
    roomType,
  };
};

// Generate activities based on interests
const generateActivities = (
  interests: string[],
  days: number,
  budgetTier: 'budget' | 'standard' | 'premium'
): { list: ActivityOption[]; totalPrice: number } => {
  const activitiesPerDay = budgetTier === 'budget' ? 2 : budgetTier === 'standard' ? 3 : 4;
  const totalActivities = Math.min(days * activitiesPerDay, 15);
  
  const allActivities: ActivityOption[] = [];
  
  interests.forEach(interest => {
    const categoryActivities = activitiesByInterest[interest.toLowerCase()] || activitiesByInterest.culture;
    allActivities.push(...categoryActivities);
  });
  
  // Add some default activities if not enough
  if (allActivities.length < totalActivities) {
    allActivities.push(...activitiesByInterest.culture, ...activitiesByInterest.food);
  }
  
  // Shuffle and select
  const shuffled = allActivities.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, totalActivities);
  
  // Adjust prices based on budget tier
  const priceMultiplier = budgetTier === 'budget' ? 0.7 : budgetTier === 'standard' ? 1 : 1.5;
  
  const adjustedActivities = selected.map((activity, index) => ({
    ...activity,
    id: `${activity.id}_${index}`,
    price: Math.round(activity.price * priceMultiplier),
  }));
  
  const totalPrice = adjustedActivities.reduce((sum, a) => sum + a.price, 0);
  
  return { list: adjustedActivities, totalPrice };
};

// Generate day itinerary
const generateItinerary = (
  activities: ActivityOption[],
  days: number,
  destination: string,
  startDate: string
): DayItinerary[] => {
  const itinerary: DayItinerary[] = [];
  const activitiesPerDay = Math.ceil(activities.length / days);
  
  let activityIndex = 0;
  const start = new Date(startDate);
  
  for (let day = 1; day <= days; day++) {
    const date = new Date(start);
    date.setDate(start.getDate() + day - 1);
    
    const dayActivities = activities.slice(activityIndex, activityIndex + activitiesPerDay);
    activityIndex += activitiesPerDay;
    
    itinerary.push({
      day,
      date: date.toISOString().split('T')[0],
      city: destination,
      activities: dayActivities,
      meals: {
        breakfast: day === 1 ? undefined : 'Hotel Breakfast',
        lunch: 'Local Restaurant',
        dinner: 'Recommended Restaurant',
      },
      transport: day === 1 ? 'Airport Transfer' : 'Local Transport',
      accommodation: 'Hotel',
    });
  }
  
  return itinerary;
};

// Calculate trip duration in days
const calculateDays = (departureDate: string, returnDate: string): number => {
  const start = new Date(departureDate);
  const end = new Date(returnDate);
  const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 1);
};

// Main function to generate trip plans
export const generateTripPlans = (preferences: TripPreferences): TripPlan[] => {
  const days = calculateDays(preferences.departureDate, preferences.returnDate);
  const nights = Math.max(days - 1, 1);
  
  // Generate three tiers of plans
  const tiers: Array<{ name: string; badge: string; badgeColor: string; tier: 'budget' | 'standard' | 'premium' }> = [
    { name: 'Budget Friendly', badge: 'Best Value', badgeColor: 'bg-green-100 text-green-700', tier: 'budget' },
    { name: 'Comfort Plus', badge: 'Recommended', badgeColor: 'bg-blue-100 text-blue-700', tier: 'standard' },
    { name: 'Premium Experience', badge: 'Best Rated', badgeColor: 'bg-purple-100 text-purple-700', tier: 'premium' },
  ];
  
  const plans: TripPlan[] = tiers.map((tierInfo, index) => {
    const starRating = tierInfo.tier === 'budget' ? Math.min(preferences.starRating, 3) 
      : tierInfo.tier === 'standard' ? preferences.starRating 
      : Math.max(preferences.starRating, 4);
    
    // Generate components
    const outboundFlight = generateFlight(
      preferences.origin,
      preferences.destination,
      preferences.departureDate,
      preferences.flightClass,
      tierInfo.tier
    );
    
    const returnFlight = generateFlight(
      preferences.destination,
      preferences.origin,
      preferences.returnDate,
      preferences.flightClass,
      tierInfo.tier
    );
    
    const hotel = generateHotel(
      starRating,
      nights,
      preferences.roomType,
      preferences.destination,
      tierInfo.tier
    );
    
    const activities = generateActivities(preferences.interests, days, tierInfo.tier);
    const itinerary = generateItinerary(activities.list, days, preferences.destination, preferences.departureDate);
    
    // Calculate costs
    const flightTotal = (outboundFlight.price + returnFlight.price) * preferences.travelers;
    const hotelTotal = hotel.totalPrice;
    const activitiesTotal = activities.totalPrice * preferences.travelers;
    const mealsEstimate = (tierInfo.tier === 'budget' ? 800 : tierInfo.tier === 'standard' ? 1200 : 2000) * days * preferences.travelers;
    const miscEstimate = Math.round((flightTotal + hotelTotal) * 0.05);
    
    const totalPrice = flightTotal + hotelTotal + activitiesTotal + mealsEstimate + miscEstimate;
    
    // Generate highlights based on tier
    const highlights = [
      `${outboundFlight.stops === 0 ? 'Direct' : `${outboundFlight.stops}-stop`} ${preferences.flightClass} flights via ${outboundFlight.airline}`,
      `${starRating}-star ${hotel.name.split(' ')[0]} accommodation`,
      `${activities.list.length} curated activities included`,
      tierInfo.tier === 'premium' ? 'Private transfers included' : 'Local transport guidance',
      ...(tierInfo.tier !== 'budget' ? ['Priority support 24/7'] : []),
    ];
    
    return {
      id: index + 1,
      name: tierInfo.name,
      badge: tierInfo.badge,
      badgeColor: tierInfo.badgeColor,
      price: totalPrice,
      rating: 4.2 + (index * 0.3) + Math.random() * 0.2,
      duration: `${days} days`,
      highlights,
      flight: {
        outbound: outboundFlight,
        return: returnFlight,
        totalPrice: flightTotal,
      },
      hotel,
      activities,
      meals: {
        estimated: mealsEstimate,
        included: tierInfo.tier === 'premium' ? ['Breakfast', 'Welcome Dinner'] : tierInfo.tier === 'standard' ? ['Breakfast'] : [],
      },
      itinerary,
      breakdown: {
        transport: flightTotal,
        accommodation: hotelTotal,
        activities: activitiesTotal,
        meals: mealsEstimate,
        misc: miscEstimate,
      },
    };
  });
  
  return plans;
};

// Format currency in INR
export const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Get budget category
export const getBudgetCategory = (budget: number): 'budget' | 'mid-range' | 'premium' | 'luxury' => {
  if (budget < 15000) return 'budget';
  if (budget < 35000) return 'mid-range';
  if (budget < 75000) return 'premium';
  return 'luxury';
};
