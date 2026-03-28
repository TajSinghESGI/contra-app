import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AIMessage } from '@/components/debate/AIMessage';
import { UserMessage } from '@/components/debate/UserMessage';
import { LiveScoreBar } from '@/components/debate/LiveScoreBar';
import { DebateInput } from '@/components/debate/DebateInput';
import { useDebate } from '@/hooks/useDebate';
import { createDebate, getDebateScore } from '@/services/api';
import { useDebateStore } from '@/store/debateStore';
import type { DebateMessage, ScoreResult } from '@/store/debateStore';
import { fonts, radius, spacing, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';

// ─── Constants ──────────────────────────────────────────────────────────────

const DEMO_TOPIC = 'ia-remplacement-humain';
const DEMO_DIFFICULTY = 'easy';
const DEMO_MAX_TURNS = 3;

// ─── Component ──────────────────────────────────────────────────────────────

export default function DemoDebateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark, typography, fs } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);

  const setDebate = useDebateStore((s) => s.setDebate);
  const resetDebate = useDebateStore((s) => s.reset);
  const debateId = useDebateStore((s) => s.debateId);

  const {
    messages,
    isStreaming,
    currentTurn,
    maxTurns,
    topic,
    isDebateOver,
    sendMessage,
  } = useDebate();

  const [isCreating, setIsCreating] = useState(true);
  const [inputText, setInputText] = useState('');
  const [finalScore, setFinalScore] = useState<ScoreResult | null>(null);

  const flatListRef = useRef<FlatList>(null);

  // ─── Create debate on mount ─────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        resetDebate();
        const res = await createDebate(DEMO_TOPIC, DEMO_DIFFICULTY);
        if (cancelled) return;
        setDebate(res.id, DEMO_TOPIC, res.topic, DEMO_DIFFICULTY);
        // Override maxTurns for the demo
        useDebateStore.setState({ maxTurns: DEMO_MAX_TURNS });
        setIsCreating(false);
      } catch (e: any) {
        console.error('Demo debate creation failed:', e.message);
        if (!cancelled) router.back();
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // Clean up debate store on unmount
  useEffect(() => {
    return () => { resetDebate(); };
  }, []);

  // ─── Fetch score when debate ends ───────────────────────────────────────

  useEffect(() => {
    if (!isDebateOver || !debateId) return;
    let cancelled = false;

    const fetchScore = async () => {
      try {
        await new Promise((r) => setTimeout(r, 3000));
        const result = await getDebateScore(debateId);
        if (!cancelled) setFinalScore(result);
      } catch {
        if (!cancelled) setTimeout(fetchScore, 3000);
      }
    };

    fetchScore();
    return () => { cancelled = true; };
  }, [isDebateOver, debateId]);

  // ─── Scroll helper ──────────────────────────────────────────────────────

  const scrollToEnd = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  // Scroll on new messages
  useEffect(() => {
    if (messages.length > 0) scrollToEnd();
  }, [messages.length, scrollToEnd]);

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isStreaming) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setInputText('');
    await sendMessage(text);
  }, [inputText, isStreaming, sendMessage]);

  const handleQuickAction = useCallback((action: string) => {
    setInputText((prev) => (prev ? `${prev} ${action}` : action));
  }, []);

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/first-launch/font-size');
  };

  // ─── Render helpers ─────────────────────────────────────────────────────

  const renderMessage = useCallback(({ item }: { item: DebateMessage }) => {
    if (item.role === 'ai') {
      return <AIMessage content={item.content} isStreaming={item.isStreaming} />;
    }
    return <UserMessage content={item.content} />;
  }, []);

  // ─── Loading state ──────────────────────────────────────────────────────

  if (isCreating) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('debate.preparing')}</Text>
      </View>
    );
  }

  // ─── Score display ──────────────────────────────────────────────────────

  const scoreTotal = finalScore?.total ?? 0;
  const showResult = isDebateOver && finalScore !== null;

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={styles.headerBlur}>
        <View style={[StyleSheet.absoluteFillObject, styles.headerOverlay]} />
        <View style={{ height: insets.top }} />
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.headerClose}>✕</Text>
          </Pressable>
          <Text style={styles.headerTitle}>CONTRA</Text>
          <View style={styles.turnBadge}>
            <Text style={styles.turnText}>{t('firstLaunch.demo.label')}</Text>
          </View>
        </View>
      </BlurView>

      {/* ── Topic banner ── */}
      <View style={[styles.topicBanner, { marginTop: insets.top + 56 }]}>
        <Text style={styles.topicLabel}>{t('debate.currentProposition')}</Text>
        <Text style={styles.topicText}>{topic}</Text>
        <View style={styles.topicMeta}>
          <View style={{ flex: 1 }}>
            <LiveScoreBar score={finalScore?.total ?? 0} />
          </View>
          <Text style={styles.turnCounter}>{currentTurn}/{maxTurns}</Text>
        </View>
      </View>

      {/* ── Messages ── */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
      />

      {/* ── Input or result ── */}
      {showResult ? (
        <Animated.View entering={FadeIn.duration(400)} style={[styles.resultCard, { paddingBottom: insets.bottom + spacing[4] }]}>
          <Text style={styles.resultEyebrow}>{t('firstLaunch.demo.resultLabel')}</Text>
          <Text style={styles.resultScore}>
            {scoreTotal}<Text style={styles.resultMax}>/100</Text>
          </Text>
          <Text style={styles.resultBody}>{t('firstLaunch.demo.resultBody')}</Text>
          <Pressable onPress={handleContinue}>
            <LinearGradient
              colors={[colors.primary, colors['primary-dim']]}
              style={styles.resultCta}
            >
              <Text style={styles.resultCtaText}>{t('firstLaunch.demo.cta')}</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      ) : isDebateOver ? (
        <View style={[styles.loadingResult, { paddingBottom: insets.bottom + spacing[4] }]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingResultText}>{t('analysis.loading')}</Text>
        </View>
      ) : (
        <DebateInput
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
          onQuickAction={handleQuickAction}
          disabled={isStreaming}
          paddingBottom={insets.bottom}
        />
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (colors: ColorTokens, typography: any, fs: (n: number) => number) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingRoot: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
  },
  loadingText: {
    fontFamily: fonts.regular,
    fontSize: fs(14),
    color: colors['on-surface-variant'],
  },

  // Header
  headerBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerOverlay: {
    backgroundColor: colors.glass,
  },
  headerRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
  },
  headerClose: {
    fontFamily: fonts.regular,
    fontSize: fs(18),
    color: colors['on-surface'],
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: fs(16),
    letterSpacing: -0.3,
    color: colors['on-surface'],
  },
  turnBadge: {
    backgroundColor: colors['surface-container-high'],
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
  },
  turnText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors['on-surface-variant'],
  },

  // Topic
  topicBanner: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  topicLabel: {
    ...typography['label-sm'],
    color: colors.outline,
  },
  topicText: {
    fontFamily: fonts.light,
    fontSize: fs(18),
    lineHeight: fs(26),
    color: colors['on-surface'],
  },
  topicMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  turnCounter: {
    fontFamily: fonts.bold,
    fontSize: fs(12),
    color: colors['on-surface-variant'],
  },

  // Messages
  messageList: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
    gap: spacing[3],
  },

  // Loading result
  loadingResult: {
    alignItems: 'center',
    paddingTop: spacing[5],
    gap: spacing[2],
  },
  loadingResultText: {
    fontFamily: fonts.regular,
    fontSize: fs(13),
    color: colors['on-surface-variant'],
  },

  // Result
  resultCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[6],
    alignItems: 'center',
    gap: spacing[3],
  },
  resultEyebrow: {
    ...typography['label-md'],
    color: colors.outline,
  },
  resultScore: {
    fontFamily: fonts.thin,
    fontSize: 72,
    color: colors['on-surface'],
    letterSpacing: -2,
  },
  resultMax: {
    fontFamily: fonts.light,
    fontSize: 28,
    color: colors['outline-variant'],
  },
  resultBody: {
    ...typography['body-sm'],
    color: colors['on-surface-variant'],
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  resultCta: {
    borderRadius: radius.full,
    paddingVertical: 16,
    paddingHorizontal: 64,
    alignItems: 'center',
  },
  resultCtaText: {
    fontFamily: fonts.semibold,
    fontSize: fs(15),
    color: colors['on-primary'],
    letterSpacing: 0.5,
  },
});
