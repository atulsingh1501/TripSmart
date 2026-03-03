import Navigation from '../components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Loader2, MapPin, Calendar, Users, IndianRupee, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { formatINR } from '../../services/api';
import { toast } from 'sonner';

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
}

export default function MyTripsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [trips, setTrips] = useState<SavedTrip[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchTrips();
    }, []);

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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

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
        <div className="min-h-screen bg-muted/30 dark:bg-background pb-20">
            <Navigation />

            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">My Trips</h1>
                    <p className="text-muted-foreground">View and manage your saved trips</p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : trips.length === 0 ? (
                    <Card className="text-center py-12">
                        <CardContent>
                            <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                            <h2 className="text-xl font-semibold mb-2">No trips yet</h2>
                            <p className="text-muted-foreground mb-6">
                                Start planning your next adventure!
                            </p>
                            <Button onClick={() => navigate('/plan-trip')}>
                                Plan a Trip
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {trips.map((trip) => (
                            <Card key={trip._id} className="hover:shadow-lg transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg">
                                            {trip.source} → {trip.destination}
                                        </CardTitle>
                                        <Badge className={getStatusColor(trip.status)}>
                                            {trip.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
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
                                    <div className="text-xs text-muted-foreground">
                                        Saved on {formatDate(trip.createdAt)}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
