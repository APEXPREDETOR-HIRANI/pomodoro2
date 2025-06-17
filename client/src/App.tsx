import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import TimerPage from "@/pages/timer";
import AnalyticsPage from "@/pages/analytics";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";
import SignUp from "@/pages/SignUp";
import SignIn from "@/pages/SignIn";
import ResetPassword from "@/pages/ResetPassword";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase, AuthUser } from "./lib/supabase";
import './App.css';

// Auth Context
// Create auth context
interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// Auth Callback Component
function AuthCallback() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash fragment from the URL
        const hash = window.location.hash;
        console.log('Auth callback hash:', hash);

        if (hash) {
          // Extract the access token from the hash
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const type = params.get('type');

          console.log('Auth callback params:', { accessToken, refreshToken, type });

          if (accessToken && refreshToken) {
            // Set the session using the tokens
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error('Error setting session:', error);
              setLocation('/signin?error=Authentication failed');
              return;
            }

            // Check if this is a password reset
            if (type === 'recovery') {
              setLocation('/auth/reset-password');
              return;
            }

            // For email confirmation or other auth types
            setLocation('/');
          } else {
            console.error('Missing tokens in callback');
            setLocation('/signin?error=Authentication failed');
          }
        } else {
          console.error('No hash found in callback URL');
          setLocation('/signin?error=Authentication failed');
        }
      } catch (err) {
        console.error('Error in auth callback:', err);
        setLocation('/signin?error=Authentication failed');
      }
    };

    handleAuthCallback();
  }, [setLocation]);

  return <div className="loading">Completing authentication...</div>;
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    console.log('Checking initial session...');
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session);
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          created_at: session.user.created_at,
        });
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          created_at: session.user.created_at,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setLocation('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

function Router() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <Switch>
      {!user ? (
        <>
          <Route path="/signup" component={SignUp} />
          <Route path="/signin" component={SignIn} />
          <Route path="/auth/reset-password" component={ResetPassword} />
          <Route path="/auth/callback" component={AuthCallback} />
          <Route path="/" component={SignIn} />
        </>
      ) : (
        <>
          <Route path="/" component={TimerPage} />
          <Route path="/analytics" component={AnalyticsPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/tasks" component={TimerPage} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
