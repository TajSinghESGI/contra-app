import React, { memo, useCallback, useImperativeHandle, useMemo, forwardRef } from 'react';
import {
  TextInput,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { radius, spacing, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';

export interface InputRef {
  shake: () => void;
}

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxHeight?: number;
  style?: StyleProp<ViewStyle>;
  error?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const Input = memo(forwardRef<InputRef, InputProps>(function Input({
  value,
  onChangeText,
  placeholder,
  multiline = false,
  maxHeight,
  style,
  error = false,
  onFocus,
  onBlur,
}, ref) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const focusProgress = useSharedValue(0);
  const shakeX = useSharedValue(0);

  useImperativeHandle(ref, () => ({
    shake() {
      shakeX.value = withSequence(
        withTiming(1, { duration: 25 }),
        withTiming(-1, { duration: 25 }),
        withTiming(0, { duration: 25 }),
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  }), [shakeX]);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderWidth: withTiming(focusProgress.value > 0.5 || error ? 1 : 0, {
      duration: 180,
      easing: Easing.out(Easing.ease),
    }),
    borderColor: error ? colors.error : 'rgba(43,63,82,0.20)',
    transform: [{ translateX: shakeX.value }],
  }));

  const handleFocus = useCallback(() => {
    focusProgress.value = withTiming(1, { duration: 200 });
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    focusProgress.value = withTiming(0, { duration: 200 });
    onBlur?.();
  }, [onBlur]);

  return (
    <Animated.View style={[styles.container, animatedBorderStyle, style]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors['outline-variant']}
        multiline={multiline}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={[
          styles.input,
          multiline && styles.multiline,
          multiline && maxHeight ? { maxHeight } : undefined,
        ]}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </Animated.View>
  );
}));

const createStyles = (colors: ColorTokens) => StyleSheet.create({
  container: {
    backgroundColor: colors['surface-container-low'],
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  input: {
    fontSize: 16,
    color: colors['on-surface'],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontWeight: '400',
  },
  multiline: {
    minHeight: 56,
  },
});

export default Input;
