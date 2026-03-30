import { AnimatedHeaderScrollView } from '@/components/ui/AnimatedHeaderScrollView';
import { AnimatedThemeToggle } from '@/components/ui/AnimatedThemeToggle';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useBottomSheet } from '@/components/ui/BottomSheetStack';
import Icon from '@/components/ui/Icon';
import { DIFFICULTY_LEVELS, FONT_SIZE_OPTIONS, fonts, radius, shadows, spacing, type ColorTokens, type FontSizeOption } from '@/constants/tokens';
import { useFontSizeStore } from '@/store/fontSizeStore';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useTopicStore } from '@/store/topicStore';
import { useProgressionStore } from '@/store/progressionStore';
import { useStreakStore } from '@/store/streakStore';
import { useBadgeStore, BADGE_DEFS } from '@/store/badgeStore';
import { useFriendStore } from '@/store/friendStore';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getProfile, updateProfile, uploadAvatar, reportBug, isTrialExpired, startTrial } from '@/services/api';
import { logoutUser } from '@/services/revenuecat';
import { queryClient } from '@/services/queryClient';
import type { AuthUser } from '@/services/api';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AnimatedAvatarPicker } from '@/components/ui/AnimatedAvatarPicker';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  Pressable,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Sheet content data ──────────────────────────────────────────────────────

const NOTIFICATION_KEYS = [
  { id: 'new_debates', labelKey: 'settings.notifications.newDebates',    subtitleKey: 'settings.notifications.newDebatesSub' },
  { id: 'results',     labelKey: 'settings.notifications.results',       subtitleKey: 'settings.notifications.resultsSub' },
  { id: 'rankings',    labelKey: 'settings.notifications.rankings',      subtitleKey: 'settings.notifications.rankingsSub' },
  { id: 'challenges',  labelKey: 'settings.notifications.challenges',    subtitleKey: 'settings.notifications.challengesSub' },
  { id: 'promotions',  labelKey: 'settings.notifications.offers',        subtitleKey: 'settings.notifications.offersSub' },
];

const ABOUT_LINK_KEYS = [
  { labelKey: 'settings.about.privacyPolicy', url: 'https://contra.app/privacy' },
  { labelKey: 'settings.about.terms',         url: 'https://contra.app/terms' },
  { labelKey: 'settings.about.website',       url: 'https://contra.app' },
];

type SheetType = 'notifications' | 'privacy' | 'language' | 'difficulty' | 'font-size' | 'sounds' | 'report-bug' | 'about' | 'badges' | null;

// ─── Sheet content components (own their state so it works inside BottomSheet) ─

