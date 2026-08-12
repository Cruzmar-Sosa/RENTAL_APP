import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '@features/authentication';
import { Typography, Card, Button } from '@design-system/components';
import { COLORS, SPACING, RADIUS } from '@design-system/theme';

export default function ProfileTabRoute() {
  const { user, logout, isLoading } = useAuth();

  return (
    <View style={styles.container}>
      <Card variant="glass" style={styles.card}>
        <View style={styles.avatarCircle}>
          <Typography variant="h1" color={COLORS.primary.light}>
            {user?.props?.name?.[0]?.toUpperCase() || '👤'}
          </Typography>
        </View>

        <Typography variant="h2" color={COLORS.neutral.textPrimary} align="center" weight="bold">
          {user?.props?.name || 'User Profile'}
        </Typography>

        <Typography variant="body" color={COLORS.neutral.textSecondary} align="center">
          {user?.props?.email || 'No email associated'}
        </Typography>

        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Typography variant="caption" color={COLORS.neutral.textSecondary}>ROLE</Typography>
            <Typography variant="body" color={COLORS.primary.light} weight="bold">
              {user?.props?.role || 'USER'}
            </Typography>
          </View>
        </View>

        <Button
          title={isLoading ? 'Logging out...' : 'Sign Out'}
          variant="outline"
          onPress={logout}
          disabled={isLoading}
          style={styles.logoutBtn}
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
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(15, 118, 110, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary.light,
  },
  infoBox: {
    backgroundColor: 'rgba(15, 118, 110, 0.08)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    width: '100%',
    marginVertical: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoutBtn: {
    width: '100%',
    borderColor: COLORS.status.maintenance,
  },
});
