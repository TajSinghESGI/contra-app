import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import Icon from '@/components/ui/Icon';
import { TypingDots } from '@/components/debate/TypingDots';
import { fonts, radius, spacing, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useRegisterStore } from '@/store/registerStore';
import {
  apiRegister,
  checkExists,
  sendRegisterOtp,
  verifyRegisterOtp,
  updateProfile,
} from '@/services/api';
import { loginUser } from '@/services/revenuecat';
import { track, identify } from '@/services/analytics';
import { AnalyticsEvents } from '@/services/analyticsEvents';
import { useTopicStore } from '@/store/topicStore';
import { TopicsBottomSheet } from '@/components/auth/TopicsBottomSheet';

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = 'pseudo' | 'email' | 'password' | 'confirm' | 'otp' | 'topics' | 'done';

interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  text: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function RegisterChat() {
  const { colors, isDark, typography, fs } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const loginAuth = useAuthStore((s) => s.login);

  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [step, setStep] = useState<Step>('pseudo');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTopics, setShowTopics] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Collected data
  const pseudo = useRef('');
  const email = useRef('');
  const password = useRef('');

  const { selectedTopics, toggleTopic } = useRegisterStore();
  const listRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  const ctaScale = useSharedValue(1);
  const ctaStyle = useAnimatedStyle(() => ({ transform: [{ scale: ctaScale.value }] }));

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const addBotMessage = useCallback((text: string) => {
    setIsTyping(true);
    const id = `bot-${Date.now()}`;
    setTimeout(() => {
      setMessages((prev) => [...prev, { id, role: 'bot', text }]);
      setIsTyping(false);
    }, 800);
  }, []);

  const addUserMessage = useCallback((text: string) => {
    const id = `user-${Date.now()}`;
    setMessages((prev) => [...prev, { id, role: 'user', text }]);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length, isTyping]);

  // ─── Initial bot message ─────────────────────────────────────────────────

  useEffect(() => {
    track(AnalyticsEvents.SIGNUP_STARTED);
    addBotMessage(t('auth.register.chat.askPseudo'));
  }, []);

  // ─── Step handlers ───────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    setError(null);
    setInputText('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    switch (step) {
      case 'pseudo': {
        addUserMessage(text);
        setIsLoading(true);
        try {
          const taken = await checkExists('pseudo', text);
          if (taken) {
            setError(t('auth.register.chat.pseudoTaken'));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setIsLoading(false);
            return;
          }
        } catch {
          // Network error — proceed anyway, backend will catch duplicates
        }
        pseudo.current = text;
        setIsLoading(false);
        setStep('email');
        setTimeout(() => addBotMessage(t('auth.register.chat.askEmail', { name: text })), 300);
        break;
      }
      case 'email': {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
          setError(t('auth.errors.invalidEmail'));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return;
        }
        addUserMessage(text);
        setIsLoading(true);
        try {
          const taken = await checkExists('email', text);
          if (taken) {
            setError(t('auth.register.chat.emailTaken'));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setIsLoading(false);
            return;
          }
        } catch {
          // proceed
        }
        email.current = text.toLowerCase();
        setIsLoading(false);
        setStep('password');
        setTimeout(() => addBotMessage(t('auth.register.chat.askPassword')), 300);
        break;
      }
      case 'password': {
        if (text.length < 6) {
          setError(t('auth.register.chat.passwordTooShort'));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return;
        }
        password.current = text;
        addUserMessage('••••••••');
        setStep('confirm');
        setTimeout(() => addBotMessage(t('auth.register.chat.askConfirmPassword')), 300);
        break;
      }
      case 'confirm': {
        if (text !== password.current) {
          setError(t('auth.register.chat.passwordMismatch'));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return;
        }
        addUserMessage('••••••••');
        // Send OTP
        setIsTyping(true);
        try {
          const devCode = await sendRegisterOtp(email.current);
          setIsTyping(false);
          const otpMsg = devCode
            ? `${t('auth.register.chat.askOtp')} (dev: ${devCode})`
            : t('auth.register.chat.askOtp');
          addBotMessage(otpMsg);
          setStep('otp');
        } catch (e: any) {
          setIsTyping(false);
          if (e.message?.includes('email_exists') || e.message?.includes('409')) {
            setError(t('auth.errors.emailExists'));
          } else {
            setError(t('auth.errors.generic'));
          }
        }
        break;
      }
      case 'otp': {
        const code = text.replace(/\s/g, '');
        if (code.length !== 6) return;
        addUserMessage(code);
        setIsLoading(true);
        try {
          await verifyRegisterOtp(email.current, code);
          addBotMessage(t('auth.register.chat.otpVerified'));
          setTimeout(() => {
            addBotMessage(t('auth.register.chat.askTopics'));
            setStep('topics');
            setIsLoading(false);
          }, 1000);
        } catch {
          setError(t('auth.errors.invalidCode'));
          setIsLoading(false);
        }
        break;
      }
      default:
        break;
    }
  }, [inputText, step, isLoading, t, addBotMessage, addUserMessage]);

  // ─── Finalize registration ───────────────────────────────────────────────

  const handleFinishRegistration = useCallback(async () => {
    setIsLoading(true);
    addBotMessage(t('auth.register.chat.creatingAccount'));
    try {
      const res = await apiRegister(email.current, password.current, pseudo.current);
      await loginAuth(res.token, res.refresh, res.user);
      await loginUser(res.user.id);
      identify(res.user.id, { email: res.user.email, name: res.user.pseudo });
      track(AnalyticsEvents.SIGNUP_COMPLETED, { topicCount: selectedTopics.length });

      if (selectedTopics.length > 0) {
        await updateProfile({ selected_topics: selectedTopics });
      }
      useTopicStore.getState().setLang(res.user.language ?? 'fr');
      useRegisterStore.getState().reset();

      setTimeout(() => {
        addBotMessage(t('auth.register.chat.welcome', { name: pseudo.current }));
        setStep('done');
        setIsLoading(false);
      }, 500);
    } catch (e: any) {
      setIsLoading(false);
      if (e.message?.includes('email') || e.message?.includes('exists')) {
        setError(t('auth.errors.emailExists'));
      } else {
        setError(t('auth.errors.generic'));
      }
    }
  }, [selectedTopics, t, loginAuth, addBotMessage]);

  // ─── Input config per step ───────────────────────────────────────────────

  const inputConfig = useMemo(() => {
    const c = t('auth.register.chat', { returnObjects: true }) as Record<string, string>;
    switch (step) {
      case 'pseudo': return { placeholder: c.pseudoPlaceholder, keyboard: 'default' as const, secure: false, autoCapitalize: 'words' as const };
      case 'email': return { placeholder: c.emailPlaceholder, keyboard: 'email-address' as const, secure: false, autoCapitalize: 'none' as const };
      case 'password': return { placeholder: c.passwordPlaceholder, keyboard: 'default' as const, secure: true, autoCapitalize: 'none' as const };
      case 'confirm': return { placeholder: c.confirmPlaceholder, keyboard: 'default' as const, secure: true, autoCapitalize: 'none' as const };
      case 'otp': return { placeholder: c.otpPlaceholder, keyboard: 'number-pad' as const, secure: false, autoCapitalize: 'none' as const };
      default: return null;
    }
  }, [step, t]);

  const canSend = inputText.trim().length > 0 && !isLoading;

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      {/* Header */}
      {isDark ? (
        <View style={[styles.header, styles.headerSolid, { paddingTop: insets.top }]}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Icon name="chevron-left" size={22} color={colors['on-surface']} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('common.appName')}</Text>
          <View style={{ width: 22 }} />
        </View>
      ) : (
        <BlurView intensity={80} tint="light" style={[styles.header, { paddingTop: insets.top }]}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Icon name="chevron-left" size={22} color={colors['on-surface']} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('common.appName')}</Text>
          <View style={{ width: 22 }} />
        </BlurView>
      )}

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={[styles.listContent, { paddingTop: insets.top + 64 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) =>
          item.role === 'bot' ? (
            <BotBubble text={item.text} colors={colors} fs={fs} />
          ) : (
            <UserBubble text={item.text} colors={colors} fs={fs} />
          )
        }
        ListFooterComponent={
          isTyping ? (
            <View style={styles.botBubble}>
              <TypingDots />
            </View>
          ) : null
        }
      />

      {/* Bottom input / action area */}
      <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          {error && (
            <Animated.Text entering={FadeInDown.duration(200)} style={styles.errorText}>
              {error}
            </Animated.Text>
          )}

          {/* Text input steps */}
          {inputConfig && (
            <View style={styles.inputRow}>
              <View style={styles.inputWrapper}>
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  value={inputText}
                  onChangeText={(v) => { setInputText(v); setError(null); }}
                  placeholder={inputConfig.placeholder}
                  placeholderTextColor={colors['outline-variant']}
                  keyboardType={inputConfig.keyboard}
                  secureTextEntry={inputConfig.secure && !showPassword}
                  autoCapitalize={inputConfig.autoCapitalize}
                  autoCorrect={false}
                  onSubmitEditing={handleSend}
                  returnKeyType="send"
                  maxLength={step === 'otp' ? 6 : 100}
                />
                {inputConfig.secure && (
                  <Pressable onPress={() => setShowPassword((p) => !p)} hitSlop={8} style={styles.eyeBtn}>
                    <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors['outline-variant']} />
                  </Pressable>
                )}
              </View>
              <Pressable onPress={handleSend} disabled={!canSend}>
                <LinearGradient
                  colors={[colors.primary, colors['primary-dim']]}
                  style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
                >
                  <Icon name="arrow-right" size={16} color={colors['on-primary']} style={{ transform: [{ rotate: '-90deg' }] }} />
                </LinearGradient>
              </Pressable>
            </View>
          )}

          {/* Topics step: two buttons */}
          {step === 'topics' && !isLoading && (
            <View style={styles.actionRow}>
              <AnimatedPressable
                style={[styles.actionBtn, ctaStyle]}
                onPressIn={() => { ctaScale.value = withSpring(0.97, { damping: 15, stiffness: 300 }); }}
                onPressOut={() => { ctaScale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
                onPress={() => setShowTopics(true)}
              >
                <LinearGradient
                  colors={[colors.primary, colors['primary-dim']]}
                  style={styles.actionBtnGradient}
                >
                  <Text style={styles.actionBtnText}>{t('auth.register.chat.chooseTopics')}</Text>
                </LinearGradient>
              </AnimatedPressable>
              <Pressable
                style={styles.skipBtn}
                onPress={() => {
                  addUserMessage(t('auth.register.chat.skipTopics'));
                  handleFinishRegistration();
                }}
              >
                <Text style={styles.skipBtnText}>{t('auth.register.chat.skipTopics')}</Text>
              </Pressable>
            </View>
          )}

          {/* Done step: go to app or paywall */}
          {step === 'done' && (
            <View style={styles.actionRow}>
              <AnimatedPressable
                style={[styles.actionBtn, ctaStyle]}
                onPressIn={() => { ctaScale.value = withSpring(0.97, { damping: 15, stiffness: 300 }); }}
                onPressOut={() => { ctaScale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
                onPress={() => router.replace('/(tabs)')}
              >
                <LinearGradient
                  colors={[colors.primary, colors['primary-dim']]}
                  style={styles.actionBtnGradient}
                >
                  <Text style={styles.actionBtnText}>{t('auth.register.chat.startDebating')}</Text>
                </LinearGradient>
              </AnimatedPressable>
              <Pressable
                style={styles.skipBtn}
                onPress={() => router.push('/paywall')}
              >
                <Text style={styles.skipBtnText}>{t('auth.register.chat.tryPro')}</Text>
              </Pressable>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.alreadyHaveAccount')} </Text>
            <Pressable onPress={() => router.replace('/auth/login')} hitSlop={8}>
              <Text style={styles.footerLink}>{t('auth.login')}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardStickyView>

      {/* Topics bottom sheet */}
      <TopicsBottomSheet
        visible={showTopics}
        onClose={() => setShowTopics(false)}
        onDone={() => {
          setShowTopics(false);
          if (selectedTopics.length > 0) {
            addUserMessage(t('auth.register.chat.topicsSelected', { count: selectedTopics.length }));
          }
          handleFinishRegistration();
        }}
        selectedTopics={selectedTopics}
        toggleTopic={toggleTopic}
      />
    </View>
  );
}

// ─── Chat bubbles ──────────────────────────────────────────────────────────

function BotBubble({ text, colors, fs }: { text: string; colors: ColorTokens; fs: (n: number) => number }) {
  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      style={{
        alignSelf: 'flex-start',
        maxWidth: '88%',
        backgroundColor: colors['accent-ai-container'],
        borderRadius: radius['2xl'],
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
      }}
    >
      <Text style={{
        fontFamily: fonts.bold,
        fontSize: 9,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        color: colors['accent-ai'],
        marginBottom: spacing[2],
      }}>
        CONTRA
      </Text>
      <Text style={{
        fontFamily: fonts.regular,
        fontSize: fs(17),
        lineHeight: fs(26),
        color: colors['on-surface'],
      }}>
        {text}
      </Text>
    </Animated.View>
  );
}

function UserBubble({ text, colors, fs }: { text: string; colors: ColorTokens; fs: (n: number) => number }) {
  return (
    <Animated.View
      entering={FadeInDown.duration(280)}
      style={{
        alignSelf: 'flex-end',
        maxWidth: '80%',
        backgroundColor: colors['accent-user-container'],
        borderRadius: radius['2xl'],
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
      }}
    >
      <Text style={{
        fontFamily: fonts.regular,
        fontSize: fs(16),
        lineHeight: fs(26),
        color: colors['on-surface'],
        textAlign: 'right',
      }}>
        {text}
      </Text>
    </Animated.View>
  );
}

// ─── Shared step dots (kept for backward compat with topics/level screens) ─

export function StepDots({ current }: { current: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            width: i === current ? 20 : 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: i === current ? colors.primary : colors['surface-container-highest'],
          }}
        />
      ))}
    </View>
  );
}

