import React from 'react';
import { View, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING } from '../../theme';
import { Typography } from '../Typography';

export interface LoadingProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle | ViewStyle[] | undefined;
}

export const Loading: React.FC<LoadingProps> = ({
  message = 'Loading...',
  size = 'large',
  color = COLORS.primary.main,
  style,
}) => {
  return (
    <View style={[styles.container, ...(Array.isArray(style) ? style : style ? [style] : [])]}>
      <ActivityIndicator size={size} color={color} />
      {message ? (
        <Typography variant="caption" color={COLORS.neutral.textSecondary} style={styles.message}>
          {message}
        </Typography>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    marginTop: SPACING.md,
  },
});
