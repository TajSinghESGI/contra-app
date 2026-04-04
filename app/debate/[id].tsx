import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { Toast } from '@/components/ui/Toast';
import { LegendList } from '@legendapp/list';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { BlurView } from 'expo-blur';
import Icon from '@/components/ui/Icon';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { fonts, radius, spacing, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { AIMessage } from '@/components/debate/AIMessage';
import { UserMessage } from '@/components/debate/UserMessage';
import { LinearGradient } from 'expo-linear-gradient';
import { LiveScoreBar } from '@/components/debate/LiveScoreBar';
import { ScoreModal } from '@/components/debate/ScoreModal';
import { DebateInput } from '@/components/debate/DebateInput';
import { MarqueeText } from '@/components/ui/MarqueeText';
import { SiriProvider, useSiri } from '@/components/ui/AppleIntelligence';
import { ShimmerEffect } from '@/components/ui/Shimmer';
import { useDebate } from '@/hooks/useDebate';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useTTS } from '@/hooks/useTTS';
import { abandonDebate, stopDebate, getDebateScore } from '@/services/api';
import { useDebateStore } from '@/store/debateStore';
import type { ScoreResult } from '@/store/debateStore';

const MIN_TURNS_TO_STOP = 4;

// ─── Inner screen (must be rendered inside SiriProvider) ─────────────────────

