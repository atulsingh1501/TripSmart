import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Navigation from '../components/Navigation';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plane, Train, Hotel, Clock, Star, ArrowRight, Calendar, MapPin, IndianRupee, Users, Activity, Bookmark, Eye, Scale, ArrowUpDown, Info } from 'lucide-react';
import MapBackground from '../components/MapBackground';
import { toast } from 'sonner';
import { formatINR, type TripPlanData } from '../../services/api';
import { arcPath, getCoordinates, getCoordinatesByIATA } from '../../data/cityCoordinates';

function isIataLike(value?: string) {
  return !!value && /^[A-Z]{3}$/.test(value.trim());
}

function resolveCoordinates(value?: string, fallbackCity?: string): [number, number] | null {
  if (isIataLike(value)) {
    const byCode = getCoordinatesByIATA(value as string);
    if (byCode) return byCode;
  }
  if (value) {
    const byCity = getCoordinates(value);
    if (byCity) return byCity;
  }
  if (fallbackCity) {
    return getCoordinates(fallbackCity);
  }
  return null;
}

function getPlanRoutePreview(plan: TripPlanData, formData: any) {
  const outbound: any = plan.flight?.outbound || {};
  const trainRoutePath = outbound.routePath as [number, number][] | undefined;
  const isTrain =
    plan.transport?.mode === 'train' ||
    plan.transport?.type === 'train' ||
    outbound?.mode === 'train' ||
    outbound?.type === 'train';

  const from = resolveCoordinates(outbound.departure, formData?.origin);
  const to = resolveCoordinates(outbound.arrival, formData?.destination);

  const flightPaths: [number, number][][] = [];
  const trainPaths: [number, number][][] = [];

  if (isTrain) {
    if (Array.isArray(trainRoutePath) && trainRoutePath.length > 1) {
      trainPaths.push(trainRoutePath);
    } else if (from && to) {
      trainPaths.push([from, to]);
    }
  } else if (from && to) {
    flightPaths.push(arcPath(from, to));
  }

  return { isTrain, flightPaths, trainPaths };
}

