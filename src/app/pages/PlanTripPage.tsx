import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../components/ui/utils';
import Navigation from '../components/Navigation';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Checkbox } from '../components/ui/checkbox';
import { Slider } from '../components/ui/slider';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Progress } from '../components/ui/progress';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Badge } from '../components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../components/ui/command';
import { citiesAPI, tripsAPI, flightsAPI, trainsAPI, formatINR, type CityData } from '../../services/api';
import { getCoordinatesByIATA, arcPath } from '../../data/cityCoordinates';
import {
  MapPin,
  Calendar as CalendarIcon,
  Users,
  DollarSign,
  Plane,
  Hotel,
  Bus,
  Target,
  Heart,
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronRight,
  ChevronLeft,
  Zap,
  Palmtree,
  Building,
  Home,
  Train,
  Car,
  Briefcase,
  Camera,
  Music,
  Utensils,
  Scale,
  Clock,
  Star,
  Bike,
  Plus,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import MapBackground from '../components/MapBackground';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
const TRIP_STORAGE_KEY = 'tripsmart_draft_trip';

// Default form data for resetting
const getDefaultFormData = () => {
  const today = new Date().toISOString().split('T')[0];
  return {
    origin: '',
    destination: '',
    departureDate: today,
    returnDate: today,
    isReturnTrip: true,  // true = round trip, false = one-way
    travelers: 1,
    tripType: 'direct',  // 'direct' or 'tour'
    includeActivities: true,  // For direct travel - include sightseeing activities?
    stayNights: 0,  // NEW: For one-way trips - number of nights (default 0 = no stay)
    wantsTour: true,  // NEW: For one-way direct travel - whether user wants to tour the destination
    budget: 25000,
    currency: 'INR',
    budgetFlexibility: 'moderate',
    accommodations: ['hotels'],
    noStay: false,
    starRating: 3,
    roomType: 'standard',
    transportation: [] as string[],  // Default to no selection
    flightClasses: [] as string[],   // Multiple selections allowed
    trainClasses: [] as string[],    // Multiple selections allowed
    busType: 'ac',
    busOperator: 'private',
    maxTransfers: 1,
    priority: 'balanced',
    travelStyle: 'moderate',
    interests: ['culture'],
    specialRequirements: '',
    dietaryRestrictions: [] as string[],
    accessibilityNeeds: [] as string[],
    multipleStops: false,
    stops: [] as string[],
  };
};

export default function PlanTripPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [departureDate, setDepartureDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();

  // Trip persistence states
  const [showContinueDialog, setShowContinueDialog] = useState(false);
  const [savedTripInfo, setSavedTripInfo] = useState<{ origin: string; destination: string; savedAt: string } | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error('Please sign in to plan a trip');
      navigate('/auth?redirect=/plan-trip');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Check if coming from Results page with formData
  const passedFormData = (location.state as any)?.formData;

  // Initialize formData with passed state or defaults
  const [formData, setFormData] = useState(() => {
    if (passedFormData) {
      return { ...getDefaultFormData(), ...passedFormData };
    }
    return getDefaultFormData();
  });

  // Store full CityData objects for airport code access
  const [originCityData, setOriginCityData] = useState<CityData | null>(null);
  const [destinationCityData, setDestinationCityData] = useState<CityData | null>(null);

  // Pre-fetched route visualization paths for the map
  const [prefetchedFlightPaths, setPrefetchedFlightPaths] = useState<[number, number][][]>([]);
  const [prefetchedTrainPaths, setPrefetchedTrainPaths] = useState<[number, number][][]>([]);

  // Stop search states for multiple stops
  const [stopSearch, setStopSearch] = useState('');
  const [showStopDropdown, setShowStopDropdown] = useState(false);
  const [stopCities, setStopCities] = useState<CityData[]>([]);

  // City search states
  const [originSearch, setOriginSearch] = useState('');
  const [destinationSearch, setDestinationSearch] = useState('');
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const [originCities, setOriginCities] = useState<CityData[]>([]);
  const [destinationCities, setDestinationCities] = useState<CityData[]>([]);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const [isSearchingDestination, setIsSearchingDestination] = useState(false);
  const [isSearchingStop, setIsSearchingStop] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Destination attractions state
  const [destinationAttractions, setDestinationAttractions] = useState<{ id: string; name: string; type: string; entryFee: number; duration: string }[]>([]);
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>([]);
  const [isLoadingAttractions, setIsLoadingAttractions] = useState(false);

  // Check for saved trip on mount - skip if coming from Results page
  useEffect(() => {
    // If we have passed formData from Results page, use that and set search values
    if (passedFormData) {
      setOriginSearch(passedFormData.origin || '');
      setDestinationSearch(passedFormData.destination || '');
      return; // Skip the saved trip dialog
    }

    const savedTrip = localStorage.getItem(TRIP_STORAGE_KEY);
    if (savedTrip) {
      try {
        const parsed = JSON.parse(savedTrip);
        if (parsed.formData?.origin || parsed.formData?.destination) {
          setSavedTripInfo({
            origin: parsed.formData.origin || 'Not set',
            destination: parsed.formData.destination || 'Not set',
            savedAt: parsed.savedAt || 'Recently',
          });
          setShowContinueDialog(true);
        }
      } catch (error) {
        console.error('Failed to parse saved trip:', error);
        localStorage.removeItem(TRIP_STORAGE_KEY);
      }
    }
  }, [passedFormData]);

  // Auto-save form data to localStorage
  useEffect(() => {
    // Only save if user has made some selections
    if (formData.origin || formData.destination || currentStep > 0) {
      const dataToSave = {
        formData,
        currentStep,
        originSearch,
        destinationSearch,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(dataToSave));
    }
  }, [formData, currentStep, originSearch, destinationSearch]);

  // Function to restore saved trip
  const restoreSavedTrip = () => {
    const savedTrip = localStorage.getItem(TRIP_STORAGE_KEY);
    if (savedTrip) {
      try {
        const parsed = JSON.parse(savedTrip);
        setFormData(parsed.formData);
        setCurrentStep(parsed.currentStep || 0);
        setOriginSearch(parsed.originSearch || '');
        setDestinationSearch(parsed.destinationSearch || '');
        toast.success('Trip restored successfully!');
      } catch (error) {
        console.error('Failed to restore trip:', error);
        toast.error('Failed to restore trip');
      }
    }
    setShowContinueDialog(false);
  };

  // Function to start a new trip
  const startNewTrip = () => {
    localStorage.removeItem(TRIP_STORAGE_KEY);
    setFormData(getDefaultFormData());
    setCurrentStep(0);
    setOriginSearch('');
    setDestinationSearch('');
    setSavedTripInfo(null);
    setShowContinueDialog(false);
    toast.success('Starting a new trip!');
  };
  useEffect(() => {
    const loadPopularCities = async () => {
      try {
        const popular = await citiesAPI.getPopular(10);
        setOriginCities(popular);
        setDestinationCities(popular);
      } catch (error) {
        console.error('Failed to load cities:', error);
      }
    };
    loadPopularCities();
  }, []);

  // Debounced search for origin cities
  useEffect(() => {
    const searchOrigin = async () => {
      if (!originSearch) {
        const popular = await citiesAPI.getPopular(10);
        setOriginCities(popular);
        return;
      }
      setIsSearchingOrigin(true);
      try {
        const results = await citiesAPI.search(originSearch, 10);
        setOriginCities(results);
      } catch (error) {
        console.error('Origin search error:', error);
      } finally {
        setIsSearchingOrigin(false);
      }
    };
    const timer = setTimeout(searchOrigin, 300);
    return () => clearTimeout(timer);
  }, [originSearch]);

  // Debounced search for destination cities
  useEffect(() => {
    const searchDestination = async () => {
      if (!destinationSearch) {
        const popular = await citiesAPI.getPopular(10);
        setDestinationCities(popular);
        return;
      }
      setIsSearchingDestination(true);
      try {
        const results = await citiesAPI.search(destinationSearch, 10);
        setDestinationCities(results);
      } catch (error) {
        console.error('Destination search error:', error);
      } finally {
        setIsSearchingDestination(false);
      }
    };
    const timer = setTimeout(searchDestination, 300);
    return () => clearTimeout(timer);
  }, [destinationSearch]);

  // Debounced search for stop cities
  useEffect(() => {
    const searchStop = async () => {
      if (!stopSearch) {
        const popular = await citiesAPI.getPopular(10);
        setStopCities(popular);
        return;
      }
      setIsSearchingStop(true);
      try {
        const results = await citiesAPI.search(stopSearch, 10);
        setStopCities(results);
      } catch (error) {
        console.error('Stop search error:', error);
      } finally {
        setIsSearchingStop(false);
      }
    };
    const timer = setTimeout(searchStop, 300);
    return () => clearTimeout(timer);
  }, [stopSearch]);

  const selectOriginCity = (city: CityData) => {
    setFormData({ ...formData, origin: city.name });
    setOriginSearch(city.name);
    setShowOriginDropdown(false);
    setOriginCityData(city);
  };

  const selectDestinationCity = (city: CityData) => {
    setFormData({ ...formData, destination: city.name });
    setDestinationSearch(city.name);
    setShowDestinationDropdown(false);
    setDestinationCityData(city);
  };

  const selectStopCity = (city: CityData) => {
    if (!formData.stops.includes(city.name)) {
      setFormData({ ...formData, stops: [...formData.stops, city.name] });
    }
    setStopSearch('');
    setShowStopDropdown(false);
  };

  const removeStop = (stopName: string) => {
    setFormData({ ...formData, stops: formData.stops.filter(s => s !== stopName) });
  };

  // ── Pre-fetch flight + train route visualizations when cities are set ─────
  useEffect(() => {
    if (!formData.origin || !formData.destination) {
      setPrefetchedFlightPaths([]);
      setPrefetchedTrainPaths([]);
      return;
    }
    const originCode = originCityData?.transport?.airportCode;
    const destCode   = destinationCityData?.transport?.airportCode;
    if (!originCode || !destCode) return;

    const today = new Date().toISOString().split('T')[0];

    Promise.allSettled([
      flightsAPI.search({ from: originCode, to: destCode, date: today }),
      trainsAPI.search({ from: originCode, to: destCode, date: today }),
    ]).then(([flightRes, trainRes]) => {
      // ── Flight arcs ──────────────────────────────────────────
      if (flightRes.status === 'fulfilled') {
        const seen = new Set<string>();
        const paths: [number, number][][] = [];
        for (const flight of (flightRes.value.outbound ?? [])) {
          const fromC = getCoordinatesByIATA(flight.from);
          const toC   = getCoordinatesByIATA(flight.to);
          if (!fromC || !toC) continue;
          const stopover = (flight as any).stopover as string | undefined;
          if (stopover) {
            const viaC = getCoordinatesByIATA(stopover);
            if (viaC) {
              const k1 = `${flight.from}-${stopover}`, k2 = `${stopover}-${flight.to}`;
              if (!seen.has(k1)) { seen.add(k1); paths.push(arcPath(fromC, viaC)); }
              if (!seen.has(k2)) { seen.add(k2); paths.push(arcPath(viaC, toC)); }
            }
          } else {
            const k = `${flight.from}-${flight.to}`;
            if (!seen.has(k)) { seen.add(k); paths.push(arcPath(fromC, toC)); }
          }
          if (paths.length >= 10) break;
        }
        setPrefetchedFlightPaths(paths);
      }
      // ── Train paths ──────────────────────────────────────────
      if (trainRes.status === 'fulfilled') {
        const seen = new Set<string>();
        const paths: [number, number][][] = [];
        for (const train of (trainRes.value.trains ?? [])) {
          const fromC = getCoordinatesByIATA(train.from.city);
          const toC   = getCoordinatesByIATA(train.to.city);
          if (!fromC || !toC) continue;
          const k = `${train.from.city}-${train.to.city}`;
          if (!seen.has(k)) { seen.add(k); paths.push([fromC, toC]); }
          if (paths.length >= 4) break;
        }
        setPrefetchedTrainPaths(paths);
      }
    });
  }, [formData.origin, formData.destination, originCityData, destinationCityData]);

  // Fetch attractions when destination changes
  useEffect(() => {
    const fetchAttractions = async () => {
      if (!formData.destination) {
        setDestinationAttractions([]);
        return;
      }

      setIsLoadingAttractions(true);
      try {
        // Fetch city details to get attractions
        const cities = await citiesAPI.search(formData.destination);
        const city = cities.find(c => c.name === formData.destination);

        if (city && city.attractions) {
          const attractions = city.attractions.map((a: any, idx: number) => ({
            id: `${a.name.toLowerCase().replace(/\s+/g, '-')}-${idx}`,
            name: a.name,
            type: a.type || 'Attraction',
            entryFee: a.entryFee || 0,
            duration: a.duration || '2 hours'
          }));
          setDestinationAttractions(attractions);
          // Select all by default
          setSelectedPlaces(attractions.map((a: any) => a.id));
        }
      } catch (error) {
        console.error('Failed to fetch attractions:', error);
      } finally {
        setIsLoadingAttractions(false);
      }
    };

    fetchAttractions();
  }, [formData.destination]);

  // Toggle a single place selection
  const togglePlaceSelection = (placeId: string) => {
    setSelectedPlaces(prev =>
      prev.includes(placeId)
        ? prev.filter(id => id !== placeId)
        : [...prev, placeId]
    );
  };

  // Select/deselect all places
  const toggleSelectAllPlaces = () => {
    if (selectedPlaces.length === destinationAttractions.length) {
      setSelectedPlaces([]);
    } else {
      setSelectedPlaces(destinationAttractions.map(a => a.id));
    }
  };

  const budgetBreakdown = [
    { name: 'Transport', value: 40, amount: (formData.budget * 0.4).toFixed(0) },
    { name: 'Stay', value: 35, amount: (formData.budget * 0.35).toFixed(0) },
    { name: 'Food', value: 15, amount: (formData.budget * 0.15).toFixed(0) },
    { name: 'Activities', value: 10, amount: (formData.budget * 0.1).toFixed(0) },
  ];

  // Dynamic steps based on selections
  const getSteps = () => {
    const baseSteps = [
      { title: 'Trip Type', icon: Plane },        // Step 1: Type of trip (return/one-way, direct/tour)
      { title: 'Basic Details', icon: MapPin },    // Step 2: Origin, destination, dates
      { title: 'Budget', icon: DollarSign },       // Step 3: Budget
    ];

    // Add Select Places step for:
    // - Tours (always show)
    // - Direct travel when user selected "include activities"
    if (formData.tripType === 'tour' || (formData.tripType === 'direct' && formData.includeActivities)) {
      baseSteps.push({ title: 'Select Places', icon: Heart });
    }

    // Add accommodation step if:
    // - Round trip (always show - user can check "no stay") OR
    // - Tour (always needs stay) OR
    // - One-way trips (always show - user sets stayNights = 0 to skip)
    baseSteps.push({ title: 'Accommodation', icon: Hotel });

    baseSteps.push({ title: 'Transportation', icon: Bus });
    baseSteps.push({ title: 'In-City Transport', icon: Car });  // NEW: In-city transport options
    baseSteps.push({ title: 'Priorities', icon: Target });

    // Only add interests if trip type is tour
    if (formData.tripType === 'tour') {
      baseSteps.push({ title: 'Interests', icon: Heart });
    }

    // Additional is now optional - always show it but user can skip
    baseSteps.push({ title: 'Additional (Optional)', icon: Check });

    return baseSteps;
  };

  const steps = getSteps();

  const interests = [
    'Culture', 'Adventure', 'Food', 'Nature', 'Nightlife',
    'Shopping', 'Beach', 'Art', 'Photography', 'Sports'
  ];

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.origin || !formData.destination) {
      toast.error('Please select origin and destination cities');
      return;
    }

    if (!formData.departureDate) {
      toast.error('Please select a departure date');
      return;
    }

    // Only require return date for round trips
    if (formData.isReturnTrip && !formData.returnDate) {
      toast.error('Please select a return date');
      return;
    }

    setIsSubmitting(true);
    toast.info('Finding the best trip options for you...');

    try {
      // Generate trip plans using backend API
      const tripResponse = await tripsAPI.generatePlan({
        ...formData,
        departureDate: formData.departureDate,
        // For one-way trips, use departure date as return date (same day)
        returnDate: formData.isReturnTrip ? formData.returnDate : formData.departureDate,
        isReturnTrip: formData.isReturnTrip,
        // For one-way trips: noStay is controlled by stayNights (0 means noStay)
        // For return trips: use the noStay checkbox value
        noStay: formData.isReturnTrip ? formData.noStay : (formData.stayNights === 0),
        stayNights: formData.stayNights,  // Pass user-specified nights for one-way trips
        trainClasses: formData.trainClasses,
        flightClasses: formData.flightClasses,
        busType: formData.busType,
        busOperator: formData.busOperator,
        stops: formData.stops,
        multipleStops: formData.multipleStops,
      });

      if (!tripResponse || !tripResponse.plans || tripResponse.plans.length === 0) {
        toast.error('No trip plans found for your criteria. Try adjusting your preferences.');
        return;
      }

      // Check for budget warnings from smart selection
      if (tripResponse.warnings && tripResponse.warnings.length > 0) {
        tripResponse.warnings.forEach((warning: any) => {
          if (warning.type === 'BUDGET_EXCEEDED') {
            toast.warning(`${warning.message}. Consider adjusting your budget or preferences.`);
          } else if (warning.type === 'ALTERNATIVE_SELECTED') {
            toast.info(warning.message);
          } else if (warning.type === 'BUDGET_TOO_LOW') {
            toast.error(warning.message);
          }
        });
      }

      // Clear saved trip data on successful submission
      localStorage.removeItem(TRIP_STORAGE_KEY);
      navigate('/results', {
        state: {
          formData,
          tripPlans: tripResponse.plans,
          algorithmPlans: tripResponse.algorithmPlans,  // NEW: Algorithm-generated plans
          tripId: tripResponse.id,
          warnings: tripResponse.warnings,
          includeActivities: tripResponse.includeActivities,  // NEW: Whether activities included
          arrivalInfo: tripResponse.arrivalInfo,  // NEW: Arrival time calculation info
          isReturnTrip: tripResponse.isReturnTrip,  // NEW: Trip type
          adjustedNights: tripResponse.adjustedNights,  // NEW: Hotel nights adjusted for travel time
          destinationAttractions: tripResponse.destinationAttractions,
          transportAlternatives: tripResponse.transportAlternatives,
          inCityTransportOptions: tripResponse.inCityTransportOptions
        }
      });
    } catch (error: any) {
      console.error('Failed to generate trip plans:', error);
      // Log full error for debugging
      if (error?.response) {
        console.error('API response error:', error.response);
      }
      const errorMessage = error?.message || 'Failed to generate trip plans. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleInterest = (interest: string) => {
    const lower = interest.toLowerCase();
    if (formData.interests.includes(lower)) {
      setFormData({
        ...formData,
        interests: formData.interests.filter(i => i !== lower),
      });
    } else {
      setFormData({
        ...formData,
        interests: [...formData.interests, lower],
      });
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const StepIcon = steps[currentStep].icon;

  return (
    <div className="map-page relative w-full h-dvh overflow-hidden">
      {/* â”€â”€ Full-screen Map Background â”€â”€ */}
      <MapBackground
        origin={formData.origin}
        destination={formData.destination}
        stops={formData.stops}
        showDirectDistance={
          steps[currentStep].title === 'Basic Details' &&
          !!formData.origin && !!formData.destination
        }
        flightPaths={
          steps[currentStep].title === 'Transportation' &&
          formData.transportation.includes('flights')
            ? prefetchedFlightPaths
            : []
        }
        trainPaths={
          steps[currentStep].title === 'Transportation' &&
          formData.transportation.includes('trains')
            ? prefetchedTrainPaths
            : []
        }
      />

      {/* â”€â”€ Navigation â”€â”€ */}
      <div className="absolute top-0 left-0 right-0 z-30">
        <Navigation />
      </div>

      {/* â”€â”€ Continue Trip Dialog â”€â”€ */}
      <Dialog open={showContinueDialog} onOpenChange={setShowContinueDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Continue Your Trip?
            </DialogTitle>
            <DialogDescription>
              You have an incomplete trip saved.
            </DialogDescription>
          </DialogHeader>
          {savedTripInfo && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">From:</span><span className="font-medium">{savedTripInfo.origin || 'Not set'}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">To:</span><span className="font-medium">{savedTripInfo.destination || 'Not set'}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Saved:</span><span className="font-medium">{savedTripInfo.savedAt ? new Date(savedTripInfo.savedAt).toLocaleDateString() : 'Recently'}</span></div>
            </div>
          )}
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={startNewTrip}>Start New Trip</Button>
            <Button onClick={restoreSavedTrip}>Continue Planning</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* â”€â”€ Floating Glass Panel (right side) â”€â”€ */}
      <aside className="absolute top-0 right-0 h-full z-20 flex items-stretch pt-16 pb-4 pr-4 pl-0 pointer-events-none">
        <div className="glass-panel rounded-2xl w-[420px] max-w-[95vw] flex flex-col pointer-events-auto shadow-2xl overflow-hidden">

          {/* Panel Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                <StepIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Step {currentStep + 1} / {steps.length}</p>
                <h2 className="text-white font-bold text-base leading-tight">{steps[currentStep].title}</h2>
              </div>
            </div>
            {/* Mini step dots */}
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <button key={i} onClick={() => setCurrentStep(i)}
                  className={cn("rounded-full transition-all duration-300",
                    i === currentStep ? "w-5 h-2 bg-blue-400" : i < currentStep ? "w-2 h-2 bg-blue-500/60" : "w-2 h-2 bg-white/20")}
                />
              ))}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-0.5 bg-white/10">
            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>

          {/* Trip summary tag */}
          {(formData.origin || formData.destination) && (
            <div className="flex items-center gap-2 px-6 py-2.5 border-b border-white/5 text-sm flex-wrap">
              {formData.origin && (
                <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />{formData.origin}
                </span>
              )}
              {formData.origin && formData.destination && <ArrowRight className="h-3 w-3 text-slate-500 shrink-0" />}
              {formData.destination && (
                <span className="flex items-center gap-1 bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />{formData.destination}
                </span>
              )}
              {formData.travelers > 0 && (
                <span className="ml-auto flex items-center gap-1 text-slate-400 text-xs">
                  <Users className="h-3 w-3" /> {formData.travelers}
                </span>
              )}
            </div>
          )}

          {/* Step Content â€“ scrollable */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
            className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-slate-100"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}
          >
            {/* â•â•â• STEP: BASIC DETAILS â•â•â• */}
            {steps[currentStep].title === 'Basic Details' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-400">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 uppercase tracking-wide font-medium">From</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-emerald-400 z-10" />
                    <input placeholder="Origin city..." value={originSearch}
                      onChange={(e) => { setOriginSearch(e.target.value); setShowOriginDropdown(true); }}
                      onFocus={() => setShowOriginDropdown(true)}
                      className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none" autoComplete="off" />
                    {showOriginDropdown && (
                      <div className="absolute z-50 w-full mt-1 rounded-xl shadow-2xl max-h-52 overflow-auto glass-dropdown">
                        {isSearchingOrigin ? <div className="p-3 text-sm text-slate-400">Searching...</div>
                          : originCities.length === 0 ? <div className="p-3 text-sm text-slate-400">No cities found</div>
                            : originCities.map((city) => (
                              <div key={city.code} className="flex items-center gap-3 p-3 cursor-pointer glass-dropdown-item transition-colors" onClick={() => selectOriginCity(city)}>
                                <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
                                <div><div className="font-medium text-white text-sm">{city.name}</div><div className="text-xs text-slate-400">{city.state}</div></div>
                                {city.transport?.hasAirport && <Plane className="h-3 w-3 text-slate-400 ml-auto" />}
                              </div>
                            ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 uppercase tracking-wide font-medium">To</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-red-400 z-10" />
                    <input placeholder="Destination city..." value={destinationSearch}
                      onChange={(e) => { setDestinationSearch(e.target.value); setShowDestinationDropdown(true); }}
                      onFocus={() => setShowDestinationDropdown(true)}
                      className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none" autoComplete="off" />
                    {showDestinationDropdown && (
                      <div className="absolute z-50 w-full mt-1 rounded-xl shadow-2xl max-h-52 overflow-auto glass-dropdown">
                        {isSearchingDestination ? <div className="p-3 text-sm text-slate-400">Searching...</div>
                          : destinationCities.length === 0 ? <div className="p-3 text-sm text-slate-400">No cities found</div>
                            : destinationCities.map((city) => (
                              <div key={city.code} className="flex items-center gap-3 p-3 cursor-pointer glass-dropdown-item transition-colors" onClick={() => selectDestinationCity(city)}>
                                <MapPin className="h-4 w-4 text-red-400 shrink-0" />
                                <div><div className="font-medium text-white text-sm">{city.name}</div><div className="text-xs text-slate-400">{city.state} Â· {city.popularFor?.slice(0, 2).join(', ')}</div></div>
                                {city.transport?.hasAirport && <Plane className="h-3 w-3 text-slate-400 ml-auto" />}
                              </div>
                            ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className={`grid gap-3 ${formData.isReturnTrip ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 uppercase tracking-wide font-medium">Departure</label>
                    <input type="date" value={formData.departureDate}
                      onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="glass-input w-full px-3 py-2.5 rounded-xl border text-sm outline-none dark:[&::-webkit-calendar-picker-indicator]:invert" />
                  </div>
                  {formData.isReturnTrip && (
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 uppercase tracking-wide font-medium">Return</label>
                      <input type="date" value={formData.returnDate}
                        onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                        min={formData.departureDate || new Date().toISOString().split('T')[0]}
                        className="glass-input w-full px-3 py-2.5 rounded-xl border text-sm outline-none dark:[&::-webkit-calendar-picker-indicator]:invert" />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 uppercase tracking-wide font-medium">Travelers</label>
                  <div className="flex items-center gap-4">
                    <button type="button" onClick={() => setFormData({ ...formData, travelers: Math.max(1, formData.travelers - 1) })} className="h-9 w-9 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-colors">-</button>
                    <div className="flex-1 text-center"><span className="text-2xl font-bold text-white">{formData.travelers}</span><span className="text-slate-400 ml-2 text-sm">{formData.travelers === 1 ? 'person' : 'people'}</span></div>
                    <button type="button" onClick={() => setFormData({ ...formData, travelers: formData.travelers + 1 })} className="h-9 w-9 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-colors">+</button>
                  </div>
                </div>

                <div className="space-y-3 pt-1 border-t border-white/10">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center transition-colors", formData.multipleStops ? "bg-blue-500 border-blue-500" : "border-white/30 group-hover:border-white/50")}
                      onClick={() => setFormData({ ...formData, multipleStops: !formData.multipleStops })}>
                      {formData.multipleStops && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className="text-sm text-slate-300">Add stops along the way</span>
                  </label>

                  {formData.multipleStops && (
                    <div className="pl-8 space-y-3 animate-in fade-in duration-300">
                      {formData.stops.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.stops.map((stop, i) => (
                            <span key={i} className="flex items-center gap-1.5 bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full text-xs font-medium">
                              <span className="w-4 h-4 rounded-full bg-amber-400/30 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                              {stop}
                              <X className="h-3 w-3 cursor-pointer hover:text-white" onClick={() => removeStop(stop)} />
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="relative">
                        <Plus className="absolute left-3 top-3 h-4 w-4 text-amber-400 z-10" />
                        <input placeholder="Add a stop city..." value={stopSearch}
                          onChange={(e) => { setStopSearch(e.target.value); setShowStopDropdown(true); }}
                          onFocus={() => setShowStopDropdown(true)}
                          className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none" autoComplete="off" />
                        {showStopDropdown && stopSearch && (
                          <div className="absolute z-50 w-full mt-1 rounded-xl shadow-2xl max-h-48 overflow-auto glass-dropdown">
                            {isSearchingStop ? <div className="p-3 text-sm text-slate-400">Searching...</div>
                              : stopCities.filter(c => !formData.stops.includes(c.name) && c.name !== formData.origin && c.name !== formData.destination).map((city) => (
                                <div key={city.code} className="flex items-center gap-3 p-3 cursor-pointer glass-dropdown-item transition-colors" onClick={() => selectStopCity(city)}>
                                  <Plus className="h-4 w-4 text-amber-400 shrink-0" />
                                  <div><div className="font-medium text-white text-sm">{city.name}</div><div className="text-xs text-slate-400">{city.state}</div></div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                      {(formData.origin || formData.destination) && (
                        <p className="text-xs text-slate-500">Route: {[formData.origin, ...formData.stops, formData.destination].filter(Boolean).join(' â†’ ')}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* â•â•â• STEP: TRIP TYPE â•â•â• */}
            {steps[currentStep].title === 'Trip Type' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-400">
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Journey Direction</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { val: 'return', label: 'Round Trip', sub: 'Going & returning', Icon: ArrowRight },
                      { val: 'oneway', label: 'One-Way', sub: 'Single journey', Icon: Plane },
                    ].map(({ val, label, sub, Icon }) => {
                      const selected = (val === 'return') === formData.isReturnTrip;
                      return (
                        <button key={val} type="button"
                          onClick={() => setFormData({ ...formData, isReturnTrip: val === 'return', returnDate: val === 'return' ? formData.returnDate : '' })}
                          className={cn("flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                            selected ? "border-blue-500 bg-blue-500/15 text-white" : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25")}>
                          <Icon className={cn("h-5 w-5", selected ? "text-blue-400" : "text-slate-400")} />
                          <span className="font-semibold text-sm">{label}</span>
                          <span className="text-xs text-slate-400 text-center">{sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Trip Style</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { val: 'direct', label: 'Direct Travel', sub: 'Point A to B', Icon: MapPin },
                      { val: 'tour', label: 'Planned Tour', sub: 'Multi-day adventure', Icon: Palmtree },
                    ].map(({ val, label, sub, Icon }) => {
                      const selected = formData.tripType === val;
                      return (
                        <button key={val} type="button"
                          onClick={() => setFormData({ ...formData, tripType: val, includeActivities: val === 'tour' ? true : formData.includeActivities })}
                          className={cn("flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                            selected ? "border-cyan-500 bg-cyan-500/15 text-white" : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25")}>
                          <Icon className={cn("h-5 w-5", selected ? "text-cyan-400" : "text-slate-400")} />
                          <span className="font-semibold text-sm">{label}</span>
                          <span className="text-xs text-slate-400 text-center">{sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {formData.tripType === 'direct' && (
                  <div className="space-y-2 animate-in fade-in duration-300">
                    <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Include Sightseeing?</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { val: 'yes', label: 'Yes, explore!', sub: 'Add activities budget', color: 'green' as const },
                        { val: 'no', label: 'Just travel', sub: 'Transport & stay only', color: 'orange' as const },
                      ].map(({ val, label, sub, color }) => {
                        const selected = val === 'yes' ? formData.includeActivities : !formData.includeActivities;
                        return (
                          <button key={val} type="button" onClick={() => setFormData({ ...formData, includeActivities: val === 'yes' })}
                            className={cn("flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200",
                              selected ? (color === 'green' ? "border-green-500 bg-green-500/15" : "border-orange-500 bg-orange-500/15") : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25")}>
                            {val === 'yes' ? <Check className="h-4 w-4 text-green-400" /> : <X className="h-4 w-4 text-orange-400" />}
                            <span className="font-medium text-sm text-white">{label}</span>
                            <span className="text-xs text-slate-400 text-center">{sub}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* â•â•â• STEP: BUDGET â•â•â• */}
            {steps[currentStep].title === 'Budget' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-400">
                <div className="text-center py-2">
                  <p className="text-4xl font-bold text-white">{formatINR(formData.budget)}</p>
                  <p className="text-slate-400 text-sm mt-1">per person</p>
                </div>
                <input type="range" min={0} max={200000} step={1000} value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: parseInt(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer" />
                <div className="flex justify-between text-xs text-slate-500"><span>â‚¹0</span><span>â‚¹2,00,000+</span></div>

                <div className="space-y-2">
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Budget Breakdown</p>
                  <div className="h-7 w-full flex rounded-full overflow-hidden">
                    <div className="flex items-center justify-center text-[10px] text-white font-bold bg-blue-500 w-[40%]">40% âœˆ</div>
                    <div className="flex items-center justify-center text-[10px] text-white font-bold bg-emerald-500 w-[35%]">35% ðŸ¨</div>
                    <div className="flex items-center justify-center text-[10px] text-white font-bold bg-orange-500 w-[15%]">15% ðŸ½</div>
                    <div className="flex items-center justify-center text-[10px] text-white font-bold bg-purple-500 w-[10%]">10%</div>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-xs text-center">
                    {[
                      { label: 'Transport', pct: 0.4, color: 'text-blue-400' },
                      { label: 'Stay', pct: 0.35, color: 'text-emerald-400' },
                      { label: 'Food', pct: 0.15, color: 'text-orange-400' },
                      { label: 'Fun', pct: 0.1, color: 'text-purple-400' },
                    ].map(b => (
                      <div key={b.label}>
                        <p className={cn('font-semibold', b.color)}>{formatINR(formData.budget * b.pct)}</p>
                        <p className="text-slate-500">{b.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Flexibility</p>
                  <div className="flex gap-2">
                    {['strict', 'moderate', 'flexible'].map(f => (
                      <button key={f} type="button" onClick={() => setFormData({ ...formData, budgetFlexibility: f })}
                        className={cn("flex-1 py-2 rounded-lg text-sm font-medium transition-all border",
                          formData.budgetFlexibility === f ? "bg-blue-500 border-blue-500 text-white" : "border-white/15 text-slate-300 hover:border-white/30")}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* â•â•â• STEP: SELECT PLACES â•â•â• */}
            {steps[currentStep].title === 'Select Places' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-400">
                {isLoadingAttractions ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="text-slate-400 animate-pulse">Loading attractions...</div>
                  </div>
                ) : destinationAttractions.length === 0 ? (
                  <div className="text-center py-10">
                    <Heart className="w-10 h-10 mx-auto text-slate-500 mb-3" />
                    <p className="text-slate-400">No attractions found for {formData.destination}</p>
                    <p className="text-xs text-slate-500 mt-1">Skip this step to continue</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                      <label className="flex items-center gap-2 cursor-pointer" onClick={toggleSelectAllPlaces}>
                        <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center", selectedPlaces.length === destinationAttractions.length ? "bg-blue-500 border-blue-500" : "border-white/30")}>
                          {selectedPlaces.length === destinationAttractions.length && <Check className="h-2.5 w-2.5 text-white" />}
                        </div>
                        <span className="font-medium text-sm text-white">Select all ({destinationAttractions.length})</span>
                      </label>
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30">{selectedPlaces.length} selected</Badge>
                    </div>
                    <div className="space-y-2">
                      {destinationAttractions.map((place) => (
                        <div key={place.id} onClick={() => togglePlaceSelection(place.id)}
                          className={cn("p-3 rounded-xl border-2 cursor-pointer transition-all",
                            selectedPlaces.includes(place.id) ? "border-blue-500/60 bg-blue-500/10" : "border-white/8 bg-white/3 hover:border-white/20")}>
                          <div className="flex items-center gap-3">
                            <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center shrink-0", selectedPlaces.includes(place.id) ? "bg-blue-500 border-blue-500" : "border-white/30")}>
                              {selectedPlaces.includes(place.id) && <Check className="h-2.5 w-2.5 text-white" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm text-white">{place.name}</span>
                                <span className={cn("text-xs px-2 py-0.5 rounded-full", place.entryFee === 0 ? "bg-green-500/20 text-green-300" : "bg-white/10 text-slate-300")}>{place.entryFee === 0 ? 'FREE' : `â‚¹${place.entryFee}`}</span>
                              </div>
                              <div className="flex gap-3 text-xs text-slate-500 mt-0.5"><span>{place.type}</span><span>Â· {place.duration}</span></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-400/20">
                      <span className="text-sm text-slate-300">Total entry fees:</span>
                      <span className="font-bold text-blue-300">â‚¹{destinationAttractions.filter(p => selectedPlaces.includes(p.id)).reduce((s, p) => s + (p.entryFee || 0), 0).toLocaleString('en-IN')}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* â•â•â• STEP: ACCOMMODATION â•â•â• */}
            {steps[currentStep].title === 'Accommodation' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-400">
                {!formData.isReturnTrip && (
                  <div className="space-y-3 p-4 rounded-xl bg-blue-500/10 border border-blue-400/20">
                    <p className="text-sm font-medium text-white flex items-center gap-2"><Hotel className="h-4 w-4 text-blue-400" /> How many nights?</p>
                    <p className="text-xs text-slate-400">Set to 0 if no accommodation needed.</p>
                    <div className="flex items-center gap-4">
                      <button type="button" onClick={() => setFormData({ ...formData, stayNights: Math.max(0, formData.stayNights - 1), noStay: formData.stayNights <= 1 })} className="h-9 w-9 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold">-</button>
                      <div className="flex-1 text-center"><span className="text-2xl font-bold text-white">{formData.stayNights}</span><span className="text-slate-400 ml-2 text-sm">{formData.stayNights === 1 ? 'night' : 'nights'}</span></div>
                      <button type="button" onClick={() => setFormData({ ...formData, stayNights: formData.stayNights + 1, noStay: false })} className="h-9 w-9 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold">+</button>
                    </div>
                    {formData.stayNights === 0 && <p className="text-xs text-amber-400">âš ï¸ No accommodation will be included.</p>}
                  </div>
                )}

                {formData.isReturnTrip && (
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 cursor-pointer">
                    <div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center shrink-0", formData.noStay ? "bg-blue-500 border-blue-500" : "border-white/30")}
                      onClick={() => setFormData({ ...formData, noStay: !formData.noStay, accommodations: !formData.noStay ? [] : ['hotels'] })}>
                      {formData.noStay && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">No accommodation needed</p>
                      <p className="text-xs text-slate-400">Day trip or staying with family</p>
                    </div>
                  </label>
                )}

                {!formData.noStay && (formData.isReturnTrip || formData.stayNights >= 1) && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Hotels', icon: <Building className="h-4 w-4" />, val: 'hotels' },
                        { label: 'Hostels', icon: <Users className="h-4 w-4" />, val: 'hostels' },
                        { label: 'Airbnb', icon: <Home className="h-4 w-4" />, val: 'airbnb' },
                        { label: 'Guest House', icon: <Heart className="h-4 w-4" />, val: 'guest house' },
                      ].map(item => {
                        const active = formData.accommodations.includes(item.val);
                        return (
                          <button key={item.val} type="button"
                            onClick={() => setFormData({ ...formData, accommodations: active ? formData.accommodations.filter(a => a !== item.val) : [...formData.accommodations, item.val] })}
                            className={cn("flex items-center gap-2 p-3 rounded-xl border-2 text-sm transition-all", active ? "border-blue-500 bg-blue-500/15 text-white" : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25")}>
                            <span className={active ? "text-blue-400" : "text-slate-400"}>{item.icon}</span>{item.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Minimum Stars</p>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button key={star} type="button" onClick={() => setFormData({ ...formData, starRating: star })}
                            className={cn("h-9 w-9 rounded-lg text-sm font-bold transition-all", star <= formData.starRating ? "bg-amber-500 text-white" : "bg-white/10 text-slate-400 hover:bg-white/20")}>{star}â˜…</button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Room Type</p>
                      <div className="flex gap-2">
                        {[{ val: 'standard', label: 'Private' }, { val: 'deluxe', label: 'Shared' }, { val: 'suite', label: 'Suite' }].map(r => (
                          <button key={r.val} type="button" onClick={() => setFormData({ ...formData, roomType: r.val })}
                            className={cn("flex-1 py-2 rounded-lg text-sm border transition-all", formData.roomType === r.val ? "bg-blue-500 border-blue-500 text-white" : "border-white/15 text-slate-300 hover:border-white/30")}>{r.label}</button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* â•â•â• STEP: TRANSPORTATION â•â•â• */}
            {steps[currentStep].title === 'Transportation' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-400">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Flights', Icon: Plane, val: 'flights' },
                    { label: 'Trains', Icon: Train, val: 'trains' },
                    { label: 'Buses', Icon: Bus, val: 'buses' },
                  ].map(({ label, Icon, val }) => {
                    const active = formData.transportation.includes(val);
                    return (
                      <button key={val} type="button"
                        onClick={() => setFormData({ ...formData, transportation: active ? formData.transportation.filter((t: string) => t !== val) : [...formData.transportation, val] })}
                        className={cn("flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all", active ? "border-blue-500 bg-blue-500/15" : "border-white/10 bg-white/5 hover:border-white/25")}>
                        <Icon className={cn("h-5 w-5", active ? "text-blue-400" : "text-slate-400")} />
                        <span className={cn("text-sm font-medium", active ? "text-white" : "text-slate-300")}>{label}</span>
                        {active && <Check className="h-3 w-3 text-blue-400" />}
                      </button>
                    );
                  })}
                </div>

                {formData.transportation.includes('flights') && (
                  <div className="space-y-2 p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Flight Class</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[{ label: 'Economy', val: 'economy' }, { label: 'Premium Eco', val: 'premium-economy' }, { label: 'Business', val: 'business' }, { label: 'First', val: 'first' }].map(c => {
                        const active = formData.flightClasses.includes(c.val);
                        return (
                          <button key={c.val} type="button"
                            onClick={() => setFormData({ ...formData, flightClasses: active ? formData.flightClasses.filter((x: string) => x !== c.val) : [...formData.flightClasses, c.val] })}
                            className={cn("py-2 px-3 rounded-lg text-xs border transition-all text-left flex items-center gap-2", active ? "border-blue-500 bg-blue-500/20 text-white" : "border-white/10 text-slate-400 hover:border-white/20")}>
                            {active && <Check className="h-3 w-3 text-blue-400" />}{c.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {formData.transportation.includes('trains') && (
                  <div className="space-y-2 p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Train Class</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[{ label: '1A', val: '1A' }, { label: '2A', val: '2A' }, { label: '3A', val: '3A' }, { label: 'CC', val: 'CC' }, { label: 'SL', val: 'SL' }, { label: 'GN', val: 'GN' }].map(c => {
                        const active = formData.trainClasses.includes(c.val);
                        return (
                          <button key={c.val} type="button"
                            onClick={() => setFormData({ ...formData, trainClasses: active ? formData.trainClasses.filter((x: string) => x !== c.val) : [...formData.trainClasses, c.val] })}
                            className={cn("py-2 px-2 rounded-lg text-xs border transition-all text-center", active ? "border-blue-500 bg-blue-500/20 text-white" : "border-white/10 text-slate-400 hover:border-white/20")}>{c.label}</button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {formData.transportation.includes('buses') && (
                  <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="grid grid-cols-2 gap-2">
                      {['ac', 'non-ac'].map(bt => (
                        <button key={bt} type="button" onClick={() => setFormData({ ...formData, busType: bt })}
                          className={cn("py-2 rounded-lg text-sm border transition-all", formData.busType === bt ? "border-blue-500 bg-blue-500/20 text-white" : "border-white/10 text-slate-400 hover:border-white/20")}>{bt === 'ac' ? 'AC' : 'Non-AC'}</button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {['rtc', 'private'].map(bo => (
                        <button key={bo} type="button" onClick={() => setFormData({ ...formData, busOperator: bo })}
                          className={cn("py-2 rounded-lg text-sm border transition-all", formData.busOperator === bo ? "border-blue-500 bg-blue-500/20 text-white" : "border-white/10 text-slate-400 hover:border-white/20")}>{bo === 'rtc' ? 'RTC' : 'Private'}</button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Max Transfers</p>
                  <div className="flex gap-2">
                    {[['0', 'Direct only'], ['1', 'Up to 1 stop'], ['2', 'Up to 2 stops']].map(([val, label]) => (
                      <button key={val} type="button" onClick={() => setFormData({ ...formData, maxTransfers: parseInt(val) })}
                        className={cn("flex-1 py-2 rounded-lg text-xs border transition-all", formData.maxTransfers === parseInt(val) ? "bg-blue-500 border-blue-500 text-white" : "border-white/15 text-slate-300 hover:border-white/30")}>{label}</button>
                    ))}
                  </div>
                </div>

                {/* ── Map route legend ── */}
                {(formData.transportation.includes('flights') || formData.transportation.includes('trains')) && (
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
                    <span className="text-slate-400 font-medium">Map routes:</span>
                    {formData.transportation.includes('flights') && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-5 h-0.5 bg-sky-400 inline-block rounded-full" />
                        <span className="text-sky-300">Flights</span>
                      </span>
                    )}
                    {formData.transportation.includes('trains') && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-5 h-0.5 bg-orange-400 inline-block rounded-full border-t-0" style={{borderTop:'2px dashed'}} />
                        <span className="text-orange-300">Trains</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* â•â•â• STEP: IN-CITY TRANSPORT â•â•â• */}
            {steps[currentStep].title === 'In-City Transport' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-400">
                <p className="text-sm text-slate-400">How do you prefer to get around at your destination?</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Car Rental', Icon: Car, val: 'car rental', desc: 'Self-drive flexibility' },
                    { label: 'Auto Rickshaw', Icon: Car, val: 'auto rickshaw', desc: 'Affordable & local' },
                    { label: 'Bike Rental', Icon: Bike, val: 'bike rental', desc: 'Explore at your pace' },
                    { label: 'RTC Bus', Icon: Bus, val: 'rtc bus', desc: 'Public transport' },
                  ].map(({ label, Icon, val, desc }) => {
                    const active = formData.transportation.includes(val);
                    return (
                      <button key={val} type="button"
                        onClick={() => setFormData({ ...formData, transportation: active ? formData.transportation.filter((t: string) => t !== val) : [...formData.transportation, val] })}
                        className={cn("flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all", active ? "border-cyan-500 bg-cyan-500/15" : "border-white/10 bg-white/5 hover:border-white/25")}>
                        <div className={cn("p-2 rounded-full", active ? "bg-cyan-500/20 text-cyan-400" : "bg-white/10 text-slate-400")}><Icon className="h-4 w-4" /></div>
                        <span className={cn("text-sm font-medium", active ? "text-white" : "text-slate-300")}>{label}</span>
                        <span className="text-xs text-slate-500 text-center">{desc}</span>
                        {active && <Check className="h-3 w-3 text-cyan-400" />}
                      </button>
                    );
                  })}
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-400">
                  Selected: {formData.transportation.filter((t: string) => ['car rental', 'auto rickshaw', 'bike rental', 'rtc bus'].includes(t)).join(', ') || 'None (optional)'}
                </div>
              </div>
            )}

            {/* â•â•â• STEP: PRIORITIES â•â•â• */}
            {steps[currentStep].title === 'Priorities' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-400">
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Main Priority</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: 'budget', label: 'Budget', Icon: DollarSign, desc: 'Lowest price first' },
                      { val: 'time', label: 'Time', Icon: Clock, desc: 'Fastest routes' },
                      { val: 'comfort', label: 'Comfort', Icon: Zap, desc: 'Best amenities' },
                      { val: 'experience', label: 'Experience', Icon: Camera, desc: 'Unique activities' },
                      { val: 'balanced', label: 'Balanced', Icon: Scale, desc: 'Best overall value' },
                    ].map(({ val, label, Icon, desc }) => {
                      const active = formData.priority === val;
                      return (
                        <button key={val} type="button" onClick={() => setFormData({ ...formData, priority: val })}
                          className={cn("flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left", active ? "border-blue-500 bg-blue-500/15" : "border-white/10 bg-white/5 hover:border-white/25")}>
                          <Icon className={cn("h-4 w-4 shrink-0", active ? "text-blue-400" : "text-slate-400")} />
                          <div>
                            <p className={cn("font-medium text-sm", active ? "text-white" : "text-slate-300")}>{label}</p>
                            <p className="text-xs text-slate-500">{desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Travel Style</p>
                  <div className="flex gap-2">
                    {['relaxed', 'moderate', 'packed'].map(s => (
                      <button key={s} type="button" onClick={() => setFormData({ ...formData, travelStyle: s })}
                        className={cn("flex-1 py-2 rounded-lg text-sm border transition-all", formData.travelStyle === s ? "bg-blue-500 border-blue-500 text-white" : "border-white/15 text-slate-300 hover:border-white/30")}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* â•â•â• STEP: INTERESTS â•â•â• */}
            {steps[currentStep].title === 'Interests' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-400">
                <p className="text-sm text-slate-400">Select interests for your tour (tap to toggle):</p>
                <div className="flex flex-wrap gap-2">
                  {['Culture', 'Adventure', 'Food', 'Nature', 'Nightlife', 'Shopping', 'Beach', 'Art', 'Photography', 'Sports'].map(label => {
                    const active = formData.interests.includes(label.toLowerCase());
                    return (
                      <button key={label} type="button" onClick={() => toggleInterest(label)}
                        className={cn("flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border-2 transition-all font-medium",
                          active ? "border-blue-400/50 bg-blue-500/20 text-blue-200" : "border-white/10 text-slate-400 hover:border-white/25")}>
                        {active && <Check className="h-3 w-3" />}{label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500">Selected: {formData.interests.length > 0 ? formData.interests.map(i => i.charAt(0).toUpperCase() + i.slice(1)).join(', ') : 'None'}</p>
              </div>
            )}

            {/* â•â•â• STEP: ADDITIONAL (OPTIONAL) â•â•â• */}
            {steps[currentStep].title === 'Additional (Optional)' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-400">
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 uppercase tracking-wide font-medium">Special Requirements</label>
                  <textarea placeholder="e.g. Wheelchair access, ocean view preferred..." value={formData.specialRequirements}
                    onChange={(e) => setFormData({ ...formData, specialRequirements: e.target.value })}
                    rows={3} className="glass-input w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Dietary Restrictions</p>
                  <div className="flex flex-wrap gap-2">
                    {['Vegan', 'Gluten-Free', 'Halal', 'Kosher', 'Nut Allergy'].map(tag => {
                      const active = formData.dietaryRestrictions.includes(tag);
                      return (
                        <button key={tag} type="button"
                          onClick={() => setFormData({ ...formData, dietaryRestrictions: active ? formData.dietaryRestrictions.filter((d: string) => d !== tag) : [...formData.dietaryRestrictions, tag] })}
                          className={cn("px-3 py-1 rounded-full text-xs border transition-all", active ? "bg-blue-500/20 border-blue-400/50 text-blue-300" : "border-white/10 text-slate-400 hover:border-white/25")}>{tag}</button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Accessibility</p>
                  {['Wheelchair Access', 'Elevator Required'].map(need => (
                    <label key={need} className="flex items-center gap-3 cursor-pointer">
                      <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center", formData.accessibilityNeeds.includes(need) ? "bg-blue-500 border-blue-500" : "border-white/30")}
                        onClick={() => setFormData({ ...formData, accessibilityNeeds: formData.accessibilityNeeds.includes(need) ? formData.accessibilityNeeds.filter((n: string) => n !== need) : [...formData.accessibilityNeeds, need] })}>
                        {formData.accessibilityNeeds.includes(need) && <Check className="h-2.5 w-2.5 text-white" />}
                      </div>
                      <span className="text-sm text-slate-300">{need}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </form>

          {/* â”€â”€ Navigation Buttons â”€â”€ */}
          <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between gap-3">
            {(formData.origin || formData.destination) && (
              <button type="button" onClick={startNewTrip} className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1">
                <X className="h-3 w-3" /> Reset
              </button>
            )}
            <div className={cn("flex gap-2", (formData.origin || formData.destination) ? "ml-auto" : "flex-1")}>
              <button type="button"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border border-white/15 text-slate-300 hover:border-white/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              {currentStep < steps.length - 1 ? (
                <button type="button"
                  onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-500/25">
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:brightness-110 text-white transition-all shadow-lg shadow-blue-500/30 disabled:opacity-70">
                  {isSubmitting ? 'Finding options...' : (<><Zap className="h-4 w-4 fill-current" /> Generate Trip</>)}
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
