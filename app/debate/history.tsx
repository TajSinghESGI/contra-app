import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { colors as staticColors, fonts, radius, shadows, spacing, type ColorTokens } from '@/constants/tokens';
import Icon from '@/components/ui/Icon';
import { useTheme } from '@/hooks/useTheme';
import { AnimatedHeaderScrollView } from '@/components/ui/AnimatedHeaderScrollView';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { getDebateHistory, getActiveDebates } from '@/services/api';
import type { DebateHistoryEntry, ActiveDebate } from '@/services/api';
import { LiveDot } from '@/components/shared/LiveDot';

// ─── Debate card ─────────────────────────────────────────────────────────────

function DebateCard({
  debate,
  delay,
  onPress,
}: {
  debate: DebateHistoryEntry;
  delay: number;
  onPress: () => void;
}) {
  const { colors, typography, fs } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);

  const scoreColor =
    debate.score >= 70
      ? '#34C759'
      : debate.score >= 40
        ? colors['on-surface']
        : colors.error;

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(500).easing(Easing.out(Easing.cubic))}
    >
      <Pressable
        style={({ pressed }) => [styles.debateCard, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
        onPress={onPress}
        accessibilityRole="button"
      >
        <View style={styles.debateCardTop}>
          {debate.type === '1v1' && debate.opponent_initial ? (
            <UserAvatar
              size={36}
              initial={debate.opponent_initial}
              avatarBg={debate.opponent_avatar_bg}
              avatarUrl={debate.opponent_avatar_url}
            />
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={styles.debateTopic} numberOfLines={2}>
              {debate.type === '1v1' && debate.opponent
                ? `vs ${debate.opponent.split(' ')[0]}`
                : debate.topic}
            </Text>
            {debate.type === '1v1' && (
              <Text style={styles.debateSubtitle} numberOfLines={1}>{debate.topic}</Text>
            )}
          </View>
          <View style={[styles.debateScoreCircle, { borderColor: scoreColor }]}>
            <Text style={[styles.debateScoreValue, { color: scoreColor }]}>
              {debate.score}
            </Text>
          </View>
        </View>
        <View style={styles.debateCardBottom}>
          <Text style={styles.debateDate}>
            {debate.type === '1v1' ? '1v1 · ' : ''}
            {new Date(debate.date).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
          <Text style={styles.debateDifficulty}>{debate.difficulty}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function DebateHistoryScreen() {
  const { colors, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [activeDebates, setActiveDebates] = useState<ActiveDebate[]>([]);
  const [debates, setDebates] = useState<DebateHistoryEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const loadPage = useCallback((cursor?: string) => {
    setLoading(true);
    getDebateHistory(cursor)
      .then((page) => {
        setDebates(prev => cursor ? [...prev, ...page.results] : page.results);
        setNextCursor(page.next_cursor);
        setInitialLoaded(true);
      })
      .catch(() => { setInitialLoaded(true); })
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPage();
      getActiveDebates().then(setActiveDebates).catch(() => {});
    }, [loadPage])
  );

  return (
    <View style={styles.root}>
      {/* Floating close button */}
      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        accessibilityRole="button"
        style={[styles.closeButton, { top: insets.top + spacing[2] }]}
      >
        <Icon name="circle-x" size={16} color={colors['on-surface-variant']} />
      </Pressable>

      <AnimatedHeaderScrollView
        largeTitle="Historique"
        subtitle="Tous tes débats"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
        }}
      >
        <View style={styles.list}>
          {/* Active debates */}
          {activeDebates.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>{t('debate.inProgress')}</Text>
              {activeDebates.map((d, i) => (
                <Animated.View
                  key={d.id}
                  entering={FadeInDown.delay(i * 60).duration(500).easing(Easing.out(Easing.cubic))}
                >
                  <Pressable
                    style={({ pressed }) => [styles.activeCard, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
                    onPress={() => router.push({ pathname: '/debate/[id]', params: { id: d.id, topic: d.topic } } as any)}
                  >
                    <View style={styles.activeCardTop}>
                      <LiveDot />
                      <Text style={styles.activeTopic} numberOfLines={2}>{d.topic}</Text>
                      <View style={styles.activeTurnBadge}>
                        <Text style={styles.activeTurnText}>{d.current_turn}/{d.max_turns}</Text>
                      </View>
                    </View>
                    <Text style={styles.activeResume}>{t('home.resumeDebate')}</Text>
                  </Pressable>
                </Animated.View>
              ))}
            </>
          )}

          {/* Completed */}
          {(debates.length > 0 || activeDebates.length > 0) && debates.length > 0 && (
            <Text style={[styles.sectionLabel, activeDebates.length > 0 && { marginTop: spacing[4] }]}>{t('debate.completed')}</Text>
          )}
          {initialLoaded && debates.length === 0 && activeDebates.length === 0 && (
            <Text style={styles.emptyText}>{t('debate.noDebatesYet')}</Text>
          )}
          {debates.map((debate, i) => (
            <DebateCard
              key={debate.id}
              debate={debate}
              delay={Math.min(i * 60, 400)}
              onPress={() => {
                if (debate.type === '1v1') {
                  router.push({ pathname: '/challenge/result/[id]', params: { id: debate.id } });
                } else {
                  router.push({ pathname: '/debate/result/[id]', params: { id: debate.id, topic: debate.topic } });
                }
              }}
            />
          ))}
          {nextCursor && (
            <Pressable
              style={({ pressed }) => [styles.loadMoreButton, pressed && { opacity: 0.7 }]}
              onPress={() => loadPage(nextCursor)}
              disabled={loading}
              accessibilityRole="button"
            >
              {loading
                ? <ActivityIndicator size="small" color={staticColors.primary} />
                : <Text style={styles.loadMoreText}>{t('common.loadMore')}</Text>}
            </Pressable>
          )}
        </View>
      </AnimatedHeaderScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (colors: ColorTokens, typography: any, fs: (n: number) => number) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  closeButton: {
    position: 'absolute',
    right: spacing[4],
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[2],
  },
  list: {
    gap: spacing[2],
  },
  sectionLabel: {
    fontFamily: fonts.bold,
    fontSize: fs(11),
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.outline,
    marginBottom: spacing[1],
  },
  activeCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['2xl'],
    padding: spacing[4],
    ...shadows.ambient,
  },
  activeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  activeTopic: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: fs(15),
    color: colors['on-surface'],
    lineHeight: fs(22),
  },
  activeTurnBadge: {
    backgroundColor: colors['surface-container-high'],
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
  },
  activeTurnText: {
    fontFamily: fonts.bold,
    fontSize: fs(11),
    letterSpacing: 1,
    color: colors['on-surface-variant'],
  },
  activeResume: {
    fontFamily: fonts.semibold,
    fontSize: fs(13),
    color: colors.primary,
    marginTop: spacing[2],
  },

  debateCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['2xl'],
    padding: spacing[4],
    ...shadows.ambient,
  },
  debateCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  debateTopic: {
    fontFamily: fonts.semibold,
    fontSize: fs(15),
    color: colors['on-surface'],
    lineHeight: fs(22),
  },
  debateSubtitle: {
    fontFamily: fonts.regular,
    fontSize: fs(12),
    color: colors['on-surface-variant'],
    marginTop: 2,
  },
  debateScoreCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  debateScoreValue: {
    fontFamily: fonts.bold,
    fontSize: fs(14),
  },
  debateCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[2],
  },
  debateDate: {
    fontFamily: fonts.regular,
    fontSize: fs(12),
    color: colors['on-surface-variant'],
  },
  debateDifficulty: {
    ...typography['label-sm'],
    color: colors['outline-variant'],
  },

  emptyText: {
    fontFamily: fonts.regular,
    fontSize: fs(14),
    color: colors['on-surface-variant'],
    textAlign: 'center',
    paddingVertical: spacing[8],
  },
  loadMoreButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[4],
    marginTop: spacing[2],
  },
  loadMoreText: {
    fontFamily: fonts.medium,
    fontSize: fs(14),
    color: colors.primary,
  },
});
