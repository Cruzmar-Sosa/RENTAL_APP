import React from 'react';
import { View, StyleSheet, ViewStyle, ViewProps } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../theme';

export interface CardProps extends ViewProps {
  variant?: 'elevated' | 'outlined' | 'flat';
  style?: ViewStyle | ViewStyle[] | undefined;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'elevated',
  style,
  children,
  ...props
}) => {
  const getVariantStyle = (): ViewStyle => {
    if (variant === 'outlined') {
      return {
        borderWidth: 1,
        borderColor: COLORS.neutral.border,
      };
    }
    if (variant === 'flat') {
      return {
        backgroundColor: COLORS.neutral.background,
      };
    }
    return SHADOWS.md;
  };

  return (
    <View style={[styles.card, getVariantStyle(), ...(Array.isArray(style) ? style : style ? [style] : [])]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.neutral.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
});
