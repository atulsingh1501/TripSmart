import { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Navigation from '../components/Navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Plane, Train, Hotel, Star, ArrowRight, Calendar, MapPin,
  IndianRupee, Users, Activity, Bookmark, Scale, ArrowUpDown, Info,
  Clock, ChevronDown, ChevronUp
} from 'lucide-react';
import MapBackground from '../components/MapBackground';
import { toast } from 'sonner';
import { formatINR, type TripPlanData } from '../../services/api';
import { arcPath, getCoordinates, getCoordinatesByIATA } from '../../data/cityCoordinates';
import { getRailwayCorridors } from '../../data/railwayCorridors';

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function isIataLike(v?: string) {
  return !!v && /^[A-Z]{3}$/.test(v.trim());
}
function resolveCoords(v?: string, fb?: string): [number, number] | null {
  if (isIataLike(v)) { const c = getCoordinatesByIATA(v!); if (c) return c; }
  if (v) { const c = getCoordinates(v); if (c) return c; }
  if (fb) return getCoordinates(fb);
  return null;
}

interface RoutePreview {
  isTrain: boolean;
  flightPaths: [number, number][][];
  trainPaths:  [number, number][][];
}

function getPlanRoute(plan: TripPlanData, formData: any): RoutePreview {
  const outbound: any = plan.flight?.outbound || {};
  const isTrain =
    plan.transport?.mode === 'train' ||
    plan.transport?.type === 'train' ||
    outbound?.mode === 'train' ||
    outbound?.type === 'train';

  const from = resolveCoords(outbound.departure, formData?.origin);
  const to   = resolveCoords(outbound.arrival,   formData?.destination);

  const flightPaths: [number, number][][] = [];
  const trainPaths:  [number, number][][] = [];

  if (isTrain) {
    // 1️⃣ Try pre-computed railway corridors (most accurate, same as PlanTripPage)
    const corridors = getRailwayCorridors(formData?.origin || '', formData?.destination || '');
    if (corridors && corridors.length > 0) {
      trainPaths.push(...corridors);
    } else {
      // 2️⃣ Fall back to backend routePath if available
      const rp = outbound.routePath as [number, number][] | undefined;
      if (rp && rp.length > 1) {
        trainPaths.push(rp);
      } else if (from && to) {
        // 3️⃣ Last resort: straight line
        trainPaths.push([from, to]);
      }
    }
  } else if (from && to) {
    flightPaths.push(arcPath(from, to));
  }

  return { isTrain, flightPaths, trainPaths };
}

