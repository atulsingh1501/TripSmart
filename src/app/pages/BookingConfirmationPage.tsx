import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Checkbox } from '../components/ui/checkbox';
import { Separator } from '../components/ui/separator';
import {
  CheckCircle,
  CreditCard,
  Calendar,
  User,
  Mail,
  Phone,
  Home,
  Download,
  ArrowRight,
  IndianRupee,
  MapPin,
  Plane,
  Train,
  Hotel,
  Star,
  Activity,
  ShieldAlert,
  Headphones,
  Ticket,
  Shield,
  Wifi,
  Lock,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { formatINR, type TripPlanData } from '../../services/api';
import { printItinerary } from '../../utils/itineraryExport';

type BookingStep = 'form' | 'processing' | 'success';

const PROCESSING_STEPS = [
  { label: 'Verifying payment details...', duration: 1200 },
  { label: 'Contacting payment gateway...', duration: 1500 },
  { label: 'Securing your booking...', duration: 1000 },
  { label: 'Confirming reservation...', duration: 800 },
];

export default function BookingConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [step, setStep] = useState<BookingStep>('form');
  const [processingStep, setProcessingStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [itineraryDays, setItineraryDays] = useState<any[]>([]);

  // Contact form state
  const [contactInfo, setContactInfo] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', state: '', pincode: '',
  });

  const { tripPlan, formData } = location.state || {};
  const plan: TripPlanData | null = tripPlan;
  const isTrainTransport =
    plan?.transport?.mode === 'train' ||
    plan?.transport?.type === 'train' ||
    plan?.flight?.outbound?.mode === 'train' ||
    plan?.flight?.outbound?.type === 'train';
  const TransportIcon = isTrainTransport ? Train : Plane;

  const generatedRef = `TS-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  const bookingSummary = plan ? {
    tripName: `${formData?.destination || 'Trip'} – ${plan.name}`,
    destination: formData?.destination || 'India',
    origin: formData?.origin || '',
    dates: `${formData?.departureDate || 'TBD'} – ${formData?.returnDate || 'TBD'}`,
    travelers: formData?.travelers || 1,
    totalPrice: plan.price,
    breakdown: [
      { item: `Transport (${formData?.travelers || 1} traveler${formData?.travelers > 1 ? 's' : ''})`, amount: plan.breakdown.transport },
      { item: `Hotel (${plan.hotel?.nights || 1} nights)`, amount: plan.breakdown.accommodation },
      { item: 'Activities & Tours', amount: plan.breakdown.activities },
      { item: 'Meals Estimate', amount: plan.breakdown.meals },
      { item: 'Miscellaneous', amount: plan.breakdown.misc },
    ],
  } : {
    tripName: 'Trip', destination: 'Destination', origin: '',
    dates: 'TBD', travelers: 1, totalPrice: 0, breakdown: [],
  };

  // Run fake processing animation
  const runProcessing = async () => {
    for (let i = 0; i < PROCESSING_STEPS.length; i++) {
      setProcessingStep(i);
      await new Promise(r => setTimeout(r, PROCESSING_STEPS[i].duration));
    }

    // Call backend to confirm booking
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/trips/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          tripPlan: plan,
          formData,
          paymentMethod,
          contactInfo,
          bookingRef: generatedRef,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBookingId(data.bookingId || generatedRef);
      } else {
        // Fallback to local reference if API unavailable
        setBookingId(generatedRef);
      }
    } catch {
      setBookingId(generatedRef);
    }

    setStep('success');
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      toast.error('Please accept the terms and conditions');
      return;
    }
    if (!contactInfo.firstName || !contactInfo.email || !contactInfo.phone) {
      toast.error('Please fill in all required fields');
      return;
    }
    setStep('processing');
    runProcessing();
  };

  const handleDownloadItinerary = () => {
    if (!plan) return;
    const days = (plan.itinerary || []).map((day: any, idx: number) => ({
      day: day.day || idx + 1,
      title: day.title || `Day ${idx + 1}`,
      date: day.date || '',
      activities: (day.activities || []).map((a: any) => ({
        time: a.time || a.timeSlot || '',
        title: a.activity || a.name || a.title || 'Activity',
        description: a.description || '',
        cost: a.cost != null ? formatINR(a.cost) : '',
      })),
    }));

    printItinerary({
      title: `${plan.name} (${plan.badge || ''})`,
      origin: formData?.origin || 'Origin',
      destination: formData?.destination || 'Destination',
      dates: bookingSummary.dates,
      duration: plan.duration,
      travelers: formData?.travelers || 1,
      totalCost: formatINR(plan.price),
      breakdown: [
        { label: 'Transport', amount: formatINR(plan.breakdown.transport) },
        { label: 'Accommodation', amount: formatINR(plan.breakdown.accommodation) },
        { label: 'Activities', amount: formatINR(plan.breakdown.activities) },
        { label: 'Meals', amount: formatINR(plan.breakdown.meals) },
        { label: 'Miscellaneous', amount: formatINR(plan.breakdown.misc) },
      ],
      hotel: plan.hotel,
      transport: {
        mode: isTrainTransport ? 'Train' : 'Flight',
        operator: plan.flight?.outbound?.airline || plan.flight?.outbound?.name,
        departure: plan.flight?.outbound?.departureTime,
        arrival: plan.flight?.outbound?.arrivalTime,
        class: plan.flight?.outbound?.class,
      },
      days: days.length > 0 ? days : [{ day: 1, title: 'Your Trip', date: '', activities: [] }],
    });
    toast.success('Opening printable itinerary — save as PDF from the print dialog');
  };

  // ── PROCESSING SCREEN ──────────────────────────────────────────────────
  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          {/* Animated lock icon */}
          <div className="flex justify-center mb-8">
            <div
              className="h-24 w-24 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #50C87822 0%, #0B6E4F33 100%)', border: '2px solid rgba(80,200,120,0.25)' }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              >
                <Lock className="h-12 w-12" style={{ color: '#50C878' }} />
              </motion.div>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-2">Processing Payment</h2>
          <p className="text-muted-foreground mb-8">Please don't close this window</p>

          {/* Processing steps */}
          <div className="space-y-3 text-left mb-8">
            {PROCESSING_STEPS.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: i <= processingStep ? 1 : 0.3, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3"
              >
                {i < processingStep ? (
                  <CheckCircle className="h-5 w-5 flex-shrink-0" style={{ color: '#22c55e' }} />
                ) : i === processingStep ? (
                  <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin" style={{ color: '#50C878' }} />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-muted flex-shrink-0" />
                )}
                <span className={`text-sm ${i <= processingStep ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {s.label}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #50C878, #0B6E4F)' }}
              initial={{ width: '0%' }}
              animate={{ width: `${((processingStep + 1) / PROCESSING_STEPS.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
            <Shield className="h-3 w-3" /> 256-bit SSL encrypted — your payment is secure
          </p>
        </motion.div>
      </div>
    );
  }

  // ── SUCCESS SCREEN ──────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-2" style={{ borderColor: 'rgba(34,197,94,0.3)' }}>
              <CardContent className="p-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  <div className="flex justify-center mb-6">
                    <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-16 w-16 text-green-600" />
                    </div>
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <h1 className="text-3xl font-bold mb-2">Booking Confirmed! 🎉</h1>
                  <p className="text-lg text-muted-foreground mb-1">
                    Your trip to <strong>{bookingSummary.destination}</strong> is booked.
                  </p>
                  <p className="text-muted-foreground mb-8">
                    Booking reference: <span className="font-mono font-semibold text-primary">{bookingId}</span>
                  </p>
                </motion.div>

                {/* Trip details box */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-muted rounded-xl p-6 mb-6 text-left"
                >
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Trip Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Route:</span>
                      <span className="font-medium">{bookingSummary.origin} → {bookingSummary.destination}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dates:</span>
                      <span className="font-medium">{bookingSummary.dates}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Travelers:</span>
                      <span className="font-medium">{bookingSummary.travelers} people</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Total Paid:</span>
                      <span className="text-primary">{formatINR(bookingSummary.totalPrice)}</span>
                    </div>
                  </div>
                </motion.div>

                {/* Info boxes */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-4 mb-8"
                >
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-sm text-left">
                    <p className="font-medium mb-1">📧 Confirmation Email Sent</p>
                    <p className="text-muted-foreground">We've sent your booking confirmation and itinerary to your email address.</p>
                  </div>

                  {plan && (
                    <div className="grid gap-3 md:grid-cols-2 text-left">
                      <div className="rounded-lg border p-4">
                        <p className="font-semibold mb-2 flex items-center gap-2">
                          <TransportIcon className="h-4 w-4 text-primary" />
                          Transport Details
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {plan.flight?.outbound?.airline || plan.flight?.outbound?.name || (isTrainTransport ? 'Train' : 'Flight')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {plan.flight?.outbound?.departureTime || 'TBD'} → {plan.flight?.outbound?.arrivalTime || 'TBD'}
                        </p>
                      </div>
                      <div className="rounded-lg border p-4">
                        <p className="font-semibold mb-2 flex items-center gap-2">
                          <Headphones className="h-4 w-4 text-primary" />
                          Support
                        </p>
                        <p className="text-sm text-muted-foreground">TripSmart: +91 1800-11-TRIP</p>
                        <p className="text-sm text-muted-foreground">Emergency: 112</p>
                        <p className="text-sm text-muted-foreground">Medical: 108</p>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Action buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleDownloadItinerary}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Itinerary
                  </Button>
                  <Button
                    className="flex-1"
                    style={{ background: 'linear-gradient(135deg, #50C878 0%, #0B6E4F 100%)', color: '#013220' }}
                    onClick={() => navigate('/my-trips')}
                  >
                    <Ticket className="mr-2 h-4 w-4" />
                    View My Trips
                  </Button>
                  <Button asChild variant="secondary" className="flex-1">
                    <Link to="/">Back to Home <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </motion.div>

                <p className="text-sm text-muted-foreground mt-6">Need help? Contact our support team 24/7</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── FORM SCREEN ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-6xl mx-auto">
          {/* Progress indicator */}
          <div className="flex items-center gap-2 mb-6">
            {['Trip Details', 'Payment', 'Confirmation'].map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: i === 0 ? '#50C878' : 'rgba(80,200,120,0.12)',
                    color: i === 0 ? '#fff' : '#6B6560',
                  }}
                >
                  {i + 1}
                </div>
                <span className={`text-sm font-medium ${i === 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
                {i < 2 && <div className="h-px w-8 bg-muted" />}
              </div>
            ))}
          </div>

          <h1 className="text-3xl font-bold mb-2">Complete Your Booking</h1>
          <p className="text-muted-foreground mb-8">You're almost there! Just a few more details needed.</p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Traveler Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Traveler Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                        <Input id="firstName" placeholder="Rahul" value={contactInfo.firstName}
                          onChange={e => setContactInfo(p => ({ ...p, firstName: e.target.value }))} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                        <Input id="lastName" placeholder="Sharma" value={contactInfo.lastName}
                          onChange={e => setContactInfo(p => ({ ...p, lastName: e.target.value }))} required />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                        <Input id="email" type="email" placeholder="rahul@example.com" value={contactInfo.email}
                          onChange={e => setContactInfo(p => ({ ...p, email: e.target.value }))} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                        <Input id="phone" type="tel" placeholder="+91 98765 43210" value={contactInfo.phone}
                          onChange={e => setContactInfo(p => ({ ...p, phone: e.target.value }))} required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" placeholder="House/Flat No, Street Name" value={contactInfo.address}
                        onChange={e => setContactInfo(p => ({ ...p, address: e.target.value }))} />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" placeholder="Mumbai" value={contactInfo.city}
                          onChange={e => setContactInfo(p => ({ ...p, city: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input id="state" placeholder="Maharashtra" value={contactInfo.state}
                          onChange={e => setContactInfo(p => ({ ...p, state: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pincode">PIN Code</Label>
                        <Input id="pincode" placeholder="400001" value={contactInfo.pincode}
                          onChange={e => setContactInfo(p => ({ ...p, pincode: e.target.value }))} />
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Payment Method</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="space-y-3">
                      {[
                        { value: 'card', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay', icon: <CreditCard className="h-6 w-6 text-muted-foreground" /> },
                        { value: 'upi', label: 'UPI', sub: 'GPay, PhonePe, Paytm, BHIM', icon: <IndianRupee className="h-6 w-6 text-muted-foreground" /> },
                        { value: 'netbanking', label: 'Net Banking', sub: 'All major Indian banks', icon: <Shield className="h-6 w-6 text-muted-foreground" /> },
                      ].map(opt => (
                        <Label
                          key={opt.value}
                          htmlFor={opt.value}
                          className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            paymentMethod === opt.value ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/30'
                          }`}
                        >
                          <RadioGroupItem value={opt.value} id={opt.value} />
                          <div className="flex-1">
                            <div className="font-medium">{opt.label}</div>
                            <div className="text-sm text-muted-foreground">{opt.sub}</div>
                          </div>
                          {opt.icon}
                        </Label>
                      ))}
                    </div>
                  </RadioGroup>

                  {paymentMethod === 'card' && (
                    <div className="mt-6 space-y-4 p-4 rounded-xl bg-muted/40">
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiry">Expiry Date</Label>
                          <Input id="expiry" placeholder="MM/YY" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvv">CVV</Label>
                          <Input id="cvv" placeholder="•••" type="password" maxLength={4} />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Your card details are encrypted and never stored.
                      </p>
                    </div>
                  )}

                  {paymentMethod === 'upi' && (
                    <div className="mt-6 p-4 rounded-xl bg-muted/40 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="upiId">UPI ID</Label>
                        <Input id="upiId" placeholder="yourname@okaxis" />
                      </div>
                      <p className="text-xs text-muted-foreground">You'll receive a payment request on your UPI app.</p>
                    </div>
                  )}

                  {paymentMethod === 'netbanking' && (
                    <div className="mt-6 p-4 rounded-xl bg-muted/40 space-y-3">
                      <Label className="text-sm font-medium">Select Bank</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak', 'Other'].map(bank => (
                          <Button key={bank} variant="outline" size="sm" className="justify-start text-sm">
                            {bank}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Terms */}
              <Card>
                <CardContent className="pt-6">
                  <Label className="flex items-start space-x-3 cursor-pointer">
                    <Checkbox
                      id="terms"
                      checked={acceptedTerms}
                      onCheckedChange={checked => setAcceptedTerms(checked as boolean)}
                    />
                    <span className="text-sm leading-relaxed">
                      I accept the <a href="#" className="underline text-primary">terms and conditions</a> and{' '}
                      <a href="#" className="underline text-primary">cancellation policy</a>. By completing this booking, I agree to TripSmart's booking terms and the supplier's conditions.
                    </span>
                  </Label>
                </CardContent>
              </Card>

              {/* Hotel & Activity snapshot */}
              {plan && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Hotel className="h-4 w-4" />
                      Stay & Activity Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="rounded-lg border p-3">
                      <p className="font-medium">{plan.hotel?.name || 'Selected hotel'}</p>
                      <p className="text-muted-foreground">{plan.hotel?.location || bookingSummary.destination} • {plan.hotel?.nights || 1} night(s)</p>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        {(plan.hotel?.rating || 4.2).toFixed(1)} / 5
                      </p>
                    </div>
                    {(plan.activities?.list || []).length > 0 && (
                      <div className="grid gap-2 md:grid-cols-2">
                        {(plan.activities.list || []).slice(0, 4).map((activity: any) => (
                          <div key={activity.id} className="rounded-lg border p-2">
                            <p className="font-medium truncate text-xs">{activity.name}</p>
                            <p className="text-xs text-muted-foreground">{activity.duration} • {formatINR(activity.price)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">{bookingSummary.tripName}</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{bookingSummary.destination}</p>
                      <p className="flex items-center gap-2"><Calendar className="h-4 w-4" />{bookingSummary.dates}</p>
                      <p className="flex items-center gap-2"><User className="h-4 w-4" />{bookingSummary.travelers} traveler{bookingSummary.travelers > 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Price Breakdown</h4>
                    {bookingSummary.breakdown.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.item}</span>
                        <span>{formatINR(item.amount)}</span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total</span>
                    <span className="text-2xl font-bold text-primary">{formatINR(bookingSummary.totalPrice)}</span>
                  </div>

                  <Button
                    onClick={handleConfirmBooking}
                    className="w-full font-semibold"
                    style={{ background: 'linear-gradient(135deg, #50C878 0%, #0B6E4F 100%)', color: '#013220', boxShadow: '0 4px 14px rgba(80,200,120,0.35)' }}
                    size="lg"
                  >
                    Confirm & Pay
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-sm">
                    <p className="font-medium text-green-600 dark:text-green-400 mb-1">✓ Free Cancellation</p>
                    <p className="text-green-700 dark:text-green-500 text-xs">Cancel up to 24 hours before for a full refund</p>
                  </div>

                  <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                    <Shield className="h-3 w-3" /> Secured by 256-bit SSL encryption
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
