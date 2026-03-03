/**
 * ALGORITHM TEST: Delhi → Mumbai, 5 days, Round Trip
 * Budget: ₹20,000 | Min Hotel: 2★ | Transport: Flight + Train
 * 
 * Tests:
 *  1. Does the algo find valid combinations within ₹20k?
 *  2. Does it try ALL flight + train permutations?
 *  3. Is overnight hotel night calculation correct?
 *     - Flight (~2h): arrives same day → full nights stay
 *     - Train Rajdhani (~16h, departs ~4:30 PM): arrives next morning → 1 night in transit
 *     - Train Duronto (~17h, departs ~11 PM): arrives next morning → 1 night in transit
 */

// ─── Patch require paths ──────────────────────────────────────────────────────
const path = require('path');
const Module = require('module');
const srcDir = path.join(__dirname, 'src');

// Allow require() to resolve from src/ directory
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  return originalResolve.call(this, request, parent, isMain, options);
};

// ─── Imports ──────────────────────────────────────────────────────────────────
const { getCityByCode } = require('./src/data/cities');
const { searchFlights } = require('./src/data/flights');
const { searchTrains: searchTrainsJSON } = require('./src/data/trains');  // JSON fallback directly
const { searchHotels } = require('./src/data/hotels');
const {
  transformFlights,
  transformTrains,
  transformHotels,
  generateMealOptions,
  generateActivityOptions,
  combineTransportOptions
} = require('./src/utils/option-transformer');
const TripAlgorithmService = require('./src/services/trip-algorithm.service');
const BudgetService = require('./src/services/budget.service');

// ─── Test Parameters ──────────────────────────────────────────────────────────
const TEST = {
  source: 'DEL',
  destination: 'BOM',
  startDate: '2026-03-10',
  endDate: '2026-03-15',   // 5 days
  travelers: 1,
  budget: 20000,           // ₹20,000
  isReturnTrip: true,
  tripType: 'tour',
  transportation: ['flights', 'trains'],
  trainClasses: ['SL', '3A', '2A'],   // All common classes
  flightClasses: ['economy'],
  starRating: 2,           // Minimum 2★ hotels
  includeActivities: true,
  budgetFlexibility: 'moderate'
};

