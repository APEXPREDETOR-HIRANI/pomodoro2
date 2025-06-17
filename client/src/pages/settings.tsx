import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/use-notifications';
import { audioManager } from '@/lib/audio';
import { localStorageManager } from '@/lib/storage';
import { insertTimerSettingsSchema, type TimerSettings } from '@shared/schema';
import { 
  Settings as SettingsIcon, 
  Clock, 
  Bell, 
  Volume2, 
  Palette, 
  Database,
  Download,
  Upload,
  Trash2,
  Shield,
  Info
} from 'lucide-react';
import { useAuth } from '../App';
import { supabase } from '../lib/supabase';
import { useLocation } from 'wouter';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const formSchema = insertTimerSettingsSchema.extend({
  focusDuration: z.number().min(15).max(60),
  shortBreakDuration: z.number().min(1).max(15),
  longBreakDuration: z.number().min(15).max(30),
  longBreakAfter: z.number().min(2).max(8),
});

type FormData = z.infer<typeof formSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { permission, requestPermission } = useNotifications();
  const [activeTab, setActiveTab] = useState('timer');
  const { signOut } = useAuth();
  const [, setLocation] = useLocation();
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch current settings
  const { data: settings, isLoading } = useQuery<TimerSettings>({
    queryKey: ['/api/settings'],
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<FormData>) => {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: 'Settings saved',
        description: 'Your preferences have been updated successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: settings || {
      focusDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      autoStartBreaks: false,
      autoStartPomodoros: false,
      notificationsEnabled: true,
      soundEnabled: true,
      longBreakAfter: 4,
    },
  });

  // Update form when settings load
  React.useEffect(() => {
    if (settings) {
      form.reset(settings);
    }
  }, [settings, form]);

  const handleSubmit = (data: FormData) => {
    updateSettingsMutation.mutate(data);
  };

  const handleTestSound = () => {
    audioManager.playSessionComplete();
  };

  const handleRequestNotifications = async () => {
    const result = await requestPermission();
    if (result === 'granted') {
      toast({
        title: 'Notifications enabled',
        description: 'You will now receive desktop notifications.',
      });
    } else {
      toast({
        title: 'Notifications blocked',
        description: 'Please enable notifications in your browser settings.',
        variant: 'destructive',
      });
    }
  };

  const handleExportData = () => {
    try {
      // Get all data from localStorage
      const data = {
        settings: localStorageManager.getTimerSettings(),
        currentTask: localStorageManager.getCurrentTask(),
        sessionState: localStorageManager.getSessionState(),
        exportDate: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pomodoro-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Data exported',
        description: 'Your data has been downloaded successfully.',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export your data. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all local data? This action cannot be undone.')) {
      localStorageManager.clearAll();
      toast({
        title: 'Data cleared',
        description: 'All local data has been removed.',
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      const { error } = await supabase.auth.admin.deleteUser(
        (await supabase.auth.getUser()).data.user?.id || ''
      );
      
      if (error) throw error;
      
      await signOut();
      toast({
        title: "Account deleted",
        description: "Your account has been successfully deleted.",
      });
      setLocation('/signin');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex bg-background">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </main>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-6 pb-20 lg:pb-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center space-x-3">
              <SettingsIcon className="w-8 h-8" />
              <span>Settings</span>
            </h1>
            <p className="text-muted-foreground">
              Customize your Pomodoro experience and manage your preferences
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="timer" className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Timer</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center space-x-2">
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center space-x-2">
                <Database className="w-4 h-4" />
                <span>Data</span>
              </TabsTrigger>
              <TabsTrigger value="about" className="flex items-center space-x-2">
                <Info className="w-4 h-4" />
                <span>About</span>
              </TabsTrigger>
            </TabsList>

            {/* Timer Settings */}
            <TabsContent value="timer" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Timer Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                      {/* Focus Duration */}
                      <FormField
                        control={form.control}
                        name="focusDuration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Focus Session Duration</FormLabel>
                            <div className="flex items-center space-x-4">
                              <FormControl>
                                <Slider
                                  min={15}
                                  max={60}
                                  step={5}
                                  value={[field.value]}
                                  onValueChange={(value) => field.onChange(value[0])}
                                  className="flex-1"
                                />
                              </FormControl>
                              <Badge variant="secondary" className="w-20 justify-center">
                                {field.value} min
                              </Badge>
                            </div>
                            <FormDescription>
                              The length of your focus sessions (15-60 minutes)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Short Break Duration */}
                      <FormField
                        control={form.control}
                        name="shortBreakDuration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Short Break Duration</FormLabel>
                            <div className="flex items-center space-x-4">
                              <FormControl>
                                <Slider
                                  min={1}
                                  max={15}
                                  step={1}
                                  value={[field.value]}
                                  onValueChange={(value) => field.onChange(value[0])}
                                  className="flex-1"
                                />
                              </FormControl>
                              <Badge variant="secondary" className="w-20 justify-center">
                                {field.value} min
                              </Badge>
                            </div>
                            <FormDescription>
                              Short breaks between focus sessions (1-15 minutes)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Long Break Duration */}
                      <FormField
                        control={form.control}
                        name="longBreakDuration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Long Break Duration</FormLabel>
                            <div className="flex items-center space-x-4">
                              <FormControl>
                                <Slider
                                  min={15}
                                  max={30}
                                  step={5}
                                  value={[field.value]}
                                  onValueChange={(value) => field.onChange(value[0])}
                                  className="flex-1"
                                />
                              </FormControl>
                              <Badge variant="secondary" className="w-20 justify-center">
                                {field.value} min
                              </Badge>
                            </div>
                            <FormDescription>
                              Longer breaks after multiple focus sessions (15-30 minutes)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Long Break After */}
                      <FormField
                        control={form.control}
                        name="longBreakAfter"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Long Break After</FormLabel>
                            <div className="flex items-center space-x-4">
                              <FormControl>
                                <Slider
                                  min={2}
                                  max={8}
                                  step={1}
                                  value={[field.value]}
                                  onValueChange={(value) => field.onChange(value[0])}
                                  className="flex-1"
                                />
                              </FormControl>
                              <Badge variant="secondary" className="w-24 justify-center">
                                {field.value} sessions
                              </Badge>
                            </div>
                            <FormDescription>
                              Number of focus sessions before a long break
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator />

                      {/* Auto-start Options */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Auto-Start Options</h3>
                        
                        <FormField
                          control={form.control}
                          name="autoStartBreaks"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <FormLabel>Auto-start breaks</FormLabel>
                                <FormDescription>
                                  Automatically start break sessions when focus sessions end
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="autoStartPomodoros"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <FormLabel>Auto-start focus sessions</FormLabel>
                                <FormDescription>
                                  Automatically start focus sessions when breaks end
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={updateSettingsMutation.isPending}
                        className="w-full"
                      >
                        {updateSettingsMutation.isPending ? 'Saving...' : 'Save Timer Settings'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Settings */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Desktop Notifications */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Desktop Notifications</label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications when sessions start and end
                      </p>
                      <Badge variant={permission === 'granted' ? 'default' : 'secondary'}>
                        {permission === 'granted' ? 'Enabled' : 
                         permission === 'denied' ? 'Blocked' : 'Not Requested'}
                      </Badge>
                    </div>
                    {permission !== 'granted' && (
                      <Button onClick={handleRequestNotifications}>
                        Enable Notifications
                      </Button>
                    )}
                  </div>

                  <Separator />

                  {/* Sound Notifications */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Sound Notifications</label>
                        <p className="text-sm text-muted-foreground">
                          Play audio alerts for session transitions
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleTestSound}
                        >
                          <Volume2 className="w-4 h-4 mr-2" />
                          Test Sound
                        </Button>
                        <Switch
                          checked={settings?.soundEnabled || false}
                          onCheckedChange={(checked) => {
                            updateSettingsMutation.mutate({ soundEnabled: checked });
                            audioManager.setEnabled(checked);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Data Management */}
            <TabsContent value="data" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Data Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Export Data */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Export Data</label>
                      <p className="text-sm text-muted-foreground">
                        Download your settings and session data as JSON
                      </p>
                    </div>
                    <Button onClick={handleExportData} variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>

                  <Separator />

                  {/* Clear Data */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Clear All Data</label>
                      <p className="text-sm text-muted-foreground">
                        Remove all local settings and session data
                      </p>
                    </div>
                    <Button onClick={handleClearData} variant="destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear Data
                    </Button>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Shield className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Privacy Notice</p>
                        <p className="text-sm text-muted-foreground">
                          All your data is stored locally in your browser. We don't collect or store any personal information on our servers.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* About */}
            <TabsContent value="about" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>About PomodoroFlow</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Version</h3>
                      <p className="text-sm text-muted-foreground">1.0.0</p>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">About the Pomodoro Technique</h3>
                      <p className="text-sm text-muted-foreground">
                        The Pomodoro Technique is a time management method developed by Francesco Cirillo in the late 1980s. 
                        It uses a timer to break work into intervals, traditionally 25 minutes in length, separated by short breaks.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Features</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Customizable timer intervals</li>
                        <li>• Task management and tracking</li>
                        <li>• Productivity analytics</li>
                        <li>• Desktop and audio notifications</li>
                        <li>• Responsive design for all devices</li>
                        <li>• Local data storage for privacy</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Keyboard Shortcuts</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Start/Pause Timer</span>
                          <Badge variant="outline">Space</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reset Timer</span>
                          <Badge variant="outline">R</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Skip Session</span>
                          <Badge variant="outline">S</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Account Settings Section */}
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
            
            {/* Sign Out Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  Sign Out
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign Out</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to sign out? You will need to sign in again to access your account.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSignOut}>
                    Sign Out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Delete Account Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Account</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account
                    and remove all your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? "Deleting..." : "Delete Account"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
