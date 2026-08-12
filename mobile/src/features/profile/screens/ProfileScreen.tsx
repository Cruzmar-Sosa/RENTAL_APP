import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Card, Button } from '@design-system/components';
import { COLORS, SPACING } from '@design-system/theme';
import { useAuth } from '../../authentication/hooks/useAuth';

export const ProfileScreen: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h1" style={styles.title}>
        User Profile
      </Typography>

      <Card style={styles.card}>
        <Typography variant="h2">{user?.fullName || 'User Profile'}</Typography>
        <Typography variant="body" color={COLORS.neutral.textSecondary} style={styles.email}>
          {user?.email || 'user@example.com'}
        </Typography>
        <Typography variant="caption" color={COLORS.primary.main} weight="bold">
          Role: {user?.role || 'CUSTOMER'}
        </Typography>
      </Card>

      <Card style={styles.card}>
        <Typography variant="h3" style={styles.sectionTitle}>Account Actions</Typography>

        <Button
          title="Payment History"
          variant="outline"
          onPress={() => router.push('/(app)/payments')}
          style={styles.actionBtn}
        />

        <Button
          title="Sign Out"
          variant="ghost"
          onPress={handleLogout}
          style={styles.logoutBtn}
        />
      </Card>
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
  card: {
    marginBottom: SPACING.md,
  },
  email: {
    marginVertical: SPACING.xs,
  },
  sectionTitle: {
    marginBottom: SPACING.md,
  },
  actionBtn: {
    marginBottom: SPACING.sm,
  },
  logoutBtn: {
    marginTop: SPACING.xs,
  },
});
