import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Typography, Card, Button, Loading, EmptyState } from '@design-system/components';
import { COLORS, SPACING, RADIUS } from '@design-system/theme';
import { usePayments } from '../hooks/usePayments';
import { SettlementPreview } from '@domain/entities/Settlement';
import { safeGoBack } from '@core/navigation/safeGoBack';

export const SettlementPreviewScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getSettlementPreview, createPayment, isLoading, error } = usePayments();
  const [preview, setPreview] = useState<SettlementPreview | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      getSettlementPreview(id).then((res) => {
        if (res) setPreview(res);
      });
    }
  }, [id, getSettlementPreview]);

  const handlePayBalance = async () => {
    if (!preview || preview.calculation.balance <= 0) return;
    try {
      await createPayment(preview.reservationId, preview.calculation.balance);
      setPaymentSuccess(true);
      // Refresh preview to show zero balance
      const updated = await getSettlementPreview(preview.reservationId);
      if (updated) setPreview(updated);
    } catch {
      // Error handled by hook
    }
  };

  const handleBack = () => {
    safeGoBack(router, id ? `/(app)/reservation/${id}` : '/(app)/map');
  };

  if (isLoading && !preview) {
    return <Loading message="Calculating server settlement preview..." />;
  }

  if (!preview) {
    return (
      <EmptyState
        title="Settlement Not Found"
        description="Unable to load settlement details for this reservation."
        actionTitle="Back to Map"
        onAction={() => router.replace('/(app)/map')}
      />
    );
  }

  const calc = preview.calculation;
  const isSettled = calc.balance <= 0 || paymentSuccess;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h1" style={styles.title}>
        {isSettled ? 'Rental Receipt' : 'Settlement Summary'}
      </Typography>

      {error ? (
        <View style={styles.errorBox}>
          <Typography variant="caption" color={COLORS.status.maintenance} align="center">
            {error}
          </Typography>
        </View>
      ) : null}

      {paymentSuccess && (
        <Card style={styles.successBox}>
          <Typography variant="h3" color={COLORS.status.available} align="center">
            ✓ Payment Successful!
          </Typography>
          <Typography variant="body" color={COLORS.neutral.textSecondary} align="center">
            Your rental balance has been fully settled. Thank you for riding with Rent_App!
          </Typography>
        </Card>
      )}

      <Card style={styles.card}>
        <View style={styles.statusRow}>
          <Typography variant="h2">Reservation Details</Typography>
          <View style={[styles.badge, { backgroundColor: isSettled ? COLORS.status.available : COLORS.primary.main }]}>
            <Typography variant="caption" weight="bold" color="#FFFFFF">
              {isSettled ? 'SETTLED' : preview.status}
            </Typography>
          </View>
        </View>

        <View style={styles.row}>
          <Typography variant="body" color={COLORS.neutral.textSecondary}>Customer</Typography>
          <Typography variant="body" weight="medium">{preview.clientName || 'N/A'}</Typography>
        </View>
        <View style={styles.row}>
          <Typography variant="body" color={COLORS.neutral.textSecondary}>Duration</Typography>
          <Typography variant="body" weight="medium">{calc.durationHours} hr(s) @ ${calc.ratePerHour}/hr</Typography>
        </View>
        <View style={styles.row}>
          <Typography variant="body" color={COLORS.neutral.textSecondary}>Base Cost</Typography>
          <Typography variant="body" weight="bold">${calc.baseCost.toFixed(2)}</Typography>
        </View>
      </Card>

      <Card style={styles.card}>
        <Typography variant="h3" style={styles.sectionTitle}>Financial Breakdown</Typography>

        <View style={styles.row}>
          <Typography variant="body" color={COLORS.neutral.textSecondary}>Overtime ({calc.overtimeMinutes} mins)</Typography>
          <Typography variant="body">${calc.overtimeCost.toFixed(2)}</Typography>
        </View>

        {calc.incidentCharges > 0 && (
          <View style={styles.row}>
            <Typography variant="body" color={COLORS.status.maintenance}>Incident Charges</Typography>
            <Typography variant="body" color={COLORS.status.maintenance}>+${calc.incidentCharges.toFixed(2)}</Typography>
          </View>
        )}

        {calc.latePenalty > 0 && (
          <View style={styles.row}>
            <Typography variant="body" color={COLORS.status.maintenance}>Late Penalty</Typography>
            <Typography variant="body" color={COLORS.status.maintenance}>+${calc.latePenalty.toFixed(2)}</Typography>
          </View>
        )}

        {calc.creditsApplied > 0 && (
          <View style={styles.row}>
            <Typography variant="body" color={COLORS.status.available}>Credits Applied</Typography>
            <Typography variant="body" color={COLORS.status.available}>-${calc.creditsApplied.toFixed(2)}</Typography>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.row}>
          <Typography variant="h3">Gross Total</Typography>
          <Typography variant="h3">${calc.grossTotal.toFixed(2)}</Typography>
        </View>

        <View style={styles.row}>
          <Typography variant="body" color={COLORS.status.available}>Total Paid</Typography>
          <Typography variant="body" weight="bold" color={COLORS.status.available}>-${(calc.totalPaid + (paymentSuccess ? calc.balance : 0)).toFixed(2)}</Typography>
        </View>

        <View style={[styles.row, styles.balanceRow]}>
          <Typography variant="h2">Balance Due</Typography>
          <Typography variant="h2" color={isSettled ? COLORS.status.available : COLORS.status.maintenance}>
            ${(paymentSuccess ? 0 : calc.balance).toFixed(2)}
          </Typography>
        </View>
      </Card>

      {!isSettled ? (
        <Button
          title={`Pay Outstanding Balance ($${calc.balance.toFixed(2)})`}
          onPress={handlePayBalance}
          isLoading={isLoading}
          style={styles.payBtn}
        />
      ) : (
        <View>
          <Button
            title="View Payment History"
            onPress={() => router.push('/(app)/payments')}
            style={styles.payBtn}
          />
          <Button
            title="Find Next Bike"
            variant="outline"
            onPress={() => router.replace('/(app)/map')}
            style={styles.nextBikeBtn}
          />
        </View>
      )}

      <Button
        title="Back"
        variant="ghost"
        onPress={handleBack}
        style={styles.backBtn}
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
    marginBottom: SPACING.md,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: SPACING.sm,
    borderRadius: SPACING.xs,
    marginBottom: SPACING.md,
  },
  successBox: {
    backgroundColor: '#F0FDF4',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    borderColor: COLORS.status.available,
    borderWidth: 1,
  },
  card: {
    marginBottom: SPACING.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral.border,
  },
  badge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.sm,
  },
  sectionTitle: {
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.neutral.border,
    marginVertical: SPACING.sm,
  },
  balanceRow: {
    marginTop: SPACING.xs,
    paddingTop: SPACING.sm,
    borderTopWidth: 2,
    borderTopColor: COLORS.neutral.border,
  },
  payBtn: {
    marginTop: SPACING.md,
  },
  nextBikeBtn: {
    marginTop: SPACING.sm,
  },
  backBtn: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
  },
});
