import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Card, Button, Loading, EmptyState } from '@design-system/components';
import { COLORS, SPACING, RADIUS } from '@design-system/theme';
import { usePayments } from '../hooks/usePayments';
import { Payment } from '@domain/entities/Payment';

export const PaymentHistoryScreen: React.FC = () => {
  const router = useRouter();
  const { payments, isLoading, error, fetchMyPayments, payPayment } = usePayments();

  useEffect(() => {
    fetchMyPayments();
  }, [fetchMyPayments]);

  const handlePayNow = async (paymentId: string) => {
    try {
      await payPayment(paymentId);
    } catch {
      // Error handled by hook
    }
  };

  const renderPaymentItem = ({ item }: { item: Payment }) => {
    const isPaid = item.isPaid();
    const isPending = item.isPending();

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Typography variant="h3">
              {item.type === 'UPFRONT' ? 'Upfront Deposit' : item.type === 'POST_RIDE' ? 'Post-Ride Payment' : 'Rental Charge'}
            </Typography>
            {item.props.reservationCode ? (
              <Typography variant="caption" color={COLORS.neutral.textSecondary}>
                Reservation #{item.props.reservationCode}
              </Typography>
            ) : null}
          </View>
          <View style={[styles.badge, isPaid ? styles.paidBadge : isPending ? styles.pendingBadge : styles.failedBadge]}>
            <Typography variant="caption" weight="bold" color="#FFFFFF">
              {item.status}
            </Typography>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Typography variant="body" color={COLORS.neutral.textSecondary}>
            Amount:
          </Typography>
          <Typography variant="h3" color={COLORS.primary.main}>
            ${item.amount.toFixed(2)} {item.props.currency || 'USD'}
          </Typography>
        </View>

        <View style={styles.detailRow}>
          <Typography variant="caption" color={COLORS.neutral.textSecondary}>
            Created: {new Date(item.props.createdAt).toLocaleDateString()}
          </Typography>
          {item.paidAt ? (
            <Typography variant="caption" color={COLORS.status.available}>
              Paid: {new Date(item.paidAt).toLocaleDateString()}
            </Typography>
          ) : null}
        </View>

        {isPending && (
          <Button
            title="Pay Now"
            onPress={() => handlePayNow(item.id)}
            isLoading={isLoading}
            style={styles.payBtn}
          />
        )}

        <Button
          title="View Settlement Details"
          variant="ghost"
          onPress={() =>
            router.push({
              pathname: '/(app)/payments/settlement/[id]',
              params: { id: item.reservationId },
            })
          }
          style={styles.settlementBtn}
        />
      </Card>
    );
  };

  if (isLoading && payments.length === 0) {
    return <Loading message="Loading payment history..." />;
  }

  return (
    <View style={styles.container}>
      <Typography variant="h1" style={styles.title}>
        Payment History
      </Typography>

      {error ? (
        <View style={styles.errorBox}>
          <Typography variant="caption" color={COLORS.status.maintenance} align="center">
            {error}
          </Typography>
        </View>
      ) : null}

      <FlatList
        data={payments}
        keyExtractor={(item) => item.id}
        renderItem={renderPaymentItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchMyPayments} />
        }
        ListEmptyComponent={
          <EmptyState
            title="No Payment History"
            description="You have not made any payments yet."
            actionTitle="Find a Bike"
            onAction={() => router.replace('/(app)/map')}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.neutral.background,
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
  listContent: {
    paddingBottom: SPACING.xl,
  },
  card: {
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral.border,
  },
  badge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.sm,
  },
  paidBadge: {
    backgroundColor: COLORS.status.available,
  },
  pendingBadge: {
    backgroundColor: COLORS.secondary.main,
  },
  failedBadge: {
    backgroundColor: COLORS.status.maintenance,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  payBtn: {
    marginTop: SPACING.sm,
  },
  settlementBtn: {
    marginTop: SPACING.xs,
  },
});
