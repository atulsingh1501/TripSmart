import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../components/Navigation';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Plane,
  Train,
  Hotel,
  MapPin,
  Clock,
  Users,
  IndianRupee,
  Download,
  ArrowLeft,
  Coffee,
  Utensils,
  Camera,
  Activity,
  Star,
  Loader2,
  Trash2,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatINR } from '../../services/api';

interface SavedTripDetail {
  _id: string;
  source: { code: string; name: string; state?: string };
  destination: { code: string; name: string; state?: string };
  startDate: string;
  endDate: string;
  nights: number;
  travelers: number;
  tripType: string;
  budget: { amount: number; flexibility: string };
  plans: Array<{
    tier: string;
    displayName?: string;
    badge?: string;
    rating?: number;
    duration?: string;
    transport: any;
    hotel: any;
    costs: {
      transport: number;
      accommodation: number;
      activities: number;
      meals: number;
      miscellaneous: number;
      total: number;
    };
    highlights: string[];
    activities?: any;
  }>;
  itinerary: Array<{
    day: number;
    title: string;
    activities: Array<{
      time?: string;
      type?: string;
      activity?: string;
      name?: string;
      title?: string;
      description?: string;
      duration?: string;
      cost?: number;
      costLabel?: string;
    }>;
  }>;
  booking: { status: string; totalAmount?: number };
  createdAt: string;
}

function getActivityIcon(type: string, isTrainTransport: boolean) {
  const TransIcon = isTrainTransport ? Train : Plane;
  switch (type) {
    case 'travel':
    case 'transport': return TransIcon;
    case 'accommodation': return Hotel;
    case 'meal': return Utensils;
    case 'leisure': return Coffee;
    case 'attraction':
    case 'activity': return Camera;
    default: return Activity;
  }
}

