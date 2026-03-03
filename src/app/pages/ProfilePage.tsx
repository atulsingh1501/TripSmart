import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useTheme } from '../components/ThemeProvider';

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
    <div className="min-h-screen bg-background py-8 px-4">
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

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-primary/10 via-blue-500/10 to-teal-500/10 border-none">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-white dark:border-gray-800 shadow-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-2xl bg-primary text-white">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="text-center md:text-left flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user.name}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
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
                          <User className="h-4 w-4 text-gray-500" />
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
                          <Mail className="h-4 w-4 text-gray-500" />
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          disabled
                          className="bg-gray-50 dark:bg-gray-800"
                        />
                        <p className="text-xs text-gray-500">
                          Email cannot be changed
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
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
                          <Lock className="h-4 w-4 text-gray-500" />
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
                            <Shield className="h-4 w-4 text-gray-500" />
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
                            <Shield className="h-4 w-4 text-gray-500" />
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
                      <p className="text-sm text-gray-500">
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
                      <p className="text-sm text-gray-500">
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
                      <p className="text-sm text-gray-500">
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
                      <p className="text-sm text-gray-500">
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
                  {/* Trip cards would go here */}
                  <div className="text-center text-gray-500 py-8 col-span-full">
                    <Plane className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Your trip history will appear here</p>
                  </div>
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
