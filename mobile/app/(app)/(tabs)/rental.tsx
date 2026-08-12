import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useReservationStore } from '@application/stores/reservation.store';
import { Typography, Card, Button } from '@design-system/components';
import { COLORS, SPACING } from '@design-system/theme';

export default function RentalTabRoute() {
  const router = useRouter();
  const { activeReservation } = useReservationStore();

  useEffect(() => {
    if (activeReservation) {
      router.replace(`/(app)/reservation/${activeReservation.id}` as any);
    }
  }, [activeReservation, router]);

  if (activeReservation) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Card variant="glass" style={styles.card}>
        <Typography variant="h1" align="center" style={styles.emoji}>
          🚲
        </Typography>
        <Typography variant="h3" color={COLORS.neutral.textPrimary} align="center" weight="bold">
          No Active Rental
        </Typography>
        <Typography variant="body" color={COLORS.neutral.textSecondary} align="center">
          You do not have an active rental. Reserve a bike on the website to get started.
        </Typography>
        <Button
          title="Back to Home"
          variant="outline"
          onPress={() => router.replace('/(app)/(tabs)' as any)}
          style={{ marginTop: SPACING.md }}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.neutral.background,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md,
  },
  emoji: {
    fontSize: 48,
  },
});
