import React, { memo, useEffect, useMemo } from 'react';
import { Text, TextInput, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { spacing, radius, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';

interface UserMessageProps {
  content: string;
}

export const UserMessage = memo(function UserMessage({
  content,
}: UserMessageProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 280,
      easing: Easing.out(Easing.ease),
    });
    translateX.value = withSpring(0, {
      damping: 22,
      stiffness: 280,
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[styles.bubble, animatedStyle]}>
      <TextInput
        style={styles.content}
        value={content}
        editable={false}
        multiline
        scrollEnabled={false}
      />
    </Animated.View>
  );
});

const createStyles = (colors: ColorTokens) => StyleSheet.create({
  bubble: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
    backgroundColor: colors['accent-user-container'],
    borderWidth: 1,
    borderColor: colors['accent-user-container'],
    borderRadius: radius['2xl'],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginVertical: spacing[1],
  },
  content: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 26,
    color: colors['on-surface'],
    textAlign: 'right',
  },
});

export default UserMessage;
