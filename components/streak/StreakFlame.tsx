import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface StreakFlameProps {
  streak: number;
  size?: number;
}

// Streak-specific colors (allowed exceptions per CLAUDE.md)
const FLAME_COLORS = {
  low: '#FF9500',       // orange (1-6)
  medium: '#FF5722',    // red-orange (7-29)
  high: '#4285F4',      // blue (30-99)
  legendary: '#AF52DE', // purple (100+)
} as const;

function getFlameColor(streak: number): string {
  if (streak >= 100) return FLAME_COLORS.legendary;
  if (streak >= 30) return FLAME_COLORS.high;
  if (streak >= 7) return FLAME_COLORS.medium;
  return FLAME_COLORS.low;
}

function getFlameScale(streak: number): number {
  if (streak >= 30) return 1.3;
  if (streak >= 7) return 1.1;
  return 0.9;
}

export function StreakFlame({ streak, size = 28 }: StreakFlameProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const baseScale = getFlameScale(streak);
  const color = getFlameColor(streak);

  useEffect(() => {
    // Gentle flickering animation
    scale.value = withRepeat(
      withSequence(
        withTiming(baseScale * 1.08, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(baseScale * 0.94, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(baseScale, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, // infinite
      false,
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.75, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.9, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [baseScale, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name="flame" size={size} color={color} />
    </Animated.View>
  );
}
