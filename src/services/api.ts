// API Service for Backend Communication
const rawApiUrl = import.meta.env.VITE_API_URL?.trim();
const API_BASE_URL = (() => {
  if (!rawApiUrl) return '/api';

  const normalized = rawApiUrl.replace(/\/+$/, '');
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
})();

// Generic fetch wrapper with error handling
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${path}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add auth token if available
  const token = localStorage.getItem('accessToken');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

// ============ Cities API ============
export interface CityData {
  id: string;
  code: string;
  name: string;
  fullName: string;
  state: string;
  type: string;
  description: string;
  popularFor: string[];
  bestTimeToVisit: { months: string[]; season: string };
  averageDailyBudget: { budget: number; midRange: number; luxury: number };
  transport: {
    hasAirport: boolean;
    airportCode?: string;
    airportName?: string;
    hasRailway: boolean;
    railwayStations?: string[];
    hasMetro: boolean;
  };
  attractions: Array<{
    name: string;
    type: string;
    entryFee: number;
    duration: string;
  }>;
  // Convenience getter for components
  hasAirport?: boolean;
}

export const citiesAPI = {
  getAll: async (params?: { type?: string; hasAirport?: boolean; limit?: number }): Promise<CityData[]> => {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set('type', params.type);
    if (params?.hasAirport) searchParams.set('hasAirport', 'true');
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const response = await fetchAPI<{ success: boolean; count: number; data: CityData[] }>(
      `/cities?${searchParams}`
    );
    return response.data;
  },

  search: async (query: string, limit?: number): Promise<CityData[]> => {
    const params = new URLSearchParams({ q: query });
    if (limit) params.set('limit', limit.toString());
    const response = await fetchAPI<{ success: boolean; count: number; data: CityData[] }>(
      `/cities/search?${params}`
    );
    return response.data;
  },

  getByCode: async (code: string): Promise<CityData> => {
    const response = await fetchAPI<{ success: boolean; data: CityData }>(`/cities/${code}`);
    return response.data;
  },

  getPopular: async (limit?: number): Promise<CityData[]> => {
    const params = limit ? `?limit=${limit}` : '';
    const response = await fetchAPI<{ success: boolean; count: number; data: CityData[] }>(`/cities/popular${params}`);
    return response.data;
  },

  getWithAirports: async (): Promise<CityData[]> => {
    const response = await fetchAPI<{ success: boolean; count: number; data: CityData[] }>('/cities/airports');
    return response.data;
  },

  getAttractions: async (code: string): Promise<CityData['attractions']> => {
    const response = await fetchAPI<{ success: boolean; city: string; count: number; data: CityData['attractions'] }>(
      `/cities/${code}/attractions`
    );
    return response.data;
  },
};

// ============ Flights API ============
export interface FlightData {
  id: string;
  flightNumber: string;
  airline: {
    code: string;
    name: string;
    logo: string;
    type: string;
  };
  from: string;
  to: string;
  date: string;
  departure: { time: string; terminal: string };
  arrival: { time: string; terminal: string; nextDay?: boolean };
  duration: string;
  durationMinutes: number;
  stops: number;
  prices: {
    economy: { base: number; taxes: number; total: number };
    business: { base: number; taxes: number; total: number };
  };
  seatsAvailable: { economy: number; business: number };
  amenities: string[];
  baggage: { cabin: string; checkIn: string };
  refundable: boolean;
}

export interface FlightSearchParams {
  from: string;
  to: string;
  date: string;
  returnDate?: string;
  travelers?: number;
  cabinClass?: 'economy' | 'business';
  maxPrice?: number;
  maxStops?: number;
}

export const flightsAPI = {
  search: (params: FlightSearchParams) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, value.toString());
    });
    return fetchAPI<{
      success: boolean;
      outbound: FlightData[];
      return: FlightData[];
      summary: { cheapest: number; fastest: number; totalOptions: number };
    }>(`/flights/search?${searchParams}`);
  },

  getAirlines: () =>
    fetchAPI<{ success: boolean; count: number; data: Array<{ code: string; name: string; type: string }> }>(
      '/flights/airlines'
    ),

  getPopularRoutes: () =>
    fetchAPI<{ success: boolean; count: number; data: Array<{ from: string; to: string; startingFrom: number }> }>(
      '/flights/popular'
    ),
};

