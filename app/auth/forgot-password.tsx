import Icon from '@/components/ui/Icon';
import { fonts, radius, shadows, spacing, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { forgotPassword, verifyResetCode, resetPassword } from '@/services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Step = 'email' | 'code' | 'password' | 'done';

export default function ForgotPasswordScreen() {
  const { colors, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const borderOpacity = useSharedValue(0);
  const shakeX = useSharedValue(0);

  const triggerShake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(1, { duration: 25 }),
      withTiming(-1, { duration: 25 }),
      withTiming(0, { duration: 25 }),
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, [shakeX]);

  const inputBorderStyle = useAnimatedStyle(() => ({
    borderColor: error ? colors.error : `rgba(43,63,82,${borderOpacity.value * 0.20})`,
    borderWidth: error ? 1 : borderOpacity.value,
    transform: [{ translateX: shakeX.value }],
  }));

  const handleSendCode = async () => {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError(t('auth.errors.invalidEmail'));
      triggerShake();
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await forgotPassword(trimmed);
      setStep('code');
    } catch {
      setError(t('auth.errors.generic'));
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    const trimmedCode = code.trim();
    if (trimmedCode.length !== 6) {
      setError(t('auth.errors.invalidCode'));
      triggerShake();
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const result = await verifyResetCode(email.trim(), trimmedCode);
      setResetToken(result.reset_token);
      setStep('password');
    } catch {
      setError(t('auth.errors.invalidCode'));
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      setError(t('auth.errors.passwordTooShort'));
      triggerShake();
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await resetPassword(resetToken, newPassword);
      setStep('done');
    } catch {
      setError(t('auth.errors.generic'));
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root}>
      <View style={[styles.inner, { paddingTop: insets.top + spacing[3], paddingBottom: insets.bottom + spacing[5] }]}>
        {/* Back */}
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8} accessibilityRole="button">
          <Icon name="chevron-left" size={22} color={colors['on-surface']} />
        </Pressable>

        {step === 'email' && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.card}>
            <Text style={styles.label}>{t('auth.forgotPasswordLabel')}</Text>
            <Text style={styles.title}>{t('auth.resetAccess')}</Text>
            <Text style={styles.subtitle}>{t('auth.forgotPasswordSubtitle')}</Text>

            <Text style={styles.fieldLabel}>{t('auth.emailLabel')}</Text>
            <Animated.View style={[styles.inputWrapper, inputBorderStyle]}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(v) => { setEmail(v); setError(null); }}
                placeholder={t('auth.emailPlaceholder')}
                placeholderTextColor={colors['outline-variant']}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => { borderOpacity.value = withTiming(1, { duration: 200 }); }}
                onBlur={() => { borderOpacity.value = withTiming(0, { duration: 200 }); }}
              />
            </Animated.View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              style={[styles.ctaWrapper, (!email.trim() || isLoading) && styles.ctaDisabled]}
              onPress={handleSendCode}
              disabled={!email.trim() || isLoading}
              accessibilityRole="button"
            >
              <LinearGradient
                colors={[colors.primary, colors['primary-dim']]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.ctaGradient}
              >
                {isLoading
                  ? <ActivityIndicator size="small" color={colors['on-primary']} />
                  : <Text style={styles.ctaText}>{t('auth.sendLink')}</Text>
                }
              </LinearGradient>
            </Pressable>

            <Pressable onPress={() => router.back()} style={styles.backToLogin} hitSlop={8}>
              <Text style={styles.backToLoginText}>{t('auth.backToLogin')}</Text>
            </Pressable>
          </Animated.View>
        )}

        {step === 'code' && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.card}>
            <Text style={styles.label}>{t('auth.verifyCodeLabel')}</Text>
            <Text style={styles.title}>{t('auth.verifyCodeTitle')}</Text>
            <Text style={styles.subtitle}>{t('auth.verifyCodeSubtitle', { email: email.trim() })}</Text>

            <Text style={styles.fieldLabel}>{t('auth.verifyCodeLabel')}</Text>
            <Animated.View style={[styles.inputWrapper, inputBorderStyle]}>
              <TextInput
                style={[styles.input, styles.codeInput]}
                value={code}
                onChangeText={(v) => { setCode(v.replace(/\D/g, '').slice(0, 6)); setError(null); }}
                placeholder="000000"
                placeholderTextColor={colors['outline-variant']}
                keyboardType="number-pad"
                maxLength={6}
                onFocus={() => { borderOpacity.value = withTiming(1, { duration: 200 }); }}
                onBlur={() => { borderOpacity.value = withTiming(0, { duration: 200 }); }}
              />
            </Animated.View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              style={[styles.ctaWrapper, (code.length !== 6 || isLoading) && styles.ctaDisabled]}
              onPress={handleVerifyCode}
              disabled={code.length !== 6 || isLoading}
              accessibilityRole="button"
            >
              <LinearGradient
                colors={[colors.primary, colors['primary-dim']]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.ctaGradient}
              >
                {isLoading
                  ? <ActivityIndicator size="small" color={colors['on-primary']} />
                  : <Text style={styles.ctaText}>{t('auth.verifyCodeCta')}</Text>
                }
              </LinearGradient>
            </Pressable>

            <Pressable onPress={() => setStep('email')} style={styles.backToLogin} hitSlop={8}>
              <Text style={styles.backToLoginText}>{t('common.back')}</Text>
            </Pressable>
          </Animated.View>
        )}

        {step === 'password' && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.card}>
            <Text style={styles.label}>{t('auth.newPasswordLabel')}</Text>
            <Text style={styles.title}>{t('auth.newPasswordTitle')}</Text>
            <Text style={styles.subtitle}>{t('auth.newPasswordSubtitle')}</Text>

            <Text style={styles.fieldLabel}>{t('auth.passwordLabel')}</Text>
            <Animated.View style={[styles.inputWrapper, inputBorderStyle]}>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={(v) => { setNewPassword(v); setError(null); }}
                placeholder={t('auth.passwordPlaceholder')}
                placeholderTextColor={colors['outline-variant']}
                secureTextEntry
                onFocus={() => { borderOpacity.value = withTiming(1, { duration: 200 }); }}
                onBlur={() => { borderOpacity.value = withTiming(0, { duration: 200 }); }}
              />
            </Animated.View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              style={[styles.ctaWrapper, (newPassword.length < 6 || isLoading) && styles.ctaDisabled]}
              onPress={handleResetPassword}
              disabled={newPassword.length < 6 || isLoading}
              accessibilityRole="button"
            >
              <LinearGradient
                colors={[colors.primary, colors['primary-dim']]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.ctaGradient}
              >
                {isLoading
                  ? <ActivityIndicator size="small" color={colors['on-primary']} />
                  : <Text style={styles.ctaText}>{t('auth.newPasswordCta')}</Text>
                }
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        {step === 'done' && (
          <Animated.View entering={FadeIn.duration(500)} style={styles.card}>
            <View style={styles.successIcon}>
              <Icon name="circle-check" size={32} color={colors.primary} />
            </View>
            <Text style={styles.successTitle}>{t('auth.passwordResetSuccess')}</Text>
            <Text style={styles.successBody}>{t('auth.passwordResetSuccessBody')}</Text>
            <Pressable onPress={() => router.back()} style={styles.ctaWrapper} accessibilityRole="button">
              <LinearGradient
                colors={[colors.primary, colors['primary-dim']]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.ctaGradient}
              >
                <Text style={styles.ctaText}>{t('auth.backToLogin')}</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ColorTokens, typography: any, fs: (n: number) => number) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing[5],
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors['surface-container-lowest'],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.ambient,
    marginBottom: spacing[6],
  },
  card: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: 32,
    padding: spacing[7],
    ...shadows.ambient,
  },
  label: {
    ...typography['label-md'],
    color: colors.outline,
    marginBottom: spacing[3],
  },
  title: {
    ...typography['headline-md'],
    color: colors['on-surface'],
    marginBottom: spacing[3],
    lineHeight: fs(36),
  },
  subtitle: {
    ...typography['body-sm'],
    color: colors['on-surface-variant'],
    marginBottom: spacing[6],
  },
  fieldLabel: {
    fontFamily: fonts.semibold,
    fontSize: fs(13),
    color: colors['on-surface'],
    marginBottom: spacing[2],
  },
  inputWrapper: {
    backgroundColor: colors['surface-container-low'],
    borderRadius: radius.lg,
    borderColor: 'transparent',
  },
  input: {
    paddingHorizontal: spacing[4],
    paddingVertical: 14,
    fontFamily: fonts.regular,
    fontSize: fs(15),
    color: colors['on-surface'],
  },
  codeInput: {
    letterSpacing: 8,
    fontSize: fs(22),
    fontFamily: fonts.semibold,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: fs(13),
    color: colors.error,
    marginTop: spacing[3],
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
  ctaGradient: {
    height: 52,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: fonts.semibold,
    fontSize: fs(15),
    color: colors['on-primary'],
    letterSpacing: 0.5,
  },
  backToLogin: {
    alignItems: 'center',
    marginTop: spacing[4],
  },
  backToLoginText: {
    fontFamily: fonts.medium,
    fontSize: fs(14),
    color: colors['on-surface-variant'],
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  successTitle: {
    ...typography['headline-sm'],
    color: colors['on-surface'],
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  successBody: {
    ...typography['body-sm'],
    color: colors['on-surface-variant'],
    textAlign: 'center',
  },
});
