import { useEffect, useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import Purchases from 'react-native-purchases';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isInitialized: false,
  });
  const isIdentifyingRef = useRef(false);
  const lastIdentifiedUserIdRef = useRef<string | null>(null);

  const identifyWithRevenueCat = useCallback(async (userId: string, email?: string | null) => {
    if (isIdentifyingRef.current || lastIdentifiedUserIdRef.current === userId) {
      console.log('RevenueCat: Skipping identification (already in progress or completed):', userId);
      return;
    }

    try {
      isIdentifyingRef.current = true;
      console.log('RevenueCat: Identifying user:', userId);
      await Purchases.logIn(userId);
      
      if (email) {
        try {
          await Purchases.setEmail(email);
        } catch (emailError: any) {
          if (emailError?.code === 16 || emailError?.message?.includes('another request in flight')) {
            console.log('RevenueCat: setEmail skipped (concurrent request):', emailError.message);
          } else {
            throw emailError;
          }
        }
      }
      
      lastIdentifiedUserIdRef.current = userId;
      console.log('RevenueCat: User identified successfully');
    } catch (error) {
      console.log('RevenueCat: Identify error:', error);
    } finally {
      isIdentifyingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      console.log('Auth: Supabase not available, running in offline mode');
      setAuthState({
        user: null,
        session: null,
        isLoading: false,
        isInitialized: true,
      });
      return;
    }

    console.log('Auth: Checking initial session...');
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Auth: Initial session:', session?.user?.email ?? 'none');
      setAuthState({
        user: session?.user ?? null,
        session,
        isLoading: false,
        isInitialized: true,
      });

      if (session?.user && Platform.OS !== 'web') {
        identifyWithRevenueCat(session.user.id, session.user.email);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth: State changed:', event, session?.user?.email ?? 'none');
        setAuthState(prev => ({
          ...prev,
          user: session?.user ?? null,
          session,
          isLoading: false,
        }));

        if (session?.user && Platform.OS !== 'web') {
          identifyWithRevenueCat(session.user.id, session.user.email);
        } else if (!session && Platform.OS !== 'web') {
          try {
            lastIdentifiedUserIdRef.current = null;
            await Purchases.logOut();
            console.log('RevenueCat: Logged out');
          } catch (error) {
            console.log('RevenueCat: Logout error (may be anonymous):', error);
          }
        }

        queryClient.invalidateQueries({ queryKey: ['customerInfo'] });
      }
    );

    return () => subscription.unsubscribe();
  }, [queryClient, identifyWithRevenueCat]);

  const signUpMutation = useMutation({
    mutationFn: async ({ email, password, name }: { email: string; password: string; name?: string }) => {
      if (!supabase) {
        throw new Error('Authentication not available. Please configure Supabase.');
      }
      console.log('Auth: Signing up:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'rork-app://auth',
          data: {
            full_name: name,
          },
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      console.log('Auth: Sign up successful:', data.user?.email);
    },
    onError: (error) => {
      console.log('Auth: Sign up error:', error);
    },
  });

  const signInMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      if (!supabase) {
        throw new Error('Authentication not available. Please configure Supabase.');
      }
      console.log('Auth: Signing in:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      console.log('Auth: Sign in successful:', data.user?.email);
    },
    onError: (error) => {
      console.log('Auth: Sign in error:', error);
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      if (!supabase) {
        throw new Error('Authentication not available. Please configure Supabase.');
      }
      console.log('Auth: Signing out');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      console.log('Auth: Sign out successful');
      queryClient.clear();
    },
    onError: (error) => {
      console.log('Auth: Sign out error:', error);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      if (!supabase) {
        throw new Error('Authentication not available. Please configure Supabase.');
      }
      console.log('Auth: Sending password reset to:', email);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'rork-app://auth',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      console.log('Auth: Password reset email sent');
    },
    onError: (error) => {
      console.log('Auth: Password reset error:', error);
    },
  });

  const { mutateAsync: signUpAsync } = signUpMutation;
  const { mutateAsync: signInAsync } = signInMutation;
  const { mutateAsync: signOutAsync } = signOutMutation;
  const { mutateAsync: resetPasswordAsync } = resetPasswordMutation;

  const signUp = useCallback(
    async (email: string, password: string, name?: string) => {
      return signUpAsync({ email, password, name });
    },
    [signUpAsync]
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      return signInAsync({ email, password });
    },
    [signInAsync]
  );

  const signOut = useCallback(async () => {
    return signOutAsync();
  }, [signOutAsync]);

  const resetPassword = useCallback(
    async (email: string) => {
      return resetPasswordAsync(email);
    },
    [resetPasswordAsync]
  );

  return {
    user: authState.user,
    session: authState.session,
    isLoading: authState.isLoading,
    isInitialized: authState.isInitialized,
    isAuthenticated: !!authState.session,
    signUp,
    signIn,
    signOut,
    resetPassword,
    isSigningUp: signUpMutation.isPending,
    isSigningIn: signInMutation.isPending,
    isSigningOut: signOutMutation.isPending,
    isResettingPassword: resetPasswordMutation.isPending,
    signUpError: signUpMutation.error as Error | null,
    signInError: signInMutation.error as Error | null,
    signOutError: signOutMutation.error as Error | null,
    resetPasswordError: resetPasswordMutation.error as Error | null,
  };
});