export default function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sortBy, setSortBy] = useState('recommended');
  
  // Get trip plans from navigation state or use defaults
  const {
    formData,
    tripPlans: generatedPlans,
    includeActivities = true,
    arrivalInfo,
    isReturnTrip = true,
    adjustedNights,
  } = location.state || {};

  const tripPlans: TripPlanData[] = generatedPlans || [];

  // Sort plans based on selection
  const sortedPlans = useMemo(() => {
    return [...tripPlans].sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0; // default order from algorithm
      }
    });
  }, [tripPlans, sortBy]);

  // Initial state setup for focused plan
  const [focusedPlanId, setFocusedPlanId] = useState<number | null>(sortedPlans.length > 0 ? sortedPlans[0].id : null);
  const [shortlistedPlanIds, setShortlistedPlanIds] = useState<number[]>([]);
  const [comparePlanIds, setComparePlanIds] = useState<number[]>([]);
  const [rightPanelMode, setRightPanelMode] = useState<'details' | 'compare'>('details');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const focusedPlan = useMemo(() => {
    if (focusedPlanId == null) return null;
    return sortedPlans.find((plan) => plan.id === focusedPlanId) ?? null;
  }, [focusedPlanId, sortedPlans]);

  const mapPlan = focusedPlan ?? sortedPlans[0] ?? null;
  const comparePlans = sortedPlans.filter((p) => comparePlanIds.includes(p.id));
  const focusedRoute = mapPlan ? getPlanRoutePreview(mapPlan, formData) : null;

  const handleGenerateItinerary = (planId: number) => {
    const selectedTripPlan = tripPlans.find(p => p.id === planId);
    if (!selectedTripPlan) return;
    toast.success('Opening itinerary workspace...');
    setTimeout(() => {
      navigate(`/trip-details/${planId}`, {
        state: {
          tripPlan: selectedTripPlan,
          formData,
          arrivalInfo: selectedTripPlan.arrivalInfo || arrivalInfo,
          adjustedNights,
          isReturnTrip,
        },
      });
    }, 350);
  };

  const toggleShortlist = (e: React.MouseEvent, planId: number) => {
    e.stopPropagation();
    setShortlistedPlanIds((current) => {
      if (current.includes(planId)) {
        toast.info('Removed from saved plans');
        return current.filter((id) => id !== planId);
      }
      toast.success('Plan saved for later');
      return [...current, planId];
    });
  };

  const toggleCompare = (e: React.MouseEvent, planId: number) => {
    e.stopPropagation();
    setComparePlanIds((current) => {
      if (current.includes(planId)) {
        const next = current.filter((id) => id !== planId);
        if (next.length === 0 && rightPanelMode === 'compare') {
          setRightPanelMode('details');
        }
        return next;
      }
      if (current.length >= 2) {
        toast.info('You can compare up to 2 plans at once');
        return current;
      }
      setRightPanelMode('compare');
      return [...current, planId];
    });
  };

  const selectPlan = (planId: number) => {
    setFocusedPlanId(planId);
    if (rightPanelMode === 'compare' && comparePlanIds.length === 0) {
      setRightPanelMode('details');
    }
  };

  // Fetch recommendations
  useEffect(() => {
    if (tripPlans.length > 0) {
      setLoadingRecommendations(true);
      fetch('/api/trips/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPlan: sortedPlans[0] })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setRecommendations(data.data);
        }
      })
      .catch(err => console.error('Error fetching recommendations:', err))
      .finally(() => setLoadingRecommendations(false));
    }
  }, []);

  if (!tripPlans || tripPlans.length === 0) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] flex flex-col font-sans">
        <Navigation />
        <main className="flex-1 flex flex-col items-center justify-center p-8 mt-20">
          <h1 className="text-3xl font-serif font-bold text-[#1A1814] mb-4">No Trip Plans Found</h1>
          <p className="text-[#6B6560] mb-8 text-center max-w-md">Generate a new itinerary to see recommendations and options tailored to your preferences.</p>
          <Button 
            onClick={() => navigate('/plan-trip')}
            className="bg-[#1A1814] text-[#F7F4EF] hover:bg-[#C85F3C] transition-colors rounded-full px-8 py-6 text-sm font-semibold tracking-wide"
          >
            Build Itinerary <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#F7F4EF] flex flex-col font-sans text-[#1A1814] overflow-hidden">
      {/* Navbar Fixed at Top */}
      <div className="flex-shrink-0 z-50">
        <Navigation />
      </div>

      <main className="flex-1 flex flex-col md:flex-row mt-[60px] relative z-10 overflow-hidden h-[calc(100vh-60px)]">
        
        {/* ======================= */}
        {/* LEFT COLUMN - OPTIONS */}
        {/* ======================= */}
        <div className="w-full md:w-[480px] lg:w-[540px] border-r border-[#1A1814]/10 bg-[#F7F4EF] flex flex-col h-full z-20 shadow-[4px_0_24px_rgba(26,24,20,0.03)] flex-shrink-0 relative">
          
          {/* List Header */}
          <div className="p-6 border-b border-[#1A1814]/10 bg-[#F7F4EF]/90 backdrop-blur-md sticky top-0 z-20">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-2xl font-serif font-bold tracking-tight text-[#1A1814]">Your Options</h1>
                <div className="flex items-center gap-2 mt-1 text-sm text-[#6B6560]">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{formData?.origin} <ArrowRight className="inline h-3 w-3 mx-0.5"/> {formData?.destination}</span>
                </div>
              </div>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] h-9 bg-transparent border-[#1A1814]/20 rounded-full text-xs font-medium focus:ring-0 focus:border-[#C85F3C]">
                  <ArrowUpDown className="mr-2 h-3.5 w-3.5 text-[#C85F3C]" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#1A1814]/10 bg-[#F7F4EF]">
                  <SelectItem value="recommended">Best Match</SelectItem>
                  <SelectItem value="price-low">Lowest Price</SelectItem>
                  <SelectItem value="price-high">Highest Price</SelectItem>
                  <SelectItem value="rating">Top Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wider font-semibold text-[#1A1814]/60">
              <span className="flex items-center gap-1.5 bg-[#1A1814]/5 px-2.5 py-1 rounded-full">
                <Users className="h-3 w-3" /> {formData?.travelers || 1}
              </span>
              <span className="flex items-center gap-1.5 bg-[#1A1814]/5 px-2.5 py-1 rounded-full">
                <Calendar className="h-3 w-3" /> {((adjustedNights ?? formData?.nights ?? 1) + 1)} Days
              </span>
              <span className="flex items-center gap-1.5 bg-[#1A1814]/5 px-2.5 py-1 rounded-full">
                <Activity className="h-3 w-3" /> {formData?.tripType === 'tour' ? 'Tour' : 'Direct'}
              </span>
            </div>
          </div>
          
          {/* Options List */}
          <div className="flex-1 overflow-y-auto p-5 pb-24 space-y-5 relative scrollbar-thin scrollbar-thumb-[#1A1814]/10 scrollbar-track-transparent">
            
            {!includeActivities && (
              <div className="bg-[#C85F3C]/5 border border-[#C85F3C]/20 rounded-2xl p-4 flex gap-3 items-start">
                <Info className="h-5 w-5 text-[#C85F3C] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-[#1A1814]">Activities excluded</p>
                  <p className="text-xs text-[#6B6560] mt-1 leading-relaxed">Budget is optimized strictly for transport, accommodation, and meals based on your request.</p>
                </div>
              </div>
            )}

            {sortedPlans.map((plan, index) => {
              const isFocused = focusedPlanId === plan.id;
              const isShortlisted = shortlistedPlanIds.includes(plan.id);
              const isCompared = comparePlanIds.includes(plan.id);
              
              // Determine Transport Details
              const isTrain = plan.transport?.mode === 'train' || plan.flight?.outbound?.mode === 'train' || plan.flight?.outbound?.type === 'train';
              const TransportIcon = isTrain ? Train : Plane;
              const transportName = plan.flight?.outbound?.name || plan.flight?.outbound?.airline || (isTrain ? 'Train' : 'Flight');
              
              let durationStr = '';
              const dur = plan.flight?.outbound?.duration;
              if (typeof dur === 'object' && dur?.hours !== undefined) {
                durationStr = dur.minutes > 0 ? `${dur.hours}h ${dur.minutes}m` : `${dur.hours}h`;
              } else if (typeof dur === 'string') {
                durationStr = dur;
              }

              return (
                <motion.div
                  key={plan.id}
                  layoutId={`plan-${plan.id}`}
                  onClick={() => selectPlan(plan.id)}
                  whileHover={{ scale: isFocused ? 1 : 1.01 }}
                  transition={{ duration: 0.2 }}
                  className={`
                    relative group cursor-pointer rounded-[20px] overflow-hidden transition-all duration-300
                    ${isFocused 
                      ? 'bg-white shadow-[0_8px_30px_rgba(26,24,20,0.08)] border-2 border-[#1A1814]' 
                      : 'bg-white/60 border border-[#1A1814]/10 hover:border-[#1A1814]/30 hover:bg-white hover:shadow-md'
                    }
                  `}
                >
                  {/* Decorative Side Notch (Ticket Style) */}
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-8 bg-[#F7F4EF] rounded-r-full border-r border-y border-transparent transition-colors z-10" 
                       style={{ borderColor: isFocused ? '#1A1814' : 'rgba(26,24,20,0.1)' }} />
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-8 bg-[#F7F4EF] rounded-l-full border-l border-y border-transparent transition-colors z-10" 
                       style={{ borderColor: isFocused ? '#1A1814' : 'rgba(26,24,20,0.1)' }} />
                       
                  <div className="p-5 pl-6">
                    {/* Top Row: Tier & Price */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] uppercase tracking-widest font-bold text-[#C85F3C]">{plan.tier}</span>
                          {index === 0 && <span className="bg-[#1A1814] text-[#F7F4EF] text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-sm">Top Pick</span>}
                        </div>
                        <h3 className="font-serif font-bold text-lg leading-tight text-[#1A1814] pr-4">{plan.name}</h3>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] uppercase tracking-wider text-[#6B6560] block mb-0.5">Total for all</span>
                        <span className="font-bold text-xl text-[#1A1814] tracking-tight">{formatINR(plan.price)}</span>
                      </div>
                    </div>

                    {/* Middle Row: Journey Visual */}
                    <div className="flex items-center gap-3 py-3 border-y border-[#1A1814]/5 mb-4">
                       <div className="flex flex-col items-center gap-1 w-12 shrink-0 text-[#1A1814]">
                         <div className="w-8 h-8 rounded-full bg-[#1A1814]/5 flex items-center justify-center">
                           <TransportIcon className="h-4 w-4" />
                         </div>
                       </div>
                       
                       <div className="flex-1 flex flex-col justify-center relative">
                         <div className="h-[1px] w-full bg-gradient-to-r from-[#1A1814]/20 via-[#1A1814]/40 to-[#1A1814]/20 absolute top-1/2" />
                         <div className="w-1.5 h-1.5 rounded-full bg-[#1A1814] absolute left-0 top-1/2 -translate-y-1/2" />
                         <div className="w-1.5 h-1.5 rounded-full bg-[#1A1814] absolute right-0 top-1/2 -translate-y-1/2" />
                         <span className="text-[10px] font-medium text-[#6B6560] text-center bg-white px-2 relative z-10 mx-auto w-max rounded-full">
                           {durationStr}
                         </span>
                       </div>
                       
                       <div className="flex flex-col items-center gap-1 w-12 shrink-0 text-[#1A1814]">
                         <div className="w-8 h-8 rounded-full bg-[#1A1814]/5 flex items-center justify-center">
                           <Hotel className="h-4 w-4" />
                         </div>
                       </div>
                    </div>

                    {/* Bottom Row: Quick Facts */}
                    <div className="flex items-center justify-between text-xs font-medium text-[#6B6560] mb-4">
                      <span className="truncate max-w-[130px]">{transportName}</span>
                      {plan.hotel?.name && (
                        <span className="flex items-center gap-1 truncate max-w-[130px]">
                          {plan.hotel.stars}★ {plan.hotel.name.split(' ').slice(0, 2).join(' ')}
                        </span>
                      )}
                      <span className="flex items-center gap-1 shrink-0 bg-yellow-100/50 text-yellow-700 px-1.5 py-0.5 rounded-md">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" /> {plan.rating.toFixed(1)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => toggleShortlist(e, plan.id)}
                        className={`h-8 px-2 flex-1 rounded-lg text-xs font-semibold ${isShortlisted ? 'bg-[#1A1814] text-white hover:bg-[#1A1814]/90' : 'bg-transparent text-[#1A1814] border border-[#1A1814]/20 hover:bg-[#1A1814]/5'}`}
                      >
                        <Bookmark className={`mr-1.5 h-3.5 w-3.5 ${isShortlisted ? 'fill-current' : ''}`} />
                        {isShortlisted ? 'Saved' : 'Save'}
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => toggleCompare(e, plan.id)}
                        className={`h-8 px-2 flex-1 rounded-lg text-xs font-semibold ${isCompared ? 'bg-[#C85F3C] text-white hover:bg-[#C85F3C]/90 border-transparent' : 'bg-transparent text-[#1A1814] border border-[#1A1814]/20 hover:bg-[#1A1814]/5'}`}
                      >
                        <Scale className="mr-1.5 h-3.5 w-3.5" />
                        {isCompared ? 'Comparing' : 'Compare'}
                      </Button>

                      <Button 
                        onClick={(e) => { e.stopPropagation(); handleGenerateItinerary(plan.id); }} 
                        size="sm"
                        className="h-8 px-4 flex-[1.5] rounded-lg text-xs font-bold bg-[#1A1814] text-white hover:bg-[#C85F3C] transition-colors shadow-sm"
                      >
                        Book <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            
            {/* AI Recommendations inline at bottom */}
            {recommendations.length > 0 && (
              <div className="pt-6 pb-4">
                <h3 className="font-serif font-bold text-lg mb-4 text-[#1A1814]">Similar Destinations</h3>
                <div className="space-y-4">
                  {recommendations.map((rec) => (
                    <div key={rec.destination} className="bg-white/40 border border-[#1A1814]/10 rounded-2xl p-4 hover:bg-white transition-colors cursor-pointer group" onClick={() => navigate('/plan-trip', { state: { formData: { ...formData, destination: rec.destination } } })}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-serif font-bold text-[#1A1814] group-hover:text-[#C85F3C] transition-colors">{rec.destination}</h4>
                        <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{rec.matchPercentage}% Match</span>
                      </div>
                      <p className="text-xs text-[#6B6560] leading-relaxed mb-3 line-clamp-2">{rec.similarBecause}</p>
                      <div className="flex justify-between items-end">
                        <div className="text-[10px] font-medium text-[#1A1814]/60 uppercase tracking-wider flex items-center gap-3">
                          <span>{rec.durationDays} Days</span>
                          <span>•</span>
                          <span>{formatINR(rec.totalCost)}</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-[#1A1814]/40 group-hover:text-[#C85F3C] transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        </div>

        {/* ======================= */}
        {/* RIGHT COLUMN - MAP & DETAILS */}
        {/* ======================= */}
        <div className="flex-1 flex flex-col h-full bg-[#1A1814] relative overflow-hidden">
          
          {/* Map Section (Top) */}
          <div className="h-[45%] lg:h-[50%] relative shrink-0">
             {focusedRoute && (
               <MapBackground
                 origin={formData?.origin}
                 destination={formData?.destination}
                 stops={formData?.stops || []}
                 showDirectDistance
                 flightPaths={focusedRoute.flightPaths}
                 trainPaths={focusedRoute.trainPaths}
               />
             )}
             {/* Fade into details section below */}
             <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[#1A1814] pointer-events-none z-10" />
             
             {/* Map overlays / Badges */}
             {rightPanelMode === 'compare' && (
               <div className="absolute top-6 left-6 z-20">
                 <button onClick={() => setRightPanelMode('details')} className="bg-[#1A1814]/80 hover:bg-[#1A1814] text-white backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold tracking-wide flex items-center gap-2 border border-white/10 transition-colors shadow-lg">
                   &larr; Exit Compare
                 </button>
               </div>
             )}
          </div>

          {/* Details / Compare Section (Bottom) */}
          <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-12 pt-2 bg-[#1A1814] text-white z-20 relative scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
             
             <AnimatePresence mode="wait">
               {rightPanelMode === 'details' && focusedPlan ? (
                 <motion.div
                   key="details"
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   transition={{ duration: 0.3 }}
                   className="space-y-8 max-w-3xl mx-auto"
                 >
                    {/* Header */}
                    <div>
                      <h2 className="text-3xl font-serif font-bold tracking-tight mb-2">{focusedPlan.name}</h2>
                      <p className="text-white/60 font-medium">{focusedPlan.description || 'A perfectly balanced itinerary for your journey.'}</p>
                    </div>

                    {/* Total Cost Block */}
                    <div className="bg-white/5 border border-white/10 rounded-[24px] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 backdrop-blur-xl">
                      <div>
                        <span className="text-white/50 text-xs uppercase tracking-widest font-bold block mb-1">Total Estimated Cost</span>
                        <div className="text-4xl font-bold font-serif text-white tracking-tight">{formatINR(focusedPlan.price)}</div>
                      </div>
                      <Button onClick={() => handleGenerateItinerary(focusedPlan.id)} className="bg-[#C85F3C] text-white hover:bg-[#b05334] rounded-full px-8 py-6 text-sm font-bold shadow-lg transition-all hover:shadow-[#C85F3C]/20 border-none shrink-0">
                        Book This Trip <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>

                    {/* Breakdown Grid */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-white/50">Cost Breakdown</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                           <Plane className="h-4 w-4 text-white/40 mb-3" />
                           <div className="text-xs text-white/60 mb-1">Transport</div>
                           <div className="font-semibold text-lg">{formatINR(focusedPlan.breakdown?.transport || 0)}</div>
                         </div>
                         <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                           <Hotel className="h-4 w-4 text-white/40 mb-3" />
                           <div className="text-xs text-white/60 mb-1">Stay</div>
                           <div className="font-semibold text-lg">{formatINR(focusedPlan.breakdown?.accommodation || 0)}</div>
                         </div>
                         {includeActivities ? (
                           <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                             <Activity className="h-4 w-4 text-[#C85F3C] mb-3" />
                             <div className="text-xs text-white/60 mb-1">Activities</div>
                             <div className="font-semibold text-lg text-[#C85F3C]">{formatINR(focusedPlan.breakdown?.activities || 0)}</div>
                           </div>
                         ) : (
                           <div className="bg-white/5 border border-white/10 rounded-2xl p-4 opacity-50">
                             <Activity className="h-4 w-4 text-white/40 mb-3" />
                             <div className="text-xs text-white/60 mb-1">Activities</div>
                             <div className="font-semibold text-lg">—</div>
                           </div>
                         )}
                         <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                           <IndianRupee className="h-4 w-4 text-white/40 mb-3" />
                           <div className="text-xs text-white/60 mb-1">Meals & Misc</div>
                           <div className="font-semibold text-lg">{formatINR((focusedPlan.breakdown?.meals || 0) + (focusedPlan.breakdown?.misc || 0))}</div>
                         </div>
                      </div>
                    </div>

                    {/* Journey Details */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-white/50">Journey Details</h3>
                      <div className="bg-[#151412] border border-white/5 rounded-[24px] overflow-hidden">
                        {/* Transport */}
                        <div className="p-5 flex items-start gap-4 border-b border-white/5">
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-1">
                            {focusedPlan.transport?.mode === 'train' || focusedPlan.flight?.outbound?.mode === 'train' ? <Train className="h-5 w-5 text-white" /> : <Plane className="h-5 w-5 text-white" />}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white mb-1">{focusedPlan.flight?.outbound?.name || focusedPlan.flight?.outbound?.airline || 'Transport'}</div>
                            <div className="text-xs text-white/60 leading-relaxed mb-3">
                              {focusedPlan.flight?.outbound?.class || 'Standard Class'} • {focusedPlan.flight?.outbound?.departureTime || 'TBD'} to {focusedPlan.flight?.outbound?.arrivalTime || 'TBD'}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium text-white/80">
                              <span className="bg-white/10 px-2 py-1 rounded-md">{formData?.origin}</span>
                              <ArrowRight className="h-3 w-3 text-white/40" />
                              <span className="bg-white/10 px-2 py-1 rounded-md">{formData?.destination}</span>
                            </div>
                          </div>
                        </div>
                        {/* Hotel */}
                        {focusedPlan.hotel && (
                          <div className="p-5 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#C85F3C]/20 flex items-center justify-center shrink-0 mt-1">
                              <Hotel className="h-5 w-5 text-[#C85F3C]" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white mb-1">{focusedPlan.hotel.name}</div>
                              <div className="text-xs text-white/60 mb-2 flex items-center gap-1">
                                {focusedPlan.hotel.stars} Star Accommodation <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 inline ml-1" />
                              </div>
                              <div className="text-xs font-medium text-white/80">
                                {focusedPlan.hotel.roomType || 'Standard Room'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                 </motion.div>
               ) : rightPanelMode === 'compare' ? (
                 <motion.div
                   key="compare"
                   initial={{ opacity: 0, scale: 0.98 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.98 }}
                   transition={{ duration: 0.3 }}
                   className="max-w-4xl mx-auto space-y-6"
                 >
                    <div>
                      <h2 className="text-3xl font-serif font-bold tracking-tight mb-2">Compare Plans</h2>
                      <p className="text-white/60 font-medium">Side-by-side analysis of your selected options.</p>
                    </div>

                    {comparePlans.length === 0 ? (
                      <div className="text-center py-20 text-white/40 bg-white/5 rounded-[24px] border border-white/5 border-dashed">
                        Select plans from the left using the "Compare" button to view them here.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {comparePlans.map((plan) => (
                          <div key={`comp-${plan.id}`} className="bg-[#151412] border border-white/10 rounded-[24px] p-6 flex flex-col relative overflow-hidden">
                             {/* Accents */}
                             <div className="absolute top-0 right-0 w-32 h-32 bg-[#C85F3C]/10 rounded-bl-full blur-2xl pointer-events-none" />
                             
                             <div className="flex justify-between items-start mb-6">
                               <div>
                                 <div className="text-[10px] uppercase tracking-widest text-[#C85F3C] font-bold mb-1">{plan.tier}</div>
                                 <h3 className="font-serif font-bold text-xl">{plan.name}</h3>
                               </div>
                               <div className="text-right">
                                 <div className="text-2xl font-bold">{formatINR(plan.price)}</div>
                               </div>
                             </div>

                             <div className="space-y-5 flex-1 relative z-10">
                               <div className="space-y-1">
                                 <div className="flex justify-between text-xs text-white/60 mb-1">
                                   <span>Transport</span>
                                   <span className="text-white font-medium">{formatINR(plan.breakdown.transport || 0)}</span>
                                 </div>
                                 <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                   <div className="bg-white/40 h-full rounded-full" style={{ width: `${Math.min(100, ((plan.breakdown.transport || 0) / plan.price) * 100)}%` }} />
                                 </div>
                                 <div className="text-[10px] text-white/40 truncate pt-1">{plan.flight?.outbound?.name || 'Transport'}</div>
                               </div>

                               <div className="space-y-1">
                                 <div className="flex justify-between text-xs text-white/60 mb-1">
                                   <span>Accommodation</span>
                                   <span className="text-white font-medium">{formatINR(plan.breakdown.accommodation || 0)}</span>
                                 </div>
                                 <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                   <div className="bg-white/40 h-full rounded-full" style={{ width: `${Math.min(100, ((plan.breakdown.accommodation || 0) / plan.price) * 100)}%` }} />
                                 </div>
                                 <div className="text-[10px] text-white/40 truncate pt-1">{plan.hotel?.name || 'No Hotel'}</div>
                               </div>

                               {includeActivities && (
                                 <div className="space-y-1">
                                   <div className="flex justify-between text-xs text-[#C85F3C]/80 mb-1">
                                     <span>Activities</span>
                                     <span className="text-[#C85F3C] font-medium">{formatINR(plan.breakdown.activities || 0)}</span>
                                   </div>
                                   <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                     <div className="bg-[#C85F3C] h-full rounded-full" style={{ width: `${Math.min(100, ((plan.breakdown.activities || 0) / plan.price) * 100)}%` }} />
                                   </div>
                                 </div>
                               )}
                             </div>

                             <Button 
                               onClick={() => handleGenerateItinerary(plan.id)} 
                               className="w-full mt-8 bg-white/10 hover:bg-white/20 text-white border-none rounded-xl font-bold"
                             >
                               Select Plan
                             </Button>
                          </div>
                        ))}
                      </div>
                    )}
                 </motion.div>
               ) : null}
             </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
