import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import {
  User,
  Mail,
  Phone,
  Lock,
  Bell,
  Moon,
  Sun,
  Globe,
  Shield,
  CreditCard,
  MapPin,
  Calendar,
  Loader2,
  Check,
  AlertCircle,
  ArrowLeft,
  Plane,
  Train,
  Hotel,
  IndianRupee,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { useTheme } from '../components/ThemeProvider';
import { formatINR } from '../../services/api';
import Navigation from '../components/Navigation';

interface UserTripHistoryItem {
  _id: string;
  source: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  status: string;
  selectedPlan?: {
    tier?: string;
    totalCost?: number;
  };
  createdAt: string;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, updateProfile, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [preferences, setPreferences] = useState({
    notifications: true,
    emailUpdates: true,
    currency: 'INR',
    language: 'en',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [tripHistory, setTripHistory] = useState<UserTripHistoryItem[]>([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth?mode=login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Initialize form data from user
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      if (user.preferences) {
        setPreferences(prev => ({
          ...prev,
          ...user.preferences,
        }));
      }
    }
  }, [user]);

  useEffect(() => {
    const fetchTripHistory = async () => {
      if (!isAuthenticated) return;
      setIsLoadingTrips(true);
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('/api/user/trips', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          setTripHistory(Array.isArray(data.data) ? data.data : []);
        }
      } catch {
        setTripHistory([]);
      } finally {
        setIsLoadingTrips(false);
      }
    };

    fetchTripHistory();
  }, [isAuthenticated]);

  const tripInsights = useMemo(() => {
    if (tripHistory.length === 0) {
      return {
        totalTrips: 0,
        totalSpend: 0,
        averageSpend: 0,
        favoriteDestination: 'N/A',
        upcomingTrips: 0,
      };
    }

    const totalSpend = tripHistory.reduce((sum, trip) => sum + (trip.selectedPlan?.totalCost || 0), 0);
    const destinationCount: Record<string, number> = {};
    let upcomingTrips = 0;

    const today = new Date();
    tripHistory.forEach((trip) => {
      destinationCount[trip.destination] = (destinationCount[trip.destination] || 0) + 1;
      if (new Date(trip.startDate) > today) upcomingTrips += 1;
    });

    const favoriteDestination = Object.entries(destinationCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
      totalTrips: tripHistory.length,
      totalSpend,
      averageSpend: Math.round(totalSpend / tripHistory.length),
      favoriteDestination,
      upcomingTrips,
    };
  }, [tripHistory]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    try {
      await updateProfile({
        name: formData.name,
        phone: formData.phone,
        preferences,
      });
      setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setSaveMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSaveMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setSaveMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Call password change API
      const response = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setSaveMessage({ type: 'success', text: 'Password changed successfully! Please login again.' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });

      // Logout after password change
      setTimeout(() => {
        logout();
        navigate('/auth?mode=login');
      }, 2000);
    } catch (error: any) {
      setSaveMessage({ type: 'error', text: error.message || 'Failed to change password' });
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 pt-20">
      <Navigation />
      <div className="container max-w-4xl mx-auto">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Trip Statistics And Insights
              </CardTitle>
              <CardDescription>
                Based on your trip history and saved itineraries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Total Trips</p>
                  <p className="text-xl font-semibold">{tripInsights.totalTrips}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Total Spend</p>
                  <p className="text-xl font-semibold flex items-center gap-1"><IndianRupee className="h-4 w-4" />{formatINR(tripInsights.totalSpend).replace('₹', '')}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Average Spend</p>
                  <p className="text-xl font-semibold">{formatINR(tripInsights.averageSpend)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Favorite Destination</p>
                  <p className="text-xl font-semibold truncate">{tripInsights.favoriteDestination}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Upcoming Trips</p>
                  <p className="text-xl font-semibold flex items-center gap-1"><TrendingUp className="h-4 w-4 text-primary" />{tripInsights.upcomingTrips}</p>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium">My Trips Overview</p>
                  <Button variant="link" size="sm" onClick={() => navigate('/my-trips')} className="h-auto p-0">
                    View All
                  </Button>
                </div>
                {isLoadingTrips ? (
                  <div className="py-6 flex justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : tripHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No trips yet. Start planning to unlock your travel insights.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-auto pr-1">
                    {tripHistory.slice(0, 8).map((trip) => (
                      <div key={trip._id} className="rounded-lg border p-3 flex items-center justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">{trip.source} → {trip.destination}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(trip.startDate).toLocaleDateString()} to {new Date(trip.endDate).toLocaleDateString()} • {trip.travelers} traveler(s)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-primary">{formatINR(trip.selectedPlan?.totalCost || 0)}</p>
                          <Badge variant="outline" className="text-xs capitalize">{trip.status || 'saved'}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-400/10 border-none">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-white dark:border-gray-800 shadow-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-2xl bg-primary text-white">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="text-center md:text-left flex-1">
                  <h1 className="text-2xl font-bold text-foreground dark:text-white">
                    {user.name}
                  </h1>
                  <p className="text-muted-foreground dark:text-gray-400">{user.email}</p>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                    <Badge variant="secondary" className="gap-1">
                      <Calendar className="h-3 w-3" />
                      Joined {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                    </Badge>
                    {user.savedTrips && user.savedTrips.length > 0 && (
                      <Badge variant="outline" className="gap-1">
                        <MapPin className="h-3 w-3" />
                        {user.savedTrips.length} Trips
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/plan-trip')}
                  >
                    Plan New Trip
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Save Message */}
        {saveMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${saveMessage.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              }`}
          >
            {saveMessage.type === 'success' ? (
              <Check className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            {saveMessage.text}
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4 hidden sm:block" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Lock className="h-4 w-4 hidden sm:block" />
                Security
              </TabsTrigger>
              <TabsTrigger value="preferences" className="gap-2">
                <Bell className="h-4 w-4 hidden sm:block" />
                Preferences
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          Full Name
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="Enter your full name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          disabled
                          className="bg-gray-50 dark:bg-gray-800"
                        />
                        <p className="text-xs text-muted-foreground">
                          Email cannot be changed
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          placeholder="+91 XXXXX XXXXX"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Password & Security</CardTitle>
                  <CardDescription>
                    Manage your password and security settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword" className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                          Current Password
                        </Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setPasswordData({ ...passwordData, currentPassword: e.target.value })
                          }
                          placeholder="Enter current password"
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="newPassword" className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            New Password
                          </Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setPasswordData({ ...passwordData, newPassword: e.target.value })
                            }
                            placeholder="Enter new password"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            Confirm Password
                          </Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                            }
                            placeholder="Confirm new password"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        variant="destructive"
                        disabled={isSaving || !passwordData.currentPassword || !passwordData.newPassword}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Changing...
                          </>
                        ) : (
                          'Change Password'
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                  <CardDescription>
                    Customize your app experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Theme */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        {theme === 'dark' ? (
                          <Moon className="h-4 w-4" />
                        ) : (
                          <Sun className="h-4 w-4" />
                        )}
                        Dark Mode
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Switch between light and dark themes
                      </p>
                    </div>
                    <Switch
                      checked={theme === 'dark'}
                      onCheckedChange={(checked: boolean) => setTheme(checked ? 'dark' : 'light')}
                    />
                  </div>

                  <Separator />

                  {/* Notifications */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Push Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications about your trips
                      </p>
                    </div>
                    <Switch
                      checked={preferences.notifications}
                      onCheckedChange={(checked: boolean) =>
                        setPreferences({ ...preferences, notifications: checked })
                      }
                    />
                  </div>

                  <Separator />

                  {/* Email Updates */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Updates
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive deals and travel tips via email
                      </p>
                    </div>
                    <Switch
                      checked={preferences.emailUpdates}
                      onCheckedChange={(checked: boolean) =>
                        setPreferences({ ...preferences, emailUpdates: checked })
                      }
                    />
                  </div>

                  <Separator />

                  {/* Currency */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Currency
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Set your preferred currency
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-base">
                      ₹ INR
                    </Badge>
                  </div>

                  <Separator />

                  <div className="flex justify-end">
                    <Button onClick={handleProfileUpdate} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Save Preferences
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Recent Trips Section (if any) */}
        {user.savedTrips && user.savedTrips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Your Saved Trips
                </CardTitle>
                <CardDescription>
                  View and manage your travel history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {tripHistory.slice(0, 3).map((trip) => (
                    <div key={trip._id} className="rounded-lg border p-4 space-y-2">
                      <p className="font-medium">{trip.source} → {trip.destination}</p>
                      <p className="text-xs text-muted-foreground">{new Date(trip.startDate).toLocaleDateString()} • {trip.travelers} traveler(s)</p>
                      <p className="text-sm text-primary font-semibold">{formatINR(trip.selectedPlan?.totalCost || 0)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
