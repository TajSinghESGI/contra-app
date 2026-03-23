import React, { memo } from 'react';
import { Text, StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { typography } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';

type TypographyVariant = keyof typeof typography;

interface TypographyProps {
  variant: TypographyVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
}

export const Typography = memo(function Typography({
  variant,
  color: colorProp,
  style,
  children,
  numberOfLines,
  ellipsizeMode,
}: TypographyProps) {
  const { colors } = useTheme();
  const color = colorProp ?? colors['on-surface'];
  return (
    <Text
      style={[styles.base, typography[variant] as TextStyle, { color }, style]}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
    >
      {children}
    </Text>
  );
});

const styles = StyleSheet.create({
  base: {
    // fontFamily comes from the typography token (SFProRounded-*)
  },
});

export default Typography;
