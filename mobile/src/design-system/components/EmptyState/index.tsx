import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING } from '../../theme';
import { Typography } from '../Typography';
import { Button } from '../Button';

export interface EmptyStateProps {
  title: string;
  description?: string;
  actionTitle?: string;
  onAction?: () => void;
  style?: ViewStyle | ViewStyle[] | undefined;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionTitle,
  onAction,
  style,
}) => {
  return (
    <View style={[styles.container, ...(Array.isArray(style) ? style : style ? [style] : [])]}>
      <Typography variant="h3" color={COLORS.neutral.textPrimary} align="center">
        {title}
      </Typography>
      {description ? (
        <Typography
          variant="body"
          color={COLORS.neutral.textSecondary}
          align="center"
          style={styles.description}
        >
          {description}
        </Typography>
      ) : null}
      {actionTitle && onAction ? (
        <Button title={actionTitle} onPress={onAction} style={styles.actionBtn} />
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
  description: {
    marginTop: SPACING.xs,
  },
  actionBtn: {
    marginTop: SPACING.lg,
  },
});
