import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import PlanTripPage from './pages/PlanTripPage';
import ResultsPage from './pages/ResultsPage';
import TripDetailsPage from './pages/TripDetailsPage';
// import BookingConfirmationPage from './pages/BookingConfirmationPage'; // Payment page removed
import ProfilePage from './pages/ProfilePage';
import MyTripsPage from './pages/MyTripsPage';
import SettingsPage from './pages/SettingsPage';
import AboutPage from './pages/AboutPage';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from './components/ThemeProvider';

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Redirect authenticated users away from auth pages
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/plan-trip" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthRoute><AuthPage /></AuthRoute>} />
      <Route path="/signup" element={<AuthRoute><AuthPage /></AuthRoute>} />
      <Route path="/auth" element={<AuthRoute><AuthPage /></AuthRoute>} />
      <Route path="/plan-trip" element={<PlanTripPage />} />
      <Route path="/results" element={<ResultsPage />} />
      <Route path="/trip-details/:id" element={<TripDetailsPage />} />
      {/* Payment page route removed - trips are now saved directly */}
      {/* <Route path="/booking-confirmation" element={<BookingConfirmationPage />} /> */}
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/my-trips" element={<ProtectedRoute><MyTripsPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/about" element={<AboutPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Toaster position="top-center" />
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
