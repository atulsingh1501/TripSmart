import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../components/Navigation';
import MapBackground from '../components/MapBackground';
import {
  Plane, Train, Hotel, MapPin, Clock, Share2, Download,
  ArrowRight, ArrowLeft, Coffee, Utensils, Camera, Star, Users,
  IndianRupee, Activity, Loader2, CreditCard, ShieldAlert,
  Headphones, Phone, Bookmark,
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { formatINR, tripsAPI, type TripPlanData } from '../../services/api';
import { printItinerary } from '../../utils/itineraryExport';
import { arcPath, getCoordinates, getCoordinatesByIATA } from '../../data/cityCoordinates';
import { getRailwayCorridors } from '../../data/railwayCorridors';

// ── 4-color palette ────────────────────────────────────────────────────────
const C = {
  bg:         '#013220',
  teal:       '#0B6E4F',
  emerald:    '#50C878',
  mint:       '#D1F2EB',
  card:       'rgba(11,110,79,0.18)',
  cardBorder: 'rgba(80,200,120,0.14)',
  textMain:   '#D1F2EB',
  textSub:    'rgba(209,242,235,0.55)',
  textDim:    'rgba(209,242,235,0.35)',
};

// ── Helpers ────────────────────────────────────────────────────────────────
function isIataLike(v?: string) { return !!v && /^[A-Z]{3}$/.test(v.trim()); }
function resolveCoordinates(v?: string, fallback?: string): [number, number] | null {
  if (isIataLike(v)) { const c = getCoordinatesByIATA(v!); if (c) return c; }
  if (v) { const c = getCoordinates(v); if (c) return c; }
  if (fallback) return getCoordinates(fallback);
  return null;
}

function activityTypeIcon(type: string, TransIcon: any) {
  switch (type) {
    case 'travel': case 'transport': return TransIcon;
    case 'accommodation': return Hotel;
    case 'meal': return Utensils;
    case 'leisure': return Coffee;
    case 'attraction': return Camera;
    default: return Activity;
  }
}

function typePillStyle(type: string) {
  switch (type) {
    case 'transport':     return { bg: 'rgba(80,200,120,0.18)', color: '#50C878' };
    case 'accommodation': return { bg: 'rgba(11,110,79,0.30)',  color: '#D1F2EB' };
    case 'meal':          return { bg: 'rgba(209,242,235,0.10)',color: '#D1F2EB' };
    case 'attraction':    return { bg: 'rgba(80,200,120,0.12)', color: '#50C878' };
    case 'leisure':       return { bg: 'rgba(11,110,79,0.15)',  color: 'rgba(209,242,235,0.8)' };
    default:              return { bg: 'rgba(209,242,235,0.08)',color: 'rgba(209,242,235,0.7)' };
  }
}

// ── Animated activity card ────────────────────────────────────────────────
function ActivityCard({ activity, index, TransIcon }: { activity: any; index: number; TransIcon: any }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } }, { threshold: 0.1 });
    io.observe(el); return () => io.disconnect();
  }, []);

  const Icon  = activityTypeIcon(activity.type, TransIcon);
  const pill  = typePillStyle(activity.type);
  const hasCost = activity.cost != null && activity.cost > 0;

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, x: 36 }}
      animate={visible ? { opacity: 1, x: 0 } : { opacity: 0, x: 36 }}
      transition={{ duration: 0.42, delay: index * 0.055, ease: 'easeOut' }}
      className="relative flex gap-4"
    >
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center flex-shrink-0 w-8">
        <div className="w-8 h-8 rounded-full flex items-center justify-center z-10"
          style={{ background: C.card, border: `1.5px solid ${C.cardBorder}` }}>
          <Icon className="h-4 w-4" style={{ color: C.emerald }} />
        </div>
        <div className="flex-1 w-px mt-1" style={{ background: C.cardBorder, minHeight: 16 }} />
      </div>

      {/* Card */}
      <div className="flex-1 rounded-2xl p-4 mb-3" style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              {activity.time && (
                <span className="flex items-center gap-1" style={{ fontSize: '0.68rem', fontWeight: 600, color: C.textDim }}>
                  <Clock className="h-3 w-3" /> {activity.time}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                style={{ fontSize: '0.62rem', background: pill.bg, color: pill.color }}>
                {activity.type}
              </span>
            </div>
            <p className="font-semibold text-sm leading-snug mb-0.5" style={{ color: C.textMain }}>{activity.title}</p>
            {activity.description && (
              <p className="text-xs leading-relaxed" style={{ color: C.textSub }}>{activity.description}</p>
            )}
            {activity.duration && (
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: C.textDim }}>
                <Clock className="h-2.5 w-2.5" /> {activity.duration}
              </p>
            )}
          </div>
          {hasCost && (
            <div className="shrink-0 rounded-xl px-2.5 py-1.5 text-right" style={{ background: 'rgba(80,200,120,0.12)', minWidth: 64 }}>
              <div className="font-bold text-xs" style={{ color: C.emerald }}>{formatINR(activity.cost)}</div>
              {activity.status && <div style={{ fontSize: '0.6rem', color: 'rgba(209,242,235,0.45)', marginTop: 1 }}>{activity.status}</div>}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Transit-day animated background ──────────────────────────────────────
function TransitBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.07]">
      <svg viewBox="0 0 900 180" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <path d="M0,90 Q225,65 450,90 T900,90" stroke="#50C878" strokeWidth="3" fill="none" strokeDasharray="12 6" />
        <path d="M0,110 Q225,85 450,110 T900,110" stroke="#D1F2EB" strokeWidth="1.5" fill="none" strokeDasharray="8 12" />
      </svg>
      <motion.div className="absolute bottom-4" style={{ left: '-80px' }}
        animate={{ x: ['0vw', '120vw'] }} transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}>
        <svg viewBox="0 0 80 40" width="72" height="36" fill="none">
          <rect x="4" y="8" width="60" height="22" rx="4" fill="#0B6E4F" stroke="#50C878" strokeWidth="1.5"/>
          <rect x="10" y="12" width="12" height="9" rx="2" fill="#D1F2EB" opacity="0.5"/>
          <rect x="26" y="12" width="12" height="9" rx="2" fill="#D1F2EB" opacity="0.5"/>
          <rect x="42" y="12" width="10" height="9" rx="2" fill="#D1F2EB" opacity="0.5"/>
          <circle cx="18" cy="34" r="3.5" fill="#50C878"/>
          <circle cx="48" cy="34" r="3.5" fill="#50C878"/>
        </svg>
      </motion.div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function TripDetailsPage() {
  useParams();
  const navigate    = useNavigate();
  const location    = useLocation();
  const { isAuthenticated } = useAuth();
  const [activeDay, setActiveDay]     = useState(1);
  const [isSavingDraft, setIsSaving]  = useState(false);
  const dayRefs = useRef<(HTMLDivElement | null)[]>([]);

  const { tripPlan, formData, arrivalInfo } = location.state || {};

  // ── No-plan fallback ──
  if (!tripPlan) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: C.bg, color: C.textMain }}>
        <Navigation />
        <div className="flex-1 flex flex-col items-center justify-center p-8 mt-20 text-center">
          <h1 className="text-3xl font-serif font-bold mb-4" style={{ color: C.mint }}>Trip not found</h1>
          <p className="mb-8 max-w-md" style={{ color: C.textSub }}>Please select a trip plan from the results page first.</p>
          <button onClick={() => navigate('/plan-trip')}
            className="flex items-center gap-2 px-8 py-3 rounded-full font-bold text-sm"
            style={{ background: C.emerald, color: C.bg }}>
            Plan a Trip <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  const plan: TripPlanData = tripPlan;
  const planArrivalInfo = plan.arrivalInfo || arrivalInfo;

  const isTrainTransport =
    plan.flight?.outbound?.mode === 'train' || plan.flight?.outbound?.type === 'train' ||
    plan.transport?.mode === 'train' || plan.transport?.type === 'train';
  const TransportIcon  = isTrainTransport ? Train : Plane;
  const transportLabel = isTrainTransport ? 'Train' : 'Flight';

  const fmtDur = (dur: any): string => {
    if (!dur) return '';
    if (typeof dur === 'object' && dur.hours !== undefined)
      return dur.minutes > 0 ? `${dur.hours}h ${dur.minutes}m` : `${dur.hours}h`;
    return typeof dur === 'string' ? dur : '';
  };

  // ── Build itinerary ────────────────────────────────────────────────────
  const buildDays = () => {
    const overnightCount = plan.breakdown?.overnightCount ?? 0;
    const usableDays = plan.breakdown?.usableDays ??
      (plan.breakdown?.nightsUsed != null ? plan.breakdown.nightsUsed + 1 : null);
    const expectedDays = usableDays != null ? overnightCount + usableDays : null;
    const hotelCostPerNight = (plan.hotel?.pricePerNight ?? 0) > 0 ? plan.hotel!.pricePerNight : null;

    const normActivity = (a: any) => {
      let cost: number | null = null;
      if (a.cost != null && a.cost > 0) cost = a.cost;
      else if (a.price != null && a.price > 0) cost = a.price;
      else if (a.type === 'accommodation' && /check-?in/i.test(a.activity || a.title || a.name || '') && hotelCostPerNight)
        cost = hotelCostPerNight;
      else if (a.type === 'meal') {
        const t = (a.activity || a.name || '').toLowerCase();
        if (t.includes('breakfast')) cost = 200;
        else if (t.includes('lunch')) cost = 300;
        else if (t.includes('dinner')) cost = 500;
      }
      return {
        time: a.time || a.timeSlot || '',
        type: a.type || 'activity',
        title: a.activity || a.name || a.title || 'Activity',
        description: a.description || '',
        duration: a.duration || '',
        cost,
        status: a.costLabel || '',
      };
    };

    const normalize = (days: any[]) => days.map((day: any) => ({
      day: day.day,
      date: day.date || '',
      title: day.title || `Day ${day.day}`,
      isTransit: (day.title || '').toLowerCase().includes('transit'),
      activities: (day.activities || []).map(normActivity).filter((a: any) => a.title),
    }));

    // Use backend itinerary if length matches (NO 7-day cap)
    if (plan.itinerary && plan.itinerary.length > 0 &&
        (expectedDays === null || plan.itinerary.length === expectedDays)) {
      return normalize(plan.itinerary);
    }

    // ── Fallback generation ──────────────────────────────────────────────
    const tName    = plan.flight?.outbound?.airline || plan.flight?.outbound?.name || plan.transport?.name || transportLabel;
    const src      = formData?.origin || plan.flight?.outbound?.departure || 'Origin';
    const dst      = formData?.destination || plan.flight?.outbound?.arrival || 'Destination';
    const depTime  = plan.flight?.outbound?.departureTime || planArrivalInfo?.departureTime || '09:00';
    const arrTime  = plan.flight?.outbound?.arrivalTime  || planArrivalInfo?.arrivalTime   || '12:00';
    const dur      = fmtDur(plan.flight?.outbound?.duration) || '2h';
    const totalDays = (usableDays ?? parseInt(plan.duration?.match(/\d+/)?.[0] || '3')) + overnightCount;
    const days: any[] = [];

    for (let d = 1; d <= totalDays; d++) {
      if (d <= overnightCount) {
        days.push({ day: d, date: '', title: `Day ${d} — In Transit`, isTransit: true, activities: [
          { time: d === 1 ? depTime : 'All day', type: 'transport', title: `${tName}: ${src} → ${dst}`, description: `Duration: ${dur} • Overnight journey`, duration: dur, cost: d === 1 ? (plan.breakdown?.transport || null) : null, status: '' },
          { time: 'Night', type: 'travel', title: 'In transit (no hotel stay)', description: `Sleeping on ${transportLabel.toLowerCase()}`, duration: '', cost: null, status: '' },
        ]});
        continue;
      }
      const di = d - overnightCount;
      const isFirst = di === 1;
      const isLast  = di === (usableDays ?? totalDays - overnightCount);
      const checkin = plan.hotel ? [{ time: '14:00', type: 'accommodation', title: 'Hotel Check-in', description: plan.hotel.name || '', duration: '', cost: hotelCostPerNight, status: hotelCostPerNight ? 'Per Night' : '' }] : [];
      const checkout = plan.hotel ? [{ time: '10:00', type: 'accommodation', title: 'Hotel Check-out', description: '', duration: '', cost: null, status: '' }] : [];

      if (isFirst && isLast) {
        days.push({ day: d, date: '', title: overnightCount > 0 ? 'Arrival & Departure' : 'Arrival Day', isTransit: false, activities: [
          ...(overnightCount === 0 ? [{ time: depTime, type: 'transport', title: `${tName}: ${src} → ${dst}`, description: `Duration: ${dur}`, duration: dur, cost: plan.breakdown?.transport ?? null, status: '' }] : []),
          ...(overnightCount > 0  ? [{ time: arrTime, type: 'travel', title: `Arrive at ${dst}`, description: '', duration: '', cost: null, status: '' }] : []),
          ...checkin, ...checkout,
        ]});
      } else if (isFirst) {
        days.push({ day: d, date: '', title: 'Arrival Day', isTransit: false, activities: [
          ...(overnightCount === 0 ? [{ time: depTime, type: 'transport', title: `${tName}: ${src} → ${dst}`, description: `Duration: ${dur}`, duration: dur, cost: plan.breakdown?.transport ?? null, status: '' }] : [{ time: arrTime, type: 'travel', title: `Arrive at ${dst}`, description: '', duration: '', cost: null, status: '' }]),
          ...checkin,
          { time: '17:00', type: 'leisure',   title: 'Explore nearby area', description: '', duration: '', cost: null, status: '' },
          { time: '19:30', type: 'meal',       title: 'Dinner',              description: '', duration: '', cost: 500, status: '' },
        ]});
      } else if (isLast) {
        days.push({ day: d, date: '', title: 'Departure Day', isTransit: false, activities: [
          { time: '08:00', type: 'meal',       title: 'Breakfast',                        description: '', duration: '', cost: 200,  status: '' },
          ...checkout,
          { time: '11:00', type: 'leisure',    title: 'Last-minute sightseeing',           description: '', duration: '', cost: null, status: '' },
          { time: '18:00', type: 'transport',  title: `${tName}: ${dst} → ${src}`,         description: 'Return journey', duration: dur, cost: null, status: '' },
        ]});
      } else {
        days.push({ day: d, date: '', title: `Day ${d} — Explore ${dst}`, isTransit: false, activities: [
          { time: '08:30', type: 'meal',       title: 'Breakfast',            description: '',                          duration: '',        cost: 200,  status: '' },
          { time: '10:00', type: 'attraction', title: 'Explore local attractions', description: `Visit popular sites in ${dst}`, duration: '3 hours', cost: null, status: '' },
          { time: '13:00', type: 'meal',       title: 'Lunch',                description: '',                          duration: '',        cost: 300,  status: '' },
          { time: '15:00', type: 'leisure',    title: 'Free time',            description: 'Shopping or relaxation',    duration: '2 hours', cost: null, status: '' },
          { time: '19:00', type: 'meal',       title: 'Dinner',               description: '',                          duration: '',        cost: 500,  status: '' },
        ]});
      }
    }
    return days;
  };

  const itineraryDays = buildDays();

  // ── Map route ─────────────────────────────────────────────────────────
  const outboundAny: any = plan.flight?.outbound || {};
  const originCoords      = resolveCoordinates(outboundAny.departure, formData?.origin);
  const destinationCoords = resolveCoordinates(outboundAny.arrival,   formData?.destination);
  let trainPaths:  [number, number][][] = [];
  let flightPaths: [number, number][][] = [];
  if (isTrainTransport) {
    const corridors = getRailwayCorridors(formData?.origin || '', formData?.destination || '');
    if (corridors && corridors.length > 0) trainPaths = corridors;
    else if (Array.isArray(outboundAny.routePath) && outboundAny.routePath.length > 1) trainPaths = [outboundAny.routePath];
    else if (originCoords && destinationCoords) trainPaths = [[originCoords, destinationCoords]];
  } else if (originCoords && destinationCoords) {
    flightPaths = [arcPath(originCoords, destinationCoords)];
  }

  const topActivities = (plan.activities?.list || []).slice(0, 4);
  const breakdown = [
    { label: 'Transport',     val: plan.breakdown.transport },
    { label: 'Accommodation', val: plan.breakdown.accommodation },
    { label: 'Activities',    val: plan.breakdown.activities },
    { label: 'Meals',         val: plan.breakdown.meals },
    { label: 'Misc',          val: plan.breakdown.misc },
  ].filter(x => x.val > 0)
   .map(x => ({ ...x, pct: plan.price > 0 ? Math.round((x.val / plan.price) * 100) : 0 }));

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleShare = () => toast.success('Trip link copied to clipboard!');

  const handleDownload = () => {
    printItinerary({
      title: `${plan.name} (${plan.badge})`,
      origin: formData?.origin || 'Origin',
      destination: formData?.destination || 'Destination',
      dates: `${formData?.departureDate || ''} – ${formData?.returnDate || ''}`,
      duration: plan.duration,
      travelers: formData?.travelers || 1,
      totalCost: formatINR(plan.price),
      breakdown: [
        { label: 'Transport',      amount: formatINR(plan.breakdown.transport) },
        { label: 'Accommodation',  amount: formatINR(plan.breakdown.accommodation) },
        { label: 'Activities',     amount: formatINR(plan.breakdown.activities) },
        { label: 'Meals',          amount: formatINR(plan.breakdown.meals) },
        { label: 'Miscellaneous',  amount: formatINR(plan.breakdown.misc) },
      ],
      hotel: plan.hotel,
      transport: { mode: transportLabel, operator: outboundAny.airline || outboundAny.name, departure: outboundAny.departureTime, arrival: outboundAny.arrivalTime, class: outboundAny.class },
      days: itineraryDays.map(d => ({ day: d.day, title: d.title, date: d.date, activities: d.activities.map((a: any) => ({ time: a.time, title: a.title, description: a.description, cost: a.cost != null ? formatINR(a.cost) : '' })) })),
    });
    toast.success('Opening printable itinerary — save as PDF from the print dialog');
  };

  const handleSaveTrip = async () => {
    if (!isAuthenticated) { toast.error('Please login to save this trip'); navigate('/login', { state: { from: location.pathname, tripPlan: plan, formData } }); return; }
    setIsSaving(true);
    try { await tripsAPI.saveTrip({ plan, formData }); toast.success('Trip saved to your account!'); }
    catch (err: any) { toast.error(err.message || 'Failed to save trip. Please try again.'); }
    finally { setIsSaving(false); }
  };

  const handleBookNow = () => {
    if (!isAuthenticated) { toast.error('Please login to book this trip'); navigate('/login', { state: { from: location.pathname, tripPlan: plan, formData } }); return; }
    navigate('/booking-confirmation', { state: { tripPlan: plan, formData } });
  };

  const scrollToDay = (dayNum: number) => {
    setActiveDay(dayNum);
    dayRefs.current[dayNum - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
      className="relative min-h-screen" style={{ background: C.bg, color: C.textMain }}>

      {/* Map background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <MapBackground origin={formData?.origin} destination={formData?.destination} stops={formData?.stops || []} showDirectDistance flightPaths={flightPaths} trainPaths={trainPaths} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #013220 0%, rgba(1,50,32,0.97) 32%, rgba(11,110,79,0.55) 58%, rgba(80,200,120,0.05) 76%, transparent 90%)' }} />
      </div>

      {/* Nav */}
      <div className="fixed top-0 inset-x-0 z-30"><Navigation /></div>

      {/* 2-column layout */}
      <div className="relative z-10 flex min-h-screen pt-16">

        {/* ─── LEFT: scrollable day journey ─────────────────────────── */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 64px)', scrollbarWidth: 'thin', scrollbarColor: `${C.teal} transparent` }}>

          {/* Header hero */}
          <motion.div initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: 'easeOut' }} className="px-6 pt-8 pb-4">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-5 text-sm font-medium" style={{ color: C.textSub }}>
              <ArrowLeft className="h-4 w-4" /> Back to Results
            </button>

            <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
              <div>
                <div className="flex items-center gap-1.5 mb-1" style={{ color: C.textDim, fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  <MapPin className="h-3 w-3" /> {formData?.origin} → {formData?.destination}
                </div>
                <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.9rem', fontWeight: 700, color: C.mint, lineHeight: 1.1 }}>
                  {plan.name}
                </h1>
                <div className="flex flex-wrap gap-3 mt-2" style={{ fontSize: '0.73rem', color: C.textSub }}>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {formData?.travelers || 1} Traveller{(formData?.travelers || 1) > 1 ? 's' : ''}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {plan.duration}</span>
                  <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> {plan.rating?.toFixed(1) || '4.5'}</span>
                </div>
              </div>
              <div className="text-right">
                <div style={{ fontSize: '0.62rem', color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total</div>
                <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.75rem', fontWeight: 800, color: C.mint }}>{formatINR(plan.price)}</div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2 mb-5">
              {[
                { icon: <Share2 className="h-3.5 w-3.5" />,   label: 'Share',      fn: handleShare },
                { icon: <Download className="h-3.5 w-3.5" />, label: 'Export PDF', fn: handleDownload },
              ].map(a => (
                <button key={a.label} onClick={a.fn} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{ background: C.card, border: `1px solid ${C.cardBorder}`, color: C.textSub }}>
                  {a.icon} {a.label}
                </button>
              ))}
            </div>

            {/* Day selector pills — all days, no cap */}
            <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {itineraryDays.map(d => (
                <button key={d.day} onClick={() => scrollToDay(d.day)}
                  className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                  style={{
                    background: activeDay === d.day ? C.emerald : C.card,
                    color:      activeDay === d.day ? C.bg : C.textSub,
                    border:     `1px solid ${activeDay === d.day ? C.emerald : C.cardBorder}`,
                  }}>
                  Day {d.day}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Day sections */}
          <div className="px-6 pb-28 space-y-4">
            {itineraryDays.map((day, idx) => (
              <div key={day.day} ref={el => { dayRefs.current[idx] = el; }}
                className="relative rounded-3xl overflow-hidden"
                style={{ border: `1px solid ${C.cardBorder}` }}
              >
                <div className="relative" style={{ background: 'rgba(1,50,32,0.7)' }}>
                  {day.isTransit && <TransitBackground />}

                  {/* Day header */}
                  <div className="relative px-6 pt-6 pb-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center font-black"
                      style={{ background: C.emerald, color: C.bg, fontFamily: '"Playfair Display", serif', fontSize: '0.85rem' }}>
                      {day.day}
                    </div>
                    <div className="flex-1">
                      <h2 style={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, fontSize: '1.05rem', color: C.mint }}>
                        {day.title}
                      </h2>
                      {day.date && <p style={{ fontSize: '0.7rem', color: C.textDim }}>{day.date}</p>}
                    </div>
                    {day.isTransit && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(80,200,120,0.14)', color: C.emerald }}>
                        Transit
                      </span>
                    )}
                  </div>

                  {/* Activities */}
                  <div className="relative px-6 pb-5">
                    {day.activities.map((activity: any, aIdx: number) => (
                      <ActivityCard key={`${day.day}-${aIdx}`} activity={activity} index={aIdx} TransIcon={TransportIcon} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── RIGHT: fixed sidebar ──────────────────────────────────── */}
        <div className="hidden md:flex flex-col w-[300px] shrink-0 overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 64px)', borderLeft: `1px solid ${C.cardBorder}`, scrollbarWidth: 'thin', scrollbarColor: `${C.teal} transparent` }}>
          <div className="p-5 space-y-4">

            {/* Book CTA */}
            <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}>
              <div style={{ fontSize: '0.62rem', color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Total Cost</div>
              <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.9rem', fontWeight: 800, color: C.mint, marginBottom: 14 }}>{formatINR(plan.price)}</div>
              <button onClick={handleBookNow} className="w-full py-3 rounded-xl font-black text-sm mb-2 flex items-center justify-center gap-2"
                style={{ background: C.emerald, color: C.bg }}>
                <CreditCard className="h-4 w-4" /> Book This Trip
              </button>
              <button onClick={handleSaveTrip} disabled={isSavingDraft}
                className="w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                style={{ background: 'rgba(11,110,79,0.20)', color: C.textSub, border: `1px solid ${C.cardBorder}` }}>
                {isSavingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className="h-4 w-4" />}
                {isSavingDraft ? 'Saving…' : 'Save Trip'}
              </button>
            </div>

            {/* Price breakdown */}
            <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}>
              <div className="flex items-center gap-2 mb-4" style={{ color: C.mint, fontWeight: 700, fontSize: '0.85rem' }}>
                <IndianRupee className="h-4 w-4" /> Price Breakdown
              </div>
              {breakdown.map(item => (
                <div key={item.label} className="mb-3">
                  <div className="flex justify-between mb-1" style={{ fontSize: '0.73rem', color: C.textSub, fontWeight: 600 }}>
                    <span>{item.label}</span>
                    <span style={{ color: C.mint }}>{formatINR(item.val)}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(80,200,120,0.08)' }}>
                    <div className="h-full rounded-full" style={{ width: `${item.pct}%`, background: `linear-gradient(to right, ${C.teal}, ${C.emerald})` }} />
                  </div>
                  <div style={{ fontSize: '0.62rem', color: C.textDim, marginTop: 2 }}>{item.pct}%</div>
                </div>
              ))}
            </div>

            {/* Transport */}
            <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}>
              <div className="flex items-center gap-2 mb-3" style={{ color: C.mint, fontWeight: 700, fontSize: '0.85rem' }}>
                <TransportIcon className="h-4 w-4" /> {transportLabel} Details
              </div>
              <p className="font-semibold text-sm mb-1" style={{ color: C.mint }}>
                {outboundAny.airline || outboundAny.name || `${transportLabel} service`}
              </p>
              <p style={{ fontSize: '0.73rem', color: C.textSub }}>
                {outboundAny.departure || formData?.origin}{outboundAny.departureTime ? ` at ${outboundAny.departureTime}` : ''} → {outboundAny.arrival || formData?.destination}{outboundAny.arrivalTime ? ` at ${outboundAny.arrivalTime}` : ''}
              </p>
              <p style={{ fontSize: '0.7rem', color: C.textDim, marginTop: 4 }}>
                {outboundAny.class || 'Standard'}
                {outboundAny.stops === 0 ? ' · Direct' : ''}
                {outboundAny.duration ? ` · ${fmtDur(outboundAny.duration)}` : ''}
              </p>
              <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                <div style={{ fontSize: '0.68rem', color: C.textDim, marginBottom: 2 }}>Transport cost</div>
                <div style={{ fontWeight: 700, color: C.emerald }}>{formatINR(plan.breakdown.transport || 0)}</div>
              </div>
            </div>

            {/* Hotel */}
            {plan.hotel && (
              <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}>
                <div className="flex items-center gap-2 mb-3" style={{ color: C.mint, fontWeight: 700, fontSize: '0.85rem' }}>
                  <Hotel className="h-4 w-4" /> Stay
                </div>
                <p className="font-semibold text-sm" style={{ color: C.mint }}>{plan.hotel.name || 'Selected Hotel'}</p>
                <p style={{ fontSize: '0.73rem', color: C.textSub, marginTop: 2 }}>
                  {'★'.repeat(plan.hotel.stars || 3)} · {plan.hotel.location || formData?.destination}
                </p>
                {(plan.hotel.pricePerNight ?? 0) > 0 && (
                  <p style={{ fontSize: '0.7rem', color: C.textDim, marginTop: 4 }}>
                    {formatINR(plan.hotel.pricePerNight!)}/night · {plan.hotel.nights || 1} night{(plan.hotel.nights || 1) > 1 ? 's' : ''}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-2" style={{ fontSize: '0.7rem', color: C.textDim }}>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {(plan.hotel.rating || 4.2).toFixed(1)} · {(plan.hotel.reviews || 100).toLocaleString('en-IN')} reviews
                </div>
              </div>
            )}

            {/* Activities */}
            {topActivities.length > 0 && (
              <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}>
                <div className="flex items-center gap-2 mb-3" style={{ color: C.mint, fontWeight: 700, fontSize: '0.85rem' }}>
                  <Activity className="h-4 w-4" /> Top Activities
                </div>
                <div className="space-y-2">
                  {topActivities.map(a => (
                    <div key={a.id} className="rounded-xl p-3" style={{ background: 'rgba(11,110,79,0.15)' }}>
                      <p style={{ fontWeight: 600, fontSize: '0.78rem', color: C.mint }}>{a.name}</p>
                      <p style={{ fontSize: '0.68rem', color: C.textDim, marginTop: 2 }}>
                        {a.duration} · {a.price > 0 ? formatINR(a.price) : 'Free'} · ★{(a.rating || 4.2).toFixed(1)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Support */}
            <div className="rounded-2xl p-5" style={{ background: 'rgba(80,200,120,0.05)', border: '1px solid rgba(80,200,120,0.14)' }}>
              <div className="flex items-center gap-2 mb-3" style={{ color: C.mint, fontWeight: 700, fontSize: '0.85rem' }}>
                <ShieldAlert className="h-4 w-4" /> Support
              </div>
              <div className="space-y-2" style={{ fontSize: '0.73rem', color: C.textSub }}>
                <p className="flex items-center gap-2"><Headphones className="h-3.5 w-3.5 shrink-0" style={{ color: C.emerald }} /> 24x7 TripSmart: +91 1800-11-TRIP</p>
                <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0" style={{ color: C.emerald }} /> Emergency: 112</p>
                <p style={{ color: C.textDim, fontSize: '0.68rem', lineHeight: 1.5 }}>Keep digital copies of IDs. Share location with co-travellers during intercity travel.</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Mobile bottom CTA */}
      <div className="fixed bottom-0 inset-x-0 md:hidden z-40 p-4" style={{ background: 'linear-gradient(to top, #013220 65%, transparent)' }}>
        <button onClick={handleBookNow} className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2"
          style={{ background: C.emerald, color: C.bg }}>
          <CreditCard className="h-4 w-4" /> Book · {formatINR(plan.price)}
        </button>
      </div>
    </motion.div>
  );
}
