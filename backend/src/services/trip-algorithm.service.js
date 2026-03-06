/**
 * Trip Algorithm Service
 * 
 * Implements a priority-based backtracking algorithm for trip planning.
 * 
 * ALGORITHM OVERVIEW:
 * ==================
 * Think of it like a clock with 4 hands:
 *   - Transport (Hour hand)      - Slowest to change, highest priority
 *   - Accommodation (30-min hand) - Changes when transport is exhausted
 *   - Meal (Minute hand)         - Changes more frequently
 *   - Activity (Second hand)     - Changes most frequently, lowest priority
 * 
 * BACKTRACKING BEHAVIOR:
 * ======================
 * When we downgrade a category, we RESET all lower-priority categories to 0 (top choice).
 * This ensures we always try the best possible options for lower categories before
 * downgrading them too.
 * 
 * Example: If we have Flight-1AC + 5-star Hotel + Fine Dining + Premium Activities
 * and it doesn't fit budget:
 *   1. Try Flight-1AC + 5-star + Fine Dining + STANDARD Activities
 *   2. Try Flight-1AC + 5-star + Fine Dining + BUDGET Activities
 *   3. (Activities exhausted) Reset activities to Premium, downgrade Meal to MEDIUM
 *   4. Try Flight-1AC + 5-star + Medium Dining + Premium Activities
 *   5. ... and so on until we find a fit or exhaust all options
 * 
 * CONFIGURATION:
 * ==============
 * BACKTRACK_ORDER: Order of categories for downgrading (lowest priority first)
 *   Default: ['activity', 'meal', 'accommodation', 'transport']
 *   Alternative: ['meal', 'activity', 'accommodation', 'transport'] - if meals matter less
 * 
 * CATEGORY_WEIGHTS: Weights for scoring plans (higher = more important to user)
 */

const TRIP_CONFIG = require('../config/trip.config');

/**
 * CONFIGURABLE: Order of categories for backtracking
 * 
 * CATEGORIES:
 *   - transport: Inter-city travel (Flights, Trains, Buses, Car Rentals)
 *   - accommodation: Hotels, Hostels, etc.
 *   - meal: Food budget tier
 *   - activity: Activities/Attractions + Local Transport (Autos, Bikes, etc.)
 * 
 * The FIRST item in this array will be downgraded FIRST (lowest priority).
 * The LAST item will be downgraded LAST (highest priority - we try to preserve it).
 * 
 * Default Order:
 *   ['activity', 'meal', 'accommodation', 'transport']
 *   → Preserves inter-city transport choice longest
 */
const BACKTRACK_ORDER = ['activity', 'meal', 'accommodation', 'transport'];

/**
 * Priority weights for scoring (higher weight = more important)
 * Used to rank plans by how well they match user's TOP preferences
 * 
 * Budget Split Default:
 *   Transport (Inter-city): 40% - Flights, Trains, Buses, Car Rentals
 *   Accommodation: 30%
 *   Meals: 15%
 *   Activities + Local Transport: 15% - Activities + Autos/Bikes to get there
 */
const CATEGORY_WEIGHTS = {
    transport: 40,        // Inter-city ONLY: Flights, Trains, Buses, Car Rentals
    accommodation: 30,
    meal: 15,
    activity: 15          // Includes: Attractions + Local Transport (Autos, Bikes, Cabs)
};

class TripAlgorithmService {

