import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { LegendList } from '@legendapp/list';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useTranslation } from 'react-i18next';
import Icon from '@/components/ui/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fonts, radius, spacing, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { LiveScoreBar } from '@/components/debate/LiveScoreBar';
import { DebateInput } from '@/components/debate/DebateInput';
import { useFriendStore } from '@/store/friendStore';
import { ChallengeSSE, type ChallengeSSEEvent } from '@/services/sse';

// ─── Types ────────────────────────────────────────────────────────────────────

type MessageRole = 'me' | 'opponent' | 'ai';

interface Message {
  id: string;
  role: MessageRole;
  content: string;
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

  const challenges = useFriendStore((s) => s.challenges);
  const challenge = challenges.find((c) => c.id === id);

  const sseRef = useRef<ChallengeSSE | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [turnCount, setTurnCount] = useState(1);
  const [myScore, setMyScore] = useState(50);
  const [opponentScore, setOpponentScore] = useState(50);
  const [isOver, setIsOver] = useState(false);

  const opponent = challenge
    ? (challenge.from.id === 'me' ? challenge.to : challenge.from)
    : { name: 'Adversaire', initial: '?', level: '' };

  // SSE connection for real-time updates
  useEffect(() => {
    if (!id) return;

    const sse = new ChallengeSSE();
    sseRef.current = sse;

    sse.connect(
      id,
      (event: ChallengeSSEEvent) => {
        switch (event.type) {
          case 'opponent_move':
            setMessages((prev) => [...prev, {
              id: `opp-${Date.now()}`,
              role: 'opponent',
              content: event.content ?? '',
              timestamp: Date.now(),
            }]);
            setIsMyTurn(true);
            break;

          case 'ai_comment':
            setMessages((prev) => [...prev, {
              id: `ai-${Date.now()}`,
              role: 'ai',
              content: event.comment ?? '',
              timestamp: Date.now(),
            }]);
            break;

          case 'turn_change':
            setIsMyTurn(event.currentTurn === 'me');
            if (event.turnNumber) setTurnCount(event.turnNumber);
            break;

          case 'debate_over':
            setIsOver(true);
            if (event.scores) {
              setMyScore(event.scores.fromScore);
              setOpponentScore(event.scores.toScore);
            }
            break;
        }
      },
      () => {}, // onError — silently handle
    );

    return () => sse.disconnect();
  }, [id]);