function NotificationsSheetContent() {
  const { colors, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const [notifEnabled, setNotifEnabled] = useState<Record<string, boolean>>({
    new_debates: true, results: true, rankings: true, challenges: true, promotions: false,
  });
  return (
    <View style={styles.sheetContent}>
      <Text style={styles.sheetTitle}>{t('settings.notifications.title')}</Text>
      {NOTIFICATION_KEYS.map((item) => (
        <View key={item.id} style={styles.notifRow}>
          <View style={styles.notifText}>
            <Text style={styles.notifLabel}>{t(item.labelKey)}</Text>
            <Text style={styles.notifSub}>{t(item.subtitleKey)}</Text>
          </View>
          <Switch
            value={notifEnabled[item.id]}
            onValueChange={(v) => setNotifEnabled((p) => ({ ...p, [item.id]: v }))}
            trackColor={{ false: colors['surface-container-high'], true: colors.primary }}
            thumbColor={colors['surface-container-lowest']}
          />
        </View>
      ))}
    </View>
  );
}

function LanguageSheetContent({ initialLang = 'fr' }: { initialLang?: string }) {
  const { colors, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const { i18n } = useTranslation();
  const [selectedLang, setSelectedLang] = useState(i18n.language || initialLang);

  const handleSelect = async (lang: string) => {
    setSelectedLang(lang);
    i18n.changeLanguage(lang);
    try {
      await updateProfile({ language: lang });
      // Update topic store language + re-fetch
      useTopicStore.getState().setLang(lang);
    } catch {}
  };

  return (
    <View style={styles.sheetContent}>
      <Text style={styles.sheetTitle}>{t('profile.items.language')}</Text>
      {[{ id: 'fr', labelKey: 'profile.language.french' as const }, { id: 'en', labelKey: 'profile.language.english' as const }].map((lang) => (
        <TouchableOpacity
          key={lang.id}
          style={styles.langRow}
          activeOpacity={0.7}
          onPress={() => handleSelect(lang.id)}
        >
          <Text style={styles.langLabel}>{t(lang.labelKey)}</Text>
          {selectedLang === lang.id && <Icon name="verified-check" size={18} color={colors.primary} />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

function DifficultySheetContent() {
  const { colors, typography, fs } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const user = useAuthStore((s) => s.user);
  const isFree = user?.subscription_tier === 'free';
  const [selectedDifficulty, setSelectedDifficulty] = useState(user?.default_difficulty ?? 'medium');

  const handleSelect = async (id: string) => {
    setSelectedDifficulty(id);
    try {
      const updated = await updateProfile({ default_difficulty: id });
      const current = useAuthStore.getState().user;
      if (current) useAuthStore.setState({ user: { ...current, default_difficulty: updated.default_difficulty } });
    } catch {}
  };

  return (
    <View style={styles.sheetContent}>
      <Text style={styles.sheetTitle}>{t('profile.items.defaultDifficulty')}</Text>
      {DIFFICULTY_LEVELS.map((level) => {
        const isActive = selectedDifficulty === level.id;
        const isLocked = isFree && (level.id === 'hard' || level.id === 'brutal');
        return (
          <TouchableOpacity
            key={level.id}
            style={[styles.diffRow, isActive && styles.diffRowActive]}
            onPress={() => isLocked ? router.push('/paywall') : handleSelect(level.id)}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[styles.diffLabel, isActive && styles.diffLabelActive]}>{level.label}</Text>
                {isLocked && <Icon name="scale" size={12} color={colors['outline-variant']} />}
              </View>
              <Text style={{ fontFamily: fonts.regular, fontSize: fs(11), color: isActive ? colors['on-primary'] : colors['on-surface-variant'], marginTop: 2, opacity: isActive ? 0.8 : 1 }}>
                {t(`settings.difficulty.desc_${level.id}`)}
              </Text>
            </View>
            {isActive && <Icon name="verified-check" size={18} color={colors['on-primary']} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function SoundsSheetContent() {
  const { colors, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const [soundEnabled, setSoundEnabled] = useState<Record<string, boolean>>({
    haptics: true, sfx: true,
  });
  return (
    <View style={styles.sheetContent}>
      <Text style={styles.sheetTitle}>{t('profile.items.sounds')}</Text>
      {[{ id: 'haptics', labelKey: 'profile.haptics' as const }, { id: 'sfx', labelKey: 'profile.sfx' as const }].map((item) => (
        <View key={item.id} style={styles.notifRow}>
          <Text style={styles.notifLabel}>{t(item.labelKey)}</Text>
          <Switch
            value={soundEnabled[item.id]}
            onValueChange={(v) => setSoundEnabled((p) => ({ ...p, [item.id]: v }))}
            trackColor={{ false: colors['surface-container-high'], true: colors.primary }}
            thumbColor={colors['surface-container-lowest']}
          />
        </View>
      ))}
    </View>
  );
}

function FontSizeSheetContent() {
  const { colors, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const currentSize = useFontSizeStore((s) => s.size);
  const setSize = useFontSizeStore((s) => s.setSize);

  const LABELS: Record<FontSizeOption, string> = {
    small: t('profile.fontSize.small'),
    default: t('profile.fontSize.default'),
    large: t('profile.fontSize.large'),
  };

  const PREVIEW_SIZES: Record<FontSizeOption, number> = {
    small: 16,
    default: 18,
    large: 20,
  };

  return (
    <View style={styles.sheetContent}>
      <Text style={styles.sheetTitle}>{t('profile.items.fontSize')}</Text>
      {FONT_SIZE_OPTIONS.map(({ id }) => {
        const isActive = currentSize === id;
        return (
          <TouchableOpacity
            key={id}
            style={[styles.diffRow, isActive && styles.diffRowActive]}
            onPress={() => setSize(id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.diffLabel, isActive && styles.diffLabelActive]}>{LABELS[id]}</Text>
            {isActive && <Icon name="verified-check" size={18} color={colors['on-primary']} />}
          </TouchableOpacity>
        );
      })}
      <Text style={[styles.sheetBody, { fontSize: PREVIEW_SIZES[currentSize], lineHeight: PREVIEW_SIZES[currentSize] + 10, marginTop: spacing[3] }]}>
        {t('profile.fontSize.preview')}
      </Text>
    </View>
  );
}

function ReportBugSheetContent() {
  const { colors, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const [bugText, setBugText] = useState('');
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (bugText.trim().length < 10 || isLoading) return;
    setIsLoading(true);
    try {
      await reportBug(bugText);
      setSent(true);
    } catch {} finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.sheetContent}>
        <Text style={styles.sheetTitle}>{t('profile.items.reportBug')}</Text>
        <Text style={styles.sheetBody}>Merci pour ton retour ! On regarde ça rapidement.</Text>
      </View>
    );
  }

  return (
    <View style={styles.sheetContent}>
      <Text style={styles.sheetTitle}>{t('profile.items.reportBug')}</Text>
      <TextInput
        style={styles.bugInput}
        value={bugText}
        onChangeText={setBugText}
        placeholder={t('profile.reportBugPlaceholder')}
        placeholderTextColor={colors['outline-variant']}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />
      <Pressable style={[styles.bugSubmit, bugText.trim().length < 10 && { opacity: 0.5 }]} onPress={handleSend}>
        <Text style={styles.bugSubmitText}>{isLoading ? '...' : t('profile.send')}</Text>
      </Pressable>
    </View>
  );
}

// ─── Setting row ─────────────────────────────────────────────────────────────

function SettingRow({ label, badge, onPress }: { label: string; badge?: number; onPress?: () => void }) {
  const { colors, typography, fs } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.settingLabelRow}>
        <Text style={styles.settingLabel}>{label}</Text>
        {badge != null && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
      </View>
      <Icon name="chevron-right" size={16} color={colors['outline-variant']} />
    </TouchableOpacity>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const logout = useAuthStore((s) => s.logout);
  const { colors, isDark, setMode, typography, fs } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const currentStreak = useStreakStore((s) => s.currentStreak);
  const { totalDebates, currentLevel } = useProgressionStore();
  const unlockedIds = useBadgeStore((s) => s.unlockedIds);
  const unlockedBadges = useBadgeStore((s) => s.unlockedBadges);
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const friendRequests = useFriendStore((s) => s.friendRequests);
  const challenges = useFriendStore((s) => s.challenges);
  const fetchFriendRequests = useFriendStore((s) => s.fetchFriendRequests);
  const fetchChallenges = useFriendStore((s) => s.fetchChallenges);

  const pendingCount = useMemo(() => {
    const incomingRequests = friendRequests.filter(
      (r) => r.direction === 'incoming' && r.status === 'pending',
    ).length;
    const pendingChallenges = profile
      ? challenges.filter((c) => c.to.id === profile.id && c.status === 'pending').length
      : 0;
    return incomingRequests + pendingChallenges;
  }, [friendRequests, challenges, profile]);

  useFocusEffect(
    useCallback(() => {
      getProfile().then(setProfile).catch(() => {});
      fetchFriendRequests();
      fetchChallenges();
    }, [])
  );

  const [isUploading, setIsUploading] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

  const doUpload = useCallback(async (uri: string) => {
    setIsUploading(true);
    try {
      const { avatar_url } = await uploadAvatar(uri);
      setProfile((prev) => prev ? { ...prev, avatar_url } : prev);
      const authUser = useAuthStore.getState().user;
      if (authUser) {
        useAuthStore.setState({ user: { ...authUser, avatar_url } });
      }
    } catch (e: any) {
      console.error('Avatar upload failed:', e.message);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const pickFromLibrary = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      doUpload(result.assets[0].uri);
    }
  }, [doUpload]);

  const pickFromCamera = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      doUpload(result.assets[0].uri);
    }
  }, [doUpload]);

  const { present, dismiss } = useBottomSheet();

  const sheetProps = {
    snapPoints: ['70%'] as const,
    enableBackdrop: true,
    dismissOnBackdropPress: true,
    dismissOnSwipeDown: true,
    backgroundColor: colors['surface-container-lowest'],
  };

  const openSheet = useCallback((type: SheetType) => {
    const content = (() => {
      switch (type) {
        case 'notifications':
          return <NotificationsSheetContent />;
        case 'privacy':
          return (
            <View style={styles.sheetContent}>
              <Text style={styles.sheetTitle}>{t('profile.items.privacy')}</Text>
              <Text style={styles.sheetBody}>
                {t('profile.privacyBody')}
              </Text>
            </View>
          );
        case 'language':
          return <LanguageSheetContent initialLang={profile?.language ?? 'fr'} />;
        case 'difficulty':
          return <DifficultySheetContent />;
        case 'font-size':
          return <FontSizeSheetContent />;
        case 'sounds':
          return <SoundsSheetContent />;
        case 'report-bug':
          return <ReportBugSheetContent />;
        case 'about':
          return (
            <View style={styles.sheetContent}>
              <View style={styles.aboutHeader}>
                <View style={styles.aboutBadge}>
                  <Image source={require('@/assets/images/logo-contra.png')} style={styles.aboutLogo} resizeMode="contain" />
                </View>
                <Text style={styles.aboutWordmark}>{t('common.appName')}</Text>
                <Text style={styles.aboutVersion}>{t('settings.about.version', { version: '1.0.0' })}</Text>
              </View>
              {ABOUT_LINK_KEYS.map((link) => (
                <TouchableOpacity key={link.labelKey} style={styles.langRow} onPress={() => Linking.openURL(link.url)} activeOpacity={0.7}>
                  <Text style={styles.langLabel}>{t(link.labelKey)}</Text>
                  <Icon name="chevron-right" size={14} color={colors['outline-variant']} />
                </TouchableOpacity>
              ))}
            </View>
          );
        case 'badges':
          return (
            <View style={styles.sheetContent}>
              <Text style={styles.sheetTitle}>{t('profile.badgesCount', { unlocked: unlockedIds.length, total: BADGE_DEFS.length })}</Text>
              <View style={styles.badgeGrid}>
                {BADGE_DEFS.map((def) => {
                  const unlock = unlockedBadges.find((b) => b.id === def.id);
                  const unlocked = !!unlock;
                  const level = unlock?.level ?? 0;
                  const levelEmoji = level === 3 ? '🥇' : level === 2 ? '🥈' : level === 1 ? '🥉' : '';
                  const desc = level > 0 ? t(def.levels[level - 1].descKey) : t(def.levels[0].descKey);
                  return (
                    <View key={def.id} style={[styles.badgeItem, !unlocked && styles.badgeLocked]}>
                      <Text style={styles.badgeIcon}>{def.icon}</Text>
                      {unlocked && <Text style={styles.badgeLevelEmoji}>{levelEmoji}</Text>}
                      <Text style={[styles.badgeLabel, !unlocked && styles.badgeLabelLocked]} numberOfLines={1}>
                        {t(def.labelKey)}
                      </Text>
                      <Text style={[styles.badgeDesc, !unlocked && styles.badgeLabelLocked]} numberOfLines={2}>
                        {desc}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        default:
          return null;
      }
    })();

    if (content) {
      present(
        <BottomSheet {...sheetProps}>
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {content}
          </ScrollView>
        </BottomSheet>
      );
    }
  }, [present, colors, styles, unlockedIds]);

  return (
    <View style={styles.rootContainer}>
    <Pressable
      onPress={async () => { await logout(); logoutUser(); router.replace('/auth/login'); }}
      hitSlop={12}
      style={{ position: 'absolute', top: insets.top + spacing[2], right: spacing[6], zIndex: 100, padding: spacing[2] }}
    >
      <Ionicons name="log-out-outline" size={22} color={colors['on-surface-variant']} />
    </Pressable>
    <AnimatedHeaderScrollView
      largeTitle={t('tabs.profile')}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
    >
      {/* ── Avatar area ── */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarPressable}>
          {isUploading ? (
            <View style={styles.avatarPressable}>
              <View style={[styles.avatarCircle, profile?.avatar_bg ? { backgroundColor: profile.avatar_bg } : {}, { opacity: 0.4 }]}>
                <Text style={styles.avatarInitial}>{profile?.initial ?? '?'}</Text>
              </View>
              <View style={styles.avatarLoaderOverlay}>
                <ActivityIndicator size="small" color={colors['on-primary']} />
              </View>
            </View>
          ) : (
            <Pressable onPress={() => setAvatarPickerOpen(true)}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarCircle, profile?.avatar_bg ? { backgroundColor: profile.avatar_bg } : {}]}>
                  <Text style={styles.avatarInitial}>{profile?.initial ?? '?'}</Text>
                </View>
              )}
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera-outline" size={14} color={colors['on-primary']} />
              </View>
            </Pressable>
          )}
        </View>
        <Text style={styles.userName}>{profile?.pseudo ?? t('common.loading')}</Text>
        <Text style={styles.userSubtitle}>{profile?.level ?? currentLevel.label}</Text>
        <View style={styles.statsPillsRow}>
          {/* Subscription chip */}
          {(() => {
            const tier = profile?.subscription_tier ?? 'free';
            const isPro = ['pro_monthly', 'pro_annual', 'pro_lifetime'].includes(tier);
            const isTrial = tier === 'trial' && !isTrialExpired(profile);

            if (isPro) {
              return (
                <Pressable style={[styles.statsPill, { backgroundColor: colors.primary }]} onPress={() => router.push('/paywall')}>
                  <Text style={[styles.statsPillText, { color: colors['on-primary'] }]}>PRO</Text>
                </Pressable>
              );
            }
            if (isTrial) {
              const expiresAt = profile?.trial_expires_at ? new Date(profile.trial_expires_at) : null;
              const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86400000)) : null;
              return (
                <Pressable style={[styles.statsPill, { backgroundColor: colors['tertiary-container'] }]} onPress={() => router.push('/paywall')}>
                  <Text style={[styles.statsPillText, { color: colors['on-surface'] }]}>
                    {t('profile.trialBadge')} · {daysLeft != null ? t('profile.trialDaysLeft', { count: daysLeft }) : t('profile.trialActive')}
                  </Text>
                </Pressable>
              );
            }
            return (
              <Pressable style={styles.statsPill} onPress={() => router.push('/paywall')}>
                <Icon name="scale" size={10} color={colors['on-surface-variant']} />
                <Text style={styles.statsPillText}>{t('profile.freeTier')}</Text>
              </Pressable>
            );
          })()}
          {[
            t('profile.debates', { n: profile?.total_debates ?? totalDebates }),
            `${profile?.total_score ?? 0} pts`,
            ...(currentStreak >= 1 ? [`🔥 ${t('home.streakDays', { count: currentStreak })}`] : []),
          ].map((stat) => (
            <View key={stat} style={styles.statsPill}>
              <Text style={styles.statsPillText}>{stat}</Text>
            </View>
          ))}
          <Pressable style={styles.statsPill} onPress={() => openSheet('badges')}>
            <Text style={styles.statsPillText}>🏅 {unlockedIds.length} {t('profile.badges')}</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Settings ── */}
      <View style={styles.settingsContainer}>
        {/* COMPTE */}
        <View style={styles.settingSection}>
          <Text style={styles.settingSectionTitle}>{t('profile.sections.account')}</Text>
          <View style={styles.settingRows}>
            <SettingRow label={t('profile.editProfile')} onPress={() => router.push('/settings/edit-profile')} />
            <SettingRow label={t('profile.premiumSubscription')} onPress={() => router.push('/paywall')} />
            <SettingRow label={t('profile.items.notifications')} onPress={() => openSheet('notifications')} />
            <SettingRow label={t('profile.items.privacy')} onPress={() => openSheet('privacy')} />
          </View>
        </View>

        {/* PRÉFÉRENCES */}
        <View style={styles.settingSection}>
          <Text style={styles.settingSectionTitle}>{t('profile.sections.preferences')}</Text>
          <View style={styles.settingRows}>
            <SettingRow label={t('profile.items.language')} onPress={() => openSheet('language')} />
            <SettingRow label={t('profile.items.defaultDifficulty')} onPress={() => openSheet('difficulty')} />
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>{t('profile.darkMode')}</Text>
              <AnimatedThemeToggle
                isDark={isDark}
                onToggle={() => setMode(isDark ? 'light' : 'dark')}
                size={22}
                color={colors['on-surface-variant']}
              />
            </View>
            <SettingRow label={t('profile.items.fontSize')} onPress={() => openSheet('font-size')} />
            <SettingRow label={t('profile.items.sounds')} onPress={() => openSheet('sounds')} />
          </View>
        </View>

        {/* SUPPORT */}
        <View style={styles.settingSection}>
          <Text style={styles.settingSectionTitle}>{t('profile.sections.support')}</Text>
          <View style={styles.settingRows}>
            <SettingRow label={t('profile.items.faq')} onPress={() => router.push('/settings/faq')} />
            <SettingRow label={t('profile.items.reportBug')} onPress={() => openSheet('report-bug')} />
            <SettingRow label={t('profile.items.about')} onPress={() => openSheet('about')} />
          </View>
        </View>
      </View>


    </AnimatedHeaderScrollView>
    <Modal visible={avatarPickerOpen} transparent animationType="none" statusBarTranslucent>
      <AnimatedAvatarPicker
        size={72}
        initial={profile?.initial ?? '?'}
        avatarBg={profile?.avatar_bg}
        avatarUrl={profile?.avatar_url}
        onPickCamera={() => { setAvatarPickerOpen(false); pickFromCamera(); }}
        onPickLibrary={() => { setAvatarPickerOpen(false); pickFromLibrary(); }}
        onClose={() => setAvatarPickerOpen(false)}
      />
    </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (colors: ColorTokens, typography: any, fs: (n: number) => number) => StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingBottom: spacing[6],
  },
  avatarPressable: {
    position: 'relative',
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors['surface-container-high'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLoaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  avatarSheetContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
    paddingBottom: spacing[6],
    gap: spacing[2],
  },
  avatarSheetTitle: {
    fontFamily: fonts.bold,
    fontSize: fs(18),
    color: colors['on-surface'],
    marginBottom: spacing[2],
  },
  avatarSheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: radius.xl,
    backgroundColor: colors['surface-container-low'],
  },
  avatarSheetIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors['surface-container-high'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSheetRowText: {
    fontFamily: fonts.medium,
    fontSize: fs(15),
    color: colors['on-surface'],
  },
  avatarInitial: {
    fontFamily: fonts.bold,
    fontSize: fs(24),
    color: colors['on-surface'],
  },
  userName: {
    fontFamily: fonts.bold,
    fontSize: fs(22),
    letterSpacing: -0.3,
    color: colors['on-surface'],
    marginTop: spacing[3],
  },
  userSubtitle: {
    fontFamily: fonts.regular,
    fontSize: fs(13),
    color: colors['on-surface-variant'],
    marginTop: spacing[1],
  },
  statsPillsRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: 14,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  statsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors['surface-container-low'],
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  statsPillText: {
    fontFamily: fonts.medium,
    fontSize: fs(12),
    color: colors['on-surface'],
  },

  // Badges
  badgeSection: {
    marginTop: spacing[4],
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  badgeItem: {
    width: '31%',
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius.xl,
    paddingVertical: spacing[3],
    alignItems: 'center',
    gap: 4,
  },
  badgeLocked: {
    opacity: 0.3,
  },
  badgeIcon: {
    fontSize: 22,
  },
  badgeLevelEmoji: {
    fontSize: 12,
    position: 'absolute' as const,
    top: spacing[1],
    right: spacing[1],
  },
  badgeLabel: {
    fontFamily: fonts.medium,
    fontSize: fs(10),
    color: colors['on-surface'],
    textAlign: 'center',
  },
  badgeDesc: {
    fontFamily: fonts.regular,
    fontSize: fs(9),
    color: colors['on-surface-variant'],
    textAlign: 'center',
    lineHeight: fs(13),
  },
  badgeLabelLocked: {
    color: colors['outline-variant'],
  },

  settingsContainer: { gap: 0 },
  settingSection: { marginTop: 0 },
  settingSectionTitle: {
    ...typography['label-md'],
    color: colors['outline-variant'],
    marginTop: spacing[5],
    marginBottom: spacing[2],
  },
  settingRows: { gap: spacing[1] },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius.xl,
    paddingHorizontal: spacing[4],
    paddingVertical: 14,
    ...shadows.ambient,
  },
  settingLabelRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[2],
    flex: 1,
  },
  settingLabel: {
    fontFamily: fonts.regular,
    fontSize: fs(15),
    color: colors['on-surface'],
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  badgeText: {
    fontFamily: fonts.semibold,
    fontSize: fs(11),
    color: colors['on-primary'],
  },

  signOutWrapper: { marginTop: spacing[8] },
  signOutButton: {
    backgroundColor: colors['on-error'],
    borderRadius: radius.xl,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText: {
    fontFamily: fonts.medium,
    fontSize: fs(15),
    color: colors.error,
  },

  // ── Sheet styles ──
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
    marginBottom: spacing[2],
  },
  sheetBody: {
    fontFamily: fonts.regular,
    fontSize: fs(15),
    lineHeight: fs(24),
    color: colors['on-surface-variant'],
  },

  // Notifications
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
  },
  notifText: { flex: 1, marginRight: spacing[3] },
  notifLabel: {
    fontFamily: fonts.medium,
    fontSize: fs(15),
    color: colors['on-surface'],
  },
  notifSub: {
    fontFamily: fonts.regular,
    fontSize: fs(12),
    color: colors['on-surface-variant'],
    marginTop: 2,
  },

  // Language
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors['surface-container-low'],
    borderRadius: radius.xl,
    paddingHorizontal: spacing[4],
    paddingVertical: 14,
  },
  langLabel: {
    fontFamily: fonts.regular,
    fontSize: fs(15),
    color: colors['on-surface'],
  },

  // Difficulty
  diffRow: {
    backgroundColor: colors['surface-container-low'],
    borderRadius: radius.xl,
    paddingHorizontal: spacing[4],
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  diffRowActive: {
    backgroundColor: colors.primary,
  },
  diffLabel: {
    fontFamily: fonts.medium,
    fontSize: fs(15),
    color: colors['on-surface'],
  },
  diffLabelActive: {
    color: colors['on-primary'],
  },

  // Report bug
  bugInput: {
    backgroundColor: colors['surface-container-low'],
    borderRadius: radius.xl,
    fontFamily: fonts.regular,
    fontSize: fs(15),
    color: colors['on-surface'],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    minHeight: 120,
  },
  bugSubmit: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: 14,
    alignItems: 'center',
  },
  bugSubmitText: {
    fontFamily: fonts.semibold,
    fontSize: fs(15),
    color: colors['on-primary'],
  },

  // Subscription card
  subCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius.xl,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    marginTop: spacing[5],
    ...shadows.ambient,
  },
  subCardExpired: {
    backgroundColor: colors['error-container'],
  },
  subCardRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[2],
    marginBottom: 4,
  },
  subCardBadge: {
    fontFamily: fonts.bold,
    fontSize: fs(10),
    letterSpacing: 1,
    color: colors['on-primary'],
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    overflow: 'hidden' as const,
  },
  subCardTitle: {
    fontFamily: fonts.medium,
    fontSize: fs(15),
    color: colors['on-surface'],
  },
  subCardSub: {
    fontFamily: fonts.regular,
    fontSize: fs(12),
    color: colors['on-surface-variant'],
    marginTop: 2,
  },
  subCardCta: {
    fontFamily: fonts.semibold,
    fontSize: fs(13),
    color: colors.primary,
    marginTop: 4,
  },

  // About
  aboutHeader: {
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  aboutBadge: {
    width: 56,
    height: 56,
    borderRadius: radius.xl,
    backgroundColor: colors['inverse-surface'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutLogo: { width: 36, height: 36 },
  aboutWordmark: {
    fontFamily: fonts.bold,
    fontSize: fs(28),
    letterSpacing: -0.5,
    color: colors['on-surface'],
  },
  aboutVersion: {
    fontFamily: fonts.regular,
    fontSize: fs(13),
    color: colors['on-surface-variant'],
  },

});
