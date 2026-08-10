import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Button, Input, Card } from '@design-system/components';
import { COLORS, SPACING } from '@design-system/theme';

export const RegisterScreen: React.FC = () => {
  const router = useRouter();
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleRegister = () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('All fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError(null);
    // Future registration flow
    router.replace('/(auth)/login');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Typography variant="h1" color={COLORS.primary.contrast} align="center">
            Join Rent_App
          </Typography>
        </View>

        <Card style={styles.card}>
          <Typography variant="h2" align="center" style={styles.cardTitle}>
            Create Account
          </Typography>

          {error && (
            <View style={styles.errorBox}>
              <Typography variant="caption" color={COLORS.status.maintenance} align="center">
                {error}
              </Typography>
            </View>
          )}

          <Input
            label="Full Name"
            placeholder="John Doe"
            value={fullName}
            onChangeText={setFullName}
          />

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

          <Input
            label="Confirm Password"
            placeholder="••••••••"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <Button
            title="Register"
            onPress={handleRegister}
            style={styles.submitBtn}
          />

          <Button
            title="Already have an account? Sign In"
            variant="ghost"
            onPress={() => router.back()}
            style={styles.backBtn}
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
  submitBtn: {
    marginTop: SPACING.md,
  },
  backBtn: {
    marginTop: SPACING.sm,
  },
});
