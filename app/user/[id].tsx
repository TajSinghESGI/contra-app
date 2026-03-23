import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Icon from '@/components/ui/Icon';
import { useBottomSheet } from '@/components/ui/BottomSheetStack';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useToast } from '@/components/ui/Toast';
import { useFriendStore } from '@/store/friendStore';
import { TOPICS } from '@/constants/topics';
import { DIFFICULTY_LEVELS, fonts, radius, shadows, spacing, typography, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { getPublicProfile, type Friend, type PublicProfile, type PublicProfileDebate } from '@/services/api';

// ─── Score chip ─────────────────────────────────────────────────────────────────

function ResultChip({ result }: { result: 'win' | 'loss' }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isWin = result === 'win';
  return (
    <View style={[styles.resultChip, isWin ? styles.chipWin : styles.chipLoss]}>
      <Text style={[styles.resultChipText, isWin ? styles.chipTextWin : styles.chipTextLoss]}>
        {isWin ? t('challenge.victory') : t('challenge.defeat')}
      </Text>
    </View>
  );
}

// ─── Challenge sheet (owns its own state so it works inside present()) ────────

function ChallengeSheet({ friend, onSend }: { friend: Friend; onSend: (topic: string, label: string, diff: string) => void }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedTopicLabel, setSelectedTopicLabel] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');

  const topicChoices = TOPICS.slice(0, 8);

  return (
    <View style={styles.sheetContent}>
      <Text style={styles.sheetTitle}>{t('challenge.chooseTopic')}</Text>

      <View style={styles.topicChipsRow}>
        {topicChoices.map((t) => {
          const isActive = selectedTopic === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={[styles.topicChip, isActive && styles.topicChipActive]}
              onPress={() => { setSelectedTopic(t.id); setSelectedTopicLabel(t.label); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.topicChipText, isActive && styles.topicChipTextActive]}>
                {t.icon} {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sheetSubtitle}>{t('friends.difficultyTitle')}</Text>
      <View style={styles.difficultyRow}>
        {DIFFICULTY_LEVELS.map((level) => {
          const isActive = selectedDifficulty === level.id;
          return (
            <TouchableOpacity
              key={level.id}
              style={[styles.diffPill, isActive && styles.diffPillActive]}
              onPress={() => setSelectedDifficulty(level.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.diffPillText, isActive && styles.diffPillTextActive]}>
                {level.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Pressable
        style={{ opacity: selectedTopic ? 1 : 0.4 }}
        disabled={!selectedTopic}
        onPress={() => {
          if (selectedTopic) {
            const topic = topicChoices.find((t) => t.id === selectedTopic);
            onSend(topic?.question ?? selectedTopicLabel, selectedTopicLabel, selectedDifficulty);
          }
        }}
      >
        <LinearGradient
          colors={[colors.primary, colors['primary-dim']]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.sheetCta}
        >
          <Text style={styles.sheetCtaText}>{t('challenge.sendChallenge')}</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────────

export default function UserProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { present, dismiss } = useBottomSheet();
  const sendChallenge = useFriendStore((s) => s.sendChallenge);
  const toast = useToast();

  const { id: userId } = useLocalSearchParams<{ id: string }>();

  const [profileData, setProfileData] = useState<PublicProfile | null>(null);

  useEffect(() => {
    if (!userId) return;
    getPublicProfile(userId)
      .then(setProfileData)
      .catch(() => {});
  }, [userId]);

  const name = profileData?.user.name ?? 'Utilisateur';
  const score = profileData?.user.score ?? 0;
  const rank = profileData?.user.rank ?? 0;
  const title = profileData?.user.title ?? 'Débatteur';
  const initial = profileData?.user.initial ?? '?';
  const recentDebates: PublicProfileDebate[] = profileData?.recent_debates ?? [];
  const strengths: string[] = profileData?.strengths ?? [];

  const friendData: Friend = useMemo(() => ({
    id: userId ?? `user-${name}`,
    name,
    initial,
    avatarBg: colors['surface-container-high'],
    level: title,
    score,
  }), [userId, name, initial, title, score, colors]);

  const handleChallengeSend = useCallback((topic: string, label: string, diff: string) => {
    sendChallenge(friendData, topic, label, diff);
    dismiss();
    toast.show(t('friends.sent'));
  }, [friendData, sendChallenge, dismiss, toast]);

  const handleChallenge = useCallback(() => {
    present(
      <BottomSheet
        snapPoints={['75%']}
        enableBackdrop
        dismissOnBackdropPress
        dismissOnSwipeDown
        backgroundColor={colors['surface-container-lowest']}
      >
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          <ChallengeSheet friend={friendData} onSend={handleChallengeSend} />
        </ScrollView>
      </BottomSheet>
    );
  }, [present, colors, friendData, handleChallengeSend]);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8} accessibilityRole="button">
          <Icon name="chevron-left" size={22} color={colors['on-surface']} />
        </Pressable>
        <Text style={styles.headerLabel}>{t('userProfile.headerLabel')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile hero */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
          <Text style={styles.userName}>{name}</Text>
          <Text style={styles.userTitle}>{title}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{score}</Text>
              <Text style={styles.statLabel}>{t('userProfile.score')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>#{rank}</Text>
              <Text style={styles.statLabel}>{t('userProfile.ranking')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{recentDebates.filter((d) => d.result === 'win').length}/{recentDebates.length}</Text>
              <Text style={styles.statLabel}>{t('userProfile.victories')}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Strengths */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)}>
          <Text style={styles.sectionLabel}>{t('userProfile.strengths')}</Text>
          <View style={styles.strengthRow}>
            {strengths.map((s) => (
              <View key={s} style={styles.strengthPill}>
                <Text style={styles.strengthText}>{s}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Recent debates */}
        <Animated.View entering={FadeInDown.delay(160).duration(400)}>
          <Text style={styles.sectionLabel}>{t('userProfile.recentDebates')}</Text>
          <View style={styles.debatesCard}>
            {recentDebates.map((debate, i) => (
              <View key={debate.id} style={[styles.debateRow, i < recentDebates.length - 1 && styles.debateRowBorder]}>
                <Text style={styles.debateTopic} numberOfLines={1}>{debate.topic}</Text>
                <View style={styles.debateRight}>
                  <Text style={styles.debateScore}>{debate.score}</Text>
                  <ResultChip result={debate.result} />
                </View>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Challenge CTA */}
      <View style={[styles.ctaArea, { paddingBottom: Math.max(insets.bottom, spacing[5]) }]}>
        <Pressable onPress={handleChallenge} style={styles.ctaWrapper} accessibilityRole="button">
          <LinearGradient
            colors={[colors.primary, colors['primary-dim']]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.ctaGradient}
          >
            <Icon name="verified-check" size={16} color={colors['on-primary']} />
            <Text style={styles.ctaText}>{t('userProfile.sendChallenge')}</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────────

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

  profileCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['3xl'],
    padding: spacing[6],
    alignItems: 'center',
    marginBottom: spacing[6],
    ...shadows.ambient,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors['surface-container-high'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  avatarInitial: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors['on-surface'],
  },
  userName: {
    fontFamily: fonts.bold,
    fontSize: 22,
    letterSpacing: -0.3,
    color: colors['on-surface'],
  },
  userTitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors['on-surface-variant'],
    marginTop: spacing[1],
    marginBottom: spacing[5],
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center', gap: 2 },
  statValue: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors['on-surface'],
    letterSpacing: -0.5,
  },
  statLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors['on-surface-variant'],
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors['surface-container-high'],
  },

  sectionLabel: {
    ...typography['label-sm'],
    color: colors.outline,
    marginBottom: spacing[3],
  },

  strengthRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[5],
    flexWrap: 'wrap',
  },
  strengthPill: {
    backgroundColor: colors['surface-container-low'],
    borderRadius: radius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  strengthText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors['on-surface'],
  },

  debatesCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['2xl'],
    marginBottom: spacing[6],
    ...shadows.ambient,
    overflow: 'hidden',
  },
  debateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: 14,
    gap: spacing[3],
  },
  debateRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors['surface-container-low'],
  },
  debateTopic: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors['on-surface'],
  },
  debateRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  debateScore: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors['on-surface'],
    letterSpacing: -0.3,
  },
  resultChip: {
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
  },
  chipWin:  { backgroundColor: '#e3f9e5' },
  chipLoss: { backgroundColor: '#ffe0dd' },
  resultChipText: { fontFamily: fonts.semibold, fontSize: 10 },
  chipTextWin:  { color: '#1e7e34' },
  chipTextLoss: { color: colors.error },

  ctaArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    backgroundColor: colors.background,
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
    height: 52,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  ctaText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors['on-primary'],
    letterSpacing: 0.5,
  },

  // ── Challenge sheet styles ──
  sheetContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
    paddingBottom: spacing[10],
    gap: spacing[4],
  },
  sheetTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    letterSpacing: -0.3,
    color: colors['on-surface'],
  },
  sheetSubtitle: {
    ...typography['label-md'],
    color: colors.outline,
  },
  topicChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  topicChip: {
    backgroundColor: colors['surface-container-low'],
    borderRadius: radius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  topicChipActive: {
    backgroundColor: colors.primary,
  },
  topicChipText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors['on-surface'],
  },
  topicChipTextActive: {
    color: colors['on-primary'],
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  diffPill: {
    flex: 1,
    backgroundColor: colors['surface-container-low'],
    borderRadius: radius.full,
    paddingVertical: spacing[2],
    alignItems: 'center',
  },
  diffPillActive: {
    backgroundColor: colors.primary,
  },
  diffPillText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors['on-surface'],
  },
  diffPillTextActive: {
    color: colors['on-primary'],
  },
  sheetCta: {
    height: 52,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCtaText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors['on-primary'],
    letterSpacing: 0.5,
  },
});

