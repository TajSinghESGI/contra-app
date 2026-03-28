import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  StyleSheet,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import MaskedView from '@react-native-masked-view/masked-view';
import Icon from '@/components/ui/Icon';
import { SiriProvider, useSiri } from '@/components/ui/AppleIntelligence';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { track } from '@/services/analytics';
import { AnalyticsEvents } from '@/services/analyticsEvents';
import { fonts, radius, shadows, spacing, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { LiveScoreBar } from '@/components/debate/LiveScoreBar';
import { useStreakStore } from '@/store/streakStore';
import { useProgressionStore } from '@/store/progressionStore';
import { useBadgeStore } from '@/store/badgeStore';
import { Toast } from '@/components/ui/Toast';
import { getDebateScore } from '@/services/api';
import type { ScoreResult } from '@/store/debateStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string;
  percentage: number;
  description: string;
  delay: number;
}

// ─── Metric card ──────────────────────────────────────────────────────────────

function MetricCard({ label, value, percentage, description, delay }: MetricCardProps) {
  const { colors, typography, fs } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <LiveScoreBar score={percentage} delay={delay} />
      <Text style={styles.metricDescription}>{description}</Text>
    </View>
  );
}

// ─── Inner screen (must be rendered inside SiriProvider) ─────────────────────

