import { LiveDot } from '@/components/shared/LiveDot';
import { SpectralWave } from '@/components/shared/SpectralWave';
import { AnimatedHeaderScrollView } from '@/components/ui/AnimatedHeaderScrollView';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useBottomSheetStack } from '@/components/ui/BottomSheetStack';
import Icon from '@/components/ui/Icon';
import { Toast } from '@/components/ui/Toast';
import { fonts, radius, shadows, spacing, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { getActivityFeed, getActiveDebates, getChallenges, getDebateHistory, getUserStats, isTrialExpired, proposeTopic, type ActivityEntry, type ActiveDebate, type Challenge, type DebateHistoryEntry } from '@/services/api';
import { useFriendStore } from '@/store/friendStore';
import { useAuthStore } from '@/store/authStore';
import { useBannerStore } from '@/store/bannerStore';
const useIsReady = () => useAuthStore((s) => s.isHydrated && s.isLogged);
import { useStreakStore } from '@/store/streakStore';
import { useTopicStore } from '@/store/topicStore';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AnimatedCTAButton({ onPress }: { onPress: () => void }) {
  const { colors, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const scale = useRef(new Animated.Value(1)).current;
  const [buttonWidth, setButtonWidth] = useState(0);
  const ctaWaveColors: [string, string, string] = [
    colors.primary,
    colors['outline-variant'],
    colors['primary-dim'],
  ];

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.ctaPressable}
      onLayout={(e) => setButtonWidth(e.nativeEvent.layout.width)}
      accessibilityRole="button"
    >
      <Animated.View style={[{ transform: [{ scale }] }, styles.ctaWave]}>
        {buttonWidth > 0 && (
          <SpectralWave
            asChild
            width={buttonWidth}
            height={spacing[12]}
            borderRadius={radius.full}
            colors={ctaWaveColors}
            timeScale={0.5}
            brightness={0.85}
          >
            <Text style={styles.ctaText}>{t('home.debateNow')}</Text>
          </SpectralWave>
        )}
      </Animated.View>
    </Pressable>
  );
}

// ─── Propose debate sheet ─────────────────────────────────────────────────────

