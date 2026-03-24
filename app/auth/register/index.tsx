import Icon from '@/components/ui/Icon';
import { fonts, radius, shadows, spacing, typography, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { useRegisterStore } from '@/store/registerStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { track } from '@/services/analytics';
import { AnalyticsEvents } from '@/services/analyticsEvents';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function RegisterStep1() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const sharedStyles = useMemo(() => createSharedStyles(colors), [colors]);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { fullName, email, password, setFullName, setEmail, setPassword } = useRegisterStore();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    track(AnalyticsEvents.SIGNUP_STARTED);
  }, []);

  const nameBorder    = useSharedValue(0);
  const emailBorder   = useSharedValue(0);
  const passwordBorder = useSharedValue(0);
  const ctaScale      = useSharedValue(1);

  const makeBorderStyle = (v: typeof nameBorder) =>
    useAnimatedStyle(() => ({
      borderColor: `rgba(43,63,82,${v.value * 0.20})`,
      borderWidth: 1,
    }));

  const nameBorderStyle     = makeBorderStyle(nameBorder);
  const emailBorderStyle    = makeBorderStyle(emailBorder);
  const passwordBorderStyle = makeBorderStyle(passwordBorder);
  const ctaStyle = useAnimatedStyle(() => ({ transform: [{ scale: ctaScale.value }] }));

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canContinue =
    fullName.trim().length > 0 &&
    isEmailValid &&
    password.length >= 6;

  return (
    <KeyboardAvoidingView
      style={styles.root}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Icon name="chevron-left" size={22} color={colors['on-surface']} />
        </Pressable>
        <StepDots current={0} />
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[8] }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.card}>
          <Animated.Text entering={FadeInDown.delay(60).duration(400).springify()} style={styles.stepLabel}>{t('auth.step', { current: 1, total: 3 })}</Animated.Text>
          <Animated.Text entering={FadeInDown.delay(100).duration(400).springify()} style={styles.title}>{t('auth.createAccount')}</Animated.Text>
          <Animated.Text entering={FadeInDown.delay(140).duration(400).springify()} style={styles.subtitle}>{t('auth.createAccountSub')}</Animated.Text>

          <Animated.View entering={FadeInDown.delay(180).duration(400).springify()}>
            <Text style={styles.fieldLabel}>{t('auth.fullNameLabel')}</Text>
            <Animated.View style={[styles.inputWrapper, nameBorderStyle]}>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder={t('auth.fullNamePlaceholder')}
                placeholderTextColor={colors['outline-variant']}
                autoCapitalize="words"
                autoCorrect={false}
                onFocus={() => { nameBorder.value = withTiming(1, { duration: 200 }); }}
                onBlur={() => { nameBorder.value = withTiming(0, { duration: 200 }); }}
              />
            </Animated.View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(220).duration(400).springify()} style={{ marginTop: spacing[4] }}>
            <Text style={styles.fieldLabel}>{t('auth.emailLabel')}</Text>
            <Animated.View style={[styles.inputWrapper, emailBorderStyle]}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={t('auth.emailPlaceholder')}
                placeholderTextColor={colors['outline-variant']}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => { emailBorder.value = withTiming(1, { duration: 200 }); }}
                onBlur={() => { emailBorder.value = withTiming(0, { duration: 200 }); }}
              />
            </Animated.View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(260).duration(400).springify()} style={{ marginTop: spacing[4] }}>
            <Text style={styles.fieldLabel}>{t('auth.passwordLabel')}</Text>
            <Animated.View style={[styles.inputWrapper, passwordBorderStyle]}>
              <TextInput
                style={[styles.input, { paddingRight: spacing[2] }]}
                value={password}
                onChangeText={setPassword}
                placeholder={t('auth.passwordPlaceholder')}
                placeholderTextColor={colors['outline-variant']}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => { passwordBorder.value = withTiming(1, { duration: 200 }); }}
                onBlur={() => { passwordBorder.value = withTiming(0, { duration: 200 }); }}
              />
              <Pressable
                style={styles.eyeBtn}
                onPress={() => setShowPassword((p) => !p)}
                hitSlop={8}
              >
                <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors['outline-variant']} />
              </Pressable>
            </Animated.View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(400).springify()}>
          <AnimatedPressable
            style={[styles.ctaWrapper, ctaStyle, !canContinue && styles.ctaDisabled]}
            onPressIn={() => { if (canContinue) ctaScale.value = withSpring(0.97, { damping: 15, stiffness: 300 }); }}
            onPressOut={() => { ctaScale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
            onPress={canContinue ? () => router.push('/auth/register/topics') : undefined}
          >
            <LinearGradient
              colors={[colors.primary, colors['primary-dim']]}
              start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>{t('common.continue')}</Text>
            </LinearGradient>
          </AnimatedPressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(340).duration(400).springify()}>
            <Text style={styles.terms}>
              {t('auth.termsNotice')}{' '}
              <Text style={styles.termsLink}>{t('auth.terms')}</Text>
              {' '}{t('auth.and')}{' '}
              <Text style={styles.termsLink}>{t('auth.privacy')}</Text>
            </Text>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('common.orContinueWith')}</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
              <Pressable style={styles.socialBtn}>
                <Text style={styles.googleG}>G</Text>
                <Text style={styles.socialBtnText}>{t('auth.google')}</Text>
              </Pressable>
              <Pressable style={styles.socialBtn}>
                <Ionicons name="logo-github" size={18} color={colors['on-surface']} />
                <Text style={styles.socialBtnText}>{t('auth.github')}</Text>
              </Pressable>
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>{t('auth.alreadyHaveAccount')} </Text>
              <Pressable onPress={() => router.replace('/auth/login')} hitSlop={8}>
                <Text style={styles.footerLink}>{t('auth.login')}</Text>
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Shared step dots ─────────────────────────────────────────────────────────

