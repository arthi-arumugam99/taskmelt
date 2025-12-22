import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

type AuthMode = 'signin' | 'signup' | 'forgot';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, signUp, resetPassword, isSigningIn, isSigningUp, isResettingPassword } = useAuth();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoading = isSigningIn || isSigningUp || isResettingPassword;

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (mode === 'forgot') {
      try {
        await resetPassword(email);
        Alert.alert(
          'Check your email',
          'We sent you a password reset link. Please check your inbox.',
          [{ text: 'OK', onPress: () => setMode('signin') }]
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send reset email');
      }
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      try {
        await signUp(email, password);
        Alert.alert(
          'Check your email',
          'We sent you a confirmation link. Please verify your email to continue.',
          [{ text: 'OK' }]
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create account');
      }
    } else {
      try {
        await signIn(email, password);
        router.replace('/(tabs)/dump');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to sign in');
      }
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'signup':
        return 'Create Account';
      case 'forgot':
        return 'Reset Password';
      default:
        return 'Welcome Back';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'signup':
        return 'Start organizing your thoughts today';
      case 'forgot':
        return "Enter your email and we'll send you a reset link";
      default:
        return 'Sign in to continue';
    }
  };

  const getButtonText = () => {
    if (isLoading) return '';
    switch (mode) {
      case 'signup':
        return 'Create Account';
      case 'forgot':
        return 'Send Reset Link';
      default:
        return 'Sign In';
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            testID="back-button"
          >
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>{getTitle()}</Text>
            <Text style={styles.subtitle}>{getSubtitle()}</Text>
          </View>

          <View style={styles.form}>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Mail size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                testID="email-input"
              />
            </View>

            {mode !== 'forgot' && (
              <View style={styles.inputContainer}>
                <Lock size={20} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  testID="password-input"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={Colors.textMuted} />
                  ) : (
                    <Eye size={20} color={Colors.textMuted} />
                  )}
                </TouchableOpacity>
              </View>
            )}

            {mode === 'signup' && (
              <View style={styles.inputContainer}>
                <Lock size={20} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm password"
                  placeholderTextColor={Colors.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  testID="confirm-password-input"
                />
              </View>
            )}

            {mode === 'signin' && (
              <TouchableOpacity
                onPress={() => {
                  setError(null);
                  setMode('forgot');
                }}
                style={styles.forgotButton}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
              testID="submit-button"
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>{getButtonText()}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.switchContainer}>
              {mode === 'forgot' ? (
                <TouchableOpacity
                  onPress={() => {
                    setError(null);
                    setMode('signin');
                  }}
                >
                  <Text style={styles.switchText}>
                    Back to <Text style={styles.switchLink}>Sign In</Text>
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setError(null);
                    setMode(mode === 'signin' ? 'signup' : 'signin');
                  }}
                >
                  <Text style={styles.switchText}>
                    {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                    <Text style={styles.switchLink}>
                      {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                    </Text>
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  form: {
    flex: 1,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    height: '100%',
  },
  eyeButton: {
    padding: 8,
    marginRight: -8,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: -8,
  },
  forgotText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600' as const,
  },
  switchContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  switchLink: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 32,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
