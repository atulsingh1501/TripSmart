// src/services/TripAlgorithmService.ts
import { UserPreferences, TripPlan, TripOption, BudgetSplit, Category } from '../types/trip.types';

export class TripAlgorithmService {

  /**
   * Main Entry Point: Generates optimal trip plans based on budget and preferences
   */
  public generateTripPlans(prefs: UserPreferences): TripPlan[] {
    const validPlans: TripPlan[] = [];
    
    // 1. Calculate dynamic budget split (Guide for the AI, not a hard constraint for total)
    const split = this.calculateDynamicSplit(prefs.durationDays);
    
    // 2. Initialize indices for backtracking [transport, acc, meal, activity]
    // All start at 0 (User's #1 choice for everything)
    let indices = { transport: 0, accommodation: 0, meal: 0, activity: 0 };
    
    // Maximum iterations to prevent infinite loops (safety break)
    let safetyCounter = 0;
    const MAX_ITERATIONS = 1000; 

    // 3. BACKTRACKING LOOP
    while (safetyCounter < MAX_ITERATIONS) {
      safetyCounter++;

      // Get current combination of options based on indices
      const currentCombo = {
        transport: prefs.options.transport[indices.transport],
        accommodation: prefs.options.accommodation[indices.accommodation],
        meal: prefs.options.meal[indices.meal],
        activity: prefs.options.activity[indices.activity]
      };

      // Check if this combination exists (handling array bounds)
      if (this.isValidCombo(currentCombo)) {
        
        // Calculate costs
        const costs = this.calculateCosts(currentCombo, prefs);
        
        if (costs.totalCost <= prefs.budget) {
          // FEASIBLE SOLUTION FOUND!
          const plan = this.createPlanObject(currentCombo, costs, prefs);
          validPlans.push(plan);

          // Optimization: If we found a "Perfect" plan (top choices), we might stop or look for diverse options
          // For now, we continue to find cheaper alternatives
        }
      }

      // 4. DOWNGRADE LOGIC (The "State Management" requested)
      // Try to find the next combination by downgrading the lowest priority category first
      // Order: Activity -> Meal -> Accommodation -> Transport
      const specificOrder: Category[] = ['activity', 'meal', 'accommodation', 'transport'];
      
      const couldDowngrade = this.downgradeIndices(indices, prefs.options, specificOrder);
      
      if (!couldDowngrade) {
        break; // We have exhausted all possible combinations
      }
    }

    // 5. Sort plans by Score (Best mix of Quality vs Price)
    return validPlans.sort((a, b) => b.score - a.score).slice(0, 5); // Return top 5
  }

  /**
   * Logic to adjust budget percentages based on trip length
   */
  private calculateDynamicSplit(days: number): BudgetSplit {
    if (days <= 3) {
      // Short trip: Higher transport cost relative to stay
      return { transport: 0.45, accommodation: 0.30, meal: 0.15, activity: 0.10 };
    } else if (days >= 8) {
      // Long trip: Transport cost amortized, accommodation eats more budget
      return { transport: 0.25, accommodation: 0.40, meal: 0.20, activity: 0.15 };
    }
    // Standard trip
    return { transport: 0.35, accommodation: 0.35, meal: 0.15, activity: 0.15 };
  }

  /**
   * Calculates the exact cost of a specific combination
   */
  private calculateCosts(combo: any, prefs: UserPreferences) {
    // 1. Transport: Price * Travelers
    const transportTotal = combo.transport.price * prefs.travelers;

    // 2. Accommodation: Price * Nights (Handle overnight travel logic here)
    const nights = this.calculateNights(prefs.dates.departure, prefs.dates.return);
    const accommodationTotal = combo.accommodation.price * nights; // Assuming room share logic is handled in unit price for MVP

    // 3. Food: Price * Days * 3 meals * Travelers
    const foodTotal = combo.meal.price * prefs.durationDays * 3 * prefs.travelers;

    // 4. Activity: Price * Days * Travelers (Assuming 1 paid activity per day)
    const activityTotal = combo.activity.price * (prefs.durationDays - 1) * prefs.travelers;

    return {
      totalCost: transportTotal + accommodationTotal + foodTotal + activityTotal,
      breakdown: { transportTotal, accommodationTotal, foodTotal, activityTotal }
    };
  }

  /**
   * The Backtracking State Manager
   * Returns TRUE if it successfully moved to a new valid state
   * Returns FALSE if no more states are available (search complete)
   */
  private downgradeIndices(
    currentIndex: { [key in Category]: number }, 
    options: any, 
    order: Category[]
  ): boolean {
    
    for (const category of order) {
      // Can we downgrade this category?
      if (currentIndex[category] < options[category].length - 1) {
        
        // Yes, increment this category's index (choosing a lower priority/cheaper option)
        currentIndex[category]++;
        
        // IMPORTANT: Reset all lower-level categories back to 0 (Best Choice)
        // Because if we downgrade Hotel, we should try to pair it with the Best Food again first
        const categoryPriorityIndex = order.indexOf(category);
        for (let i = 0; i < categoryPriorityIndex; i++) {
          const lowerCategory = order[i];
          currentIndex[lowerCategory] = 0;
        }
        
        return true; // Successfully moved to next state
      }
    }
    
    return false; // Cannot downgrade anything else, we are at the bottom of the tree
  }

  /**
   * Helper: Calculate nights requiring accommodation
   */
  private calculateNights(start: Date, end: Date): number {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays - 1); // Usually duration - 1 night, simplistic for MVP
  }

  private isValidCombo(combo: any): boolean {
    return combo.transport && combo.accommodation && combo.meal && combo.activity;
  }

  private createPlanObject(combo: any, costs: any, prefs: UserPreferences): TripPlan {
    // Scoring Formula: 
    // Weight preferences (Transport 35%, Acc 30%, Food 20%, Activity 15%)
    // Normalized by Priority (1 is best)
    
    const score = (
      (1 / combo.transport.priority) * 35 +
      (1 / combo.accommodation.priority) * 30 +
      (1 / combo.meal.priority) * 20 +
      (1 / combo.activity.priority) * 15
    );

    return {
      totalCost: costs.totalCost,
      score: Math.round(score),
      selections: combo,
      breakdown: costs.breakdown
    };
  }
}