export function StepDots({ current }: { current: number }) {
  const { colors } = useTheme();
  const sharedStyles = useMemo(() => createSharedStyles(colors), [colors]);
  return (
    <View style={sharedStyles.dotsRow}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[sharedStyles.dot, i === current && sharedStyles.dotActive]} />
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

export const createSharedStyles = (colors: ColorTokens) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing[5], paddingBottom: spacing[3],
    backgroundColor: colors.background,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  dotsRow: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors['surface-container-highest'] },
  dotActive: { width: 20, backgroundColor: colors.primary },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing[4] },
  card: {
    backgroundColor: colors['surface-container-lowest'], borderRadius: 32, padding: spacing[7],
    ...shadows.ambient,
  },
  stepLabel: {
    ...typography['label-md'],
    color: colors.outline,
    marginBottom: spacing[2],
  },
  title: { ...typography['headline-md'], color: colors['on-surface'], marginBottom: 6 },
  subtitle: { ...typography['body-sm'], color: colors['on-surface-variant'], marginBottom: spacing[6] },
  fieldLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors['on-surface'], marginBottom: spacing[2] },
  inputWrapper: {
    backgroundColor: colors['surface-container-low'], borderRadius: radius.lg,
    flexDirection: 'row', alignItems: 'center', borderColor: 'transparent',
  },
  input: { flex: 1, paddingHorizontal: spacing[4], paddingVertical: 14, fontFamily: fonts.regular, fontSize: 15, color: colors['on-surface'] },
  eyeBtn: { paddingHorizontal: 14, paddingVertical: 14 },
  ctaWrapper: {
    marginTop: spacing[6], borderRadius: radius.full,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10, shadowRadius: 24, elevation: 3,
  },
  ctaDisabled: { opacity: 0.5, shadowOpacity: 0 },
  ctaGradient: { borderRadius: radius.full, height: 52, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: fonts.semibold, fontSize: 15, color: colors['on-primary'], letterSpacing: 0.5 },
});

const createStyles = (colors: ColorTokens) => StyleSheet.create({
  ...createSharedStyles(colors),
  terms: { fontFamily: fonts.regular, fontSize: 12, color: colors['on-surface-variant'], textAlign: 'center', marginTop: spacing[3], lineHeight: 18 },
  termsLink: { fontFamily: fonts.bold, color: colors['on-surface'] },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing[5] },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors['surface-container-high'] },
  dividerText: { fontFamily: fonts.semibold, fontSize: 11, color: colors['outline-variant'], letterSpacing: 1, paddingHorizontal: spacing[3] },
  socialRow: { flexDirection: 'row', gap: 10 },
  socialBtn: {
    flex: 1, backgroundColor: colors['surface-container-low'], borderRadius: radius.lg, height: spacing[12],
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2],
  },
  googleG: { fontFamily: fonts.bold, fontSize: 15, color: '#4285F4' },
  socialBtnText: { fontFamily: fonts.medium, fontSize: 14, color: colors['on-surface'] },
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing[5] },
  footerText: { fontFamily: fonts.regular, fontSize: 14, color: colors['on-surface-variant'] },
  footerLink: { fontFamily: fonts.bold, fontSize: 14, color: colors['on-surface'] },
});
