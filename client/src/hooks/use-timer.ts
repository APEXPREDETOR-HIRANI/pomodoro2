import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotifications } from './use-notifications';
import { audioManager } from '@/lib/audio';
import { localStorageManager } from '@/lib/storage';
import type { TimerState, SessionType } from '@/types/timer';
import type { TimerSettings } from '@shared/schema';

export function useTimer() {
  const queryClient = useQueryClient();
  const { showNotification } = useNotifications();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [timerState, setTimerState] = useState<TimerState>(() => {
    const saved = localStorageManager.getSessionState();
    return saved || {
      isRunning: false,
      isPaused: false,
      currentTime: 25 * 60, // 25 minutes in seconds
      totalTime: 25 * 60,
      sessionType: 'focus' as SessionType,
      sessionNumber: 1,
      currentTaskId: localStorageManager.getCurrentTask(),
    };
  });

  // Fetch timer settings
  const { data: settings } = useQuery<TimerSettings>({
    queryKey: ['/api/settings'],
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });
      if (!response.ok) throw new Error('Failed to create session');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
    },
  });

  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const response = await fetch(`/api/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update session');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
    },
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorageManager.setSessionState(timerState);
  }, [timerState]);

  // Timer tick effect
  useEffect(() => {
    if (timerState.isRunning && !timerState.isPaused) {
      intervalRef.current = setInterval(() => {
        setTimerState(prev => {
          if (prev.currentTime <= 0) {
            return prev;
          }
          return {
            ...prev,
            currentTime: prev.currentTime - 1,
          };
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState.isRunning, timerState.isPaused]);

  // Handle session completion
  useEffect(() => {
    if (timerState.isRunning && timerState.currentTime === 0) {
      handleSessionComplete();
    }
  }, [timerState.currentTime, timerState.isRunning]);

  const handleSessionComplete = useCallback(() => {
    const isBreakSession = timerState.sessionType !== 'focus';
    
    // Play completion sound
    if (settings?.soundEnabled) {
      audioManager.playSessionComplete();
    }

    // Show notification
    if (settings?.notificationsEnabled) {
      const message = isBreakSession 
        ? 'Break time is over! Ready to focus?' 
        : 'Great work! Time for a break.';
      showNotification('Pomodoro Session Complete', {
        body: message,
        tag: 'pomodoro-complete',
      });
    }

    // Update session in database
    if (currentSessionRef.current) {
      updateSessionMutation.mutate({
        id: currentSessionRef.current,
        updates: { completed: true },
      });
    }

    // Auto-progress to next session
    const shouldAutoStart = isBreakSession 
      ? settings?.autoStartPomodoros 
      : settings?.autoStartBreaks;

    const nextSessionType = getNextSessionType();
    const nextDuration = getSessionDuration(nextSessionType);

    setTimerState(prev => ({
      ...prev,
      isRunning: shouldAutoStart || false,
      isPaused: false,
      currentTime: nextDuration * 60,
      totalTime: nextDuration * 60,
      sessionType: nextSessionType,
      sessionNumber: nextSessionType === 'focus' ? prev.sessionNumber + 1 : prev.sessionNumber,
    }));

    // Create new session
    if (shouldAutoStart) {
      startNewSession(nextSessionType, nextDuration);
    }
  }, [timerState, settings, showNotification, updateSessionMutation]);

  const currentSessionRef = useRef<number | null>(null);

  const getNextSessionType = (): SessionType => {
    if (timerState.sessionType === 'focus') {
      // After focus, decide between short and long break
      const completedPomodoros = timerState.sessionNumber;
      const longBreakAfter = settings?.longBreakAfter || 4;
      
      return completedPomodoros % longBreakAfter === 0 ? 'long_break' : 'short_break';
    }
    return 'focus'; // After any break, return to focus
  };

  const getSessionDuration = (sessionType: SessionType): number => {
    switch (sessionType) {
      case 'focus':
        return settings?.focusDuration || 25;
      case 'short_break':
        return settings?.shortBreakDuration || 5;
      case 'long_break':
        return settings?.longBreakDuration || 15;
      default:
        return 25;
    }
  };

  const startNewSession = (sessionType: SessionType, duration: number) => {
    createSessionMutation.mutate({
      taskId: timerState.currentTaskId,
      type: sessionType,
      duration,
      completed: false,
    }, {
      onSuccess: (session) => {
        currentSessionRef.current = session.id;
      },
    });
  };

  const startTimer = useCallback(() => {
    if (!timerState.isRunning) {
      // Starting a new session
      startNewSession(timerState.sessionType, Math.floor(timerState.totalTime / 60));
    }
    
    setTimerState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
    }));
  }, [timerState.isRunning, timerState.sessionType, timerState.totalTime]);

  const pauseTimer = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      isPaused: true,
    }));
  }, []);

  const resetTimer = useCallback(() => {
    const duration = getSessionDuration(timerState.sessionType);
    
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      currentTime: duration * 60,
      totalTime: duration * 60,
    }));

    currentSessionRef.current = null;
  }, [timerState.sessionType, settings]);

  const skipSession = useCallback(() => {
    handleSessionComplete();
  }, [handleSessionComplete]);

  const setCurrentTask = useCallback((taskId: number | null) => {
    setTimerState(prev => ({
      ...prev,
      currentTaskId: taskId,
    }));
    localStorageManager.setCurrentTask(taskId);
  }, []);

  const switchSessionType = useCallback((sessionType: SessionType) => {
    const duration = getSessionDuration(sessionType);
    
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      currentTime: duration * 60,
      totalTime: duration * 60,
      sessionType,
    }));

    currentSessionRef.current = null;
  }, [settings]);

  return {
    timerState,
    settings,
    startTimer,
    pauseTimer,
    resetTimer,
    skipSession,
    setCurrentTask,
    switchSessionType,
    isLoading: createSessionMutation.isPending || updateSessionMutation.isPending,
  };
}
