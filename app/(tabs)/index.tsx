import { LiveDot } from '@/components/shared/LiveDot';
import { SpectralWave } from '@/components/shared/SpectralWave';
import { AnimatedHeaderScrollView } from '@/components/ui/AnimatedHeaderScrollView';
import { fonts, radius, shadows, spacing, typography, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { getActivityFeed, type ActivityEntry } from '@/services/api';
import { useStreakStore } from '@/store/streakStore';
import { useTopicStore } from '@/store/topicStore';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

// ─── Sub-components ───────────────────────────────────────────────────────────

function AnimatedCTAButton({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const scale = useRef(new Animated.Value(1)).current;
  const [buttonWidth, setButtonWidth] = useState(0);
  const ctaWaveColors: [string, string, string] = [
    colors.primary,
    colors['outline-variant'],
    colors['primary-dim'],
  ];

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.ctaPressable}
      onLayout={(e) => setButtonWidth(e.nativeEvent.layout.width)}
      accessibilityRole="button"
    >
      <Animated.View style={[{ transform: [{ scale }] }, styles.ctaWave]}>
        {buttonWidth > 0 && (
          <SpectralWave
            asChild
            width={buttonWidth}
            height={spacing[12]}
            borderRadius={radius.full}
            colors={ctaWaveColors}
            timeScale={0.5}
            brightness={0.85}
          >
            <Text style={styles.ctaText}>{t('home.debateNow')}</Text>
          </SpectralWave>
        )}
      </Animated.View>
    </Pressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  const { topics, fetchTopics } = useTopicStore();
  const [activity, setActivity] = useState<ActivityEntry[]>([]);

  React.useEffect(() => { fetchTopics(); }, []);

  useEffect(() => {
    getActivityFeed()
      .then(setActivity)
      .catch(() => {});
  }, []);

  const dailyTopic = useMemo(() => topics.find((t: any) => t.is_topic_of_day) ?? topics[0], [topics]);
  const trending = useMemo(() => topics.filter((t: any) => !t.is_topic_of_day).slice(0, 3), [topics]);
  const currentStreak = useStreakStore((s) => s.currentStreak);

  const avatarStackColors = [
    colors['surface-dim'],
    colors['surface-container-highest'],
    colors['surface-container-high'],
  ];

  const avatarComponent = (
    <View style={styles.avatarCircle}>
      <Text style={styles.avatarInitial}>T</Text>
    </View>
  );

  return (
    <AnimatedHeaderScrollView
      largeTitle={t('tabs.feed')}
      subtitle={t('home.subtitle')}
      rightComponent={avatarComponent}
      contentContainerStyle={styles.scrollContent}
    >
      {/* ── Streak pill ── */}
      {currentStreak >= 1 && (
        <View style={styles.streakPill}>
          <Text style={styles.streakText}>🔥 {t('home.streakDays', { count: currentStreak })}</Text>
        </View>
      )}

      {/* ── Hero Card: Topic du Jour ── */}
      <View style={[styles.heroCard, styles.cardShadow]}>
        <Text style={styles.labelText}>{dailyTopic?.icon}  {t('home.topicOfDay')}</Text>
        <View style={styles.divider} />
        <Text style={styles.heroHeadline}>
          {dailyTopic?.question}
        </Text>
        <Text style={styles.heroMeta}>3 500 débats aujourd'hui · 2.4k en ligne</Text>
        <AnimatedCTAButton onPress={() => router.push('/onboarding')} />
      </View>

      {/* ── Trending Arenas ── */}
      <View style={styles.section}>
        <Text style={styles.labelText}>{t('home.trendingArenas')}</Text>

        <View style={styles.bentoRow}>
          {/* Large card */}
          {trending[0] && (
            <Pressable
              style={({ pressed }) => [styles.bentoLarge, styles.cardShadow, pressed && { opacity: 0.9 }]}
              onPress={() => router.push({
                pathname: '/arena/[id]',
                params: {
                  id: trending[0].id,
                  title: trending[0].question,
                  description: trending[0].description,
                  category: trending[0].category,
                  difficulty: 'hard',
                  participants: '247',
                  isLive: 'true',
                },
              })}
              accessibilityRole="button"
            >
              <View style={styles.liveRow}>
                <LiveDot />
                <Text style={styles.liveText}>{t('home.liveSessions')}</Text>
              </View>
              <Text style={styles.bentoTitle}>{trending[0].question}</Text>
              <View style={styles.bentoBottom}>
                <Text style={styles.participantsText}>{t('home.participants', { count: 247 })}</Text>
                <View style={styles.avatarStack}>
                  {avatarStackColors.map((bg, i) => (
                    <View
                      key={i}
                      style={[
                        styles.stackAvatar,
                        { backgroundColor: bg, marginLeft: i === 0 ? 0 : -8 },
                      ]}
                    />
                  ))}
                </View>
              </View>
            </Pressable>
          )}

          {/* Small cards column */}
          <View style={styles.bentoSmallCol}>
            {trending[1] && (
              <Pressable
                style={({ pressed }) => [styles.bentoSmall, styles.cardShadow, pressed && { opacity: 0.9 }]}
                onPress={() => router.push({
                  pathname: '/arena/[id]',
                  params: {
                    id: trending[1].id,
                    title: trending[1].question,
                    description: trending[1].description,
                    category: trending[1].category,
                    difficulty: 'medium',
                    participants: '856',
                    isLive: 'true',
                  },
                })}
                accessibilityRole="button"
              >
                <Text style={styles.bentoEmoji}>{trending[1].icon}</Text>
                <Text style={styles.bentoSmallTitle}>{trending[1].label}</Text>
                <Text style={styles.bentoNewActivity}>{t('home.newActivity')}</Text>
              </Pressable>
            )}
            {trending[2] && (
              <Pressable
                style={({ pressed }) => [styles.bentoSmall, styles.cardShadow, pressed && { opacity: 0.9 }]}
                onPress={() => router.push({
                  pathname: '/arena/[id]',
                  params: {
                    id: trending[2].id,
                    title: trending[2].question,
                    description: trending[2].description,
                    category: trending[2].category,
                    difficulty: 'medium',
                    participants: '1284',
                    isLive: 'true',
                  },
                })}
                accessibilityRole="button"
              >
                <Text style={styles.bentoEmoji}>{trending[2].icon}</Text>
                <Text style={styles.bentoSmallTitle}>{trending[2].label}</Text>
                <Text style={styles.bentoNewActivity}>{t('home.newActivity')}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* ── Recent Activity ── */}
      <View style={[styles.section, styles.activitySection]}>
        <Text style={styles.labelText}>{t('home.recentActivity')}</Text>
        <View style={styles.activityList}>
          {activity.map((item) => (
            <View key={item.id} style={styles.activityRow}>
              <View style={[styles.activityAvatar, { backgroundColor: item.bg }]}>
                <Text style={styles.activityInitial}>{item.initial}</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityName}>{item.name}</Text>
                <Text style={styles.activitySnippet} numberOfLines={1}>
                  {item.snippet}
                </Text>
              </View>
              <Text style={styles.activityTime}>{item.time}</Text>
            </View>
          ))}
        </View>
      </View>
    </AnimatedHeaderScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (colors: ColorTokens) => StyleSheet.create({
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors['surface-container-high'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors['on-surface'],
  },

  scrollContent: {
    paddingBottom: 100,
  },

  cardShadow: {
    ...shadows.ambient,
  },

  streakPill: {
    backgroundColor: colors['surface-container-low'],
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    alignSelf: 'flex-start',
    marginBottom: spacing[4],
    marginHorizontal: spacing[2],
    marginTop: spacing[4],
  },
  streakText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors['on-surface'],
  },

  heroCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['3xl'],
    marginHorizontal: spacing[2],
    marginTop: spacing[4],
    padding: spacing[5],
  },
  labelText: {
    ...typography['label-md'],
    color: colors.outline,
  },
  divider: {
    width: '30%',
    height: 1,
    backgroundColor: colors['outline-variant'],
    opacity: 0.3,
    marginVertical: 10,
  },
  heroHeadline: {
    fontFamily: fonts.bold,
    fontSize: 22,
    letterSpacing: -0.3,
    color: colors['on-surface'],
    lineHeight: 30,
  },
  heroMeta: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors['on-surface-variant'],
    marginTop: spacing[2],
  },

  ctaPressable: {
    marginTop: spacing[5],
  },
  ctaWave: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 3,
  },
  ctaText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors['on-primary'],
    letterSpacing: 1,
  },

  section: {
    marginTop: spacing[6],
    paddingHorizontal: spacing[2],
  },
  activitySection: {
    marginTop: spacing[6],
    paddingHorizontal: spacing[2],
    paddingBottom: 0,
  },

  bentoRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[3],
  },
  bentoLarge: {
    flex: 2,
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['3xl'],
    padding: spacing[4],
  },
  bentoSmallCol: {
    flex: 1,
    gap: spacing[3],
  },
  bentoSmall: {
    flex: 1,
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['2xl'],
    padding: spacing[3],
    justifyContent: 'space-between',
  },

  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors['on-surface-variant'],
  },

  bentoTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors['on-surface'],
    marginTop: spacing[2],
    lineHeight: 22,
  },
  bentoBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[2],
  },
  participantsText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors['on-surface-variant'],
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors['surface-container-lowest'],
  },

  bentoEmoji: {
    fontSize: 20,
  },
  bentoSmallTitle: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors['on-surface'],
    marginTop: spacing[1],
  },
  bentoNewActivity: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors['on-surface-variant'],
    marginTop: spacing[1],
  },

  activityList: {
    marginTop: spacing[3],
    gap: spacing[4],
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  activityAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityInitial: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors['on-surface'],
  },
  activityContent: {
    flex: 1,
  },
  activityName: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors['on-surface'],
    lineHeight: 18,
  },
  activitySnippet: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors['on-surface-variant'],
    lineHeight: 18,
  },
  activityTime: {
    ...typography['label-sm'],
    color: colors['on-surface-variant'],
  },
});