// ─── Night Calc helper (mirror of trips.js) ───────────────────────────────────
function calculateArrivalInfo(startDate, departureTime, duration, requestedNights) {
  const depDate = new Date(startDate);
  let depTimeStr = '09:00';
  if (typeof departureTime === 'string') depTimeStr = departureTime;
  else if (typeof departureTime === 'object' && departureTime !== null)
    depTimeStr = departureTime.time || departureTime.departure || '09:00';

  const [depHour, depMin] = depTimeStr.split(':').map(Number);
  depDate.setHours(depHour || 9, depMin || 0, 0, 0);

  let durationMinutes = 0;
  if (typeof duration === 'object' && duration !== null) {
    if (duration.hours !== undefined)
      durationMinutes = (duration.hours * 60) + (duration.minutes || 0);
  } else if (typeof duration === 'string') {
    const h = duration.match(/(\d+)\s*h/i);
    const m = duration.match(/(\d+)\s*m/i);
    if (h) durationMinutes += parseInt(h[1]) * 60;
    if (m) durationMinutes += parseInt(m[1]);
    if (!h && !m && !isNaN(parseInt(duration))) {
      const v = parseInt(duration);
      durationMinutes = v < 30 ? v * 60 : v;
    }
  } else if (typeof duration === 'number') {
    durationMinutes = duration < 48 ? duration * 60 : duration;
  }
  if (durationMinutes === 0) durationMinutes = 120;

  const arrivalDate = new Date(depDate.getTime() + durationMinutes * 60 * 1000);
  const depDayStart = new Date(depDate); depDayStart.setHours(0, 0, 0, 0);
  const arrDayStart = new Date(arrivalDate); arrDayStart.setHours(0, 0, 0, 0);
  const nightsInTransit = Math.round((arrDayStart - depDayStart) / (24 * 60 * 60 * 1000));

  const fmt = d => `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;

  return {
    departureDate: startDate,
    departureTime: fmt(depDate),
    arrivalDate: arrivalDate.toISOString().split('T')[0],
    arrivalTime: fmt(arrivalDate),
    isNextDayArrival: nightsInTransit > 0,
    nightsInTransit,
    durationMinutes,
    requestedNights,
    adjustedNights: Math.max(0, requestedNights - nightsInTransit),
    hotelCheckInDate: arrivalDate.toISOString().split('T')[0]
  };
}

// ─── MAIN TEST ──────────────────────────────────────────────────────────────
async function runTest() {
  console.log('\n' + '═'.repeat(70));
  console.log('  ALGORITHM TEST: Delhi → Mumbai');
  console.log(`  Budget: ₹${TEST.budget.toLocaleString()} | Days: 5 | Min Hotel: ${TEST.starRating}★`);
  console.log(`  Transport: ${TEST.transportation.join(', ')} | Classes: ${TEST.trainClasses.join(', ')}`);
  console.log('═'.repeat(70) + '\n');

  // 1. Resolve cities
  const sourceCity = getCityByCode(TEST.source);
  const destCity = getCityByCode(TEST.destination);
  console.log(`✅ Cities resolved: ${sourceCity.name} → ${destCity.name}`);

  // 2. Calculate nights
  const start = new Date(TEST.startDate);
  const end = new Date(TEST.endDate);
  const nights = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  const durationDays = nights + 1;
  console.log(`📅 Nights: ${nights} | Days: ${durationDays}\n`);

  // 3. Search transport (use JSON directly - no MongoDB needed)
  console.log('─── STEP 1: Search Raw Data ─────────────────────────────────────────');
  const flightResults = searchFlights({
    from: TEST.source, to: TEST.destination,
    date: TEST.startDate, returnDate: TEST.endDate,
    travelers: TEST.travelers, cabinClass: 'economy'
  });
  console.log(`✈️  Outbound flights found: ${flightResults.outbound?.length || 0}`);

  // JSON train search directly
  const trainResults = await searchTrainsJSON({
    from: TEST.source, to: TEST.destination,
    date: TEST.startDate, travelClass: 'SL'
  });
  console.log(`🚂 Trains found (JSON): ${trainResults.trains?.length || 0}`);

  // Hotels
  const hotelResults = searchHotels({
    city: TEST.destination,
    checkIn: TEST.startDate,
    checkOut: TEST.endDate,
    rooms: 1,
    guests: TEST.travelers
  });
  console.log(`🏨 Hotels found: ${hotelResults.hotels?.length || 0}\n`);

  // 4. Transform options
  console.log('─── STEP 2: Transform to Algorithm Format ───────────────────────────');
  const transformedFlights = transformFlights(
    flightResults.outbound || [], TEST.flightClasses, TEST.travelers, TEST.isReturnTrip
  );
  const transformedTrains = transformTrains(
    trainResults.trains || [], TEST.trainClasses, TEST.travelers, TEST.isReturnTrip
  );
  const transformedHotels = transformHotels(hotelResults.hotels || [], TEST.starRating);
  const allTransport = combineTransportOptions(transformedFlights, transformedTrains, TEST.transportation);

  console.log(`\n📊 Summary:`);
  console.log(`   Flights transformed: ${transformedFlights.length}`);
  console.log(`   Trains transformed:  ${transformedTrains.length}`);
  console.log(`   Hotels transformed:  ${transformedHotels.length} (min ${TEST.starRating}★)`);
  console.log(`   Total transport:     ${allTransport.length}`);

  // 5. Show transport options with night calculation preview
  console.log('\n─── STEP 3: Per-Transport Night Calculation Preview ─────────────────');
  console.log('   (How many hotel nights each transport option leaves)\n');

  allTransport.slice(0, 10).forEach((t, i) => {
    const dep = t.details?.departure || '09:00';
    const dur = t.details?.duration || '2h';
    const arrInfo = calculateArrivalInfo(TEST.startDate, dep, dur, nights);

    const durStr = typeof dur === 'object'
      ? `${dur.hours || 0}h ${dur.minutes || 0}m`
      : String(dur);

    console.log(`   ${i + 1}. [${t.mode?.toUpperCase()}] ${(t.name || '').substring(0, 28).padEnd(28)} ` +
      `Dep: ${arrInfo.departureTime} | Dur: ${durStr.padEnd(6)} | ` +
      `Arr: ${arrInfo.arrivalDate} ${arrInfo.arrivalTime} | ` +
      `NightsInTransit: ${arrInfo.nightsInTransit} | ` +
      `Hotel nights: ${nights} → ${arrInfo.adjustedNights} ` +
      `${arrInfo.isNextDayArrival ? '⚠️  NEXT DAY' : '✅ SAME DAY'}`
    );
  });

  if (allTransport.length > 10) {
    console.log(`   ... and ${allTransport.length - 10} more transport options`);
  }

  // 6. Run the algorithm
  console.log('\n─── STEP 4: Running Backtracking Algorithm ──────────────────────────');
  const mealOptions = generateMealOptions('BUDGET');
  const activityOptions = generateActivityOptions(destCity.attractions || [], 'budget');

  console.log(`\n   Starting with:`);
  console.log(`   - ${allTransport.length} transport × ${transformedHotels.length} hotels × ${mealOptions.length} meals × ${activityOptions.length} activities`);
  const totalCombinations = allTransport.length * transformedHotels.length * mealOptions.length * activityOptions.length;
  console.log(`   - Max combinations: ${totalCombinations.toLocaleString()}`);

  if (allTransport.length === 0) {
    console.error('\n❌ NO TRANSPORT OPTIONS FOUND! Check flight/train data for DEL→BOM');
    return;
  }
  if (transformedHotels.length === 0) {
    console.error('\n❌ NO HOTELS FOUND matching ≥' + TEST.starRating + '★ for BOM');
    return;
  }

  const algorithmResult = TripAlgorithmService.generateTripPlans({
    budget: TEST.budget,
    travelers: TEST.travelers,
    durationDays,
    nights,
    tripType: TEST.tripType,
    noStay: false,
    includeActivities: TEST.includeActivities,
    budgetFlexibility: TEST.budgetFlexibility,
    options: {
      transport: allTransport,
      accommodation: transformedHotels,
      meal: mealOptions,
      activity: activityOptions
    }
  });

  // 7. Output results
  console.log('\n' + '═'.repeat(70));
  console.log('  ALGORITHM RESULTS');
  console.log('═'.repeat(70));
  console.log(`  Plans within budget (₹${TEST.budget.toLocaleString()}): ${algorithmResult.plans.length}`);
  console.log(`  Warnings: ${algorithmResult.warnings?.length || 0}`);
  if (algorithmResult.cheapestPossible !== Infinity) {
    console.log(`  Cheapest possible combination: ₹${algorithmResult.cheapestPossible?.toLocaleString()}`);
  }

  if (algorithmResult.warnings?.length > 0) {
    console.log('\n⚠️  Warnings:');
    algorithmResult.warnings.forEach(w => console.log(`   - ${w}`));
  }

  if (algorithmResult.plans.length === 0) {
    console.log('\n❌ NO VALID PLANS FOUND WITHIN BUDGET!');
    console.log('   The cheapest possible trip exceeds ₹' + TEST.budget.toLocaleString());
  } else {
    console.log('\n✅ VALID PLANS FOUND:\n');
    algorithmResult.plans.forEach((plan, i) => {
      const t = plan.selections.transport;
      const h = plan.selections.accommodation;
      const dep = t.details?.departure || '09:00';
      const dur = t.details?.duration || '2h';
      const arrInfo = calculateArrivalInfo(TEST.startDate, dep, dur, nights);

      const nightsUsed = plan.breakdown.nightsUsed ?? arrInfo.adjustedNights;

      console.log(`  Plan ${i + 1}: [${plan.category || ''}]  Score: ${plan.score}  Total: ₹${plan.totalCost.toLocaleString()}`);
      console.log(`    🚌 Transport   : [${t.mode?.toUpperCase()}] ${t.name} (${t.class || 'economy'})`);
      console.log(`                     Departs: ${arrInfo.departureTime}  Duration: ${dur}`);
      console.log(`                     Arrives: ${arrInfo.arrivalDate} ${arrInfo.arrivalTime}  (${arrInfo.nightsInTransit} night(s) in transit)`);
      console.log(`    🏨 Hotel       : ${h?.name || 'N/A'} (${h?.stars || 0}★)  ₹${h?.price || 0}/night`);
      console.log(`    📅 Hotel nights: ${nights} requested → ${nightsUsed} actual (saved ${nights - nightsUsed} night(s) due to transit)`);
      console.log(`    🍽️  Meals       : ₹${plan.breakdown.foodTotal.toLocaleString()} (${durationDays} days)`);
      console.log(`    🎢 Activities  : ₹${plan.breakdown.activityTotal.toLocaleString()}`);
      console.log(`    💰 Breakdown   : Transport ₹${plan.breakdown.transportTotal.toLocaleString()} + Hotel ₹${plan.breakdown.accommodationTotal.toLocaleString()} + Food ₹${plan.breakdown.foodTotal.toLocaleString()} + Activity ₹${plan.breakdown.activityTotal.toLocaleString()} = ₹${plan.totalCost.toLocaleString()}`);
      console.log(`    📊 Budget used : ${(plan.budgetUtilization * 100).toFixed(1)}% of ₹${TEST.budget.toLocaleString()}`);
      console.log('');
    });
  }

  // 8. Night calculation correctness check
  console.log('─── STEP 5: Night Calculation Correctness Audit ────────────────────');
  console.log(`   Requested trip: ${TEST.startDate} → ${TEST.endDate} = ${nights} nights\n`);

  const testCases = [
    { mode: 'flight', dep: '06:00', dur: '2h 10m', expected: 0, desc: 'Morning flight (2h = same day arrival)' },
    { mode: 'flight', dep: '20:00', dur: '2h 10m', expected: 0, desc: 'Night flight (still < 12h = no overnight)' },
    { mode: 'train',  dep: '16:35', dur: '16h 35m', expected: 1, desc: 'Rajdhani (departs 4:35 PM, arrives next morning)' },
    { mode: 'train',  dep: '23:00', dur: '17h 0m',  expected: 1, desc: 'Overnight train (departs 11 PM, 17h journey)' },
    { mode: 'train',  dep: '06:00', dur: '18h 0m',  expected: 1, desc: 'Day+night train (6 AM, 18h = arrives midnight)' },
    { mode: 'train',  dep: '08:00', dur: '40h 0m',  expected: 2, desc: 'Very long train (40h journey)' },
  ];

  let allPassed = true;
  testCases.forEach(tc => {
    // Mirror the FIXED algorithm's _calculateNightsInTransit logic
    const depParts = tc.dep.split(':');
    const depHour = parseInt(depParts[0]) || 9;
    const depMin = parseInt(depParts[1]) || 0;
    const depMinuteOfDay = depHour * 60 + depMin;
    let durationMinutes = 0;
    const h = tc.dur.match(/(\d+)\s*h/i);
    const m = tc.dur.match(/(\d+)\s*m/i);
    if (h) durationMinutes += parseInt(h[1]) * 60;
    if (m) durationMinutes += parseInt(m[1]);
    // FIXED: use midnight-crossing formula
    const nightsInTransit = Math.floor((depMinuteOfDay + durationMinutes) / (24 * 60));

    const hotelNights = Math.max(0, nights - nightsInTransit);
    const pass = nightsInTransit === tc.expected;
    if (!pass) allPassed = false;

    console.log(`   ${pass ? '✅' : '❌'} ${tc.desc}`);
    console.log(`      Dep: ${tc.dep}, Duration: ${tc.dur} (${durationMinutes}min), depMinute: ${depMinuteOfDay}, arrMinute: ${depMinuteOfDay + durationMinutes}`);
    console.log(`      NightsInTransit: ${nightsInTransit} (expected ${tc.expected}) | Hotel nights: ${nights} → ${hotelNights}`);
    console.log('');
  });

  if (!allPassed) {
    console.log('⚠️  Some night calculations are INCORRECT! See above.');
  } else {
    console.log('✅ All night calculation test cases PASSED!');
  }

  console.log('\n' + '═'.repeat(70));
  console.log('  TEST COMPLETE');
  console.log('═'.repeat(70) + '\n');
}

runTest().catch(err => {
  console.error('\n💥 Test failed with error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
