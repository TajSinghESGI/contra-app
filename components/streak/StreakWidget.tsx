import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { fonts, radius, spacing, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { useStreakStore } from '@/store/streakStore';
import { useTranslation } from 'react-i18next';
import Icon from '@/components/ui/Icon';

export function StreakWidget() {
  const { colors, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, fs), [colors, fs]);
  const currentStreak = useStreakStore((s) => s.currentStreak);
  const longestStreak = useStreakStore((s) => s.longestStreak);

  if (currentStreak < 1) return null;

  return (
    <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.row}>
      <Icon name="fire" size={16} color={colors.primary} />
      <Text style={styles.count}>{currentStreak}{t('streak.daysShort')}</Text>
      {longestStreak > currentStreak && (
        <Text style={styles.best}>{t('streak.longestPrefix')} {longestStreak}{t('streak.daysShort')}</Text>
      )}
    </Animated.View>
  );
}

const createStyles = (colors: ColorTokens, fs: (n: number) => number) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
      backgroundColor: colors['surface-container-lowest'],
      borderRadius: radius.full,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[2],
      alignSelf: 'flex-start',
    },
    count: {
      fontFamily: fonts.bold,
      fontSize: fs(14),
      color: colors['on-surface'],
    },
    best: {
      fontFamily: fonts.regular,
      fontSize: fs(12),
      color: colors['outline-variant'],
    },
  });
