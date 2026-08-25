# TripSmart — Agent Context & Progress Tracker

> **Keep this file updated** after every major change. Check off items as they complete.

---

## 📝 Recent Changes

| Date | Change |
|------|--------|
| 2026-08-22 | **Multi-day transit itinerary:** `generateItinerary()` + `buildItineraryDays()` now use `totalDays = overnightCount + usableDays`. One "In Transit" tab per overnight leg (no collapse). `plan.duration` = `"${overnightCount + usableDays} days"`. |
| 2026-08-22 | **Overnight day count fix:** Backend breakdown stores `overnightCount`, `usableDays`, `nightsAtDestination`. Frontend validates per-plan itinerary length. |
| 2026-08-22 | **Light mode fix:** `.plan-trip-panel` CSS overrides for PlanTripPage white text. |
| 2026-08-22 | **Trip.js schema:** Added `transportDetails`, `meals`, `breakdown` sub-schemas + Razorpay booking fields. |

---

## 📦 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS + ShadCN/Radix |
| Backend | Node.js + Express |
| Database | **MongoDB** (via Mongoose) — ✅ **Correct choice** |
| Auth | JWT (stored in DB via User model) |
| Maps | Leaflet.js (react-leaflet) |
| Transport | Train: local JSON (EXP-TRAINS.json + MongoDB Train model), Flights: local JSON (flights data), Hotels: hotel_details.csv |

---

## 🏗️ Architecture Overview

```
Frontend (Vite/React - port 5173)
  └── src/app/pages/         (LandingPage, PlanTripPage, ResultsPage, TripDetailsPage, BookingConfirmationPage, etc.)
  └── src/services/api.ts    (API client — TripPlanData type, formatINR, tripsAPI)
  └── src/contexts/          (AuthContext)
  └── src/data/              (cityCoordinates.ts)
  └── src/styles/            (theme.css, index.css)

Backend (Express - port 5000)
  └── src/routes/            (trips.js [76KB!], auth.js, flights.js, hotels.js, trains.js)
  └── src/services/          (trip-algorithm.service.js, smart-selection.service.js, budget.service.js, scoring.service.js, train.service.js)
  └── src/models/            (Trip.js, User.js, Train.js)
  └── src/config/            (trip.config.js, db.js)
  └── src/data/              (flights.js, hotels.js, trains.js, localTransport.js, cities.js)
  └── src/utils/             (option-transformer.js)
  └── EXP-TRAINS.json        (Train dataset — raw Indian Railways data)
  └── hotel_details.csv      (Hotel dataset)
```

---

## 🔑 Core Algorithm: Backtracking DFS

