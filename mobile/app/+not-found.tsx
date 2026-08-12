import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Button } from '@design-system/components';
import { COLORS, SPACING } from '@design-system/theme';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Typography variant="h1" align="center" style={styles.title}>
        Screen Not Found
      </Typography>
      <Typography variant="body" color={COLORS.neutral.textSecondary} align="center" style={styles.subtitle}>
        The requested screen does not exist or has been moved.
      </Typography>
      <Button
        title="Return to Stations"
        onPress={() => router.replace('/(app)/map')}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.neutral.background,
  },
  title: {
    marginBottom: SPACING.xs,
  },
  subtitle: {
    marginBottom: SPACING.xl,
  },
  button: {
    minWidth: 200,
  },
});
