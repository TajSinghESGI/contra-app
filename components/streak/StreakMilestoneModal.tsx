import React, { useEffect } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { fonts } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';

interface Props {
  milestone: number | null;
  onDismiss: () => void;
}

const MILESTONE_LABELS: Record<number, { fr: string; en: string }> = {
  3: { fr: '3 jours !', en: '3 days!' },
  7: { fr: 'Une semaine !', en: 'One week!' },
  14: { fr: '2 semaines !', en: '2 weeks!' },
  30: { fr: 'Un mois !', en: 'One month!' },
};

export function StreakMilestoneModal({ milestone, onDismiss }: Props) {
  const { colors, fs } = useTheme();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (milestone) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const timer = setTimeout(onDismiss, 3500);
      return () => clearTimeout(timer);
    }
  }, [milestone]);

  if (!milestone) return null;

  const lang = i18n.language as 'fr' | 'en';
  const label = MILESTONE_LABELS[milestone]?.[lang] ?? `${milestone} days!`;

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
    >
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Animated.View entering={ZoomIn.delay(100).duration(400).springify()}>
          <Text style={[styles.emoji]}>🔥</Text>
          <Text style={[styles.number, { color: colors.primary, fontSize: fs(80) }]}>
            {milestone}
          </Text>
          <Text style={[styles.label, { color: colors['on-surface'], fontSize: fs(24) }]}>
            {label}
          </Text>
          <Text style={[styles.sub, { color: colors['on-surface-variant'], fontSize: fs(16) }]}>
            {lang === 'fr' ? 'Continue comme ça !' : 'Keep it up!'}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 60,
    textAlign: 'center',
    marginBottom: 8,
  },
  number: {
    fontFamily: fonts.thin,
    textAlign: 'center',
    lineHeight: 90,
  },
  label: {
    fontFamily: fonts.bold,
    textAlign: 'center',
    marginTop: 4,
  },
  sub: {
    fontFamily: fonts.regular,
    textAlign: 'center',
    marginTop: 8,
  },
});
