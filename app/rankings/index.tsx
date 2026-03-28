import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Animated,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Icon from '@/components/ui/Icon';
import Dropdown from '@/components/ui/Dropdown';
import { Shimmer, ShimmerGroup } from '@/components/ui/Shimmer';
import { useRouter } from 'expo-router';
import { fonts, radius, shadows, spacing, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { SpectralWave } from '@/components/shared/SpectralWave';
import { getGlobalRankings, getFriendsRankings, type RankingEntry as APIRankingEntry } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type TrendDirection = 'up' | 'down' | 'neutral';

interface RankingEntry {
  id: string;
  rank: number;
  initial: string;
  avatarBg: string;
  name: string;
  title: string;
  score: number;
  trend: TrendDirection;
  isCurrentUser?: boolean;
}

// ─── Helper to map API data to UI shape ───────────────────────────────────────

const AVATAR_COLORS = ['#e5e2e1', '#e3e1ec', '#eeedf7', '#e4e9ec', '#dde3e7', '#d3dbdf', '#ebeef0'];

function mapApiRanking(entry: APIRankingEntry, currentUserId: string | undefined): RankingEntry {
  return {
    id: entry.userId,
    rank: entry.rank,
    initial: entry.displayName.charAt(0).toUpperCase(),
    avatarBg: AVATAR_COLORS[(entry.rank - 1) % AVATAR_COLORS.length],
    name: entry.displayName,
    title: entry.title,
    score: entry.score,
    trend: entry.trend === 'stable' ? 'neutral' : entry.trend,
    isCurrentUser: entry.userId === currentUserId,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TrendArrow({ direction }: { direction: TrendDirection }) {
  const { colors, typography, fs } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  if (direction === 'neutral') {
    return <Text style={styles.trendNeutral}>—</Text>;
  }
  return (
    <Ionicons
      name={direction === 'up' ? 'trending-up' : 'trending-down'}
      size={14}
      color={direction === 'up' ? '#34C759' : colors.error}
    />
  );
}

function RankingRow({ entry, onPress }: { entry: RankingEntry; onPress: () => void }) {
  const { colors, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const [pressed, setPressed] = useState(false);

  const isTop3 = entry.rank <= 3;
  const rankNumStyle = isTop3 ? styles.rankNumLarge : styles.rankNumSmall;
  const avatarSize = isTop3 ? 44 : 36;
  const avatarRadius = avatarSize / 2;
  const rankLabel = String(entry.rank).padStart(2, '0');

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.rankRow,
        entry.isCurrentUser && styles.rankRowCurrentUser,
        pressed && !entry.isCurrentUser && styles.rankRowPressed,
      ]}
    >
      <Text style={rankNumStyle}>{rankLabel}</Text>

      <View
        style={[
          styles.rankAvatar,
          { width: avatarSize, height: avatarSize, borderRadius: avatarRadius, backgroundColor: entry.avatarBg },
          entry.rank === 1 && styles.rankAvatarFirst,
        ]}
      >
        <Text style={[styles.rankAvatarInitial, isTop3 && styles.rankAvatarInitialLarge]}>
          {entry.initial}
        </Text>
      </View>

      <View style={styles.rankInfo}>
        <Text style={[styles.rankName, isTop3 && styles.rankNameBold]}>
          {entry.name}
          {entry.isCurrentUser && <Text style={styles.youLabel}> ({t('challenge.you').toLowerCase()})</Text>}
        </Text>
        <Text style={styles.rankTitle}>{entry.title}</Text>
      </View>

      <View style={styles.rankScoreBlock}>
        <Text style={[styles.rankScore, isTop3 && styles.rankScoreBold]}>
          {entry.score.toLocaleString('fr-FR')}
        </Text>
        <View style={styles.trendContainer}>
          <TrendArrow direction={entry.trend} />
        </View>
      </View>
    </Pressable>
  );
}

function AnimatedGradientButton({ onPress }: { onPress: () => void }) {
  const { colors, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const scale = useRef(new Animated.Value(1)).current;
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const CTA_WAVE_COLORS: [string, string, string] = [
    colors.primary,
    colors['outline-variant'],
    colors['primary-dim'],
  ];

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLayout={(e) => setDims({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
      accessibilityRole="button"
    >
      <Animated.View style={[{ transform: [{ scale }] }, styles.boostCtaShadow]}>
        {dims.width > 0 ? (
          <SpectralWave
            asChild
            width={dims.width}
            height={dims.height}
            borderRadius={radius.full}
            colors={CTA_WAVE_COLORS}
            timeScale={0.5}
            brightness={0.85}
          >
            <Text style={styles.boostCtaText}>{t('rankings.debate')}</Text>
          </SpectralWave>
        ) : (
          <View style={styles.boostCtaPlaceholder} />
        )}
      </Animated.View>
    </Pressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

type TabKey = 'global' | 'friends';

export default function RankingsScreen() {
  const router = useRouter();
  const { colors, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const [activeTab, setActiveTab] = useState<TabKey>('global');
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const [globalRankings, setGlobalRankings] = useState<RankingEntry[]>([]);
  const [friendsRankings, setFriendsRankings] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const [globalData, friendsData] = await Promise.all([
          getGlobalRankings(),
          getFriendsRankings(),
        ]);
        if (!cancelled) {
          // Derive a simple userId to mark current user
          const currentUserId = useAuthStore.getState().user?.id;
          setGlobalRankings(globalData.map((e) => mapApiRanking(e, currentUserId)));
          setFriendsRankings(friendsData.map((e) => mapApiRanking(e, currentUserId)));
        }
      } catch (err) {
        console.error('Failed to load rankings:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const data = activeTab === 'global' ? globalRankings : friendsRankings;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Icon name="chevron-left" size={22} color={colors['on-surface']} />
        </Pressable>

        <Text style={styles.headerLabel}>{t('rankings.headerLabel')}</Text>
        <Text style={styles.headerTitle}>{t('rankings.title')}</Text>

        <View style={styles.toggleRow}>
          {(['global', 'friends'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.togglePill, isActive && styles.togglePillActive]}
              >
                <Text style={[styles.togglePillText, isActive && styles.togglePillTextActive]}>
                  {tab === 'global' ? t('rankings.global') : t('rankings.friends')}
                </Text>
              </Pressable>
            );
          })}

          <Dropdown>
            <Dropdown.Trigger>
              <View style={styles.filterTrigger}>
                <Text style={styles.filterText}>{t(`rankings.periods.${selectedPeriod}`)}</Text>
                <Icon name="chevron-down" size={14} color={colors['on-surface-variant']} />
              </View>
            </Dropdown.Trigger>
            <Dropdown.Content>
              <Dropdown.Item onPress={() => setSelectedPeriod('week')}>
                <Text style={styles.filterItemText}>{t('rankings.periods.week')}</Text>
              </Dropdown.Item>
              <Dropdown.Item onPress={() => setSelectedPeriod('month')}>
                <Text style={styles.filterItemText}>{t('rankings.periods.month')}</Text>
              </Dropdown.Item>
              <Dropdown.Item onPress={() => setSelectedPeriod('all')}>
                <Text style={styles.filterItemText}>{t('rankings.periods.all')}</Text>
              </Dropdown.Item>
            </Dropdown.Content>
          </Dropdown>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ShimmerGroup isLoading>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Shimmer
                key={i}
                style={{
                  height: 52,
                  borderRadius: 12,
                  marginHorizontal: spacing[5],
                  marginBottom: spacing[2],
                }}
              />
            ))}
          </ShimmerGroup>
        ) : (
          data.map((entry: RankingEntry) => (
            <RankingRow
              key={entry.id}
              entry={entry}
              onPress={() => router.push({
                pathname: '/user/[id]',
                params: {
                  id: entry.id,
                  name: entry.name,
                  score: String(entry.score),
                  rank: String(entry.rank),
                  title: entry.title,
                  initial: entry.initial,
                },
              })}
            />
          ))
        )}
        <View style={{ height: 90 }} />
      </ScrollView>

      <View style={styles.stickyBar}>
        <Text style={styles.stickyBarText}>
          {t('rankings.improveScore')}{' '}
          <Text style={styles.stickyBarArrow}>→</Text>
        </Text>
        <AnimatedGradientButton onPress={() => router.push('/onboarding')} />
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (colors: ColorTokens, typography: any, fs: (n: number) => number) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    paddingTop: 56,
    paddingBottom: spacing[4],
    paddingHorizontal: spacing[5],
    backgroundColor: colors.background,
  },
  backButton: {
    marginBottom: spacing[4],
    alignSelf: 'flex-start',
  },
  headerLabel: {
    ...typography['label-sm'],
    color: colors.outline,
  },
  headerTitle: {
    ...typography['headline-lg'],
    color: colors['on-surface'],
    marginTop: spacing[1],
  },

  toggleRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[4],
  },
  togglePill: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[5],
    borderRadius: radius.full,
    backgroundColor: colors['surface-container-high'],
  },
  togglePillActive: {
    backgroundColor: colors.primary,
  },
  togglePillText: {
    fontFamily: fonts.medium,
    fontSize: fs(13),
    color: colors['on-surface-variant'],
  },
  togglePillTextActive: {
    fontFamily: fonts.semibold,
    color: colors['on-primary'],
  },

  filterTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors['surface-container-low'],
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  filterText: {
    fontFamily: fonts.medium,
    fontSize: fs(13),
    color: colors['on-surface-variant'],
  },
  filterItemText: {
    fontFamily: fonts.regular,
    fontSize: fs(14),
    color: colors['on-surface'],
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing[1],
  },

  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
  },
  rankRowCurrentUser: {
    backgroundColor: colors['surface-container-low'],
  },
  rankRowPressed: {
    backgroundColor: colors['surface-container-low'],
  },

  rankNumLarge: {
    fontFamily: fonts.light,
    fontSize: fs(16),
    fontStyle: 'italic',
    color: colors['outline-variant'],
    width: 28,
    textAlign: 'right',
  },
  rankNumSmall: {
    fontFamily: fonts.light,
    fontSize: fs(13),
    fontStyle: 'italic',
    color: colors['outline-variant'],
    width: 28,
    textAlign: 'right',
  },

  rankAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankAvatarFirst: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  rankAvatarInitial: {
    fontFamily: fonts.semibold,
    fontSize: fs(13),
    color: colors['on-surface'],
  },
  rankAvatarInitialLarge: {
    fontFamily: fonts.bold,
    fontSize: fs(16),
  },

  rankInfo: {
    flex: 1,
  },
  rankName: {
    fontFamily: fonts.medium,
    fontSize: fs(14),
    color: colors['on-surface'],
    lineHeight: fs(18),
  },
  rankNameBold: {
    fontFamily: fonts.bold,
  },
  rankTitle: {
    fontFamily: fonts.regular,
    fontSize: fs(11),
    color: colors['on-surface-variant'],
    marginTop: 1,
  },
  youLabel: {
    fontFamily: fonts.regular,
    fontSize: fs(11),
    color: colors['on-surface-variant'],
  },

  rankScoreBlock: {
    alignItems: 'flex-end',
    gap: 2,
  },
  rankScore: {
    fontFamily: fonts.semibold,
    fontSize: fs(14),
    color: colors['on-surface'],
  },
  rankScoreBold: {
    fontFamily: fonts.bold,
    fontSize: fs(15),
  },
  trendContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 16,
  },
  trendNeutral: {
    fontFamily: fonts.regular,
    fontSize: fs(12),
    color: colors['outline-variant'],
  },

  stickyBar: {
    position: 'absolute',
    bottom: spacing[6],
    left: spacing[5],
    right: spacing[5],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    borderRadius: radius.full,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors['glass-border'],
    ...shadows.float,
  },
  stickyBarText: {
    fontFamily: fonts.medium,
    fontSize: fs(14),
    color: colors['on-surface'],
  },
  stickyBarArrow: {
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  boostCtaShadow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 3,
  },
  boostCtaPlaceholder: {
    width: 112,
    height: 38,
    borderRadius: radius.full,
  },
  boostCtaText: {
    fontFamily: fonts.semibold,
    fontSize: fs(13),
    color: colors['on-primary'],
    letterSpacing: 0.5,
  },
});

