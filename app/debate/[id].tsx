import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Alert,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { LegendList } from '@legendapp/list';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { BlurView } from 'expo-blur';
import Icon from '@/components/ui/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { fonts, radius, spacing, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { AIMessage } from '@/components/debate/AIMessage';
import { UserMessage } from '@/components/debate/UserMessage';
import { LiveScoreBar } from '@/components/debate/LiveScoreBar';
import { ScoreModal } from '@/components/debate/ScoreModal';
import { DebateInput } from '@/components/debate/DebateInput';
import { MarqueeText } from '@/components/ui/MarqueeText';
import { useDebate } from '@/hooks/useDebate';
import { abandonDebate, getDebateScore } from '@/services/api';
import type { ScoreResult } from '@/store/debateStore';

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function DebateScreen() {
  const { colors, isDark, typography, fs } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
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

  const displayTopic = topic || topicParam;

  const [inputText, setInputText] = useState('');
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [finalScore, setFinalScore] = useState<ScoreResult | null>(null);

  // Fetch final score when debate is over
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
        if (!cancelled) {
          setFinalScore(result);
          setShowScoreModal(true);
        }
      } catch {
        if (!cancelled && attempts < MAX_ATTEMPTS) {
          setTimeout(fetchScore, 3000);
        } else if (!cancelled) {
          setShowScoreModal(true);
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
    Alert.alert(
      t('debate.abandonTitle'),
      t('debate.abandonMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('debate.abandon'),
          style: 'destructive',
          onPress: async () => {
            try {
              await abandonDebate(id!);
              router.back();
            } catch {}
          },
        },
      ],
    );
  }, [id, t, router]);

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
          <TouchableOpacity onPress={handleAbandon} hitSlop={8}>
            <Icon name="trash" size={20} color={colors['on-surface-variant']} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('common.appName')}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerClose} hitSlop={8}>
            <Icon name="circle-x" size={22} color={colors['on-surface']} />
          </TouchableOpacity>
        </View>
      ) : (
        <BlurView intensity={80} tint="light" style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={handleAbandon} hitSlop={8}>
            <Icon name="trash" size={20} color={colors['on-surface-variant']} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('common.appName')}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerClose} hitSlop={8}>
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
          <View style={styles.turnBadge}>
            <Text style={styles.turnCounter}>{t('debate.turnShort', { current: Math.min(currentTurn, maxTurns), max: maxTurns })}</Text>
          </View>
        </View>
        <LiveScoreBar score={score?.total ?? 0} />
      </View>

      {/* ── Chat messages ── */}
      <LegendList
        data={messages}
        keyExtractor={(msg) => msg.id}
        extraData={messages.length > 0 ? messages[messages.length - 1].content : ''}
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
      />

      {/* ── Fixed bottom input area ── */}
      <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
        <DebateInput
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
          onQuickAction={handleQuickAction}
          disabled={isStreaming}
          paddingBottom={insets.bottom + 12}
        />
      </KeyboardStickyView>

      {/* Score bottom sheet — overlays the debate when finished */}
      {finalScore && (
        <ScoreModal
          visible={showScoreModal}
          score={finalScore}
          onClose={() => setShowScoreModal(false)}
          onViewDetails={() => {
            setShowScoreModal(false);
            router.push({ pathname: '/debate/result/[id]', params: { id: id!, topic: displayTopic } });
          }}
        />
      )}

    </View>
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
    alignItems: 'flex-start',
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
    marginLeft: spacing[3],
  },
  turnCounter: {
    fontFamily: fonts.bold,
    fontSize: fs(11),
    letterSpacing: 1,
    color: colors['on-surface-variant'],
  },

  listContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: 180,
    gap: 24,
  },
  messageList: {
    paddingTop: spacing[4],
    flex: 1,
    gap: 24,
  },

});
