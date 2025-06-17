export type SessionType = 'focus' | 'short_break' | 'long_break';

export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  currentTime: number; // in seconds
  totalTime: number; // in seconds
  sessionType: SessionType;
  sessionNumber: number;
  currentTaskId?: number;
}

export interface TimerPreset {
  name: string;
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
}

export const DEFAULT_PRESETS: TimerPreset[] = [
  {
    name: "25/5 Classic",
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
  },
  {
    name: "45/15 Extended",
    focusDuration: 45,
    shortBreakDuration: 15,
    longBreakDuration: 30,
  },
  {
    name: "15/5 Short",
    focusDuration: 15,
    shortBreakDuration: 5,
    longBreakDuration: 15,
  },
];
