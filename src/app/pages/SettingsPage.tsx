import Navigation from '../components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import {
    Bell,
    Moon,
    Globe,
    Shield,
    Trash2,
    Save,
    Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import { toast } from 'sonner';

export default function SettingsPage() {
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState({
        notifications: user?.preferences?.notifications ?? true,
        emailUpdates: user?.preferences?.emailUpdates ?? true,
        darkMode: document.documentElement.classList.contains('dark'),
        language: 'en',
    });

    const handleToggle = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // TODO: Call API to save settings
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success('Settings saved successfully!');
        } catch (error) {
            toast.error('Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-muted/30 dark:bg-background pb-20">
            <Navigation />

            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Settings</h1>
                    <p className="text-muted-foreground">Manage your app preferences</p>
                </div>

                <div className="space-y-6">
                    {/* Notifications */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                Notifications
                            </CardTitle>
                            <CardDescription>Manage how you receive notifications</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="push-notifications">Push Notifications</Label>
                                <Switch
                                    id="push-notifications"
                                    checked={settings.notifications}
                                    onCheckedChange={() => handleToggle('notifications')}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="email-updates">Email Updates</Label>
                                <Switch
                                    id="email-updates"
                                    checked={settings.emailUpdates}
                                    onCheckedChange={() => handleToggle('emailUpdates')}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Appearance */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Moon className="h-5 w-5" />
                                Appearance
                            </CardTitle>
                            <CardDescription>Customize the look of the app</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="dark-mode">Dark Mode</Label>
                                <Switch
                                    id="dark-mode"
                                    checked={settings.darkMode}
                                    onCheckedChange={() => handleToggle('darkMode')}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Language */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="h-5 w-5" />
                                Language & Region
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <Label>Language</Label>
                                <span className="text-muted-foreground">English (India)</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Privacy */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Privacy & Security
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button variant="outline" className="w-full justify-start">
                                Change Password
                            </Button>
                            <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Account
                            </Button>
                        </CardContent>
                    </Card>

                    <Separator />

                    <Button onClick={handleSave} disabled={isSaving} className="w-full">
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Settings
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
