import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

interface VoiceWaveformProps {
  isActive: boolean;
}

const BAR_COUNT = 5;
const BAR_WIDTH = 3;
const BAR_GAP = 3;
const MIN_HEIGHT = 4;
const MAX_HEIGHT = 24;

export function VoiceWaveform({ isActive }: VoiceWaveformProps) {
  const { colors } = useTheme();

  const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
    const height = useSharedValue(MIN_HEIGHT);

    useEffect(() => {
      if (isActive) {
        const delay = i * 100;
        height.value = withDelay(
          delay,
          withRepeat(
            withSequence(
              withTiming(MAX_HEIGHT * (0.5 + Math.random() * 0.5), {
                duration: 300 + i * 50,
                easing: Easing.inOut(Easing.ease),
              }),
              withTiming(MIN_HEIGHT + Math.random() * 8, {
                duration: 250 + i * 40,
                easing: Easing.inOut(Easing.ease),
              }),
            ),
            -1,
            true,
          ),
        );
      } else {
        height.value = withTiming(MIN_HEIGHT, { duration: 200 });
      }
    }, [isActive]);

    const animatedStyle = useAnimatedStyle(() => ({
      height: height.value,
    }));

    return (
      <Animated.View
        key={i}
        style={[
          styles.bar,
          { backgroundColor: colors.primary },
          animatedStyle,
        ]}
      />
    );
  });

  return <View style={styles.container}>{bars}</View>;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: BAR_GAP,
    height: MAX_HEIGHT,
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: BAR_WIDTH / 2,
  },
});