/* ─────────────────────────────────────────────
   Accent colours per plan index
───────────────────────────────────────────── */
// Palette: Mint Whisper #D1F2EB | Emerald Green #50C878 | Royal Teal #0B6E4F | Dark Evergreen #013220
const PLAN_ACCENTS = [
  { border: '#50C878', glow: 'rgba(80,200,120,0.18)', badge: '#50C878' },
  { border: '#D1F2EB', glow: 'rgba(209,242,235,0.12)', badge: '#D1F2EB' },
  { border: '#0B6E4F', glow: 'rgba(11,110,79,0.20)', badge: '#50C878' },
  { border: '#34d399', glow: 'rgba(52,211,153,0.12)', badge: '#34d399' },
  { border: '#50C878', glow: 'rgba(80,200,120,0.14)', badge: '#50C878' },
];

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
export default function ResultsPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [sortBy, setSortBy] = useState('recommended');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [shortlistedIds, setShortlistedIds] = useState<number[]>([]);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const {
    formData,
    tripPlans: generatedPlans,
    includeActivities = true,
    arrivalInfo,
    isReturnTrip = true,
    adjustedNights,
  } = location.state || {};

  const tripPlans: TripPlanData[] = generatedPlans || [];

  const sortedPlans = useMemo(() => {
    return [...tripPlans].sort((a, b) => {
      switch (sortBy) {
        case 'price-low':  return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'rating':     return b.rating - a.rating;
        default: return 0;
      }
    });
  }, [tripPlans, sortBy]);

  // Auto-expand first plan
  useEffect(() => {
    if (sortedPlans.length > 0 && expandedId === null) {
      setExpandedId(sortedPlans[0].id);
    }
  }, [sortedPlans]);

  const focusedPlan = useMemo(() =>
    expandedId != null ? sortedPlans.find(p => p.id === expandedId) ?? null : null,
  [expandedId, sortedPlans]);

  const focusedRoute = useMemo(() =>
    focusedPlan ? getPlanRoute(focusedPlan, formData) : null,
  [focusedPlan, formData]);

  const handleItinerary = useCallback((planId: number) => {
    const plan = tripPlans.find(p => p.id === planId);
    if (!plan) return;
    toast.success('Opening itinerary workspace...');
    setTimeout(() => navigate(`/trip-details/${planId}`, {
      state: { tripPlan: plan, formData, arrivalInfo: plan.arrivalInfo || arrivalInfo, adjustedNights, isReturnTrip, destinationAttractions: location.state?.destinationAttractions }
    }), 350);
  }, [tripPlans, formData, arrivalInfo, adjustedNights, isReturnTrip, navigate, location.state]);

  const toggleShortlist = useCallback((e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setShortlistedIds(cur => cur.includes(id)
      ? (toast.info('Removed from saved'), cur.filter(x => x !== id))
      : (toast.success('Saved for later'), [...cur, id]));
  }, []);

  const toggleCompare = useCallback((e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setCompareIds(cur => {
      if (cur.includes(id)) return cur.filter(x => x !== id);
      if (cur.length >= 2) { toast.info('Max 2 plans can be compared'); return cur; }
      setShowCompare(true);
      return [...cur, id];
    });
  }, []);

  // Recommendations
  useEffect(() => {
    if (tripPlans.length > 0) {
      fetch('/api/trips/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPlan: sortedPlans[0] })
      }).then(r => r.json()).then(d => {
        if (d.success && d.data) setRecommendations(d.data);
      }).catch(() => {});
    }
  }, []);

  if (!tripPlans || tripPlans.length === 0) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#013220', color: '#D1F2EB' }}>
        <Navigation />
        <div className="flex-1 flex flex-col items-center justify-center p-8 mt-20">
          <h1 className="text-3xl font-serif font-bold mb-4" style={{ color: '#D1F2EB' }}>No Trip Plans Found</h1>
          <p className="mb-8 text-center max-w-md" style={{ color: 'rgba(209,242,235,0.5)' }}>
            Generate a new itinerary to see options tailored to your preferences.
          </p>
          <button
            onClick={() => navigate('/plan-trip')}
            className="flex items-center gap-2 px-8 py-3 rounded-full font-bold text-sm transition-all"
            style={{ background: '#50C878', color: '#013220' }}
          >
            Build Itinerary <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#013220', color: '#D1F2EB', fontFamily: 'var(--font-sans, sans-serif)' }}>

      {/* ── Map fills entire background ─────────────────── */}
      <div className="absolute inset-0 z-0">
        {focusedRoute && (
          <MapBackground
            origin={formData?.origin}
            destination={formData?.destination}
            stops={formData?.stops || []}
            showDirectDistance
            flightPaths={focusedRoute.flightPaths}
            trainPaths={focusedRoute.trainPaths}
            forceDark={false}
          />
        )}
        {/* Evergreen-to-transparent overlay: content readable on left, map visible on right */}
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{ background: 'linear-gradient(to right, #013220 0%, rgba(1,50,32,0.97) 30%, rgba(11,110,79,0.55) 55%, rgba(80,200,120,0.08) 72%, transparent 85%)' }} 
        />
      </div>

      {/* ── Navigation ──────────────────────────────────── */}
      <div className="relative z-50 flex-shrink-0">
        <Navigation />
      </div>

      {/* ── Main content ────────────────────────────────── */}
      <div className="relative z-10 flex flex-1 overflow-hidden mt-[60px]">

        {/* ══════════════════════════════════════════════
            LEFT COLUMN — 40%
        ══════════════════════════════════════════════ */}
        <div className="w-full md:w-[42%] xl:w-[38%] flex flex-col h-full overflow-hidden flex-shrink-0">

          {/* Header bar */}
          <div className="px-6 pt-6 pb-4 flex-shrink-0">
            <div className="flex items-end justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1" style={{ color: 'rgba(209,242,235,0.55)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  <MapPin className="h-3 w-3" />
                  {formData?.origin} → {formData?.destination}
                </div>
                <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.8rem', fontWeight: 700, lineHeight: 1.1, color: '#D1F2EB', letterSpacing: '-0.01em' }}>
                  {sortedPlans.length} Option{sortedPlans.length !== 1 ? 's' : ''} Found
                </h1>
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-8 w-[130px] rounded-full border-white/10 bg-white/5 text-xs font-medium text-white/70 focus:ring-0 focus:border-white/20 shrink-0">
                  <ArrowUpDown className="mr-1.5 h-3 w-3 text-[#50C878]" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-white/10 bg-[#1a1b2e]">
                  {[['recommended', 'Best Match'], ['price-low', 'Lowest Price'], ['price-high', 'Highest Price'], ['rating', 'Top Rated']].map(([v, l]) => (
                    <SelectItem key={v} value={v} className="text-white/80 hover:text-white">{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Trip meta pills */}
            <div className="flex flex-wrap gap-2" style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {[
                { icon: <Users className="h-3 w-3" />, label: `${formData?.travelers || 1} Traveller${(formData?.travelers || 1) > 1 ? 's' : ''}` },
                { icon: <Calendar className="h-3 w-3" />, label: `${((adjustedNights ?? formData?.nights ?? 1) + 1)} Days` },
                { icon: <Activity className="h-3 w-3" />, label: formData?.tripType === 'tour' ? 'Tour' : 'Direct' },
                { icon: <IndianRupee className="h-3 w-3" />, label: `Budget ${formatINR(formData?.budget || 0)}` },
              ].map((p, i) => (
                <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(11,110,79,0.25)', color: 'rgba(209,242,235,0.75)', border: '1px solid rgba(80,200,120,0.15)' }}>
                  {p.icon} {p.label}
                </span>
              ))}
            </div>

            {!includeActivities && (
              <div className="mt-3 flex items-start gap-2 p-3 rounded-xl" style={{ background: 'rgba(80,200,120,0.06)', border: '1px solid rgba(80,200,120,0.20)' }}>
                <Info className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#50C878' }} />
                <p style={{ fontSize: '0.75rem', color: 'rgba(209,242,235,0.7)', lineHeight: 1.5 }}>
                  Activities excluded — budget covers transport, stay & meals only.
                </p>
              </div>
            )}
          </div>

          {/* Scrollable plan list */}
          <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-4 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
            {sortedPlans.map((plan, idx) => {
              const accent = PLAN_ACCENTS[idx % PLAN_ACCENTS.length];
              const isExpanded  = expandedId === plan.id;
              const isSaved     = shortlistedIds.includes(plan.id);
              const isCompared  = compareIds.includes(plan.id);
              const isTrain     = plan.transport?.mode === 'train' || plan.flight?.outbound?.mode === 'train';
              const TransIcon   = isTrain ? Train : Plane;
              const transportName = plan.flight?.outbound?.name || plan.flight?.outbound?.airline || (isTrain ? 'Train' : 'Flight');
              const dur = plan.flight?.outbound?.duration;
              const durationStr = typeof dur === 'object' && (dur as any)?.hours !== undefined
                ? ((dur as any).minutes > 0 ? `${(dur as any).hours}h ${(dur as any).minutes}m` : `${(dur as any).hours}h`)
                : (typeof dur === 'string' ? dur : '');

              return (
                <motion.div
                  key={plan.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => {
                    setExpandedId(isExpanded ? null : plan.id);
                  }}
                  className="cursor-pointer rounded-[18px] overflow-hidden transition-all duration-300"
                  style={{
                    background: isExpanded
                      ? `linear-gradient(135deg, rgba(11,110,79,0.18) 0%, rgba(1,50,32,0.5) 100%)`
                      : 'rgba(1,50,32,0.35)',
                    border: `1px solid ${isExpanded ? accent.border : 'rgba(80,200,120,0.12)'}`,
                    boxShadow: isExpanded ? `0 0 40px ${accent.glow}` : 'none',
                  }}
                >
                  {/* ── Card Header (always visible) ─────── */}
                  <div className="p-4 flex items-start gap-3">
                    {/* Transport icon bubble */}
                    <div className="flex flex-col items-center gap-1 shrink-0 mt-0.5">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: isExpanded ? accent.border : 'rgba(255,255,255,0.06)' }}>
                        <TransIcon className="h-4 w-4" style={{ color: isExpanded ? '#fff' : 'rgba(240,237,232,0.5)' }} />
                      </div>
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent.badge }}>
                          {plan.tier}
                        </span>
                        {idx === 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider" style={{ background: '#50C878', color: '#013220' }}>
                            Top Pick
                          </span>
                        )}
                        {plan.badge && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider" style={{ background: 'rgba(80,200,120,0.12)', color: 'rgba(209,242,235,0.6)' }}>
                            {plan.badge}
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1rem', fontWeight: 700, color: '#D1F2EB', lineHeight: 1.2 }}>
                        {plan.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1" style={{ fontSize: '0.72rem', color: 'rgba(209,242,235,0.5)', fontWeight: 500 }}>
                        <span className="flex items-center gap-1"><TransIcon className="h-3 w-3" />{transportName}</span>
                        {durationStr && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{durationStr}</span>}
                        {plan.hotel?.stars && <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />{plan.hotel.stars}★</span>}
                      </div>
                    </div>

                    {/* Price + chevron */}
                    <div className="text-right shrink-0 flex flex-col items-end gap-2">
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(209,242,235,0.45)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</div>
                        <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.15rem', fontWeight: 700, color: '#D1F2EB' }}>{formatINR(plan.price)}</div>
                        {plan.priceForecast && (
                          <div style={{ marginTop: 3, maxWidth: 118, fontSize: '0.58rem', lineHeight: 1.25, color: plan.priceForecast.trend === 'rising' ? '#fca5a5' : plan.priceForecast.trend === 'falling' ? '#86efac' : 'rgba(209,242,235,0.55)' }}>
                            {plan.priceForecast.trend === 'rising' ? 'Price rising — book soon' : plan.priceForecast.trend === 'falling' ? 'Price may fall — watch' : 'Price stable'}
                          </div>
                        )}
                      </div>
                      {isExpanded
                        ? <ChevronUp className="h-4 w-4" style={{ color: 'rgba(240,237,232,0.3)' }} />
                        : <ChevronDown className="h-4 w-4" style={{ color: 'rgba(240,237,232,0.3)' }} />
                      }
                    </div>
                  </div>

                  {/* ── Expanded Details ─────────────────── */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4" style={{ borderTop: '1px solid rgba(80,200,120,0.12)' }}>
                          {/* Cost breakdown mini-grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-4 mb-4">
                            {[
                              { label: 'Transport', value: plan.breakdown?.transport || 0, icon: <TransIcon className="h-3 w-3" /> },
                              { label: 'Stay', value: plan.breakdown?.accommodation || 0, icon: <Hotel className="h-3 w-3" /> },
                              { label: 'Activities', value: includeActivities ? (plan.breakdown?.activities || 0) : 0, icon: <Activity className="h-3 w-3" />, dim: !includeActivities },
                              { label: 'Meals & Misc', value: (plan.breakdown?.meals || 0) + (plan.breakdown?.misc || 0), icon: <IndianRupee className="h-3 w-3" /> },
                            ].map((item, i) => (
                              <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(11,110,79,0.15)', border: '1px solid rgba(80,200,120,0.12)', opacity: item.dim ? 0.4 : 1 }}>
                                <div className="flex items-center gap-1 mb-1" style={{ color: 'rgba(209,242,235,0.5)', fontSize: '0.65rem', fontWeight: 600 }}>
                                  {item.icon} {item.label}
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#D1F2EB' }}>{item.dim ? '—' : formatINR(item.value)}</div>
                              </div>
                            ))}
                          </div>

                          {/* Journey info */}
                          <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(11,110,79,0.10)', border: '1px solid rgba(80,200,120,0.12)' }}>
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <div style={{ fontSize: '0.65rem', color: 'rgba(209,242,235,0.45)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                                  {isTrain ? 'Train' : 'Flight'}
                                </div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#D1F2EB' }}>{transportName}</div>
                                <div style={{ fontSize: '0.72rem', color: 'rgba(209,242,235,0.45)', marginTop: 2 }}>
                                  {plan.flight?.outbound?.class || 'Standard'} · {plan.flight?.outbound?.departureTime || '—'} → {plan.flight?.outbound?.arrivalTime || '—'}
                                </div>
                              </div>
                              {plan.hotel && (
                                <div className="flex-1 pl-4" style={{ borderLeft: '1px solid rgba(80,200,120,0.12)' }}>
                                  <div style={{ fontSize: '0.65rem', color: 'rgba(209,242,235,0.45)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                                    Stay
                                  </div>
                                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#D1F2EB' }}>{plan.hotel.name}</div>
                                  <div style={{ fontSize: '0.72rem', color: 'rgba(209,242,235,0.45)', marginTop: 2 }}>
                                    {plan.hotel.stars}★ · {plan.hotel.roomType || 'Standard Room'}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => toggleShortlist(e, plan.id)}
                              className="h-8 flex-1 flex items-center justify-center gap-1.5 rounded-lg transition-all text-xs font-bold"
                              style={{
                                background: isSaved ? '#D1F2EB' : 'rgba(11,110,79,0.20)',
                                color: isSaved ? '#013220' : 'rgba(209,242,235,0.7)',
                                border: '1px solid rgba(80,200,120,0.15)',
                              }}
                            >
                              <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-current' : ''}`} />
                              {isSaved ? 'Saved' : 'Save'}
                            </button>
                            <button
                              onClick={(e) => toggleCompare(e, plan.id)}
                              className="h-8 flex-1 flex items-center justify-center gap-1.5 rounded-lg transition-all text-xs font-bold"
                              style={{
                                background: isCompared ? accent.border : 'rgba(11,110,79,0.20)',
                                color: isCompared ? '#013220' : 'rgba(209,242,235,0.7)',
                                border: '1px solid rgba(80,200,120,0.15)',
                              }}
                            >
                              <Scale className="h-3.5 w-3.5" />
                              {isCompared ? 'Comparing' : 'Compare'}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleItinerary(plan.id); }}
                              className="h-8 flex-[1.8] flex items-center justify-center gap-1.5 rounded-lg font-black text-xs transition-all"
                              style={{ background: '#50C878', color: '#013220' }}
                            >
                              View Itinerary <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}

            {/* ── Recommendations at bottom of list ─── */}
            {recommendations.length > 0 && (
              <div className="pt-4">
                <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1rem', fontWeight: 700, color: '#D1F2EB', marginBottom: 12 }}>
                  Similar Destinations
                </h3>
                <div className="space-y-3">
                  {recommendations.map(rec => (
                    <div
                      key={rec.destination}
                      className="rounded-2xl p-4 cursor-pointer group transition-all"
                      style={{ background: 'rgba(11,110,79,0.10)', border: '1px solid rgba(80,200,120,0.12)' }}
                      onClick={() => navigate('/plan-trip', { state: { formData: { ...formData, destination: rec.destination } } })}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <h4 style={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: '#D1F2EB', fontSize: '0.9rem' }}>
                          {rec.destination}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(80,200,120,0.15)', color: '#50C878' }}>
                          {rec.matchPercentage}% Match
                        </span>
                      </div>
                      <p style={{ fontSize: '0.72rem', color: 'rgba(209,242,235,0.5)', lineHeight: 1.5, marginBottom: 8 }} className="line-clamp-2">{rec.similarBecause}</p>
                      <div className="flex justify-between items-center" style={{ fontSize: '0.68rem', color: 'rgba(209,242,235,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        <span>{rec.durationDays} Days · {formatINR(rec.totalCost)}</span>
                        <ArrowRight className="h-3.5 w-3.5 group-hover:text-[#50C878] transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            RIGHT COLUMN — map fills the rest (visible through gradient)
        ══════════════════════════════════════════════ */}
        {/* The actual map is in the full background; the right side is just space */}
        <div className="hidden md:flex flex-1 flex-col justify-end p-8 pb-10 pointer-events-none">
          {/* Floating route badge */}
          {focusedPlan && (
            <motion.div
              key={focusedPlan.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="ml-auto pointer-events-auto"
              style={{ maxWidth: 260 }}
            >
              <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(1,50,32,0.85)', border: '1px solid rgba(80,200,120,0.18)', backdropFilter: 'blur(20px)' }}>
                <div className="px-5 py-4">
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(209,242,235,0.45)', marginBottom: 4 }}>
                    Currently Viewing
                  </div>
                  <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '1rem', fontWeight: 700, color: '#D1F2EB', marginBottom: 2 }}>
                    {focusedPlan.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(209,242,235,0.55)' }}>
                    {focusedRoute?.isTrain
                      ? '🚂 Train route shown on map'
                      : '✈️ Flight arc shown on map'}
                  </div>
                </div>
                <div className="px-5 py-3" style={{ borderTop: '1px solid rgba(80,200,120,0.10)' }}>
                  <div className="flex justify-between" style={{ fontSize: '0.7rem', color: 'rgba(209,242,235,0.5)', fontWeight: 600 }}>
                    <span>{formData?.origin}</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>{formData?.destination}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Compare drawer (slides up from bottom) ── */}
      <AnimatePresence>
        {showCompare && compareIds.length > 0 && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl overflow-hidden"
            style={{ background: 'rgba(1,50,32,0.97)', border: '1px solid rgba(80,200,120,0.15)', backdropFilter: 'blur(24px)', maxHeight: '70vh' }}
          >
            <div className="p-6 overflow-y-auto" style={{ maxHeight: '70vh' }}>
              <div className="flex justify-between items-center mb-6">
                <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.4rem', fontWeight: 700, color: '#D1F2EB' }}>Compare Plans</h2>
                <button
                  onClick={() => setShowCompare(false)}
                  className="px-4 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(11,110,79,0.25)', color: 'rgba(209,242,235,0.7)' }}
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {compareIds.map(id => {
                  const plan = sortedPlans.find(p => p.id === id);
                  const pidx = sortedPlans.findIndex(p => p.id === id);
                  const accent = PLAN_ACCENTS[pidx % PLAN_ACCENTS.length];
                  if (!plan) return null;
                  return (
                    <div key={id} className="rounded-2xl p-5" style={{ background: 'rgba(11,110,79,0.15)', border: `1px solid ${accent.border}` }}>
                      <div style={{ fontSize: '0.65rem', color: accent.badge, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{plan.tier}</div>
                      <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.2rem', fontWeight: 700, color: '#D1F2EB', marginBottom: 2 }}>{plan.name}</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#D1F2EB', marginBottom: 16 }}>{formatINR(plan.price)}</div>
                      {[
                        ['Transport', plan.breakdown?.transport || 0],
                        ['Stay', plan.breakdown?.accommodation || 0],
                        ['Activities', plan.breakdown?.activities || 0],
                        ['Meals & Misc', (plan.breakdown?.meals || 0) + (plan.breakdown?.misc || 0)],
                      ].map(([label, val]) => (
                        <div key={label as string} className="mb-3">
                          <div className="flex justify-between mb-1" style={{ fontSize: '0.72rem', color: 'rgba(209,242,235,0.55)', fontWeight: 600 }}>
                            <span>{label}</span>
                            <span style={{ color: '#D1F2EB' }}>{formatINR(val as number)}</span>
                          </div>
                          <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, ((val as number) / plan.price) * 100)}%`, background: accent.border }} />
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => handleItinerary(plan.id)}
                        className="w-full mt-4 py-2.5 rounded-xl font-bold text-sm transition-all"
                        style={{ background: accent.border, color: '#fff' }}
                      >
                        Select This Plan
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compare trigger badge (shows when plans selected but drawer closed) */}
      <AnimatePresence>
        {!showCompare && compareIds.length > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => setShowCompare(true)}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm shadow-lg"
            style={{ background: '#50C878', color: '#013220' }}
          >
            <Scale className="h-4 w-4" />
            Compare {compareIds.length} Plan{compareIds.length > 1 ? 's' : ''}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
