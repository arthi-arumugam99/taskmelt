import { useEffect, useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { Session, User } from '@supabase/supabase-js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
}

const extractTokensFromUrl = (url: string): { accessToken: string; refreshToken: string; type: string } | null => {
  try {
    const hashIndex = url.indexOf('#');
    const queryIndex = url.indexOf('?');
    let params: URLSearchParams | null = null;
    if (hashIndex !== -1) {
      const hash = url.substring(hashIndex + 1);
      params = new URLSearchParams(hash);
    } else if (queryIndex !== -1) {
      const query = url.substring(queryIndex + 1);
      params = new URLSearchParams(query);
    }
    if (!params) return null;
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type = params.get('type') || 'unknown';
    if (accessToken && refreshToken) {
      return { accessToken, refreshToken, type };
    }
    return null;
  } catch (error) {
    console.log('Auth: Error parsing URL tokens:', error);
    return null;
  }
};

export const [AuthProvider, useAuth] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isInitialized: false,
  });
  const isHandlingDeepLinkRef = useRef(false);

  const handleAuthDeepLink = useCallback(async (url: string) => {
    if (!supabase || isHandlingDeepLinkRef.current) {
      console.log('Auth: Skipping deep link');
      return;
    }
    if (!url.includes('access_token') && !url.includes('error')) {
      return;
    }
    console.log('Auth: Handling deep link URL:', url);
    isHandlingDeepLinkRef.current = true;
    try {
      const tokens = extractTokensFromUrl(url);
      if (tokens) {
        const { data, error } = await supabase.auth.setSession({
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
        });
        if (error) {
          Alert.alert('Authentication Error', 'Failed to verify your email.');
        } else if (data.session) {
          if (tokens.type === 'signup' || tokens.type === 'email') {
            Alert.alert('Email Verified!', 'Welcome to TaskMelt!', [{ text: 'OK', onPress: () => router.replace('/(tabs)/dump' as any) }]);
          } else {
            router.replace('/(tabs)/dump' as any);
          }
        }
      }
    } catch (error) {
      console.log('Auth: Exception:', error);
    } finally {
      isHandlingDeepLinkRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const handleInitialUrl = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) handleAuthDeepLink(initialUrl);
    };
    handleInitialUrl();
    const subscription = Linking.addEventListener('url', (event) => handleAuthDeepLink(event.url));
    return () => subscription.remove();
  }, [handleAuthDeepLink]);

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

        

        queryClient.invalidateQueries({ queryKey: ['customerInfo'] });
      }
    );

    return () => subscription.unsubscribe();
  }, [queryClient]);

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
          emailRedirectTo: 'taskmelt://auth/callback',
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
        redirectTo: 'taskmelt://auth/callback',
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

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      if (!supabase) {
        throw new Error('Authentication not available. Please configure Supabase.');
      }
      console.log('Auth: Deleting account');

      // Call the Supabase function to delete the user account
      const { error } = await supabase.rpc('delete_user_account');
      if (error) throw error;

      // Sign out locally after account deletion
      await supabase.auth.signOut();
    },
    onSuccess: () => {
      console.log('Auth: Account deleted successfully');
      queryClient.clear();
    },
    onError: (error) => {
      console.log('Auth: Delete account error:', error);
    },
  });

  const { mutateAsync: signUpAsync } = signUpMutation;
  const { mutateAsync: signInAsync } = signInMutation;
  const { mutateAsync: signOutAsync } = signOutMutation;
  const { mutateAsync: resetPasswordAsync } = resetPasswordMutation;
  const { mutateAsync: deleteAccountAsync } = deleteAccountMutation;

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

  const deleteAccount = useCallback(async () => {
    return deleteAccountAsync();
  }, [deleteAccountAsync]);

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
    deleteAccount,
    isSigningUp: signUpMutation.isPending,
    isSigningIn: signInMutation.isPending,
    isSigningOut: signOutMutation.isPending,
    isResettingPassword: resetPasswordMutation.isPending,
    isDeletingAccount: deleteAccountMutation.isPending,
    signUpError: signUpMutation.error as Error | null,
    signInError: signInMutation.error as Error | null,
    signOutError: signOutMutation.error as Error | null,
    resetPasswordError: resetPasswordMutation.error as Error | null,
    deleteAccountError: deleteAccountMutation.error as Error | null,
  };
});
