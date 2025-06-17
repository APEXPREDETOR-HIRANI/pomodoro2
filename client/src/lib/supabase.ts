import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://awcfbhamqbqyuuqhtage.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3Y2ZiaGFtcWJxeXV1cWh0YWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMTg0MzcsImV4cCI6MjA2NDc5NDQzN30.L6dTE2DTjWoldYjL4SQAVQVbVho5DFlS04O7qXRgQzw';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Test the connection
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session);
});

export type AuthUser = {
  id: string;
  email: string;
  created_at: string;
};

export type SignUpCredentials = {
  email: string;
  password: string;
};

export type SignInCredentials = {
  email: string;
  password: string;
}; 