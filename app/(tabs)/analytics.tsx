import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { fonts, radius, shadows, spacing, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { useProgressionStore } from '@/store/progressionStore';
import { AnimatedHeaderScrollView } from '@/components/ui/AnimatedHeaderScrollView';
import { AnimatedProgressBar } from '@/components/ui/Progress';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { getUserStats, getDebateHistory, isTrialExpired } from '@/services/api';
import type { UserStats, DebateHistoryEntry } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';

// ─── Score ring (animated SVG arc) ───────────────────────────────────────────

import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function getScoreColor(score: number): string {
  if (score >= 75) return '#34C759';
  if (score >= 50) return '#FF9500';
  if (score >= 30) return '#FF6B35';
  return '#FF3B30';
}

function ScoreRing({ score, size = 100, strokeWidth = 6 }: { score: number; size?: number; strokeWidth?: number }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const progress = useSharedValue(0);

  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const scoreColor = getScoreColor(score);

  useEffect(() => {
    progress.value = withDelay(
      300,
      withTiming(score / 100, { duration: 1400, easing: Easing.out(Easing.cubic) }),
    );
  }, [score, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors['surface-container-high']}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Filled arc */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={scoreColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
        />
      </Svg>
      {/* Score text */}
      <Text
        style={{
          fontFamily: fonts.thin,
          fontSize: size * 0.38,
          color: colors['on-surface'],
          letterSpacing: -2,
        }}
      >
        {score}
      </Text>
      <Text
        style={{
          fontFamily: fonts.medium,
          fontSize: 9,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: colors['on-surface-variant'],
          marginTop: -2,
        }}
      >
        {t('result.scoreOutOf')}
      </Text>
    </View>
  );
}

// ─── Criterion row with gradient bar ────────────────────────────────────────

function CriterionRow({
  label,
  percentage,
  delay,
}: {
  label: string;
  percentage: number;
  delay: number;
}) {
  const { colors, typography, fs } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(500).easing(Easing.out(Easing.cubic))}
      style={styles.criterionRow}
    >
      <View style={styles.criterionHeader}>
        <Text style={styles.criterionLabel}>{label}</Text>
        <Text style={styles.criterionPercent}>{percentage}%</Text>
      </View>
      <AnimatedProgressBar
        progress={percentage / 100}
        height={6}
        borderRadius={3}
        animationDuration={1200}
        useGradient
      />
    </Animated.View>
  );
}

