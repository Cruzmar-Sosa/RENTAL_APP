import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Typography, Button, Card } from '@design-system/components';
import { COLORS, SPACING, RADIUS } from '@design-system/theme';
import { useReservation } from '../hooks/useReservation';

export const ReservationCreationScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ bikeId: string; bikeCode?: string }>();
  const { createReservation, isLoading, error } = useReservation();

  const [paymentOption, setPaymentOption] = useState<'DEPOSIT' | 'FULL' | 'LATER'>('DEPOSIT');

  const bikeId = params.bikeId || '';
  const bikeCode = params.bikeCode || 'N/A';

  const handleCreate = async () => {
    if (!bikeId) return;
    try {
      const res = await createReservation({
        bikeId,
        paymentOption,
      });
      router.replace({ pathname: '/(app)/reservation/[id]', params: { id: res.id } });
    } catch {
      // Error handled by hook
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h1" color={COLORS.neutral.textPrimary} style={styles.title}>
        Reserve Bike #{bikeCode}
      </Typography>
      <Typography variant="caption" color={COLORS.neutral.textSecondary} style={styles.subtitle}>
        Confirm your reservation and payment option
      </Typography>

      {error ? (
        <View style={styles.errorBox}>
          <Typography variant="caption" color={COLORS.status.maintenance} align="center">
            {error}
          </Typography>
        </View>
      ) : null}

      <Card style={styles.card}>
        <Typography variant="h3" style={styles.cardTitle}>
          Select Payment Option
        </Typography>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.optionItem, paymentOption === 'DEPOSIT' && styles.optionSelected]}
          onPress={() => setPaymentOption('DEPOSIT')}
        >
          <View>
            <Typography variant="body" weight="bold">
              Pay 20% Deposit Now
            </Typography>
            <Typography variant="caption" color={COLORS.neutral.textSecondary}>
              Hold bike now, pay remaining balance post-ride.
            </Typography>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.optionItem, paymentOption === 'FULL' && styles.optionSelected]}
          onPress={() => setPaymentOption('FULL')}
        >
          <View>
            <Typography variant="body" weight="bold">
              Pay Full Estimated Rate
            </Typography>
            <Typography variant="caption" color={COLORS.neutral.textSecondary}>
              Upfront payment for estimated rental duration.
            </Typography>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.optionItem, paymentOption === 'LATER' && styles.optionSelected]}
          onPress={() => setPaymentOption('LATER')}
        >
          <View>
            <Typography variant="body" weight="bold">
              Pay Later (15 min Hold)
            </Typography>
            <Typography variant="caption" color={COLORS.neutral.textSecondary}>
              Holds bike for 15 minutes without immediate charge.
            </Typography>
          </View>
        </TouchableOpacity>
      </Card>

      <Card style={styles.summaryCard}>
        <Typography variant="h3" style={styles.cardTitle}>
          Summary
        </Typography>

        <View style={styles.summaryRow}>
          <Typography variant="body" color={COLORS.neutral.textSecondary}>
            Bike
          </Typography>
          <Typography variant="body" weight="bold">
            #{bikeCode}
          </Typography>
        </View>

        <View style={styles.summaryRow}>
          <Typography variant="body" color={COLORS.neutral.textSecondary}>
            Rate per Hour
          </Typography>
          <Typography variant="body" weight="bold">
            $50.00 / hr
          </Typography>
        </View>
      </Card>

      <Button
        title="Confirm Reservation"
        onPress={handleCreate}
        isLoading={isLoading}
        style={styles.confirmBtn}
      />

      <Button
        title="Cancel"
        variant="ghost"
        onPress={() => router.back()}
        style={styles.cancelBtn}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.neutral.background,
  },
  content: {
    padding: SPACING.lg,
  },
  title: {
    marginTop: SPACING.lg,
  },
  subtitle: {
    marginBottom: SPACING.lg,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: SPACING.sm,
    borderRadius: SPACING.xs,
    marginBottom: SPACING.md,
  },
  card: {
    marginBottom: SPACING.md,
  },
  summaryCard: {
    marginBottom: SPACING.xl,
  },
  cardTitle: {
    marginBottom: SPACING.md,
  },
  optionItem: {
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.neutral.border,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  optionSelected: {
    borderColor: COLORS.primary.main,
    backgroundColor: '#F0FDFA',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  confirmBtn: {
    marginBottom: SPACING.sm,
  },
  cancelBtn: {
    marginBottom: SPACING.xl,
  },
});
