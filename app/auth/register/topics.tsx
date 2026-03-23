import Icon from '@/components/ui/Icon';
import { fonts, radius, spacing, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { useRegisterStore } from '@/store/registerStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StepDots, createSharedStyles } from './index';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const TOPIC_KEYS = [
  'ai', 'politics', 'philosophy', 'science',
  'economy', 'environment', 'education', 'health',
  'technology', 'culture', 'sport', 'history',
  'society', 'law', 'ethics', 'religion',
] as const;

export default function RegisterTopics() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const sharedStyles = useMemo(() => createSharedStyles(colors), [colors]);
  const styles = useMemo(() => createLocalStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { selectedTopics, toggleTopic } = useRegisterStore();
  const ctaScale = useSharedValue(1);

  const canContinue = selectedTopics.length >= 3;
  const ctaStyle = useAnimatedStyle(() => ({ transform: [{ scale: ctaScale.value }] }));

  return (
    <View style={[sharedStyles.root]}>
      <View style={[sharedStyles.topBar, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={sharedStyles.backBtn} hitSlop={12}>
          <Icon name="chevron-left" size={22} color={colors['on-surface']} />
        </Pressable>
        <StepDots current={1} />
        <View style={sharedStyles.backBtn} />
      </View>

      <ScrollView
        style={sharedStyles.scroll}
        contentContainerStyle={[sharedStyles.content, { paddingBottom: insets.bottom + spacing[8] }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={sharedStyles.card}>
          <Animated.Text entering={FadeInDown.delay(60).duration(400).springify()} style={sharedStyles.stepLabel}>{t('auth.step', { current: 2, total: 3 })}</Animated.Text>
          <Animated.Text entering={FadeInDown.delay(100).duration(400).springify()} style={sharedStyles.title}>{t('auth.register.topics.title')}</Animated.Text>
          <Animated.Text entering={FadeInDown.delay(140).duration(400).springify()} style={sharedStyles.subtitle}>
            {t('auth.register.topics.subtitle')}
          </Animated.Text>

          <Animated.View entering={FadeInDown.delay(180).duration(400).springify()} style={styles.grid}>
            {TOPIC_KEYS.map((key, i) => {
              const selected = selectedTopics.includes(key);
              return (
                <Animated.View
                  key={key}
                  entering={FadeInDown.delay(200 + i * 30).duration(350).springify()}
                >
                  <Pressable
                    onPress={() => toggleTopic(key)}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    {selected && (
                      <Icon name="check" size={11} color={colors['surface-container-lowest']} style={{ marginRight: 4 }} />
                    )}
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {t(`topics.${key}`)}
                    </Text>
                  </Pressable>
                </Animated.View>
              );
            })}
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(700).duration(400).springify()} style={styles.hint}>
            {canContinue
              ? t('auth.register.topics.selected', { count: selectedTopics.length })
              : t('auth.register.topics.remaining', { count: 3 - selectedTopics.length })}
          </Animated.Text>

          <Animated.View entering={FadeInDown.delay(740).duration(400).springify()}>
          <AnimatedPressable
            style={[sharedStyles.ctaWrapper, ctaStyle, !canContinue && sharedStyles.ctaDisabled]}
            onPressIn={() => { if (canContinue) ctaScale.value = withSpring(0.97, { damping: 15, stiffness: 300 }); }}
            onPressOut={() => { ctaScale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
            onPress={canContinue ? () => router.push('/auth/register/level') : undefined}
          >
            <LinearGradient
              colors={[colors.primary, colors['primary-dim']]}
              start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
              style={sharedStyles.ctaGradient}
            >
              <Text style={sharedStyles.ctaText}>{t('common.continue')}</Text>
            </LinearGradient>
          </AnimatedPressable>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const createLocalStyles = (colors: ColorTokens) => StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: radius.full, backgroundColor: colors['surface-container-low'],
  },
  chipSelected: { backgroundColor: colors['on-surface'] },
  chipText: { fontFamily: fonts.medium, fontSize: 13, color: colors['on-surface'] },
  chipTextSelected: { color: colors['surface-container-lowest'] },
  hint: {
    fontFamily: fonts.regular, fontSize: 12, color: colors['outline-variant'],
    textAlign: 'center', marginTop: spacing[4],
  },
});
