import React, { memo, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { spacing, fonts, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';

interface LiveScoreBarProps {
  score: number; // 0–100
  label?: string;
  delay?: number;
}

export const LiveScoreBar = memo(function LiveScoreBar({
  score,
  label,
  delay = 0,
}: LiveScoreBarProps) {
  const { colors, fs } = useTheme();
  const styles = useMemo(() => createStyles(colors, fs), [colors, fs]);
  // Clamp score to 0-100
  const clampedScore = Math.max(0, Math.min(100, score));
  const fillWidth = useSharedValue(0);

  useEffect(() => {
    const timing = withTiming(clampedScore, {
      duration: 800,
      easing: Easing.out(Easing.exp),
    });
    fillWidth.value = delay > 0 ? withDelay(delay, timing) : timing;
  }, [clampedScore]);

  const animatedFillStyle = useAnimatedStyle(() => ({
    width: `${fillWidth.value}%` as `${number}%`,
  }));

  return (
    <View style={styles.container}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.scoreText}>{clampedScore}</Text>
        </View>
      ) : null}
      <View style={styles.track}>
        <Animated.View style={[styles.fill, animatedFillStyle]} />
      </View>
    </View>
  );
});

const createStyles = (colors: ColorTokens, fs: (size: number) => number) => StyleSheet.create({
  container: {
    gap: spacing[1],
    alignSelf: 'stretch',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: fs(9),
    fontFamily: fonts.semibold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors['on-surface-variant'],
  },
  scoreText: {
    fontSize: fs(9),
    fontFamily: fonts.semibold,
    letterSpacing: 1.2,
    color: colors['on-surface-variant'],
  },
  track: {
    height: 4,
    backgroundColor: colors['surface-container-high'],
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    backgroundColor: colors['accent-user'],
    borderRadius: 2,
  },
});

export default LiveScoreBar;