// ─── Debate history card ────────────────────────────────────────────────────

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

  const scoreColor = getScoreColor(debate.score);

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
            <View style={styles.debateAvatarCol}>
              <UserAvatar
                size={36}
                initial={debate.opponent_initial}
                avatarBg={debate.opponent_avatar_bg}
                avatarUrl={debate.opponent_avatar_url}
              />
            </View>
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={styles.debateTopic} numberOfLines={2}>
              {debate.type === '1v1' && debate.opponent
                ? `vs ${debate.opponent.split(' ')[0]}`
                : debate.topic}
            </Text>
            {debate.type === '1v1' && (
              <Text style={styles.debateSubtopic} numberOfLines={1}>{debate.topic}</Text>
            )}
          </View>
          <View style={[styles.debateScoreCircle, { borderColor: scoreColor }]}>
            <Text style={[styles.debateScoreValue, { color: scoreColor }]}>
              {debate.score}
            </Text>
          </View>
        </View>
        <Text style={styles.debateDate}>
          {debate.type === '1v1' ? '1v1 · ' : ''}
          {new Date(debate.date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const { colors, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { totalDebates, totalScore } = useProgressionStore();
  const user = useAuthStore(s => s.user);
  const trialExpired = isTrialExpired(user);

  const [stats, setStats] = useState<UserStats | null>(null);
  const [debates, setDebates] = useState<DebateHistoryEntry[]>([]);

  useEffect(() => {
    if (trialExpired) return;
    let active = true;
    getUserStats().then((d) => active && setStats(d)).catch(() => {});
    getDebateHistory().then((d) => active && setDebates(d.results)).catch(() => {});
    return () => { active = false; };
  }, [trialExpired]);

  const displayDebates = stats?.total_debates ?? totalDebates;
  const avgScore = displayDebates > 0 ? Math.round((stats?.total_score ?? totalScore) / displayDebates) : 0;

  const criteria = stats ? [
    { label: t('analytics.logic'), percentage: stats.criteria.logic },
    { label: t('analytics.rhetoric'), percentage: stats.criteria.rhetoric },
    { label: t('analytics.evidence'), percentage: stats.criteria.evidence },
    { label: t('analytics.originality'), percentage: stats.criteria.originality },
  ] : [];

  return (
    <AnimatedHeaderScrollView
      largeTitle={t('analytics.title')}
      subtitle={t('analytics.subtitle')}
      contentContainerStyle={{
        paddingBottom: insets.bottom + 100,
      }}
    >
      {/* ── Trial expired lock ── */}
      {trialExpired && (
        <View style={styles.lockedContainer}>
          <Ionicons name="lock-closed" size={40} color={colors['outline-variant']} />
          <Text style={styles.lockedTitle}>{t('analytics.lockedTitle')}</Text>
          <Text style={styles.lockedBody}>{t('analytics.lockedBody')}</Text>
          <Pressable
            style={styles.lockedCta}
            onPress={() => router.push('/paywall' as any)}
            accessibilityRole="button"
          >
            <Text style={styles.lockedCtaText}>{t('analytics.lockedCta')}</Text>
          </Pressable>
        </View>
      )}

      {/* ── Main content (hidden if trial expired) ── */}
      {!trialExpired && (
        <>
          {/* ── Hero score card ── */}
          <Animated.View
            entering={FadeInDown.duration(600).easing(Easing.out(Easing.cubic))}
            style={styles.heroCard}
          >
            <Text style={styles.heroLabel}>{t('analytics.avgScore')}</Text>
            <View style={styles.heroContent}>
              <ScoreRing score={avgScore} size={110} />
              <View style={styles.heroMeta}>
                <View style={styles.heroMetaRow}>
                  <Text style={styles.heroMetaValue}>{displayDebates}</Text>
                  <Text style={styles.heroMetaLabel}>{t('analytics.debates')}</Text>
                </View>
                <View style={styles.heroMetaDivider} />
                <View style={styles.heroMetaRow}>
                  <Text style={styles.heroMetaValue}>{stats?.current_streak ?? 0}{t('streak.daysShort')}</Text>
                  <Text style={styles.heroMetaLabel}>{t('analytics.streak')}</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* ── Criteria progress ── */}
          {criteria.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('analytics.progressByCategory')}</Text>
              <View style={styles.criteriaCard}>
                {criteria.map((c, i) => (
                  <CriterionRow
                    key={c.label}
                    label={c.label}
                    percentage={c.percentage}
                    delay={400 + i * 100}
                  />
                ))}
              </View>
            </View>
          )}

          {/* ── Recent debates ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>{t('analytics.recentDebates')}</Text>
              <Pressable
                onPress={() => router.push('/debate/history')}
                hitSlop={8}
                accessibilityRole="button"
              >
                <Text style={styles.seeAllText}>{t('home.viewAll')}</Text>
              </Pressable>
            </View>
            <View style={styles.debateList}>
              {debates.length === 0 && (
                <Text style={styles.emptyText}>{t('analytics.noDebates')}</Text>
              )}
              {debates.slice(0, 3).map((debate, i) => (
                <DebateCard
                  key={debate.id}
                  debate={debate}
                  delay={600 + i * 80}
                  onPress={() => router.push({ pathname: '/debate/result/[id]', params: { id: debate.id, topic: debate.topic } })}
                />
              ))}
            </View>
          </View>
        </>
      )}
    </AnimatedHeaderScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (colors: ColorTokens, typography: any, fs: (n: number) => number) => StyleSheet.create({
  // Hero card
  heroCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: 28,
    padding: spacing[5],
    marginBottom: spacing[3],
    ...shadows.ambient,
  },
  heroLabel: {
    ...typography['label-md'],
    color: colors.outline,
    marginBottom: spacing[4],
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[6],
  },
  heroMeta: {
    flex: 1,
    gap: spacing[4],
  },
  heroMetaRow: {
    gap: 2,
  },
  heroMetaValue: {
    fontFamily: fonts.bold,
    fontSize: fs(28),
    letterSpacing: -0.5,
    color: colors['on-surface'],
  },
  heroMetaLabel: {
    fontFamily: fonts.regular,
    fontSize: fs(13),
    color: colors['on-surface-variant'],
  },
  heroMetaDivider: {
    width: '40%',
    height: 1,
    backgroundColor: colors['outline-variant'],
    opacity: 0.2,
  },

  // Section
  section: {
    marginBottom: spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  sectionLabel: {
    ...typography['label-sm'],
    color: colors.outline,
  },
  seeAllText: {
    fontFamily: fonts.medium,
    fontSize: fs(13),
    color: colors.primary,
  },

  // Criteria card
  criteriaCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['3xl'],
    padding: spacing[5],
    gap: spacing[5],
    ...shadows.ambient,
  },
  criterionRow: {
    gap: spacing[2],
  },
  criterionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  criterionLabel: {
    fontFamily: fonts.medium,
    fontSize: fs(15),
    color: colors['on-surface'],
  },
  criterionPercent: {
    fontFamily: fonts.bold,
    fontSize: fs(15),
    color: colors['on-surface'],
  },

  // Debate list
  debateList: {
    gap: spacing[2],
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
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  debateAvatarCol: {
    marginRight: spacing[1],
  },
  debateTopic: {
    fontFamily: fonts.semibold,
    fontSize: fs(15),
    color: colors['on-surface'],
    lineHeight: fs(22),
  },
  debateSubtopic: {
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
  debateDate: {
    fontFamily: fonts.regular,
    fontSize: fs(12),
    color: colors['on-surface-variant'],
    marginTop: spacing[2],
  },

  // Empty state
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: fs(14),
    color: colors['on-surface-variant'],
    textAlign: 'center',
    paddingVertical: spacing[8],
  },

  // Trial-expired lock screen
  lockedContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing[8],
    paddingTop: spacing[16],
    gap: spacing[4],
  },
  lockedTitle: {
    fontFamily: fonts.bold,
    fontSize: fs(20),
    color: colors['on-surface'],
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  lockedBody: {
    fontFamily: fonts.regular,
    fontSize: fs(15),
    color: colors['on-surface-variant'],
    textAlign: 'center',
    lineHeight: fs(22),
  },
  lockedCta: {
    marginTop: spacing[2],
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[3],
  },
  lockedCtaText: {
    fontFamily: fonts.semibold,
    fontSize: fs(14),
    color: colors['on-primary'],
    letterSpacing: 0.5,
  },
});