// ============ Trains API ============
export interface TrainData {
  trainNumber: string;
  trainName: string;
  trainType: string;
  /** Actual track waypoints from origin stop to destination stop (lat/lng pairs) */
  routePath?: [number, number][];
  from: { code: string; name: string; city: string };
  to: { code: string; name: string; city: string };
  departure: string;
  arrival: string;
  duration: { hours: number; minutes: number };
  distance: number;
  date: string;
  class: string;
  availability: { status: string; count: number };
  fare: { baseFare: number; reservationCharge: number; superfastCharge: number; gst: number; total: number };
  amenities: string[];
}

export interface TrainSearchParams {
  from: string;
  to: string;
  date: string;
  travelClass?: string;
}

export const trainsAPI = {
  search: (params: TrainSearchParams) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key === 'travelClass' ? 'class' : key, value.toString());
    });
    return fetchAPI<{ success: boolean; trains: TrainData[]; totalFound: number }>(`/trains/search?${searchParams}`);
  },

  getTypes: () =>
    fetchAPI<{ success: boolean; count: number; data: Array<{ code: string; name: string; type: string }> }>(
      '/trains/types'
    ),

  getClasses: () =>
    fetchAPI<{ success: boolean; count: number; data: Array<{ code: string; name: string; description: string }> }>(
      '/trains/classes'
    ),

  getByNumber: (trainNumber: string) =>
    fetchAPI<{ success: boolean; data: TrainData }>(`/trains/${trainNumber}`),

  getAvailability: (trainNumber: string, startDate: string, travelClass?: string) => {
    const searchParams = new URLSearchParams({ startDate });
    if (travelClass) searchParams.set('class', travelClass);
    return fetchAPI<{ success: boolean; data: Array<{ date: string; status: string; count: number; fare: any }> }>(
      `/trains/${trainNumber}/availability?${searchParams}`
    );
  },
};

// ============ Hotels API ============
export interface HotelData {
  id: string;
  name: string;
  chain: string;
  location: string;
  city: string;
  stars: number;
  type: string;
  rating: number;
  reviewCount: number;
  heritage: boolean;
  amenities: string[];
  rooms: Array<{
    type: string;
    name: string;
    size: string;
    pricePerNight: number;
    totalPrice: number;
    available: number;
    maxOccupancy: number;
    bedType: string;
    amenities: string[];
  }>;
  checkIn: string;
  checkOut: string;
  cancellation: { free: boolean; deadline?: string; penalty?: string; refundable?: boolean };
  images: string[];
  distanceFromCenter: string;
}

export interface HotelSearchParams {
  city: string;
  checkIn: string;
  checkOut: string;
  rooms?: number;
  guests?: number;
  minStars?: number;
  maxPrice?: number;
  hotelType?: string;
  sortBy?: 'recommended' | 'price-low' | 'price-high' | 'rating' | 'stars';
}

export const hotelsAPI = {
  search: (params: HotelSearchParams) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, value.toString());
    });
    return fetchAPI<{
      success: boolean;
      hotels: HotelData[];
      totalFound: number;
      priceRange: { min: number; max: number } | null;
    }>(`/hotels/search?${searchParams}`);
  },

  getChains: () =>
    fetchAPI<{ success: boolean; count: number; data: Array<{ id: string; name: string; stars: number; type: string }> }>(
      '/hotels/chains'
    ),

  getPopular: () =>
    fetchAPI<{ success: boolean; count: number; data: HotelData[] }>('/hotels/popular'),

  getDeals: () =>
    fetchAPI<{
      success: boolean;
      count: number;
      data: Array<{ id: string; title: string; description: string; discount: number; validTill: string }>;
    }>('/hotels/deals'),
};

// ============ Trips API ============

// Frontend-compatible interfaces (matching the old tripService format)
export interface FlightOption {
  id: string;
  airline: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  duration: string | { hours: number; minutes: number };
  stops: number;
  price: number;
  class: string;
  // Additional fields for transport type identification
  mode?: 'train' | 'flight' | 'bus';
  type?: 'train' | 'flight' | 'bus';
  name?: string;
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
  time?: string;
  cost?: number;
  costLabel?: string;
  activity?: string;
  title?: string;
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

// This is the format the frontend components expect
export interface TripPlanData {
  id: number;
  name: string;
  badge: string;
  badgeColor: string;
  price: number;
  rating: number;
  duration: string;
  highlights: string[];
  // Transport information (can identify train vs flight)
  transport?: {
    mode?: 'train' | 'flight' | 'bus';
    type?: 'train' | 'flight' | 'bus';
    name?: string;
    class?: string;
  };
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
    nightsUsed?: number;
    overnightCount?: number;
    usableDays?: number;
    nightsAtDestination?: number;
  };
  /** Per-plan arrival info (transport-aware) */
  arrivalInfo?: {
    isNextDayArrival?: boolean;
    departureTime?: string;
    arrivalTime?: string;
    arrivalDate?: string;
  };
}

