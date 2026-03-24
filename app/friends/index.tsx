import { BottomSheet } from '@/components/ui/BottomSheet';
import { useBottomSheet } from '@/components/ui/BottomSheetStack';
import Icon from '@/components/ui/Icon';
import { Toast } from '@/components/ui/Toast';
import { DIFFICULTY_LEVELS, fonts, radius, shadows, spacing, typography, type ColorTokens } from '@/constants/tokens';
import { TOPICS, CATEGORIES } from '@/constants/topics';
import { useTheme } from '@/hooks/useTheme';
import type { Challenge, Friend } from '@/services/api';
import { useFriendStore } from '@/store/friendStore';
import { Ionicons } from '@expo/vector-icons';
import { LegendList } from '@legendapp/list';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// ─── Challenge sheet ─────────────────────────────────────────────────────────

function ChallengeSheet({ friend, onSend }: { friend: Friend; onSend: (topic: string, label: string, diff: string) => void }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [sheetStep, setSheetStep] = useState<'category' | 'topic' | 'difficulty'>('category');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<{ question: string; label: string } | null>(null);
  const [customTopic, setCustomTopic] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('easy');

  const resolvedTopic = customTopic.trim()
    ? { question: customTopic.trim(), label: t('onboarding.customTopicValue') }
    : selectedTopic;

  // 3 topics for selected category
  const catTopics = useMemo(() => {
    if (!selectedCategory) return [];
    const all = TOPICS.filter((t) => t.category === selectedCategory);
    return all.slice(0, 3);
  }, [selectedCategory]);

  // ── Step 1: Category ──
  if (sheetStep === 'category') {
    return (
      <View style={styles.sheetContent}>
        <Text style={styles.sheetTitle}>{t('friends.challengeUser', { name: friend.name.split(' ')[0] })}</Text>

        <View style={styles.sheetCustomRow}>
          <TextInput
            style={styles.sheetCustomInput}
            value={customTopic}
            onChangeText={(text) => { setCustomTopic(text); if (text.trim()) setSelectedTopic(null); }}
            placeholder={t('friends.ownTopic')}
            placeholderTextColor={colors['outline-variant']}
            returnKeyType="go"
            onSubmitEditing={() => { if (customTopic.trim()) setSheetStep('difficulty'); }}
          />
          {!!customTopic.trim() && (
            <Pressable style={styles.sheetCustomBtn} onPress={() => setSheetStep('difficulty')}>
              <Icon name="arrow-right" size={14} color={colors['on-primary']} />
            </Pressable>
          )}
        </View>

        <Text style={styles.sheetOrDivider}>{t('friends.orChooseCategory')}</Text>

        <View style={styles.sheetChipGrid}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedCategory(cat.id);
                setSheetStep('topic');
              }}
              style={styles.sheetChip}
            >
              <Text style={styles.sheetChipEmoji}>{cat.emoji}</Text>
              <Text style={styles.sheetChipText}>{cat.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  // ── Step 2: Topic (3 cards) ──
  if (sheetStep === 'topic') {
    const catMeta = CATEGORIES.find((c) => c.id === selectedCategory);
    return (
      <View style={styles.sheetContent}>
        <Pressable onPress={() => setSheetStep('category')} style={styles.sheetBackRow}>
          <Icon name="chevron-left" size={18} color={colors['on-surface']} />
          <Text style={styles.sheetBackText}>{t('friends.categories')}</Text>
        </Pressable>
        <Text style={styles.sheetTitle}>{catMeta?.emoji} {catMeta?.label}</Text>

        <View style={styles.sheetTopicCards}>
          {catTopics.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setCustomTopic('');
                setSelectedTopic({ question: t.question, label: t.label });
                setSheetStep('difficulty');
              }}
              style={styles.sheetTopicCard}
            >
              <Text style={styles.sheetTopicIcon}>{t.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTopicTitle}>{t.label}</Text>
                <Text style={styles.sheetTopicDesc} numberOfLines={2}>{t.description}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  // ── Step 3: Difficulty ──
  return (
    <View style={styles.sheetContent}>
      <Pressable onPress={() => setSheetStep(selectedCategory ? 'topic' : 'category')} style={styles.sheetBackRow}>
        <Icon name="chevron-left" size={18} color={colors['on-surface']} />
        <Text style={styles.sheetBackText}>{t('common.back')}</Text>
      </Pressable>
      <Text style={styles.sheetTitle}>{t('friends.difficultyTitle')}</Text>

      <View style={styles.sheetTopicRecap}>
        <Text style={styles.sheetTopicRecapLabel}>{t('friends.topicLabel')}</Text>
        <Text style={styles.sheetTopicRecapValue}>{resolvedTopic?.question ?? ''}</Text>
      </View>

      <View style={styles.sheetDiffRow}>
        {DIFFICULTY_LEVELS.map((l) => {
          const isActive = selectedDifficulty === l.id;
          return (
            <Pressable
              key={l.id}
              onPress={() => setSelectedDifficulty(l.id)}
              style={[styles.sheetDiffPill, isActive && styles.sheetDiffPillActive]}
            >
              <Text style={[styles.sheetDiffText, isActive && styles.sheetDiffTextActive]}>{l.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.sheetCta, !resolvedTopic && { opacity: 0.4 }]}
        onPress={() => { if (resolvedTopic) onSend(resolvedTopic.question, resolvedTopic.label, selectedDifficulty); }}
        activeOpacity={0.8}
        disabled={!resolvedTopic}
      >
        <LinearGradient
          colors={[colors.primary, colors['primary-dim']]}
          style={styles.sheetCtaGradient}
        >
          <Text style={styles.sheetCtaText}>{t('friends.sendChallenge')}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function FriendRow({
  friend,
  onChallenge,
}: {
  friend: Friend;
  onChallenge: (friend: Friend) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: friend.avatarBg }]}>
        <Text style={styles.avatarInitial}>{friend.initial}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{friend.name}</Text>
        <Text style={styles.rowLevel}>{friend.level}</Text>
      </View>
      <Text style={styles.rowScore}>{friend.score.toLocaleString('fr-FR')}</Text>
      <Pressable style={styles.challengeButton} onPress={() => onChallenge(friend)}>
        <Ionicons name="mail-outline" size={16} color={colors['on-primary']} />
      </Pressable>
    </View>
  );
}

function SearchResultRow({
  friend,
  onAdd,
}: {
  friend: Friend;
  onAdd: (friend: Friend) => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: friend.avatarBg }]}>
        <Text style={styles.avatarInitial}>{friend.initial}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{friend.name}</Text>
        <Text style={styles.rowLevel}>{friend.level}</Text>
      </View>
      <Text style={styles.rowScore}>{friend.score.toLocaleString('fr-FR')}</Text>
      <Pressable style={styles.addButton} onPress={() => onAdd(friend)}>
        <Text style={styles.addButtonText}>{t('friends.add')}</Text>
      </Pressable>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const label =
    status === 'pending'
      ? t('challenge.statuses.pending')
      : status === 'accepted'
        ? t('challenge.statuses.accepted')
        : status === 'declined'
          ? t('challenge.statuses.declined')
          : t('challenge.statuses.completed');

  const isCompleted = status === 'completed';

  return (
    <View style={[styles.statusBadge, isCompleted && styles.statusBadgeCompleted]}>
      <Text style={[styles.statusBadgeText, isCompleted && styles.statusBadgeTextCompleted]}>
        {label}
      </Text>
    </View>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const label =
    difficulty === 'easy'
      ? t('difficulty.easy')
      : difficulty === 'medium'
        ? t('difficulty.medium')
        : difficulty === 'hard'
          ? t('difficulty.hard')
          : t('difficulty.brutal');

  const color =
    difficulty === 'easy'
      ? '#34C759'
      : difficulty === 'medium'
        ? '#FF9500'
        : difficulty === 'hard'
          ? '#FF3B30'
          : '#AF52DE';

  return (
    <View style={[styles.diffBadge, { backgroundColor: `${color}18` }]}>
      <Text style={[styles.diffBadgeText, { color }]}>{label}</Text>
    </View>
  );
}

function ChallengeRow({
  challenge,
  onPress,
}: {
  challenge: Challenge;
  onPress: (challenge: Challenge) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const opponent = challenge.from.id === 'me' ? challenge.to : challenge.from;
  const isSent = challenge.from.id === 'me';

  const mailIcon: keyof typeof Ionicons.glyphMap =
    challenge.status === 'pending' && !isSent
      ? 'mail-unread-outline'
      : challenge.status === 'pending' && isSent
        ? 'mail-outline'
        : 'mail-open-outline';

  return (
    <Pressable style={styles.row} onPress={() => onPress(challenge)}>
      <View style={styles.challengeIconWrap}>
        <View style={[styles.avatar, { backgroundColor: opponent.avatarBg }]}>
          <Text style={styles.avatarInitial}>{opponent.initial}</Text>
        </View>
        <View style={styles.mailIconBadge}>
          <Ionicons name={mailIcon} size={14} color={colors['on-surface']} />
        </View>
      </View>
      <View style={styles.challengeInfo}>
        <Text style={styles.rowName} numberOfLines={1}>
          {isSent ? `\u2192 ${opponent.name}` : opponent.name}
        </Text>
        <Text style={styles.challengeTopic} numberOfLines={1}>
          {challenge.topicLabel}
        </Text>
      </View>
      <View style={styles.challengeMeta}>
        <DifficultyBadge difficulty={challenge.difficulty} />
        <StatusBadge status={challenge.status} />
      </View>
    </Pressable>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

type TabKey = 'friends' | 'challenges';

export default function FriendsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [activeTab, setActiveTab] = useState<TabKey>('friends');
  const [searchText, setSearchText] = useState('');

  const {
    friends,
    searchResults,
    challenges,
    fetchFriends,
    searchUsers,
    clearSearch,
    addFriend,
    fetchChallenges,
  } = useFriendStore();

  useEffect(() => {
    fetchFriends();
    fetchChallenges();
  }, [fetchFriends, fetchChallenges]);

  const handleSearch = useCallback(
    (text: string) => {
      setSearchText(text);
      if (text.trim()) {
        searchUsers(text);
      } else {
        clearSearch();
      }
    },
    [searchUsers, clearSearch],
  );

  const handleAddFriend = useCallback(
    (friend: Friend) => {
      addFriend(friend);
    },
    [addFriend],
  );

  const { present, dismiss } = useBottomSheet();
  const sendChallengeAction = useFriendStore((s) => s.sendChallenge);

  const handleChallenge = useCallback(
    (_friend: Friend) => {
      Toast.show(t('common.comingSoon'), { type: 'info', duration: 2000 });
    },
    [t],
  );

  const handleChallengePress = useCallback(
    (_challenge: Challenge) => {
      Toast.show(t('common.comingSoon'), { type: 'info', duration: 2000 });
    },
    [t],
  );

  const isSearching = searchText.trim().length > 0;

  const renderFriendItem = useCallback(
    ({ item }: { item: Friend }) => (
      <FriendRow friend={item} onChallenge={handleChallenge} />
    ),
    [handleChallenge],
  );

  const renderSearchItem = useCallback(
    ({ item }: { item: Friend }) => (
      <SearchResultRow friend={item} onAdd={handleAddFriend} />
    ),
    [handleAddFriend],
  );

  const renderChallengeItem = useCallback(
    ({ item }: { item: Challenge }) => (
      <ChallengeRow challenge={item} onPress={handleChallengePress} />
    ),
    [handleChallengePress],
  );

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Icon name="chevron-left" size={22} color={colors['on-surface']} />
        </Pressable>

        <Text style={styles.headerLabel}>{t('friends.headerLabel')}</Text>
        <Text style={styles.headerTitle}>{t('friends.title')}</Text>

        {/* ── Search ── */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={16} color={colors['outline-variant']} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('friends.search')}
            placeholderTextColor={colors['outline-variant']}
            value={searchText}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => handleSearch('')} hitSlop={8}>
              <Icon name="close" size={14} color={colors['outline-variant']} />
            </Pressable>
          )}
        </View>

        {/* ── Toggle pills ── */}
        {!isSearching && (
          <View style={styles.toggleRow}>
            {(['friends', 'challenges'] as const).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[styles.togglePill, isActive && styles.togglePillActive]}
                >
                  <Text style={[styles.togglePillText, isActive && styles.togglePillTextActive]}>
                    {tab === 'friends' ? t('friends.tabs.friends') : t('friends.tabs.challenges')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* ── Content ── */}
      {isSearching ? (
        <LegendList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={renderSearchItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          estimatedItemSize={68}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{t('friends.noResults')}</Text>
            </View>
          }
        />
      ) : activeTab === 'friends' ? (
        <LegendList
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={renderFriendItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          estimatedItemSize={68}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{t('friends.noFriends')}</Text>
            </View>
          }
        />
      ) : (
        <LegendList
          data={challenges}
          keyExtractor={(item) => item.id}
          renderItem={renderChallengeItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          estimatedItemSize={68}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{t('friends.noChallenges')}</Text>
            </View>
          }
        />
      )}

      {/* ── Bottom invite ── */}
      <View style={styles.bottomBar}>
        <Pressable style={styles.inviteButton}>
          <Ionicons name="share-social-outline" size={16} color={colors['on-primary']} />
          <Text style={styles.inviteText}>{t('friends.invite')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // Header
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

    // Search
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
      backgroundColor: colors['surface-container-low'],
      borderRadius: radius.xl,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      marginTop: spacing[4],
    },
    searchInput: {
      flex: 1,
      fontFamily: fonts.regular,
      fontSize: 15,
      color: colors['on-surface'],
      padding: 0,
    },

    // Toggle
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
      fontSize: 13,
      color: colors['on-surface-variant'],
    },
    togglePillTextActive: {
      fontFamily: fonts.semibold,
      color: colors['on-primary'],
    },

    // List
    listContent: {
      paddingHorizontal: spacing[5],
      paddingTop: spacing[2],
      paddingBottom: 120,
    },

    // Rows
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      backgroundColor: colors['surface-container-lowest'],
      borderRadius: radius.xl,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      marginBottom: spacing[2],
      ...shadows.ambient,
    },

    // Avatar
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: {
      fontFamily: fonts.bold,
      fontSize: 15,
      color: colors['on-surface'],
    },

    // Row info
    rowInfo: {
      flex: 1,
    },
    rowName: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: colors['on-surface'],
      lineHeight: 18,
    },
    rowLevel: {
      fontFamily: fonts.regular,
      fontSize: 11,
      color: colors['on-surface-variant'],
      marginTop: 1,
    },
    rowScore: {
      fontFamily: fonts.semibold,
      fontSize: 13,
      color: colors['on-surface'],
    },

    // Challenge button
    challengeButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.full,
      paddingHorizontal: spacing[3],
      paddingVertical: 6,
    },
    challengeButtonText: {
      fontFamily: fonts.semibold,
      fontSize: 11,
      color: colors['on-primary'],
      letterSpacing: 0.3,
    },

    // Add button
    addButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.full,
      paddingHorizontal: spacing[3],
      paddingVertical: 6,
    },
    addButtonText: {
      fontFamily: fonts.semibold,
      fontSize: 11,
      color: colors['on-primary'],
      letterSpacing: 0.3,
    },

    // Challenge row extras
    challengeInfo: {
      flex: 1,
    },
    challengeTopic: {
      fontFamily: fonts.regular,
      fontSize: 11,
      color: colors['on-surface-variant'],
      marginTop: 1,
    },
    challengeMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[1],
    },

    // Difficulty badge
    diffBadge: {
      borderRadius: radius.full,
      paddingHorizontal: spacing[2],
      paddingVertical: 3,
    },
    diffBadgeText: {
      fontFamily: fonts.semibold,
      fontSize: 9,
      letterSpacing: 0.3,
    },

    // Status badge
    statusBadge: {
      backgroundColor: colors['surface-container-high'],
      borderRadius: radius.full,
      paddingHorizontal: spacing[2],
      paddingVertical: 3,
    },
    statusBadgeCompleted: {
      backgroundColor: colors.primary,
    },
    statusBadgeText: {
      fontFamily: fonts.semibold,
      fontSize: 9,
      color: colors['on-surface-variant'],
      letterSpacing: 0.3,
    },
    statusBadgeTextCompleted: {
      color: colors['on-primary'],
    },

    // Empty state
    emptyState: {
      alignItems: 'center',
      paddingTop: spacing[12],
    },
    emptyText: {
      fontFamily: fonts.regular,
      fontSize: 15,
      color: colors['on-surface-variant'],
    },

    // Bottom bar
    bottomBar: {
      position: 'absolute',
      bottom: spacing[8],
      left: spacing[5],
      right: spacing[5],
    },
    inviteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing[2],
      backgroundColor: colors.primary,
      borderRadius: radius.full,
      paddingVertical: 14,
      ...shadows.float,
    },
    inviteText: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      color: colors['on-primary'],
      letterSpacing: 0.3,
    },

    // Challenge icon
    challengeIconWrap: {
      position: 'relative',
    },
    mailIconBadge: {
      position: 'absolute',
      bottom: -2,
      right: -4,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors['surface-container-lowest'],
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Challenge sheet
    sheetContent: {
      paddingHorizontal: spacing[5],
      paddingTop: spacing[2],
      paddingBottom: spacing[10],
      gap: spacing[3],
    },
    sheetTitle: {
      fontFamily: fonts.bold,
      fontSize: 22,
      letterSpacing: -0.3,
      color: colors['on-surface'],
    },
    sheetLabel: {
      ...typography['label-md'],
      color: colors['outline-variant'],
      marginTop: spacing[2],
    },
    sheetBackRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[1],
      marginBottom: spacing[1],
    },
    sheetBackText: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: colors['on-surface'],
    },
    sheetCustomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors['surface-container-low'],
      borderRadius: radius.xl,
      paddingRight: spacing[2],
    },
    sheetCustomInput: {
      flex: 1,
      fontFamily: fonts.regular,
      fontSize: 15,
      color: colors['on-surface'],
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
    },
    sheetCustomBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheetTopicCards: {
      gap: spacing[2],
    },
    sheetTopicCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      backgroundColor: colors['surface-container-low'],
      borderRadius: radius.xl,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[4],
    },
    sheetTopicIcon: {
      fontSize: 26,
    },
    sheetTopicTitle: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: colors['on-surface'],
    },
    sheetTopicDesc: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors['on-surface-variant'],
      lineHeight: 18,
      marginTop: 2,
    },
    sheetTopicRecap: {
      backgroundColor: colors['surface-container-low'],
      borderRadius: radius.xl,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      gap: spacing[1],
    },
    sheetTopicRecapLabel: {
      ...typography['label-sm'],
      color: colors['outline-variant'],
    },
    sheetTopicRecapValue: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: colors['on-surface'],
      lineHeight: 20,
    },
    sheetOrDivider: {
      ...typography['label-md'],
      color: colors['outline-variant'],
      textAlign: 'center',
    },
    sheetChipScroll: {
      maxHeight: 200,
    },
    sheetChipGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing[2],
    },
    sheetChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: radius.full,
      backgroundColor: colors['surface-container-low'],
    },
    sheetChipActive: {
      backgroundColor: colors.primary,
    },
    sheetChipEmoji: {
      fontSize: 14,
      marginRight: 5,
    },
    sheetChipText: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors['on-surface'],
    },
    sheetChipTextActive: {
      color: colors['on-primary'],
    },
    sheetDiffRow: {
      flexDirection: 'row',
      gap: spacing[2],
    },
    sheetDiffPill: {
      flex: 1,
      backgroundColor: colors['surface-container-low'],
      borderRadius: radius.xl,
      paddingVertical: spacing[3],
      alignItems: 'center',
    },
    sheetDiffPillActive: {
      backgroundColor: colors.primary,
    },
    sheetDiffText: {
      fontFamily: fonts.semibold,
      fontSize: 10,
      letterSpacing: 0.5,
      color: colors['on-surface-variant'],
    },
    sheetDiffTextActive: {
      color: colors['on-primary'],
    },
    sheetCta: {
      marginTop: spacing[3],
    },
    sheetCtaGradient: {
      height: 56,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheetCtaText: {
      fontFamily: fonts.semibold,
      fontSize: 16,
      color: colors['on-primary'],
      letterSpacing: 0.3,
    },
  });
