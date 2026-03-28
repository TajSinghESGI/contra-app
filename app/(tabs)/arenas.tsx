import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Platform,
  StyleSheet,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { LegendList } from '@legendapp/list';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import AnimatedInputBar from '@/components/ui/AnimatedInputBar';
import { Shimmer, ShimmerGroup } from '@/components/ui/Shimmer';
import Dropdown from '@/components/ui/Dropdown';
import Icon from '@/components/ui/Icon';
import { fonts, radius, shadows, spacing, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { LiveDot } from '@/components/shared/LiveDot';
import { useAuthStore } from '@/store/authStore';
import { useTopicStore } from '@/store/topicStore';
import { HEADER_HEIGHT } from '@/components/ui/AnimatedHeaderScrollView/conf';

// ─── Types ────────────────────────────────────────────────────────────────────

type Difficulty = 'easy' | 'medium' | 'hard' | 'brutal';

interface Arena {
  id: string;
  title: string;
  description: string;
  category: string;
  isLive: boolean;
  participants: number;
  difficulty: Difficulty;
  timestamp: string;
  avatarColors: string[];
}

// ─── Data derived from topic catalog ──────────────────────────────────────────

const DIFFICULTIES = ['easy', 'medium', 'hard', 'easy', 'medium', 'brutal'] as const;
const AVATAR_PALETTES = [
  ['#d3dbdf', '#dde3e7', '#e4e9ec'],
  ['#e5e2e1', '#e4e9ec', '#dde3e7'],
  ['#e3e1ec', '#dde3e7', '#e4e9ec'],
  ['#d3dbdf', '#e5e2e1', '#e3e1ec'],
  ['#dde3e7', '#e4e9ec', '#d3dbdf'],
  ['#e4e9ec', '#e3e1ec', '#dde3e7'],
];
const TIMESTAMPS = ['2 min', '8 min', '34 min', '1 h', '3 h', '5 min'];

function buildArenas(topics: any[]): Arena[] {
  return topics.map((topic: any, i: number) => ({
    id: topic.id,
    title: topic.question,
    description: topic.description,
    category: topic.category_label ?? topic.category,
    difficulty: DIFFICULTIES[i % DIFFICULTIES.length],
    participants: topic.participant_count || 50 + ((i * 73 + 17) % 450),
    isLive: i % 5 === 0,
    timestamp: TIMESTAMPS[i % TIMESTAMPS.length],
    avatarColors: AVATAR_PALETTES[i % AVATAR_PALETTES.length],
  }));
}

const buildDifficultyFilters = (t: TFunction): { key: Difficulty | 'all'; label: string }[] => [
  { key: 'all', label: t('arenas.difficultyFilter.all') },
  { key: 'easy', label: t('arenas.difficultyFilter.easy') },
  { key: 'medium', label: t('arenas.difficultyFilter.medium') },
  { key: 'hard', label: t('arenas.difficultyFilter.hard') },
  { key: 'brutal', label: t('arenas.difficultyFilter.brutal') },
];

const getDifficultyConfig = (colors: ColorTokens, t: TFunction): Record<Difficulty, { bg: string; text: string; label: string }> => ({
  easy:   { bg: '#e3f9e5', text: '#1e7e34', label: t('difficulty.easy') },
  medium: { bg: '#fff3cd', text: '#856404', label: t('difficulty.medium') },
  hard:   { bg: '#ffe0dd', text: colors.error, label: t('difficulty.hard') },
  brutal: { bg: colors['on-surface'], text: colors['on-primary'], label: t('difficulty.brutal') },
});

// ─── Sub-components ───────────────────────────────────────────────────────────

function ArenaCard({ arena, onPress }: { arena: Arena; onPress: () => void }) {
  const { colors, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const diff = getDifficultyConfig(colors, t)[arena.difficulty];

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [
      styles.card,
      pressed && styles.cardPressed,
    ]}>
      <View style={styles.cardTopRow}>
        <View style={styles.badgeRow}>
          {arena.isLive && (
            <View style={styles.liveBadge}>
              <LiveDot />
              <Text style={styles.liveText}>{t('common.live')}</Text>
            </View>
          )}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{arena.category}</Text>
          </View>
        </View>
        <Text style={styles.timestamp}>{arena.timestamp}</Text>
      </View>

      <Text style={styles.cardTitle}>{arena.title}</Text>
      <Text style={styles.cardDescription} numberOfLines={2}>
        {arena.description}
      </Text>

      <View style={styles.cardBottomRow}>
        <View style={styles.participantsRow}>
          <View style={styles.avatarStack}>
            {arena.avatarColors.map((bg, i) => (
              <View
                key={i}
                style={[
                  styles.stackAvatar,
                  { backgroundColor: bg, marginLeft: i === 0 ? 0 : -6 },
                ]}
              />
            ))}
          </View>
          <Text style={styles.participantsText}>
            {t('common.participants', { count: arena.participants })}
          </Text>
        </View>

        <View style={styles.rightActions}>
          <View style={[styles.diffBadge, { backgroundColor: diff.bg }]}>
            <Text style={[styles.diffText, { color: diff.text }]}>
              {diff.label}
            </Text>
          </View>
          <View style={styles.joinButton}>
            <Text style={styles.joinText}>{t('arenas.join')}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ArenasScreen() {
  const { colors, isDark, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { topics, isLoading, fetchTopics } = useTopicStore();

  const difficultyFilters = useMemo(() => buildDifficultyFilters(t), [t]);

  const selectedDifficultyLabel =
    difficultyFilters.find((f) => f.key === activeDifficulty)?.label ?? t('arenas.difficultyFilter.all');

  useEffect(() => {
    fetchTopics();
  }, []);

  const arenas = useMemo(() => buildArenas(topics), [topics]);

  const filteredArenas = arenas.filter((arena: Arena) => {
    const matchesDifficulty =
      activeDifficulty === 'all' || arena.difficulty === activeDifficulty;

    const matchesSearch =
      searchQuery.trim() === '' ||
      arena.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      arena.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDifficulty && matchesSearch;
  });

  const defaultDifficulty = useAuthStore((s) => s.user?.default_difficulty) ?? 'medium';

  const handleArenaPress = useCallback((arena: Arena) => {
    router.push({
      pathname: '/debate/new',
      params: { topic: arena.title, topicId: arena.id, difficulty: defaultDifficulty },
    });
  }, [router, defaultDifficulty]);

  const renderArena = useCallback(({ item }: { item: Arena }) => (
    <ArenaCard arena={item} onPress={() => handleArenaPress(item)} />
  ), [handleArenaPress]);

  // ─── Scroll-driven header animations ─────────────────────────────────────
  const scrollY = useSharedValue(0);
  const fixedHeaderHeight = HEADER_HEIGHT + insets.top;

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.value = event.nativeEvent.contentOffset.y;
  }, []);

  const largeTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 60], [1, 0], Extrapolation.CLAMP),
  }));

  const smallHeaderStyle = useAnimatedStyle(() => ({
    opacity: withTiming(
      interpolate(scrollY.value, [40, 80], [0, 1], Extrapolation.CLAMP),
      { duration: 600 },
    ),
    transform: [{
      translateY: withTiming(
        interpolate(scrollY.value, [40, 80], [20, 0], Extrapolation.CLAMP),
        { duration: 600 },
      ),
    }],
  }));

  const smallHeaderSubtitleStyle = useAnimatedStyle(() => {
    const shouldShow = scrollY.value > 100;
    return {
      opacity: withSpring(shouldShow ? 0.5 : 0, { damping: 18, stiffness: 120, mass: 1.2 }),
      transform: [{ translateY: withTiming(shouldShow ? 0 : 10, { duration: 900 }) }],
    };
  });

  const headerBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 80], [0, 1], Extrapolation.CLAMP),
  }));

  const blurTint = isDark
    ? (Platform.OS === 'ios' ? 'systemThickMaterialDark' : 'dark')
    : (Platform.OS === 'ios' ? 'systemThickMaterialLight' : 'light');

  // ─── List header (large title + search) ──────────────────────────────────
  const ListHeader = useMemo(() => (
    <View style={{ paddingTop: insets.top + spacing[4], paddingBottom: spacing[2] }}>
      <Animated.View style={largeTitleStyle}>
        <Text style={styles.screenTitle}>{t('arenas.title')}</Text>
        <Text style={styles.screenSubtitle}>
          {t('arenas.subtitle')} · {t('arenas.arenaCount', { count: filteredArenas.length })}
        </Text>
      </Animated.View>
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrapper}>
          <AnimatedInputBar
            placeholders={[
              t('arenas.searchPlaceholder'),
              t('arenas.searchPlaceholder2'),
              t('arenas.searchPlaceholder3'),
            ]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
        <Dropdown>
          <Dropdown.Trigger>
            <View style={styles.filterTrigger}>
              <Text style={styles.filterTriggerText}>{selectedDifficultyLabel}</Text>
              <Icon name="chevron-down" size={14} color={colors['on-surface-variant']} />
            </View>
          </Dropdown.Trigger>
          <Dropdown.Content>
            {difficultyFilters.map((filter) => (
              <Dropdown.Item
                key={filter.key}
                onPress={() => setActiveDifficulty(filter.key)}
              >
                <Text
                  style={[
                    styles.filterItemText,
                    activeDifficulty === filter.key && styles.filterItemTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </Dropdown.Item>
            ))}
          </Dropdown.Content>
        </Dropdown>
      </View>
    </View>
  ), [insets.top, styles, searchQuery, selectedDifficultyLabel, colors, activeDifficulty, filteredArenas.length, largeTitleStyle, t, difficultyFilters]);

  if (isLoading) {
    return (
      <View style={styles.root}>
        <View style={{ paddingTop: insets.top + spacing[4], paddingHorizontal: spacing[4] }}>
          <Text style={styles.screenTitle}>{t('arenas.title')}</Text>
          <ShimmerGroup isLoading>
            {[1, 2, 3].map((i) => (
              <Shimmer key={i} style={{ height: 120, borderRadius: 24, marginBottom: 12, marginTop: i === 1 ? spacing[4] : 0 }} />
            ))}
          </ShimmerGroup>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* ── Fixed collapsed header (glassmorphism) ── */}
      <Animated.View
        style={[styles.headerBgContainer, { height: fixedHeaderHeight + 50 }, headerBgStyle]}
        pointerEvents="none"
      >
        <BlurView
          intensity={10}
          tint={blurTint}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.fixedHeader,
          { paddingTop: insets.top, height: fixedHeaderHeight },
          smallHeaderStyle,
        ]}
        pointerEvents="none"
      >
        <Text style={styles.smallHeaderTitle}>{t('arenas.title')}</Text>
        <Animated.Text style={[styles.smallHeaderSubtitle, smallHeaderSubtitleStyle]}>
          {t('arenas.subtitle')}
        </Animated.Text>
      </Animated.View>

      {/* ── Content ── */}
      {filteredArenas.length === 0 ? (
        <>
          {ListHeader}
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t('arenas.noResults')}</Text>
            <Text style={styles.emptySubtitle}>{t('arenas.noResultsSub')}</Text>
          </View>
        </>
      ) : (
        <LegendList
          data={filteredArenas}
          keyExtractor={(item) => item.id}
          renderItem={renderArena}
          estimatedItemSize={180}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (colors: ColorTokens, typography: any, fs: (n: number) => number) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBgContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 11,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: spacing[2],
  },
  smallHeaderTitle: {
    fontFamily: fonts.bold,
    fontSize: fs(24),
    color: colors['on-surface'],
    textAlign: 'center',
  },
  smallHeaderSubtitle: {
    fontFamily: fonts.regular,
    fontSize: fs(12),
    color: colors['on-surface-variant'],
    textAlign: 'center',
  },
  screenTitle: {
    ...typography['headline-lg'],
    color: colors['on-surface'],
    paddingHorizontal: spacing[4],
  },
  screenSubtitle: {
    ...typography['body-sm'],
    color: colors['on-surface-variant'],
    paddingHorizontal: spacing[4],
    marginTop: spacing[1],
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: 120,
  },
  searchRow: {
    marginTop: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[2],
  },
  searchInputWrapper: {
    flex: 1,
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
  filterTriggerText: {
    fontFamily: fonts.medium,
    fontSize: fs(13),
    color: colors['on-surface-variant'],
  },
  filterItemText: {
    fontFamily: fonts.regular,
    fontSize: fs(14),
    color: colors['on-surface'],
  },
  filterItemTextActive: {
    fontFamily: fonts.semibold,
    color: colors.primary,
  },

  arenaListContainer: {
    marginTop: spacing[4],
  },

  card: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: 24,
    padding: spacing[5],
    marginBottom: spacing[3],
    ...shadows.ambient,
  },
  cardPressed: {
    opacity: 0.92,
  },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#e8fdf0',
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  liveText: {
    fontFamily: fonts.semibold,
    fontSize: fs(10),
    color: '#34C759',
  },
  categoryBadge: {
    backgroundColor: colors['surface-container-low'],
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  categoryText: {
    fontFamily: fonts.medium,
    fontSize: fs(10),
    color: colors['on-surface-variant'],
  },
  timestamp: {
    fontFamily: fonts.regular,
    fontSize: fs(11),
    color: colors['outline-variant'],
  },

  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: fs(17),
    letterSpacing: -0.2,
    color: colors['on-surface'],
    marginTop: spacing[3],
    lineHeight: fs(24),
  },
  cardDescription: {
    fontFamily: fonts.regular,
    fontSize: fs(13),
    color: colors['on-surface-variant'],
    lineHeight: fs(20),
    marginTop: 6,
  },

  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flex: 1,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors['surface-container-lowest'],
  },
  participantsText: {
    fontFamily: fonts.regular,
    fontSize: fs(12),
    color: colors['on-surface-variant'],
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  diffBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  diffText: {
    fontFamily: fonts.semibold,
    fontSize: fs(10),
  },
  joinButton: {
    backgroundColor: colors['surface-container-high'],
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  joinText: {
    fontFamily: fonts.semibold,
    fontSize: fs(12),
    color: colors['on-surface'],
  },

  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: spacing[2],
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: fs(17),
    color: colors['on-surface'],
    letterSpacing: -0.2,
  },
  emptySubtitle: {
    ...typography['body-sm'],
    color: colors['on-surface-variant'],
    textAlign: 'center',
  },
});