// Backend response interfaces
interface BackendPlanData {
  id: string;
  tier: string;
  description: string;
  nights?: number;
  requestedNights?: number;
  arrivalInfo?: {
    isNextDayArrival?: boolean;
    departureTime?: string;
    arrivalTime?: string;
    arrivalDate?: string;
  };
  transport: {
    type?: string;
    mode?: string;
    details?: any;
    class?: string;
    overnightCount?: number;
    name?: string;
  };
  hotel: {
    name: string;
    stars: number;
    location: string;
    pricePerNight: number;
    roomType: string;
    amenities: string[];
  };
  costs: {
    transport: number;
    accommodation: number;
    activities: number;
    meals: number;
    miscellaneous: number;
    total: number;
  };
  breakdown?: {
    transportTotal?: number;
    accommodationTotal?: number;
    foodTotal?: number;
    activityTotal?: number;
    nightsUsed?: number;
    overnightCount?: number;
    usableDays?: number;
    nightsAtDestination?: number;
  };
  itinerary?: Array<{
    day: number;
    title: string;
    date?: string;
    activities: Array<{ time?: string; activity?: string; type?: string; details?: any; name?: string; title?: string }>;
  }>;
  highlights: string[];
}

interface BackendTripResponse {
  id: string;
  source: CityData;
  destination: CityData;
  startDate: string;
  endDate: string;
  nights: number;
  travelers: number;
  tripType: string;
  plans: BackendPlanData[];
  itinerary: Array<{
    day: number;
    title: string;
    activities: Array<{ time: string; activity: string; type: string; details?: any }>;
  }>;
  createdAt: string;
}

export interface TripResponse {
  id: string;
  plans: TripPlanData[];
  // NEW: Arrival info for ResultsPage
  arrivalInfo?: {
    isNextDayArrival: boolean;
    departureTime: string;
    arrivalTime: string;
    arrivalDate: string;
    hotelCheckInDate: string;
    requestedNights: number;
    adjustedNights: number;
  } | null;
  isReturnTrip?: boolean;
  adjustedNights?: number;
  // NEW: Algorithm-generated plans from priority-based backtracking
  algorithmPlans?: Array<{
    tier: string;
    name: string;
    totalCost: number;
    score: number;
    breakdown: {
      transportTotal: number;
      accommodationTotal: number;
      foodTotal: number;
      activityTotal: number;
      activitiesIncluded: boolean;
    };
    nights?: number;
    transport: any;
    accommodation: any;
    meals: any;
    activities: any;
  }> | null;
  // NEW: Whether activities are included in the trip
  includeActivities?: boolean;
  warnings?: {
    type: string;
    category: string;
    message: string;
    excessAmount?: number;
    selectedMode?: string;
    savings?: number;
    minimumRequired?: number;
  }[] | null;
  destinationAttractions?: {
    id: string;
    name: string;
    type: string;
    entryFee: number;
    duration: string;
  }[];
  transportAlternatives?: {
    mode: string;
    cost: number;
    excess: number;
  }[];
  inCityTransportOptions?: {
    type: string;
    category: string;
    totalFare: number;
    notes: string;
  }[];
}

