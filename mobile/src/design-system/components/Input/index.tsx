import React, { useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../theme';
import { Typography } from '../Typography';

export interface InputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: ViewStyle | ViewStyle[] | undefined;
  inputStyle?: TextStyle | TextStyle[] | undefined;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const getBorderColor = (): string => {
    if (error) return COLORS.status.maintenance;
    if (isFocused) return COLORS.primary.main;
    return COLORS.neutral.border;
  };

  return (
    <View style={[styles.container, ...(Array.isArray(containerStyle) ? containerStyle : containerStyle ? [containerStyle] : [])]}>
      {label && (
        <Typography variant="caption" weight="medium" color={COLORS.neutral.textSecondary} style={styles.label}>
          {label}
        </Typography>
      )}

      <RNTextInput
        style={[
          styles.input,
          { borderColor: getBorderColor() },
          ...(Array.isArray(inputStyle) ? inputStyle : inputStyle ? [inputStyle] : []),
        ]}
        placeholderTextColor={COLORS.neutral.disabled}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />

      {error ? (
        <Typography variant="caption" color={COLORS.status.maintenance} style={styles.helper}>
          {error}
        </Typography>
      ) : helperText ? (
        <Typography variant="caption" color={COLORS.neutral.textSecondary} style={styles.helper}>
          {helperText}
        </Typography>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
    width: '100%',
  },
  label: {
    marginBottom: SPACING.xs,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontSize: 16,
    color: COLORS.neutral.textPrimary,
    backgroundColor: COLORS.neutral.surface,
  },
  helper: {
    marginTop: SPACING.xxs,
  },
});
