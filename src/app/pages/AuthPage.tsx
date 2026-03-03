import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../components/Navigation';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Plane,
  ArrowRight,
  Check,
  Sparkles
} from 'lucide-react';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  
  // Determine which tab to show based on URL
  const defaultTab = location.pathname === '/signup' ? 'signup' : 'login';
  
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await login(loginEmail, loginPassword);
      toast.success('Welcome back!');
      // Redirect to plan-trip page after login
      const from = (location.state as any)?.from?.pathname || '/plan-trip';
      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signupName || !signupEmail || !signupPassword) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (signupPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        name: signupName,
        email: signupEmail,
        password: signupPassword,
        phone: signupPhone || undefined,
      });
      toast.success('Account created successfully!');
      // Redirect to plan-trip page after signup
      navigate('/plan-trip', { replace: true });
    } catch (error: any) {
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    'AI-powered trip planning',
    'Save and manage your trips',
    'Personalized recommendations',
    'Budget optimization tools',
    'Real-time price alerts',
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left Side - Features */}
            <div className="hidden lg:block space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-teal-500">
                    <Plane className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold">TripSmart</span>
                </div>
                <h1 className="text-3xl font-bold mb-4">
                  Plan Your Dream Trip with AI
                </h1>
                <p className="text-muted-foreground text-lg">
                  Join thousands of travelers who save time and money with intelligent trip planning.
                </p>
              </div>

              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              <Card className="bg-gradient-to-br from-blue-50 to-teal-50 dark:from-blue-950 dark:to-teal-950 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Sparkles className="h-8 w-8 text-blue-600 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-2">New User Benefit</h3>
                      <p className="text-sm text-muted-foreground">
                        Sign up today and get access to exclusive AI-powered trip recommendations and personalized itineraries!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Auth Forms */}
            <Card className="border-2">
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center lg:hidden mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-teal-500">
                    <Plane className="h-6 w-6 text-white" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Welcome to TripSmart</CardTitle>
                <CardDescription>
                  {activeTab === 'login' ? 'Sign in to continue planning your trips' : 'Create an account to get started'}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>

                  {/* Login Tab */}
                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="you@example.com"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="login-password">Password</Label>
                          <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                            Forgot password?
                          </Link>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="login-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="pl-10 pr-10"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1 h-8 w-8"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-teal-500"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  </TabsContent>

                  {/* Signup Tab */}
                  <TabsContent value="signup">
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Full Name *</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-name"
                            type="text"
                            placeholder="John Doe"
                            value={signupName}
                            onChange={(e) => setSignupName(e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="you@example.com"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-phone">Phone (Optional)</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-phone"
                            type="tel"
                            placeholder="+91 98765 43210"
                            value={signupPhone}
                            onChange={(e) => setSignupPhone(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-password">Password *</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="signup-password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              value={signupPassword}
                              onChange={(e) => setSignupPassword(e.target.value)}
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-confirm">Confirm *</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="signup-confirm"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              value={signupConfirmPassword}
                              onChange={(e) => setSignupConfirmPassword(e.target.value)}
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Password must be at least 8 characters long
                      </p>

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-teal-500"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Creating account...' : 'Create Account'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <Button variant="outline" disabled>
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Google
                    </Button>
                    <Button variant="outline" disabled>
                      <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      GitHub
                    </Button>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="justify-center text-sm text-muted-foreground">
                By continuing, you agree to our{' '}
                <Link to="/terms" className="text-primary hover:underline mx-1">Terms</Link>
                and{' '}
                <Link to="/privacy" className="text-primary hover:underline ml-1">Privacy Policy</Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