// Transform backend response to frontend format
function transformTripResponse(backendData: BackendTripResponse): TripResponse {
  const tierConfig: Record<string, { name: string; badge: string; badgeColor: string; rating: number }> = {
    'Budget': { name: 'Budget Saver', badge: 'Best Value', badgeColor: 'bg-green-500', rating: 4.2 },
    'Comfort': { name: 'Comfort Choice', badge: 'Popular', badgeColor: 'bg-primary', rating: 4.5 },
    'Premium': { name: 'Premium Experience', badge: 'Top Rated', badgeColor: 'bg-purple-500', rating: 4.8 },
    'budget': { name: 'Budget Saver', badge: 'Best Value', badgeColor: 'bg-green-500', rating: 4.2 },
    'comfort': { name: 'Comfort Choice', badge: 'Popular', badgeColor: 'bg-primary', rating: 4.5 },
    'premium': { name: 'Premium Experience', badge: 'Top Rated', badgeColor: 'bg-purple-500', rating: 4.8 },
  };

  const sourceName = backendData.source?.name || 'Origin';
  const destinationName = backendData.destination?.name || 'Destination';
  const travelersCount = backendData.travelers || 1;
  const globalNightsCount = backendData.nights || 1;

  const transformSinglePlan = (plan: BackendPlanData, index: number): TripPlanData => {
    const tierKey = plan.tier || 'Comfort';
    const config = tierConfig[tierKey] || tierConfig['Comfort'];
    const transportDetails = plan.transport?.details || {};
    const planNightsCount = plan.nights ?? plan.breakdown?.nightsUsed ?? globalNightsCount;
    const planBreakdown = plan.breakdown || {};

    const transportMode = (
      plan.transport?.mode === 'train' ||
      plan.transport?.type === 'train' ||
      transportDetails.trainNumber
    ) ? 'train' as const : 'flight' as const;

    const flightOption: FlightOption = {
      id: transportDetails.flightNumber || transportDetails.trainNumber || plan.transport?.name || `${plan.tier}-${index}`,
      airline: transportDetails.airline || transportDetails.trainName || plan.transport?.name || 'Unknown',
      departure: sourceName,
      arrival: destinationName,
      departureTime: transportDetails.departure?.time || transportDetails.departure || plan.arrivalInfo?.departureTime || '09:00',
      arrivalTime: transportDetails.arrival?.time || transportDetails.arrival || plan.arrivalInfo?.arrivalTime || '11:00',
      duration: transportDetails.duration || '2h',
      stops: transportDetails.stops || 0,
      price: Math.round((plan.costs?.transport || 0) / 2 / travelersCount),
      class: plan.transport?.class || 'economy',
      mode: transportMode,
      type: transportMode,
      name: transportDetails.trainName || transportDetails.airline || plan.transport?.name || 'Unknown',
    };

    const planItinerarySource = (plan.itinerary && plan.itinerary.length > 0)
      ? plan.itinerary
      : (backendData.itinerary || []);

    const activities: ActivityOption[] = planItinerarySource
      .slice(1, -1)
      .flatMap((day, dayIndex) =>
        (day.activities || [])
          .filter(a => a.type === 'attraction')
          .map((a, actIndex) => ({
            id: `act-${dayIndex}-${actIndex}`,
            name: a.activity || a.name || a.title || 'Activity',
            type: 'Sightseeing',
            duration: a.details?.duration || '2-3 hours',
            price: a.details?.entryFee ?? 0,
            description: a.details?.description || `Visit ${a.activity || a.name}`,
            rating: 4.5 + Math.random() * 0.4,
            reviews: Math.floor(100 + Math.random() * 500),
            location: destinationName,
            timeSlot: a.time,
          }))
      );

    const itinerary: DayItinerary[] = planItinerarySource.map((day, dayIdx) => {
      const dayActivities = (day.activities || []).map((a, aIdx) => {
        const activityName = a.activity || a.name || a.title || '';
        if ((day.day === 1 && a.type === 'transport') || (activityName.includes('Departure') && a.type === 'transport')) {
          const durationStr = typeof flightOption.duration === 'string'
            ? flightOption.duration
            : `${(flightOption.duration as any).hours}h ${(flightOption.duration as any).minutes}m`;

          return {
            id: `day${day.day}-transport`,
            name: `${flightOption.airline} ${flightOption.id}`,
            title: `${flightOption.airline} ${flightOption.id}`,
            activity: `${flightOption.airline} ${flightOption.id}`,
            type: 'transport',
            duration: durationStr,
            price: flightOption.price,
            cost: flightOption.price,
            costLabel: 'Included in transport',
            description: `Travel to ${destinationName} (${durationStr})`,
            rating: 4.5,
            reviews: 100,
            location: sourceName,
            timeSlot: flightOption.departureTime,
            time: flightOption.departureTime,
          };
        }

        const baseCost = a.details?.entryFee ?? 0;
        const normalizedCost = typeof baseCost === 'number' ? baseCost : 0;
        const computedCostLabel =
          normalizedCost === 0
            ? (a.type === 'attraction' ? 'Free entry' : undefined)
            : undefined;

        return {
          id: `day${day.day}-act${aIdx}`,
          name: activityName || 'Activity',
          title: activityName || 'Activity',
          activity: activityName || 'Activity',
          type: a.type || 'activity',
          duration: a.details?.duration || '2 hours',
          price: normalizedCost,
          cost: normalizedCost,
          costLabel: computedCostLabel,
          description: a.details?.description || activityName || 'Activity',
          rating: 4.5,
          reviews: 100,
          location: destinationName,
          timeSlot: a.time,
          time: a.time,
        };
      });

      return {
        day: day.day,
        title: day.title,
        date: day.date || new Date(new Date(backendData.startDate || new Date()).getTime() + dayIdx * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        city: destinationName,
        activities: dayActivities,
        meals: {
          breakfast: (day.activities || []).find(a => a.type === 'meal' && a.time === 'Morning')?.activity || 'Breakfast',
          lunch: (day.activities || []).find(a => a.type === 'meal' && a.time === 'Afternoon')?.activity || 'Lunch',
          dinner: (day.activities || []).find(a => a.type === 'leisure' && a.time === 'Evening')?.activity || 'Dinner',
        },
      };
    });

    const nightsUsed = planBreakdown.nightsUsed ?? planNightsCount;
    const overnightCount = planBreakdown.overnightCount ?? plan.transport?.overnightCount ?? 0;
    const usableDays = planBreakdown.usableDays ?? Math.max(1, nightsUsed + 1);
    const totalTripDays = overnightCount + usableDays;

    return {
      id: index + 1,
      name: config.name,
      badge: config.badge,
      badgeColor: config.badgeColor,
      price: plan.costs?.total || 0,
      rating: config.rating,
      duration: `${totalTripDays} days`,
      highlights: plan.highlights || [],
      transport: {
        mode: transportMode,
        type: transportMode,
        name: flightOption.name,
        class: flightOption.class,
      },
      flight: {
        outbound: flightOption,
        return: {
          ...flightOption,
          id: `${flightOption.id}-return`,
          departure: destinationName,
          arrival: sourceName,
        },
        totalPrice: plan.costs?.transport || 0,
      },
      hotel: {
        id: `hotel-${(plan.tier || 'comfort').toLowerCase()}`,
        name: plan.hotel?.name || 'Hotel',
        stars: plan.hotel?.stars || 3,
        location: plan.hotel?.location || destinationName,
        address: `${plan.hotel?.location || 'City Center'}, ${destinationName}`,
        amenities: plan.hotel?.amenities || [],
        rating: 4.2 + Math.random() * 0.6,
        reviews: Math.floor(200 + Math.random() * 800),
        pricePerNight: plan.hotel?.pricePerNight || 0,
        totalPrice: plan.costs?.accommodation || 0,
        nights: planNightsCount,
        roomType: plan.hotel?.roomType || 'Standard',
      },
      activities: {
        list: activities.length > 0 ? activities : (((backendData as any).destinationAttractions) || []).slice(0, 6).map((attr: any, idx: number) => ({
          id: `attraction-${idx}`,
          name: attr.name,
          type: attr.type || 'Sightseeing',
          duration: attr.duration || '2-3 hours',
          price: attr.entryFee || 0,
          description: `Visit ${attr.name}`,
          rating: 4.5,
          reviews: 250,
          location: destinationName,
        })),
        totalPrice: plan.costs?.activities || 0,
      },
      meals: {
        estimated: plan.costs?.meals || 0,
        included: plan.tier === 'Premium'
          ? ['Breakfast', 'Lunch', 'Dinner']
          : plan.tier === 'Comfort'
            ? ['Breakfast']
            : [],
      },
      itinerary,
      breakdown: {
        transport: plan.costs?.transport || planBreakdown.transportTotal || 0,
        accommodation: plan.costs?.accommodation || planBreakdown.accommodationTotal || 0,
        activities: plan.costs?.activities || planBreakdown.activityTotal || 0,
        meals: plan.costs?.meals || planBreakdown.foodTotal || 0,
        misc: plan.costs?.miscellaneous || 0,
        nightsUsed,
        overnightCount,
        usableDays,
        nightsAtDestination: planBreakdown.nightsAtDestination ?? nightsUsed,
      },
      arrivalInfo: plan.arrivalInfo,
    };
  };

  const plans: TripPlanData[] = (backendData.plans || []).map((plan, index) =>
    transformSinglePlan(plan, index)
  );

  return {
    id: backendData.id,
    plans,
    // Pass arrivalInfo, isReturnTrip, adjustedNights for ResultsPage display
    arrivalInfo: (backendData as any).arrivalInfo || null,
    isReturnTrip: (backendData as any).isReturnTrip ?? true,
    adjustedNights: (backendData as any).adjustedNights,
    // NEW: Algorithm-generated plans
    algorithmPlans: (backendData as any).algorithmPlans || null,
    includeActivities: (backendData as any).includeActivities ?? true,
    // Pass through smart selection data
    warnings: (backendData as any).warnings || null,
    destinationAttractions: (backendData as any).destinationAttractions || [],
    transportAlternatives: (backendData as any).transportAlternatives || [],
    inCityTransportOptions: (backendData as any).inCityTransportOptions || [],
  };
}

export interface TripPlanParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  travelers?: number;
  budget?: number;
  tripType?: string;
  [key: string]: any;
}

