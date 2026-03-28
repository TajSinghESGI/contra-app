import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { LegendList } from '@legendapp/list';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useTranslation } from 'react-i18next';
import Icon from '@/components/ui/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fonts, radius, spacing, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { DebateInput } from '@/components/debate/DebateInput';
import { useAuthStore } from '@/store/authStore';
import { Toast } from '@/components/ui/Toast';
import { useFriendStore } from '@/store/friendStore';
import { getChallengeDetail, sendChallengeMessage, type ChallengeDetail, type ChallengeMessageData } from '@/services/api';
import { ChallengeSSE, type ChallengeSSEEvent } from '@/services/sse';

// ─── Types ────────────────────────────────────────────────────────────────────

type MessageRole = 'me' | 'opponent';

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  userName: string;
  timestamp: number;
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ChallengeDebateScreen() {
  const { colors, isDark, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const currentUserId = useAuthStore((s) => s.user?.id);
  const sseRef = useRef<ChallengeSSE | null>(null);

  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isOver, setIsOver] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const opponent = useMemo(() => {
    if (!challenge || !currentUserId) return { name: 'Adversaire', initial: '?' };
    return challenge.from.id === currentUserId ? challenge.to : challenge.from;
  }, [challenge, currentUserId]);

  const myName = useMemo(() => {
    if (!challenge || !currentUserId) return '';
    return challenge.from.id === currentUserId ? challenge.from.name : challenge.to.name;
  }, [challenge, currentUserId]);

  // Fetch challenge data
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getChallengeDetail(id)
      .then((data) => {
        if (cancelled) return;
        setChallenge(data);
        setIsOver(data.status === 'completed');
        setIsMyTurn(data.whose_turn_id === currentUserId);

        // Convert existing messages
        const msgs: Message[] = data.messages.map((m: ChallengeMessageData) => ({
          id: m.id,
          role: m.user.id === currentUserId ? 'me' as const : 'opponent' as const,
          content: m.content,
          userName: m.user.name,
          timestamp: new Date(m.created_at).getTime(),
        }));
        setMessages(msgs);
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [id, currentUserId]);

  // Polling fallback: re-fetch every 10s when waiting for opponent
  useEffect(() => {
    if (!id || isOver || isMyTurn) return;
    const interval = setInterval(() => {
      getChallengeDetail(id).then((data) => {
        if (data.current_turn !== (challenge?.current_turn ?? 0)) {
          // New messages arrived
          const msgs: Message[] = data.messages.map((m: ChallengeMessageData) => ({
            id: m.id,
            role: m.user.id === currentUserId ? 'me' as const : 'opponent' as const,
            content: m.content,
            userName: m.user.name,
            timestamp: new Date(m.created_at).getTime(),
          }));
          setMessages(msgs);
          setChallenge(data);
          setIsMyTurn(data.whose_turn_id === currentUserId);
          setIsOver(data.status === 'completed');
        }
      }).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [id, isOver, isMyTurn, challenge?.current_turn, currentUserId]);

  // SSE for live updates
  useEffect(() => {
    if (!id || isOver) return;

    const sse = new ChallengeSSE();
    sseRef.current = sse;

    try {
      sse.connect(
        id,
        (event: ChallengeSSEEvent) => {
          if (event.type === 'opponent_move') {
            setMessages((prev) => [...prev, {
              id: `opp-${Date.now()}`,
              role: 'opponent',
              content: event.content ?? '',
              userName: opponent.name,
              timestamp: Date.now(),
            }]);
            setIsMyTurn(true);
            setChallenge((prev) => prev ? { ...prev, current_turn: (prev.current_turn ?? 0) + 1 } : prev);
          }
          if (event.type === 'debate_over') {
            setIsOver(true);
            setIsMyTurn(false);
          }
        },
        () => { sseRef.current = null; },
      );
    } catch (e) {
      console.error('SSE connect failed:', e);
      sseRef.current = null;
    }

    return () => {
      sse.disconnect();
      sseRef.current = null;
    };
  }, [id, isOver, opponent.name]);

  // Poll for scores when debate is over but scores haven't arrived
  useEffect(() => {
    if (!id || !isOver || challenge?.from_score != null) return;
    const interval = setInterval(() => {
      getChallengeDetail(id).then((data) => {
        if (data.from_score != null) {
          setChallenge(data);
          // Re-fetch challenges in store so result screen has fresh data
          useFriendStore.getState().fetchChallenges();
        }
      }).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [id, isOver, challenge?.from_score]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !isMyTurn || isOver || isSending || !id) return;

    Keyboard.dismiss();
    setInputText('');
    setIsSending(true);

    // Optimistic add
    const tempId = `me-${Date.now()}`;
    setMessages((prev) => [...prev, {
      id: tempId,
      role: 'me',
      content: text,
      userName: myName,
      timestamp: Date.now(),
    }]);
    setIsMyTurn(false);

    try {
      await sendChallengeMessage(id, text);
      const newTurn = (challenge?.current_turn ?? 0) + 1;
      const maxT = challenge?.max_turns ?? 6;
      setChallenge((prev) => prev ? { ...prev, current_turn: newTurn } : prev);
      if (newTurn >= maxT) {
        setIsOver(true);
        setIsMyTurn(false);
      }
    } catch (e: any) {
      // Rollback
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setIsMyTurn(true);
      Toast.show('Erreur d\'envoi. Réessaie.', { type: 'error', duration: 2000 });
    } finally {
      setIsSending(false);
    }
  }, [inputText, isMyTurn, isOver, isSending, id, myName]);

  const handleQuickAction = (action: string) => {
    setInputText(action + '\u00a0: ');
  };

  const handleEnd = () => {
    if (!challenge) { router.back(); return; }
    // Re-fetch challenges in the store so result screen has fresh data
    const { fetchChallenges } = useFriendStore.getState();
    fetchChallenges().then(() => {
      router.push(`/challenge/result/${challenge.id}` as any);
    });
  };

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isMe = item.role === 'me';
    return (
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOpponent]}>
        <Text style={styles.bubbleSender}>
          {item.userName.split(' ')[0]}
        </Text>
        <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextOpponent]}>
          {item.content}
        </Text>
      </View>
    );
  }, [styles]);

  if (isLoading) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const currentTurn = challenge?.current_turn ?? 0;
  const maxTurns = challenge?.max_turns ?? 6;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerClose} hitSlop={8}>
          <Icon name="circle-x" size={22} color={colors['on-surface']} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>{t('challenge.oneVsOne')}</Text>
          <Text style={styles.headerNames}>
            {t('challenge.youVs', { name: opponent.name.split(' ')[0] })}
          </Text>
        </View>
        <Text style={styles.headerTurn}>
          {isOver ? t('debate.finished') : t('debate.turn', { current: Math.min(currentTurn, maxTurns), max: maxTurns })}
        </Text>
      </View>

      {/* Progress dots */}
      <View style={styles.progressRow}>
        {Array.from({ length: maxTurns }, (_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i < currentTurn && styles.progressDotFilled,
              i === currentTurn && !isOver && styles.progressDotCurrent,
            ]}
          />
        ))}
      </View>

      {/* Turn indicator */}
      {!isOver && (
        <View style={[styles.turnBanner, isMyTurn ? styles.turnBannerActive : styles.turnBannerWaiting]}>
          <Text style={styles.turnText}>
            {isMyTurn
              ? `🟢 ${t('challenge.yourTurn')}`
              : `⏳ ${t('challenge.waitingFor', { name: opponent.name.split(' ')[0] })}`
            }
          </Text>
        </View>
      )}

      {isOver && !challenge?.from_score && (
        <View style={styles.analyzingBanner}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.analyzingText}>{t('debate.aiSynthesizing')}</Text>
        </View>
      )}

      {/* Topic */}
      <View style={styles.topicRow}>
        <Text style={styles.topicLabel}>{t('challenge.proposition')}</Text>
        <Text style={styles.topicText} numberOfLines={2}>{challenge?.topic}</Text>
      </View>

      {/* Messages */}
      <LegendList
        data={messages}
        keyExtractor={(msg) => msg.id}
        estimatedItemSize={100}
        maintainScrollAtEnd
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={renderMessage}
      />

      {/* Input or End button */}
      {isOver && challenge?.from_score ? (
        <View style={[styles.endArea, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity style={styles.endBtn} onPress={handleEnd} activeOpacity={0.8}>
            <Text style={styles.endBtnText}>{t('challenge.viewResults')}</Text>
          </TouchableOpacity>
        </View>
      ) : !isOver ? (
        <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
          <DebateInput
            value={inputText}
            onChangeText={setInputText}
            onSend={handleSend}
            onQuickAction={handleQuickAction}
            disabled={!isMyTurn || isSending}
            paddingBottom={insets.bottom + 12}
          />
        </KeyboardStickyView>
      ) : null}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (colors: ColorTokens, typography: any, fs: (n: number) => number) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
    backgroundColor: colors['surface-container-lowest'],
  },
  headerClose: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerLabel: {
    ...typography['label-md'],
    color: colors.outline,
  },
  headerNames: {
    fontFamily: fonts.bold,
    fontSize: fs(14),
    color: colors['on-surface'],
    marginTop: 2,
  },
  headerTurn: {
    fontFamily: fonts.semibold,
    fontSize: fs(12),
    color: colors['on-surface-variant'],
  },

  // Turn indicator
  turnBanner: {
    alignItems: 'center',
    paddingVertical: spacing[3],
    backgroundColor: colors['surface-container-low'],
    marginHorizontal: spacing[5],
    borderRadius: radius.full,
    marginTop: spacing[3],
  },
  turnBannerActive: {
    backgroundColor: 'rgba(52,199,89,0.1)',
  },
  turnBannerWaiting: {
    backgroundColor: colors['surface-container-low'],
  },
  turnText: {
    fontFamily: fonts.medium,
    fontSize: fs(13),
    color: colors['on-surface'],
  },

  // Progress dots
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[5],
  },
  progressDot: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors['surface-container-high'],
  },
  progressDotFilled: {
    backgroundColor: colors.primary,
  },
  progressDotCurrent: {
    backgroundColor: colors['outline-variant'],
  },

  // Analyzing banner
  analyzingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    marginHorizontal: spacing[5],
    borderRadius: radius.full,
    backgroundColor: colors['surface-container-low'],
    marginTop: spacing[3],
  },
  analyzingText: {
    fontFamily: fonts.medium,
    fontSize: fs(13),
    color: colors['on-surface-variant'],
  },

  // Topic
  topicRow: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
  },
  topicLabel: {
    ...typography['label-sm'],
    color: colors.outline,
  },
  topicText: {
    fontFamily: fonts.semibold,
    fontSize: fs(16),
    color: colors['on-surface'],
    marginTop: 4,
    lineHeight: fs(22),
  },

  // Messages
  listContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    paddingBottom: 180,
    gap: spacing[4],
  },

  // Bubbles
  bubble: {
    maxWidth: '85%',
    borderRadius: radius['2xl'],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: colors['surface-container-lowest'],
  },
  bubbleOpponent: {
    alignSelf: 'flex-start',
    backgroundColor: colors['surface-container-high'],
  },
  bubbleSender: {
    ...typography['label-sm'],
    color: colors.outline,
    marginBottom: spacing[1],
  },
  bubbleText: {
    fontFamily: fonts.regular,
    fontSize: fs(16),
    lineHeight: fs(24),
  },
  bubbleTextMe: {
    color: colors['on-surface'],
  },
  bubbleTextOpponent: {
    color: colors['on-surface'],
  },

  // End area
  endArea: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
  },
  endBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endBtnText: {
    fontFamily: fonts.semibold,
    fontSize: fs(16),
    color: colors['on-primary'],
  },
});