export default function SavedTripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { } = useAuth();
  const [trip, setTrip] = useState<SavedTripDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchTrip();
  }, [id]);

  const fetchTrip = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/user/trips/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTrip(data.data);
      } else {
        toast.error('Trip not found');
        navigate('/saved-trips');
      }
    } catch {
      toast.error('Failed to load trip');
      navigate('/saved-trips');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this trip? This cannot be undone.')) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/user/trips/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('Trip deleted');
        navigate('/saved-trips');
      } else {
        toast.error('Failed to delete trip');
      }
    } catch {
      toast.error('Failed to delete trip');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = () => {
    if (!trip) return;
    const plan = trip.plans[0];
    const lines: string[] = [];
    lines.push('TRIP ITINERARY');
    lines.push('='.repeat(60));
    lines.push(`Plan: ${plan.displayName || plan.tier}${plan.badge ? ` (${plan.badge})` : ''}`);
    lines.push(`Route: ${trip.source.name} → ${trip.destination.name}`);
    lines.push(`Dates: ${formatDate(trip.startDate)} → ${formatDate(trip.endDate)}`);
    lines.push(`Nights: ${trip.nights || 1} | Travelers: ${trip.travelers}`);
    lines.push(`Total Cost: ${formatINR(plan.costs.total)}`);
    lines.push('');
    lines.push('COST BREAKDOWN');
    lines.push('-'.repeat(40));
    lines.push(`  Transport:      ${formatINR(plan.costs.transport)}`);
    lines.push(`  Accommodation:  ${formatINR(plan.costs.accommodation)}`);
    lines.push(`  Activities:     ${formatINR(plan.costs.activities)}`);
    lines.push(`  Meals:          ${formatINR(plan.costs.meals)}`);
    lines.push(`  Miscellaneous:  ${formatINR(plan.costs.miscellaneous)}`);
    lines.push('');

    const hotel = plan.hotel;
    if (hotel?.name) {
      lines.push('ACCOMMODATION');
      lines.push('-'.repeat(40));
      lines.push(`  Hotel: ${hotel.name} (${hotel.stars || 3}★)`);
      if (hotel.location) lines.push(`  Location: ${hotel.location}`);
      if (hotel.nights) lines.push(`  Nights: ${hotel.nights}`);
      lines.push('');
    }

    const transport = plan.transport;
    const outbound = transport?.outbound;
    if (outbound) {
      lines.push('TRANSPORT');
      lines.push('-'.repeat(40));
      lines.push(`  Operator: ${outbound.airline || outbound.name || 'N/A'}`);
      lines.push(`  Departure: ${outbound.departureTime || 'N/A'}`);
      lines.push(`  Arrival: ${outbound.arrivalTime || 'N/A'}`);
      if (outbound.class) lines.push(`  Class: ${outbound.class}`);
      lines.push('');
    }

    if (trip.itinerary?.length > 0) {
      lines.push('DAY-BY-DAY ITINERARY');
      lines.push('='.repeat(60));
      trip.itinerary.forEach((day) => {
        lines.push('');
        lines.push(`Day ${day.day}: ${day.title}`);
        lines.push('-'.repeat(40));
        (day.activities || []).forEach((act) => {
          const title = act.activity || act.name || act.title || 'Activity';
          const cost = act.cost != null ? ` — ${formatINR(act.cost)}` : '';
          lines.push(`  ${act.time ? `[${act.time}] ` : ''}${title}${cost}`);
          if (act.description) lines.push(`         ${act.description}`);
        });
      });
    }

    lines.push('');
    lines.push('='.repeat(60));
    lines.push('Generated by TripSmart — Your AI Travel Planner');

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TripSmart_${trip.destination.name}_Itinerary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Itinerary downloaded!');
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex justify-center items-center py-40">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!trip) return null;

  const plan = trip.plans[0] || {};
  const costs = plan.costs || {};
  const hotel = plan.hotel || {};
  const transport = plan.transport || {};
  const outbound = transport.outbound || {};
  const isTrainTransport =
    outbound.mode === 'train' || outbound.type === 'train' ||
    transport.mode === 'train' || transport.type === 'train';
  const TransportIcon = isTrainTransport ? Train : Plane;

  const itineraryDays = trip.itinerary?.length > 0 ? trip.itinerary : [];

  const totalCost = costs.total || plan.costs?.total || 0;
  const breakdownItems = [
    { label: 'Transport', amount: costs.transport || 0, color: 'bg-blue-500' },
    { label: 'Accommodation', amount: costs.accommodation || 0, color: 'bg-green-500' },
    { label: 'Activities', amount: costs.activities || 0, color: 'bg-orange-500' },
    { label: 'Meals', amount: costs.meals || 0, color: 'bg-yellow-500' },
    { label: 'Miscellaneous', amount: costs.miscellaneous || 0, color: 'bg-purple-500' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'saved': return 'bg-blue-500';
      case 'confirmed': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Back */}
        <Button variant="ghost" className="mb-4 -ml-2" onClick={() => navigate('/saved-trips')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Saved Trips
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl font-bold">
                  {trip.source.name} → {trip.destination.name}
                </h1>
                <Badge className={getStatusColor(trip.booking?.status || 'saved')}>
                  {trip.booking?.status || 'saved'}
                </Badge>
                {plan.badge && (
                  <Badge variant="outline">{plan.badge}</Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-muted-foreground text-sm">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {trip.nights || 1} night{(trip.nights || 1) !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {trip.travelers} traveler{trip.travelers !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {plan.tier || 'Comfort'} Plan
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{formatINR(totalCost)}</div>
              <div className="text-sm text-muted-foreground">Total cost</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download Itinerary
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/40 hover:bg-destructive/10"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Trip
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Itinerary */}
          <div className="lg:col-span-2 space-y-6">
            {itineraryDays.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Day-by-Day Itinerary</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs
                    value={activeDay.toString()}
                    onValueChange={(v) => setActiveDay(parseInt(v))}
                  >
                    <TabsList
                      className="grid w-full"
                      style={{
                        gridTemplateColumns: `repeat(${Math.min(itineraryDays.length, 7)}, 1fr)`,
                      }}
                    >
                      {itineraryDays.slice(0, 7).map((day) => (
                        <TabsTrigger key={day.day} value={day.day.toString()}>
                          Day {day.day}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {itineraryDays.map((day) => (
                      <TabsContent
                        key={day.day}
                        value={day.day.toString()}
                        className="mt-6"
                      >
                        <h3 className="text-xl font-semibold mb-6">{day.title}</h3>
                        <div className="relative space-y-6">
                          <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-muted" />
                          {(day.activities || []).map((act, idx) => {
                            const title = act.activity || act.name || (act as any).title || 'Activity';
                            const Icon = getActivityIcon(act.type || '', isTrainTransport);
                            return (
                              <div key={idx} className="relative flex space-x-4">
                                <div className="flex flex-col items-center">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 border-4 border-background relative z-10">
                                    <Icon className="h-4 w-4 text-primary" />
                                  </div>
                                </div>
                                <div className="flex-1 pb-8">
                                  <div className="flex items-start justify-between mb-1">
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-semibold">{title}</p>
                                        {act.costLabel && (
                                          <Badge variant="secondary" className="text-xs">
                                            {act.costLabel}
                                          </Badge>
                                        )}
                                      </div>
                                      {act.description && (
                                        <p className="text-sm text-muted-foreground mt-0.5">
                                          {act.description}
                                        </p>
                                      )}
                                      {act.duration && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Duration: {act.duration}
                                        </p>
                                      )}
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-4">
                                      {act.time && (
                                        <p className="text-xs text-muted-foreground">{act.time}</p>
                                      )}
                                      {act.cost != null && (
                                        <p className="text-sm font-medium text-primary">
                                          {formatINR(act.cost)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  <Activity className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>Detailed itinerary not available for this trip.</p>
                  <p className="text-xs mt-1">Re-save the trip to capture the full day-by-day plan.</p>
                </CardContent>
              </Card>
            )}

            {/* Highlights */}
            {plan.highlights?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Trip Highlights</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.highlights.map((h: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Star className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Cost Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5" />
                  Cost Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {breakdownItems.map((item) => {
                  const pct = totalCost > 0 ? Math.round((item.amount / totalCost) * 100) : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{item.label}</span>
                        <span className="text-sm font-semibold">{formatINR(item.amount)}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`${item.color} h-2 rounded-full`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{pct}% of total</div>
                    </div>
                  );
                })}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatINR(totalCost)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Hotel */}
            {hotel.name && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Hotel className="h-5 w-5 text-primary" />
                    Accommodation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="font-semibold">{hotel.name}</p>
                  {hotel.stars && (
                    <div className="flex items-center gap-1 text-yellow-500">
                      {Array.from({ length: hotel.stars }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-current" />
                      ))}
                      <span className="text-muted-foreground ml-1">{hotel.stars}-star</span>
                    </div>
                  )}
                  {hotel.location && (
                    <p className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {hotel.location}
                    </p>
                  )}
                  {hotel.nights && (
                    <p className="text-muted-foreground">{hotel.nights} night{hotel.nights !== 1 ? 's' : ''}</p>
                  )}
                  {hotel.pricePerNight && (
                    <p className="font-medium text-primary">{formatINR(hotel.pricePerNight)} / night</p>
                  )}
                  {hotel.roomType && (
                    <Badge variant="secondary" className="text-xs">{hotel.roomType}</Badge>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Transport */}
            {outbound.airline || outbound.name ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TransportIcon className="h-5 w-5 text-primary" />
                    {isTrainTransport ? 'Train' : 'Flight'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="font-semibold">{outbound.airline || outbound.name}</p>
                  {outbound.flightNumber || outbound.trainNumber ? (
                    <p className="text-muted-foreground">
                      {outbound.flightNumber || outbound.trainNumber}
                    </p>
                  ) : null}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{outbound.departureTime || '—'}</span>
                    <span>→</span>
                    <span>{outbound.arrivalTime || '—'}</span>
                  </div>
                  {outbound.class && (
                    <Badge variant="secondary" className="text-xs">{outbound.class}</Badge>
                  )}
                  {outbound.stops === 0 && (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-400">Direct</Badge>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {/* Notes */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-base">Important Notes</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>• Carry valid ID proof for all travelers</p>
                <p>• Book activities 24 hours in advance</p>
                <p>• Download offline maps for the destination</p>
                <p>• Travel insurance recommended</p>
                <p>• Check health guidelines if applicable</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
