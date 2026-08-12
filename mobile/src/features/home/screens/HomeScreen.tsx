import React, { useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Card, Button } from '@design-system/components';
import { COLORS, SPACING, RADIUS, SHADOWS } from '@design-system/theme';
import { useReservation } from '@features/reservation/hooks/useReservation';
import { ReservationStatusEnum } from '@domain/value-objects/ReservationStatus';
import { Reservation } from '@domain/entities/Reservation';

import { useRoutes } from '@features/routes/hooks/useRoutes';
import { SuggestedRoutesCard } from '@features/routes/components/SuggestedRoutesCard';

// ─── Status Config ───────────────────────────────────────────────
interface StatusConfig {
  emoji: string;
  badge: string;
  badgeColor: string;
  headline: string;
  description: string;
  ctaLabel: string;
  ctaRoute: (r: Reservation) => string;
  ctaVariant: 'primary' | 'secondary' | 'outline';
}

const STATUS_CONFIG: Partial<Record<ReservationStatusEnum, StatusConfig>> = {
  [ReservationStatusEnum.CONFIRMED]: {
    emoji: '🎫',
    badge: 'CONFIRMED',
    badgeColor: COLORS.secondary.light,
    headline: 'Your Rental is Confirmed',
    description: 'Visit the station and show your check-in PIN to the operator.',
    ctaLabel: 'View Reservation & PIN',
    ctaRoute: (r) => `/(app)/reservation/${r.id}`,
    ctaVariant: 'primary',
  },
  [ReservationStatusEnum.CHECKED_IN]: {
    emoji: '🔓',
    badge: 'BIKE READY',
    badgeColor: COLORS.status.available,
    headline: 'Your Bike is Ready!',
    description: 'The operator has verified your check-in. Press Start Ride when you are ready to go.',
    ctaLabel: 'Go to Ride Screen',
    ctaRoute: (r) => `/(app)/reservation/${r.id}`,
    ctaVariant: 'primary',
  },
  [ReservationStatusEnum.ACTIVE]: {
    emoji: '🚴',
    badge: 'RIDE IN PROGRESS',
    badgeColor: COLORS.status.inUse,
    headline: 'Ride In Progress',
    description: 'GPS tracking is active. Ride safely and tap End Ride when you arrive.',
    ctaLabel: 'View Active Ride',
    ctaRoute: (r) => `/(app)/reservation/${r.id}`,
    ctaVariant: 'primary',
  },
  [ReservationStatusEnum.SETTLEMENT_PENDING]: {
    emoji: '💳',
    badge: 'PAYMENT DUE',
    badgeColor: COLORS.status.reserved,
    headline: 'Ride Completed',
    description: 'Your ride has ended. Please complete the payment to close your rental.',
    ctaLabel: 'View & Pay Now',
    ctaRoute: (r) => `/(app)/payments/settlement/${r.id}`,
    ctaVariant: 'primary',
  },
};

