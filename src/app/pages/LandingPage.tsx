import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import MapBackground from '../components/MapBackground';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import {
  Sparkles,
  DollarSign,
  Clock,
  Shield,
  Globe,
  Calendar,
  MapPin,
  Star,
  TrendingUp,
  ArrowRight,
  ChevronRight,
  Compass,
  Zap,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { motion } from 'motion/react';

export default function LandingPage() {
  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered Planning',
      description: 'Advanced AI analyzes millions of options to craft your perfect trip',
    },
    {
      icon: DollarSign,
      title: 'Budget Optimization',
      description: 'Get the most value for your money with smart budget allocation',
    },
    {
      icon: Clock,
      title: 'Save Time',
      description: 'Plan your entire trip in minutes, not hours or days',
    },
    {
      icon: Shield,
      title: 'Best Price Guarantee',
      description: 'We compare thousands of options to find you the best deals',
    },
    {
      icon: Globe,
      title: 'Global Coverage',
      description: 'Plan trips to destinations worldwide with local insights',
    },
    {
      icon: Calendar,
      title: 'Flexible Dates',
      description: 'Find the best travel dates based on weather, prices, and events',
    },
    {
      icon: MapPin,
      title: 'Custom Itineraries',
      description: 'Get personalized day-by-day plans matching your interests',
    },
    {
      icon: Star,
      title: 'Expert Recommendations',
      description: 'Curated suggestions from travel experts and locals',
    },
    {
      icon: TrendingUp,
      title: 'Real-Time Updates',
      description: 'Stay informed with live price changes and availability',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Adventure Traveler',
      content: 'TripSmart saved me $800 on my Europe trip and planned everything perfectly. The AI recommendations were spot-on!',
      rating: 5,
    },
    {
      name: 'Michael Chen',
      role: 'Business Traveler',
      content: 'As someone who travels frequently, this tool is a game-changer. It saves me hours of research every trip.',
      rating: 5,
    },
    {
      name: 'Emily Rodriguez',
      role: 'Family Vacation Planner',
      content: 'Planning a family trip of 5 was always stressful. TripSmart made it easy and stayed within our budget!',
      rating: 5,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">

      {/* ── HERO: Full-screen Map ── */}
      <section className="relative w-full h-screen overflow-hidden">
        {/* Map fills the entire hero */}
        <MapBackground
          origin="Delhi"
          destination="Goa"
          stops={['Mumbai']}
        />

        {/* Translucent navigation overlaid on map */}
        <div className="absolute top-0 left-0 right-0 z-30">
          <Navigation />
        </div>

        {/* Floating CTA card – left side */}
        <div className="absolute top-0 left-0 h-full z-20 flex items-center pl-8 pt-14 pb-4 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="glass-panel rounded-2xl p-8 max-w-md pointer-events-auto"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/40 bg-blue-500/15 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-300 mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Next-Gen Travel Planning
            </div>

            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
              Your Dream Trip,{' '}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 bg-clip-text text-transparent">
                Optimized by AI
              </span>
            </h1>

            <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed mb-8">
              Enter your preferences and let our AI craft the perfect itinerary — flights, stays, and experiences — in seconds.
            </p>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { val: '500K+', label: 'Travelers' },
                { val: '3s', label: 'Plan Time' },
                { val: '₹800', label: 'Avg. Saved' },
              ].map(stat => (
                <div key={stat.label} className="text-center p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{stat.val}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="h-12 px-6 bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-lg shadow-blue-500/30 flex-1" asChild>
                <Link to="/plan-trip">
                  <Zap className="mr-2 h-4 w-4 fill-current" />
                  Start Planning
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-6 border-slate-300 dark:border-white/20 text-slate-700 dark:text-white hover:bg-black/5 dark:hover:bg-white/10" asChild>
                <Link to="/about">
                  Learn More <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-white/50">
          <span className="text-xs tracking-widest uppercase">Scroll to explore</span>
          <div className="w-0.5 h-8 bg-gradient-to-b from-white/30 to-transparent animate-pulse" />
        </div>
      </section>

      <main className="flex-1 bg-background">

        {/* Features Section */}
        <section className="bg-muted/30 py-24">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Everything you need for the perfect trip</h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                TripSmart combines cutting-edge AI with real-time data to provide a seamless planning experience.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full border-none bg-background shadow-sm transition-shadow hover:shadow-md">
                    <CardContent className="p-8">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="mb-2 text-xl font-bold">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold sm:text-4xl">How it works</h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                Three simple steps to your next unforgettable adventure.
              </p>
            </div>
            <div className="relative grid gap-12 lg:grid-cols-3">
              {/* Connector line for desktop */}
              <div className="absolute left-0 top-1/2 hidden h-0.5 w-full -translate-y-1/2 bg-muted-foreground/20 lg:block" />

              {[
                {
                  number: "01",
                  title: "Enter Preferences",
                  description: "Tell us where you want to go, your budget, and what you love to do."
                },
                {
                  number: "02",
                  title: "AI Generation",
                  description: "Our AI crafts 3 unique trip plans optimized for cost, time, and experience."
                },
                {
                  number: "03",
                  title: "Customize & Book",
                  description: "Tweak the details, select your preferred options, and book everything in one click."
                }
              ].map((step, index) => (
                <div key={index} className="relative flex flex-col items-center text-center">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground shadow-lg">
                    {step.number}
                  </div>
                  <h3 className="mb-3 text-2xl font-bold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="bg-muted/30 py-24">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Loved by travelers worldwide</h2>
              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-5 w-5 fill-primary text-primary" />
                ))}
              </div>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {testimonials.map((t, i) => (
                <Card key={i} className="border-none bg-background shadow-sm">
                  <CardContent className="p-8">
                    <p className="mb-6 italic text-muted-foreground">"{t.content}"</p>
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {t.name?.split(' ').map(n => n?.[0] || '').join('') || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-bold">{t.name}</h4>
                        <p className="text-sm text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground shadow-2xl lg:py-24">
              <h2 className="mb-6 text-4xl font-extrabold sm:text-5xl">Ready to plan your next adventure?</h2>
              <p className="mx-auto mb-10 max-w-2xl text-xl opacity-90">
                Join over 500,000 travelers who use TripSmart to plan smarter, faster, and better trips.
              </p>
              <Button size="lg" variant="secondary" className="h-14 px-10 text-lg font-bold" asChild>
                <Link to="/plan-trip">
                  Get Started for Free <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <Compass className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold tracking-tight">TripSmart</span>
              </div>
              <p className="mb-6 max-w-xs text-muted-foreground">
                The ultimate AI-powered travel planning companion for the modern explorer.
              </p>
              <div className="flex gap-4">
                {/* Social icons could go here */}
              </div>
            </div>
            <div>
              <h4 className="mb-4 font-bold">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/">Features</Link></li>
                <li><Link to="/plan-trip">Pricing</Link></li>
                <li><Link to="/mobile">Mobile App</Link></li>
                <li><Link to="/api">API</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-bold">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/careers">Careers</Link></li>
                <li><Link to="/blog">Blog</Link></li>
                <li><Link to="/contact">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} TripSmart AI Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
