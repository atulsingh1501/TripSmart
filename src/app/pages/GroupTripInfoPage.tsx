import Navigation from '../components/Navigation';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Users, MapPin, Compass, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function GroupTripInfoPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    toast.success('You have been added to the waitlist!');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold text-sm mb-6 uppercase tracking-wider">
                Coming Soon
              </div>
              <h1 className="text-5xl md:text-6xl font-serif text-foreground mb-6 leading-tight">
                Travel is better together.
              </h1>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                TripSmart Group Trips connects you with like-minded travelers heading to the same destination. Share costs, make friends, and experience the world as a community.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Users className="h-8 w-8 text-emerald-400" />,
                  title: 'Smart Matching',
                  desc: 'Our algorithm pairs you with travelers who have similar budgets, interests, and travel dates.',
                },
                {
                  icon: <Compass className="h-8 w-8 text-emerald-400" />,
                  title: 'Agency Partnerships',
                  desc: 'We are partnering with top local agencies to curate exclusive group itineraries and bulk discounts.',
                },
                {
                  icon: <MapPin className="h-8 w-8 text-emerald-400" />,
                  title: 'Shared Experiences',
                  desc: 'Split the cost of private transport, villas, and premium activities without compromising comfort.',
                },
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="h-full border-0 shadow-sm bg-card/50">
                    <CardContent className="pt-8 px-6 pb-6">
                      <div className="mb-4 bg-white w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm">
                        {feature.icon}
                      </div>
                      <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                      <p className="text-[#6B6560] leading-relaxed">{feature.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Waitlist Section */}
        <section className="py-24 px-4 bg-[#0B3D2E] text-[#D1F2EB]">
          <div className="container mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-serif mb-6">Be the first to know.</h2>
              <p className="text-lg opacity-80 mb-10 max-w-xl mx-auto">
                We're currently onboarding travel agencies and testing the matching algorithm. Join the waitlist to get early access when we launch Group Trips.
              </p>

              {submitted ? (
                <div className="flex items-center justify-center gap-2 text-green-400 bg-green-400/10 py-3 px-6 rounded-full w-max mx-auto">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">You're on the list! We'll be in touch.</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12"
                  />
                  <Button
                    type="submit"
                    className="h-12 px-8 font-semibold"
                    style={{ background: '#50C878', color: '#013220' }}
                  >
                    Join Waitlist
                  </Button>
                </form>
              )}
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
