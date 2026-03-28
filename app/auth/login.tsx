import Icon from '@/components/ui/Icon';
import { fonts, radius, shadows, spacing, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { apiLogin } from '@/services/api';
import { loginUser } from '@/services/revenuecat';
import { track, identify } from '@/services/analytics';
import { AnalyticsEvents } from '@/services/analyticsEvents';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function LoginScreen() {
  const { colors, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const emailBorderOpacity = useSharedValue(0);
  const passwordBorderOpacity = useSharedValue(0);
  const ctaScale = useSharedValue(1);
  const shakeEmail = useSharedValue(0);
  const shakePassword = useSharedValue(0);

  const isFormValid = email.trim().length > 0 && password.length > 0;

  const shake = useCallback((sv: Animated.SharedValue<number>) => {
    sv.value = withSequence(
      withTiming(1, { duration: 25 }),
      withTiming(-1, { duration: 25 }),
      withTiming(0, { duration: 25 }),
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);

  const emailBorderStyle = useAnimatedStyle(() => ({
    borderColor: emailError ? colors.error : `rgba(43, 63, 82, ${emailBorderOpacity.value * 0.20})`,
    borderWidth: emailError ? 1 : emailBorderOpacity.value,
    transform: [{ translateX: shakeEmail.value }],
  }));

  const passwordBorderStyle = useAnimatedStyle(() => ({
    borderColor: passwordError ? colors.error : `rgba(43, 63, 82, ${passwordBorderOpacity.value * 0.20})`,
    borderWidth: passwordError ? 1 : passwordBorderOpacity.value,
    transform: [{ translateX: shakePassword.value }],
  }));

  const ctaAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ctaScale.value }],
  }));

  const handleLogin = async () => {
    if (!isFormValid || isLoading) return;
    setEmailError(null);
    setPasswordError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError(t('auth.errors.invalidEmail'));
      shake(shakeEmail);
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiLogin(email.trim(), password);
      await login(res.token, res.refresh, res.user);
      await loginUser(res.user.id);
      identify(res.user.id, { email: res.user.email, name: res.user.full_name });
      track(AnalyticsEvents.LOGIN);
      // Sync language preference
      const { useTopicStore } = require('@/store/topicStore');
      useTopicStore.getState().setLang(res.user.language ?? 'fr');
      router.replace('/(tabs)');
    } catch {
      setPasswordError(t('auth.errors.invalidCredentials'));
      shake(shakePassword);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing[6], paddingBottom: insets.bottom + spacing[8] }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBadge}>
              <Image
                source={require('@/assets/images/logo-contra.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>

          <Text style={styles.cardTitle}>{t('auth.welcomeBack')}</Text>
          <Text style={styles.cardSubtitle}>
            {t('auth.welcomeBackSub')}
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('auth.emailLabel')}</Text>
            <Animated.View style={[styles.inputWrapper, emailBorderStyle]}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(v) => { setEmail(v); setEmailError(null); }}
                placeholder={t('auth.emailPlaceholder')}
                placeholderTextColor={colors['outline-variant']}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => { emailBorderOpacity.value = withTiming(1, { duration: 200 }); }}
                onBlur={() => { emailBorderOpacity.value = withTiming(0, { duration: 200 }); }}
              />
            </Animated.View>
            {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
          </View>

          <View style={styles.passwordFieldGroup}>
            <View style={styles.passwordLabelRow}>
              <Text style={styles.fieldLabel}>{t('auth.passwordLabel')}</Text>
              <Pressable hitSlop={8} onPress={() => router.push('/auth/forgot-password')} accessibilityRole="button">
                <Text style={styles.forgotPassword}>{t('auth.forgotPassword')}</Text>
              </Pressable>
            </View>
            <Animated.View style={[styles.inputWrapper, passwordBorderStyle]}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={(v) => { setPassword(v); setPasswordError(null); }}
                placeholder={t('auth.passwordPlaceholder')}
                placeholderTextColor={colors['outline-variant']}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => { passwordBorderOpacity.value = withTiming(1, { duration: 200 }); }}
                onBlur={() => { passwordBorderOpacity.value = withTiming(0, { duration: 200 }); }}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowPassword((prev) => !prev)}
                hitSlop={8}
                accessibilityRole="button"
              >
                <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors['outline-variant']} />
              </Pressable>
            </Animated.View>
            {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
          </View>

          <AnimatedPressable
            style={[styles.ctaWrapper, ctaAnimatedStyle, (!isFormValid || isLoading) && styles.ctaDisabled]}
            onPressIn={() => {
              if (isFormValid && !isLoading) {
                ctaScale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
              }
            }}
            onPressOut={() => { ctaScale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
            onPress={handleLogin}
            disabled={!isFormValid || isLoading}
            accessibilityRole="button"
            accessibilityState={{ disabled: !isFormValid || isLoading }}
          >
            <LinearGradient
              colors={[colors.primary, colors['primary-dim']]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.ctaGradient}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors['on-primary']} />
              ) : (
                <Text style={styles.ctaText}>{t('auth.login')}</Text>
              )}
            </LinearGradient>
          </AnimatedPressable>

          <View style={styles.dividerRow}>
            <Text style={styles.dividerText}>{t('common.or')}</Text>
          </View>

          <View style={styles.socialRow}>
            <Pressable style={styles.socialButton} accessibilityRole="button">
              <Text style={styles.googleG}>G</Text>
              <Text style={styles.socialButtonText}>{t('auth.google')}</Text>
            </Pressable>
            <Pressable style={styles.socialButton} accessibilityRole="button">
              <Text style={styles.appleIcon}>{'\uF8FF'}</Text>
              <Text style={styles.socialButtonText}>{t('auth.apple')}</Text>
            </Pressable>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>{t('auth.noAccount')} </Text>
            <Pressable onPress={() => router.push('/auth/register')} hitSlop={8} accessibilityRole="button">
              <Text style={styles.footerLink}>{t('auth.signUp')}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ColorTokens, typography: any, fs: (n: number) => number) => StyleSheet.create({
  keyboardAvoid: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1 },

  card: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: 32,
    marginHorizontal: spacing[4],
    padding: spacing[7],
    ...shadows.ambient,
  },

  logoContainer: { alignItems: 'center', marginBottom: spacing[6] },
  logoBadge: {
    width: spacing[16],
    height: spacing[16],
    borderRadius: radius['2xl'],
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: { width: 84, height: 84 },

  cardTitle: {
    ...typography['headline-md'],
    color: colors['on-surface'],
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  cardSubtitle: {
    ...typography['body-sm'],
    color: colors['on-surface-variant'],
    textAlign: 'center',
    marginBottom: spacing[7],
  },

  fieldGroup: { marginBottom: 0 },
  passwordFieldGroup: { marginTop: spacing[4] },
  fieldLabel: { fontFamily: fonts.semibold, fontSize: fs(13), color: colors['on-surface'], marginBottom: spacing[2] },
  passwordLabelRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing[2],
  },
  forgotPassword: { fontFamily: fonts.semibold, fontSize: fs(12), color: colors.primary },
  inputWrapper: {
    backgroundColor: colors['surface-container-low'], borderRadius: radius.lg,
    flexDirection: 'row', alignItems: 'center', borderColor: 'transparent',
  },
  input: { flex: 1, paddingHorizontal: spacing[4], paddingVertical: 14, fontFamily: fonts.regular, fontSize: fs(15), color: colors['on-surface'] },
  passwordInput: { paddingRight: spacing[2] },
  eyeButton: { paddingHorizontal: 14, paddingVertical: 14 },

  fieldError: {
    fontFamily: fonts.regular,
    fontSize: fs(12),
    color: colors.error,
    marginTop: spacing[1],
  },

  ctaWrapper: {
    marginTop: spacing[6],
    borderRadius: radius.full,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 3,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaGradient: { borderRadius: radius.full, height: 52, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: fonts.semibold, fontSize: fs(15), color: colors['on-primary'], letterSpacing: 0.5 },

  dividerRow: { alignItems: 'center', marginVertical: spacing[5] },
  dividerText: {
    fontFamily: fonts.semibold, fontSize: fs(11), color: colors['outline-variant'],
    letterSpacing: 1,
  },

  socialRow: { flexDirection: 'row', gap: spacing[3] },
  socialButton: {
    flex: 1, backgroundColor: colors['surface-container-low'], borderRadius: radius.lg, height: spacing[12],
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2],
  },
  googleG: { fontFamily: fonts.bold, fontSize: fs(15), color: '#4285F4' },
  appleIcon: { fontSize: fs(16), color: colors['on-surface'] },
  socialButtonText: { fontFamily: fonts.medium, fontSize: fs(14), color: colors['on-surface'] },

  footerRow: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', marginTop: spacing[5],
  },
  footerText: { fontFamily: fonts.regular, fontSize: fs(14), color: colors['on-surface-variant'] },
  footerLink: { fontFamily: fonts.bold, fontSize: fs(14), color: colors['on-surface'] },
});
