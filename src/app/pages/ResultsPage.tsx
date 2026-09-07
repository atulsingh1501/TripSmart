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
    // Prefer real routePath from backend, fall back to straight line
    const rp = outbound.routePath as [number, number][] | undefined;
    if (rp && rp.length > 1) {
      trainPaths.push(rp);
    } else if (from && to) {
      trainPaths.push([from, to]);
    }
  } else if (from && to) {
    flightPaths.push(arcPath(from, to));
  }

  return { isTrain, flightPaths, trainPaths };
}

/* ─────────────────────────────────────────────
   Accent colours per plan index
───────────────────────────────────────────── */
const PLAN_ACCENTS = [
  { border: '#C85F3C', glow: 'rgba(200,95,60,0.15)', badge: '#C85F3C' },
  { border: '#38bdf8', glow: 'rgba(56,189,248,0.12)', badge: '#38bdf8' },
  { border: '#a78bfa', glow: 'rgba(167,139,250,0.12)', badge: '#a78bfa' },
  { border: '#34d399', glow: 'rgba(52,211,153,0.12)', badge: '#34d399' },
  { border: '#fb923c', glow: 'rgba(251,146,60,0.12)', badge: '#fb923c' },
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
      state: { tripPlan: plan, formData, arrivalInfo: plan.arrivalInfo || arrivalInfo, adjustedNights, isReturnTrip }
    }), 350);
  }, [tripPlans, formData, arrivalInfo, adjustedNights, isReturnTrip, navigate]);

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
      <div className="min-h-screen flex flex-col" style={{ background: '#0d0e1a', color: '#f0ede8' }}>
        <Navigation />
        <div className="flex-1 flex flex-col items-center justify-center p-8 mt-20">
          <h1 className="text-3xl font-serif font-bold mb-4" style={{ color: '#f0ede8' }}>No Trip Plans Found</h1>
          <p className="mb-8 text-center max-w-md" style={{ color: 'rgba(240,237,232,0.5)' }}>
            Generate a new itinerary to see options tailored to your preferences.
          </p>
          <button
            onClick={() => navigate('/plan-trip')}
            className="flex items-center gap-2 px-8 py-3 rounded-full font-bold text-sm transition-all"
            style={{ background: '#C85F3C', color: '#fff' }}
          >
            Build Itinerary <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#0d0e1a', color: '#f0ede8', fontFamily: 'var(--font-sans, sans-serif)' }}>

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
        {/* Dark overlay so content is readable on left, transparent on right */}
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{ background: 'linear-gradient(to right, rgba(13,14,26,1) 0%, rgba(13,14,26,0.95) 40%, rgba(13,14,26,0) 65%)' }} 
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
                <div className="flex items-center gap-2 mb-1" style={{ color: 'rgba(240,237,232,0.45)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  <MapPin className="h-3 w-3" />
                  {formData?.origin} → {formData?.destination}
                </div>
                <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.8rem', fontWeight: 700, lineHeight: 1.1, color: '#f0ede8', letterSpacing: '-0.01em' }}>
                  {sortedPlans.length} Option{sortedPlans.length !== 1 ? 's' : ''} Found
                </h1>
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-8 w-[130px] rounded-full border-white/10 bg-white/5 text-xs font-medium text-white/70 focus:ring-0 focus:border-white/20 shrink-0">
                  <ArrowUpDown className="mr-1.5 h-3 w-3 text-[#C85F3C]" />
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
                <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(240,237,232,0.6)' }}>
                  {p.icon} {p.label}
                </span>
              ))}
            </div>

            {!includeActivities && (
              <div className="mt-3 flex items-start gap-2 p-3 rounded-xl" style={{ background: 'rgba(200,95,60,0.08)', border: '1px solid rgba(200,95,60,0.25)' }}>
                <Info className="h-4 w-4 text-[#C85F3C] shrink-0 mt-0.5" />
                <p style={{ fontSize: '0.75rem', color: 'rgba(240,237,232,0.7)', lineHeight: 1.5 }}>
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
                      ? `linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)`
                      : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isExpanded ? accent.border : 'rgba(255,255,255,0.07)'}`,
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
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider" style={{ background: '#C85F3C', color: '#fff' }}>
                            Top Pick
                          </span>
                        )}
                        {plan.badge && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(240,237,232,0.5)' }}>
                            {plan.badge}
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1rem', fontWeight: 700, color: '#f0ede8', lineHeight: 1.2 }}>
                        {plan.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1" style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.45)', fontWeight: 500 }}>
                        <span className="flex items-center gap-1"><TransIcon className="h-3 w-3" />{transportName}</span>
                        {durationStr && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{durationStr}</span>}
                        {plan.hotel?.stars && <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />{plan.hotel.stars}★</span>}
                      </div>
                    </div>

                    {/* Price + chevron */}
                    <div className="text-right shrink-0 flex flex-col items-end gap-2">
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(240,237,232,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</div>
                        <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.15rem', fontWeight: 700, color: '#f0ede8' }}>{formatINR(plan.price)}</div>
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
                        <div className="px-4 pb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          {/* Cost breakdown mini-grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-4 mb-4">
                            {[
                              { label: 'Transport', value: plan.breakdown?.transport || 0, icon: <TransIcon className="h-3 w-3" /> },
                              { label: 'Stay', value: plan.breakdown?.accommodation || 0, icon: <Hotel className="h-3 w-3" /> },
                              { label: includeActivities ? 'Activities' : 'Activities', value: includeActivities ? (plan.breakdown?.activities || 0) : 0, icon: <Activity className="h-3 w-3" />, dim: !includeActivities },
                              { label: 'Meals & Misc', value: (plan.breakdown?.meals || 0) + (plan.breakdown?.misc || 0), icon: <IndianRupee className="h-3 w-3" /> },
                            ].map((item, i) => (
                              <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', opacity: item.dim ? 0.4 : 1 }}>
                                <div className="flex items-center gap-1 mb-1" style={{ color: 'rgba(240,237,232,0.4)', fontSize: '0.65rem', fontWeight: 600 }}>
                                  {item.icon} {item.label}
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f0ede8' }}>{item.dim ? '—' : formatINR(item.value)}</div>
                              </div>
                            ))}
                          </div>

                          {/* Journey info */}
                          <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <div style={{ fontSize: '0.65rem', color: 'rgba(240,237,232,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                                  {isTrain ? 'Train' : 'Flight'}
                                </div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f0ede8' }}>{transportName}</div>
                                <div style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.4)', marginTop: 2 }}>
                                  {plan.flight?.outbound?.class || 'Standard'} · {plan.flight?.outbound?.departureTime || '—'} → {plan.flight?.outbound?.arrivalTime || '—'}
                                </div>
                              </div>
                              {plan.hotel && (
                                <div className="flex-1 pl-4" style={{ borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
                                  <div style={{ fontSize: '0.65rem', color: 'rgba(240,237,232,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                                    Stay
                                  </div>
                                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f0ede8' }}>{plan.hotel.name}</div>
                                  <div style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.4)', marginTop: 2 }}>
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
                                background: isSaved ? '#f0ede8' : 'rgba(255,255,255,0.06)',
                                color: isSaved ? '#1A1814' : 'rgba(240,237,232,0.6)',
                                border: '1px solid transparent',
                              }}
                            >
                              <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-current' : ''}`} />
                              {isSaved ? 'Saved' : 'Save'}
                            </button>
                            <button
                              onClick={(e) => toggleCompare(e, plan.id)}
                              className="h-8 flex-1 flex items-center justify-center gap-1.5 rounded-lg transition-all text-xs font-bold"
                              style={{
                                background: isCompared ? accent.border : 'rgba(255,255,255,0.06)',
                                color: isCompared ? '#fff' : 'rgba(240,237,232,0.6)',
                                border: '1px solid transparent',
                              }}
                            >
                              <Scale className="h-3.5 w-3.5" />
                              {isCompared ? 'Comparing' : 'Compare'}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleItinerary(plan.id); }}
                              className="h-8 flex-[1.8] flex items-center justify-center gap-1.5 rounded-lg font-black text-xs transition-all"
                              style={{ background: '#C85F3C', color: '#fff' }}
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
                <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1rem', fontWeight: 700, color: '#f0ede8', marginBottom: 12 }}>
                  Similar Destinations
                </h3>
                <div className="space-y-3">
                  {recommendations.map(rec => (
                    <div
                      key={rec.destination}
                      className="rounded-2xl p-4 cursor-pointer group transition-all"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                      onClick={() => navigate('/plan-trip', { state: { formData: { ...formData, destination: rec.destination } } })}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <h4 style={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: '#f0ede8', fontSize: '0.9rem' }}>
                          {rec.destination}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>
                          {rec.matchPercentage}% Match
                        </span>
                      </div>
                      <p style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.45)', lineHeight: 1.5, marginBottom: 8 }} className="line-clamp-2">{rec.similarBecause}</p>
                      <div className="flex justify-between items-center" style={{ fontSize: '0.68rem', color: 'rgba(240,237,232,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        <span>{rec.durationDays} Days · {formatINR(rec.totalCost)}</span>
                        <ArrowRight className="h-3.5 w-3.5 group-hover:text-[#C85F3C] transition-colors" />
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
              <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(13,14,26,0.75)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(20px)' }}>
                <div className="px-5 py-4">
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(240,237,232,0.4)', marginBottom: 4 }}>
                    Currently Viewing
                  </div>
                  <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '1rem', fontWeight: 700, color: '#f0ede8', marginBottom: 2 }}>
                    {focusedPlan.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.45)' }}>
                    {focusedRoute?.isTrain
                      ? '🚂 Train route shown on map'
                      : '✈️ Flight arc shown on map'}
                  </div>
                </div>
                <div className="px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex justify-between" style={{ fontSize: '0.7rem', color: 'rgba(240,237,232,0.4)', fontWeight: 600 }}>
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
            style={{ background: 'rgba(13,14,26,0.95)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(24px)', maxHeight: '70vh' }}
          >
            <div className="p-6 overflow-y-auto" style={{ maxHeight: '70vh' }}>
              <div className="flex justify-between items-center mb-6">
                <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.4rem', fontWeight: 700, color: '#f0ede8' }}>Compare Plans</h2>
                <button
                  onClick={() => setShowCompare(false)}
                  className="px-4 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(240,237,232,0.6)' }}
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
                    <div key={id} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${accent.border}` }}>
                      <div style={{ fontSize: '0.65rem', color: accent.badge, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{plan.tier}</div>
                      <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.2rem', fontWeight: 700, color: '#f0ede8', marginBottom: 2 }}>{plan.name}</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f0ede8', marginBottom: 16 }}>{formatINR(plan.price)}</div>
                      {[
                        ['Transport', plan.breakdown?.transport || 0],
                        ['Stay', plan.breakdown?.accommodation || 0],
                        ['Activities', plan.breakdown?.activities || 0],
                        ['Meals & Misc', (plan.breakdown?.meals || 0) + (plan.breakdown?.misc || 0)],
                      ].map(([label, val]) => (
                        <div key={label as string} className="mb-3">
                          <div className="flex justify-between mb-1" style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.5)', fontWeight: 600 }}>
                            <span>{label}</span>
                            <span style={{ color: '#f0ede8' }}>{formatINR(val as number)}</span>
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
            style={{ background: '#C85F3C', color: '#fff' }}
          >
            <Scale className="h-4 w-4" />
            Compare {compareIds.length} Plan{compareIds.length > 1 ? 's' : ''}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
