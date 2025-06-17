import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { insertTimerSettingsSchema, type TimerSettings } from '@shared/schema';

const formSchema = insertTimerSettingsSchema.extend({
  focusDuration: z.number().min(15).max(60),
  shortBreakDuration: z.number().min(1).max(15),
  longBreakDuration: z.number().min(15).max(30),
  longBreakAfter: z.number().min(2).max(8),
});

type FormData = z.infer<typeof formSchema>;

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
        description: 'Your timer settings have been updated.',
      });
      onOpenChange(false);
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

  const handleClose = () => {
    if (settings) {
      form.reset(settings);
    }
    onOpenChange(false);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Timer Settings</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Focus Duration */}
            <FormField
              control={form.control}
              name="focusDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Focus Duration</FormLabel>
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
                    <span className="text-sm font-medium w-16">
                      {field.value} min
                    </span>
                  </div>
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
                  <FormLabel>Short Break</FormLabel>
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
                    <span className="text-sm font-medium w-16">
                      {field.value} min
                    </span>
                  </div>
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
                  <FormLabel>Long Break</FormLabel>
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
                    <span className="text-sm font-medium w-16">
                      {field.value} min
                    </span>
                  </div>
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
                    <span className="text-sm font-medium w-20">
                      {field.value} sessions
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Auto-start Breaks */}
            <FormField
              control={form.control}
              name="autoStartBreaks"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel>Auto-start breaks</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Auto-start Pomodoros */}
            <FormField
              control={form.control}
              name="autoStartPomodoros"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel>Auto-start focus sessions</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Desktop Notifications */}
            <FormField
              control={form.control}
              name="notificationsEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel>Desktop notifications</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Sound Notifications */}
            <FormField
              control={form.control}
              name="soundEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel>Sound notifications</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={updateSettingsMutation.isPending}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateSettingsMutation.isPending}
                className="flex-1"
              >
                {updateSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
