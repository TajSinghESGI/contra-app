import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Icon from '@/components/ui/Icon';
import { fonts, radius, shadows, spacing, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { Toast } from '@/components/ui/Toast';
import { getDebate, type DebateDetail } from '@/services/api';

export default function DebateReplayScreen() {
  const { colors, typography, fs } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { id, topic } = useLocalSearchParams<{ id: string; topic?: string }>();

  const [debate, setDebate] = useState<DebateDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getDebate(id)
      .then(setDebate)
      .catch(() => Toast.show(t('errors.loadFailed'), { type: 'error' }))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Icon name="chevron-left" size={22} color={colors['on-surface']} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {debate?.topic_text ?? topic ?? ''}
          </Text>
          {debate && (
            <Text style={styles.headerSub}>
              {debate.current_turn}/{debate.max_turns} · {debate.score_total != null ? `${debate.score_total}/100` : t('debate.finished')}
            </Text>
          )}
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Messages */}
      <ScrollView
        contentContainerStyle={[styles.messages, { paddingBottom: insets.bottom + spacing[8] }]}
        showsVerticalScrollIndicator={false}
      >
        {debate?.messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.bubble,
              msg.role === 'user' ? styles.bubbleUser : styles.bubbleAi,
            ]}
          >
            <View style={styles.bubbleHeader}>
              <Text style={[styles.bubbleRole, msg.role === 'user' && styles.bubbleRoleUser]}>
                {msg.role === 'user' ? t('debate.replay.you') : t('debate.replay.ai')}
              </Text>
              <Text style={styles.bubbleTurn}>
                {t('debate.replay.turn', { n: msg.turn_number })}
              </Text>
            </View>
            <Text style={[styles.bubbleText, msg.role === 'user' && styles.bubbleTextUser]}>
              {msg.content}
            </Text>
          </View>
        ))}

        {/* Score summary */}
        {debate?.score_total != null && (
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>{t('debate.replay.finalScore')}</Text>
            <Text style={styles.scoreValue}>{debate.score_total}/100</Text>
            {debate.verdict ? (
              <Text style={styles.verdict}>{debate.verdict}</Text>
            ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ColorTokens, typography: any, fs: (n: number) => number) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
    gap: spacing[3],
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors['surface-container-lowest'],
    alignItems: 'center', justifyContent: 'center',
    ...shadows.ambient,
  },
  headerCenter: { flex: 1 },
  headerTitle: {
    fontFamily: fonts.semibold,
    fontSize: fs(15),
    color: colors['on-surface'],
  },
  headerSub: {
    fontFamily: fonts.regular,
    fontSize: fs(12),
    color: colors['on-surface-variant'],
    marginTop: 2,
  },
  messages: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    gap: spacing[4],
  },
  bubble: {
    borderRadius: radius.xl,
    padding: spacing[4],
  },
  bubbleAi: {
    backgroundColor: colors['surface-container-low'],
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  bubbleUser: {
    backgroundColor: colors['surface-container-high'],
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  bubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  bubbleRole: {
    fontFamily: fonts.bold,
    fontSize: fs(10),
    color: colors['on-surface-variant'],
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  bubbleRoleUser: {
    color: colors['on-surface'],
  },
  bubbleTurn: {
    fontFamily: fonts.regular,
    fontSize: fs(10),
    color: colors['outline-variant'],
  },
  bubbleText: {
    fontFamily: fonts.regular,
    fontSize: fs(14),
    color: colors['on-surface'],
    lineHeight: fs(21),
  },
  bubbleTextUser: {
    color: colors['on-surface'],
  },
  scoreCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius.xl,
    padding: spacing[5],
    alignItems: 'center',
    marginTop: spacing[4],
    ...shadows.ambient,
  },
  scoreLabel: {
    ...typography['label-md'],
    color: colors.outline,
    marginBottom: spacing[2],
  },
  scoreValue: {
    fontFamily: fonts.bold,
    fontSize: fs(36),
    color: colors['on-surface'],
  },
  verdict: {
    fontFamily: fonts.regular,
    fontSize: fs(13),
    color: colors['on-surface-variant'],
    textAlign: 'center',
    marginTop: spacing[2],
    lineHeight: fs(19),
  },
});
