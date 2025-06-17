import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { MobileDrawer } from '@/components/layout/mobile-drawer';
import { TimerDisplay } from '@/components/timer/timer-display';
import { TimerControls } from '@/components/timer/timer-controls';
import { SettingsModal } from '@/components/settings/settings-modal';
import { useTimer } from '@/hooks/use-timer';
import { useNotifications } from '@/hooks/use-notifications';
import { audioManager } from '@/lib/audio';
import { Menu, Settings, Volume2, VolumeX, Bell, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEFAULT_PRESETS } from '@/types/timer';
import type { Task, PomodoroSession } from '@shared/schema';

export default function TimerPage() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { 
    timerState, 
    settings, 
    startTimer, 
    pauseTimer, 
    resetTimer, 
    skipSession, 
    setCurrentTask,
    switchSessionType 
  } = useTimer();
  
  const { permission, requestPermission, showNotification } = useNotifications();

  // Fetch today's sessions for progress tracking
  const { data: todaySessions = [] } = useQuery<PomodoroSession[]>({
    queryKey: ['/api/sessions', { date: new Date().toISOString().split('T')[0] }],
  });

  // Request notification permission on mount
  useEffect(() => {
    if (permission === 'default') {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Update current task when selected
  useEffect(() => {
    if (selectedTask) {
      setCurrentTask(selectedTask.id);
    }
  }, [selectedTask, setCurrentTask]);

  const handlePlayPause = () => {
    if (timerState.isRunning && !timerState.isPaused) {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  const handleSoundToggle = () => {
    const newEnabled = !settings?.soundEnabled;
    audioManager.setEnabled(newEnabled);
    // This would normally update settings via mutation
  };

  const completedSessions = todaySessions.filter(s => s.completed);
  const focusSessions = completedSessions.filter(s => s.type === 'focus');
  const totalFocusTime = focusSessions.reduce((sum, s) => sum + s.duration, 0);

  const getSessionTypeDisplay = () => {
    switch (timerState.sessionType) {
      case 'focus':
        return { label: 'Focus Session', color: 'bg-primary text-primary-foreground' };
      case 'short_break':
        return { label: 'Short Break', color: 'bg-green-500 text-white' };
      case 'long_break':
        return { label: 'Long Break', color: 'bg-purple-500 text-white' };
      default:
        return { label: 'Focus Session', color: 'bg-primary text-primary-foreground' };
    }
  };

  const sessionDisplay = getSessionTypeDisplay();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <Sidebar 
        selectedTask={selectedTask}
        onTaskSelect={setSelectedTask}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="lg:hidden bg-card border-b border-border p-4">
          <div className="flex items-center justify-between">
            <MobileDrawer
              open={isMobileMenuOpen}
              onOpenChange={setIsMobileMenuOpen}
              selectedTask={selectedTask}
              onTaskSelect={setSelectedTask}
            >
              <Button
                variant="ghost"
                size="sm"
              >
                <Menu className="w-6 h-6" />
              </Button>
            </MobileDrawer>
            <h1 className="text-lg font-semibold">PomodoroFlow</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="w-6 h-6" />
            </Button>
          </div>
        </header>

        {/* Timer Section */}
        <div className="flex-1 flex items-center justify-center p-6 pb-20 lg:pb-6">
          <div className="max-w-2xl w-full">
            {/* Session Info */}
            <div className="text-center mb-8">
              <Badge className={cn("mb-4 text-sm font-medium", sessionDisplay.color)}>
                {sessionDisplay.label} #{timerState.sessionNumber}
              </Badge>
              
              {selectedTask ? (
                <>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {selectedTask.title}
                  </h2>
                  <p className="text-muted-foreground">
                    {selectedTask.description || 'Stay focused and make progress on your task'}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Ready to Focus?
                  </h2>
                  <p className="text-muted-foreground">
                    Select a task from the sidebar or start a general focus session
                  </p>
                </>
              )}
            </div>

            {/* Timer Display */}
            <TimerDisplay
              currentTime={timerState.currentTime}
              totalTime={timerState.totalTime}
              sessionType={timerState.sessionType}
              className="mb-8"
            />

            {/* Timer Controls */}
            <TimerControls
              isRunning={timerState.isRunning}
              isPaused={timerState.isPaused}
              onPlayPause={handlePlayPause}
              onReset={resetTimer}
              onSkip={skipSession}
              className="mb-8"
            />

            {/* Session Progress */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Today's Progress</h3>
                  <span className="text-sm text-muted-foreground">
                    {Math.floor(totalFocusTime / 60)}h {totalFocusTime % 60}m focused
                  </span>
                </div>

                {/* Progress Dots */}
                <div className="flex space-x-2 mb-4">
                  {[...Array(8)].map((_, i) => {
                    const isCompleted = i < focusSessions.length;
                    const isCurrent = i === focusSessions.length && timerState.isRunning && timerState.sessionType === 'focus';
                    
                    return (
                      <div
                        key={i}
                        className={cn(
                          "w-4 h-4 rounded-full transition-colors",
                          isCompleted && "bg-green-500",
                          isCurrent && "bg-primary animate-pulse",
                          !isCompleted && !isCurrent && "bg-muted"
                        )}
                      />
                    );
                  })}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {focusSessions.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {timerState.isRunning && timerState.sessionType === 'focus' ? 1 : 0}
                    </div>
                    <div className="text-sm text-muted-foreground">In Progress</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-muted-foreground">
                      {Math.max(0, 8 - focusSessions.length - (timerState.isRunning && timerState.sessionType === 'focus' ? 1 : 0))}
                    </div>
                    <div className="text-sm text-muted-foreground">Remaining</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Settings Bar */}
        <div className="bg-card border-t border-border p-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSoundToggle}
                className="flex items-center space-x-2"
              >
                {settings?.soundEnabled ? (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span>Sound On</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span>Sound Off</span>
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                {permission === 'granted' ? (
                  <>
                    <Bell className="w-4 h-4" />
                    <span>Notifications</span>
                  </>
                ) : (
                  <>
                    <BellOff className="w-4 h-4" />
                    <span>No Notifications</span>
                  </>
                )}
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Timer:</span>
              <Select defaultValue="25/5 Classic">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_PRESETS.map((preset) => (
                    <SelectItem key={preset.name} value={preset.name}>
                      {preset.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Settings Modal */}
      <SettingsModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </div>
  );
}
