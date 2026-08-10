import React from 'react';
import { Text as RNText, TextStyle, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../../theme';

export interface TypographyProps extends RNTextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'subtitle';
  color?: string;
  weight?: 'regular' | 'medium' | 'bold';
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  style?: TextStyle | TextStyle[] | undefined;
  children: React.ReactNode;
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  color = COLORS.neutral.textPrimary,
  weight,
  align = 'left',
  style,
  children,
  ...props
}) => {
  const getVariantStyle = (): TextStyle => {
    switch (variant) {
      case 'h1':
        return {
          fontSize: TYPOGRAPHY.fontSize.hero,
          lineHeight: TYPOGRAPHY.fontSize.hero * TYPOGRAPHY.lineHeight.tight,
          fontWeight: weight ? getFontWeight(weight) : '700',
        };
      case 'h2':
        return {
          fontSize: TYPOGRAPHY.fontSize.xxl,
          lineHeight: TYPOGRAPHY.fontSize.xxl * TYPOGRAPHY.lineHeight.tight,
          fontWeight: weight ? getFontWeight(weight) : '700',
        };
      case 'h3':
        return {
          fontSize: TYPOGRAPHY.fontSize.xl,
          lineHeight: TYPOGRAPHY.fontSize.xl * TYPOGRAPHY.lineHeight.tight,
          fontWeight: weight ? getFontWeight(weight) : '600',
        };
      case 'subtitle':
        return {
          fontSize: TYPOGRAPHY.fontSize.lg,
          lineHeight: TYPOGRAPHY.fontSize.lg * TYPOGRAPHY.lineHeight.normal,
          fontWeight: weight ? getFontWeight(weight) : '500',
        };
      case 'caption':
        return {
          fontSize: TYPOGRAPHY.fontSize.xs,
          lineHeight: TYPOGRAPHY.fontSize.xs * TYPOGRAPHY.lineHeight.normal,
          fontWeight: weight ? getFontWeight(weight) : '400',
        };
      case 'body':
      default:
        return {
          fontSize: TYPOGRAPHY.fontSize.md,
          lineHeight: TYPOGRAPHY.fontSize.md * TYPOGRAPHY.lineHeight.normal,
          fontWeight: weight ? getFontWeight(weight) : '400',
        };
    }
  };

  return (
    <RNText
      style={[
        styles.base,
        getVariantStyle(),
        { color, textAlign: align },
        ...(Array.isArray(style) ? style : style ? [style] : []),
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
};

function getFontWeight(weight: 'regular' | 'medium' | 'bold'): TextStyle['fontWeight'] {
  if (weight === 'bold') return '700';
  if (weight === 'medium') return '500';
  return '400';
}

const styles = StyleSheet.create({
  base: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
});
