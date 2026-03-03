import Navigation from '../components/Navigation';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
    MapPin,
    Sparkles,
    Users,
    Shield,
    Heart,
    ArrowRight
} from 'lucide-react';

export default function AboutPage() {
    const navigate = useNavigate();

    const features = [
        {
            icon: Sparkles,
            title: 'AI-Powered Planning',
            description: 'Our smart algorithm creates personalized trip plans that match your budget and preferences.',
        },
        {
            icon: MapPin,
            title: 'Real-Time Data',
            description: 'Access live train schedules, flight prices, and hotel availability across India.',
        },
        {
            icon: Users,
            title: 'Group Friendly',
            description: 'Plan trips for solo travelers or groups with automatic cost splitting.',
        },
        {
            icon: Shield,
            title: 'Secure & Reliable',
            description: 'Your data is protected with industry-standard security measures.',
        },
    ];

    return (
        <div className="min-h-screen bg-muted/30 dark:bg-background pb-20">
            <Navigation />

            <div className="container mx-auto px-4 py-12">
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-cyan-600 bg-clip-text text-transparent">
                        About TripSmart
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Your intelligent travel companion for planning the perfect trip across India
                    </p>
                </div>

                {/* Mission */}
                <Card className="mb-12 bg-gradient-to-r from-primary/5 to-cyan-500/5 border-primary/20">
                    <CardContent className="py-8 text-center">
                        <Heart className="h-12 w-12 mx-auto text-primary mb-4" />
                        <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            We believe everyone deserves a stress-free travel experience. TripSmart uses
                            advanced algorithms to find the best combinations of transport, accommodation,
                            and activities within your budget—so you can focus on making memories.
                        </p>
                    </CardContent>
                </Card>

                {/* Features Grid */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-center mb-8">Why Choose TripSmart?</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature) => (
                            <Card key={feature.title} className="text-center hover:shadow-lg transition-shadow">
                                <CardContent className="pt-6">
                                    <feature.icon className="h-10 w-10 mx-auto text-primary mb-4" />
                                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-12 text-center">
                    <div>
                        <div className="text-3xl font-bold text-primary">50+</div>
                        <div className="text-sm text-muted-foreground">Cities Covered</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-primary">2500+</div>
                        <div className="text-sm text-muted-foreground">Trains Available</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-primary">9000+</div>
                        <div className="text-sm text-muted-foreground">Hotels Listed</div>
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Ready to Start Planning?</h2>
                    <Button
                        size="lg"
                        onClick={() => navigate('/plan-trip')}
                        className="bg-gradient-to-r from-primary to-cyan-600"
                    >
                        Plan Your Trip
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