Located in [`trip-algorithm.service.js`](file:///d:/TripSmart/backend/src/services/trip-algorithm.service.js)

**Clock metaphor:**
- Transport → Hour hand (highest priority, preserved longest)
- Accommodation → 30-min hand
- Meal → Minute hand
- Activity → Second hand (lowest priority, downgraded first)

**Phase 1:** Finds ALL feasible combos within budget.  
**Phase 2:** Selects Budget / Best Value / Premium per transport mode.

`BACKTRACK_ORDER = ['activity', 'meal', 'accommodation', 'transport']`

**Key calculation: `_calculateNightsInTransit(transport)`**
- Uses departure time + duration to count midnight crossings
- Already tracks `nightsUsed` in breakdown per plan ✅

**Itinerary day model (updated):**
```
totalDays = overnightCount + usableDays   ← must match plan.duration

Days 1..overnightCount     → one "In Transit" tab per overnight leg (transport activity each)
Days (overnightCount+1)..N → usableDays at destination:
  • First usable day: arrive + check-in
  • Middle usable days: explore
  • Last usable day: check-out (+ return transport if round trip)

Example: 2-night train + 3 usable days = 5 tabs
  Day 1: In Transit | Day 2: In Transit | Day 3: Arrive + Check-in | Day 4: Explore | Day 5: Check-out
```
- Implemented in `generateItinerary()` (`trips.js`) and `buildItineraryDays()` (`TripDetailsPage.tsx`)
- Frontend no longer collapses transit into a single "Transit Day"
- Validation: `plan.itinerary.length === overnightCount + usableDays`

---

## 🗃️ Database (MongoDB)

- ✅ **MongoDB is the right choice** for TripSmart.
  - Flexible schema for heterogeneous trip plans (flight vs train vs bus)
  - Easy to embed arrays (itinerary days, activity lists, stops)
  - Good for user-generated data with varying fields
  - Scales well for read-heavy trip querying

**Models:**
- `Trip.js` — Core trip + itinerary + booking
- `User.js` — Auth + preferences
- `Train.js` — Indian Railways data (Mongoose model over MongoDB)

**⚠️ SCHEMA GAPS (needs updating):**
- ~~`Trip.plans[].transport` is `Mixed` — needs structured sub-schema~~ ✅ Added `transportDetails` sub-schema + kept Mixed for compat
- ~~No `meals` field in plans~~ ✅ Added `meals` sub-schema
- ~~No `overnightCount` / `usableDays` stored in breakdown~~ ✅ Added to `breakdown` sub-schema + trip-level fields

---

## 🚌 Transport Data Sources

### Trains (current)
- **Data:** `EXP-TRAINS.json` (17MB raw IRCTC-style data) + MongoDB `Train` model
- **Cost:** Calculated from fare tables in data (per class: SL, 3A, 2A, 1A)
- **Future API:** [RapidAPI — Indian Railways API](https://rapidapi.com/search/indian+railway) or [erail.in](https://erail.in/) for live data
- **For fare:** [ixigo Train](https://www.ixigo.com/trains) or official IRCTC fare API (restricted)

### Flights (current)
- **Data:** Local JSON in `src/data/flights.js`
- **Future API:** [Amadeus Flight Offers Search API](https://developers.amadeus.com/self-service/category/flights/api-doc/flight-offers-search) — free tier available. Keys already in `.env.example`.
  - Or: [Skyscanner via RapidAPI](https://rapidapi.com/skyscanner/api/skyscanner-flight-search)
  - Or: [Duffel API](https://duffel.com/docs/api) — cleaner REST API

### Buses (NOT YET IMPLEMENTED)
- **Future API:** [redBus API](https://www.redbus.in/info/apidevelopers) (limited access) or [AbhiBus](https://www.abhibus.com/)
- **Alternative:** Scrape from [Paytm Flights/Bus](https://paytm.com/bus-tickets) (RapidAPI wrappers exist)
- **Data needed:** Source, destination, class (sleeper/semi-sleeper/AC), fare, departure/arrival time, operator name, bus number

---

## 🏨 Accommodation

- **Current:** `hotel_details.csv` → parsed and served via `searchHotels()`
- **Future API:** [MakeMyTrip Hotels](https://developer.makemytrip.com/) or [Booking.com via RapidAPI](https://rapidapi.com/tipsters/api/booking-com)
- **Design decision:** Hotels only for now (no hostels/Airbnb/homestays in UI) — Yes/No binary on hotel booking
- **Booking flow:** Direct YES → BookingConfirmationPage

---

## 🍽️ Meals (Schema exists, not in DFS yet)

- In `types.ts`, `Category` already includes `'meal'`
- In `UserPreferences.options.meal[]` — exists
- In `TripPlan.selections.meal` — exists
- In `breakdown.foodTotal` — calculated
- **NOT IN DFS ITINERARY yet** — meal costs are calculated but not shown as day-by-day items with restaurant names
- **Pending:** Add meal to schema in Trip.js breakdown + expose in per-day itinerary

---

## 🎯 Activities

- In `UserPreferences.options.activity[]` — exists
- City attractions used to populate activity options (`destCity.attractions`)
- Currently shown in itinerary as generic "Explore local attractions"
- **Pending:** Richer activity objects with price, rating, duration

---

## 💳 Payment (Current State)

- `BookingConfirmationPage.tsx` — real form UI, no actual payment gateway
- Has: traveler info form, credit card / UPI / net banking selection, terms checkbox
- On submit → fake 2s delay → success screen
- **Pending:** Integrate Razorpay (keys already in `.env.example`)
  - Create Razorpay order on backend → return order_id → frontend opens Razorpay checkout SDK

---

## 🐛 Known Bugs

### BUG 1: Overnight train/flight day count mismatch ✅
**Root cause:** Itinerary tab count used `nightsUsed + 1` instead of `overnightCount + usableDays`.  
Frontend also collapsed multi-night transit into one "Transit Day".  
**Fix (completed):**
- Backend `generateItinerary()`: `totalDays = overnightCount + usableDays`; one "In Transit" tab per overnight leg
- `planTransportDetails` / `transportTimingDetails` pass both `overnightCount` and `usableDays`
- `TripDetailsPage.buildItineraryDays()`: validates against `overnightCount + usableDays`; removed transit collapse
- `api.ts`: `plan.duration = "${overnightCount + usableDays} days"`
- **Status:** [x] FIXED

### BUG 2: White text in light mode ❌
**Root cause:** PlanTripPage hardcodes `text-white` / `text-slate-*` on the glass panel while ThemeProvider locks light mode.  
**Fix:** Added `.plan-trip-panel` light-mode CSS overrides in `theme.css` + class on PlanTripPage panel.  
- **Status:** [x] FIXED

---

## 📐 Schema Updates

✅ **Completed** — see `Trip.js` for full sub-schemas. Reference shape:

```javascript
// Trip.js — plans[]:
breakdown: {
  nightsUsed, overnightCount, usableDays, nightsAtDestination,
  transportTotal, accommodationTotal, foodTotal, activityTotal
}
transportDetails: { mode, operator, number, class, overnightCount, departure, arrival, duration, cost, bookingUrl }
meals: { tier, dailyCostPerPerson, totalCost, breakdown: [{ day, breakfast, lunch, dinner }] }
```

---

## 🤖 ML / AI (Discussion only — NO CODE yet)

### A. Price Forecasting Model
- **What:** Predict best time to book transport/hotels using historical pricing patterns
- **How it helps TripSmart:** Show users "Price is X% below average — book now" or "Wait 3 days for better price"
- **Data needed:** Historical fare data over time for routes (IRCTC price history, Amadeus Historical Search)
- **Models:** LSTM / Prophet (time series) or XGBoost on tabular features (route, season, days-before-departure)
- **Integration point:** Show price trend badge on ResultsPage plans (↑ Rising / ↓ Falling / ✓ Good time to book)

### B. RAG-Based Trip Advisor
- **What:** Retrieval-Augmented Generation — embed trip descriptions, reviews, and destination guides into vector DB
- **How it helps:** When user searches "3 days in Goa with beach + nightlife", retrieve similar successful trips and generate contextual recommendations
- **Our algorithm:** The DFS backtracker is **NOT** a RAG system — it's constraint satisfaction. They complement each other:
  - DFS → finds feasible plans within budget
  - RAG → personalizes activities/hotels based on user preferences + similar travelers
- **Vector DB options:** Pinecone, ChromaDB, Weaviate

### C. RL Budget Allocation
- **What:** After payment, recommend how to spend remaining budget (₹X left → suggest: ₹Y on local transport, ₹Z on restaurant upgrade, etc.)
- **How it helps:** Upsell post-booking, increase satisfaction
- **Model:** Multi-armed bandit or Q-learning — rewards based on user feedback/ratings
- **Integration:** Post-payment confirmation screen → "You have ₹2,340 remaining — here's how to spend it smartly"

---

## 📋 TODO Checklist

### Immediate Bugs
- [x] Fix overnight train/flight day count mismatch (overnightCount + usableDays tabs)
- [x] Multi-day transit: one "In Transit" tab per overnight (no collapse)
- [x] Fix white text in light mode (investigate glass-input scope)

### Schema & Data
- [x] Add `overnightCount`, `usableDays`, `nightsAtDestination` to Trip breakdown schema
- [x] Add structured `transport` sub-schema (instead of `Mixed`)
- [x] Add structured `meals` sub-schema to Trip plans
- [ ] Bus data source integration (TBD)

### Features
- [ ] Payment: Integrate Razorpay (keys ready in .env.example)
- [ ] Hotel Yes/No booking flow (binary decision in TripDetailsPage → BookingConfirmationPage)
- [ ] "Book Transport" deeplink (IRCTC for trains, Amadeus redirect for flights)
- [ ] Meals: Day-by-day meal itinerary items with restaurant types
- [ ] Activities: Richer objects (price, rating, duration, booking link)

### Future / ML
- [ ] Price forecasting model (discussion only)
- [ ] RAG trip advisor (discussion only)
- [ ] RL budget allocation post-payment (discussion only)
- [ ] Bus API integration (redBus or AbhiBus)

---

## 📁 Key File Locations

| File | Purpose |
|---|---|
| [`trip-algorithm.service.js`](file:///d:/TripSmart/backend/src/services/trip-algorithm.service.js) | Core DFS backtracking algorithm |
| [`trips.js`](file:///d:/TripSmart/backend/src/routes/trips.js) | Main API route + `generateItinerary()` — day model: `overnightCount + usableDays` |
| [`Trip.js`](file:///d:/TripSmart/backend/src/models/Trip.js) | MongoDB schema for trips |
| [`ResultsPage.tsx`](file:///d:/TripSmart/src/app/pages/ResultsPage.tsx) | Trip plan cards + comparison |
| [`TripDetailsPage.tsx`](file:///d:/TripSmart/src/app/pages/TripDetailsPage.tsx) | Day-by-day itinerary tabs; validates `overnightCount + usableDays` |
| [`BookingConfirmationPage.tsx`](file:///d:/TripSmart/src/app/pages/BookingConfirmationPage.tsx) | Payment + confirmation (mock) |
| [`theme.css`](file:///d:/TripSmart/src/styles/theme.css) | CSS variables + light/dark mode |
| [`types.ts`](file:///d:/TripSmart/types.ts) | Frontend TypeScript types |
| [`trip.config.js`](file:///d:/TripSmart/backend/src/config/trip.config.js) | Cost constants and budget splits |
