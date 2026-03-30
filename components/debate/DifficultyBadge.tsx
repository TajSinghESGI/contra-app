import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DIFFICULTY_LEVELS, radius, fonts, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';

type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'brutal';

interface DifficultyBadgeProps {
  level: DifficultyLevel;
}

function getBadgeStyles(level: DifficultyLevel, colors: ColorTokens): { backgroundColor: string; color: string } {
  const map: Record<DifficultyLevel, { backgroundColor: string; color: string }> = {
    easy:   { backgroundColor: '#e3f9e5', color: '#2d6a2f' },
    medium: { backgroundColor: '#fff3cd', color: '#856404' },
    hard:   { backgroundColor: '#ffe0dd', color: '#9f403d' },
    brutal: { backgroundColor: colors['inverse-surface'], color: '#ffffff' },
  };
  return map[level];
}

function getLabelForLevel(level: DifficultyLevel): string {
  const found = DIFFICULTY_LEVELS.find((d) => d.id === level);
  return found ? found.label : level;
}

export const DifficultyBadge = memo(function DifficultyBadge({
  level,
}: DifficultyBadgeProps) {
  const { colors, fs } = useTheme();
  const styles = useMemo(() => createStyles(colors, fs), [colors, fs]);
  const { backgroundColor, color } = getBadgeStyles(level, colors);
  const label = getLabelForLevel(level);

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
});

const createStyles = (colors: ColorTokens, fs: (size: number) => number) => StyleSheet.create({
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: fs(11),
    fontFamily: fonts.semibold,
    letterSpacing: 0.5,
  },
});

export default DifficultyBadge;
