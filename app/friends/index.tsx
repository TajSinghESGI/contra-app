import { BottomSheet } from '@/components/ui/BottomSheet';
import { useBottomSheet } from '@/components/ui/BottomSheetStack';
import Icon from '@/components/ui/Icon';
import { Toast } from '@/components/ui/Toast';
import { DIFFICULTY_LEVELS, fonts, radius, shadows, spacing, type ColorTokens } from '@/constants/tokens';
import { TOPICS, CATEGORIES } from '@/constants/topics';
import { useTheme } from '@/hooks/useTheme';
import type { Challenge, Friend, FriendRequest } from '@/services/api';
import { MorphingChips } from '@/components/ui/MorphingChips';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useFriendStore } from '@/store/friendStore';
import { isTrialExpired } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { LegendList } from '@legendapp/list';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuthStore } from '@/store/authStore';

// ─── Challenge sheet ─────────────────────────────────────────────────────────

function ChallengeSheet({ friend, onSend }: { friend: Friend; onSend: (topic: string, label: string, diff: string) => void }) {
  const { colors, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const [sheetStep, setSheetStep] = useState<'category' | 'topic' | 'rounds'>('category');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<{ question: string; label: string } | null>(null);
  const [customTopic, setCustomTopic] = useState('');
  const [selectedRounds, setSelectedRounds] = useState<number>(6); // 3 per player

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
            onSubmitEditing={() => { if (customTopic.trim()) setSheetStep('rounds'); }}
          />
          {!!customTopic.trim() && (
            <Pressable style={styles.sheetCustomBtn} onPress={() => setSheetStep('rounds')}>
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
                setSheetStep('rounds');
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

  // ── Step 3: Rounds ──
  const ROUND_OPTIONS = [
    { value: 6, label: '3' },
    { value: 10, label: '5' },
    { value: 14, label: '7' },
  ];

  return (
    <View style={styles.sheetContent}>
      <Pressable onPress={() => setSheetStep(selectedCategory ? 'topic' : 'category')} style={styles.sheetBackRow}>
        <Icon name="chevron-left" size={18} color={colors['on-surface']} />
        <Text style={styles.sheetBackText}>{t('common.back')}</Text>
      </Pressable>
      <Text style={styles.sheetTitle}>{t('challenge.roundsLabel')}</Text>

      <View style={styles.sheetTopicRecap}>
        <Text style={styles.sheetTopicRecapLabel}>{t('friends.topicLabel')}</Text>
        <Text style={styles.sheetTopicRecapValue}>{resolvedTopic?.question ?? ''}</Text>
      </View>

      <View style={styles.sheetDiffRow}>
        {ROUND_OPTIONS.map((opt) => {
          const isActive = selectedRounds === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setSelectedRounds(opt.value)}
              style={[styles.sheetDiffPill, isActive && styles.sheetDiffPillActive]}
            >
              <Text style={[styles.sheetDiffText, isActive && styles.sheetDiffTextActive]}>
                {t('challenge.roundsPerPlayer', { count: opt.label })}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.sheetCta, !resolvedTopic && { opacity: 0.4 }]}
        onPress={() => { if (resolvedTopic) onSend(resolvedTopic.question, resolvedTopic.label, String(selectedRounds)); }}
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

function getScoreColor(score: number) {
  'worklet';
  if (score >= 75) return '#34C759';
  if (score >= 50) return '#FF9500';
  return '#FF3B30';
}

function FriendRow({
  friend,
  onChallenge,
}: {
  friend: Friend;
  onChallenge: (friend: Friend) => void;
}) {
  const { colors, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const scoreColor = friend.score > 0 ? getScoreColor(friend.score) : colors['outline-variant'];

  return (
    <View style={styles.row}>
      <UserAvatar size={44} initial={friend.initial} avatarBg={friend.avatarBg} avatarUrl={friend.avatarUrl} />
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{friend.name}</Text>
        <Text style={styles.rowLevel}>{friend.level}</Text>
      </View>
      {friend.score > 0 && (
        <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
          <Text style={[styles.scoreCircleText, { color: scoreColor }]}>{friend.score}</Text>
        </View>
      )}
      <Pressable style={styles.challengeButton} onPress={() => onChallenge(friend)}>
        <Ionicons name="flash-outline" size={14} color={colors['on-primary']} />
        <Text style={styles.challengeButtonLabel}>{t('friends.challenge')}</Text>
      </Pressable>
    </View>
  );
}

function SearchResultRow({
  friend,
  onSendRequest,
  isRequested,
  isFriend,
}: {
  friend: Friend;
  onSendRequest: () => void;
  isRequested: boolean;
  isFriend: boolean;
}) {
  const { colors, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);

  return (
    <View style={styles.row}>
      <UserAvatar size={44} initial={friend.initial} avatarBg={friend.avatarBg} avatarUrl={friend.avatarUrl} />
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{friend.name}</Text>
        <Text style={styles.rowLevel}>{friend.level}</Text>
      </View>
      <Text style={styles.rowScore}>{friend.score.toLocaleString('fr-FR')}</Text>
      {isFriend ? (
        <View style={styles.addButton}>
          <Ionicons name="checkmark" size={14} color={colors['on-primary']} />
        </View>
      ) : isRequested ? (
        <View style={styles.requestedPill}>
          <Text style={styles.requestedPillText}>{t('friends.requested')}</Text>
        </View>
      ) : (
        <Pressable style={styles.addButton} onPress={onSendRequest}>
          <Text style={styles.addButtonText}>{t('friends.add')}</Text>
        </Pressable>
      )}
    </View>
  );
}

function RequestRow({
  request,
  onAccept,
  onDecline,
}: {
  request: FriendRequest;
  onAccept?: () => void;
  onDecline?: () => void;
}) {
  const { colors, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const person = request.direction === 'incoming' ? request.from : request.to;
  const isIncoming = request.direction === 'incoming';

  return (
    <View style={styles.friendRow}>
      <View style={[styles.friendAvatar, { backgroundColor: person.avatarBg }]}>
        <Text style={styles.friendAvatarText}>{person.initial}</Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{person.name}</Text>
        <Text style={styles.friendLevel}>{person.level}</Text>
      </View>
      {isIncoming ? (
        <View style={styles.requestActions}>
          <TouchableOpacity style={styles.acceptButton} onPress={onAccept} activeOpacity={0.7}>
            <Text style={styles.acceptButtonText}>{t('friends.requests.accept')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.declineButton} onPress={onDecline} activeOpacity={0.7}>
            <Text style={styles.declineButtonText}>{t('friends.requests.decline')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.requestedPill}>
          <Text style={styles.requestedPillText}>{t('friends.requested')}</Text>
        </View>
      )}
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { colors, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);

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
  const { colors, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);

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
  const { colors, typography, fs } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);

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
        <UserAvatar size={44} initial={opponent.initial} avatarBg={opponent.avatarBg} avatarUrl={opponent.avatarUrl} />
        <View style={styles.mailIconBadge}>
          <Ionicons name={mailIcon} size={14} color={colors['on-surface']} />
        </View>
      </View>
      <View style={styles.challengeInfo}>
        <Text style={styles.rowName} numberOfLines={1}>
          {isSent ? `\u2192 ${opponent.name}` : opponent.name}
        </Text>
        <Text style={styles.challengeTopic} numberOfLines={1}>
          {challenge.topic_label}
        </Text>
      </View>
      <View style={styles.challengeMeta}>
        <View style={styles.roundsPill}>
          <Text style={styles.roundsPillText}>{Math.floor((challenge.max_turns ?? 6) / 2)}R</Text>
        </View>
        <StatusBadge status={challenge.status} />
      </View>
    </Pressable>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

type TabKey = 'friends' | 'requests' | 'challenges';

export default function FriendsScreen() {
  const router = useRouter();
  const { rematchUserId } = useLocalSearchParams<{ rematchUserId?: string }>();
  const { colors, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const [activeTab, setActiveTab] = useState<TabKey>('friends');
  const [searchText, setSearchText] = useState('');

  const {
    friends,
    searchResults,
    friendRequests,
    sentRequestUserIds,
    challenges,
    fetchFriends,
    searchUsers,
    clearSearch,
    fetchFriendRequests,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    fetchChallenges,
  } = useFriendStore();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
    fetchChallenges();
  }, [fetchFriends, fetchFriendRequests, fetchChallenges]);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim()) {
      debounceRef.current = setTimeout(() => searchUsers(text), 350);
    } else {
      clearSearch();
    }
  }, [searchUsers, clearSearch]);

  const handleSendRequest = useCallback(async (friend: Friend) => {
    try {
      await sendFriendRequest(friend);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Toast.show(t('friends.requestSent'), { type: 'success', duration: 2000 });
    } catch {
      Toast.show(t('common.error'), { type: 'error', duration: 2000 });
    }
  }, [sendFriendRequest, t]);

  const { present, dismiss } = useBottomSheet();
  const sendChallengeAction = useFriendStore((s) => s.sendChallenge);

  const user = useAuthStore((s) => s.user);

  const handleChallenge = useCallback((friend: Friend) => {
    if (isTrialExpired(user)) {
      router.push('/paywall' as any);
      return;
    }
    present(
      <BottomSheet
        snapPoints={['75%']}
        enableBackdrop
        dismissOnBackdropPress
        dismissOnSwipeDown
        backgroundColor={colors['surface-container-lowest']}
      >
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          <ChallengeSheet
            friend={friend}
            onSend={async (topic, label, diff) => {
              try {
                await sendChallengeAction(friend, topic, label, diff);
                dismiss();
                Toast.show(t('friends.sent'), { type: 'success', duration: 2000 });
              } catch {
                Toast.show(t('common.error'), { type: 'error', duration: 2000 });
              }
            }}
          />
        </ScrollView>
      </BottomSheet>
    );
  }, [present, dismiss, colors, sendChallengeAction, t]);

  // Auto-open ChallengeSheet for rematch
  const rematchHandled = useRef(false);
  useEffect(() => {
    if (!rematchUserId || rematchHandled.current) return;
    // Wait for friends to load, then open the sheet
    const friend = friends.find((f) => f.id === rematchUserId);
    if (friend) {
      rematchHandled.current = true;
      handleChallenge(friend);
    }
  }, [rematchUserId, friends, handleChallenge]);

  const handleChallengePress = useCallback((challenge: Challenge) => {
    router.push({ pathname: '/challenge/[id]', params: { id: challenge.id } });
  }, [router]);

  const isSearching = searchText.trim().length > 0;

  const renderFriendItem = useCallback(
    ({ item }: { item: Friend }) => (
      <FriendRow friend={item} onChallenge={handleChallenge} />
    ),
    [handleChallenge],
  );

  const userId = useAuthStore((s) => s.user?.id);

  const handleInvite = useCallback(async () => {
    const link = `https://contra.app/invite/${userId ?? ''}`;
    await Share.share({
      message: `${t('friends.inviteMessage')} ${link}`,
    });
  }, [userId, t]);

  const incomingCount = useMemo(
    () => friendRequests.filter(r => r.direction === 'incoming' && r.status === 'pending').length,
    [friendRequests],
  );

  const TAB_KEYS: TabKey[] = ['friends', 'requests', 'challenges'];

  const chipItems = useMemo(() => [
    { key: 'friends', label: t('friends.tabs.friends') },
    { key: 'requests', label: t('friends.tabs.requests'), badge: incomingCount },
    { key: 'challenges', label: t('friends.tabs.challenges') },
  ], [t, incomingCount]);

  const activeTabIndex = TAB_KEYS.indexOf(activeTab);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key as TabKey);
  }, []);

  const friendIds = useMemo(() => new Set(friends.map(f => f.id)), [friends]);

  const renderSearchItem = useCallback(
    ({ item }: { item: Friend }) => (
      <SearchResultRow
        friend={item}
        onSendRequest={() => handleSendRequest(item)}
        isRequested={sentRequestUserIds.includes(item.id)}
        isFriend={friendIds.has(item.id)}
      />
    ),
    [handleSendRequest, sentRequestUserIds, friendIds],
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
            ref={searchInputRef}
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

        {/* ── Toggle chips ── */}
        {!isSearching && (
          <MorphingChips
            items={chipItems}
            activeIndex={activeTabIndex}
            onChange={handleTabChange}
          />
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
      ) : activeTab === 'requests' ? (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {friendRequests.filter(r => r.direction === 'incoming' && r.status === 'pending').length > 0 && (
            <>
              <Text style={styles.sectionLabel}>{t('friends.requests.incoming')}</Text>
              {friendRequests
                .filter(r => r.direction === 'incoming' && r.status === 'pending')
                .map(req => (
                  <RequestRow
                    key={req.id}
                    request={req}
                    onAccept={async () => {
                      try {
                        await acceptFriendRequest(req.id);
                        Toast.show(t('friends.requestAccepted', { name: req.from.name }), { type: 'success', duration: 2000 });
                      } catch {
                        Toast.show(t('common.error'), { type: 'error', duration: 2000 });
                      }
                    }}
                    onDecline={async () => {
                      try {
                        await declineFriendRequest(req.id);
                        Toast.show(t('friends.requestDeclined'), { type: 'info', duration: 2000 });
                      } catch {
                        Toast.show(t('common.error'), { type: 'error', duration: 2000 });
                      }
                    }}
                  />
                ))}
            </>
          )}
          {friendRequests.filter(r => r.direction === 'outgoing' && r.status === 'pending').length > 0 && (
            <>
              <Text style={styles.sectionLabel}>{t('friends.requests.outgoing')}</Text>
              {friendRequests
                .filter(r => r.direction === 'outgoing' && r.status === 'pending')
                .map(req => (
                  <RequestRow key={req.id} request={req} />
                ))}
            </>
          )}
          {friendRequests.filter(r => r.status === 'pending').length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{t('friends.requests.empty')}</Text>
            </View>
          )}
        </ScrollView>
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

      {/* ── FAB → Bottom sheet ── */}
      <Pressable
        style={styles.fab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          present(
            <BottomSheet
              snapPoints={['30%']}
              enableBackdrop
              dismissOnBackdropPress
              dismissOnSwipeDown
              backgroundColor={colors['surface-container-lowest']}
            >
              <View style={styles.addSheetContent}>
                <Text style={styles.addSheetTitle}>{t('friends.addFriend')}</Text>
                <Pressable
                  style={styles.addSheetRow}
                  onPress={() => {
                    dismiss();
                    setActiveTab('friends');
                    setTimeout(() => searchInputRef.current?.focus(), 300);
                  }}
                >
                  <View style={styles.addSheetIcon}>
                    <Icon name="search" size={18} color={colors['on-surface']} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.addSheetRowTitle}>{t('friends.searchOnApp')}</Text>
                    <Text style={styles.addSheetRowSub}>{t('friends.searchOnAppSub')}</Text>
                  </View>
                  <Icon name="chevron-right" size={16} color={colors['outline-variant']} />
                </Pressable>
                <Pressable
                  style={styles.addSheetRow}
                  onPress={() => {
                    dismiss();
                    handleInvite();
                  }}
                >
                  <View style={styles.addSheetIcon}>
                    <Ionicons name="share-social-outline" size={18} color={colors['on-surface']} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.addSheetRowTitle}>{t('friends.invite')}</Text>
                    <Text style={styles.addSheetRowSub}>{t('friends.inviteSub')}</Text>
                  </View>
                  <Icon name="chevron-right" size={16} color={colors['outline-variant']} />
                </Pressable>
              </View>
            </BottomSheet>
          );
        }}
      >
        <LinearGradient
          colors={[colors.primary, colors['primary-dim']]}
          style={styles.fabGradient}
        >
          <Ionicons name="person-add-outline" size={22} color={colors['on-primary']} />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (colors: ColorTokens, typography: any, fs: (n: number) => number) =>
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
      fontSize: fs(15),
      color: colors['on-surface'],
      padding: 0,
    },

    // Toggle

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
      borderRadius: radius['2xl'],
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      marginBottom: spacing[3],
      ...shadows.ambient,
    },

    // Avatar
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: {
      fontFamily: fonts.bold,
      fontSize: fs(17),
      color: colors['on-surface'],
    },

    // Row info
    rowInfo: {
      flex: 1,
    },
    rowName: {
      fontFamily: fonts.medium,
      fontSize: fs(14),
      color: colors['on-surface'],
      lineHeight: fs(18),
    },
    rowLevel: {
      fontFamily: fonts.regular,
      fontSize: fs(11),
      color: colors['on-surface-variant'],
      marginTop: 1,
    },
    rowScore: {
      fontFamily: fonts.semibold,
      fontSize: fs(13),
      color: colors['on-surface'],
    },

    // Score circle
    scoreCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scoreCircleText: {
      fontFamily: fonts.bold,
      fontSize: fs(12),
    },

    // Challenge button
    challengeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[1],
      backgroundColor: colors.primary,
      borderRadius: radius.full,
      paddingHorizontal: spacing[3],
      paddingVertical: 7,
    },
    challengeButtonLabel: {
      fontFamily: fonts.semibold,
      fontSize: fs(11),
      color: colors['on-primary'],
      letterSpacing: 0.3,
    },
    challengeButtonText: {
      fontFamily: fonts.semibold,
      fontSize: fs(11),
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
      fontSize: fs(11),
      color: colors['on-primary'],
      letterSpacing: 0.3,
    },

    // Challenge row extras
    challengeInfo: {
      flex: 1,
    },
    challengeTopic: {
      fontFamily: fonts.regular,
      fontSize: fs(11),
      color: colors['on-surface-variant'],
      marginTop: 1,
    },
    challengeMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[1],
    },
    roundsPill: {
      backgroundColor: colors['surface-container-high'],
      borderRadius: radius.full,
      paddingHorizontal: spacing[2],
      paddingVertical: 3,
    },
    roundsPillText: {
      fontFamily: fonts.semibold,
      fontSize: fs(10),
      color: colors['on-surface-variant'],
    },

    // Difficulty badge
    diffBadge: {
      borderRadius: radius.full,
      paddingHorizontal: spacing[2],
      paddingVertical: 3,
    },
    diffBadgeText: {
      fontFamily: fonts.semibold,
      fontSize: fs(9),
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
      fontSize: fs(9),
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
      fontSize: fs(15),
      color: colors['on-surface-variant'],
    },

    // FAB
    fab: {
      position: 'absolute',
      bottom: spacing[8],
      right: spacing[5],
      ...shadows.float,
    },
    fabGradient: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Add friend sheet
    addSheetContent: {
      paddingHorizontal: spacing[5],
      paddingTop: spacing[2],
      paddingBottom: spacing[10],
      gap: spacing[3],
    },
    addSheetTitle: {
      fontFamily: fonts.bold,
      fontSize: fs(20),
      letterSpacing: -0.3,
      color: colors['on-surface'],
      marginBottom: spacing[1],
    },
    addSheetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      backgroundColor: colors['surface-container-low'],
      borderRadius: radius.xl,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[4],
    },
    addSheetIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors['surface-container-high'],
      alignItems: 'center',
      justifyContent: 'center',
    },
    addSheetRowTitle: {
      fontFamily: fonts.semibold,
      fontSize: fs(14),
      color: colors['on-surface'],
    },
    addSheetRowSub: {
      fontFamily: fonts.regular,
      fontSize: fs(12),
      color: colors['on-surface-variant'],
      marginTop: 2,
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

    // Friend row (for RequestRow)
    friendRow: {
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
    friendAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    friendAvatarText: {
      fontFamily: fonts.bold,
      fontSize: fs(15),
      color: colors['on-surface'],
    },
    friendInfo: {
      flex: 1,
    },
    friendName: {
      fontFamily: fonts.medium,
      fontSize: fs(14),
      color: colors['on-surface'],
      lineHeight: fs(18),
    },
    friendLevel: {
      fontFamily: fonts.regular,
      fontSize: fs(11),
      color: colors['on-surface-variant'],
      marginTop: 1,
    },

    // Request actions
    requestActions: {
      flexDirection: 'row',
      gap: spacing[2],
    },
    acceptButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.full,
      paddingHorizontal: spacing[3],
      paddingVertical: 8,
    },
    acceptButtonText: {
      fontFamily: fonts.semibold,
      fontSize: fs(12),
      color: colors['on-primary'],
    },
    declineButton: {
      backgroundColor: colors['surface-container-high'],
      borderRadius: radius.full,
      paddingHorizontal: spacing[3],
      paddingVertical: 8,
    },
    declineButtonText: {
      fontFamily: fonts.medium,
      fontSize: fs(12),
      color: colors['on-surface-variant'],
    },
    requestedPill: {
      backgroundColor: colors['surface-container-high'],
      borderRadius: radius.full,
      paddingHorizontal: spacing[3],
      paddingVertical: 8,
    },
    requestedPillText: {
      fontFamily: fonts.medium,
      fontSize: fs(12),
      color: colors['outline-variant'],
    },
    sectionLabel: {
      fontFamily: fonts.bold,
      fontSize: 10,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      color: colors.outline,
      marginTop: spacing[4],
      marginBottom: spacing[2],
      paddingHorizontal: spacing[4],
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
      fontSize: fs(22),
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
      fontSize: fs(14),
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
      fontSize: fs(15),
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
      fontSize: fs(15),
      color: colors['on-surface'],
    },
    sheetTopicDesc: {
      fontFamily: fonts.regular,
      fontSize: fs(12),
      color: colors['on-surface-variant'],
      lineHeight: fs(18),
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
      fontSize: fs(14),
      color: colors['on-surface'],
      lineHeight: fs(20),
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
      fontSize: fs(13),
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
      fontSize: fs(10),
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
      fontSize: fs(16),
      color: colors['on-primary'],
      letterSpacing: 0.3,
    },
  });