// Step 1: Topic + public toggle
function ProposeStep1({
  onNext,
}: {
  onNext: (question: string, isPublic: boolean) => void;
}) {
  const { colors, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);

  const [question, setQuestion] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const canContinue = question.trim().length >= 10;

  return (
    <ScrollView showsVerticalScrollIndicator={false} bounces={false} keyboardShouldPersistTaps="handled">
      <View style={styles.proposeContent}>
        <Text style={styles.proposeTitle}>{t('home.proposeTitle')}</Text>

        <TextInput
          style={styles.proposeInput}
          placeholder={t('home.proposePlaceholder')}
          placeholderTextColor={colors['outline-variant']}
          value={question}
          onChangeText={setQuestion}
          multiline
          maxLength={200}
          autoFocus
        />
        <Text style={styles.proposeCharCount}>{question.length}/200</Text>

        <View style={styles.proposePublicRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.proposePublicLabel}>{t('home.proposePublic')}</Text>
            <Text style={styles.proposePublicSub}>{t('home.proposePublicSub')}</Text>
          </View>
          <Switch
            value={isPublic}
            onValueChange={setIsPublic}
            trackColor={{ false: colors['surface-container-high'], true: colors.primary }}
            thumbColor={colors['on-primary']}
          />
        </View>

        <Pressable
          onPress={() => canContinue && onNext(question.trim(), isPublic)}
          style={[styles.proposeStartButton, !canContinue && { opacity: 0.5 }]}
          disabled={!canContinue}
        >
          <Text style={styles.proposeStartText}>{t('common.next')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// Step 2: Category selection
function ProposeStep2({
  categories,
  onConfirm,
}: {
  categories: { id: string; label: string; emoji: string }[];
  onConfirm: (categoryId: string) => void;
}) {
  const { colors, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);

  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');

  return (
    <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
      <View style={styles.proposeContent}>
        <Text style={styles.proposeTitle}>{t('home.proposeCategory')}</Text>

        <View style={styles.proposeCategoryWrap}>
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => setCategoryId(cat.id)}
              style={[styles.proposeCategoryChip, categoryId === cat.id && styles.proposeCategoryChipActive]}
            >
              <Text style={[styles.proposeCategoryText, categoryId === cat.id && styles.proposeCategoryTextActive]}>
                {cat.emoji} {cat.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={() => onConfirm(categoryId)}
          style={styles.proposeStartButton}
        >
          <Text style={styles.proposeStartText}>{t('home.proposeStart')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { colors, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const router = useRouter();

  const { topics, categories, fetchTopics, fetchCategories } = useTopicStore();
  const { pushSheet, popSheet, popToRoot } = useBottomSheetStack();
  const user = useAuthStore((s) => s.user);
  const defaultDifficulty = user?.default_difficulty ?? 'medium';
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [activeDebates, setActiveDebates] = useState<ActiveDebate[]>([]);
  const [myTurnChallenges, setMyTurnChallenges] = useState<Challenge[]>([]);
  const dailyUsed = useBannerStore((s) => s.dailyUsed);
  const dailyLimit = useBannerStore((s) => s.dailyLimit);
  const isReady = useIsReady();

  React.useEffect(() => { if (isReady) { fetchTopics(); fetchCategories(); } }, [isReady]);

  const friendRequests = useFriendStore((s) => s.friendRequests);
  const storeChallenges = useFriendStore((s) => s.challenges);
  const fetchFriendRequests = useFriendStore((s) => s.fetchFriendRequests);
  const fetchStoreChallenges = useFriendStore((s) => s.fetchChallenges);

  useFocusEffect(
    useCallback(() => {
      if (!isReady) return;
      fetchFriendRequests();
      fetchStoreChallenges();
      getUserStats().then((s) => { useBannerStore.getState().setDaily(s.daily_used, s.daily_limit); }).catch(() => {});

      const noAccess = isTrialExpired(user);

      const buildFromHistory = () => {
        if (noAccess) return;
        getDebateHistory()
          .then(({ results: history }) => {
            const entries: ActivityEntry[] = history.slice(0, 8).map((d) => ({
              id: d.id,
              initial: d.topic.charAt(0).toUpperCase(),
              bg: d.result === 'win' ? '#34C759' : colors['surface-container-high'],
              name: d.topic,
              snippet: `${d.score}/100 · ${d.difficulty}`,
              time: formatRelativeTime(d.date),
            }));
            setActivity(entries);
          })
          .catch(() => {});
      };

      getActivityFeed()
        .then((feed) => {
          if (feed.length > 0) {
            setActivity(feed);
          } else {
            buildFromHistory();
          }
        })
        .catch(() => buildFromHistory());
    }, [isReady, user?.subscription_tier])
  );

  // Merge store-based pending items on top of activity feed
  const composedActivity = useMemo(() => {
    const pending: ActivityEntry[] = [];

    // Incoming friend requests
    friendRequests
      .filter((r) => r.direction === 'incoming' && r.status === 'pending')
      .forEach((r) => {
        pending.push({
          id: `fr-${r.id}`,
          initial: r.from.initial,
          bg: r.from.avatarBg,
          name: r.from.name,
          snippet: t('home.friendRequest'),
          time: formatRelativeTime(r.createdAt),
        });
      });

    // Incoming pending challenges
    storeChallenges
      .filter((c) => c.status === 'pending' && c.to.id === user?.id)
      .forEach((c) => {
        pending.push({
          id: `ch-${c.id}`,
          initial: c.from.initial,
          bg: c.from.avatarBg,
          name: c.from.name,
          snippet: `${t('home.challengeReceived')} · ${c.topic_label}`,
          time: formatRelativeTime(c.created_at),
        });
      });

    return [...pending, ...activity].slice(0, 5);
  }, [activity, friendRequests, storeChallenges, user?.id, t]);

  // Refresh active debate + challenges each time the home tab gains focus
  useFocusEffect(
    useCallback(() => {
      if (!isReady) return;
      getActiveDebates()
        .then((debates) => setActiveDebates(debates))
        .catch(() => {});
      getChallenges()
        .then((challenges) => {
          const myTurn = challenges.filter(
            (c) => c.status === 'accepted' && c.whose_turn_id === user?.id
          );
          setMyTurnChallenges(myTurn);
        })
        .catch(() => {});
    }, [user?.id, isReady])
  );

  const handleDebate = useCallback((params: { topic: string; topicId: string; difficulty: string }) => {
    if (dailyLimit !== null && dailyUsed >= dailyLimit) {
      Toast.show(t('home.dailyLimitReached'), {
        type: 'error',
        duration: 4000,
        onPress: () => router.push('/paywall'),
      });
      return;
    }
    router.push({ pathname: '/debate/new', params });
  }, [dailyLimit, dailyUsed, t, router]);

  const openProposeSheet = useCallback(() => {
    pushSheet({
      component: (
        <BottomSheet
          snapPoints={['60%']}
          enableBackdrop
          dismissOnBackdropPress
          dismissOnSwipeDown
        >
          <ProposeStep1
            onNext={(question: string, isPublic: boolean) => {
              // Push step 2 on top
              pushSheet({
                component: (
                  <BottomSheet
                    snapPoints={['65%']}
                    enableBackdrop
                    dismissOnBackdropPress
                    dismissOnSwipeDown
                  >
                    <ProposeStep2
                      categories={categories}
                      onConfirm={async (categoryId: string) => {
                        popToRoot();
                        if (isPublic) {
                          try {
                            const topic = await proposeTopic({ question, category: categoryId, is_public: true });
                            handleDebate({ topic: question, topicId: topic.id, difficulty: defaultDifficulty });
                          } catch {
                            handleDebate({ topic: question, topicId: '', difficulty: defaultDifficulty });
                          }
                        } else {
                          handleDebate({ topic: question, topicId: '', difficulty: defaultDifficulty });
                        }
                      }}
                    />
                  </BottomSheet>
                ),
              });
            }}
          />
        </BottomSheet>
      ),
    });
  }, [pushSheet, popToRoot, categories, handleDebate, defaultDifficulty]);

  const dailyTopic = useMemo(() => topics.find((t: any) => t.is_topic_of_day) ?? topics[0], [topics]);
  const trending = useMemo(() => topics.filter((t: any) => !t.is_topic_of_day).slice(0, 3), [topics]);
  const currentStreak = useStreakStore((s) => s.currentStreak);
  const subtitleText = currentStreak >= 1
    ? `${t('home.subtitle')} · 🔥${t('home.streakDays', { count: currentStreak })}`
    : t('home.subtitle');

  const avatarStackColors = [
    colors['surface-dim'],
    colors['surface-container-highest'],
    colors['surface-container-high'],
  ];

  return (
    <AnimatedHeaderScrollView
      largeTitle={t('tabs.feed')}
      subtitle={subtitleText}
      contentContainerStyle={styles.scrollContent}
    >

      {/* ── Active debate banner ── */}
      {activeDebates.length > 0 && (() => {
        const debate = activeDebates[0];
        const extra = activeDebates.length - 1;
        return (
          <View style={styles.bannerGroup}>
            <Pressable
              style={[styles.activeDebateCard, styles.cardShadow]}
              onPress={() => router.push({ pathname: '/debate/[id]', params: { id: debate.id, topic: debate.topic } } as any)}
              accessibilityRole="button"
            >
              <View style={styles.activeDebateTop}>
                <LiveDot />
                <Text style={styles.activeDebateLabel}>{t('home.activeDebate')}</Text>
                <Text style={styles.activeDebateTurn}>{debate.current_turn}/{debate.max_turns}</Text>
              </View>
              <Text style={styles.activeDebateTopic} numberOfLines={2}>{debate.topic}</Text>
              <Text style={styles.activeDebateCta}>{t('home.resumeDebate')}</Text>
            </Pressable>
            {extra > 0 && (
              <Pressable
                style={styles.overflowPill}
                onPress={() => router.push('/debate/history' as any)}
                accessibilityRole="button"
              >
                <Text style={styles.overflowPillText}>+{extra} {t('home.otherDebates', { count: extra })}</Text>
              </Pressable>
            )}
          </View>
        );
      })()}

      {/* ── Challenges: your turn (max 3 from backend) ── */}
      {myTurnChallenges.length > 0 && (
        <View style={styles.bannerGroup}>
          {myTurnChallenges.map((c) => (
            <Pressable
              key={c.id}
              style={[styles.activeDebateCard, styles.cardShadow]}
              onPress={() => router.push(`/challenge/debate/${c.id}` as any)}
              accessibilityRole="button"
            >
              <View style={styles.activeDebateTop}>
                <Text style={{ fontFamily: fonts.bold, fontSize: fs(14), color: '#34C759' }}>🟢</Text>
                <Text style={styles.activeDebateLabel}>{t('challenge.yourTurn')}</Text>
                <Text style={styles.activeDebateTurn}>{c.current_turn}/{c.max_turns}</Text>
              </View>
              <Text style={styles.activeDebateTopic} numberOfLines={1}>{c.topic_label}</Text>
              <Text style={styles.activeDebateCta}>
                {t('challenge.youVs', {
                  name: c.from.id === user?.id ? c.to.name.split(' ')[0] : c.from.name.split(' ')[0],
                })}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* ── Hero Card: Topic du Jour ── */}
      <View style={[styles.heroCard, styles.cardShadow]}>
        <Text style={styles.labelText}>{dailyTopic?.icon}  {t('home.topicOfDay')}</Text>
        <View style={styles.divider} />
        <Text style={styles.heroHeadline}>
          {dailyTopic?.question}
        </Text>
        <Text style={styles.heroMeta}>
          {(dailyTopic?.participant_count ?? 0).toLocaleString('fr-FR')} {t('home.participantsToday')}
        </Text>
        <AnimatedCTAButton onPress={() => handleDebate({ topic: dailyTopic?.question ?? '', topicId: dailyTopic?.id ?? '', difficulty: defaultDifficulty })} />
      </View>

      {/* ── Propose a debate ── */}
      <Pressable
        style={({ pressed }) => [styles.proposeCard, styles.cardShadow, pressed && { opacity: 0.9 }]}
        onPress={openProposeSheet}
      >
        <Icon name="pen" size={18} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.proposeCardTitle}>{t('home.proposeDebate')}</Text>
          <Text style={styles.proposeCardSub}>{t('home.proposeDebateSub')}</Text>
        </View>
        <Icon name="chevron-right" size={16} color={colors['outline-variant']} />
      </Pressable>

      {/* ── Trending Arenas ── */}
      <View style={styles.section}>
        <Text style={styles.labelText}>{t('home.trendingArenas')}</Text>

        <View style={styles.bentoRow}>
          {/* Large card */}
          {trending[0] && (
            <Pressable
              style={({ pressed }) => [styles.bentoLarge, styles.cardShadow, pressed && { opacity: 0.9 }]}
              onPress={() => handleDebate({ topic: trending[0].question, topicId: trending[0].id, difficulty: defaultDifficulty })}
              accessibilityRole="button"
            >
              <Text style={styles.bentoTitle}>{trending[0].question}</Text>
              <Text style={styles.participantsText}>{t('home.participants', { count: trending[0].participant_count })}</Text>
            </Pressable>
          )}

          {/* Small cards column */}
          <View style={styles.bentoSmallCol}>
            {trending[1] && (
              <Pressable
                style={({ pressed }) => [styles.bentoSmall, styles.cardShadow, pressed && { opacity: 0.9 }]}
                onPress={() => handleDebate({ topic: trending[1].question, topicId: trending[1].id, difficulty: defaultDifficulty })}
                accessibilityRole="button"
              >
                <Text style={styles.bentoEmoji}>{trending[1].icon}</Text>
                <Text style={styles.bentoSmallTitle}>{trending[1].label}</Text>
                <Text style={styles.bentoNewActivity}>{t('home.newActivity')}</Text>
              </Pressable>
            )}
            {trending[2] && (
              <Pressable
                style={({ pressed }) => [styles.bentoSmall, styles.cardShadow, pressed && { opacity: 0.9 }]}
                onPress={() => handleDebate({ topic: trending[2].question, topicId: trending[2].id, difficulty: defaultDifficulty })}
                accessibilityRole="button"
              >
                <Text style={styles.bentoEmoji}>{trending[2].icon}</Text>
                <Text style={styles.bentoSmallTitle}>{trending[2].label}</Text>
                <Text style={styles.bentoNewActivity}>{t('home.newActivity')}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* ── Recent Activity ── */}
      <View style={[styles.section, styles.activitySection]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.labelText}>{t('home.recentActivity')}</Text>
          {composedActivity.length > 0 && (
            <Pressable onPress={() => router.push('/activity' as any)} hitSlop={8}>
              <Text style={styles.seeAllText}>{t('home.viewAll')}</Text>
            </Pressable>
          )}
        </View>
        {composedActivity.length === 0 ? (
          <View style={styles.emptyActivity}>
            <Text style={styles.emptyActivityText}>
              {isTrialExpired(user) ? t('home.freeNoHistory') : t('home.noActivity')}
            </Text>
            {isTrialExpired(user) && (
              <Pressable onPress={() => router.push('/paywall')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing[2] }}>
                <Icon name="scale" size={14} color={colors.primary} />
                <Text style={[styles.emptyActivityText, { color: colors.primary, fontFamily: fonts.semibold }]}>
                  {t('home.goProCta')} →
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.activityList}>
            {composedActivity.map((item) => (
              <View key={item.id} style={styles.activityRow}>
                <View style={[styles.activityAvatar, { backgroundColor: item.bg }]}>
                  <Text style={styles.activityInitial}>{item.initial}</Text>
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityName}>{item.name}</Text>
                  <Text style={styles.activitySnippet} numberOfLines={1}>
                    {item.snippet}
                  </Text>
                </View>
                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </AnimatedHeaderScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (colors: ColorTokens, typography: any, fs: (n: number) => number) => StyleSheet.create({
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors['surface-container-high'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: fonts.bold,
    fontSize: fs(12),
    color: colors['on-surface'],
  },

  scrollContent: {
    paddingBottom: 100,
  },

  cardShadow: {
    ...shadows.ambient,
  },

  streakPill: {
    backgroundColor: colors['surface-container-low'],
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    alignSelf: 'flex-start',
    marginBottom: spacing[4],
    marginHorizontal: spacing[2],
    marginTop: spacing[4],
  },
  streakText: {
    fontFamily: fonts.bold,
    fontSize: fs(14),
    color: colors['on-surface'],
  },

  bannerGroup: {
    gap: spacing[2],
    marginTop: spacing[4],
  },
  activeDebateCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['3xl'],
    marginHorizontal: spacing[2],
    padding: spacing[5],
  },
  overflowPill: {
    alignSelf: 'flex-start',
    marginHorizontal: spacing[2],
    backgroundColor: colors['surface-container-low'],
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  overflowPillText: {
    fontFamily: fonts.medium,
    fontSize: fs(12),
    color: colors.primary,
  },
  activeDebateTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  activeDebateLabel: {
    ...typography['label-md'],
    color: colors.outline,
    flex: 1,
  },
  activeDebateTurn: {
    fontFamily: fonts.medium,
    fontSize: fs(13),
    color: colors['on-surface-variant'],
  },
  activeDebateTopic: {
    fontFamily: fonts.semibold,
    fontSize: fs(17),
    color: colors['on-surface'],
    lineHeight: fs(24),
    marginBottom: spacing[3],
  },
  activeDebateCta: {
    fontFamily: fonts.semibold,
    fontSize: fs(14),
    color: colors.primary,
  },

  heroCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['3xl'],
    marginHorizontal: spacing[2],
    marginTop: spacing[4],
    padding: spacing[5],
  },
  labelText: {
    ...typography['label-md'],
    color: colors.outline,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  seeAllText: {
    fontFamily: fonts.semibold,
    fontSize: fs(12),
    color: colors.primary,
  },
  divider: {
    width: '30%',
    height: 1,
    backgroundColor: colors['outline-variant'],
    opacity: 0.3,
    marginVertical: 10,
  },
  heroHeadline: {
    fontFamily: fonts.bold,
    fontSize: fs(22),
    letterSpacing: -0.3,
    color: colors['on-surface'],
    lineHeight: fs(30),
  },
  heroMeta: {
    fontFamily: fonts.regular,
    fontSize: fs(13),
    color: colors['on-surface-variant'],
    marginTop: spacing[2],
  },
  dailyLimitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    marginTop: spacing[3],
  },
  dailyLimitText: {
    fontFamily: fonts.medium,
    fontSize: fs(12),
    color: colors['on-surface-variant'],
  },

  ctaPressable: {
    marginTop: spacing[5],
  },
  ctaWave: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 3,
  },
  ctaText: {
    fontFamily: fonts.medium,
    fontSize: fs(14),
    color: colors['on-primary'],
    letterSpacing: 1,
  },

  section: {
    marginTop: spacing[6],
    paddingHorizontal: spacing[2],
  },
  activitySection: {
    marginTop: spacing[6],
    paddingHorizontal: spacing[2],
    paddingBottom: spacing[16],
  },

  bentoRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[3],
  },
  bentoLarge: {
    flex: 2,
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['3xl'],
    padding: spacing[4],
  },
  bentoSmallCol: {
    flex: 1,
    gap: spacing[3],
  },
  bentoSmall: {
    flex: 1,
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['2xl'],
    padding: spacing[3],
    justifyContent: 'space-between',
  },

  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveText: {
    fontFamily: fonts.regular,
    fontSize: fs(11),
    color: colors['on-surface-variant'],
  },

  bentoTitle: {
    fontFamily: fonts.bold,
    fontSize: fs(16),
    color: colors['on-surface'],
    marginTop: spacing[2],
    lineHeight: fs(22),
  },
  bentoBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[2],
  },
  participantsText: {
    fontFamily: fonts.regular,
    fontSize: fs(11),
    color: colors['on-surface-variant'],
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors['surface-container-lowest'],
  },

  bentoEmoji: {
    fontSize: 20,
  },
  bentoSmallTitle: {
    fontFamily: fonts.semibold,
    fontSize: fs(13),
    color: colors['on-surface'],
    marginTop: spacing[1],
  },
  bentoNewActivity: {
    fontFamily: fonts.regular,
    fontSize: fs(10),
    color: colors['on-surface-variant'],
    marginTop: spacing[1],
  },

  emptyActivity: {
    marginTop: spacing[4],
    paddingVertical: spacing[6],
    alignItems: 'center' as const,
  },
  emptyActivityText: {
    fontFamily: fonts.regular,
    fontSize: fs(14),
    color: colors['outline-variant'],
  },
  activityList: {
    marginTop: spacing[3],
    gap: spacing[4],
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  activityAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityInitial: {
    fontFamily: fonts.semibold,
    fontSize: fs(13),
    color: colors['on-surface'],
  },
  activityContent: {
    flex: 1,
  },
  activityName: {
    fontFamily: fonts.semibold,
    fontSize: fs(14),
    color: colors['on-surface'],
    lineHeight: fs(18),
  },
  activitySnippet: {
    fontFamily: fonts.regular,
    fontSize: fs(13),
    color: colors['on-surface-variant'],
    lineHeight: fs(18),
  },
  activityTime: {
    ...typography['label-sm'],
    color: colors['on-surface-variant'],
  },

  // Propose card (feed)
  proposeCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[3],
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['3xl'],
    marginHorizontal: spacing[2],
    marginTop: spacing[4],
    padding: spacing[5],
  },
  proposeCardTitle: {
    fontFamily: fonts.semibold,
    fontSize: fs(15),
    color: colors['on-surface'],
  },
  proposeCardSub: {
    fontFamily: fonts.regular,
    fontSize: fs(12),
    color: colors['on-surface-variant'],
    marginTop: 2,
  },

  // Propose sheet
  proposeContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    paddingBottom: 120,
  },
  proposeTitle: {
    fontFamily: fonts.bold,
    fontSize: fs(20),
    color: colors['on-surface'],
    letterSpacing: -0.3,
    marginBottom: spacing[4],
  },
  proposeInput: {
    backgroundColor: colors['surface-container-low'],
    borderRadius: radius.lg,
    padding: spacing[4],
    fontFamily: fonts.regular,
    fontSize: fs(15),
    color: colors['on-surface'],
    minHeight: 100,
    textAlignVertical: 'top' as const,
  },
  proposeCharCount: {
    fontFamily: fonts.regular,
    fontSize: fs(11),
    color: colors['outline-variant'],
    textAlign: 'right' as const,
    marginTop: 4,
  },
  proposeSectionLabel: {
    fontFamily: fonts.bold,
    fontSize: fs(12),
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    color: colors.outline,
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  proposeCategoryWrap: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing[2],
  },
  proposeCategoryChip: {
    backgroundColor: colors['surface-container-low'],
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
  },
  proposeCategoryChipActive: {
    backgroundColor: colors['on-surface'],
  },
  proposeCategoryText: {
    fontFamily: fonts.medium,
    fontSize: fs(12),
    color: colors['on-surface-variant'],
  },
  proposeCategoryTextActive: {
    color: colors.background,
  },
  proposePublicRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[3],
    marginTop: spacing[5],
    paddingVertical: spacing[2],
  },
  proposePublicLabel: {
    fontFamily: fonts.semibold,
    fontSize: fs(14),
    color: colors['on-surface'],
  },
  proposePublicSub: {
    fontFamily: fonts.regular,
    fontSize: fs(12),
    color: colors['on-surface-variant'],
    marginTop: 2,
  },
  proposeStartButton: {
    marginTop: spacing[6],
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 52,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  proposeStartText: {
    fontFamily: fonts.semibold,
    fontSize: fs(15),
    color: colors['on-primary'],
    letterSpacing: 0.5,
  },
});
