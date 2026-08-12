import React from 'react';
import { View, StyleSheet, Text, ViewStyle } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../theme';

export interface BadgeProps {
  label: string;
  variant?: 'available' | 'reserved' | 'inUse' | 'maintenance' | 'primary' | 'secondary' | 'neutral';
  showDot?: boolean;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  showDot = false,
  style,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'available':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: COLORS.status.available, border: COLORS.status.available };
      case 'reserved':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: COLORS.status.reserved, border: COLORS.status.reserved };
      case 'inUse':
        return { bg: 'rgba(59, 130, 246, 0.15)', text: COLORS.status.inUse, border: COLORS.status.inUse };
      case 'maintenance':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: COLORS.status.maintenance, border: COLORS.status.maintenance };
      case 'primary':
        return { bg: 'rgba(15, 118, 110, 0.2)', text: COLORS.primary.light, border: COLORS.primary.light };
      case 'secondary':
        return { bg: 'rgba(99, 102, 241, 0.2)', text: COLORS.secondary.light, border: COLORS.secondary.light };
      default:
        return { bg: 'rgba(148, 163, 184, 0.15)', text: COLORS.neutral.textSecondary, border: COLORS.neutral.border };
    }
  };

  const { bg, text, border } = getVariantStyles();

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: border }, style]}>
      {showDot && <View style={[styles.dot, { backgroundColor: text }]} />}
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.full || 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: SPACING.xxs,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
