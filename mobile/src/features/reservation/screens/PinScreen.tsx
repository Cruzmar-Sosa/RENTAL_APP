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

  useEffect(() => {
    if (id) {
      getPin(id).then(setPin).catch(() => {});
    }
  }, [id]);

  const handleBack = () => {
    safeGoBack(router, id ? `/(app)/reservation/${id}` : '/(app)/map');
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
          Station Unlock PIN
        </Typography>
        <Typography variant="body" color={COLORS.neutral.textSecondary} align="center" style={styles.subtitle}>
          Present this 6-digit code to the station operator or enter it on the dock console to unlock your bike.
        </Typography>

        {isLoading ? (
          <Loading message="Generating single-use PIN..." />
        ) : pin ? (
          <View style={styles.pinContainer}>
            <Typography variant="caption" color={COLORS.neutral.textSecondary} style={styles.pinLabel}>
              ONE-TIME PICKUP PIN
            </Typography>
            <Typography variant="h1" color={COLORS.primary.light} align="center" style={styles.pinText}>
              {pin}
            </Typography>
          </View>
        ) : (
          <Typography variant="caption" color={COLORS.status.maintenance} align="center">
            {error || 'Could not retrieve PIN. Please retry.'}
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
  backBtn: {
    marginTop: SPACING.sm,
  },
});