    /**
     * Main Entry Point: Generates optimal trip plans based on budget and preferences
     * @param {Object} params - Algorithm parameters
     * @returns {Object} - { plans: TripPlan[], warnings: string[], cheapestPossible: number }
     */
    static generateTripPlans(params) {
        const {
            budget,
            travelers = 1,
            durationDays,
            nights,
            tripType = 'tour',
            noStay = false,
            includeActivities = true,
            budgetFlexibility = 'moderate',
            isReturnTrip = true,  // NEW: affects transport cost multiplier and hotel nights
            options = {}
        } = params;

        console.log('\n========== TRIP ALGORITHM START ==========');
        console.log(`Budget: ₹${budget.toLocaleString()} | Days: ${durationDays} | Travelers: ${travelers} | Type: ${tripType} | Return: ${isReturnTrip}`);
        console.log(`Budget Flexibility: ${budgetFlexibility} | Include Activities: ${includeActivities}`);

        const validPlans = [];
        const warnings = [];
        let cheapestPossible = Infinity;
        // Track cheapest over-budget plan per transport mode (for premium tier when no within-budget premium exists)
        const cheapestOverBudgetByMode = {};

        // 2. Validate we have options
        const transportOptions = options.transport || [];
        const accommodationOptions = noStay ? [{ id: 'no-stay', name: 'No Accommodation', price: 0, priority: 1 }] : (options.accommodation || []);
        const mealOptions = options.meal || [];

        // Activity options: Skip if user opted out OR if direct travel without activities
        const shouldIncludeActivities = includeActivities && tripType !== 'direct';
        const activityOptions = shouldIncludeActivities
            ? (options.activity || [])
            : [{ id: 'no-activity', name: 'No Activities', price: 0, priority: 1, excluded: true }];

        console.log(`Options: ${transportOptions.length} Transport | ${accommodationOptions.length} Accommodation | ${mealOptions.length} Meal | ${activityOptions.length} Activity${!shouldIncludeActivities ? ' (EXCLUDED)' : ''}`);

        if (transportOptions.length === 0) {
            warnings.push('No transport options available for this route');
            return { plans: [], warnings, cheapestPossible: 0 };
        }

        // 3. Initialize indices for backtracking
        const indices = { transport: 0, accommodation: 0, meal: 0, activity: 0 };
        const optionsMap = {
            transport: transportOptions,
            accommodation: accommodationOptions,
            meal: mealOptions,
            activity: activityOptions
        };

        // Safety counter - set dynamically to cover all combinations + 10% buffer
        let iterations = 0;
        const totalCombinations = transportOptions.length * accommodationOptions.length * mealOptions.length * activityOptions.length;
        const MAX_ITERATIONS = Math.max(5000, Math.ceil(totalCombinations * 1.1));
        console.log(`Max Iterations: ${MAX_ITERATIONS} (covers ${totalCombinations} combinations)`);

        // 4. PHASE 1: Backtracking loop to find all feasible solutions
        console.log('\n--- PHASE 1: Finding Feasible Solutions ---');

        // Track over-budget plans in case we need to show cheapest options
        const overBudgetPlans = [];

        while (iterations < MAX_ITERATIONS) {
            iterations++;

            // Get current combination
            const combo = {
                transport: transportOptions[indices.transport],
                accommodation: accommodationOptions[indices.accommodation],
                meal: mealOptions[indices.meal] || { price: 0, priority: 1 },
                activity: activityOptions[indices.activity] || { price: 0, priority: 1 }
            };

            // Validate combination exists
            if (this._isValidCombo(combo)) {
                // Calculate costs
                const costs = this._calculateCosts(combo, { travelers, durationDays, nights, noStay, tripType, isReturnTrip });

                // Track cheapest possible
                if (costs.totalCost < cheapestPossible) {
                    cheapestPossible = costs.totalCost;
                }

                // Log attempt (disabled for cleaner output)
                const transDesc = `${combo.transport.mode || combo.transport.type} ${combo.transport.class || ''}`.trim();
                const accomDesc = combo.accommodation.name ? `${combo.accommodation.stars || 0}★ ${combo.accommodation.name.substring(0, 20)}` : 'None';
                // console.log(`[${iterations}] Trying: ${transDesc} + ${accomDesc} = ₹${costs.totalCost.toLocaleString()}`);

                // Calculate score for this plan
                const score = this._scorePlan(combo, indices, costs.totalCost, budget);

                if (costs.totalCost <= budget) {
                    // Found a valid plan!
                    // console.log(`  ✅ VALID! Score: ${score} (₹${costs.totalCost.toLocaleString()}, ${Math.round(costs.totalCost / budget * 100)}% of budget)`);

                    validPlans.push({
                        id: `plan-${validPlans.length + 1}`,
                        totalCost: costs.totalCost,
                        score,
                        selections: combo,
                        breakdown: costs.breakdown,
                        indices: { ...indices },
                        withinBudget: true,
                        budgetUtilization: costs.totalCost / budget
                    });
                } else {
                    // Track over-budget plans (keep top 10 cheapest globally for fallback)
                    if (overBudgetPlans.length < 10 || costs.totalCost < overBudgetPlans[overBudgetPlans.length - 1].totalCost) {
                        overBudgetPlans.push({
                            id: `plan-over-${overBudgetPlans.length + 1}`,
                            totalCost: costs.totalCost,
                            score,
                            selections: combo,
                            breakdown: costs.breakdown,
                            indices: { ...indices },
                            withinBudget: false,
                            overBudgetBy: costs.totalCost - budget
                        });
                        // Sort and keep only top 10
                        overBudgetPlans.sort((a, b) => a.totalCost - b.totalCost);
                        if (overBudgetPlans.length > 10) overBudgetPlans.pop();
                    }
                    // Also track cheapest over-budget per mode (for premium tier fallback)
                    const overMode = combo.transport.mode || combo.transport.type || 'unknown';
                    if (!cheapestOverBudgetByMode[overMode] || costs.totalCost < cheapestOverBudgetByMode[overMode].totalCost) {
                        cheapestOverBudgetByMode[overMode] = {
                            id: `plan-over-${overMode}-${iterations}`,
                            totalCost: costs.totalCost,
                            score,
                            selections: combo,
                            breakdown: costs.breakdown,
                            indices: { ...indices },
                            withinBudget: false,
                            budgetUtilization: costs.totalCost / budget,
                            overBudgetBy: costs.totalCost - budget
                        };
                    }
                }
            }

            // Try to move to next combination
            const canContinue = this._downgradeIndices(indices, optionsMap, BACKTRACK_ORDER);
            if (!canContinue) {
                console.log('All combinations exhausted.');
                break;
            }
        }

        console.log(`\nPhase 1 Complete: Found ${validPlans.length} valid plans in ${iterations} iterations`);
        if (overBudgetPlans.length > 0) {
            console.log(`   Also tracked ${overBudgetPlans.length} over-budget plans (cheapest: ₹${overBudgetPlans[0]?.totalCost})`);
        }

        // 5. PHASE 2: Selection & Categorization based on Budget Flexibility
        // ================================================================
        // PHASE 1 found ALL valid combinations within budget.
        // PHASE 2 selects the BEST ones to show user based on their flexibility.
        // 
        // Three strategies:
        // 1. STRICT: Only show plans within budget, sorted by quality
        // 2. MODERATE: Show 3 plans around budget + 2 high-quality alternatives
        // 3. FLEXIBLE: Show 1 higher, 1 same, 1 lower + 2 premium options
        console.log('\n--- PHASE 2: Selection & Categorization ---');
        console.log(`Strategy: ${budgetFlexibility.toUpperCase()}`);

        // Initialize rankedPlans at function scope level
        let rankedPlans = [];

        if (validPlans.length > 0) {
            console.log('\n--- PHASE 2: Structured Selection (Budget / Best Value / Premium per mode) ---');

            // Group valid plans by transport MODE (flight, train, bus, etc.)
            const validPlansByMode = {};
            validPlans.forEach(plan => {
                const mode = plan.selections.transport.mode || plan.selections.transport.type || 'unknown';
                if (!validPlansByMode[mode]) validPlansByMode[mode] = [];
                validPlansByMode[mode].push(plan);
            });

            // Iterate modes in the ORDER the user specified (preserves user preference)
            const seenModes = new Set();
            const orderedModes = optionsMap.transport
                .map(t => t.mode || t.type || 'unknown')
                .filter(m => { if (seenModes.has(m)) return false; seenModes.add(m); return true; });

            console.log(`   Modes in user selection order: [${orderedModes.join(', ')}]`);

            for (const mode of orderedModes) {
                const modePlans = validPlansByMode[mode] || [];
                const overBudgetFallback = cheapestOverBudgetByMode[mode] || null;
                const modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1);

                if (modePlans.length === 0 && !overBudgetFallback) {
                    console.log(`   ⚠️  No plans for mode: ${mode} — skipping`);
                    continue;
                }

                if (modePlans.length === 0) {
                    // All options for this mode exceed budget — show cheapest over-budget as only option
                    rankedPlans.push({
                        ...overBudgetFallback,
                        isOverBudget: true,
                        category: `${modeLabel} Option (Over Budget)`
                    });
                    console.log(`   ⚠️  ${modeLabel} all over budget: cheapest ₹${overBudgetFallback.totalCost.toLocaleString()} (₹${overBudgetFallback.overBudgetBy.toLocaleString()} over)`);
                    continue;
                }

                const sortedByCostAsc  = [...modePlans].sort((a, b) => a.totalCost - b.totalCost);
                const sortedByCostDesc = [...modePlans].sort((a, b) => b.totalCost - a.totalCost);
                const usedIds = new Set();

                // ── BUDGET: cheapest valid plan for this mode ──
                const budgetPlan = sortedByCostAsc[0];
                usedIds.add(budgetPlan.id);
                rankedPlans.push({ ...budgetPlan, category: `Budget ${modeLabel}` });
                console.log(`   ✅ Budget ${modeLabel}: ${budgetPlan.selections.transport.name} + ${budgetPlan.selections.accommodation.name?.substring(0,25)} = ₹${budgetPlan.totalCost.toLocaleString()} (${Math.round(budgetPlan.budgetUtilization * 100)}%)`);

                // ── BEST VALUE: plan closest to 90 % budget utilisation ──
                const bestValuePlan = [...modePlans]
                    .filter(p => !usedIds.has(p.id))
                    .sort((a, b) => Math.abs(a.budgetUtilization - 0.90) - Math.abs(b.budgetUtilization - 0.90))[0];

                if (bestValuePlan) {
                    usedIds.add(bestValuePlan.id);
                    rankedPlans.push({ ...bestValuePlan, category: `Best Value ${modeLabel}` });
                    console.log(`   ✅ Best Value ${modeLabel}: ${bestValuePlan.selections.transport.name} + ${bestValuePlan.selections.accommodation.name?.substring(0,25)} = ₹${bestValuePlan.totalCost.toLocaleString()} (${Math.round(bestValuePlan.budgetUtilization * 100)}%)`);
                }

                // ── PREMIUM: most expensive within budget (best hotel + transport) ──
                // Falls back to cheapest over-budget option for this mode.
                const premiumPlan = sortedByCostDesc.find(p => !usedIds.has(p.id));

                if (premiumPlan) {
                    usedIds.add(premiumPlan.id);
                    rankedPlans.push({ ...premiumPlan, category: `Premium ${modeLabel}` });
                    console.log(`   ✅ Premium ${modeLabel}: ${premiumPlan.selections.transport.name} + ${premiumPlan.selections.accommodation.name?.substring(0,25)} = ₹${premiumPlan.totalCost.toLocaleString()} (${Math.round(premiumPlan.budgetUtilization * 100)}%)`);
                } else if (overBudgetFallback) {
                    rankedPlans.push({
                        ...overBudgetFallback,
                        isOverBudget: true,
                        category: `Premium ${modeLabel}`
                    });
                    console.log(`   ⚠️  Premium ${modeLabel} (over budget): ₹${overBudgetFallback.totalCost.toLocaleString()} (₹${overBudgetFallback.overBudgetBy.toLocaleString()} over)`);
                }
            }

            console.log(`\n   Total structured plans: ${rankedPlans.length}`);
            rankedPlans.forEach(p => {
                const util = p.isOverBudget
                    ? `OVER ₹${p.overBudgetBy?.toLocaleString()}`
                    : `${Math.round((p.budgetUtilization || 0) * 100)}%`;
                console.log(`      - ${p.category}: ${p.selections.transport.name} — ₹${p.totalCost.toLocaleString()} (${util})`);
            });

        } else if (overBudgetPlans.length > 0) {
            // 7. No valid plans - return diverse over-budget options
            console.log('\n⚠️  No plans within budget - returning diverse over-budget options');

            // Sort by score to get quality options, not just cheapest
            const sortedByScore = [...overBudgetPlans].sort((a, b) => b.score - a.score);
            rankedPlans = sortedByScore.slice(0, 3);

            const gap = overBudgetPlans[0].totalCost - budget;
            warnings.push({
                type: 'BUDGET_INSUFFICIENT',
                message: `No options within ₹${budget.toLocaleString()}. Showing ${rankedPlans.length} closest options starting at ₹${overBudgetPlans[0].totalCost.toLocaleString()} (₹${gap.toLocaleString()} over budget)`,
                minimumRequired: overBudgetPlans[0].totalCost,
                suggestions: this._generateSuggestions(cheapestPossible, budget, optionsMap)
            });
        } else {
            // No options at all - rankedPlans stays empty
            rankedPlans = [];
            warnings.push({
                type: 'NO_OPTIONS',
                message: 'No travel options found for this route/date combination',
                suggestions: ['Try different dates', 'Try a different route']
            });
        }

