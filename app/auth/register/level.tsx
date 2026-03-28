import Icon from '@/components/ui/Icon';
import { fonts, radius, spacing, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useRegisterStore } from '@/store/registerStore';
import { apiRegister, updateProfile } from '@/services/api';
import { loginUser } from '@/services/revenuecat';
import { track, identify } from '@/services/analytics';
import { AnalyticsEvents } from '@/services/analyticsEvents';
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

const DIFFICULTIES = [
  { id: 'easy',   color: '#34C759', premium: false },
  { id: 'medium', color: '#FF9500', premium: false },
  { id: 'hard',   color: '#FF3B30', premium: false },
  { id: 'brutal', color: '#AF52DE', premium: true },
] as const;

export default function RegisterLevel() {
  const { colors, typography, fs } = useTheme();
  const { t } = useTranslation();
  const sharedStyles = useMemo(() => createSharedStyles(colors, typography, fs), [colors, typography, fs]);
  const styles = useMemo(() => createLocalStyles(colors, fs), [colors, fs]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { fullName, email, password, selectedTopics, selectedDifficulty, setDifficulty, reset } = useRegisterStore();
  const login = useAuthStore((s) => s.login);
  const ctaScale = useSharedValue(1);
  const ctaStyle = useAnimatedStyle(() => ({ transform: [{ scale: ctaScale.value }] }));

  const handleFinish = async () => {
    try {
      const res = await apiRegister(email, password, fullName);
      await login(res.token, res.user);
      await loginUser(res.user.id);
      identify(res.user.id, { email: res.user.email, name: res.user.full_name });
      track(AnalyticsEvents.SIGNUP_COMPLETED, {
        difficulty: selectedDifficulty,
        topicCount: selectedTopics.length,
      });
      // Save preferences (topics + difficulty)
      await updateProfile({
        default_difficulty: selectedDifficulty,
        selected_topics: selectedTopics,
      });
      reset();
      router.replace('/(tabs)');
    } catch (e: any) {
      // TODO: show error toast
      console.error('Registration failed:', e.message);
    }
  };

  return (
    <View style={sharedStyles.root}>
      <View style={[sharedStyles.topBar, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={sharedStyles.backBtn} hitSlop={12}>
          <Icon name="chevron-left" size={22} color={colors['on-surface']} />
        </Pressable>
        <StepDots current={2} />
        <View style={sharedStyles.backBtn} />
      </View>

      <ScrollView
        style={sharedStyles.scroll}
        contentContainerStyle={[sharedStyles.content, { paddingBottom: insets.bottom + spacing[8] }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={sharedStyles.card}>
          <Animated.Text entering={FadeInDown.delay(60).duration(400).springify()} style={sharedStyles.stepLabel}>{t('auth.step', { current: 3, total: 3 })}</Animated.Text>
          <Animated.Text entering={FadeInDown.delay(100).duration(400).springify()} style={sharedStyles.title}>{t('auth.register.level.title')}</Animated.Text>
          <Animated.Text entering={FadeInDown.delay(140).duration(400).springify()} style={sharedStyles.subtitle}>
            {t('auth.register.level.subtitle')}
          </Animated.Text>

          <View style={styles.list}>
            {DIFFICULTIES.map((d, i) => {
              const active = selectedDifficulty === d.id;
              return (
                <Animated.View key={d.id} entering={FadeInDown.delay(180 + i * 60).duration(400).springify()}>
                  <Pressable
                    onPress={() => !d.premium && setDifficulty(d.id)}
                    style={[styles.card, active && styles.cardActive]}
                  >
                    <View style={[styles.dot, { backgroundColor: d.color }]} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.titleRow}>
                        <Text style={[styles.label, active && styles.labelActive]}>
                          {t(`difficulty.${d.id}`)}
                        </Text>
                        {d.premium && (
                          <View style={styles.proBadge}>
                            <Text style={styles.proBadgeText}>{t('common.pro')}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.desc}>{t(`auth.register.level.descriptions.${d.id}`)}</Text>
                    </View>
                    {active && <Icon name="check" size={16} color={colors.primary} />}
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>

          <Animated.View entering={FadeInDown.delay(440).duration(400).springify()}>
          <AnimatedPressable
            style={[sharedStyles.ctaWrapper, ctaStyle]}
            onPressIn={() => { ctaScale.value = withSpring(0.97, { damping: 15, stiffness: 300 }); }}
            onPressOut={() => { ctaScale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
            onPress={handleFinish}
          >
            <LinearGradient
              colors={[colors.primary, colors['primary-dim']]}
              start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
              style={sharedStyles.ctaGradient}
            >
              <Text style={sharedStyles.ctaText}>{t('auth.start')}</Text>
            </LinearGradient>
          </AnimatedPressable>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const createLocalStyles = (colors: ColorTokens, fs: (n: number) => number) => StyleSheet.create({
  list: { gap: 10 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors['surface-container-low'], borderRadius: radius.xl,
    paddingHorizontal: spacing[4], paddingVertical: 14,
  },
  cardActive: {
    backgroundColor: colors['surface-container-lowest'],
    shadowColor: colors['on-surface'], shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 2,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: 2 },
  label: { fontFamily: fonts.semibold, fontSize: fs(15), color: colors['on-surface-variant'] },
  labelActive: { color: colors['on-surface'] },
  desc: { fontFamily: fonts.regular, fontSize: fs(12), color: colors['outline-variant'] },
  proBadge: {
    backgroundColor: '#AF52DE', borderRadius: radius.md,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  proBadgeText: { fontFamily: fonts.bold, fontSize: fs(9), color: colors['surface-container-lowest'], letterSpacing: 0.5 },
});
