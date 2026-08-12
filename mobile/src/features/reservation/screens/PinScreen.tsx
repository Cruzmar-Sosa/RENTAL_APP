import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Typography, Card, Button, Loading } from '@design-system/components';
import { COLORS, SPACING, RADIUS, SHADOWS } from '@design-system/theme';
import { useReservation } from '../hooks/useReservation';
import { safeGoBack } from '@core/navigation/safeGoBack';

export const PinScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPin, isLoading, error } = useReservation();
  const [pin, setPin] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      getPin(id)
        .then(setPin)
        .catch((err) => {
          const msg = err instanceof Error ? err.message : 'Could not retrieve PIN.';
          // If PIN was already verified (CHECKED_IN), inform the user instead of showing error
          if (msg.includes('already verified') || msg.includes('Cannot regenerate')) {
            setPinError('PIN already used — your reservation is already checked in. Proceed to Start Ride.');
          } else {
            setPinError(msg);
          }
        });
    }
  }, [id]);

  const handleBack = () => {
    safeGoBack(router, id ? `/(app)/reservation/${id}` : '/(app)/home');
  };

  return (
    <View style={styles.container}>
      <Card variant="glass" style={styles.card}>
        <View style={styles.securityHeader}>
          <Typography variant="caption" color={COLORS.primary.light} weight="bold" style={styles.securityBadge}>
            🔒 SECURE CHECK-IN CODE
          </Typography>
        </View>

        <Typography variant="h2" color={COLORS.neutral.textPrimary} align="center" style={styles.title}>
          Station Check-in PIN
        </Typography>
        <Typography variant="body" color={COLORS.neutral.textSecondary} align="center" style={styles.subtitle}>
          Show this 4-digit code to the station operator or admin to complete your bike check-in.
        </Typography>

        {isLoading ? (
          <Loading message="Generating check-in PIN..." />
        ) : pin ? (
          <View style={styles.pinContainer}>
            <Typography variant="caption" color={COLORS.neutral.textSecondary} style={styles.pinLabel}>
              CHECK-IN PIN
            </Typography>
            <Typography variant="h1" color={COLORS.primary.light} align="center" style={styles.pinText}>
              {pin}
            </Typography>
            <Typography variant="caption" color={COLORS.neutral.textSecondary} align="center" style={styles.pinHint}>
              Show this to your operator
            </Typography>
          </View>
        ) : (
          <Typography variant="caption" color={COLORS.status.maintenance} align="center">
            {pinError || error || 'Could not retrieve PIN. Please retry.'}
          </Typography>
        )}

        <Button
          title="Back to Reservation"
          variant="outline"
          onPress={handleBack}
          style={styles.backBtn}
        />
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.neutral.background,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    padding: SPACING.xl,
    backgroundColor: COLORS.neutral.surface,
  },
  securityHeader: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  securityBadge: {
    letterSpacing: 1,
  },
  title: {
    marginBottom: SPACING.xs,
  },
  subtitle: {
    marginBottom: SPACING.xl,
  },
  pinContainer: {
    backgroundColor: 'rgba(15, 118, 110, 0.15)',
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.primary.light,
    marginBottom: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.glowTeal,
  },
  pinLabel: {
    letterSpacing: 1.5,
    fontSize: 10,
    marginBottom: SPACING.xs,
  },
  pinText: {
    fontSize: 48,
    letterSpacing: 10,
    fontWeight: '800',
  },
  pinHint: {
    marginTop: SPACING.xs,
    opacity: 0.7,
  },
  backBtn: {
    marginTop: SPACING.sm,
  },
});
