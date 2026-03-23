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
import Icon from '@/components/ui/Icon';
import { fonts, radius, shadows, spacing, typography, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { LiveDot } from '@/components/shared/LiveDot';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Difficulty = 'easy' | 'medium' | 'hard' | 'brutal';

const getDifficultyConfig = (colors: ColorTokens, t: (key: string) => string): Record<Difficulty, { bg: string; text: string; label: string }> => ({
  easy:   { bg: '#e3f9e5', text: '#1e7e34',          label: t('difficulty.easy') },
  medium: { bg: '#fff3cd', text: '#856404',           label: t('difficulty.medium') },
  hard:   { bg: '#ffe0dd', text: colors.error,        label: t('difficulty.hard') },
  brutal: { bg: colors['on-surface'], text: colors['on-primary'], label: t('difficulty.brutal') },
});

const SAMPLE_ARGUMENTS = [
  { id: '1', side: 'pour',   text: "L'automatisation libère l'humain des tâches répétitives." },
  { id: '2', side: 'contre', text: "Des millions d'emplois ne seront pas remplacés assez vite." },
  { id: '3', side: 'pour',   text: 'Les nouvelles technologies créent toujours plus de postes.' },
  { id: '4', side: 'contre', text: "Les inégalités économiques vont s'aggraver massivement." },
];

// ─── Argument row ───────────────────────────────────────────────────────────────

function ArgumentRow({ text, side }: { text: string; side: string }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isPour = side === 'pour';
  return (
    <View style={styles.argRow}>
      <View style={[styles.argSidePill, isPour ? styles.argSidePour : styles.argSideContre]}>
        <Text style={[styles.argSideText, isPour ? styles.argSideTextPour : styles.argSideTextContre]}>
          {isPour ? t('common.for') : t('common.against')}
        </Text>
      </View>
      <Text style={styles.argText} numberOfLines={3}>{text}</Text>
    </View>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────────

export default function ArenaDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const DIFFICULTY_CONFIG = useMemo(() => getDifficultyConfig(colors, t), [colors, t]);
  const {
    id,
    title      = t('arena.topic'),
    description = '',
    category   = '',
    difficulty = 'medium',
    participants = '0',
    isLive     = 'false',
  } = useLocalSearchParams<{
    id: string;
    title: string;
    description: string;
    category: string;
    difficulty: Difficulty;
    participants: string;
    isLive: string;
  }>();

  const diff = DIFFICULTY_CONFIG[difficulty as Difficulty] ?? DIFFICULTY_CONFIG.medium;
  const live = isLive === 'true';
  const participantCount = parseInt(participants, 10);

  const handleJoin = () => {
    router.push({
      pathname: '/debate/new',
      params: { topic: title, difficulty },
    });
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8} accessibilityRole="button">
          <Icon name="chevron-left" size={22} color={colors['on-surface']} />
        </Pressable>
        <Text style={styles.headerCategory}>{category.toUpperCase()}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Topic card */}
        <View style={styles.topicCard}>
          <View style={styles.topicMeta}>
            {live && (
              <View style={styles.liveBadge}>
                <LiveDot />
                <Text style={styles.liveText}>{t('common.live')}</Text>
              </View>
            )}
            <View style={[styles.diffBadge, { backgroundColor: diff.bg }]}>
              <Text style={[styles.diffText, { color: diff.text }]}>{diff.label}</Text>
            </View>
          </View>

          <Text style={styles.topicTitle}>{title}</Text>

          {description ? (
            <Text style={styles.topicDescription}>{description}</Text>
          ) : null}

          <View style={styles.participantsRow}>
            <Icon name="user" size={14} color={colors['on-surface-variant']} />
            <Text style={styles.participantsText}>
              {t('common.participants', { count: participantCount })}
            </Text>
          </View>
        </View>

        {/* Trending arguments */}
        <Text style={styles.sectionLabel}>{t('arena.trendingArguments')}</Text>
        <View style={styles.argumentsCard}>
          {SAMPLE_ARGUMENTS.map((arg) => (
            <ArgumentRow key={arg.id} text={arg.text} side={arg.side} />
          ))}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>62%</Text>
            <Text style={styles.statLabel}>{t('common.for')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>38%</Text>
            <Text style={styles.statLabel}>{t('common.against')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>71</Text>
            <Text style={styles.statLabel}>{t('arena.avgScore')}</Text>
          </View>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={[styles.ctaArea, { paddingBottom: Math.max(insets.bottom, spacing[5]) }]}>
        <Pressable
          onPress={handleJoin}
          style={styles.ctaWrapper}
          accessibilityRole="button"
        >
          <LinearGradient
            colors={[colors.primary, colors['primary-dim']]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>{t('arena.joinDebate')}</Text>
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
    backgroundColor: colors.background,
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
  headerCategory: {
    ...typography['label-md'],
    color: colors.outline,
  },

  content: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
  },

  topicCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['3xl'],
    padding: spacing[5],
    marginBottom: spacing[5],
    ...shadows.ambient,
  },
  topicMeta: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[4],
    flexWrap: 'wrap',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#e8fdf0',
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: 4,
  },
  liveText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: '#1e7e34',
    letterSpacing: 0.5,
  },
  diffBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: 4,
  },
  diffText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  topicTitle: {
    fontFamily: fonts.light,
    fontSize: 26,
    letterSpacing: -0.5,
    color: colors['on-surface'],
    lineHeight: 34,
    marginBottom: spacing[3],
  },
  topicDescription: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 24,
    color: colors['on-surface-variant'],
    marginBottom: spacing[4],
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  participantsText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors['on-surface-variant'],
  },

  sectionLabel: {
    ...typography['label-sm'],
    color: colors.outline,
    marginBottom: spacing[3],
  },
  argumentsCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['2xl'],
    padding: spacing[4],
    gap: spacing[4],
    marginBottom: spacing[5],
    ...shadows.ambient,
  },
  argRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  argSidePill: {
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    minWidth: 52,
    alignItems: 'center',
    marginTop: 2,
  },
  argSidePour:   { backgroundColor: '#e3f9e5' },
  argSideContre: { backgroundColor: '#ffe0dd' },
  argSideText: { fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 0.3 },
  argSideTextPour:   { color: '#1e7e34' },
  argSideTextContre: { color: colors.error },
  argText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors['on-surface'],
  },

  statsRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  statCard: {
    flex: 1,
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius.xl,
    padding: spacing[4],
    alignItems: 'center',
    ...shadows.ambient,
  },
  statValue: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors['on-surface'],
    letterSpacing: -0.5,
  },
  statLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors['on-surface-variant'],
    marginTop: 2,
  },

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
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors['on-primary'],
    letterSpacing: 0.5,
  },
});