export { createSharedStyles } from './sharedStyles';

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (colors: ColorTokens, typography: any, fs: (n: number) => number) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
    backgroundColor: colors.glass,
    borderBottomWidth: 1,
    borderBottomColor: colors['glass-border'],
  },
  headerSolid: {
    backgroundColor: colors['surface-container-low'],
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: fs(16),
    letterSpacing: -0.3,
    color: colors['on-surface'],
  },

  listContent: {
    paddingHorizontal: spacing[5],
    paddingBottom: 20,
    gap: 16,
  },
  botBubble: {
    alignSelf: 'flex-start',
    maxWidth: '88%',
    backgroundColor: colors['accent-ai-container'],
    borderRadius: radius['2xl'],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },

  bottomBar: {
    paddingHorizontal: spacing[3],
    paddingTop: spacing[2],
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: fs(12),
    color: colors.error,
    marginBottom: spacing[1],
    paddingHorizontal: spacing[2],
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: colors['surface-container'],
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors['glass-border'],
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: spacing[5],
    fontFamily: fonts.regular,
    fontSize: fs(15),
    color: colors['on-surface'],
  },
  eyeBtn: {
    paddingHorizontal: spacing[3],
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.35,
  },

  actionRow: {
    gap: spacing[3],
  },
  actionBtn: {
    borderRadius: radius.full,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 3,
  },
  actionBtnGradient: {
    borderRadius: radius.full,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontFamily: fonts.semibold,
    fontSize: fs(15),
    color: colors['on-primary'],
    letterSpacing: 0.5,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  skipBtnText: {
    fontFamily: fonts.semibold,
    fontSize: fs(14),
    color: colors.primary,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  footerText: {
    fontFamily: fonts.regular,
    fontSize: fs(14),
    color: colors['on-surface-variant'],
  },
  footerLink: {
    fontFamily: fonts.bold,
    fontSize: fs(14),
    color: colors['on-surface'],
  },
});
