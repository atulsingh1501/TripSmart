# TripSmart - Smart Trip Planning App

TripSmart helps users generate personalized trip plans with smart budget allocation, multi-modal transport choices, and destination-specific recommendations.

## ✨ Features

- **Smart Budget Allocation** - Automatically distributes budget across transport, accommodation, activities, and meals
- **Multi-Modal Transport** - Supports flights, trains, buses, and local transport planning
- **Dynamic Trip Plans** - Generates Budget, Comfort, and Premium tier options
- **Places Selection** - Choose which attractions to visit with actual entry fees displayed
- **User Authentication** - JWT-based auth with secure session management
- **Trip Persistence** - Save and retrieve trip plans from MongoDB

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + Radix UI
- React Router
- Leaflet + React-Leaflet (map rendering and route visualization)

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Hybrid data layer (MongoDB + curated static datasets)

## 🗺️ Maps and Location Rendering

- The app uses Leaflet on the frontend to render the interactive map background and route overlays.
- We use coordinate lookup data (city names and IATA airport codes) to place:
	- Origin marker
	- Destination marker
	- Stop markers
	- Flight/train route paths and distance lines
- Core map files:
	- `src/app/components/MapBackground.tsx`
	- `src/data/cityCoordinates.ts`

## 🧩 What Radix UI Is and How TripSmart Uses It

Radix UI is an unstyled, accessible component primitive library for React. In TripSmart, Radix provides reliable behavior and accessibility for interactive UI controls, while Tailwind handles the visual design.

In this project, Radix-based components are used for:
- Dialogs and modals (confirmations and detail overlays)
- Dropdown menus and selects (sorting/filter inputs)
- Tabs, accordions, popovers, tooltips, drawers
- Form-oriented controls like checkbox, radio group, switches, and labels
- Navigation primitives and command-style interactions

Where these are implemented:
- Component wrappers: `src/app/components/ui/`
- Consumed across pages such as plan, results, profile, settings, and booking flows

## 🏗️ Architecture (3-Tier)

| Tier | Description |
|---|---|
| Tier 1 - Presentation Layer | React-based UI with Radix components and Tailwind styling |
| Tier 2 - Application Layer | Express.js backend handling business logic and API requests |
| Tier 3 - Data Layer | MongoDB for persistence plus static/demo data providers for transport and city datasets |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Sathvik5647/TripSmart.git
cd TripSmart-main
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Install backend dependencies**
```bash
cd backend
npm install
```

4. **Configure environment variables**

Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tripsmart
JWT_SECRET=your-secure-jwt-secret
JWT_REFRESH_SECRET=your-secure-refresh-secret
NODE_ENV=development
```

Optional root `.env` values can be added for frontend runtime config if needed.

5. **Start the development servers**

Frontend:
```bash
npm run dev
```

Backend (in separate terminal):
```bash
cd backend
npm run dev
```

6. **Open the app**
Navigate to `http://localhost:5173`

## 📁 Project Structure

```
TripSmart/
├── src/                    # Frontend source
│   ├── app/
│   │   ├── components/     # UI components
│   │   └── pages/          # Page components
│   ├── contexts/           # React contexts (Auth)
│   └── services/           # API services
├── backend/
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── data/           # Mock data (cities, flights, trains)
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   └── services/       # Business logic services
│   └── EXP-TRAINS.json     # Real Indian Railways data
└── README.md
```

## 🔑 API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Trips
- `POST /api/trips/plan` - Generate trip plans (requires auth)
- `GET /api/trips/:id` - Get trip details
- `GET /api/trips/user` - Get user's saved trips

### Data
- `GET /api/cities/search?q=` - Search cities
- `GET /api/cities/popular` - Get popular cities
- `GET /api/flights/search` - Search flights
- `GET /api/trains/search` - Search trains
- `GET /api/hotels/search` - Search hotels

## 📦 Data Source Notes

- Flights, buses, hotels, cities, and local attractions are currently served from curated in-repo datasets and generation logic.
- Train search uses the backend train service and available train datasets.
- User, trip, and auth data are persisted in MongoDB.
- Live third-party APIs (for flight/bus/hotel inventory) are not yet integrated.

## 🧪 Development

```bash
# Run frontend
npm run dev

# Run backend
cd backend && npm run dev

# Build for production
npm run build
```

## 📝 License

MIT License - See LICENSE file for details.

## 👨‍💻 Author

Created by Sathvik
