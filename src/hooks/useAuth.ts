import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  clearOnboardingError: () => void;
}

// Helper function to transform database profile to User type
const transformProfileToUser = (profile: {
  id: string;
  full_name: string;
  email?: string;
  avatar?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;  // Allow other fields we don't use
}): User => ({
  id: profile.id,
  email: profile.email || '', // Fallback to empty string if not present
  name: profile.full_name,
  avatar: profile.avatar,
  createdAt: profile.created_at || new Date().toISOString(),
  updatedAt: profile.updated_at || new Date().toISOString(),
});

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearOnboardingError = () => {
    setError(null);
  };

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          console.log('Auth hook: User session found, fetching profile for:', session.user.id);
          // Fetch user profile data
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            console.log('Auth hook: Profile found, setting user:', profile);
            setUser(transformProfileToUser(profile));
          } else if (profileError?.code === 'PGRST116') {
            console.log('Auth hook: No profile found, creating temporary user from auth data');
            // Profile doesn't exist - create a temporary user from auth data
            // This avoids database permission issues
            const tempUser: User = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
              avatar: session.user.user_metadata?.avatar_url,
              createdAt: session.user.created_at,
              updatedAt: new Date().toISOString(),
            };
            
            console.log('Auth hook: Created temporary user:', tempUser);
            setUser(tempUser);
            
            // Mark this user as needing onboarding
            setError('NEEDS_ONBOARDING');
          } else {
            console.error('Error fetching profile:', profileError);
            setError('Failed to fetch user profile');
          }
        }
      } catch (err) {
        setError('Failed to get session');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            setUser(transformProfileToUser(profile));
          } else if (profileError?.code === 'PGRST116') {
            // Profile doesn't exist - create a temporary user from auth data
            const tempUser: User = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
              avatar: session.user.user_metadata?.avatar_url,
              createdAt: session.user.created_at,
              updatedAt: new Date().toISOString(),
            };
            
            setUser(tempUser);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
      throw err;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });
      
      if (error) throw error;
      
      // Create profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              name,
              email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ]);
        
        if (profileError) throw profileError;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    login,
    logout,
    register,
    clearOnboardingError,
  };
};
