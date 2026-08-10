import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Button, Input, Card } from '@design-system/components';
import { COLORS, SPACING } from '@design-system/theme';
import { useAuth } from '../hooks/useAuth';

export const LoginScreen: React.FC = () => {
  const router = useRouter();
  const { login, isLoading, error } = useAuth();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setValidationError('Please enter both email and password.');
      return;
    }
    setValidationError(null);

    try {
      await login({ email: email.trim(), pass: password });
      router.replace('/(app)/map');
    } catch {
      // Error handled by hook
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Typography variant="h1" color={COLORS.primary.contrast} align="center">
            Rent_App
          </Typography>
          <Typography variant="subtitle" color="rgba(255,255,255,0.8)" align="center" style={styles.tagline}>
            Bike Rental Platform
          </Typography>
        </View>

        <Card style={styles.card}>
          <Typography variant="h2" align="center" style={styles.cardTitle}>
            Sign In
          </Typography>

          {(validationError || error) && (
            <View style={styles.errorBox}>
              <Typography variant="caption" color={COLORS.status.maintenance} align="center">
                {validationError || error}
              </Typography>
            </View>
          )}

          <Input
            label="Email"
            placeholder="user@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Input
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Button
            title="Sign In"
            onPress={handleLogin}
            isLoading={isLoading}
            style={styles.loginBtn}
          />

          <Button
            title="Create an account"
            variant="ghost"
            onPress={() => router.push('/(auth)/register')}
            style={styles.registerBtn}
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary.main,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  tagline: {
    marginTop: SPACING.xs,
  },
  card: {
    padding: SPACING.xl,
  },
  cardTitle: {
    marginBottom: SPACING.lg,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: SPACING.sm,
    borderRadius: SPACING.xs,
    marginBottom: SPACING.md,
  },
  loginBtn: {
    marginTop: SPACING.md,
  },
  registerBtn: {
    marginTop: SPACING.sm,
  },
});