  // Init with AI introduction
  useEffect(() => {
    if (!challenge) return;
    setMessages([{
      id: 'ai-intro',
      role: 'ai',
      content: `Bienvenue dans ce défi ! Le sujet : "${challenge.topic}". ${challenge.from.name.split(' ')[0]} commence. Argumentez chacun votre tour.`,
      timestamp: Date.now(),
    }]);
  }, [challenge?.id]);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text || !isMyTurn || isOver) return;

    Keyboard.dismiss();
    setInputText('');
    setTurnCount((t) => t + 1);
    setIsMyTurn(false);

    setMessages((prev) => [...prev, {
      id: `me-${Date.now()}`,
      role: 'me',
      content: text,
      timestamp: Date.now(),
    }]);

    // Mock: simulate opponent response + AI comment after delay
    setTimeout(() => {
      const mockResponses = [
        'Votre argument est intéressant, mais les données montrent le contraire. Une étude de 2025 démontre clairement que...',
        'Je comprends votre position, cependant vous omettez un facteur crucial. Les experts s\'accordent à dire que...',
        'C\'est une perspective, mais elle ne tient pas compte de la réalité économique. Les chiffres parlent d\'eux-mêmes...',
      ];
      setMessages((prev) => [...prev, {
        id: `opp-${Date.now()}`,
        role: 'opponent',
        content: mockResponses[Math.floor(Math.random() * mockResponses.length)],
        timestamp: Date.now(),
      }]);

      // AI comment
      setTimeout(() => {
        const comments = [
          'Échange intéressant. Les deux arguments ont du mérite, mais la charge de la preuve reste à établir.',
          'Bonne dynamique. L\'argumentation se précise de part et d\'autre.',
          'Point noté. La rhétorique est solide des deux côtés, mais les preuves font la différence.',
        ];
        setMessages((prev) => [...prev, {
          id: `ai-${Date.now()}`,
          role: 'ai',
          content: comments[Math.floor(Math.random() * comments.length)],
          timestamp: Date.now(),
        }]);
        setIsMyTurn(true);

        // End after 6 total turns
        if (turnCount >= 5) {
          setIsOver(true);
          const ms = Math.floor(Math.random() * 20) + 65;
          const os = Math.floor(Math.random() * 20) + 55;
          setMyScore(ms);
          setOpponentScore(os);
        }
      }, 800);
    }, 1500);
  }, [inputText, isMyTurn, isOver, turnCount]);

  const handleQuickAction = (action: string) => {
    setInputText(action + '\u00a0: ');
  };

  const handleEnd = () => {
    if (challenge) {
      router.push(`/challenge/result/${challenge.id}` as any);
    } else {
      router.back();
    }
  };

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    if (item.role === 'ai') {
      return (
        <View style={styles.aiComment}>
          <View style={styles.aiCommentDot} />
          <Text style={styles.aiCommentText}>{item.content}</Text>
        </View>
      );
    }

    const isMe = item.role === 'me';
    return (
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOpponent]}>
        <Text style={styles.bubbleSender}>
          {isMe ? t('challenge.you') : opponent.name.split(' ')[0]}
        </Text>
        <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextOpponent]}>
          {item.content}
        </Text>
      </View>
    );
  }, [styles, opponent.name]);

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
          {isOver ? t('debate.finished') : t('debate.turn', { current: Math.min(turnCount, 6), max: 6 })}
        </Text>
      </View>

      {/* Score bars */}
      <View style={styles.scoreBars}>
        <View style={styles.scoreBarRow}>
          <Text style={styles.scoreBarLabel}>{t('challenge.you')}</Text>
          <View style={styles.scoreBarTrack}>
            <LiveScoreBar score={myScore} />
          </View>
          <Text style={styles.scoreBarValue}>{myScore}</Text>
        </View>
        <View style={styles.scoreBarRow}>
          <Text style={styles.scoreBarLabel}>{opponent.name.split(' ')[0]}</Text>
          <View style={styles.scoreBarTrack}>
            <LiveScoreBar score={opponentScore} />
          </View>
          <Text style={styles.scoreBarValue}>{opponentScore}</Text>
        </View>
      </View>

      {/* Turn indicator */}
      {!isOver && (
        <View style={styles.turnBanner}>
          <Text style={styles.turnText}>
            {isMyTurn ? `🟢 ${t('challenge.yourTurn')}` : `⏳ ${t('challenge.opponentThinking', { name: opponent.name.split(' ')[0] })}`}
          </Text>
        </View>
      )}

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
      {isOver ? (
        <View style={[styles.endArea, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity style={styles.endBtn} onPress={handleEnd} activeOpacity={0.8}>
            <Text style={styles.endBtnText}>{t('challenge.viewResults')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
          <DebateInput
            value={inputText}
            onChangeText={setInputText}
            onSend={handleSend}
            onQuickAction={handleQuickAction}
            disabled={!isMyTurn}
            paddingBottom={insets.bottom + 12}
          />
        </KeyboardStickyView>
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
    backgroundColor: colors['surface-container-low'],
    borderBottomWidth: 1,
    borderBottomColor: colors['glass-border'],
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

  // Score bars
  scoreBars: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  scoreBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  scoreBarLabel: {
    fontFamily: fonts.medium,
    fontSize: fs(11),
    color: colors['on-surface-variant'],
    width: 60,
  },
  scoreBarTrack: {
    flex: 1,
  },
  scoreBarValue: {
    fontFamily: fonts.bold,
    fontSize: fs(12),
    color: colors['on-surface'],
    width: 28,
    textAlign: 'right',
  },

  // Turn indicator
  turnBanner: {
    alignItems: 'center',
    paddingVertical: spacing[2],
    backgroundColor: colors['surface-container-low'],
    marginHorizontal: spacing[5],
    borderRadius: radius.full,
    marginBottom: spacing[2],
  },
  turnText: {
    fontFamily: fonts.medium,
    fontSize: fs(13),
    color: colors['on-surface'],
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
    backgroundColor: colors['accent-user-container'],
  },
  bubbleOpponent: {
    alignSelf: 'flex-start',
    backgroundColor: colors['accent-ai-container'],
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

  // AI comment
  aiComment: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    paddingHorizontal: spacing[2],
  },
  aiCommentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 7,
  },
  aiCommentText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fs(13),
    fontStyle: 'italic',
    color: colors['on-surface-variant'],
    lineHeight: fs(20),
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
