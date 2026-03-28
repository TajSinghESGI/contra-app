import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Icon from '@/components/ui/Icon';
import { LiveScoreBar } from '@/components/debate/LiveScoreBar';
import { fonts, radius, shadows, spacing, SCORE_CRITERIA, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { useFriendStore } from '@/store/friendStore';

// ─── Criteria helpers ─────────────────────────────────────────────────────

// ─── Criteria comparison row ──────────────────────────────────────────────────

function CriteriaRow({
  label,
  fromScore,
  toScore,
  fromWins,
  delay,
  colors,
}: {
  label: string;
  fromScore: number;
  toScore: number;
  fromWins: boolean;
  delay: number;
  colors: ColorTokens;
}) {
  const { typography, fs } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);

  return (
    <View style={styles.criteriaRow}>
      <Text style={styles.criteriaLabel}>{label}</Text>
      <View style={styles.criteriaBarsContainer}>
        {/* From (left) */}
        <View style={styles.criteriaBarColumn}>
          <Text style={[
            styles.criteriaPercentage,
            fromScore >= toScore && styles.criteriaPercentageHighlight,
          ]}>
            {fromScore}%
          </Text>
          <LiveScoreBar score={fromScore} delay={delay} />
        </View>
        {/* To (right) */}
        <View style={styles.criteriaBarColumn}>
          <Text style={[
            styles.criteriaPercentage,
            toScore >= fromScore && styles.criteriaPercentageHighlight,
          ]}>
            {toScore}%
          </Text>
          <LiveScoreBar score={toScore} delay={delay + 100} />
        </View>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ChallengeResultScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, typography, fs } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const { id } = useLocalSearchParams<{ id: string }>();

  const challenges = useFriendStore((s) => s.challenges);
  const challenge = challenges.find((c) => c.id === id);

  // Animated score entrance
  const scoreOpacity = useSharedValue(0);
  const scoreTranslate = useSharedValue(20);

  useEffect(() => {
    scoreOpacity.value = withDelay(100, withTiming(1, { duration: 700 }));
    scoreTranslate.value = withDelay(100, withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [scoreOpacity, scoreTranslate]);

  const animatedScoreStyle = useAnimatedStyle(() => ({
    opacity: scoreOpacity.value,
    transform: [{ translateY: scoreTranslate.value }],
  }));

  if (!challenge || challenge.status !== 'completed') {
    return (
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8} accessibilityRole="button">
            <Icon name="chevron-left" size={22} color={colors['on-surface']} />
          </Pressable>
          <Text style={styles.headerLabel}>RÉSULTAT</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Résultat introuvable</Text>
        </View>
      </View>
    );
  }

  const fromScore = challenge.fromScore ?? 0;
  const toScore = challenge.toScore ?? 0;
  const fromWins = fromScore > toScore;
  const toWins = toScore > fromScore;
  const isTie = fromScore === toScore;

  const isMe = (friendId: string) => friendId === 'me';
  const iAmFrom = isMe(challenge.from.id);

  let verdictText = 'Égalité';
  if (fromWins) {
    verdictText = iAmFrom ? 'Victoire' : 'Défaite';
  } else if (toWins) {
    verdictText = iAmFrom ? 'Défaite' : 'Victoire';
  }

  const handleRevanche = () => {
    router.push({
      pathname: '/onboarding',
      params: { topic: challenge.topic, difficulty: challenge.difficulty },
    } as any);
  };

  const handleShare = async () => {
    const myScore = iAmFrom ? fromScore : toScore;
    await Share.share({
      message: `J'ai scoré ${myScore}/100 dans un défi CONTRA sur "${challenge.topic}" ! Télécharge Contra et montre ce que tu vaux.`,
    });
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8} accessibilityRole="button">
          <Icon name="chevron-left" size={22} color={colors['on-surface']} />
        </Pressable>
        <Text style={styles.headerLabel}>RÉSULTAT DU DÉFI</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[8] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Verdict */}
        <Animated.View style={[styles.verdictSection, animatedScoreStyle]}>
          <Text style={styles.sectionLabel}>RÉSULTAT DU DÉFI</Text>
          <Text style={styles.verdictText}>{verdictText}</Text>
        </Animated.View>

        {/* Score face-off */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.faceoffCard}>
          {/* From column */}
          <View style={styles.faceoffColumn}>
            <View style={styles.faceoffAvatar}>
              <Text style={styles.faceoffInitial}>{challenge.from.initial}</Text>
            </View>
            <Text style={styles.faceoffName} numberOfLines={1}>{challenge.from.name.split(' ')[0]}</Text>
            <Text style={[
              styles.faceoffScore,
              fromWins && styles.faceoffScoreWinner,
            ]}>
              {fromScore}
            </Text>
            <Text style={styles.faceoffOutOf}>/100</Text>
          </View>

          {/* VS divider */}
          <View style={styles.faceoffDivider}>
            <Text style={styles.faceoffVs}>VS</Text>
          </View>

          {/* To column */}
          <View style={styles.faceoffColumn}>
            <View style={styles.faceoffAvatar}>
              <Text style={styles.faceoffInitial}>{challenge.to.initial}</Text>
            </View>
            <Text style={styles.faceoffName} numberOfLines={1}>{challenge.to.name.split(' ')[0]}</Text>
            <Text style={[
              styles.faceoffScore,
              toWins && styles.faceoffScoreWinner,
            ]}>
              {toScore}
            </Text>
            <Text style={styles.faceoffOutOf}>/100</Text>
          </View>
        </Animated.View>

        {/* Criteria comparison */}
        <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.criteriaCard}>
          <Text style={styles.criteriaTitle}>COMPARAISON PAR CRITÈRE</Text>

          {/* Column headers */}
          <View style={styles.criteriaHeaderRow}>
            <View style={styles.criteriaHeaderSpacer} />
            <View style={styles.criteriaBarsContainer}>
              <Text style={styles.criteriaHeaderName}>{challenge.from.name.split(' ')[0]}</Text>
              <Text style={styles.criteriaHeaderName}>{challenge.to.name.split(' ')[0]}</Text>
            </View>
          </View>

          {SCORE_CRITERIA.map((criteria, index) => {
            const fromVal = challenge.fromCriteria?.[criteria.key as keyof typeof challenge.fromCriteria] ?? 0;
            const toVal = challenge.toCriteria?.[criteria.key as keyof typeof challenge.toCriteria] ?? 0;
            return (
              <CriteriaRow
                key={criteria.key}
                label={criteria.label.toUpperCase()}
                fromScore={fromVal}
                toScore={toVal}
                fromWins={fromVal > toVal}
                delay={300 + index * 150}
                colors={colors}
              />
            );
          })}
        </Animated.View>

        {/* CTAs */}
        <Animated.View entering={FadeInDown.delay(240).duration(400)} style={styles.ctaRow}>
          <Pressable onPress={handleRevanche} style={styles.ctaWrapper} accessibilityRole="button">
            <LinearGradient
              colors={[colors.primary, colors['primary-dim']]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>Revanche</Text>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={handleShare} style={styles.shareBtn} accessibilityRole="button">
            <Text style={styles.shareBtnText}>Partager</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const createStyles = (colors: ColorTokens, typography: any, fs: (n: number) => number) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors['surface-container-lowest'],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.ambient,
  },
  headerLabel: {
    ...typography['label-md'],
    color: colors.outline,
  },

  content: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: fs(15),
    color: colors['on-surface-variant'],
  },

  // Verdict
  verdictSection: {
    marginBottom: spacing[5],
  },
  sectionLabel: {
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

  // Face-off card
  faceoffCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['3xl'],
    padding: spacing[6],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[5],
    ...shadows.ambient,
  },
  faceoffColumn: {
    flex: 1,
    alignItems: 'center',
  },
  faceoffAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors['surface-container-high'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  faceoffInitial: {
    fontFamily: fonts.bold,
    fontSize: fs(22),
    color: colors['on-surface'],
  },
  faceoffName: {
    fontFamily: fonts.semibold,
    fontSize: fs(14),
    color: colors['on-surface'],
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  faceoffScore: {
    fontFamily: fonts.thin,
    fontSize: fs(48),
    color: colors['on-surface-variant'],
    letterSpacing: -1.5,
    lineHeight: fs(54),
  },
  faceoffScoreWinner: {
    color: colors.primary,
  },
  faceoffOutOf: {
    fontFamily: fonts.light,
    fontSize: fs(16),
    color: colors['outline-variant'],
    marginTop: -2,
  },
  faceoffDivider: {
    paddingHorizontal: spacing[2],
    marginTop: spacing[8],
  },
  faceoffVs: {
    fontFamily: fonts.bold,
    fontSize: fs(18),
    color: colors['outline-variant'],
  },

  // Criteria comparison
  criteriaCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['2xl'],
    padding: spacing[5],
    marginBottom: spacing[5],
    ...shadows.ambient,
  },
  criteriaTitle: {
    ...typography['label-sm'],
    color: colors.outline,
    marginBottom: spacing[4],
  },
  criteriaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  criteriaHeaderSpacer: {
    width: 80,
  },
  criteriaBarsContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing[3],
  },
  criteriaHeaderName: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: fs(11),
    color: colors['on-surface-variant'],
    textAlign: 'center',
  },
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  criteriaLabel: {
    ...typography['label-sm'],
    color: colors['on-surface-variant'],
    width: 80,
  },
  criteriaBarColumn: {
    flex: 1,
    gap: spacing[1],
    alignItems: 'center',
  },
  criteriaPercentage: {
    fontFamily: fonts.semibold,
    fontSize: fs(13),
    color: colors['on-surface-variant'],
    letterSpacing: -0.3,
  },
  criteriaPercentageHighlight: {
    color: colors.primary,
  },

  // CTAs
  ctaRow: {
    gap: spacing[3],
  },
  ctaWrapper: {
    borderRadius: radius.full,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 3,
  },
  ctaGradient: {
    height: 52,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: fonts.medium,
    fontSize: fs(14),
    letterSpacing: 1,
    color: colors['on-primary'],
  },
  shareBtn: {
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors['surface-container-high'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnText: {
    fontFamily: fonts.medium,
    fontSize: fs(14),
    letterSpacing: 0.5,
    color: colors['on-surface-variant'],
  },
});
