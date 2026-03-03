import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
  DollarSign,
  Share2,
  Download,
  Edit,
  ArrowRight,
  ArrowLeft,
  Coffee,
  Utensils,
  Camera,
  Star,
  Users,
  IndianRupee,
  Activity,
  Loader2,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatINR, tripsAPI, type TripPlanData } from '../../services/api';

export default function TripDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [activeDay, setActiveDay] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Get trip plan from navigation state
  const { tripPlan, formData } = location.state || {};

  // If no trip plan data, redirect back
  if (!tripPlan) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Trip not found</h1>
          <p className="text-muted-foreground mb-6">Please select a trip plan first.</p>
          <Button onClick={() => navigate('/plan-trip')}>Plan a Trip</Button>
        </div>
      </div>
    );
  }

  const plan: TripPlanData = tripPlan;

  // Determine if transport is train or flight - check multiple sources
  const isTrainTransport =
    plan.flight?.outbound?.mode === 'train' ||
    plan.flight?.outbound?.type === 'train' ||
    plan.transport?.mode === 'train' ||
    plan.transport?.type === 'train';
  const TransportIcon = isTrainTransport ? Train : Plane;
  const transportLabel = isTrainTransport ? 'Train' : 'Flight';

  // Helper to format transport duration
  const formatDuration = (dur: any): string => {
    if (!dur) return '';
    if (typeof dur === 'object' && dur.hours !== undefined) {
      return dur.minutes > 0 ? `${dur.hours}h ${dur.minutes}m` : `${dur.hours}h`;
    }
    return typeof dur === 'string' ? dur : '';
  };

  // Build itinerary display from plan data - use backend activities directly
  // With fallback for empty/missing itinerary
  const buildItineraryDays = () => {
    if (plan.itinerary && plan.itinerary.length > 0) {
      return plan.itinerary.map((day: any) => ({
        day: day.day,
        date: day.date || '',
        title: day.title || `Day ${day.day}`,
        activities: (day.activities || []).map((activity: any) => ({
          time: activity.time || '',
          type: activity.type || 'activity',
          title: activity.activity || activity.name || activity.title || 'Activity',
          description: activity.description || '',
          duration: activity.duration || '',
          cost: activity.cost ?? null,  // Use null to distinguish from 0
          status: activity.costLabel,
          icon: getActivityIcon(activity.type),
        })).filter((a: any) => a.title),
      }));
    }

    // Fallback: Generate basic itinerary structure
    const nights = parseInt(plan.duration?.match(/\d+/)?.[0] || '1');
    const totalDays = nights + 1;
    const fallbackDays = [];

    for (let i = 1; i <= totalDays; i++) {
      fallbackDays.push({
        day: i,
        date: '',
        title: i === 1 ? 'Arrival Day' : i === totalDays ? 'Departure Day' : `Day ${i} - Explore`,
        activities: i === 1 ? [
          { time: 'Morning', type: 'transport', title: 'Travel to destination', description: 'Departure from origin', duration: '', cost: null, status: '', icon: TransportIcon },
          { time: 'Afternoon', type: 'accommodation', title: 'Hotel Check-in', description: '', duration: '', cost: plan.hotel?.pricePerNight ?? null, status: 'Per Night', icon: Hotel },
        ] : i === totalDays ? [
          { time: 'Morning', type: 'accommodation', title: 'Hotel Check-out', description: '', duration: '', cost: null, status: '', icon: Hotel },
          { time: 'Afternoon', type: 'transport', title: 'Return journey', description: 'Travel back to origin', duration: '', cost: null, status: '', icon: TransportIcon },
        ] : [
          { time: '09:00', type: 'meal', title: 'Breakfast', description: '', duration: '', cost: 200, status: '', icon: Utensils },
          { time: '10:00', type: 'attraction', title: 'Explore local attractions', description: 'Visit popular sites', duration: '3 hours', cost: null, status: '', icon: Camera },
          { time: '13:00', type: 'meal', title: 'Lunch', description: '', duration: '', cost: 300, status: '', icon: Utensils },
          { time: '15:00', type: 'leisure', title: 'Free time', description: 'Shopping or relaxation', duration: '2 hours', cost: null, status: '', icon: Coffee },
          { time: '19:00', type: 'meal', title: 'Dinner', description: '', duration: '', cost: 500, status: '', icon: Utensils },
        ]
      });
    }
    return fallbackDays;
  };

  const itineraryDays = buildItineraryDays();

  // Helper function to get icon based on activity type
  function getActivityIcon(type: string) {
    switch (type) {
      case 'travel':
      case 'transport': return TransportIcon;
      case 'accommodation': return Hotel;
      case 'meal': return Utensils;
      case 'leisure': return Coffee;
      case 'attraction': return Camera;
      default: return Activity;
    }
  }

  const priceBreakdown = [
    { category: 'Transport', amount: plan.breakdown.transport, percentage: Math.round((plan.breakdown.transport / plan.price) * 100), color: 'bg-blue-500' },
    { category: 'Accommodation', amount: plan.breakdown.accommodation, percentage: Math.round((plan.breakdown.accommodation / plan.price) * 100), color: 'bg-green-500' },
    { category: 'Activities', amount: plan.breakdown.activities, percentage: Math.round((plan.breakdown.activities / plan.price) * 100), color: 'bg-orange-500' },
    { category: 'Meals', amount: plan.breakdown.meals, percentage: Math.round((plan.breakdown.meals / plan.price) * 100), color: 'bg-yellow-500' },
    { category: 'Miscellaneous', amount: plan.breakdown.misc, percentage: Math.round((plan.breakdown.misc / plan.price) * 100), color: 'bg-purple-500' },
  ];

  const handleShare = () => {
    toast.success('Trip link copied to clipboard!');
  };

  const handleDownload = () => {
    toast.success('Downloading itinerary PDF...');
  };

  const handleEdit = () => {
    toast.info('Customization feature coming soon!');
  };

  const handleBookTrip = async () => {
    // Check if user is logged in
    if (!isAuthenticated) {
      toast.error('Please login to save this trip');
      navigate('/login', { state: { from: location.pathname, tripPlan: plan, formData } });
      return;
    }

    setIsSaving(true);
    try {
      const response = await tripsAPI.saveTrip({
        plan,
        formData,
      });

      toast.success('Trip saved to your account!');

      // Navigate to profile to see saved trips
      setTimeout(() => {
        navigate('/profile');
      }, 1000);
    } catch (error: any) {
      console.error('Error saving trip:', error);
      toast.error(error.message || 'Failed to save trip. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-4 -ml-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Results
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{plan.name}</h1>
                <Badge className="bg-primary">{plan.badge}</Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-muted-foreground">
                <span className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{formData?.origin} → {formData?.destination}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{plan.duration}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{formData?.travelers || 1} traveler(s)</span>
                </span>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="text-3xl font-bold text-primary">
                {formatINR(plan.price)}
              </div>
              <div className="text-sm text-muted-foreground">Total cost</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Customize
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Day-by-Day Itinerary</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeDay.toString()} onValueChange={(value) => setActiveDay(parseInt(value))}>
                  <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(itineraryDays.length, 7)}, 1fr)` }}>
                    {itineraryDays.slice(0, 7).map((day) => (
                      <TabsTrigger key={day.day} value={day.day.toString()}>
                        Day {day.day}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {itineraryDays.map((day) => (
                    <TabsContent key={day.day} value={day.day.toString()} className="mt-6">
                      <div className="mb-6">
                        <h3 className="text-xl font-semibold">{day.title}</h3>
                        <p className="text-sm text-muted-foreground">{day.date}</p>
                      </div>

                      <div className="relative space-y-6">
                        {/* Timeline line */}
                        <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-muted" />

                        {day.activities.map((activity: any, index: number) => {
                          const Icon = activity.icon;
                          return (
                            <div key={index} className="relative flex space-x-4">
                              <div className="flex flex-col items-center">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 border-4 border-background relative z-10">
                                  <Icon className="h-4 w-4 text-primary" />
                                </div>
                              </div>
                              <div className="flex-1 pb-8">
                                <div className="flex items-start justify-between mb-1">
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <p className="font-semibold">{activity.title}</p>
                                      {activity.status && (
                                        <Badge variant="secondary" className="text-xs">
                                          {activity.status}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                                    {activity.duration && (
                                      <p className="text-xs text-muted-foreground mt-1">Duration: {activity.duration}</p>
                                    )}
                                  </div>
                                  <div className="text-right flex-shrink-0 ml-4">
                                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                                    {activity.cost !== undefined && activity.cost !== null && (
                                      <p className="text-sm font-medium text-primary">{formatINR(activity.cost)}</p>
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <IndianRupee className="h-5 w-5" />
                  <span>Price Breakdown</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {priceBreakdown.map((item) => (
                  <div key={item.category}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">{item.category}</span>
                      <span className="text-sm font-semibold">{formatINR(item.amount)}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`${item.color} h-2 rounded-full`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{item.percentage}% of total</div>
                  </div>
                ))}

                <Separator className="my-4" />

                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatINR(plan.price)}</span>
                </div>

                <Button
                  onClick={handleBookTrip}
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-primary to-cyan-600 mt-4"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Trip
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Trip Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Trip Highlights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3">
                  <TransportIcon className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">
                      {plan.flight?.outbound?.stops === 0 ? 'Direct' : `${plan.flight?.outbound?.stops || 0}-stop`} {transportLabel}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {plan.flight?.outbound?.airline || plan.flight?.outbound?.name || 'Transport'}
                      {plan.flight?.outbound?.class && `, ${plan.flight.outbound.class}`}
                      {plan.flight?.outbound?.duration && ` • ${formatDuration(plan.flight.outbound.duration)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Hotel className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">{plan.hotel?.stars || 3}-Star Hotel</p>
                    <p className="text-xs text-muted-foreground">
                      {plan.hotel?.location || 'Destination'}
                      {plan.hotel?.nights && `, ${plan.hotel.nights} night${plan.hotel.nights !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Activity className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">{plan.activities?.list?.length || 0} Activities</p>
                    <p className="text-xs text-muted-foreground">Curated experiences included</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Star className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Highly Rated</p>
                    <p className="text-xs text-muted-foreground">{plan.rating.toFixed(1)}/5 traveler satisfaction</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Important Notes */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-base">Important Notes</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>• Carry valid ID proof for all travelers</p>
                <p>• Book activities 24 hours in advance</p>
                <p>• Download offline maps for the destination</p>
                <p>• Travel insurance recommended</p>
                <p>• Check COVID/health guidelines if applicable</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
