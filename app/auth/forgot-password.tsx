import Icon from '@/components/ui/Icon';
import { fonts, radius, shadows, spacing, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { forgotPassword } from '@/services/api';
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

export default function ForgotPasswordScreen() {
  const { colors, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
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

  const handleSend = async () => {
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
      setSent(true);
    } catch {
      setError(t('auth.errors.generic'));
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
    >
      <View style={[styles.inner, { paddingTop: insets.top + spacing[3], paddingBottom: insets.bottom + spacing[5] }]}>
        {/* Back */}
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8} accessibilityRole="button">
          <Icon name="chevron-left" size={22} color={colors['on-surface']} />
        </Pressable>

        {!sent ? (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.card}>
            <Text style={styles.label}>{t('auth.forgotPasswordLabel')}</Text>
            <Text style={styles.title}>{t('auth.resetAccess')}</Text>
            <Text style={styles.subtitle}>
              {t('auth.forgotPasswordSubtitle')}
            </Text>

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
              onPress={handleSend}
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
        ) : (
          <Animated.View entering={FadeIn.duration(500)} style={styles.card}>
            <View style={styles.successIcon}>
              <Icon name="circle-check" size={32} color={colors.primary} />
            </View>
            <Text style={styles.successTitle}>{t('auth.emailSent')}</Text>
            <Text style={styles.successBody}>
              {t('auth.emailSentBody')}
            </Text>
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
