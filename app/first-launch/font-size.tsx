import React, { useMemo } from 'react';
import { View, Text, Pressable, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Icon from '@/components/ui/Icon';
import { FONT_SIZE_OPTIONS, fonts, radius, spacing, type ColorTokens, type FontSizeOption } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { useFontSizeStore } from '@/store/fontSizeStore';
import { useOnboardingStore } from '@/store/onboardingStore';

export default function FontSizeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, typography, fs } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const currentSize = useFontSizeStore((s) => s.size);
  const setSize = useFontSizeStore((s) => s.setSize);
  const markCompleted = useOnboardingStore((s) => s.markCompleted);

  const LABELS: Record<FontSizeOption, string> = {
    small: t('profile.fontSize.small'),
    default: t('profile.fontSize.default'),
    large: t('profile.fontSize.large'),
  };

  const PREVIEW_SIZES: Record<FontSizeOption, number> = {
    small: 16,
    default: 18,
    large: 20,
  };

  const handleFinish = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    markCompleted();
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing[6] }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
        <Text style={styles.eyebrow}>{t('firstLaunch.fontSize.eyebrow')}</Text>
        <Text style={styles.title}>{t('firstLaunch.fontSize.title')}</Text>
        <Text style={styles.subtitle}>{t('firstLaunch.fontSize.subtitle')}</Text>
      </Animated.View>

      {/* Options */}
      <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.options}>
        {FONT_SIZE_OPTIONS.map(({ id }) => {
          const isActive = currentSize === id;
          return (
            <TouchableOpacity
              key={id}
              style={[styles.optionRow, isActive && styles.optionRowActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSize(id);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
                {LABELS[id]}
              </Text>
              {isActive && <Icon name="verified-check" size={18} color={colors['on-primary']} />}
            </TouchableOpacity>
          );
        })}
      </Animated.View>

      {/* Preview */}
      <Animated.View entering={FadeInDown.delay(450).duration(500)} style={styles.previewCard}>
        <Text style={[styles.previewText, { fontSize: PREVIEW_SIZES[currentSize], lineHeight: PREVIEW_SIZES[currentSize] + 10 }]}>
          {t('profile.fontSize.preview')}
        </Text>
      </Animated.View>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing[4] }]}>
        <Pressable onPress={handleFinish}>
          <LinearGradient
            colors={[colors.primary, colors['primary-dim']]}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>{t('firstLaunch.fontSize.cta')}</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: ColorTokens, typography: any, fs: (n: number) => number) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing[5],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[8],
    gap: spacing[2],
  },
  eyebrow: {
    ...typography['label-md'],
    color: colors.outline,
  },
  title: {
    ...typography['headline-md'],
    color: colors['on-surface'],
    textAlign: 'center',
  },
  subtitle: {
    ...typography['body-sm'],
    color: colors['on-surface-variant'],
    textAlign: 'center',
  },
  options: {
    gap: spacing[2],
    marginBottom: spacing[6],
  },
  optionRow: {
    backgroundColor: colors['surface-container-low'],
    borderRadius: radius.xl,
    paddingHorizontal: spacing[4],
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionRowActive: {
    backgroundColor: colors.primary,
  },
  optionLabel: {
    fontFamily: fonts.medium,
    fontSize: fs(16),
    color: colors['on-surface'],
  },
  optionLabelActive: {
    color: colors['on-primary'],
  },
  previewCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['2xl'],
    padding: spacing[5],
  },
  previewText: {
    fontFamily: fonts.regular,
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
});
