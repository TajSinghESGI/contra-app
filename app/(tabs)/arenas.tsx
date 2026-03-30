import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
  StyleSheet,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { LegendList } from '@legendapp/list';
import { useRouter, useFocusEffect } from 'expo-router';
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
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useBottomSheet } from '@/components/ui/BottomSheetStack';
import Icon from '@/components/ui/Icon';
import { Toast } from '@/components/ui/Toast';
import { fonts, radius, shadows, spacing, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { useBannerStore } from '@/store/bannerStore';
import { useAuthStore } from '@/store/authStore';
import { useTopicStore } from '@/store/topicStore';
import { HEADER_HEIGHT } from '@/components/ui/AnimatedHeaderScrollView/conf';
import type { Topic } from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type Difficulty = 'easy' | 'medium' | 'hard' | 'brutal';

const DIFFICULTY_KEYS: Difficulty[] = ['easy', 'medium', 'hard', 'brutal'];

const getDifficultyConfig = (colors: ColorTokens, isDark: boolean, t: TFunction): Record<Difficulty, { bg: string; text: string; label: string }> => ({
  easy:   { bg: isDark ? 'rgba(52,199,89,0.15)' : '#e3f9e5', text: isDark ? '#34C759' : '#1e7e34', label: t('difficulty.easy') },
  medium: { bg: isDark ? 'rgba(255,149,0,0.15)' : '#fff3cd', text: isDark ? '#FF9500' : '#856404', label: t('difficulty.medium') },
  hard:   { bg: isDark ? 'rgba(255,59,48,0.15)' : '#ffe0dd', text: isDark ? '#FF6961' : colors.error, label: t('difficulty.hard') },
  brutal: { bg: isDark ? 'rgba(175,82,222,0.15)' : colors['on-surface'], text: isDark ? '#AF52DE' : colors['on-primary'], label: t('difficulty.brutal') },
});

// ─── Sub-components ───────────────────────────────────────────────────────────

function TopicCard({ topic, difficulty, onPress }: { topic: Topic; difficulty: Difficulty; onPress: () => void }) {
  const { colors, isDark, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const diff = getDifficultyConfig(colors, isDark, t)[difficulty];

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [
      styles.card,
      pressed && styles.cardPressed,
    ]}>
      <View style={styles.cardTopRow}>
        <View style={styles.badgeRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{topic.category_label}</Text>
          </View>
          {topic.is_public && topic.created_by_name && (
            <View style={styles.creatorBadge}>
              <Icon name="user" size={10} color={colors.primary} />
              <Text style={styles.creatorText}>{topic.created_by_name}</Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.cardTitle}>{topic.question}</Text>
      <Text style={styles.cardDescription} numberOfLines={2}>
        {topic.description}
      </Text>

      <View style={styles.cardBottomRow}>
        <Text style={styles.participantsText}>
          {topic.participant_count > 0 ? t('common.participants', { count: topic.participant_count }) : ''}
        </Text>

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

// ─── Filter sheet content ─────────────────────────────────────────────────────

function FilterSheetContent({
  categories,
  initialCategoryIds,
  initialDifficulty,
  onConfirm,
}: {
  categories: { id: string; label: string; emoji: string }[];
  initialCategoryIds: string[];
  initialDifficulty: Difficulty | 'all';
  onConfirm: (categoryIds: string[], difficulty: Difficulty | 'all') => void;
}) {
  const { colors, isDark, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const diffConfig = useMemo(() => getDifficultyConfig(colors, isDark, t), [colors, isDark, t]);

  const [draftCategories, setDraftCategories] = useState<string[]>(initialCategoryIds);
  const [draftDifficulty, setDraftDifficulty] = useState(initialDifficulty);

  const toggleCategory = (id: string) => {
    setDraftCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
      <View style={styles.sheetContent}>
        {/* Categories */}
        <Text style={styles.sheetSectionTitle}>{t('arenas.filterCategories')}</Text>
        <View style={styles.sheetChipsWrap}>
          <Pressable
            onPress={() => setDraftCategories([])}
            style={[styles.sheetChip, draftCategories.length === 0 && styles.sheetChipActive]}
          >
            <Text style={[styles.sheetChipText, draftCategories.length === 0 && styles.sheetChipTextActive]}>
              {t('arenas.allCategories')}
            </Text>
          </Pressable>
          {categories.map((cat) => {
            const isSelected = draftCategories.includes(cat.id);
            return (
              <Pressable
                key={cat.id}
                onPress={() => toggleCategory(cat.id)}
                style={[styles.sheetChip, isSelected && styles.sheetChipActive]}
              >
                <Text style={[styles.sheetChipText, isSelected && styles.sheetChipTextActive]}>
                  {cat.emoji} {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Difficulty */}
        <Text style={[styles.sheetSectionTitle, { marginTop: spacing[5] }]}>{t('arenas.filterDifficulty')}</Text>
        <View style={styles.sheetChipsWrap}>
          <Pressable
            onPress={() => setDraftDifficulty('all')}
            style={[styles.sheetChip, draftDifficulty === 'all' && styles.sheetChipActive]}
          >
            <Text style={[styles.sheetChipText, draftDifficulty === 'all' && styles.sheetChipTextActive]}>
              {t('arenas.difficultyFilter.all')}
            </Text>
          </Pressable>
          {DIFFICULTY_KEYS.map((key) => (
            <Pressable
              key={key}
              onPress={() => setDraftDifficulty(key === draftDifficulty ? 'all' : key)}
              style={[
                styles.sheetChip,
                draftDifficulty === key && { backgroundColor: diffConfig[key].bg },
              ]}
            >
              <Text style={[
                styles.sheetChipText,
                draftDifficulty === key && { color: diffConfig[key].text, fontFamily: fonts.semibold },
              ]}>
                {diffConfig[key].label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Confirm button */}
        <Pressable
          onPress={() => onConfirm(draftCategories, draftDifficulty)}
          style={styles.sheetConfirmButton}
        >
          <Text style={styles.sheetConfirmText}>{t('common.confirm')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ArenasScreen() {
  const { colors, isDark, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { present, dismiss } = useBottomSheet();

  // Filters (applied)
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const {
    topics, categories, isLoading, isLoadingMore, hasMore, totalCount,
    fetchTopics, fetchNextPage, fetchCategories,
  } = useTopicStore();

  const defaultDifficulty = useAuthStore((s) => s.user?.default_difficulty) ?? 'medium';
  const activeDifficulty = selectedDifficulty === 'all' ? defaultDifficulty : selectedDifficulty;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch topics when filters change
  useEffect(() => {
    fetchTopics({
      category: selectedCategoryIds.length > 0 ? selectedCategoryIds.join(',') : undefined,
      search: debouncedSearch || undefined,
    });
  }, [selectedCategoryIds, debouncedSearch]);

  useFocusEffect(
    useCallback(() => { fetchCategories(); }, [])
  );

  // Active filter count for badge
  const activeFilterCount = selectedCategoryIds.length + (selectedDifficulty !== 'all' ? 1 : 0);

  const handleTopicPress = useCallback((topic: Topic) => {
    const { dailyUsed, dailyLimit } = useBannerStore.getState();
    if (dailyLimit !== null && dailyUsed >= dailyLimit) {
      Toast.show(t('home.dailyLimitReached'), {
        type: 'error',
        duration: 4000,
      });
      return;
    }
    router.push({
      pathname: '/debate/new',
      params: { topic: topic.question, topicId: topic.id, difficulty: activeDifficulty },
    });
  }, [router, activeDifficulty, t]);

  const renderTopic = useCallback(({ item }: { item: Topic }) => (
    <TopicCard topic={item} difficulty={activeDifficulty as Difficulty} onPress={() => handleTopicPress(item)} />
  ), [handleTopicPress, activeDifficulty]);

  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoadingMore) fetchNextPage();
  }, [hasMore, isLoadingMore, fetchNextPage]);

  // ─── Scroll-driven header animations ─────────────────────────────────────
  const scrollY = useSharedValue(0);
  const bannerExtra = useBannerStore.getState().visible ? 24 : 0;
  const fixedHeaderHeight = HEADER_HEIGHT + insets.top;

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    scrollY.value = y;
    useBannerStore.getState().setScrollY(y);
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

  const diffConfig = useMemo(() => getDifficultyConfig(colors, isDark, t), [colors, isDark, t]);

  const openFilterSheet = useCallback(() => {
    present(
      <BottomSheet
        snapPoints={['80%']}
        enableBackdrop
        dismissOnBackdropPress
        dismissOnSwipeDown
      >
        <FilterSheetContent
          categories={categories}
          initialCategoryIds={selectedCategoryIds}
          initialDifficulty={selectedDifficulty}
          onConfirm={(catIds, diff) => {
            setSelectedCategoryIds(catIds);
            setSelectedDifficulty(diff);
            dismiss();
          }}
        />
      </BottomSheet>
    );
  }, [present, dismiss, categories, selectedCategoryIds, selectedDifficulty]);

  // ─── List header ──────────────────────────────────────────────────────────
  const ListHeader = useMemo(() => (
    <View style={{ paddingTop: insets.top + spacing[4] + bannerExtra, paddingBottom: spacing[2] }}>
      <Animated.View style={largeTitleStyle}>
        <Text style={styles.screenTitle}>{t('arenas.title')}</Text>
        <Text style={styles.screenSubtitle}>
          {t('arenas.subtitle')} · {t('arenas.arenaCount', { count: totalCount })}
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
        <Pressable onPress={openFilterSheet} style={styles.filterTrigger}>
          <Icon name="settings-gear-filled" size={16} color={colors['on-surface-variant']} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  ), [insets.top, styles, searchQuery, colors, totalCount, largeTitleStyle, t, activeFilterCount, bannerExtra]);

  // ─── List footer (loading more) ───────────────────────────────────────────
  const ListFooter = useMemo(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={{ paddingVertical: spacing[6], alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors['on-surface-variant']} />
      </View>
    );
  }, [isLoadingMore, colors]);

  if (isLoading) {
    return (
      <View style={styles.root}>
        <View style={{ paddingTop: insets.top + spacing[4] + bannerExtra, paddingHorizontal: spacing[4] }}>
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
          { paddingTop: insets.top, height: HEADER_HEIGHT + insets.top },
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
      {topics.length === 0 && !isLoading ? (
        <>
          {ListHeader}
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t('arenas.noResults')}</Text>
            <Text style={styles.emptySubtitle}>{t('arenas.noResultsSub')}</Text>
          </View>
        </>
      ) : (
        <LegendList
          data={topics}
          keyExtractor={(item) => item.id}
          renderItem={renderTopic}
          estimatedItemSize={180}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
        />
      )}

      {/* Filter BottomSheet is presented via useBottomSheet().present() */}
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
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors['surface-container-low'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.primary,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors['on-primary'],
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
  creatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors['surface-container-low'],
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  creatorText: {
    fontFamily: fonts.medium,
    fontSize: fs(10),
    color: colors.primary,
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

  // BottomSheet
  sheetContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    paddingBottom: 120,
  },
  sheetSectionTitle: {
    fontFamily: fonts.bold,
    fontSize: fs(13),
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.outline,
    marginBottom: spacing[3],
  },
  sheetChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  sheetChip: {
    backgroundColor: colors['surface-container-low'],
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: 8,
  },
  sheetChipActive: {
    backgroundColor: colors['on-surface'],
  },
  sheetChipText: {
    fontFamily: fonts.medium,
    fontSize: fs(13),
    color: colors['on-surface-variant'],
  },
  sheetChipTextActive: {
    color: colors.background,
  },
  sheetConfirmButton: {
    marginTop: spacing[6],
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 52,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  sheetConfirmText: {
    fontFamily: fonts.semibold,
    fontSize: fs(15),
    color: colors['on-primary'],
    letterSpacing: 0.5,
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
