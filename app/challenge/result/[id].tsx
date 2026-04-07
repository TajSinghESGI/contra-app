import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { ChallengeShareCard } from '@/components/debate/ChallengeShareCard';
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
import { useTranslation } from 'react-i18next';
import Icon from '@/components/ui/Icon';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LiveScoreBar } from '@/components/debate/LiveScoreBar';
import { fonts, radius, shadows, spacing, SCORE_CRITERIA, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useFriendStore } from '@/store/friendStore';
import { useAuthStore } from '@/store/authStore';

const ILLUSTRATIONS = {
  won: require('@/assets/illustration/won.png'),
  lost: require('@/assets/illustration/lost.png'),
  tie: require('@/assets/illustration/tie.png'),
} as const;

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
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const { id } = useLocalSearchParams<{ id: string }>();

  const challenges = useFriendStore((s) => s.challenges);
  const challenge = challenges.find((c) => c.id === id);
  const currentUserId = useAuthStore((s) => s.user?.id);

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

  const fromScore = challenge.from_score ?? 0;
  const toScore = challenge.to_score ?? 0;
  const fromWins = fromScore > toScore;
  const toWins = toScore > fromScore;
  const isTie = fromScore === toScore;

  const iAmFrom = challenge.from.id === currentUserId;

  const iWon = (iAmFrom && fromWins) || (!iAmFrom && toWins);
  const iLost = (iAmFrom && toWins) || (!iAmFrom && fromWins);

  let verdictText = 'Égalité';
  let verdictIllustration = ILLUSTRATIONS.tie;
  let verdictColor = colors['on-surface'];
  if (iWon) {
    verdictText = 'Victoire';
    verdictIllustration = ILLUSTRATIONS.won;
    verdictColor = '#34C759';
  } else if (iLost) {
    verdictText = 'Défaite';
    verdictIllustration = ILLUSTRATIONS.lost;
    verdictColor = colors['on-surface-variant'];
  }

  const handleRevanche = () => {
    // Navigate to friends screen with rematch params to open ChallengeSheet
    const opponentId = iAmFrom ? challenge.to.id : challenge.from.id;
    router.push({
      pathname: '/friends',
      params: { rematchUserId: opponentId },
    } as any);
  };

  const [showSharePreview, setShowSharePreview] = React.useState(false);
  const shareCardRef = useRef<View>(null);

  const myScore = iAmFrom ? fromScore : toScore;
  const theirScore = iAmFrom ? toScore : fromScore;
  const myName = iAmFrom ? (challenge.from.name ?? challenge.from.pseudo ?? '') : (challenge.to.name ?? challenge.to.pseudo ?? '');
  const opponentName = iAmFrom ? (challenge.to.name ?? challenge.to.pseudo ?? '') : (challenge.from.name ?? challenge.from.pseudo ?? '');

  const handleShare = () => setShowSharePreview(true);

  const handleShareCapture = async () => {
    try {
      if (!shareCardRef.current) {
        console.warn('Share: ref not ready');
        return;
      }
      await new Promise((r) => setTimeout(r, 300));
      const uri = await captureRef(shareCardRef.current, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      setShowSharePreview(false);
      await new Promise((r) => setTimeout(r, 100));
      await Sharing.shareAsync(uri, { mimeType: 'image/png' });
    } catch (e: any) {
      console.error('Share capture failed:', e?.message ?? e);
      setShowSharePreview(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8} accessibilityRole="button">
          <Icon name="chevron-left" size={22} color={colors['on-surface']} />
        </Pressable>
        <Text style={styles.headerLabel}>RÉSULTAT DU DÉFI</Text>
        <Pressable onPress={handleShare} style={styles.shareHeaderBtn} hitSlop={8} accessibilityRole="button">
          <Ionicons name="share-outline" size={18} color={colors['on-surface']} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[8] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Verdict */}
        <Animated.View style={[styles.verdictSection, animatedScoreStyle]}>
          <Image source={verdictIllustration} style={styles.verdictIllustration} resizeMode="contain" />
          <Text style={styles.sectionLabel}>RÉSULTAT DU DÉFI</Text>
          <Text style={[styles.verdictText, { color: verdictColor }]}>
            {verdictText}
          </Text>
        </Animated.View>

        {/* Score face-off */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.faceoffCard}>
          {/* From column */}
          <View style={styles.faceoffColumn}>
            <UserAvatar size={44} initial={challenge.from.initial} avatarBg={challenge.from.avatarBg} avatarUrl={challenge.from.avatarUrl} />
            <Text style={styles.faceoffName} numberOfLines={1}>{challenge.from.name.split(' ')[0]}</Text>
            <Text style={[
              styles.faceoffScore,
              fromWins && { color: '#34C759' },
              toWins && { color: colors['outline-variant'] },
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
            <UserAvatar size={44} initial={challenge.to.initial} avatarBg={challenge.to.avatarBg} avatarUrl={challenge.to.avatarUrl} />
            <Text style={styles.faceoffName} numberOfLines={1}>{challenge.to.name.split(' ')[0]}</Text>
            <Text style={[
              styles.faceoffScore,
              toWins && { color: '#34C759' },
              fromWins && { color: colors['outline-variant'] },
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
            const fromVal = (challenge.from_criteria as any)?.[criteria.key] ?? 0;
            const toVal = (challenge.to_criteria as any)?.[criteria.key] ?? 0;
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
          <Pressable
            onPress={() => router.push(`/challenge/coaching/${challenge.id}` as any)}
            style={styles.coachingBtn}
            accessibilityRole="button"
          >
            <Text style={styles.coachingBtnText}>{t('challenge.coaching')}</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      {/* Share preview modal */}
      {showSharePreview && (
        <View style={styles.shareOverlay}>
          <View style={styles.shareModal}>
            <View ref={shareCardRef} collapsable={false}>
            <ChallengeShareCard
              myName={myName}
              opponentName={opponentName}
              myScore={myScore}
              opponentScore={theirScore}
              topic={challenge.topic}
              won={iWon}
            />
            </View>
            <View style={styles.shareActions}>
              <Pressable style={styles.shareBtn} onPress={handleShareCapture}>
                <Icon name="upload" size={16} color={colors['on-primary']} />
                <Text style={styles.shareBtnText}>Partager</Text>
              </Pressable>
              <Pressable style={styles.shareClose} onPress={() => setShowSharePreview(false)}>
                <Text style={styles.shareCloseText}>Fermer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
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
  shareHeaderBtn: {
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
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  verdictIllustration: {
    width: 64,
    height: 64,
    marginBottom: spacing[2],
  },
  sectionLabel: {
    ...typography['label-sm'],
    color: colors.outline,
  },
  verdictText: {
    fontFamily: fonts.bold,
    fontSize: fs(26),
    letterSpacing: -0.5,
    color: colors['on-surface'],
    marginTop: spacing[1],
    lineHeight: fs(32),
    textAlign: 'center',
  },

  // Face-off card
  faceoffCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['3xl'],
    padding: spacing[4],
    paddingVertical: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
    ...shadows.ambient,
  },
  faceoffColumn: {
    flex: 1,
    alignItems: 'center',
  },
  faceoffAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[1],
  },
  faceoffInitial: {
    fontFamily: fonts.bold,
    fontSize: fs(18),
    color: colors['on-surface'],
  },
  faceoffName: {
    fontFamily: fonts.semibold,
    fontSize: fs(13),
    color: colors['on-surface'],
    marginBottom: spacing[1],
    textAlign: 'center',
  },
  faceoffScore: {
    fontFamily: fonts.bold,
    fontSize: fs(38),
    color: colors['on-surface-variant'],
    letterSpacing: -1.5,
    lineHeight: fs(44),
  },
  faceoffOutOf: {
    fontFamily: fonts.light,
    fontSize: fs(13),
    color: colors['outline-variant'],
    marginTop: -2,
  },
  faceoffDivider: {
    paddingHorizontal: spacing[2],
    marginTop: spacing[6],
  },
  faceoffVs: {
    fontFamily: fonts.bold,
    fontSize: fs(14),
    color: colors['outline-variant'],
  },

  // Criteria comparison
  criteriaCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['2xl'],
    padding: spacing[4],
    marginBottom: spacing[3],
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
    paddingVertical: spacing[2],
  },
  criteriaLabel: {
    ...typography['label-sm'],
    color: colors['on-surface-variant'],
    width: 80,
  },
  criteriaBarColumn: {
    flex: 1,
    gap: spacing[1],
  },
  criteriaPercentage: {
    fontFamily: fonts.semibold,
    fontSize: fs(13),
    color: colors['on-surface-variant'],
    letterSpacing: -0.3,
    textAlign: 'center',
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
  coachingBtn: {
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors['surface-container-lowest'],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(95,94,94,0.15)',
  },
  coachingBtnText: {
    fontFamily: fonts.medium,
    fontSize: fs(14),
    letterSpacing: 0.5,
    color: colors.primary,
  },

  // Share modal
  shareOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareModal: {
    alignItems: 'center',
    gap: spacing[4],
  },
  shareActions: {
    flexDirection: 'row',
    gap: spacing[3],
    alignItems: 'center',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: radius.full,
  },
  shareBtnText: {
    fontFamily: fonts.semibold,
    fontSize: fs(14),
    color: colors['on-primary'],
  },
  shareClose: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  shareCloseText: {
    fontFamily: fonts.medium,
    fontSize: fs(14),
    color: '#AAAAAA',
  },
});
