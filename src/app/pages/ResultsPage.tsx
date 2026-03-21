import { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plane, Train, Hotel, Clock, Star, ArrowRight, Calendar, MapPin, ArrowUpDown, IndianRupee, Users, Activity, Info, Bookmark, Scale, Eye, Headphones, ShieldAlert } from 'lucide-react';
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
  const [focusedPlanId, setFocusedPlanId] = useState<number | null>(null);
  const [shortlistedPlanIds, setShortlistedPlanIds] = useState<number[]>([]);
  const [comparePlanIds, setComparePlanIds] = useState<number[]>([]);
  const [rightPanelMode, setRightPanelMode] = useState<'details' | 'compare' | null>(null);

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

  const handleGenerateItinerary = (planId: number) => {
    const selectedTripPlan = tripPlans.find(p => p.id === planId);
    if (!selectedTripPlan) return;
    toast.success('Opening itinerary workspace...');
    setTimeout(() => {
      navigate(`/trip-details/${planId}`, {
        state: {
          tripPlan: selectedTripPlan,
          formData,
          arrivalInfo,
          adjustedNights,
          isReturnTrip,
        },
      });
    }, 350);
  };

  const toggleShortlist = (planId: number) => {
    setShortlistedPlanIds((current) => {
      if (current.includes(planId)) {
        toast.info('Removed from saved plans');
        return current.filter((id) => id !== planId);
      }
      toast.success('Plan saved for later');
      return [...current, planId];
    });
  };

  const toggleCompare = (planId: number) => {
    setComparePlanIds((current) => {
      if (current.includes(planId)) {
        const next = current.filter((id) => id !== planId);
        if (next.length === 0 && rightPanelMode === 'compare') {
          setRightPanelMode(null);
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

  const focusedPlan = useMemo(() => {
    if (focusedPlanId == null) return null;
    return sortedPlans.find((plan) => plan.id === focusedPlanId) ?? null;
  }, [focusedPlanId, sortedPlans]);

  const mapPlan = focusedPlan ?? sortedPlans[0] ?? null;
  const comparePlans = sortedPlans.filter((p) => comparePlanIds.includes(p.id));
  const focusedRoute = mapPlan ? getPlanRoutePreview(mapPlan, formData) : null;

  // If no plans available, show message
  if (!tripPlans || tripPlans.length === 0) {
    return (
      <div className="min-h-screen bg-muted/30 pb-20">
        <Navigation />
        <main className="container mx-auto mt-8 px-4">
          <div className="flex flex-col items-center justify-center py-20">
            <h1 className="text-2xl font-bold mb-4">No Trip Plans Found</h1>
            <p className="text-muted-foreground mb-6">Generate a new itinerary to see recommendations.</p>
            <Button onClick={() => navigate('/plan-trip')}>
              Build Itinerary <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {focusedRoute && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <MapBackground
            origin={formData?.origin}
            destination={formData?.destination}
            stops={formData?.stops || []}
            showDirectDistance
            flightPaths={focusedRoute.flightPaths}
            trainPaths={focusedRoute.trainPaths}
          />
        </div>
      )}
      <div className="fixed inset-0 z-10 bg-background/75 pointer-events-none" />

      <div className="fixed top-0 left-0 right-0 z-30">
        <Navigation />
      </div>

      <main className="relative z-20 container mx-auto mt-20 px-4 pb-20">
        {/* Header & Filters */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your Trip Options Are Ready</h1>
            <p className="text-muted-foreground">
              Compare, save, and deep-dive into routes for {formData?.origin || 'Origin'} → {formData?.destination || 'Destination'}
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
                <SelectItem value="recommended">Best Match</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Trip Summary */}
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
                  <p className="text-sm text-muted-foreground">Starting at</p>
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

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            {sortedPlans.map((plan) => {
            const isShortlisted = shortlistedPlanIds.includes(plan.id);
            const isCompared = comparePlanIds.includes(plan.id);
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
              <Card key={plan.id} className={`border-2 bg-background/92 backdrop-blur-md shadow-sm ${borderColors[plan.id] || 'border-primary/30'}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
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
                      <div className="text-2xl font-bold text-primary">
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
                  </div>
                </CardContent>

                <div className="px-6 pb-6 grid gap-2 md:grid-cols-4">
                  <Button variant={isShortlisted ? 'default' : 'outline'} size="sm" onClick={() => toggleShortlist(plan.id)}>
                    <Bookmark className="mr-2 h-4 w-4" />
                    {isShortlisted ? 'Saved' : 'Save'}
                  </Button>
                  <Button variant={isCompared ? 'default' : 'outline'} size="sm" onClick={() => toggleCompare(plan.id)}>
                    <Scale className="mr-2 h-4 w-4" />
                    {isCompared ? 'Comparing' : 'Compare'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setFocusedPlanId(plan.id); setRightPanelMode('details'); }}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                  <Button onClick={() => handleGenerateItinerary(plan.id)} className="bg-gradient-to-r from-primary to-cyan-600 hover:brightness-110" size="sm">
                    Generate Itinerary
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
            })}
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-24">
              {rightPanelMode === 'details' && focusedPlan && (
                <Card className="bg-background/92 backdrop-blur-md">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{focusedPlan.name} Details</CardTitle>
                      <Badge variant="outline">{focusedPlan.badge}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Click Compare to switch this panel to comparison view.</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className={`grid gap-2 ${includeActivities ? 'grid-cols-5' : 'grid-cols-4'}`}>
                      <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded-lg"><div className="text-[10px] text-muted-foreground">Transport</div><div className="font-semibold text-xs">{formatINR(focusedPlan.breakdown?.transport || 0)}</div></div>
                      <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded-lg"><div className="text-[10px] text-muted-foreground">Stay</div><div className="font-semibold text-xs">{formatINR(focusedPlan.breakdown?.accommodation || 0)}</div></div>
                      {includeActivities && <div className="bg-orange-50 dark:bg-orange-950/30 p-2 rounded-lg"><div className="text-[10px] text-muted-foreground">Activities</div><div className="font-semibold text-xs">{formatINR(focusedPlan.breakdown?.activities || 0)}</div></div>}
                      <div className="bg-yellow-50 dark:bg-yellow-950/30 p-2 rounded-lg"><div className="text-[10px] text-muted-foreground">Meals</div><div className="font-semibold text-xs">{formatINR(focusedPlan.breakdown?.meals || 0)}</div></div>
                      <div className="bg-purple-50 dark:bg-purple-950/30 p-2 rounded-lg"><div className="text-[10px] text-muted-foreground">Misc</div><div className="font-semibold text-xs">{formatINR(focusedPlan.breakdown?.misc || 0)}</div></div>
                    </div>
                    <Separator />
                    <div className="space-y-2 text-sm">
                      <p className="font-medium">Detailed Transport Information</p>
                      <p className="text-muted-foreground">{focusedPlan.flight?.outbound?.airline || focusedPlan.flight?.outbound?.name || 'Transport'} • {focusedPlan.flight?.outbound?.class || 'Standard'}</p>
                      <p className="text-muted-foreground">{focusedPlan.flight?.outbound?.departure || formData?.origin} ({focusedPlan.flight?.outbound?.departureTime || 'TBD'}) → {focusedPlan.flight?.outbound?.arrival || formData?.destination} ({focusedPlan.flight?.outbound?.arrivalTime || 'TBD'})</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {rightPanelMode === 'compare' && (
                <Card className="bg-background/92 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="text-base">Comparison</CardTitle>
                    <p className="text-xs text-muted-foreground">Click View Details on any plan to replace this with detail view.</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {comparePlans.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Select plans using Compare to see comparison here.</p>
                    ) : (
                      comparePlans.map((plan) => (
                        <div key={plan.id} className="rounded-lg border p-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{plan.name}</p>
                            <Badge variant="outline">{plan.badge}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{formatINR(plan.price)} • {plan.rating.toFixed(1)} rating</p>
                          <p className="text-xs text-muted-foreground">Transport {formatINR(plan.breakdown.transport)} • Stay {formatINR(plan.breakdown.accommodation)}</p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>



        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Booking Confirmation Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>You will receive instant confirmation with booking ID, payment receipt, and downloadable itinerary after finalizing any plan.</p>
              <p>Cancellation: free up to 24 hours before departure in most cases.</p>
            </CardContent>
          </Card>
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                Emergency Contact And Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">TripSmart Support: +91 1800-11-TRIP</p>
              <p className="text-muted-foreground">Medical Emergency: +91 108</p>
              <p className="text-muted-foreground">National Helpline: +91 112</p>
            </CardContent>
          </Card>
        </div>

        {/* Budget Summary Card */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Your Budget</h3>
                <p className="text-sm text-muted-foreground">
                  Budget target set to {formatINR(formData?.budget || 25000)} per person
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate('/plan-trip', { state: { formData } })}>
                Edit Trip Inputs
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
