# TripSmart - AI Trip Planning App

An intelligent trip planning application that helps users plan personalized travel experiences with smart budget allocation, real-time transport options, and destination-specific recommendations.

## ✨ Features

- **Smart Budget Allocation** - Automatically distributes budget across transport, accommodation, activities, and meals
- **Multi-Modal Transport** - Supports flights, trains, buses, and car rentals with real pricing
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

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Real train data integration (EXP-TRAINS.json)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Sathvik5647/TripSmart.git
cd TripSmart
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

## 🧪 Development

```bash
# Run frontend
npm run dev

# Run backend
cd backend && npm run dev

# Build for production
npm run build

# Type check
npm run type-check
```

## 📝 License

MIT License - See LICENSE file for details.

## 👨‍💻 Author

Created by Sathvik
