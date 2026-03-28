import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, radius, shadows, spacing, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import Icon from '@/components/ui/Icon';
import { getDebateCoaching } from '@/services/api';
import type { CoachArgument, MissedArgument } from '@/services/api';

// ─── Components ──────────────────────────────────────────────────────────────

function ArgumentCard({
  argument,
  index,
  onUpgrade,
}: {
  argument: CoachArgument & { id: string; isUnlocked: boolean };
  index: number;
  onUpgrade: () => void;
}) {
  const { colors, isDark, typography, fs } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  return (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(400)}>
      <View style={styles.argumentCard}>
        <View style={styles.argumentHeader}>
          <View style={[styles.impactBadge, argument.scoreImpact <= -10 && styles.impactBadgeSevere]}>
            <Icon name="alert-triangle" size={10} color={colors['accent-user']} />
            <Text style={styles.impactText}>{argument.scoreImpact} pts</Text>
          </View>
          <View style={styles.criterionBadgeContainer}>
            <Icon name="scale" size={10} color={colors['on-surface-variant']} />
            <Text style={styles.criterionBadgeText}>{argument.criterion}</Text>
          </View>
        </View>

        <Text style={styles.userQuote}>« {argument.userText} »</Text>
        <Text style={styles.verdictText}>{argument.aiVerdict}</Text>

        {argument.isUnlocked ? (
          <View style={styles.suggestionBox}>
            <View style={styles.suggestionHeader}>
              <Icon name="verified-check" size={12} color={colors.primary} />
              <Text style={styles.suggestionLabel}>CE QUE TU AURAIS DÛ DIRE</Text>
            </View>
            <Text style={styles.suggestionText}>{argument.suggestion}</Text>
          </View>
        ) : (
          <Pressable onPress={onUpgrade} accessibilityRole="button">
            <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={styles.lockedOverlay}>
              <Icon name="crown" size={16} color={colors.primary} />
              <Text style={styles.lockedText}>Débloquer avec Pro</Text>
            </BlurView>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

function MissedArgumentCard({
  argument,
  index,
  onUpgrade,
}: {
  argument: MissedArgument & { id: string; isUnlocked: boolean };
  index: number;
  onUpgrade: () => void;
}) {
  const { colors, isDark, typography, fs } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  return (
    <Animated.View entering={FadeInDown.delay(300 + index * 80).duration(400)}>
      <View style={styles.missedCard}>
        <View style={styles.missedTitleRow}>
          <Icon name="fire" size={14} color={colors['accent-user']} />
          <Text style={styles.missedTitle}>{argument.title}</Text>
        </View>

        {argument.isUnlocked ? (
          <Text style={styles.missedBody}>{argument.fullText}</Text>
        ) : (
          <Pressable onPress={onUpgrade} accessibilityRole="button">
            <Text style={styles.missedPreview} numberOfLines={2}>{argument.fullText}</Text>
            <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.missedBlur}>
              <Icon name="crown" size={14} color={colors.primary} />
              <Text style={styles.lockedText}>Voir l'argument complet</Text>
            </BlurView>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function CoachScreen() {
  const { colors, isDark, typography, fs } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [isLoading, setIsLoading] = useState(true);
  const [userArguments, setUserArguments] = useState<(CoachArgument & { id: string; isUnlocked: boolean })[]>([]);
  const [missedArguments, setMissedArguments] = useState<(MissedArgument & { id: string; isUnlocked: boolean })[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await getDebateCoaching(id);
        setUserArguments(
          data.user_arguments.map((a, i) => ({
            ...a,
            id: `arg-${i}`,
            isUnlocked: i === 0, // First argument is free, rest behind paywall
          }))
        );
        setMissedArguments(
          data.missed_arguments.map((a, i) => ({
            ...a,
            id: `missed-${i}`,
            isUnlocked: i < 2, // First 2 are free
          }))
        );
      } catch (e: any) {
        console.error('Failed to load coaching:', e.message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  const freeAnalyzed = userArguments.filter((a) => a.isUnlocked).length;
  const totalAnalyzed = userArguments.length;
  const freeMissed = missedArguments.filter((a) => a.isUnlocked).length;
  const totalMissed = missedArguments.length;

  const handleUpgrade = useCallback(() => {
    router.push('/paywall');
  }, [router]);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8} accessibilityRole="button">
          <Icon name="chevron-left" size={22} color={colors['on-surface']} />
        </Pressable>
        <Text style={styles.headerTitle}>Coach IA</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1 — Revois tes erreurs */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLabelRow}>
            <Icon name="alert-triangle" size={12} color={colors.outline} />
            <Text style={styles.sectionLabel}>REVOIS TES ERREURS</Text>
          </View>
          <Text style={styles.sectionCount}>{freeAnalyzed}/{totalAnalyzed}</Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          L'IA analyse chacun de tes arguments et te montre ce que tu aurais dû dire.
        </Text>

        {isLoading ? (
          <View style={{ marginTop: spacing[6], alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.sectionSubtitle, { marginTop: spacing[4], textAlign: 'center' }]}>
              L'IA analyse tes arguments...
            </Text>
          </View>
        ) : (
          <>
            {userArguments.map((arg, i) => (
              <ArgumentCard key={arg.id} argument={arg} index={i} onUpgrade={handleUpgrade} />
            ))}

            {/* Section 2 — Arguments manqués */}
            <View style={[styles.sectionHeader, { marginTop: spacing[8] }]}>
              <View style={styles.sectionLabelRow}>
                <Icon name="fire" size={12} color={colors.outline} />
                <Text style={styles.sectionLabel}>ARGUMENTS MANQUÉS</Text>
              </View>
              <Text style={styles.sectionCount}>{freeMissed}/{totalMissed}</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              {totalMissed} arguments que tu n'as pas pensé à utiliser.
            </Text>

            {missedArguments.map((arg, i) => (
              <MissedArgumentCard key={arg.id} argument={arg} index={i} onUpgrade={handleUpgrade} />
            ))}
          </>
        )}
      </ScrollView>

      {/* Floating CTA */}
      <View style={[styles.floatingCta, { paddingBottom: insets.bottom + spacing[4] }]}>
        <Pressable onPress={handleUpgrade} accessibilityRole="button">
          <LinearGradient
            colors={[colors.primary, colors['primary-dim']]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.ctaButton}
          >
            <Icon name="crown" size={16} color={colors['on-primary']} />
            <Text style={styles.ctaText}>
              Débloquer tout — {totalAnalyzed - freeAnalyzed + totalMissed - freeMissed} restantes
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}


// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (colors: ColorTokens, typography: any, fs: (n: number) => number) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
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
  headerTitle: {
    fontFamily: fonts.semibold,
    fontSize: fs(16),
    color: colors['on-surface'],
    letterSpacing: -0.2,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  sectionLabel: {
    ...typography['label-md'],
    color: colors.outline,
  },
  sectionCount: {
    fontFamily: fonts.semibold,
    fontSize: fs(12),
    color: colors['on-surface-variant'],
  },
  sectionSubtitle: {
    ...typography['body-sm'],
    color: colors['on-surface-variant'],
    marginBottom: spacing[4],
  },

  // Argument card (Section 1)
  argumentCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['2xl'],
    padding: spacing[5],
    marginBottom: spacing[3],
    ...shadows.ambient,
  },
  argumentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  impactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors['accent-user-container'],
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
  },
  impactBadgeSevere: {
    backgroundColor: 'rgba(159,64,61,0.15)',
  },
  impactText: {
    fontFamily: fonts.semibold,
    fontSize: fs(11),
    color: colors['accent-user'],
  },
  criterionBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors['surface-container-high'],
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
  },
  criterionBadgeText: {
    fontFamily: fonts.medium,
    fontSize: fs(11),
    color: colors['on-surface-variant'],
  },
  userQuote: {
    fontFamily: fonts.regular,
    fontSize: fs(15),
    fontStyle: 'italic',
    lineHeight: fs(22),
    color: colors['on-surface'],
    marginBottom: spacing[2],
  },
  verdictText: {
    fontFamily: fonts.semibold,
    fontSize: fs(13),
    color: colors.error,
    marginBottom: spacing[3],
  },
  suggestionBox: {
    backgroundColor: colors['surface-container-low'],
    borderRadius: radius.lg,
    padding: spacing[4],
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginBottom: spacing[2],
  },
  suggestionLabel: {
    ...typography['label-sm'],
    color: colors.primary,
  },
  suggestionText: {
    fontFamily: fonts.regular,
    fontSize: fs(14),
    lineHeight: fs(22),
    color: colors['on-surface'],
  },

  // Locked overlay
  lockedOverlay: {
    borderRadius: radius.lg,
    padding: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    overflow: 'hidden',
    backgroundColor: colors.glass,
  },
  lockedText: {
    fontFamily: fonts.medium,
    fontSize: fs(13),
    color: colors.primary,
  },

  // Missed argument cards (Section 2)
  missedCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['2xl'],
    padding: spacing[5],
    marginBottom: spacing[3],
    ...shadows.ambient,
  },
  missedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  missedTitle: {
    fontFamily: fonts.semibold,
    fontSize: fs(15),
    color: colors['on-surface'],
  },
  missedBody: {
    fontFamily: fonts.regular,
    fontSize: fs(14),
    lineHeight: fs(22),
    color: colors['on-surface-variant'],
  },
  missedPreview: {
    fontFamily: fonts.regular,
    fontSize: fs(14),
    lineHeight: fs(22),
    color: colors['on-surface-variant'],
    marginBottom: spacing[2],
  },
  missedBlur: {
    borderRadius: radius.lg,
    padding: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    overflow: 'hidden',
    backgroundColor: colors.glass,
  },

  // Floating CTA
  floatingCta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    backgroundColor: colors.glass,
  },
  ctaButton: {
    height: 52,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    ...shadows.ambient,
  },
  ctaText: {
    fontFamily: fonts.semibold,
    fontSize: fs(14),
    color: colors['on-primary'],
    letterSpacing: 0.3,
  },
});
