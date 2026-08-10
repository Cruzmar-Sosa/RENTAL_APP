import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Card, Button, Loading, EmptyState } from '@design-system/components';
import { COLORS, SPACING, RADIUS } from '@design-system/theme';
import { useReservation } from '../hooks/useReservation';
import { trackingEngine } from '@platform/container';

export const ActiveReservationScreen: React.FC = () => {
  const router = useRouter();
  const { activeReservation, fetchActiveReservation, startRide, completeRide, cancelReservation, isLoading, error } = useReservation();
  const [trackingState, setTrackingState] = useState<string>(trackingEngine.getState());

  useEffect(() => {
    fetchActiveReservation();
    const interval = setInterval(() => {
      setTrackingState(trackingEngine.getState());
    }, 2000);
    return () => clearInterval(interval);
  }, [fetchActiveReservation]);

  if (isLoading && !activeReservation) {
    return <Loading message="Loading active reservation..." />;
  }

  if (!activeReservation) {
    return (
      <EmptyState
        title="No Active Reservation"
        description="You do not currently have any active bike reservations."
        actionTitle="Find a Bike"
        onAction={() => router.replace('/(app)/map')}
      />
    );
  }

  const reservation = activeReservation;
  const statusValue = reservation.props.status.value;

  const handleStartRide = async () => {
    try {
      const updated = await startRide(reservation.id);

      // =========================================================================
      // 🚀 SPRINT 3 INTEGRATION POINT CONNECTED
      // Launch real-time background GPS tracking upon active ride confirmation
      // =========================================================================
      await trackingEngine.start({
        rideId: updated.id,
        bikeId: updated.bikeId,
      });
      setTrackingState(trackingEngine.getState());
    } catch {
      // Error handled by hook
    }
  };

  const handleCompleteRide = async () => {
    try {
      // Stop telemetry tracking on ride completion
      await trackingEngine.stop();
      setTrackingState(trackingEngine.getState());

      await completeRide(reservation.id, reservation.props.bike?.stationId || 'default-station');
      router.replace('/(app)/map');
    } catch {
      // Error handled by hook
    }
  };

  const handleCancel = async () => {
    try {
      // Stop telemetry tracking on cancellation
      await trackingEngine.stop();
      setTrackingState(trackingEngine.getState());

      await cancelReservation(reservation.id);
      router.replace('/(app)/map');
    } catch {
      // Error handled by hook
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h1" style={styles.title}>
        Active Ride
      </Typography>

      {error ? (
        <View style={styles.errorBox}>
          <Typography variant="caption" color={COLORS.status.maintenance} align="center">
            {error}
          </Typography>
        </View>
      ) : null}

      <Card style={styles.card}>
        <View style={styles.statusRow}>
          <Typography variant="h2">Reservation #{reservation.props.code}</Typography>
          <View style={[styles.statusBadge, getStatusBadgeStyle(statusValue)]}>
            <Typography variant="caption" weight="bold" color="#FFFFFF">
              {statusValue}
            </Typography>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Typography variant="body" color={COLORS.neutral.textSecondary}>
            Bike Code:
          </Typography>
          <Typography variant="body" weight="bold">
            #{reservation.props.bike?.code || 'N/A'}
          </Typography>
        </View>

        <View style={styles.infoRow}>
          <Typography variant="body" color={COLORS.neutral.textSecondary}>
            Start Time:
          </Typography>
          <Typography variant="body" weight="medium">
            {new Date(reservation.props.startTime).toLocaleTimeString()}
          </Typography>
        </View>

        <View style={styles.infoRow}>
          <Typography variant="body" color={COLORS.neutral.textSecondary}>
            Estimated Cost:
          </Typography>
          <Typography variant="body" weight="bold" color={COLORS.primary.main}>
            ${reservation.props.priceEstimated?.toFixed(2) || '50.00'}
          </Typography>
        </View>

        <View style={styles.infoRow}>
          <Typography variant="body" color={COLORS.neutral.textSecondary}>
            Tracking Status:
          </Typography>
          <Typography
            variant="body"
            weight="bold"
            color={trackingState === 'ACTIVE' ? COLORS.status.available : COLORS.neutral.textSecondary}
          >
            ● {trackingState}
          </Typography>
        </View>
      </Card>

      {statusValue === 'CONFIRMED' && (
        <Card style={styles.actionCard}>
          <Typography variant="h3" style={styles.actionTitle}>
            Ready for Pickup
          </Typography>
          <Typography variant="body" color={COLORS.neutral.textSecondary} style={styles.actionDesc}>
            Show your check-in PIN to the station operator to unlock the bike.
          </Typography>
          <Button
            title="View Check-in PIN"
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
          <Typography variant="h3" style={styles.actionTitle}>
            Operator Validated!
          </Typography>
          <Typography variant="body" color={COLORS.neutral.textSecondary} style={styles.actionDesc}>
            Your bike is unlocked and ready to ride. Tap below to start your ride timer.
          </Typography>
          <Button
            title="Start Ride & Tracking"
            onPress={handleStartRide}
            isLoading={isLoading}
            style={styles.actionBtn}
          />
        </Card>
      )}

      {statusValue === 'ACTIVE' && (
        <Card style={styles.actionCard}>
          <Typography variant="h3" color={COLORS.status.available} style={styles.actionTitle}>
            Ride & GPS Tracking Active 🚲
          </Typography>
          <Typography variant="body" color={COLORS.neutral.textSecondary} style={styles.actionDesc}>
            Real-time GPS telemetry is streaming to the Tracking Platform.
          </Typography>

          <Button
            title="Complete Ride"
            variant="secondary"
            onPress={handleCompleteRide}
            isLoading={isLoading}
            style={styles.actionBtn}
          />
        </Card>
      )}
    </ScrollView>
  );
};

function getStatusBadgeStyle(status: string) {
  switch (status) {
    case 'ACTIVE':
      return { backgroundColor: COLORS.status.available };
    case 'CHECKED_IN':
      return { backgroundColor: COLORS.secondary.main };
    case 'CONFIRMED':
      return { backgroundColor: COLORS.primary.main };
    default:
      return { backgroundColor: COLORS.neutral.disabled };
  }
}

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
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  actionCard: {
    marginTop: SPACING.md,
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
});
