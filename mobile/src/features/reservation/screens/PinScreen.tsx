import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Typography, Card, Button, Loading } from '@design-system/components';
import { COLORS, SPACING, RADIUS } from '@design-system/theme';
import { useReservation } from '../hooks/useReservation';

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

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Typography variant="h2" align="center" style={styles.title}>
          Check-in PIN
        </Typography>
        <Typography variant="body" color={COLORS.neutral.textSecondary} align="center" style={styles.subtitle}>
          Show this PIN code to the station operator to verify physical bike pickup.
        </Typography>

        {isLoading ? (
          <Loading message="Generating PIN..." />
        ) : pin ? (
          <View style={styles.pinContainer}>
            <Typography variant="h1" color={COLORS.primary.main} align="center" style={styles.pinText}>
              {pin}
            </Typography>
          </View>
        ) : (
          <Typography variant="caption" color={COLORS.status.maintenance} align="center">
            {error || 'Could not retrieve PIN'}
          </Typography>
        )}

        <Button
          title="Back to Reservation"
          variant="outline"
          onPress={() => router.back()}
          style={styles.backBtn}
        />
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary.main,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    padding: SPACING.xl,
  },
  title: {
    marginBottom: SPACING.xs,
  },
  subtitle: {
    marginBottom: SPACING.xl,
  },
  pinContainer: {
    backgroundColor: '#F0FDFA',
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.primary.main,
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  pinText: {
    fontSize: 48,
    letterSpacing: 8,
  },
  backBtn: {
    marginTop: SPACING.md,
  },
});
