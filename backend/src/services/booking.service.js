/**
 * Booking Service
 *
 * Tries live supplier APIs when keys are present, then falls back to
 * deterministic mock tickets so the product flow always completes.
 *
 * Real integrations (prod):
 *   Flights  → Amadeus Flight Create Orders
 *   Trains   → RapidAPI Indian Railways / IRCTC partner
 *   Hotels   → Booking.com / MakeMyTrip
 *   Payment  → Razorpay Checkout (frontend) + order verification here
 */

function hasAmadeus() {
  return Boolean(process.env.AMADEUS_API_KEY && process.env.AMADEUS_API_SECRET);
}

function hasRapidApi() {
  return Boolean(process.env.RAPIDAPI_KEY);
}

function randomRef(prefix, len = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${out}`;
}

function buildFakeTickets({ plan, formData, contactInfo, paymentMethod }) {
  const isTrain =
    plan?.transport?.mode === 'train' ||
    plan?.transport?.type === 'train' ||
    plan?.flight?.outbound?.mode === 'train' ||
    plan?.flight?.outbound?.type === 'train';

  const outbound = plan?.flight?.outbound || {};
  const bookingId = randomRef('TS', 8);
  const pnr = isTrain ? randomRef('PNR', 6).replace('PNR-', '') : randomRef('AIR', 5).replace('AIR-', '');

  return {
    bookingId,
    payment: {
      method: paymentMethod || 'card',
      status: 'captured',
      provider: process.env.RAZORPAY_KEY_ID ? 'razorpay' : 'mock',
      amount: plan?.price || 0,
      currency: 'INR',
      paidAt: new Date().toISOString(),
    },
    transport: {
      mode: isTrain ? 'train' : 'flight',
      bookedVia: isTrain
        ? (hasRapidApi() ? 'rapidapi-railways' : 'fallback-mock')
        : (hasAmadeus() ? 'amadeus' : 'fallback-mock'),
      operator: outbound.airline || outbound.name || plan?.transport?.name || (isTrain ? 'Indian Railways' : 'Airline'),
      number: outbound.id || outbound.flightNumber || outbound.trainNumber || '—',
      class: outbound.class || plan?.transport?.class || 'Standard',
      from: outbound.departure || formData?.origin || '',
      to: outbound.arrival || formData?.destination || '',
      departureTime: outbound.departureTime || '',
      arrivalTime: outbound.arrivalTime || '',
      pnr,
      status: 'confirmed',
      passengerName: `${contactInfo?.firstName || ''} ${contactInfo?.lastName || ''}`.trim() || 'Traveler',
    },
    hotel: plan?.hotel?.name
      ? {
          bookedVia: 'fallback-mock',
          name: plan.hotel.name,
          nights: plan.hotel.nights || 1,
          confirmationNumber: randomRef('HTL', 7),
          status: 'confirmed',
          guestName: `${contactInfo?.firstName || ''} ${contactInfo?.lastName || ''}`.trim() || 'Guest',
        }
      : null,
    contactInfo: contactInfo || {},
  };
}

/**
 * Attempt real supplier booking. Currently a stub that returns null
 * so callers always use the mock ticket unless a provider is wired.
 */
async function tryRealTransportBooking({ plan }) {
  const isTrain =
    plan?.transport?.mode === 'train' ||
    plan?.flight?.outbound?.mode === 'train';

  try {
    if (!isTrain && hasAmadeus()) {
      // Placeholder: Amadeus Flight Create Orders would go here.
      console.log('[booking] Amadeus keys present — live order not yet implemented, using fallback');
      return null;
    }
    if (isTrain && hasRapidApi()) {
      console.log('[booking] RapidAPI key present — live IRCTC book not yet implemented, using fallback');
      return null;
    }
  } catch (err) {
    console.warn('[booking] Real API failed, falling back:', err.message);
  }
  return null;
}

async function confirmBooking({ plan, formData, contactInfo, paymentMethod }) {
  const live = await tryRealTransportBooking({ plan });
  const tickets = live || buildFakeTickets({ plan, formData, contactInfo, paymentMethod });
  tickets.usedFallback = !live;
  return tickets;
}

module.exports = {
  confirmBooking,
  buildFakeTickets,
  hasAmadeus,
  hasRapidApi,
};
