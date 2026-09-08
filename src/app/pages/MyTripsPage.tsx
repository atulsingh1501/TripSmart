import Navigation from '../components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Loader2, MapPin, Calendar, Users, IndianRupee, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { formatINR } from '../../services/api';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Ticket } from 'lucide-react';

interface SavedTrip {
    _id: string;
    source: string;
    destination: string;
    startDate: string;
    endDate: string;
    travelers: number;
    tripType: string;
    selectedPlan: {
        tier: string;
        totalCost: number;
    };
    status: string;
    createdAt: string;
    bookingRef?: string;
}

// Fake data for booked and past trips since the real API doesn't have bookings yet
const FAKE_BOOKED_TRIPS: SavedTrip[] = [
    {
        _id: 'fake-booked-1',
        source: 'Mumbai',
        destination: 'Goa',
        startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        travelers: 2,
        tripType: 'tour',
        selectedPlan: { tier: 'Premium', totalCost: 45000 },
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        bookingRef: 'TS-2026-GOA892'
    }
];

const FAKE_PAST_TRIPS: SavedTrip[] = [
    {
        _id: 'fake-past-1',
        source: 'Delhi',
        destination: 'Jaipur',
        startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
        travelers: 3,
        tripType: 'tour',
        selectedPlan: { tier: 'Comfort', totalCost: 32000 },
        status: 'completed',
        createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
        bookingRef: 'TS-2025-JAI123'
    }
];

export default function MyTripsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [trips, setTrips] = useState<SavedTrip[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchTrips();
        } else {
            setIsLoading(false);
        }
    }, [user]);

    const fetchTrips = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('/api/user/trips', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setTrips(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching trips:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTrip = async (tripId: string) => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`/api/user/trips/${tripId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                setTrips(prev => prev.filter(t => t._id !== tripId));
                toast.success('Trip deleted successfully');
            } else {
                toast.error('Failed to delete trip');
            }
        } catch (error) {
            console.error('Error deleting trip:', error);
            toast.error('Failed to delete trip');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'saved': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
            case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default: return 'bg-blue-100 text-blue-800';
        }
    };

    const savedTrips = trips.filter(t => t.status === 'saved');
    // Using fake data + any real confirmed/completed trips
    const bookedTrips = [...FAKE_BOOKED_TRIPS, ...trips.filter(t => t.status === 'confirmed')];
    const pastTrips = [...FAKE_PAST_TRIPS, ...trips.filter(t => t.status === 'completed' || t.status === 'cancelled')];

    const renderTripCard = (trip: SavedTrip, isBookedOrPast = false) => (
        <Card key={trip._id} className="hover:shadow-lg transition-shadow flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">
                        {trip.source} → {trip.destination}
                    </CardTitle>
                    <Badge variant="outline" className={`border-0 ${getStatusColor(trip.status)}`}>
                        {trip.status.toUpperCase()}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 flex-1 flex flex-col">
                <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    {trip.travelers} traveler(s)
                </div>
                <div className="flex items-center text-sm font-semibold text-primary">
                    <IndianRupee className="h-4 w-4 mr-1" />
                    {formatINR(trip.selectedPlan?.totalCost || 0)}
                </div>
                {trip.bookingRef ? (
                    <div className="text-xs font-mono text-muted-foreground bg-muted p-1 rounded inline-block mt-1">
                        Ref: {trip.bookingRef}
                    </div>
                ) : (
                    <div className="text-xs text-muted-foreground">
                        Saved on {formatDate(trip.createdAt)}
                    </div>
                )}
                <div className="pt-4 mt-auto flex justify-between items-center gap-2">
                    {isBookedOrPast ? (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => navigate(`/tickets/${trip._id}`)}
                            >
                                <Ticket className="h-4 w-4 mr-2" />
                                View Ticket
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="default"
                                size="sm"
                                className="flex-1"
                                onClick={() => navigate(`/saved-trips/${trip._id}`)}
                            >
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteTrip(trip._id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="min-h-screen bg-background pb-20 pt-16">
            <Navigation />

            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">My Trips</h1>
                    <p className="text-muted-foreground">Manage your bookings and saved itineraries.</p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : !user ? (
                    <Card className="text-center py-12 max-w-lg mx-auto mt-12">
                        <CardContent>
                            <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                            <h2 className="text-xl font-semibold mb-2">Login Required</h2>
                            <p className="text-muted-foreground mb-6">
                                Please login to view your trips.
                            </p>
                            <Button onClick={() => navigate('/auth?mode=login')}>
                                Login
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Tabs defaultValue="booked" className="w-full">
                        <TabsList className="mb-6 bg-muted/50 p-1 rounded-lg">
                            <TabsTrigger value="booked" className="rounded-md px-6 py-2">Upcoming & Booked</TabsTrigger>
                            <TabsTrigger value="saved" className="rounded-md px-6 py-2">Saved Drafts</TabsTrigger>
                            <TabsTrigger value="past" className="rounded-md px-6 py-2">Past Trips</TabsTrigger>
                        </TabsList>

                        <TabsContent value="booked">
                            {bookedTrips.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <MapPin className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p>No upcoming trips booked yet.</p>
                                    <Button variant="outline" className="mt-4" onClick={() => navigate('/plan-trip')}>Plan a Trip</Button>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {bookedTrips.map(trip => renderTripCard(trip, true))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="saved">
                            {savedTrips.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <MapPin className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p>No saved drafts.</p>
                                    <Button variant="outline" className="mt-4" onClick={() => navigate('/plan-trip')}>Plan a Trip</Button>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {savedTrips.map(trip => renderTripCard(trip, false))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="past">
                            {pastTrips.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p>No past trips.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {pastTrips.map(trip => renderTripCard(trip, true))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </div>
        </div>
    );
}
