import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper functions for common Supabase operations
export const supabaseHelpers = {
  // User operations
  async getUser(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Timer operations
  async saveTimer(userId: string, timerData: {
    duration: number;
    type: 'pomodoro' | 'short_break' | 'long_break';
    completed: boolean;
  }) {
    const { data, error } = await supabase
      .from('timers')
      .insert([
        {
          user_id: userId,
          ...timerData,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getTimerHistory(userId: string, limit = 10) {
    const { data, error } = await supabase
      .from('timers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Settings operations
  async getUserSettings(userId: string) {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateUserSettings(userId: string, settings: {
    pomodoro_duration?: number;
    short_break_duration?: number;
    long_break_duration?: number;
    long_break_interval?: number;
    auto_start_breaks?: boolean;
    auto_start_pomodoros?: boolean;
  }) {
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}; 