function ResultScreenInner() {
  const { colors, isDark, typography, fs } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, topic: topicParam } = useLocalSearchParams<{ id: string; topic?: string }>();
  const { toggle, dismiss, isActive } = useSiri();
  const { t } = useTranslation();
  const syncStreak = useStreakStore((s) => s.sync);
  const syncProgression = useProgressionStore((s) => s.sync);
  const syncBadges = useBadgeStore((s) => s.sync);

  const [score, setScore] = React.useState<ScoreResult | null>(null);
  const scoreOpacity = useSharedValue(0);
  const scoreTranslate = useSharedValue(20);

  useEffect(() => {
    scoreOpacity.value = withDelay(100, withTiming(1, { duration: 700 }));
    scoreTranslate.value = withDelay(100, withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [scoreOpacity, scoreTranslate]);

  useEffect(() => {
    if (!id) return;

    let attempts = 0;
    const fetchAndProcess = async () => {
      try {
        const result = await getDebateScore(id);
        setScore(result);
        track(AnalyticsEvents.DEBATE_SCORE_VIEWED, {
          debateId: id,
          score: result.total,
        });

        // Sync all stores from backend (streaks, progression, badges are computed server-side)
        await Promise.all([syncStreak(), syncProgression(), syncBadges()]);
      } catch {
        // Score pas encore prêt, retry (max 10 tentatives)
        if (attempts < 10) {
          attempts++;
          setTimeout(fetchAndProcess, 3000);
        }
      }
    };

    fetchAndProcess();
  }, [id]);

  const animatedScoreStyle = useAnimatedStyle(() => ({
    opacity: scoreOpacity.value,
    transform: [{ translateY: scoreTranslate.value }],
  }));

  return (
    <View style={styles.root}>
      {/* ── Header blur background (masked fade) ── */}
      {Platform.OS !== 'web' && (
        <MaskedView
          style={[styles.headerBlur, { height: insets.top + 80 }]}
          maskElement={
            <LinearGradient
              colors={['black', 'black', 'transparent']}
              locations={[0, 0.6, 1]}
              style={StyleSheet.absoluteFill}
            />
          }
        >
          <BlurView
            intensity={80}
            tint={isDark ? 'systemThickMaterialDark' : 'systemThickMaterialLight'}
            style={StyleSheet.absoluteFill}
          />
        </MaskedView>
      )}

      {/* ── Header bar ── */}
      <View style={[styles.headerBar, { top: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
          hitSlop={8}
        >
          <Icon name="chevron-left" size={22} color={colors['on-surface']} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerButton}
          hitSlop={8}
          onPress={async () => {
            await Share.share({
              message: t('share.scoreMessage', { score: score?.total ?? 0, topic: topicParam || score?.topic || '' }) + '\n\n' + t('share.tagline'),
            });
          }}
        >
          <Icon name="upload" size={18} color={colors['on-surface']} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing[5], paddingBottom: insets.bottom + 120 },
        ]}
      >
        {/* ── Verdict header ── */}
        <Animated.View style={[styles.verdictSection, { marginTop: spacing[10] }, animatedScoreStyle]}>
          <Text style={styles.sessionLabel}>{t('result.sessionVerdict')}</Text>
          <Text style={styles.verdictText}>{score?.verdict ?? t('common.loading')}</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreNumber}>{score?.total ?? '—'}</Text>
            <Text style={styles.scoreOutOf}>{t('result.scoreOutOf')}</Text>
          </View>
        </Animated.View>

        {/* ── Bento grid metrics (2×2) ── */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricsRow}>
            <MetricCard label={t('result.criteria.logic')} value={`${score?.logic ?? 0}%`} percentage={score?.logic ?? 0} description={score?.logic && score.logic >= 75 ? t('result.criteriaDescriptions.logic.good') : t('result.criteriaDescriptions.logic.bad')} delay={200} />
            <MetricCard label={t('result.criteria.rhetoric')} value={`${score?.rhetoric ?? 0}%`} percentage={score?.rhetoric ?? 0} description={score?.rhetoric && score.rhetoric >= 75 ? t('result.criteriaDescriptions.rhetoric.good') : t('result.criteriaDescriptions.rhetoric.bad')} delay={350} />
          </View>
          <View style={styles.metricsRow}>
            <MetricCard label={t('result.criteria.evidence')} value={`${score?.evidence ?? 0}%`} percentage={score?.evidence ?? 0} description={score?.evidence && score.evidence >= 75 ? t('result.criteriaDescriptions.evidence.good') : t('result.criteriaDescriptions.evidence.bad')} delay={500} />
            <MetricCard label={t('result.criteria.originality')} value={`${score?.originality ?? 0}%`} percentage={score?.originality ?? 0} description={score?.originality && score.originality >= 75 ? t('result.criteriaDescriptions.originality.good') : t('result.criteriaDescriptions.originality.bad')} delay={650} />
          </View>
        </View>

        {/* ── Analytical Deep Dive card (navigates to full analysis) ── */}
        <TouchableOpacity
          style={styles.analysisCard}
          activeOpacity={0.85}
          onPress={() => router.push({ pathname: '/debate/analysis/[id]', params: { id: id!, topic: topicParam || score?.topic || '' } })}
        >
          <Text style={styles.analysisLabel}>{t('result.analyticalDeepDive')}</Text>
          <Text style={styles.analysisBody} numberOfLines={3}>
            {score?.analysis || t('result.analysisLoading')}
          </Text>
          <View style={styles.analysisFooter}>
            <Text style={styles.analysisLink}>{t('result.readFullAnalysis')}</Text>
            <Icon name="chevron-right" size={14} color={colors.primary} />
          </View>
        </TouchableOpacity>

      </ScrollView>

      {/* ── FAB — Demander à l'IA ── */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + spacing[5], right: spacing[5] }]}
        activeOpacity={0.85}
        onPress={() => {
          if (isActive) return;
          toggle();
          setTimeout(() => {
            dismiss();
            router.push(`/debate/coach/${id}` as any);
          }, 1800);
        }}
      >
        <LinearGradient
          colors={[colors.primary, colors['primary-dim']]}
          style={styles.fabGradient}
        >
          <Icon name="document-edit" size={22} color={colors['on-primary']} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ResultScreen() {
  const { colors } = useTheme();
  return (
    <SiriProvider
      glow={{
        colors: [colors.primary, colors['accent-ai'], colors['accent-user'], colors.primary],
      }}
    >
      <ResultScreenInner />
    </SiriProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (colors: ColorTokens, typography: any, fs: (n: number) => number) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9,
  },
  headerBar: {
    position: 'absolute',
    left: spacing[5],
    right: spacing[5],
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: 18,
    ...shadows.ambient,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
  },

  verdictSection: {
    marginBottom: spacing[6],
  },
  sessionLabel: {
    ...typography['label-sm'],
    color: colors.outline,
  },
  verdictText: {
    fontFamily: fonts.light,
    fontSize: fs(40),
    letterSpacing: -1.5,
    color: colors['on-surface'],
    marginTop: spacing[2],
    lineHeight: fs(46),
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: spacing[2],
  },
  scoreNumber: {
    fontFamily: fonts.thin,
    fontSize: fs(72),
    color: colors['on-surface'],
    lineHeight: fs(80),
    letterSpacing: -2,
  },
  scoreOutOf: {
    fontFamily: fonts.light,
    fontSize: fs(24),
    color: colors['outline-variant'],
    marginBottom: 10,
    marginLeft: spacing[1],
  },

  metricsGrid: {
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['2xl'],
    padding: spacing[4],
    ...shadows.ambient,
  },
  metricLabel: {
    ...typography['label-sm'],
    color: colors.outline,
    marginBottom: spacing[2],
  },
  metricValue: {
    fontFamily: fonts.bold,
    fontSize: fs(22),
    color: colors['on-surface'],
    letterSpacing: -0.5,
    marginBottom: spacing[2],
  },
  metricDescription: {
    fontFamily: fonts.regular,
    fontSize: fs(11),
    color: colors['on-surface-variant'],
  },

  analysisCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: 24,
    padding: spacing[5],
    marginBottom: spacing[6],
    ...shadows.ambient,
  },
  analysisLabel: {
    ...typography['label-md'],
    color: colors.outline,
    marginBottom: spacing[3],
  },
  analysisBody: {
    fontFamily: fonts.regular,
    fontSize: fs(15),
    lineHeight: fs(24),
    color: colors['on-surface'],
  },
  analysisFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[3],
  },
  analysisLink: {
    fontFamily: fonts.semibold,
    fontSize: fs(13),
    color: colors.primary,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    marginTop: spacing[4],
    backgroundColor: colors['surface-container-low'],
    borderRadius: radius.lg,
    padding: spacing[3],
  },
  hintIcon: {
    marginTop: 1,
  },
  hintText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fs(13),
    lineHeight: fs(20),
    color: colors['on-surface-variant'],
  },

  fab: {
    position: 'absolute',
    zIndex: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