export const tripsAPI = {
  generatePlan: async (params: TripPlanParams): Promise<TripResponse> => {
    // Transform frontend params to backend format
    // IMPORTANT: Backend expects these fields at TOP LEVEL, not nested in preferences
    const backendParams = {
      source: params.origin,
      destination: params.destination,
      startDate: params.departureDate,
      endDate: params.returnDate,
      travelers: params.travelers || 1,
      budget: params.budget,
      tripType: params.tripType || 'leisure',
      // NEW: Pass all trip options at top level
      isReturnTrip: params.isReturnTrip ?? true,
      noStay: params.noStay ?? false,
      stayNights: params.stayNights ?? 1,
      transportation: params.transportation || [],
      trainClasses: params.trainClasses || [],
      flightClasses: params.flightClasses || [],
      starRating: params.starRating || 3,
      includeActivities: params.includeActivities ?? true,
      accommodations: params.accommodations || ['hotels'],
      // Keep preferences for any additional fields
      preferences: {
        interests: params.interests,
        budgetFlexibility: params.budgetFlexibility,
        priority: params.priority,
        travelStyle: params.travelStyle,
      },
    };

    const response = await fetchAPI<{ success: boolean; data: BackendTripResponse }>('/trips/plan', {
      method: 'POST',
      body: JSON.stringify(backendParams),
    });

    return transformTripResponse(response.data);
  },

  getById: async (tripId: string): Promise<TripResponse> => {
    const response = await fetchAPI<{ success: boolean; data: BackendTripResponse }>(`/trips/${tripId}`);
    return transformTripResponse(response.data);
  },

  book: (tripId: string, data: { planTier: string; contactInfo: any; paymentMethod?: string }) =>
    fetchAPI<{ success: boolean; message: string; data: any }>(`/trips/${tripId}/book`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getPopularSuggestions: () =>
    fetchAPI<{
      success: boolean;
      count: number;
      data: Array<{
        id: string;
        title: string;
        destinations: string[];
        duration: string;
        startingPrice: number;
        bestTime: string;
      }>;
    }>('/trips/suggestions/popular'),

  saveTrip: (data: { plan: TripPlanData; tripDetails?: any; formData?: any }) =>
    fetchAPI<{ success: boolean; message: string; data: { tripId: string; source: string; destination: string } }>('/trips/save', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ============ Auth API ============
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  preferences: { currency: string; language: string; notifications: boolean; emailUpdates?: boolean };
  savedTrips?: string[];
  createdAt: string;
}

export const authAPI = {
  register: (data: { email: string; password: string; name: string; phone?: string }) =>
    fetchAPI<{ success: boolean; message: string; data: { user: AuthUser; accessToken: string; refreshToken: string } }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  login: (data: { email: string; password: string }) =>
    fetchAPI<{ success: boolean; message: string; data: { user: AuthUser; accessToken: string; refreshToken: string } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  logout: () => {
    const refreshToken = localStorage.getItem('refreshToken');
    return fetchAPI<{ success: boolean; message: string }>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  refreshToken: () => {
    const refreshToken = localStorage.getItem('refreshToken');
    return fetchAPI<{ success: boolean; data: { accessToken: string; refreshToken: string } }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  getMe: () => fetchAPI<{ success: boolean; data: AuthUser }>('/auth/me'),

  updateProfile: (data: { name?: string; phone?: string; preferences?: Record<string, any> }) =>
    fetchAPI<{ success: boolean; message: string; data: AuthUser }>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Export format helper
export const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default {
  cities: citiesAPI,
  flights: flightsAPI,
  trains: trainsAPI,
  hotels: hotelsAPI,
  trips: tripsAPI,
  auth: authAPI,
};
