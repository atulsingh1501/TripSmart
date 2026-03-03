import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import { Plane, Train, Hotel, DollarSign, Clock, Star, ArrowRight, Check, Calendar, MapPin, ChevronDown, ChevronUp, Filter, ArrowUpDown, Zap, Shield, Coffee, Globe, IndianRupee, Users, Activity, Utensils, Info } from 'lucide-react';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { formatINR, type TripPlanData } from '../../services/api';

export default function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sortBy, setSortBy] = useState('recommended');
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [expandedPlan, setExpandedPlan] = useState<number | null>(null);
  const [compareMode, setCompareMode] = useState(false);

  // Get trip plans from navigation state or use defaults
  const {
    formData,
    tripPlans: generatedPlans,
    tripId,
    includeActivities = true,  // NEW: Whether activities are included
    algorithmPlans,
    destinationAttractions,
    arrivalInfo,  // NEW: Arrival time calculation info
    isReturnTrip = true,  // NEW: Trip type
    adjustedNights,  // NEW: Hotel nights adjusted for travel time
  } = location.state || {};

  const tripPlans: TripPlanData[] = generatedPlans || [];

  // Sort plans based on selection
  const sortedPlans = [...tripPlans].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  const handleSelectPlan = (planId: number) => {
    const selectedTripPlan = tripPlans.find(p => p.id === planId);
    setSelectedPlan(planId);
    toast.success('Trip plan selected!');
    setTimeout(() => {
      navigate(`/trip-details/${planId}`, { state: { tripPlan: selectedTripPlan, formData } });
    }, 1000);
  };

  const toggleExpand = (id: number) => {
    setExpandedPlan(expandedPlan === id ? null : id);
  };

  // If no plans available, show message
  if (!tripPlans || tripPlans.length === 0) {
    return (
      <div className="min-h-screen bg-muted/30 pb-20">
        <Navigation />
        <main className="container mx-auto mt-8 px-4">
          <div className="flex flex-col items-center justify-center py-20">
            <h1 className="text-2xl font-bold mb-4">No Trip Plans Found</h1>
            <p className="text-muted-foreground mb-6">Please start by planning your trip first.</p>
            <Button onClick={() => navigate('/plan-trip')}>
              Plan a Trip <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      <Navigation />

      <main className="container mx-auto mt-8 px-4">
        {/* Header & Filters */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Recommended Plans</h1>
            <p className="text-muted-foreground">
              AI generated plans for {formData?.origin || 'Origin'} → {formData?.destination || 'Destination'}
              {formData?.travelers && ` • ${formData.travelers} traveler${formData.travelers > 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">Recommended</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Trip Summary Card - Shows total amount prominently */}
        {tripPlans.length > 0 && (
          <Card className="mb-6 bg-gradient-to-r from-primary/5 via-cyan-500/5 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-lg">
                      {formData?.origin} → {formData?.destination}
                    </span>
                    <Badge variant="outline" className="ml-2">
                      {isReturnTrip ? 'Round Trip' : 'One-way'}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {formData?.travelers || 1} traveler{(formData?.travelers || 1) > 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {((adjustedNights ?? formData?.nights ?? 1) + 1)} day{((adjustedNights ?? formData?.nights ?? 1) + 1) !== 1 ? 's' : ''}
                    </span>
                    {arrivalInfo?.isNextDayArrival && (
                      <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                        <Clock className="h-4 w-4" />
                        Overnight travel
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Activity className="h-4 w-4" />
                      {formData?.tripType === 'tour' ? 'Tour' : 'Direct'}
                    </span>
                  </div>
                </div>
                <div className="text-right border-l pl-4 md:border-l-0 md:pl-0">
                  <p className="text-sm text-muted-foreground">Plans from</p>
                  <p className="text-2xl font-bold text-primary flex items-center justify-end gap-1">
                    <IndianRupee className="h-5 w-5" />
                    {formatINR(Math.min(...tripPlans.map(p => p.price))).replace('₹', '')}
                  </p>
                  {Math.min(...tripPlans.map(p => p.price)) !== Math.max(...tripPlans.map(p => p.price)) && (
                    <p className="text-xs text-muted-foreground">
                      to {formatINR(Math.max(...tripPlans.map(p => p.price)))}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notice when activities are not included */}
        {!includeActivities && (
          <div className="mb-6 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4 flex items-center gap-3">
            <Info className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0" />
            <div>
              <p className="font-medium text-orange-800 dark:text-orange-200">Activities not included</p>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                You chose not to include sightseeing activities. Budget focuses on transport, accommodation, and meals only.
              </p>
            </div>
          </div>
        )}

        {/* Trip Plans */}
        <div className="space-y-6">
          {sortedPlans.map((plan) => {
            const isExpanded = expandedPlan === plan.id;
            const badgeColors: Record<number, string> = {
              1: "bg-green-500",
              2: "bg-primary",
              3: "bg-purple-500",
            };
            const borderColors: Record<number, string> = {
              1: "border-green-500/30",
              2: "border-primary/30",
              3: "border-purple-500/30",
            };

            return (
              <Card key={plan.id} className={`border-2 bg-background shadow-sm ${borderColors[plan.id] || 'border-primary/30'}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-2xl">{plan.name}</CardTitle>
                        <Badge className={`${badgeColors[plan.id] || 'bg-primary'} text-white`}>{plan.badge}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{plan.rating.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{plan.duration}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{formData?.travelers || 1} person(s)</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-primary">
                        {formatINR(plan.price)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total for all</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Quick Info */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {plan.flight?.outbound && (() => {
                        // Determine if this is a train or flight
                        const isTrain = plan.transport?.mode === 'train' ||
                          plan.flight?.outbound?.mode === 'train' ||
                          plan.flight?.outbound?.type === 'train';
                        const TransportIcon = isTrain ? Train : Plane;
                        const transportName = plan.flight.outbound.name || plan.flight.outbound.airline || (isTrain ? 'Train' : 'Flight');

                        // Format duration properly
                        let durationStr = '';
                        const dur = plan.flight.outbound.duration;
                        if (typeof dur === 'object' && dur?.hours !== undefined) {
                          durationStr = dur.minutes > 0 ? `${dur.hours}h ${dur.minutes}m` : `${dur.hours}h`;
                        } else if (typeof dur === 'string') {
                          durationStr = dur;
                        }

                        return (
                          <div className="flex items-center gap-1">
                            <TransportIcon className="h-4 w-4" />
                            <span>
                              {transportName}
                              {durationStr && ` • ${durationStr}`}
                              {plan.flight.outbound.stops !== undefined && (
                                <> • {plan.flight.outbound.stops === 0 ? 'Direct' : `${plan.flight.outbound.stops} stop`}</>
                              )}
                            </span>
                          </div>
                        );
                      })()}
                      {plan.hotel?.name && (
                        <div className="flex items-center gap-1">
                          <Hotel className="h-4 w-4" />
                          <span>{plan.hotel.stars || 3}★ {(plan.hotel.name || 'Hotel').split(' ').slice(0, 2).join(' ')}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Activity className="h-4 w-4" />
                        <span>{plan.activities?.list?.length || 0} activities</span>
                      </div>
                    </div>

                    {/* Highlights */}
                    <div className="flex flex-wrap gap-2">
                      {(plan.highlights || []).slice(0, 4).map((highlight, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {highlight}
                        </Badge>
                      ))}
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="space-y-6 pt-4 border-t animate-in slide-in-from-top-2">
                        {/* Cost Breakdown */}
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <IndianRupee className="h-4 w-4" /> Cost Breakdown
                          </h4>
                          <div className={`grid gap-2 ${includeActivities ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
                            <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                              <div className="text-xs text-muted-foreground">Transport</div>
                              <div className="font-semibold">{formatINR(plan.breakdown?.transport || 0)}</div>
                            </div>
                            <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg">
                              <div className="text-xs text-muted-foreground">Stay</div>
                              <div className="font-semibold">{formatINR(plan.breakdown?.accommodation || 0)}</div>
                            </div>
                            {/* Only show Activities when included */}
                            {includeActivities && (
                              <div className="bg-orange-50 dark:bg-orange-950/30 p-3 rounded-lg">
                                <div className="text-xs text-muted-foreground">Activities</div>
                                <div className="font-semibold">{formatINR(plan.breakdown?.activities || 0)}</div>
                              </div>
                            )}
                            <div className="bg-yellow-50 dark:bg-yellow-950/30 p-3 rounded-lg">
                              <div className="text-xs text-muted-foreground">Meals</div>
                              <div className="font-semibold">{formatINR(plan.breakdown?.meals || 0)}</div>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded-lg">
                              <div className="text-xs text-muted-foreground">Misc</div>
                              <div className="font-semibold">{formatINR(plan.breakdown?.misc || 0)}</div>
                            </div>
                          </div>
                        </div>

                        {/* Flight & Hotel Details */}
                        <div className="grid gap-4 md:grid-cols-2">
                          {/* Flight Details - only show if flight data exists */}
                          {plan.flight?.outbound && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 mb-2">
                                <Plane className="h-4 w-4 text-primary" />
                                <span className="font-medium">Transport</span>
                                <span className="text-sm text-muted-foreground ml-auto">{formatINR(plan.flight?.totalPrice || 0)}</span>
                              </div>
                              <div className="bg-muted/50 p-3 rounded-lg space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Outbound</span>
                                  <span>{plan.flight.outbound.departure || 'N/A'} → {plan.flight.outbound.arrival || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Duration</span>
                                  <span>
                                    {typeof plan.flight.outbound.duration === 'object'
                                      ? `${plan.flight.outbound.duration.hours || 0}h ${plan.flight.outbound.duration.minutes || 0}m`
                                      : (plan.flight.outbound.duration || 'N/A')
                                    } • {plan.flight.outbound.stops === 0 ? 'Direct' : `${plan.flight.outbound.stops || 0} stop`}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Mode</span>
                                  <span>{plan.flight.outbound.airline || 'Transport'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Class</span>
                                  <span className="capitalize">{plan.flight.outbound.class || 'Standard'}</span>
                                </div>
                              </div>
                            </div>
                          )}
                          {/* Hotel Details - only show if hotel data exists */}
                          {plan.hotel?.name && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 mb-2">
                                <Hotel className="h-4 w-4 text-primary" />
                                <span className="font-medium">Accommodation</span>
                                <span className="text-sm text-muted-foreground ml-auto">{formatINR(plan.hotel?.totalPrice || 0)}</span>
                              </div>
                              <div className="bg-muted/50 p-3 rounded-lg space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Hotel</span>
                                  <span>{plan.hotel.name}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Rating</span>
                                  <span className="flex items-center gap-1">
                                    {Array.from({ length: plan.hotel.stars || 3 }).map((_, i) => (
                                      <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    ))}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Location</span>
                                  <span>{plan.hotel.location || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Duration</span>
                                  <span>{plan.hotel.nights || 1} nights</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Sample Activities */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Activity className="h-4 w-4 text-primary" />
                            <span className="font-medium">Sample Activities</span>
                            <span className="text-sm text-muted-foreground ml-auto">{formatINR(plan.activities?.totalPrice ?? 0)}</span>
                          </div>
                          <div className="grid gap-2 md:grid-cols-3">
                            {(plan.activities?.list ?? []).slice(0, 6).map((activity, idx) => (
                              <div key={idx} className="bg-muted/50 p-2 rounded text-sm">
                                <div className="font-medium truncate">{activity.name}</div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>{activity.duration}</span>
                                  <span>{formatINR(activity.price)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>

                <div className="px-6 pb-6 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(plan.id)}
                    className="text-sm"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="mr-2 h-4 w-4" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="mr-2 h-4 w-4" />
                        Show Details
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    className="bg-gradient-to-r from-primary to-cyan-600 hover:brightness-110"
                  >
                    Select Plan
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Budget Summary Card */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Your Budget</h3>
                <p className="text-sm text-muted-foreground">
                  You set a budget of {formatINR(formData?.budget || 25000)} per person
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate('/plan-trip', { state: { formData } })}>
                Modify Preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