function DebateScreenInner() {
  const { colors, isDark, typography, fs } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { toggle, dismiss, isActive } = useSiri();
  const { topic: topicParam = '', id } = useLocalSearchParams<{
    topic: string;
    id: string;
  }>();

  const {
    messages,
    isStreaming,
    isLoading,
    currentTurn,
    maxTurns,
    topic,
    isDebateOver,
    score,
    sendMessage,
  } = useDebate(id);

  const endDebate = useDebateStore((s) => s.endDebate);
  const displayTopic = topic || topicParam;
  const canStop = currentTurn >= MIN_TURNS_TO_STOP && !isDebateOver && !isStreaming;

  const [inputText, setInputText] = useState('');
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [finalScore, setFinalScore] = useState<ScoreResult | null>(null);
  const [hasTriggeredOrb, setHasTriggeredOrb] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  // Voice input (STT)
  const { isListening, transcript, isAvailable: voiceAvailable, startListening, stopListening } = useVoiceInput((text) => {
    setInputText(text);
  });

  // TTS for AI responses
  const { isSpeaking, speak, stop: stopTTS } = useTTS();

  // Update input text with live transcript
  useEffect(() => {
    if (isListening && transcript) {
      setInputText(transcript);
    }
  }, [transcript, isListening]);

  // Auto TTS when AI finishes responding (if not muted)
  useEffect(() => {
    if (!ttsEnabled || isStreaming || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === 'ai' && lastMsg.content && !lastMsg.isStreaming) {
      speak(lastMsg.content);
    }
  }, [isStreaming, ttsEnabled]);

  // Stop TTS when user starts typing
  useEffect(() => {
    if (inputText.trim() && isSpeaking) stopTTS();
  }, [inputText]);

  const handleMicPress = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      if (isSpeaking) stopTTS();
      startListening();
    }
  }, [isListening, isSpeaking, startListening, stopListening, stopTTS]);

  // Trigger Siri orb when debate ends
  useEffect(() => {
    if (isDebateOver && !hasTriggeredOrb) {
      setHasTriggeredOrb(true);
      // Small delay so the last AI message renders first
      setTimeout(() => {
        toggle();
        setTimeout(() => dismiss(), 2500);
      }, 600);
    }
  }, [isDebateOver, hasTriggeredOrb, toggle, dismiss]);

  // Pre-fetch score silently when debate is over (ready for when user taps "See results")
  useEffect(() => {
    if (!isDebateOver || !id) return;
    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 10;

    const fetchScore = async () => {
      if (cancelled) return;
      attempts++;
      try {
        await new Promise((r) => setTimeout(r, 3000));
        if (cancelled) return;
        const result = await getDebateScore(id);
        if (!cancelled) setFinalScore(result);
      } catch {
        if (!cancelled && attempts < MAX_ATTEMPTS) {
          setTimeout(fetchScore, 3000);
        }
      }
    };
    fetchScore();
    return () => { cancelled = true; };
  }, [isDebateOver, id]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isStreaming) return;

    Keyboard.dismiss();
    setInputText('');

    try {
      await sendMessage(text);
    } catch (e: any) {
      console.error('Failed to send message:', e.message);
    }
  }, [inputText, isStreaming, sendMessage]);

  const handleQuickAction = (action: string) => {
    setInputText(action + '\u00a0: ');
  };

  const handleAbandon = useCallback(() => {
    Toast.show(t('debate.abandonTitle'), {
      type: 'warning',
      duration: 15000,
      position: 'bottom',
      expandedContent: ({ dismiss }) => (
        <View style={{ paddingHorizontal: 16, paddingBottom: 14, gap: 8 }}>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors['inverse-on-surface'], lineHeight: 18 }}>
            {t('debate.abandonMessage')}
          </Text>
          <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: colors['outline-variant'], lineHeight: 16 }}>
            {t('debate.abandonCountsAsDebate')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
            <Pressable
              onPress={() => Toast.dismissAll()}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 999, backgroundColor: 'rgba(120,120,120,0.2)', alignItems: 'center' }}
            >
              <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: colors['inverse-on-surface'] }}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                abandonDebate(id!).then(() => {
                  Toast.dismissAll();
                  router.back();
                }).catch((err) => {
                  Toast.dismissAll();
                  Toast.show(err.message ?? t('auth.errors.generic'), { type: 'error', duration: 3000, position: 'top' });
                });
              }}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 999, backgroundColor: colors.error, alignItems: 'center' }}
            >
              <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: '#fff' }}>{t('debate.abandon')}</Text>
            </Pressable>
          </View>
        </View>
      ),
    });
  }, [id, t, router, colors]);

  const handleStop = useCallback(() => {
    Toast.show(t('debate.stopTitle'), {
      type: 'info',
      duration: 15000,
      position: 'bottom',
      expandedContent: () => (
        <View style={{ paddingHorizontal: 16, paddingBottom: 14, gap: 8 }}>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors['inverse-on-surface'], lineHeight: 18 }}>
            {t('debate.stopMessage', { turns: currentTurn })}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
            <Pressable
              onPress={() => Toast.dismissAll()}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 999, backgroundColor: 'rgba(120,120,120,0.2)', alignItems: 'center' }}
            >
              <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: colors['inverse-on-surface'] }}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Toast.dismissAll();
                setIsStopping(true);
                stopDebate(id!).then(() => {
                  endDebate();
                }).catch((err) => {
                  setIsStopping(false);
                  Toast.show(err.message ?? t('auth.errors.generic'), { type: 'error', duration: 3000, position: 'top' });
                });
              }}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 999, backgroundColor: colors.primary, alignItems: 'center' }}
            >
              <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: colors['on-primary'] }}>{t('debate.stop')}</Text>
            </Pressable>
          </View>
        </View>
      ),
    });
  }, [id, t, colors, currentTurn, endDebate]);

  const handleCancel = useCallback(() => {
    if (currentTurn >= MIN_TURNS_TO_STOP) {
      // Offer choice: stop & score, abandon, or come back later
      Toast.show(t('debate.leaveTitle'), {
        type: 'info',
        duration: 15000,
        position: 'bottom',
        expandedContent: () => (
          <View style={{ paddingHorizontal: 16, paddingBottom: 14, gap: 8 }}>
            <View style={{ gap: 8, marginTop: 2 }}>
              <Pressable
                onPress={() => {
                  Toast.dismissAll();
                  setIsStopping(true);
                  stopDebate(id!).then(() => {
                    endDebate();
                  }).catch((err) => {
                    setIsStopping(false);
                    Toast.show(err.message ?? t('auth.errors.generic'), { type: 'error', duration: 3000, position: 'top' });
                  });
                }}
                style={{ paddingVertical: 12, borderRadius: 999, backgroundColor: colors.primary, alignItems: 'center' }}
              >
                <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: colors['on-primary'] }}>{t('debate.leaveStopAndScore')}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  abandonDebate(id!).then(() => {
                    Toast.dismissAll();
                    router.back();
                  }).catch((err) => {
                    Toast.dismissAll();
                    Toast.show(err.message ?? t('auth.errors.generic'), { type: 'error', duration: 3000, position: 'top' });
                  });
                }}
                style={{ paddingVertical: 12, borderRadius: 999, backgroundColor: colors.error, alignItems: 'center' }}
              >
                <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: '#fff' }}>{t('debate.leaveAbandon')}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  Toast.dismissAll();
                  router.back();
                }}
                style={{ paddingVertical: 12, borderRadius: 999, backgroundColor: 'rgba(120,120,120,0.2)', alignItems: 'center' }}
              >
                <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: colors['inverse-on-surface'] }}>{t('debate.leaveComeBackLater')}</Text>
              </Pressable>
            </View>
          </View>
        ),
      });
    } else {
      router.back();
    }
  }, [currentTurn, id, endDebate, router, t, colors]);

  if (isLoading) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontFamily: fonts.regular, fontSize: 15, color: colors['on-surface-variant'] }}>
          {t('debate.preparing')}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={styles.root}
    >
      {/* ── Fixed glassmorphism header ── */}
      {isDark ? (
        <View style={[styles.header, styles.headerSolid, { paddingTop: insets.top }]}>
          {!isDebateOver && currentTurn < MIN_TURNS_TO_STOP ? (
            <TouchableOpacity onPress={handleAbandon} hitSlop={8}>
              <Icon name="trash" size={20} color={colors['on-surface-variant']} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 20 }} />
          )}
          <Text style={styles.headerTitle}>{t('common.appName')}</Text>
          <TouchableOpacity onPress={isDebateOver ? () => router.back() : handleCancel} style={styles.headerClose} hitSlop={8}>
            <Icon name="circle-x" size={22} color={colors['on-surface']} />
          </TouchableOpacity>
        </View>
      ) : (
        <BlurView intensity={80} tint="light" style={[styles.header, { paddingTop: insets.top }]}>
          {!isDebateOver && currentTurn < MIN_TURNS_TO_STOP ? (
            <TouchableOpacity onPress={handleAbandon} hitSlop={8}>
              <Icon name="trash" size={20} color={colors['on-surface-variant']} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 20 }} />
          )}
          <Text style={styles.headerTitle}>{t('common.appName')}</Text>
          <TouchableOpacity onPress={isDebateOver ? () => router.back() : handleCancel} style={styles.headerClose} hitSlop={8}>
            <Icon name="circle-x" size={22} color={colors['on-surface']} />
          </TouchableOpacity>
        </BlurView>
      )}

      {/* ── Fixed topic banner ── */}
      <View style={[styles.topicBanner, { marginTop: insets.top + 64 }]}>
        <View style={styles.topicRow}>
          <View style={styles.topicLeft}>
            <Text style={styles.topicLabel}>{t('debate.currentProposition')}</Text>
            <MarqueeText
              text={displayTopic}
              style={styles.topicText}
              containerStyle={styles.topicScroll}
              speed={25}
              pauseDuration={2500}
            />
          </View>
          <View style={styles.turnRow}>
            <Pressable
              onPress={() => { setTtsEnabled((v) => !v); if (isSpeaking) stopTTS(); }}
              style={[styles.voiceToggle, ttsEnabled && styles.voiceToggleActive]}
              hitSlop={8}
            >
              <Ionicons name={ttsEnabled ? 'volume-high' : 'volume-mute'} size={16} color={ttsEnabled ? colors['on-primary'] : colors['on-surface-variant']} />
            </Pressable>
            <View style={styles.turnBadge}>
              <Text style={styles.turnCounter}>{t('debate.turnShort', { current: Math.min(currentTurn, maxTurns), max: maxTurns })}</Text>
            </View>
            {canStop && (
              <TouchableOpacity onPress={handleStop} style={styles.stopButton} activeOpacity={0.7}>
                <LinearGradient
                  colors={[colors.primary, colors['primary-dim']]}
                  start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                  style={styles.stopButtonGradient}
                >
                  <Text style={styles.stopButtonText}>{t('debate.stop')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <LiveScoreBar score={score?.total ?? 0} />
      </View>

      {/* ── Chat messages ── */}
      <LegendList
        data={messages}
        keyExtractor={(msg) => msg.id}
        extraData={`${messages.length > 0 ? messages[messages.length - 1].content : ''}-${isDebateOver}-${!!finalScore}`}
        estimatedItemSize={120}
        maintainScrollAtEnd={false}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: msg }) => {
          if (msg.role === 'ai') {
            return <AIMessage content={msg.content} isStreaming={!!msg.isStreaming} />;
          }
          return <UserMessage content={msg.content} />;
        }}
        ListFooterComponent={isDebateOver ? (
          <View style={styles.debateOverFooter}>
            <Icon name="scale" size={40} color={finalScore ? colors.primary : colors['outline-variant']} />
            <Text style={styles.debateOverTitle}>{t('debate.finished')}</Text>
            <Text style={styles.debateOverSub}>
              {finalScore ? t('debate.scoreReady') : t('debate.finishedSub')}
            </Text>
            <Pressable
              onPress={() => {
                if (!finalScore || isActive) return;
                toggle();
                setTimeout(() => {
                  dismiss();
                  router.push({ pathname: '/debate/result/[id]', params: { id: id!, topic: displayTopic } });
                }, 1800);
              }}
              style={[styles.debateOverCta, !finalScore && { opacity: 0.5 }]}
            >
              <LinearGradient
                colors={[colors.primary, colors['primary-dim']]}
                start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                style={styles.debateOverCtaGradient}
              >
                {!finalScore ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color={colors['on-primary']} />
                    <Text style={styles.debateOverCtaText}>{t('debate.scoringInProgress')}</Text>
                  </View>
                ) : (
                  <Text style={styles.debateOverCtaText}>{t('debate.viewResults')}</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        ) : isStopping ? (
          <View style={styles.debateOverFooter}>
            <ShimmerEffect style={{ width: 40, height: 40, borderRadius: 20 }} />
            <ShimmerEffect style={{ width: 180, height: 22, borderRadius: radius.lg, marginTop: 4 }} />
            <ShimmerEffect style={{ width: 260, height: 16, borderRadius: radius.md }} />
            <ShimmerEffect style={{ width: '100%', height: 52, borderRadius: radius.full, marginTop: spacing[4] }} />
          </View>
        ) : null}
      />

      {/* ── Fixed bottom input area — hidden when debate is over ── */}
      {!isDebateOver && !isStopping && (
        <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
          <DebateInput
            value={inputText}
            onChangeText={setInputText}
            onSend={handleSend}
            onQuickAction={handleQuickAction}
            disabled={isStreaming}
            paddingBottom={insets.bottom + 12}
            isListening={isListening}
            onMicPress={handleMicPress}
            voiceAvailable={voiceAvailable}
          />
        </KeyboardStickyView>
      )}

    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function DebateScreen() {
  const { colors } = useTheme();
  return (
    <SiriProvider
      glow={{
        colors: [colors.primary, colors['accent-ai'], colors['accent-user'], colors.primary],
      }}
    >
      <DebateScreenInner />
    </SiriProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  headerClose: {
    width: 40,
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: fs(16),
    letterSpacing: -0.3,
    color: colors['on-surface'],
  },
  headerTimer: {
    fontFamily: fonts.regular,
    fontSize: fs(14),
    fontVariant: ['tabular-nums'],
    color: colors['on-surface-variant'],
    width: 40,
    textAlign: 'right',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
  },

  topicBanner: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    paddingBottom: spacing[2],
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  topicLeft: {
    flex: 1,
  },
  topicLabel: {
    ...typography['label-sm'],
    color: colors.outline,
  },
  topicScroll: {
    marginTop: 4,
  },
  topicText: {
    fontFamily: fonts.light,
    fontSize: fs(18),
    letterSpacing: -0.3,
    color: colors['on-surface'],
    lineHeight: fs(24),
  },
  turnBadge: {
    backgroundColor: colors['surface-container-high'],
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: 4,
  },
  turnCounter: {
    fontFamily: fonts.bold,
    fontSize: fs(11),
    letterSpacing: 1,
    color: colors['on-surface-variant'],
  },
  turnRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[2],
    marginLeft: spacing[3],
  },
  stopButton: {
    borderRadius: radius.full,
    shadowColor: colors.primary,
    shadowOpacity: 0.10,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
  },
  stopButtonGradient: {
    borderRadius: radius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: 6,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  stopButtonText: {
    fontFamily: fonts.semibold,
    fontSize: fs(11),
    color: colors['on-primary'],
    letterSpacing: 0.5,
  },

  voiceToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors['surface-container-high'],
  },
  voiceToggleActive: {
    backgroundColor: colors.primary,
  },

  listContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: 400,
    gap: 24,
  },
  messageList: {
    paddingTop: spacing[4],
    flex: 1,
    gap: 24,
  },

  // Debate over footer
  debateOverFooter: {
    alignItems: 'center',
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[6],
    gap: spacing[3],
  },
  debateOverTitle: {
    fontFamily: fonts.bold,
    fontSize: fs(20),
    color: colors['on-surface'],
    letterSpacing: -0.3,
  },
  debateOverSub: {
    fontFamily: fonts.regular,
    fontSize: fs(14),
    color: colors['on-surface-variant'],
    textAlign: 'center',
    lineHeight: fs(20),
  },
  debateOverCta: {
    marginTop: spacing[4],
    width: '100%',
    borderRadius: radius.full,
    shadowColor: colors.primary,
    shadowOpacity: 0.10,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 24,
  },
  debateOverCtaGradient: {
    borderRadius: radius.full,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  debateOverCtaText: {
    fontFamily: fonts.semibold,
    fontSize: fs(15),
    color: colors['on-primary'],
    letterSpacing: 0.5,
  },

});
