// src/types/trip.types.ts

export type Category = 'transport' | 'accommodation' | 'meal' | 'activity';

export interface TripOption {
  id: string;
  type: string; // e.g., 'flight', 'hotel', 'italian_restaurant'
  name: string;
  price: number; // Unit price (per ticket, per night, per meal)
  priority: number; // 1 is highest, 5 is lowest
  category: Category;
  rating: number; // 0-5
  details?: any; // Extra metadata
}

export interface UserPreferences {
  budget: number;
  travelers: number;
  durationDays: number;
  dates: {
    departure: Date;
    return: Date;
  };
  // Pre-sorted arrays of options based on user questionnaire
  // Index 0 = User's Top Choice (Priority 1)
  options: {
    transport: TripOption[];
    accommodation: TripOption[];
    meal: TripOption[];
    activity: TripOption[];
  };
}

export interface TripPlan {
  totalCost: number;
  score: number;
  selections: {
    transport: TripOption;
    accommodation: TripOption;
    meal: TripOption;
    activity: TripOption;
  };
  breakdown: {
    transportTotal: number;
    accommodationTotal: number;
    foodTotal: number;
    activityTotal: number;
  };
}

export interface BudgetSplit {
  transport: number; // percentage (0-1)
  accommodation: number;
  meal: number;
  activity: number;
}