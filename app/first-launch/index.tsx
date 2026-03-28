import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { fonts, radius, spacing, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingStore } from '@/store/onboardingStore';

const STEPS = [
  { emoji: '👋', titleKey: 'firstLaunch.welcome.steps.0.title', bodyKey: 'firstLaunch.welcome.steps.0.body' },
  { emoji: '🤖', titleKey: 'firstLaunch.welcome.steps.1.title', bodyKey: 'firstLaunch.welcome.steps.1.body' },
  { emoji: '⚡', titleKey: 'firstLaunch.welcome.steps.2.title', bodyKey: 'firstLaunch.welcome.steps.2.body' },
  { emoji: '📊', titleKey: 'firstLaunch.welcome.steps.3.title', bodyKey: 'firstLaunch.welcome.steps.3.body' },
];

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, typography, fs } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const markCompleted = useOnboardingStore((s) => s.markCompleted);

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/first-launch/demo');
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    markCompleted();
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
          <Text style={styles.eyebrow}>{t('firstLaunch.welcome.eyebrow')}</Text>
          <Text style={styles.title}>{t('firstLaunch.welcome.title')}</Text>
          <Text style={styles.subtitle}>{t('firstLaunch.welcome.subtitle')}</Text>
        </Animated.View>

        {/* Steps */}
        {STEPS.map((step, i) => (
          <Animated.View
            key={i}
            entering={FadeInDown.delay(300 + i * 120).duration(500)}
            style={styles.stepCard}
          >
            <Text style={styles.stepEmoji}>{step.emoji}</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{t(step.titleKey)}</Text>
              <Text style={styles.stepBody}>{t(step.bodyKey)}</Text>
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing[4] }]}>
        <Pressable onPress={handleContinue}>
          <LinearGradient
            colors={[colors.primary, colors['primary-dim']]}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>{t('firstLaunch.welcome.cta')}</Text>
          </LinearGradient>
        </Pressable>
        <Pressable onPress={handleSkip} hitSlop={12}>
          <Text style={styles.skipText}>{t('firstLaunch.welcome.skip')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: ColorTokens, typography: any, fs: (n: number) => number) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: spacing[5],
  },
  header: {
    alignItems: 'center',
    marginTop: spacing[10],
    marginBottom: spacing[8],
    gap: spacing[2],
  },
  eyebrow: {
    ...typography['label-md'],
    color: colors.outline,
  },
  title: {
    ...typography['headline-lg'],
    color: colors['on-surface'],
    textAlign: 'center',
  },
  subtitle: {
    ...typography['body-md'],
    color: colors['on-surface-variant'],
    textAlign: 'center',
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['2xl'],
    padding: spacing[4],
    marginBottom: spacing[3],
    gap: spacing[3],
    alignItems: 'flex-start',
  },
  stepEmoji: {
    fontSize: 28,
    marginTop: 2,
  },
  stepContent: {
    flex: 1,
    gap: spacing[1],
  },
  stepTitle: {
    fontFamily: fonts.bold,
    fontSize: fs(16),
    color: colors['on-surface'],
  },
  stepBody: {
    fontFamily: fonts.regular,
    fontSize: fs(14),
    lineHeight: fs(22),
    color: colors['on-surface-variant'],
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    backgroundColor: colors.background,
    alignItems: 'center',
    gap: spacing[3],
  },
  cta: {
    borderRadius: radius.full,
    paddingVertical: 16,
    paddingHorizontal: 64,
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: fonts.semibold,
    fontSize: fs(15),
    color: colors['on-primary'],
    letterSpacing: 0.5,
  },
  skipText: {
    fontFamily: fonts.medium,
    fontSize: fs(13),
    color: colors['outline-variant'],
  },
});