// ─── Component ───────────────────────────────────────────────────
export const HomeScreen: React.FC = () => {
  const router = useRouter();
  const { activeReservation, isLoading, fetchActiveReservation } = useReservation();
  const { routes } = useRoutes();

  useEffect(() => {
    fetchActiveReservation();
  }, [fetchActiveReservation]);

  const onRefresh = useCallback(() => {
    fetchActiveReservation();
  }, [fetchActiveReservation]);

  const statusValue = activeReservation?.props.status.value as ReservationStatusEnum | undefined;
  const config = statusValue ? STATUS_CONFIG[statusValue] : undefined;

  const handleCta = () => {
    if (!activeReservation || !config) return;
    router.push(config.ctaRoute(activeReservation) as any);
  };

  const handleOpenWebCustomer = () => {
    // Link to the Web Customer — reservation creation is a Web Customer responsibility
    Linking.openURL('https://rental-app-xi-six.vercel.app').catch(() => {});
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={onRefresh}
          tintColor={COLORS.primary.light}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Typography variant="caption" color={COLORS.primary.light} weight="bold" style={styles.headerCaption}>
          RENT APP
        </Typography>
        <Typography variant="h2" color={COLORS.neutral.textPrimary} weight="bold">
          My Rental
        </Typography>
        <Typography variant="body" color={COLORS.neutral.textSecondary}>
          Pull down to refresh your rental status.
        </Typography>
      </View>

      {/* Content */}
      {isLoading && !activeReservation ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.primary.light} size="large" />
          <Typography variant="caption" color={COLORS.neutral.textSecondary} style={styles.loadingText}>
            Checking rental status...
          </Typography>
        </View>
      ) : activeReservation && config ? (
        /* ── Active Rental Card ── */
        <Card variant="glass" style={styles.rentalCard}>
          {/* Status Badge */}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { borderColor: config.badgeColor }]}>
              <Typography variant="caption" color={config.badgeColor} weight="bold" style={styles.badgeText}>
                {config.badge}
              </Typography>
            </View>
          </View>

          {/* Emoji + Headline */}
          <Typography variant="h1" align="center" style={styles.emoji}>
            {config.emoji}
          </Typography>
          <Typography variant="h3" color={COLORS.neutral.textPrimary} align="center" weight="bold">
            {config.headline}
          </Typography>
          <Typography variant="body" color={COLORS.neutral.textSecondary} align="center" style={styles.description}>
            {config.description}
          </Typography>

          {/* Reservation Meta */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Typography variant="caption" color={COLORS.neutral.textSecondary}>RESERVATION</Typography>
              <Typography variant="body" color={COLORS.neutral.textPrimary} weight="bold">
                #{activeReservation.props.code}
              </Typography>
            </View>
            {activeReservation.props.bike && (
              <View style={styles.metaItem}>
                <Typography variant="caption" color={COLORS.neutral.textSecondary}>BIKE</Typography>
                <Typography variant="body" color={COLORS.neutral.textPrimary} weight="bold">
                  #{activeReservation.props.bike.code}
                </Typography>
              </View>
            )}
            {activeReservation.props.priceEstimated && (
              <View style={styles.metaItem}>
                <Typography variant="caption" color={COLORS.neutral.textSecondary}>EST. COST</Typography>
                <Typography variant="body" color={COLORS.primary.light} weight="bold">
                  ${Number(activeReservation.props.priceEstimated).toFixed(2)}
                </Typography>
              </View>
            )}
          </View>

          {/* CTA */}
          <Button
            title={config.ctaLabel}
            variant={config.ctaVariant}
            onPress={handleCta}
            style={styles.ctaButton}
          />
        </Card>
      ) : (
        /* ── No Active Rental ── */
        <Card variant="glass" style={styles.emptyCard}>
          <Typography variant="h1" align="center" style={styles.emoji}>
            🚲
          </Typography>
          <Typography variant="h3" color={COLORS.neutral.textPrimary} align="center" weight="bold">
            No Active Rental
          </Typography>
          <Typography variant="body" color={COLORS.neutral.textSecondary} align="center" style={styles.description}>
            Reserve a bike on the Rent App website to get started. Once confirmed, your rental will appear here.
          </Typography>

          <TouchableOpacity style={styles.webLink} onPress={handleOpenWebCustomer}>
            <Typography variant="body" color={COLORS.primary.light} weight="bold" align="center">
              🌐  Make a Reservation →
            </Typography>
          </TouchableOpacity>

          <Typography variant="caption" color={COLORS.neutral.textSecondary} align="center" style={styles.webUrlLabel}>
            rental-app-xi-six.vercel.app
          </Typography>
        </Card>
      )}

      {/* Suggested Routes Card for Companion Context */}
      <SuggestedRoutesCard routes={routes} />
    </ScrollView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.neutral.background,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl * 2,
  },
  header: {
    marginBottom: SPACING.xl,
    gap: SPACING.xs,
  },
  headerCaption: {
    letterSpacing: 2,
    fontSize: 11,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
    gap: SPACING.md,
  },
  loadingText: {
    marginTop: SPACING.sm,
  },
  rentalCard: {
    padding: SPACING.xl,
    gap: SPACING.md,
    ...SHADOWS.glowTeal,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  badge: {
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs / 2,
  },
  badgeText: {
    letterSpacing: 1.5,
    fontSize: 10,
  },
  emoji: {
    fontSize: 52,
    textAlign: 'center',
    marginVertical: SPACING.sm,
  },
  description: {
    marginBottom: SPACING.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(15, 118, 110, 0.08)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  metaItem: {
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  ctaButton: {
    marginTop: SPACING.xs,
  },
  emptyCard: {
    padding: SPACING.xl,
    gap: SPACING.md,
    alignItems: 'center',
  },
  webLink: {
    backgroundColor: 'rgba(15, 118, 110, 0.15)',
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary.light,
    width: '100%',
    marginTop: SPACING.sm,
  },
  webUrlLabel: {
    opacity: 0.5,
    fontSize: 11,
    marginTop: SPACING.xs,
  },
});
