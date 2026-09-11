import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Hotel, Loader2, Plane, Train } from 'lucide-react';

interface TicketPayload {
  bookingId?: string;
  usedFallback?: boolean;
  transport?: {
    mode?: string;
    operator?: string;
    number?: string;
    class?: string;
    from?: string;
    to?: string;
    departureTime?: string;
    arrivalTime?: string;
    pnr?: string;
    status?: string;
    passengerName?: string;
    bookedVia?: string;
  };
  hotel?: {
    name?: string;
    nights?: number;
    confirmationNumber?: string;
    status?: string;
    guestName?: string;
  } | null;
}

const SAMPLE_TICKET: TicketPayload = {
  bookingId: 'TS-SAMPLE1',
  usedFallback: true,
  transport: {
    mode: 'flight',
    operator: 'IndiGo',
    number: '6E-215',
    class: 'Economy',
    from: 'Mumbai',
    to: 'Goa',
    departureTime: '07:15',
    arrivalTime: '08:35',
    pnr: 'IG8K2P',
    status: 'confirmed',
    passengerName: 'Sample Traveler',
    bookedVia: 'fallback-mock',
  },
  hotel: {
    name: 'Taj Holiday Village',
    nights: 3,
    confirmationNumber: 'HTL-GOA3921',
    status: 'confirmed',
    guestName: 'Sample Traveler',
  },
};

export default function TicketPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<TicketPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState('Your trip');

  useEffect(() => {
    const load = async () => {
      if (id === 'sample') {
        setTicket(SAMPLE_TICKET);
        setRoute('Mumbai → Goa');
        setLoading(false);
        return;
      }
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`/api/user/trips/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        const trip = data.data;
        setRoute(`${trip.source?.name || ''} → ${trip.destination?.name || ''}`);
        setTicket(trip.booking?.tickets || SAMPLE_TICKET);
      } catch {
        setTicket(SAMPLE_TICKET);
        setRoute('Sample ticket');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const t = ticket?.transport;
  const isTrain = t?.mode === 'train';
  const Icon = isTrain ? Train : Plane;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container max-w-2xl mx-auto px-4 py-10 mt-16">
        <Button variant="ghost" className="mb-6 -ml-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        <p className="text-xs tracking-[0.18em] uppercase text-emerald-400 mb-2">Boarding pass</p>
        <h1 className="font-serif text-3xl mb-1" style={{ fontFamily: 'var(--font-serif)' }}>{route}</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Booking {ticket?.bookingId || '—'}
          {ticket?.usedFallback ? ' · Demo / fallback ticket' : ''}
        </p>

        <Card className="overflow-hidden border-border shadow-lg">
          <div className="bg-[#0B3D2E] text-[#D1F2EB] p-6 flex justify-between items-start">
            <div>
              <p className="text-xs uppercase tracking-widest opacity-70">{isTrain ? 'Train' : 'Flight'}</p>
              <p className="text-2xl font-serif mt-1" style={{ fontFamily: 'var(--font-serif)' }}>{t?.operator}</p>
              <p className="text-sm opacity-80 mt-1">{t?.number} · {t?.class}</p>
            </div>
            <Icon className="h-8 w-8" />
          </div>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between">
              <div>
                <p className="text-xs text-muted-foreground">From</p>
                <p className="text-lg font-medium">{t?.from}</p>
                <p className="text-sm">{t?.departureTime}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">To</p>
                <p className="text-lg font-medium">{t?.to}</p>
                <p className="text-sm">{t?.arrivalTime}</p>
              </div>
            </div>
            <div className="flex justify-between items-end border-t pt-4">
              <div>
                <p className="text-xs text-muted-foreground">Passenger</p>
                <p className="font-medium">{t?.passengerName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">PNR</p>
                <p className="font-mono text-xl tracking-widest">{t?.pnr}</p>
                <Badge className="mt-1 bg-green-600">{t?.status || 'confirmed'}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {ticket?.hotel && (
          <Card className="mt-4 border-border">
            <CardContent className="p-6 flex gap-4">
              <Hotel className="h-6 w-6 text-primary mt-1" />
              <div className="flex-1">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Hotel voucher</p>
                <p className="font-serif text-xl" style={{ fontFamily: 'var(--font-serif)' }}>{ticket.hotel.name}</p>
                <p className="text-sm text-muted-foreground">{ticket.hotel.nights} night(s) · {ticket.hotel.guestName}</p>
                <p className="font-mono mt-2">{ticket.hotel.confirmationNumber}</p>
              </div>
              <Badge className="bg-green-600 h-fit">{ticket.hotel.status}</Badge>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
