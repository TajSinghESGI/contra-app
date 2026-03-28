import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Icon from '@/components/ui/Icon';
import { fonts, radius, shadows, spacing, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useFriendStore } from '@/store/friendStore';
import { useAuthStore } from '@/store/authStore';

const ILLUSTRATIONS = {
  won: require('@/assets/illustration/won.png'),
  lost: require('@/assets/illustration/lost.png'),
  tie: require('@/assets/illustration/tie.png'),
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ChallengeDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const { id } = useLocalSearchParams<{ id: string }>();

  const challenges = useFriendStore((s) => s.challenges);
  const acceptChallenge = useFriendStore((s) => s.acceptChallenge);
  const declineChallenge = useFriendStore((s) => s.declineChallenge);
  const currentUserId = useAuthStore((s) => s.user?.id);

  const challenge = challenges.find((c) => c.id === id);

  if (!challenge) {
    return (
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Icon name="chevron-left" size={22} color={colors['on-surface']} />
          </Pressable>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('challenge.notFound')}</Text>
        </View>
      </View>
    );
  }

  const isRecipient = challenge.to.id === currentUserId;
  const isPending = challenge.status === 'pending';
  const isAccepted = challenge.status === 'accepted';
  const isCompleted = challenge.status === 'completed';
  const opponent = isRecipient ? challenge.from : challenge.to;
  const isMyTurn = challenge.whose_turn_id === currentUserId;
  const roundsPerPlayer = Math.floor((challenge.max_turns ?? 6) / 2);

  const handleAccept = () => acceptChallenge(challenge.id);
  const handleDecline = () => { declineChallenge(challenge.id); router.back(); };
  const handleDebate = () => router.push(`/challenge/debate/${challenge.id}` as any);
  const handleViewResult = () => router.push(`/challenge/result/${challenge.id}` as any);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Icon name="chevron-left" size={22} color={colors['on-surface']} />
        </Pressable>
        <Text style={styles.headerLabel}>{t('challenge.title')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── VS Inline ── */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.vsInline}>
          <UserAvatar size={44} initial={challenge.from.initial} avatarBg={challenge.from.avatarBg} avatarUrl={challenge.from.avatarUrl} />
          <View style={styles.vsInlineCenter}>
            <Text style={styles.vsInlineNames} numberOfLines={1}>
              {challenge.from.name.split(' ')[0]} vs {challenge.to.name.split(' ')[0]}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.metaPill}>
                <Text style={styles.metaPillText}>
                  {roundsPerPlayer} {roundsPerPlayer > 1 ? 'rounds' : 'round'}
                </Text>
              </View>
              {isAccepted && (
                <View style={styles.turnPill}>
                  <Text style={styles.turnPillText}>
                    {challenge.current_turn ?? 0}/{challenge.max_turns ?? 6}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <UserAvatar size={44} initial={challenge.to.initial} avatarBg={challenge.to.avatarBg} avatarUrl={challenge.to.avatarUrl} />
        </Animated.View>

        {/* ── Topic Card ── */}
        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.topicCard}>
          <Text style={styles.topicLabel}>{t('challenge.proposition')}</Text>
          <Text style={styles.topicText}>{challenge.topic}</Text>
          {challenge.created_at ? (
            <Text style={styles.metaDate}>{formatDate(challenge.created_at)}</Text>
          ) : null}
        </Animated.View>

        {/* ── Turn indicator (accepted) ── */}
        {isAccepted && (
          <Animated.View entering={FadeInDown.delay(120).duration(400)}
            style={[styles.turnBanner, isMyTurn ? styles.turnBannerActive : styles.turnBannerWaiting]}
          >
            <Text style={styles.turnText}>
              {isMyTurn
                ? `🟢 ${t('challenge.yourTurn')}`
                : `⏳ ${t('challenge.waitingFor', { name: opponent.name.split(' ')[0] })}`
              }
            </Text>
          </Animated.View>
        )}

        {/* ── Result card (completed) ── */}
        {isCompleted && (() => {
          const fromS = challenge.from_score ?? 0;
          const toS = challenge.to_score ?? 0;
          const iAmFrom = challenge.from.id === currentUserId;
          const iWon = (iAmFrom && fromS > toS) || (!iAmFrom && toS > fromS);
          const iLost = (iAmFrom && toS > fromS) || (!iAmFrom && fromS > toS);
          const illustration = iWon ? ILLUSTRATIONS.won : iLost ? ILLUSTRATIONS.lost : ILLUSTRATIONS.tie;
          return (
            <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.resultCard}>
              <Image source={illustration} style={styles.resultIllustration} resizeMode="contain" />
              <View style={styles.scoresRow}>
                <View style={styles.scoreCol}>
                  <Text style={styles.scoreOwner}>{challenge.from.name.split(' ')[0]}</Text>
                  <Text style={[
                    styles.scoreLarge,
                    fromS > toS && styles.scoreWinner,
                    fromS < toS && styles.scoreLoser,
                  ]}>{challenge.from_score ?? '-'}</Text>
                </View>
                <Text style={styles.scoreSep}>—</Text>
                <View style={styles.scoreCol}>
                  <Text style={styles.scoreOwner}>{challenge.to.name.split(' ')[0]}</Text>
                  <Text style={[
                    styles.scoreLarge,
                    toS > fromS && styles.scoreWinner,
                    toS < fromS && styles.scoreLoser,
                  ]}>{challenge.to_score ?? '-'}</Text>
                </View>
              </View>
            </Animated.View>
          );
        })()}

        {/* ── Actions ── */}
        <Animated.View entering={FadeInDown.delay(160).duration(400)}>
          {isPending && isRecipient && (
            <View style={styles.actionSection}>
              <Pressable onPress={handleAccept} style={styles.ctaWrapper}>
                <LinearGradient
                  colors={[colors.primary, colors['primary-dim']]}
                  start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                  style={styles.ctaGradient}
                >
                  <Text style={styles.ctaText}>{t('challenge.accept')}</Text>
                </LinearGradient>
              </Pressable>
              <Pressable onPress={handleDecline} style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>{t('challenge.decline')}</Text>
              </Pressable>
            </View>
          )}

          {isPending && !isRecipient && (
            <View style={styles.waitingSection}>
              <Text style={styles.waitingText}>{t('challenge.waiting')}</Text>
            </View>
          )}

          {isAccepted && (
            <Pressable onPress={handleDebate} style={styles.ctaWrapper}>
              <LinearGradient
                colors={[colors.primary, colors['primary-dim']]}
                start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                style={styles.ctaGradient}
              >
                <Text style={styles.ctaText}>
                  {isMyTurn ? t('challenge.debateNow') : t('challenge.viewResults')}
                </Text>
              </LinearGradient>
            </Pressable>
          )}

          {isCompleted && (
            <Pressable onPress={handleViewResult} style={styles.ctaWrapper}>
              <LinearGradient
                colors={[colors.primary, colors['primary-dim']]}
                start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                style={styles.ctaGradient}
              >
                <Text style={styles.ctaText}>{t('challenge.viewDetail')}</Text>
              </LinearGradient>
            </Pressable>
          )}
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
    gap: spacing[3],
  },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontFamily: fonts.regular, fontSize: fs(15), color: colors['on-surface-variant'] },

  // VS inline row
  vsInline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['2xl'],
    padding: spacing[4],
    gap: spacing[3],
    ...shadows.ambient,
  },
  avatarSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmallText: {
    fontFamily: fonts.bold,
    fontSize: fs(17),
    color: colors['on-surface'],
  },
  vsInlineCenter: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[2],
  },
  vsInlineNames: {
    fontFamily: fonts.bold,
    fontSize: fs(15),
    color: colors['on-surface'],
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  metaPill: {
    backgroundColor: colors['surface-container-high'],
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
  },
  metaPillText: {
    fontFamily: fonts.semibold,
    fontSize: fs(11),
    color: colors['on-surface-variant'],
  },
  turnPill: {
    backgroundColor: 'rgba(52,199,89,0.12)',
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
  },
  turnPillText: {
    fontFamily: fonts.semibold,
    fontSize: fs(11),
    color: '#34C759',
  },
  metaDate: {
    fontFamily: fonts.regular,
    fontSize: fs(12),
    color: colors['outline-variant'],
  },

  // Topic card
  topicCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['2xl'],
    padding: spacing[5],
    ...shadows.ambient,
  },
  topicLabel: {
    ...typography['label-sm'],
    color: colors.outline,
    marginBottom: spacing[2],
  },
  topicText: {
    fontFamily: fonts.bold,
    fontSize: fs(20),
    letterSpacing: -0.3,
    lineHeight: fs(28),
    color: colors['on-surface'],
    marginBottom: spacing[3],
  },

  // Turn banner
  turnBanner: {
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderRadius: radius.full,
  },
  turnBannerActive: {
    backgroundColor: 'rgba(52,199,89,0.1)',
  },
  turnBannerWaiting: {
    backgroundColor: colors['surface-container-low'],
  },
  turnText: {
    fontFamily: fonts.medium,
    fontSize: fs(14),
    color: colors['on-surface'],
  },

  // Actions
  actionSection: {
    gap: spacing[3],
  },
  ctaWrapper: {
    borderRadius: radius.full,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 3,
  },
  ctaGradient: {
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: fonts.semibold,
    fontSize: fs(15),
    color: colors['on-primary'],
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors['surface-container-low'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontFamily: fonts.medium,
    fontSize: fs(14),
    color: colors['on-surface-variant'],
  },
  waitingSection: {
    alignItems: 'center',
    paddingVertical: spacing[5],
  },
  waitingText: {
    fontFamily: fonts.regular,
    fontSize: fs(15),
    color: colors['on-surface-variant'],
  },

  // Result card
  resultCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['2xl'],
    padding: spacing[5],
    alignItems: 'center',
    ...shadows.ambient,
  },
  resultIllustration: {
    width: 56,
    height: 56,
    marginBottom: spacing[3],
  },
  scoresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
  },
  scoreCol: {
    alignItems: 'center',
    gap: spacing[1],
  },
  scoreOwner: {
    fontFamily: fonts.semibold,
    fontSize: fs(12),
    color: colors['on-surface-variant'],
  },
  scoreLarge: {
    fontFamily: fonts.bold,
    fontSize: fs(36),
    color: colors['on-surface-variant'],
    letterSpacing: -1.5,
  },
  scoreWinner: {
    color: '#34C759',
  },
  scoreLoser: {
    color: colors['outline-variant'],
  },
  scoreSep: {
    fontFamily: fonts.light,
    fontSize: fs(24),
    color: colors['outline-variant'],
    marginTop: spacing[4],
  },
});
