import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Icon from '@/components/ui/Icon';
import { DifficultyBadge } from '@/components/debate/DifficultyBadge';
import { fonts, radius, shadows, spacing, typography, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { useFriendStore } from '@/store/friendStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function AvatarColumn({
  initial,
  name,
  level,
  colors,
}: {
  initial: string;
  name: string;
  level: string;
  colors: ColorTokens;
}) {
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.avatarColumn}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarInitial}>{initial}</Text>
      </View>
      <Text style={styles.avatarName} numberOfLines={1}>{name}</Text>
      <Text style={styles.avatarLevel}>{level}</Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ChallengeDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();

  const challenges = useFriendStore((s) => s.challenges);
  const acceptChallenge = useFriendStore((s) => s.acceptChallenge);
  const declineChallenge = useFriendStore((s) => s.declineChallenge);

  const challenge = challenges.find((c) => c.id === id);

  if (!challenge) {
    return (
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8} accessibilityRole="button">
            <Icon name="chevron-left" size={22} color={colors['on-surface']} />
          </Pressable>
          <Text style={styles.headerLabel}>{t('challenge.title')}</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('challenge.notFound')}</Text>
        </View>
      </View>
    );
  }

  const isRecipient = challenge.to.id === 'me';
  const isPending = challenge.status === 'pending';
  const isAccepted = challenge.status === 'accepted';
  const isCompleted = challenge.status === 'completed';

  const handleAccept = () => {
    acceptChallenge(challenge.id);
  };

  const handleDecline = () => {
    declineChallenge(challenge.id);
    router.back();
  };

  const handleDebate = () => {
    router.push(`/challenge/debate/${challenge.id}` as any);
  };

  const handleViewResult = () => {
    router.push(`/challenge/result/${challenge.id}` as any);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8} accessibilityRole="button">
          <Icon name="chevron-left" size={22} color={colors['on-surface']} />
        </Pressable>
        <Text style={styles.headerLabel}>{t('challenge.title')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Topic & Difficulty */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.topicSection}>
          <Text style={styles.sectionLabel}>{t('challenge.proposition')}</Text>
          <Text style={styles.topicText}>{challenge.topic}</Text>
          <View style={styles.badgeRow}>
            <DifficultyBadge level={challenge.difficulty as any} />
            <Text style={styles.categoryText}>{challenge.topicLabel}</Text>
          </View>
        </Animated.View>

        {/* Versus Section */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.versusCard}>
          <AvatarColumn
            initial={challenge.from.initial}
            name={challenge.from.name}
            level={challenge.from.level}
            colors={colors}
          />
          <View style={styles.vsContainer}>
            <Text style={styles.vsText}>{t('challenge.vs')}</Text>
          </View>
          <AvatarColumn
            initial={challenge.to.initial}
            name={challenge.to.name}
            level={challenge.to.level}
            colors={colors}
          />
        </Animated.View>

        {/* Action Section */}
        <Animated.View entering={FadeInDown.delay(160).duration(400)}>
          {isPending && isRecipient && (
            <View style={styles.actionSection}>
              <Pressable onPress={handleAccept} style={styles.ctaWrapper} accessibilityRole="button">
                <LinearGradient
                  colors={[colors.primary, colors['primary-dim']]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.ctaGradient}
                >
                  <Text style={styles.ctaText}>{t('challenge.accept')}</Text>
                </LinearGradient>
              </Pressable>
              <Pressable onPress={handleDecline} style={styles.secondaryBtn} accessibilityRole="button">
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
            <View style={styles.actionSection}>
              <Pressable onPress={handleDebate} style={styles.ctaWrapper} accessibilityRole="button">
                <LinearGradient
                  colors={[colors.primary, colors['primary-dim']]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.ctaGradient}
                >
                  <Text style={styles.ctaText}>{t('challenge.debateNow')}</Text>
                </LinearGradient>
              </Pressable>
            </View>
          )}

          {isCompleted && (
            <View style={styles.completedSection}>
              <View style={styles.scoresRow}>
                <View style={styles.scoreColumn}>
                  <Text style={styles.scoreOwner}>{challenge.from.name.split(' ')[0]}</Text>
                  <Text style={[
                    styles.scoreLarge,
                    (challenge.fromScore ?? 0) >= (challenge.toScore ?? 0) && styles.scoreWinner,
                  ]}>
                    {challenge.fromScore}
                  </Text>
                </View>
                <Text style={styles.scoreSeparator}>-</Text>
                <View style={styles.scoreColumn}>
                  <Text style={styles.scoreOwner}>{challenge.to.name.split(' ')[0]}</Text>
                  <Text style={[
                    styles.scoreLarge,
                    (challenge.toScore ?? 0) >= (challenge.fromScore ?? 0) && styles.scoreWinner,
                  ]}>
                    {challenge.toScore}
                  </Text>
                </View>
              </View>
              <Text style={styles.verdictLabel}>
                {(challenge.fromScore ?? 0) > (challenge.toScore ?? 0)
                  ? t('challenge.wins', { name: challenge.from.name.split(' ')[0] })
                  : (challenge.toScore ?? 0) > (challenge.fromScore ?? 0)
                    ? t('challenge.wins', { name: challenge.to.name.split(' ')[0] })
                    : t('challenge.tie')}
              </Text>
              <Pressable onPress={handleViewResult} style={styles.viewResultBtn} accessibilityRole="button">
                <Text style={styles.viewResultText}>{t('challenge.viewDetail')}</Text>
                <Icon name="chevron-right" size={14} color={colors.primary} />
              </Pressable>
            </View>
          )}
        </Animated.View>

        {/* Info Card */}
        <Animated.View entering={FadeInDown.delay(240).duration(400)} style={styles.infoCard}>
          <Text style={styles.infoLabel}>{t('challenge.info')}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>{t('challenge.createdAt')}</Text>
            <Text style={styles.infoValue}>{formatDate(challenge.createdAt)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>{t('challenge.topic')}</Text>
            <Text style={styles.infoValue}>{challenge.topicLabel}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>{t('challenge.statusLabel')}</Text>
            <Text style={styles.infoValue}>
              {challenge.status === 'pending' && t('challenge.statuses.pending')}
              {challenge.status === 'accepted' && t('challenge.statuses.accepted')}
              {challenge.status === 'declined' && t('challenge.statuses.declined')}
              {challenge.status === 'completed' && t('challenge.statuses.completed')}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const createStyles = (colors: ColorTokens) => StyleSheet.create({
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
    fontSize: 15,
    color: colors['on-surface-variant'],
  },

  // Topic section
  topicSection: {
    marginBottom: spacing[5],
  },
  sectionLabel: {
    ...typography['label-sm'],
    color: colors.outline,
    marginBottom: spacing[2],
  },
  topicText: {
    ...typography['headline-sm'],
    color: colors['on-surface'],
    marginBottom: spacing[3],
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  categoryText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors['on-surface-variant'],
  },

  // Versus card
  versusCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['3xl'],
    padding: spacing[6],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[5],
    ...shadows.ambient,
  },
  avatarColumn: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[1],
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors['surface-container-high'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  avatarInitial: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors['on-surface'],
  },
  avatarName: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors['on-surface'],
    textAlign: 'center',
  },
  avatarLevel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors['on-surface-variant'],
    textAlign: 'center',
  },
  vsContainer: {
    paddingHorizontal: spacing[3],
  },
  vsText: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors['outline-variant'],
  },

  // Action buttons
  actionSection: {
    gap: spacing[3],
    marginBottom: spacing[5],
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
    fontFamily: fonts.medium,
    fontSize: 14,
    letterSpacing: 1,
    color: colors['on-primary'],
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
    fontSize: 14,
    letterSpacing: 0.5,
    color: colors['on-surface-variant'],
  },

  // Waiting state
  waitingSection: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    marginBottom: spacing[5],
  },
  waitingText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors['on-surface-variant'],
  },

  // Completed section
  completedSection: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['3xl'],
    padding: spacing[6],
    alignItems: 'center',
    marginBottom: spacing[5],
    ...shadows.ambient,
  },
  scoresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[5],
    marginBottom: spacing[3],
  },
  scoreColumn: {
    alignItems: 'center',
    gap: spacing[1],
  },
  scoreOwner: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors['on-surface-variant'],
  },
  scoreLarge: {
    fontFamily: fonts.thin,
    fontSize: 48,
    color: colors['on-surface-variant'],
    letterSpacing: -1.5,
  },
  scoreWinner: {
    color: colors.primary,
  },
  scoreSeparator: {
    fontFamily: fonts.light,
    fontSize: 32,
    color: colors['outline-variant'],
    marginTop: spacing[5],
  },
  verdictLabel: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors['on-surface'],
    marginBottom: spacing[4],
  },
  viewResultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  viewResultText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.primary,
  },

  // Info card
  infoCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['2xl'],
    padding: spacing[5],
    ...shadows.ambient,
  },
  infoLabel: {
    ...typography['label-sm'],
    color: colors.outline,
    marginBottom: spacing[4],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  infoKey: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors['on-surface-variant'],
  },
  infoValue: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors['on-surface'],
  },
});
