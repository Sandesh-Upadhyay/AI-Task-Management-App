import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: any | null;
  isLoading: boolean;
  error: string | null;
  
  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithMagicLink: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  
  // Profile actions
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: any) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  error: null,
  
  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      // Profile will be fetched by the auth state change listener
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  signUp: async (email, password, fullName) => {
    try {
      set({ isLoading: true, error: null });
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      
      if (error) throw error;
      
      // Profile will be created by the database trigger
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  loginWithGoogle: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  loginWithMagicLink: async (email) => {
    try {
      set({ isLoading: true, error: null });
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
      
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  logout: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      set({ user: null, profile: null, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  fetchProfile: async () => {
    const { user } = get();
    
    if (!user) {
      set({ profile: null });
      return;
    }
    
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      set({ profile: data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  updateProfile: async (updates) => {
    const { user } = get();
    
    if (!user) return;
    
    try {
      set({ isLoading: true, error: null });
      
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Refresh profile
      await get().fetchProfile();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
}));

// Set up auth state listener
supabase.auth.onAuthStateChange(async (event, session) => {
  const authStore = useAuthStore.getState();
  
  if (session?.user) {
    useAuthStore.setState({ user: session.user, isLoading: false });
    await authStore.fetchProfile();
  } else {
    useAuthStore.setState({ user: null, profile: null, isLoading: false });
  }
});

// Initialize by getting the current session
supabase.auth.getSession().then(({ data: { session } }) => {
  const authStore = useAuthStore.getState();
  
  if (session?.user) {
    useAuthStore.setState({ user: session.user, isLoading: false });
    authStore.fetchProfile();
  } else {
    useAuthStore.setState({ isLoading: false });
  }
});