        console.log(`\nReturning ${rankedPlans.length} plans. Top score: ${rankedPlans[0]?.score || 0}`);
        console.log('========== TRIP ALGORITHM END ==========\n');

        return {
            plans: rankedPlans,
            warnings,
            cheapestPossible,
            iterations
        };
    }

    /**
     * Calculate dynamic budget split based on trip duration
     * 
     * CATEGORIES:
     *   transport: Inter-city ONLY (Flights, Trains, Buses, Car Rentals)
     *   accommodation: Hotels, Hostels, etc.
     *   meal: Food budget
     *   activity: Attractions + Local Transport (Autos, Bikes, Cabs to get around)
     * 
     * @param {number} days - Trip duration
     * @param {string} tripType - 'tour' or 'direct'
     * @param {boolean} includeActivities - Whether to include activities in budget
     */
    static calculateDynamicSplit(days, tripType = 'tour', includeActivities = true, noStay = false) {
        let base;

        if (days <= 3) {
            // Short trip: Higher transport proportion
            base = { transport: 45, accommodation: 25, meal: 15, activity: 15 };
        } else if (days >= 8) {
            // Long trip: Accommodation dominates, more local transport needed
            base = { transport: 25, accommodation: 35, meal: 20, activity: 20 };
        } else {
            // Standard trip (4-7 days)
            base = { transport: 35, accommodation: 30, meal: 15, activity: 20 };
        }

        // Adjust for direct travel
        if (tripType === 'direct') {
            if (includeActivities) {
                // Direct travel WITH activities (sightseeing at destination)
                base.transport += 5;
                base.activity = 10;  // Less activities than tour
                base.accommodation += 5;
            } else {
                // Direct travel WITHOUT activities (just transportation + stay)
                // Redistribute activity budget to transport and meals
                base.transport += 10;
                base.accommodation += 5;
                base.meal += 5;
                base.activity = 0;  // No activity budget
            }
        }

        // NEW: If noStay, set accommodation to 0 and redistribute
        if (noStay) {
            const accomBudget = base.accommodation;
            base.accommodation = 0;
            // Redistribute: 80% to transport, 20% to meals
            base.transport += Math.round(accomBudget * 0.8);
            base.meal += Math.round(accomBudget * 0.2);
        }

        return base;
    }

    /**
     * Calculate nights between two dates
     * @private
     */
    static _calculateNights(checkInDate, checkOutDate) {
        if (!checkInDate || !checkOutDate) return 0;
        
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        
        // Calculate difference in milliseconds and convert to days
        const diffTime = Math.abs(checkOut - checkIn);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    }

    /**
     * Calculate nights in transit based on transport departure time and duration
     * @private
     */
    static _calculateNightsInTransit(transport) {
        const departureTime = transport.details?.departure || '09:00';
        const duration = transport.details?.duration || '2h';
        
        // Parse departure time to minutes from midnight
        const depParts = departureTime.split(':');
        const depHour = parseInt(depParts[0]) || 9;
        const depMin = parseInt(depParts[1]) || 0;
        const depMinuteOfDay = depHour * 60 + depMin;
        
        // Parse duration to total minutes
        let durationMinutes = 0;
        if (typeof duration === 'object' && duration !== null) {
            // Handle { hours, minutes } object format
            durationMinutes = (duration.hours || 0) * 60 + (duration.minutes || 0);
        } else if (typeof duration === 'string') {
            const hoursMatch = duration.match(/(\d+)\s*h/i);
            const minsMatch = duration.match(/(\d+)\s*m/i);
            if (hoursMatch) durationMinutes += parseInt(hoursMatch[1]) * 60;
            if (minsMatch) durationMinutes += parseInt(minsMatch[1]);
        } else if (typeof duration === 'number') {
            durationMinutes = duration < 48 ? duration * 60 : duration;
        }
        
        // CORRECT FORMULA: How many midnight boundaries (calendar days) are crossed?
        // nightsInTransit = floor((departure_minutes_from_midnight + duration_minutes) / 1440)
        //
        // Examples:
        //   Depart 20:00 (1200), 2h10m (130min) → 1330 → floor(1330/1440) = 0  (same day) ✅
        //   Depart 16:35 (995), 16h35m (995min) → 1990 → floor(1990/1440) = 1  (next day) ✅
        //   Depart 23:00 (1380), 17h (1020min) →  2400 → floor(2400/1440) = 1  (next day) ✅
        //   Depart 08:00 (480), 40h (2400min) →   2880 → floor(2880/1440) = 2  (2 days)   ✅
        const nightsInTransit = Math.floor((depMinuteOfDay + durationMinutes) / (24 * 60));
        
        return nightsInTransit;
    }

    /**
     * Calculate total cost for a combination
     * @private
     */
    static _calculateCosts(combo, params) {
        const { travelers, durationDays, nights, noStay, tripType, isReturnTrip = true } = params;

        // 1. Transport: Total fare (already calculated per person * travelers * round trip factor)
        const transportTotal = combo.transport.totalCost || combo.transport.price || 0;

        // 2. Accommodation: Price per night * nights * rooms needed
        let accommodationTotal = 0;
        let nightsForThisPlan = nights;

        // For ONE-WAY trips: stayNights is the number of nights AT the destination.
        // The overnight travel is the journey TO get there, not a night at the destination.
        // So we do NOT reduce hotel nights by nightsInTransit for one-way trips.
        //
        // For ROUND TRIPS: total nights span includes travel days, so overnight transit
        // directly reduces the nights you need a hotel (you slept on the train/flight).
        if (isReturnTrip) {
            const nightsInTransit = this._calculateNightsInTransit(combo.transport);
            nightsForThisPlan = Math.max(0, nights - nightsInTransit);
        }
        // else: nightsForThisPlan stays as `nights` (the user-specified stay duration)
        
        if (!noStay && combo.accommodation && combo.accommodation.price > 0) {
            const roomsNeeded = Math.ceil(travelers / 2);
            const pricePerNight = combo.accommodation.price || combo.accommodation.pricePerNight || 0;
            
            // If accommodation has specific check-in/check-out dates, use those instead
            if (combo.accommodation.checkInDate && combo.accommodation.checkOutDate) {
                nightsForThisPlan = this._calculateNights(
                    combo.accommodation.checkInDate,
                    combo.accommodation.checkOutDate
                );
                console.log(`📅 Plan-specific nights from dates: ${nightsForThisPlan} (${combo.accommodation.checkInDate} → ${combo.accommodation.checkOutDate})`);
            }
            
            accommodationTotal = pricePerNight * nightsForThisPlan * roomsNeeded;
        }

        // 3. Meals: Price per meal * 3 meals * days * travelers
        const mealPrice = combo.meal?.price || TRIP_CONFIG.MEAL_COSTS?.BUDGET?.min || 100;
        const foodTotal = mealPrice * 3 * durationDays * travelers;

        // 4. Activities + Local Transport (combined)
        // Skip if activity is explicitly excluded (user chose not to include activities)
        let activityTotal = 0;
        const activityExcluded = combo.activity?.excluded === true;

        if (!activityExcluded) {
            if (tripType === 'tour' && combo.activity && combo.activity.price > 0) {
                const explorationDays = Math.max(1, durationDays - 1); // Exclude travel days
                const attractionCost = combo.activity.price * explorationDays * travelers;

                // Add estimated local transport cost (₹300/day for autos/bikes to get around)
                const localTransportPerDay = 300; // Average for autos/bikes
                const localTransportCost = localTransportPerDay * explorationDays * Math.ceil(travelers / 2);

                activityTotal = attractionCost + localTransportCost;
            } else if (tripType === 'direct' && combo.activity && combo.activity.price > 0) {
                // Direct travel with activities
                const explorationDays = Math.max(1, durationDays - 1);
                activityTotal = combo.activity.price * explorationDays * travelers;
            }
        }
        // If activityExcluded, activityTotal remains 0

        return {
            totalCost: transportTotal + accommodationTotal + foodTotal + activityTotal,
            breakdown: {
                transportTotal,         // Inter-city: Flights, Trains, Buses, Car Rentals
                accommodationTotal,
                foodTotal,
                activityTotal,          // 0 if excluded
                activitiesIncluded: !activityExcluded,  // NEW: Flag for frontend
                nightsUsed: nightsForThisPlan  // UPDATED: Track nights used for this specific plan
            }
        };
    }

    /**
     * Backtracking State Manager - The "Clock" Logic
     * 
     * RESET LOGIC:
     * ============
     * When we downgrade a category (like moving the "hour" hand), we RESET all 
     * lower-priority categories (the "minute" and "second" hands) back to 0.
     * 
     * WHY? Because when we try a cheaper hotel, we should first try pairing it 
     * with the BEST food and activities again, before downgrading those too.
     * 
     * EXAMPLE:
     * --------
     * Order: [activity(0), meal(1), accommodation(2), transport(3)]
     *        ↑ lowest priority                      ↑ highest priority
     * 
     * Indices: { transport: 0, accommodation: 0, meal: 0, activity: 2 }
     * (User is on their 3rd activity choice, but top transport/hotel/meal)
     * 
     * When activity[2] is exhausted (no more activity options):
     *   1. We upgrade category to 'meal' (index 1 in order)
     *   2. We increment meal index: meal becomes 1
     *   3. We RESET 'activity' (index 0, which is < 1) back to 0
     * 
     * New Indices: { transport: 0, accommodation: 0, meal: 1, activity: 0 }
     * → Now we try 2nd meal choice with BEST activity again!
     * 
     * @param {Object} indices - Current selection indices { transport: 0, ... }
     * @param {Object} options - Available options map { transport: [...], ... }
     * @param {string[]} order - Priority order (lowest first)
     * @returns {boolean} - true if successfully moved to next state, false if exhausted
     */
    static _downgradeIndices(indices, options, order) {
        // Walk through categories from lowest to highest priority
        for (const category of order) {
            const maxIndex = (options[category]?.length || 1) - 1;

            if (indices[category] < maxIndex) {
                // ✅ This category has more options - DOWNGRADE it
                indices[category]++;

                // Special logging for tree expansion visualization (disabled)
                // if (category === 'transport') {
                //     console.log(`\n🌳 TREE EXPANSION: Transport downgraded to option ${indices[category]}`);
                //     console.log(`   → Resetting accommodation, meal, activity to TOP choices (0)`);
                // } else {
                //     console.log(`  ↓ Downgrading ${category.toUpperCase()} to option ${indices[category]}`);
                // }

                // 🔄 RESET LOGIC: Reset all lower-priority categories back to 0 (top choice)
                // This ensures we try the BEST options for lower categories with this new choice
                const categoryIdx = order.indexOf(category);
                for (let i = 0; i < categoryIdx; i++) {
                    const lowerCategory = order[i];
                    if (indices[lowerCategory] !== 0) {
                        indices[lowerCategory] = 0;
                        // console.log(`    ↻ Resetting ${lowerCategory.toUpperCase()} to top choice`);
                    }
                }

                return true; // Successfully moved to next combination
            }
        }

        // All categories exhausted - no more combinations possible
        return false;
    }

    /**
     * Score a plan based on priority weights AND budget utilization
     * Higher score = better match to user preferences AND budget
     * 
     * Philosophy: Users want the BEST they can get for their budget,
     * not the cheapest option. A plan at ₹16,950 for ₹17,000 budget
     * is BETTER than ₹14,850.
     * 
     * @private
     */
    static _scorePlan(combo, indices, totalCost, budget) {
        // 1. Quality Score (40%): Based on priority of selections
        // Index 0 (top choice) gets full weight, higher indices get less
        const transportScore = CATEGORY_WEIGHTS.transport * (1 / (indices.transport + 1));
        const accommodationScore = CATEGORY_WEIGHTS.accommodation * (1 / (indices.accommodation + 1));
        const mealScore = CATEGORY_WEIGHTS.meal * (1 / (indices.meal + 1));
        const activityScore = CATEGORY_WEIGHTS.activity * (1 / (indices.activity + 1));

        const qualityScore = (transportScore + accommodationScore + mealScore + activityScore) * 0.4;

        // 2. Budget Utilization Score (60%): Reward plans close to budget
        // Plans that use 90-100% of budget get highest score
        // Plans using <70% get penalized (leaving money on table)
        let budgetScore = 0;
        if (totalCost <= budget) {
            const utilization = totalCost / budget;
            if (utilization >= 0.90) {
                // Excellent: Using 90-100% of budget
                budgetScore = 60;
            } else if (utilization >= 0.80) {
                // Good: Using 80-90% of budget
                budgetScore = 50 + (utilization - 0.80) * 100; // 50-60
            } else if (utilization >= 0.70) {
                // Fair: Using 70-80% of budget
                budgetScore = 40 + (utilization - 0.70) * 100; // 40-50
            } else {
                // Poor: Using <70% of budget (too cheap)
                budgetScore = utilization * 57; // 0-40
            }
        }

        return Math.round(qualityScore + budgetScore);
    }

    /**
     * Check if combination is valid
     * @private
     */
    static _isValidCombo(combo) {
        return combo.transport && combo.accommodation;
    }

    /**
     * Generate helpful suggestions when budget is too low
     * @private
     */
    static _generateSuggestions(minCost, budget, options) {
        const suggestions = [];
        const gap = minCost - budget;

        // Check if cheaper transport available
        if (options.transport && options.transport.length > 1) {
            const cheapest = options.transport[options.transport.length - 1];
            const mostExpensive = options.transport[0];
            if (cheapest.totalCost < mostExpensive.totalCost) {
                const savings = mostExpensive.totalCost - cheapest.totalCost;
                suggestions.push(`Try ${cheapest.mode || cheapest.type} instead (save ~₹${savings.toLocaleString()})`);
            }
        }

        // Check if cheaper accommodation available
        if (options.accommodation && options.accommodation.length > 1) {
            const cheapest = options.accommodation[options.accommodation.length - 1];
            if (cheapest.price > 0) {
                suggestions.push(`Try ${cheapest.stars || 2}★ hotels or hostels`);
            }
        }

        // Suggest reducing days
        suggestions.push(`Consider reducing trip duration by 1-2 days`);

        // Suggest increasing budget
        suggestions.push(`Increase budget by ₹${gap.toLocaleString()} for minimum viable trip`);

        return suggestions;
    }
}

module.exports = TripAlgorithmService;
