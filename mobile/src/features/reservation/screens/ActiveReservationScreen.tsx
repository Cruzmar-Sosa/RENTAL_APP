import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Modal, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Card, Button, Loading, EmptyState, Badge } from '@design-system/components';
import { COLORS, SPACING, RADIUS } from '@design-system/theme';
import { useReservation } from '../hooks/useReservation';
import { useRoutes } from '@features/routes/hooks/useRoutes';
import { SuggestedRoutesCard } from '@features/routes/components/SuggestedRoutesCard';
import { trackingEngine, permissionManager, connectivityManager } from '@platform/container';

export const ActiveReservationScreen: React.FC = () => {
  const router = useRouter();
  const { activeReservation, fetchActiveReservation, startRide, completeRide, cancelReservation, isLoading, error } = useReservation();
  const { routes } = useRoutes();
  const [trackingState, setTrackingState] = useState<string>(trackingEngine.getState());
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);
  const [showEndModal, setShowEndModal] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    fetchActiveReservation();
    const interval = setInterval(() => {
      setTrackingState(trackingEngine.getState());
    }, 2000);
    return () => clearInterval(interval);
  }, [fetchActiveReservation]);

  const rawStatusValue = activeReservation?.props.status.value;

  // Protect ACTIVE ride from accidental hardware back navigation (Android)
  useEffect(() => {
    if (rawStatusValue !== 'ACTIVE') return;

    const onBackPress = () => {
      setShowEndModal(true);
      return true; // Block default back behavior
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [rawStatusValue]);

  // Live ride duration timer calculated from actualStart timestamp
  useEffect(() => {
    if (rawStatusValue !== 'ACTIVE') return;

    const computeElapsed = () => {
      if (activeReservation?.props.actualStart) {
        const startMs = new Date(activeReservation.props.actualStart).getTime();
        const diffSec = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
        setElapsedSeconds(diffSec);
      } else {
        setElapsedSeconds((prev) => prev + 1);
      }
    };

    computeElapsed();
    const timer = setInterval(computeElapsed, 1000);

    return () => clearInterval(timer);
  }, [rawStatusValue, activeReservation?.props.actualStart]);

  if (isLoading && !activeReservation) {
    return <Loading message="Syncing active rental state with backend..." />;
  }

  if (!activeReservation) {
    return (
      <EmptyState
        title="No Active Ride"
        description="You do not currently have any active bike reservations or ongoing rides."
        actionTitle="Go to Home"
        onAction={() => router.replace('/(app)/home')}
      />
    );
  }

  const reservation = activeReservation;
  const statusValue = reservation.props.status.value;

  const handleStartRide = async () => {
    setOfflineNotice(null);
    const isOnline = await connectivityManager.isOnline();
    if (!isOnline) {
      setOfflineNotice('Internet connection required to start your ride.');
      return;
    }

    const perm = await permissionManager.requestLocation();
    if (perm !== 'granted') {
      setOfflineNotice('Location permission is required to enable GPS tracking for your ride.');
      return;
    }

    try {
      const updated = await startRide(reservation.id);
      await trackingEngine.start({
        rideId: updated.id,
        bikeId: updated.bikeId,
      });
      setTrackingState(trackingEngine.getState());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start ride. Please try again.';
      setOfflineNotice(msg);
    }
  };

  const handleConfirmEndRide = async () => {
    setShowEndModal(false);
    setOfflineNotice(null);
    const isOnline = await connectivityManager.isOnline();
    if (!isOnline) {
      setOfflineNotice('Internet connection required to end your ride.');
      return;
    }

    try {
      await trackingEngine.stop();
      setTrackingState(trackingEngine.getState());

      await completeRide(reservation.id, reservation.props.bike?.stationId || 'default-station');
      router.replace({ pathname: '/(app)/payments/settlement/[id]', params: { id: reservation.id } });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to end ride. Please try again.';
      setOfflineNotice(msg);
    }
  };

  const handleCancel = async () => {
    try {
      await trackingEngine.stop();
      setTrackingState(trackingEngine.getState());

      await cancelReservation(reservation.id);
      router.replace('/(app)/home');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel reservation.';
      setOfflineNotice(msg);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'available';
      case 'CHECKED_IN':
        return 'secondary';
      case 'CONFIRMED':
        return 'primary';
      case 'SETTLEMENT_PENDING':
        return 'reserved';
      default:
        return 'neutral';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Typography variant="caption" color={COLORS.primary.light} weight="bold" style={styles.brandTag}>
          ⚡ LIVE TELEMETRY DASHBOARD
        </Typography>
        <Typography variant="h1" color={COLORS.neutral.textPrimary} style={styles.headerTitle}>
          Active Ride
        </Typography>
      </View>

      {(error || offlineNotice) && (
        <View style={styles.errorBox}>
          <Typography variant="caption" color={COLORS.status.maintenance} align="center">
            {offlineNotice || error}
          </Typography>
        </View>
      )}

      {/* Main Reservation Card */}
      <Card variant="glass" style={styles.card}>
        <View style={styles.statusRow}>
          <Typography variant="h2" color={COLORS.neutral.textPrimary}>
            Ride #{reservation.props.code}
          </Typography>
          <Badge label={statusValue} variant={getStatusVariant(statusValue)} showDot />
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoTile}>
            <Typography variant="caption" color={COLORS.neutral.textSecondary}>Bike Code</Typography>
            <Typography variant="h3" color={COLORS.primary.light}>#{reservation.props.bike?.code || 'N/A'}</Typography>
          </View>

          <View style={styles.infoTile}>
            <Typography variant="caption" color={COLORS.neutral.textSecondary}>Start Time</Typography>
            <Typography variant="body" weight="bold" color={COLORS.neutral.textPrimary}>
              {new Date(reservation.props.startTime).toLocaleTimeString()}
            </Typography>
          </View>

          <View style={styles.infoTile}>
            <Typography variant="caption" color={COLORS.neutral.textSecondary}>Est. Rate</Typography>
            <Typography variant="h3" color={COLORS.status.available}>
              ${reservation.props.priceEstimated?.toFixed(2) || '50.00'}
            </Typography>
          </View>

          <View style={styles.infoTile}>
            <Typography variant="caption" color={COLORS.neutral.textSecondary}>GPS Engine</Typography>
            <Typography variant="body" weight="bold" color={trackingState === 'ACTIVE' ? COLORS.status.available : COLORS.neutral.textSecondary}>
              ● {trackingState}
            </Typography>
          </View>
        </View>
      </Card>

      {/* Action Cards per Status */}
      {statusValue === 'PENDING' && (
        <Card style={styles.actionCard}>
          <Typography variant="h3" color={COLORS.status.reserved} style={styles.actionTitle}>
            Reservation Pending Confirmation
          </Typography>
          <Typography variant="body" color={COLORS.neutral.textSecondary} style={styles.actionDesc}>
            Your reservation is held for 15 minutes. Complete payment on the web to confirm.
          </Typography>
          <Button
            title="Cancel Reservation"
            variant="ghost"
            onPress={handleCancel}
            style={styles.cancelBtn}
          />
        </Card>
      )}

      {statusValue === 'CONFIRMED' && (
        <Card style={styles.actionCard}>
          <Typography variant="h3" color={COLORS.primary.light} style={styles.actionTitle}>
            Step 1: Check-in with Operator
          </Typography>
          <Typography variant="body" color={COLORS.neutral.textSecondary} style={styles.actionDesc}>
            Show your unique 4-digit PIN code to the station operator to unlock the bike.
          </Typography>
          <Button
            title="View Check-in PIN Code"
            onPress={() => router.push({ pathname: '/(app)/reservation/pin/[id]', params: { id: reservation.id } })}
            style={styles.actionBtn}
          />
          <Button
            title="Cancel Reservation"
            variant="ghost"
            onPress={handleCancel}
            style={styles.cancelBtn}
          />
        </Card>
      )}

      {statusValue === 'CHECKED_IN' && (
        <Card style={styles.actionCard}>
          <Typography variant="h3" color={COLORS.secondary.light} style={styles.actionTitle}>
            Step 2: Unlocked & Validated!
          </Typography>
          <Typography variant="body" color={COLORS.neutral.textSecondary} style={styles.actionDesc}>
            Your bike is unlocked. Tap below to launch GPS tracking and start your ride.
          </Typography>
          <Button
            title="Start Ride & GPS Tracking"
            onPress={handleStartRide}
            isLoading={isLoading}
            style={styles.actionBtn}
          />
        </Card>
      )}

      {statusValue === 'ACTIVE' && (
        <Card variant="glass" style={styles.activeRideCard}>
          <View style={styles.activeHeader}>
            <View style={styles.pulseDot} />
            <Typography variant="subtitle" color={COLORS.status.available} weight="bold">
              GPS STREAMING TO PLATFORM
            </Typography>
          </View>

          {/* Live duration timer display */}
          <View style={{ marginVertical: SPACING.sm, alignItems: 'center' }}>
            <Typography variant="caption" color={COLORS.neutral.textSecondary}>ELAPSED RIDE TIME</Typography>
            <Typography variant="h1" color={COLORS.primary.light} weight="bold">
              {Math.floor(elapsedSeconds / 3600).toString().padStart(2, '0')}:
              {Math.floor((elapsedSeconds % 3600) / 60).toString().padStart(2, '0')}:
              {(elapsedSeconds % 60).toString().padStart(2, '0')}
            </Typography>
          </View>

          {/* Telemetry Metrics Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'rgba(255,255,255,0.03)', padding: SPACING.sm, borderRadius: RADIUS.sm, marginBottom: SPACING.md }}>
            <View style={{ alignItems: 'center' }}>
              <Typography variant="caption" color={COLORS.neutral.textSecondary}>BATTERY</Typography>
              <Typography variant="body" color={COLORS.status.available} weight="bold">
                🔋 {reservation.props.bike?.batteryLevel ?? 100}%
              </Typography>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Typography variant="caption" color={COLORS.neutral.textSecondary}>GPS STATUS</Typography>
              <Typography variant="body" color={trackingState === 'ACTIVE' ? COLORS.status.available : COLORS.status.reserved} weight="bold">
                📡 {trackingState}
              </Typography>
            </View>
          </View>

          <Typography variant="body" color={COLORS.neutral.textSecondary} style={styles.actionDesc}>
            Telemetry is syncing with Redis presence & Admin Web map in real time.
          </Typography>

          <Button
            title="End Ride"
            variant="secondary"
            onPress={() => setShowEndModal(true)}
            isLoading={isLoading}
            style={styles.actionBtn}
          />
          <Button
            title="View Settlement Preview"
            variant="ghost"
            onPress={() => router.push({ pathname: '/(app)/payments/settlement/[id]', params: { id: reservation.id } })}
            style={styles.cancelBtn}
          />
          <SuggestedRoutesCard routes={routes} title="📍 Suggested Route Context & POIs" />
        </Card>
      )}

      {statusValue === 'SETTLEMENT_PENDING' && (
        <Card style={styles.actionCard}>
          <Typography variant="h3" color={COLORS.secondary.light} style={styles.actionTitle}>
            Ride Completed — Balance Due 💳
          </Typography>
          <Typography variant="body" color={COLORS.neutral.textSecondary} style={styles.actionDesc}>
            Your ride session has finished. Please view and settle your final balance.
          </Typography>
          <Button
            title="View Settlement & Pay Balance"
            onPress={() => router.push({ pathname: '/(app)/payments/settlement/[id]', params: { id: reservation.id } })}
            style={styles.actionBtn}
          />
        </Card>
      )}

      {(statusValue === 'SETTLED' || statusValue === 'COMPLETED') && (
        <Card style={styles.actionCard}>
          <Typography variant="h3" color={COLORS.status.available} style={styles.actionTitle}>
            Rental Settled & Completed ✅
          </Typography>
          <Typography variant="body" color={COLORS.neutral.textSecondary} style={styles.actionDesc}>
            Thank you for riding! Your rental is fully paid and closed.
          </Typography>
          <Button
            title="Back to Home"
            variant="outline"
            onPress={() => router.replace('/(app)/home')}
            style={styles.actionBtn}
          />
        </Card>
      )}

      {(statusValue === 'CANCELLED' || statusValue === 'NO_SHOW') && (
        <Card style={styles.actionCard}>
          <Typography variant="h3" color={COLORS.status.maintenance} style={styles.actionTitle}>
            Rental {statusValue}
          </Typography>
          <Typography variant="body" color={COLORS.neutral.textSecondary} style={styles.actionDesc}>
            This reservation is no longer active.
          </Typography>
          <Button
            title="Back to Home"
            variant="outline"
            onPress={() => router.replace('/(app)/home')}
            style={styles.actionBtn}
          />
        </Card>
      )}

      {/* End Ride Confirmation Modal */}
      <Modal visible={showEndModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <Typography variant="h2" color={COLORS.neutral.textPrimary} align="center" style={styles.modalTitle}>
              Complete Ride?
            </Typography>
            <Typography variant="body" color={COLORS.neutral.textSecondary} align="center" style={styles.modalDesc}>
              This will stop GPS telemetry, release the bike dock lock, and calculate final settlement fees.
            </Typography>
            <Button
              title="Yes, End Ride"
              onPress={handleConfirmEndRide}
              isLoading={isLoading}
              style={styles.modalBtn}
            />
            <Button
              title="Keep Riding"
              variant="ghost"
              onPress={() => setShowEndModal(false)}
              style={styles.modalCancelBtn}
            />
          </Card>
        </View>
      </Modal>
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
  header: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  brandTag: {
    letterSpacing: 1,
    marginBottom: SPACING.xxs,
  },
  headerTitle: {
    marginBottom: SPACING.xs,
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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral.border,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoTile: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  actionCard: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.neutral.surface,
  },
  activeRideCard: {
    marginTop: SPACING.sm,
    borderColor: COLORS.status.available,
    borderWidth: 1,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.status.available,
    marginRight: SPACING.xs,
  },
  actionTitle: {
    marginBottom: SPACING.xs,
  },
  actionDesc: {
    marginBottom: SPACING.md,
  },
  actionBtn: {
    marginTop: SPACING.sm,
  },
  cancelBtn: {
    marginTop: SPACING.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: '100%',
    padding: SPACING.xl,
    backgroundColor: COLORS.neutral.surface,
  },
  modalTitle: {
    marginBottom: SPACING.xs,
  },
  modalDesc: {
    marginBottom: SPACING.lg,
  },
  modalBtn: {
    marginBottom: SPACING.xs,
  },
  modalCancelBtn: {
    marginTop: SPACING.xs,
  },
});
