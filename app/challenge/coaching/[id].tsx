import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Icon from '@/components/ui/Icon';
import { Shimmer, ShimmerGroup } from '@/components/ui/Shimmer';
import { fonts, radius, shadows, spacing, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { getChallengeCoaching, type ChallengeCoaching } from '@/services/api';

export default function ChallengeCoachingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, typography, fs } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [coaching, setCoaching] = useState<ChallengeCoaching | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getChallengeCoaching(id)
      .then((data) => {
        setCoaching(data);
        setIsLoading(false);
      })
      .catch(() => {
        setError(true);
        setIsLoading(false);
      });
  }, [id]);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8} accessibilityRole="button">
          <Icon name="chevron-left" size={22} color={colors['on-surface']} />
        </Pressable>
        <Text style={styles.headerLabel}>COACHING IA</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <View style={styles.shimmerContainer}>
          <ShimmerGroup isLoading>
            <Shimmer style={{ height: 180, borderRadius: radius['3xl'], marginBottom: spacing[4] }} />
            <Shimmer style={{ height: 180, borderRadius: radius['3xl'], marginBottom: spacing[4] }} />
            <Shimmer style={{ height: 100, borderRadius: radius['3xl'] }} />
          </ShimmerGroup>
        </View>
      ) : error || !coaching ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Coaching indisponible pour le moment.</Text>
          <Pressable onPress={() => router.back()} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retour</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[8] }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Strengths */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.card}>
            <Text style={styles.cardTitle}>TES POINTS FORTS</Text>
            {coaching.strengths.map((s, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={styles.bulletIcon}>+</Text>
                <Text style={styles.bulletText}>{s}</Text>
              </View>
            ))}
          </Animated.View>

          {/* Improvements */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.card}>
            <Text style={styles.cardTitle}>AXES D'AMELIORATION</Text>
            {coaching.improvements.map((s, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={styles.bulletIcon}>-</Text>
                <Text style={styles.bulletText}>{s}</Text>
              </View>
            ))}
          </Animated.View>

          {/* Tip */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.tipCard}>
            <Text style={styles.tipLabel}>CONSEIL</Text>
            <Text style={styles.tipText}>{coaching.tip}</Text>
          </Animated.View>
        </ScrollView>
      )}
    </View>
  );
}

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
    gap: spacing[4],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
  },
  shimmerContainer: {
    flex: 1,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: fs(15),
    color: colors['on-surface-variant'],
  },
  retryBtn: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: radius.full,
    backgroundColor: colors['surface-container-high'],
  },
  retryBtnText: {
    fontFamily: fonts.medium,
    fontSize: fs(14),
    color: colors['on-surface-variant'],
  },
  card: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['3xl'],
    padding: spacing[6],
    ...shadows.ambient,
  },
  cardTitle: {
    ...typography['label-sm'],
    color: colors.outline,
    marginBottom: spacing[4],
  },
  bulletRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  bulletIcon: {
    fontFamily: fonts.bold,
    fontSize: fs(16),
    color: colors.primary,
    width: 20,
    textAlign: 'center',
  },
  bulletText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fs(15),
    lineHeight: fs(22),
    color: colors['on-surface'],
  },
  tipCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['3xl'],
    padding: spacing[6],
    borderWidth: 1,
    borderColor: 'rgba(95,94,94,0.10)',
    ...shadows.ambient,
  },
  tipLabel: {
    ...typography['label-sm'],
    color: colors.primary,
    marginBottom: spacing[3],
  },
  tipText: {
    fontFamily: fonts.medium,
    fontSize: fs(16),
    lineHeight: fs(24),
    color: colors['on-surface'],
  },
});
