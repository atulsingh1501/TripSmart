# AI Trip Planning App - Backend

A Node.js/Express backend API for the AI Trip Planning App, focused on Indian travel.

## 🚀 Features

- **Cities API**: Comprehensive Indian cities database with 40+ cities
- **Flights API**: Realistic flight search with Indian airlines (IndiGo, Air India, Vistara, SpiceJet, etc.)
- **Trains API**: Indian Railways data with Rajdhani, Shatabdi, Vande Bharat, and more
- **Hotels API**: Hotel search with major chains (Taj, Oberoi, OYO, etc.)
- **Buses API**: Bus routes with government (RSRTC, KSRTC) and private operators
- **Trips API**: Complete trip planning with itinerary generation
- **Auth API**: User authentication with JWT tokens

## 📁 Project Structure

```
backend/
├── src/
│   ├── data/
│   │   ├── cities.js      # 40+ Indian cities with attractions, transport info
│   │   ├── flights.js     # Flight routes, airlines, pricing logic
│   │   ├── trains.js      # Train types, routes, fare calculation
│   │   ├── hotels.js      # Hotel chains, room types, pricing
│   │   └── buses.js       # Bus operators, routes, fare calculation
│   ├── routes/
│   │   ├── cities.js      # City search and details endpoints
│   │   ├── flights.js     # Flight search endpoints
│   │   ├── trains.js      # Train search endpoints
│   │   ├── hotels.js      # Hotel search endpoints
│   │   ├── trips.js       # Trip planning and booking
│   │   └── auth.js        # Authentication endpoints
│   └── server.js          # Express app configuration
├── .env.example           # Environment variables template
├── package.json
└── README.md
```

## 🛠️ Installation

1. **Navigate to backend folder**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Start production server**:
   ```bash
   npm start
   ```

## 🔌 API Endpoints

### Cities
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cities` | Get all cities with filters |
| GET | `/api/cities/search?q=` | Search cities by name |
| GET | `/api/cities/popular` | Get popular destinations |
| GET | `/api/cities/airports` | Get cities with airports |
| GET | `/api/cities/:code` | Get city by code |
| GET | `/api/cities/:code/attractions` | Get city attractions |

### Flights
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/flights/search` | Search flights |
| POST | `/api/flights/search` | Search flights (complex) |
| GET | `/api/flights/airlines` | Get all airlines |
| GET | `/api/flights/routes` | Get all routes |
| GET | `/api/flights/popular` | Get popular routes |

### Trains
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trains/search` | Search trains |
| POST | `/api/trains/search` | Search trains (complex) |
| GET | `/api/trains/types` | Get train types |
| GET | `/api/trains/classes` | Get coach classes |
| GET | `/api/trains/:number` | Get train details |
| GET | `/api/trains/:number/schedule` | Get train schedule |
| GET | `/api/trains/:number/availability` | Check availability |

### Hotels
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hotels/search` | Search hotels |
| POST | `/api/hotels/search` | Search hotels (complex) |
| GET | `/api/hotels/chains` | Get hotel chains |
| GET | `/api/hotels/popular` | Get popular hotels |
| GET | `/api/hotels/deals` | Get current deals |

### Trips
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/trips/plan` | Generate trip plan |
| GET | `/api/trips/:id` | Get trip details |
| POST | `/api/trips/:id/book` | Book a trip |
| GET | `/api/trips/suggestions/popular` | Get popular trips |

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/me` | Update profile |
| PUT | `/api/auth/password` | Change password |

## 📊 Data Overview

### Cities Covered
- **Metro**: Delhi, Mumbai, Bangalore, Chennai, Kolkata, Hyderabad
- **Tourist**: Goa, Jaipur, Agra, Udaipur, Varanasi, Kochi, Munnar, Srinagar, Leh, Shimla, Amritsar, Darjeeling, Port Blair, Rishikesh
- Includes: Coordinates, weather, budget info, transport details, attractions

### Airlines
- Air India, IndiGo, SpiceJet, Vistara, Go First, Akasa Air, Air India Express

### Train Types
- Rajdhani Express, Shatabdi Express, Vande Bharat, Duronto, Superfast, Express

### Hotel Chains
- **Luxury**: Taj, Oberoi, ITC, Leela, JW Marriott
- **Premium**: Radisson, Holiday Inn, Vivanta, Novotel
- **Mid-Range**: Fortune, Lemon Tree, Ibis, Ginger
- **Budget**: OYO, Treebo, FabHotels, Zostel

## 💰 Pricing Logic

The API implements realistic pricing based on:
- **Flights**: Day of week, advance booking, season, airline type, time slot
- **Trains**: Class, train type, Tatkal surcharge, distance
- **Hotels**: Star rating, season, advance booking, room type
- **Buses**: Operator type, bus type, distance

## 🔮 Future Enhancements

1. **Real API Integration**:
   - Amadeus API for flights
   - IRCTC API for trains (requires govt approval)
   - Booking.com/OYO APIs for hotels
   - RedBus API for buses
   - Razorpay/PayU for payments

2. **Database Integration**:
   - MongoDB for user data, bookings
   - Redis for caching

3. **Additional Features**:
   - Real-time availability
   - Push notifications
   - Multi-currency support
   - AI-powered recommendations

## 📝 Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/trip-planner
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Future API Keys
AMADEUS_API_KEY=
AMADEUS_API_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

## 🧪 Testing

```bash
# Health check
curl http://localhost:5000/api/health

# Search flights
curl "http://localhost:5000/api/flights/search?from=DEL&to=BOM&date=2025-02-15"

# Search hotels
curl "http://localhost:5000/api/hotels/search?city=GOI&checkIn=2025-02-15&checkOut=2025-02-18"

# Generate trip plan
curl -X POST http://localhost:5000/api/trips/plan \
  -H "Content-Type: application/json" \
  -d '{"source":"DEL","destination":"GOI","startDate":"2025-02-15","endDate":"2025-02-20","travelers":2}'
```

## 📄 License

MIT License
