import type { TimerSettings } from "@shared/schema";

const STORAGE_KEYS = {
  TIMER_SETTINGS: 'pomodoro_timer_settings',
  CURRENT_TASK: 'pomodoro_current_task',
  SESSION_STATE: 'pomodoro_session_state',
} as const;

export class LocalStorageManager {
  setTimerSettings(settings: Partial<TimerSettings>) {
    try {
      localStorage.setItem(STORAGE_KEYS.TIMER_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save timer settings to localStorage:', error);
    }
  }

  getTimerSettings(): Partial<TimerSettings> | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TIMER_SETTINGS);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to load timer settings from localStorage:', error);
      return null;
    }
  }

  setCurrentTask(taskId: number | null) {
    try {
      if (taskId === null) {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_TASK);
      } else {
        localStorage.setItem(STORAGE_KEYS.CURRENT_TASK, taskId.toString());
      }
    } catch (error) {
      console.warn('Failed to save current task to localStorage:', error);
    }
  }

  getCurrentTask(): number | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_TASK);
      return stored ? parseInt(stored, 10) : null;
    } catch (error) {
      console.warn('Failed to load current task from localStorage:', error);
      return null;
    }
  }

  setSessionState(state: any) {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION_STATE, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save session state to localStorage:', error);
    }
  }

  getSessionState(): any | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SESSION_STATE);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to load session state from localStorage:', error);
      return null;
    }
  }

  clearAll() {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }
}

export const localStorageManager = new LocalStorageManager();
