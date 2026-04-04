import React, { memo, useEffect, useMemo } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { spacing, radius, fonts, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';

interface UserMessageProps {
  content: string;
}

export const UserMessage = memo(function UserMessage({
  content,
}: UserMessageProps) {
  const { colors, fs } = useTheme();
  const styles = useMemo(() => createStyles(colors, fs), [colors, fs]);
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
      <Text style={styles.content} selectable>
        {content}
      </Text>
    </Animated.View>
  );
});

const createStyles = (colors: ColorTokens, fs: (size: number) => number) => StyleSheet.create({
  bubble: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    backgroundColor: colors['accent-user-container'],
    borderRadius: radius['2xl'],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginVertical: spacing[1],
  },
  content: {
    fontSize: fs(16),
    fontFamily: fonts.regular,
    lineHeight: 26,
    color: colors['on-surface'],
  },
});

export default UserMessage;
