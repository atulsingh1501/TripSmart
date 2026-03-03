import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { formatINR, type TripPlanData } from '../../services/api';

export default function BookingConfirmationPage() {
  const location = useLocation();
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Get trip plan from navigation state
  const { tripPlan, formData } = location.state || {};
  const plan: TripPlanData | null = tripPlan;

  const bookingSummary = plan ? {
    tripName: `${formData?.destination || 'Trip'} - ${plan.name}`,
    destination: formData?.destination || 'India',
    origin: formData?.origin || '',
    dates: `${formData?.departureDate || 'TBD'} - ${formData?.returnDate || 'TBD'}`,
    travelers: formData?.travelers || 1,
    confirmationNumber: `TS-2024-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    totalPrice: plan.price,
    breakdown: [
      { item: `Flights (${formData?.travelers || 1} passenger${formData?.travelers > 1 ? 's' : ''})`, amount: plan.breakdown.transport },
      { item: `Hotel (${plan.hotel.nights} nights)`, amount: plan.breakdown.accommodation },
      { item: 'Activities & Tours', amount: plan.breakdown.activities },
      { item: 'Meals Estimate', amount: plan.breakdown.meals },
      { item: 'Miscellaneous', amount: plan.breakdown.misc },
    ],
  } : {
    tripName: 'Trip',
    destination: 'Destination',
    origin: '',
    dates: 'TBD',
    travelers: 1,
    confirmationNumber: `TS-2024-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    totalPrice: 0,
    breakdown: [],
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptedTerms) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    toast.success('Processing your booking...');
    setTimeout(() => {
      setShowSuccess(true);
    }, 2000);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-2 border-green-200">
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

                <h1 className="text-3xl font-bold mb-4">Booking Confirmed!</h1>
                <p className="text-lg text-muted-foreground mb-2">
                  Your trip to {bookingSummary.destination} has been successfully booked.
                </p>
                <p className="text-muted-foreground mb-8">
                  Confirmation number: <span className="font-semibold">{bookingSummary.confirmationNumber}</span>
                </p>

                <div className="bg-muted rounded-lg p-6 mb-8 text-left">
                  <h3 className="font-semibold mb-4 flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span>Trip Details</span>
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Destination:</span>
                      <span className="font-medium">{bookingSummary.destination}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dates:</span>
                      <span className="font-medium">{bookingSummary.dates}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Travelers:</span>
                      <span className="font-medium">{bookingSummary.travelers} people</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Paid:</span>
                      <span className="font-semibold text-primary">
                        {formatINR(bookingSummary.totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-sm text-left">
                    <p className="font-medium mb-2">📧 Confirmation Email Sent</p>
                    <p className="text-muted-foreground">
                      We've sent your booking confirmation and itinerary to your email address. Check your inbox!
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="outline" className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Download Itinerary
                  </Button>
                  <Button asChild className="flex-1 bg-gradient-to-r from-blue-600 to-teal-500">
                    <Link to="/">
                      Back to Home
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground mt-6">
                  Need help? Contact our support team 24/7
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
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
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" placeholder="John" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" placeholder="Doe" required />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="john.doe@example.com" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" type="tel" placeholder="+91 98765 43210" required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" placeholder="House/Flat No, Street Name" required />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" placeholder="Mumbai" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input id="state" placeholder="Maharashtra" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zip">PIN Code</Label>
                        <Input id="zip" placeholder="400001" required />
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
                    <div className="space-y-4">
                      <Label
                        htmlFor="card"
                        className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer ${
                          paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-muted'
                        }`}
                      >
                        <RadioGroupItem value="card" id="card" />
                        <div className="flex-1">
                          <div className="font-medium">Credit/Debit Card</div>
                          <div className="text-sm text-muted-foreground">Visa, Mastercard, RuPay</div>
                        </div>
                        <CreditCard className="h-6 w-6 text-muted-foreground" />
                      </Label>

                      <Label
                        htmlFor="upi"
                        className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer ${
                          paymentMethod === 'upi' ? 'border-primary bg-primary/5' : 'border-muted'
                        }`}
                      >
                        <RadioGroupItem value="upi" id="upi" />
                        <div className="flex-1">
                          <div className="font-medium">UPI</div>
                          <div className="text-sm text-muted-foreground">GPay, PhonePe, Paytm, BHIM</div>
                        </div>
                        <IndianRupee className="h-6 w-6 text-muted-foreground" />
                      </Label>

                      <Label
                        htmlFor="netbanking"
                        className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer ${
                          paymentMethod === 'netbanking' ? 'border-primary bg-primary/5' : 'border-muted'
                        }`}
                      >
                        <RadioGroupItem value="netbanking" id="netbanking" />
                        <div className="flex-1">
                          <div className="font-medium">Net Banking</div>
                          <div className="text-sm text-muted-foreground">All major Indian banks</div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>

                  {paymentMethod === 'card' && (
                    <div className="mt-6 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input id="cardNumber" placeholder="1234 5678 9012 3456" required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiry">Expiry Date</Label>
                          <Input id="expiry" placeholder="MM/YY" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvv">CVV</Label>
                          <Input id="cvv" placeholder="123" type="password" required />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'upi' && (
                    <div className="mt-6 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="upiId">UPI ID</Label>
                        <Input id="upiId" placeholder="yourname@upi" required />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Enter your UPI ID. You'll receive a payment request on your UPI app.
                      </p>
                    </div>
                  )}

                  {paymentMethod === 'netbanking' && (
                    <div className="mt-6 space-y-4">
                      <div className="space-y-2">
                        <Label>Select Bank</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak', 'Other'].map(bank => (
                            <Button key={bank} variant="outline" size="sm" className="justify-start">
                              {bank}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Terms and Conditions */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <Label className="flex items-start space-x-2 cursor-pointer">
                      <Checkbox
                        checked={acceptedTerms}
                        onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                      />
                      <span className="text-sm">
                        I accept the <a href="#" className="text-blue-600 hover:underline">terms and conditions</a> and{' '}
                        <a href="#" className="text-blue-600 hover:underline">cancellation policy</a>
                      </span>
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      By completing this booking, you agree to TripSmart's booking terms and the
                      supplier's terms and conditions.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Booking Summary */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">{bookingSummary.tripName}</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p className="flex items-center space-x-2">
                        <Home className="h-4 w-4" />
                        <span>{bookingSummary.destination}</span>
                      </p>
                      <p className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{bookingSummary.dates}</span>
                      </p>
                      <p className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>{bookingSummary.travelers} travelers</span>
                      </p>
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
                    <span className="text-2xl font-bold text-primary">
                      {formatINR(bookingSummary.totalPrice)}
                    </span>
                  </div>

                  <Button
                    onClick={handleConfirmBooking}
                    className="w-full bg-gradient-to-r from-blue-600 to-teal-500"
                    size="lg"
                  >
                    Confirm Booking
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-sm">
                    <p className="font-medium text-green-600 dark:text-green-400 mb-1">✓ Free Cancellation</p>
                    <p className="text-green-700 dark:text-green-500 text-xs">Cancel up to 24 hours before for full refund</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
