import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../theme';
import { Typography } from '../Typography';

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  isDisabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle | ViewStyle[] | undefined;
  textStyle?: TextStyle | TextStyle[] | undefined;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  isDisabled = false,
  fullWidth = true,
  style,
  textStyle,
  onPress,
  ...props
}) => {
  const disabled = isDisabled || isLoading;

  const getContainerStyle = (): ViewStyle => {
    let bgStyle: ViewStyle = { backgroundColor: COLORS.primary.main, ...SHADOWS.glowTeal };
    let borderStyle: ViewStyle = {};

    if (variant === 'secondary') {
      bgStyle = { backgroundColor: COLORS.secondary.main, ...SHADOWS.glowIndigo };
    } else if (variant === 'outline') {
      bgStyle = { backgroundColor: 'transparent' };
      borderStyle = { borderWidth: 1.5, borderColor: COLORS.primary.light };
    } else if (variant === 'ghost') {
      bgStyle = { backgroundColor: 'transparent' };
    }

    if (disabled) {
      bgStyle = { backgroundColor: COLORS.neutral.disabled };
      borderStyle = {};
    }

    let sizePadding: ViewStyle = { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg };
    if (size === 'small') {
      sizePadding = { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md };
    } else if (size === 'large') {
      sizePadding = { paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xl };
    }

    return {
      ...bgStyle,
      ...borderStyle,
      ...sizePadding,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
      width: fullWidth ? '100%' : undefined,
    };
  };

  const getTextColor = (): string => {
    if (disabled) return '#94A3B8';
    if (variant === 'outline' || variant === 'ghost') return COLORS.primary.light;
    return COLORS.primary.contrast;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      onPress={onPress}
      style={[getContainerStyle(), ...(Array.isArray(style) ? style : style ? [style] : [])]}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Typography
          color={getTextColor()}
          variant={size === 'small' ? 'caption' : 'body'}
          weight="bold"
          style={textStyle}
        >
          {title}
        </Typography>
      )}
    </TouchableOpacity>
  );
};
