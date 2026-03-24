import { Toast } from '@/components/ui/Toast';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/ui/Icon';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useBottomSheet } from '@/components/ui/BottomSheetStack';
import { DIFFICULTY_LEVELS, fonts, radius, spacing, typography, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { useFriendStore } from '@/store/friendStore';
import { useTopicStore } from '@/store/topicStore';
import type { Friend } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';

// ─── Types ───────────────────────────────────────────────────────────────────

type DifficultyId = typeof DIFFICULTY_LEVELS[number]['id'];
type Step = 'category' | 'topic' | 'difficulty';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Friend picker sheet ─────────────────────────────────────────────────────

function FriendPickerSheet({ friends, onSelect }: { friends: Friend[]; onSelect: (friend: Friend) => void }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, gap: 12 }}>
      <Text style={{ fontFamily: 'SFProRounded-Bold', fontSize: 22, letterSpacing: -0.3, color: colors['on-surface'] }}>
        {t('onboarding.challengeFriend')}
      </Text>
      {friends.map((f) => (
        <Pressable
          key={f.id}
          onPress={() => onSelect(f)}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 12,
            backgroundColor: colors['surface-container-low'], borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12,
          }}
        >
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: f.avatarBg, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'SFProRounded-Bold', fontSize: 16, color: colors['on-surface'] }}>{f.initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'SFProRounded-Medium', fontSize: 15, color: colors['on-surface'] }}>{f.name}</Text>
            <Text style={{ fontFamily: 'SFProRounded-Regular', fontSize: 12, color: colors['on-surface-variant'] }}>{f.level}</Text>
          </View>
          <Ionicons name="mail-outline" size={18} color={colors.primary} />
        </Pressable>
      ))}
    </View>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [step, setStep] = useState<Step>('category');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedTopicLabel, setSelectedTopicLabel] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyId>('easy');
  const [customTopic, setCustomTopic] = useState('');

  const { categories, topics: categoryTopics, fetchCategories, fetchTopics } = useTopicStore();

  // Fetch categories on mount
  useEffect(() => { fetchCategories(); }, []);

  // Fetch topics when category changes
  useEffect(() => {
    if (selectedCategory) fetchTopics(selectedCategory);
  }, [selectedCategory]);

  const ctaScale = useSharedValue(1);
  const ctaStyle = useAnimatedStyle(() => ({ transform: [{ scale: ctaScale.value }] }));

  const { present, dismiss } = useBottomSheet();
  const friends = useFriendStore((s) => s.friends);
  const fetchFriends = useFriendStore((s) => s.fetchFriends);
  const sendChallengeAction = useFriendStore((s) => s.sendChallenge);

  useEffect(() => { fetchFriends(); }, []);

  const handleChallengeFriend = () => {
    Toast.show(t('common.comingSoon'), { type: 'info', duration: 2000 });
  };

  const resolvedTopicText = customTopic.trim() || '';
  const resolvedTopicId = selectedTopic || '';

  const handleCategoryPress = (cat: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(cat);
    setStep('topic');
  };

  const handleTopicPress = (topicId: string, question: string, label: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCustomTopic('');
    setSelectedTopic(topicId);
    setSelectedTopicLabel(label);
    setStep('difficulty');
  };

  const handleCustomTopicChange = (text: string) => {
    setCustomTopic(text);
    if (text.trim()) {
      setSelectedTopic(null);
      setSelectedTopicLabel('');
    }
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step === 'category' && customTopic.trim()) {
      setStep('difficulty');
    } else if (step === 'difficulty') {
      router.push({
        pathname: '/debate/new' as any,
        params: {
          topic: resolvedTopicText || selectedTopicLabel,
          topicId: resolvedTopicId,
          difficulty: selectedDifficulty,
        },
      });
    }
  };

  const handleBack = () => {
    if (step === 'difficulty') {
      setStep(selectedCategory ? 'topic' : 'category');
    } else if (step === 'topic') {
      setStep('category');
      setSelectedCategory(null);
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.root}>
      {/* ── Top bar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        {step !== 'category' ? (
          <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
            <Icon name="chevron-left" size={22} color={colors['on-surface']} />
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}
        <View style={styles.dots}>
          <View style={[styles.dot, step === 'category' && styles.dotActive]} />
          <View style={[styles.dot, step === 'topic' && styles.dotActive]} />
          <View style={[styles.dot, step === 'difficulty' && styles.dotActive]} />
        </View>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Icon name="circle-x" size={22} color={colors['on-surface-variant']} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Step 1: Category ── */}
        {step === 'category' && (
          <Animated.View
            key="step-category"
            entering={FadeInRight.duration(300)}
            exiting={FadeOutLeft.duration(200)}
          >
            <View style={styles.card}>
              <Text style={styles.stepLabel}>{t('auth.step', { current: 1, total: 3 })}</Text>
              <Text style={styles.title}>{t('onboarding.chooseSubjectTitle')}</Text>
              <Text style={styles.subtitleText}>
                {t('onboarding.subtitle')}
              </Text>

              {/* Custom input */}
              <View style={styles.customInputRow}>
                <TextInput
                  style={styles.customInput}
                  value={customTopic}
                  onChangeText={handleCustomTopicChange}
                  placeholder={t('onboarding.customTopicPlaceholder')}
                  placeholderTextColor={colors['outline-variant']}
                  returnKeyType="go"
                  onSubmitEditing={() => { if (customTopic.trim()) handleNext(); }}
                />
                {!!customTopic.trim() && (
                  <Pressable
                    style={styles.customInputBtn}
                    onPress={handleNext}
                    hitSlop={8}
                  >
                    <Icon name="arrow-right" size={16} color={colors['on-primary']} />
                  </Pressable>
                )}
              </View>

              <Text style={styles.orDivider}>{t('friends.orChooseCategory')}</Text>

              {/* Category chips */}
              <View style={styles.chipGrid}>
                {categories.map((cat: any, i: number) => (
                  <Animated.View
                    key={cat.id}
                    entering={FadeInDown.delay(100 + i * 40).duration(300).springify()}
                  >
                    <Pressable
                      onPress={() => handleCategoryPress(cat.id)}
                      style={styles.chip}
                    >
                      <Text style={styles.chipEmoji}>{cat.emoji}</Text>
                      <Text style={styles.chipText}>{cat.label}</Text>
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {/* ── Step 2: Topic selection (3 cards) ── */}
        {step === 'topic' && (
          <Animated.View
            key="step-topic"
            entering={FadeInRight.duration(300)}
            exiting={FadeOutLeft.duration(200)}
          >
            <View style={styles.card}>
              <Text style={styles.stepLabel}>{t('auth.step', { current: 2, total: 3 })}</Text>
              <Text style={styles.title}>
                {categories.find((c: any) => c.id === selectedCategory)?.emoji}{' '}
                {categories.find((c: any) => c.id === selectedCategory)?.label}
              </Text>
              <Text style={styles.subtitleText}>
                {t('onboarding.chooseTopicSubtitle')}
              </Text>

              <View style={styles.topicCardGrid}>
                {categoryTopics.slice(0, 3).map((topic: any, i: number) => (
                  <Animated.View
                    key={topic.id}
                    entering={FadeInDown.delay(80 + i * 80).duration(400).springify()}
                  >
                    <Pressable
                      onPress={() => handleTopicPress(topic.id, topic.question, topic.label)}
                      style={styles.topicCard}
                    >
                      <Text style={styles.topicCardIcon}>{topic.icon}</Text>
                      <Text style={styles.topicCardTitle}>{topic.label}</Text>
                      <Text style={styles.topicCardDesc} numberOfLines={2}>{topic.description}</Text>
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {/* ── Step 3: Difficulty ── */}
        {step === 'difficulty' && (
          <Animated.View
            key="step-difficulty"
            entering={FadeInRight.duration(300)}
            exiting={FadeOutLeft.duration(200)}
          >
            {/* ── Step 2: Difficulty ── */}
            <View style={styles.card}>
              <Text style={styles.stepLabel}>{t('auth.step', { current: 3, total: 3 })}</Text>
              <Text style={styles.title}>{t('onboarding.chooseDifficultyTitle')}</Text>
              <Text style={styles.subtitleText}>
                {t('onboarding.chooseDifficultySubtitle')}
              </Text>

              {/* Selected topic recap */}
              <View style={styles.topicRecap}>
                <Text style={styles.topicRecapLabel}>{t('onboarding.customTopicLabel')}</Text>
                <Text style={styles.topicRecapValue} numberOfLines={2}>
                  {customTopic.trim() || selectedTopicLabel}
                </Text>
              </View>

              {/* Difficulty cards */}
              <View style={styles.diffGrid}>
                {DIFFICULTY_LEVELS.map((level, i) => {
                  const isActive = selectedDifficulty === level.id;
                  return (
                    <Animated.View
                      key={level.id}
                      entering={FadeInDown.delay(100 + i * 60).duration(350).springify()}
                    >
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedDifficulty(level.id as DifficultyId);
                        }}
                        style={[styles.diffCard, isActive && styles.diffCardActive]}
                      >
                        <Text style={[styles.diffName, isActive && styles.diffNameActive]}>
                          {level.label}
                        </Text>
                        {isActive && (
                          <Icon name="verified-check" size={18} color={colors['on-primary']} />
                        )}
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </View>
            </View>
          </Animated.View>
        )}

        {/* ── CTA (step 2 only) ── */}
        {step === 'difficulty' && (
          <View style={styles.ctaArea}>
            <AnimatedPressable
              style={[styles.ctaPressable, ctaStyle]}
              onPressIn={() => { ctaScale.value = withSpring(0.97, { damping: 15, stiffness: 300 }); }}
              onPressOut={() => { ctaScale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
              onPress={handleNext}
            >
              <LinearGradient
                colors={[colors.primary, colors['primary-dim']]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.ctaGradient}
              >
                <Text style={styles.ctaText}>{t('onboarding.startDebate')}</Text>
              </LinearGradient>
            </AnimatedPressable>

            <Pressable style={styles.challengeFriendBtn} onPress={handleChallengeFriend}>
              <Ionicons name="mail-outline" size={16} color={colors.primary} />
              <Text style={styles.challengeFriendText}>{t('onboarding.challengeFriend')}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (colors: ColorTokens) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
  },
  backBtn: {
    width: 36,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors['surface-container-high'],
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 20,
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[10],
  },

  // Card
  card: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['3xl'],
    padding: spacing[6],
    gap: spacing[3],
  },
  stepLabel: {
    ...typography['label-md'],
    color: colors['outline-variant'],
  },
  title: {
    ...typography['headline-md'],
    color: colors['on-surface'],
  },
  subtitleText: {
    ...typography['body-md'],
    color: colors['on-surface-variant'],
    marginBottom: spacing[2],
  },

  // Custom input
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors['surface-container-low'],
    borderRadius: radius.xl,
    paddingRight: spacing[2],
  },
  customInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors['on-surface'],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
  },
  customInputBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orDivider: {
    ...typography['label-md'],
    color: colors['outline-variant'],
    textAlign: 'center',
  },

  // Chip grid
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.full,
    backgroundColor: colors['surface-container-low'],
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  chipEmoji: {
    fontSize: 14,
    marginRight: 5,
  },
  chipText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors['on-surface'],
  },
  chipTextSelected: {
    color: colors['on-primary'],
  },

  // Topic recap (step 2)
  topicRecap: {
    backgroundColor: colors['surface-container-low'],
    borderRadius: radius.xl,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[1],
  },
  topicRecapLabel: {
    ...typography['label-sm'],
    color: colors['outline-variant'],
  },
  topicRecapValue: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors['on-surface'],
    lineHeight: 22,
  },

  // Topic cards (step 2)
  topicCardGrid: {
    gap: spacing[3],
  },
  topicCard: {
    backgroundColor: colors['surface-container-low'],
    borderRadius: radius['2xl'],
    padding: spacing[5],
    gap: spacing[2],
  },
  topicCardIcon: {
    fontSize: 28,
  },
  topicCardTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    letterSpacing: -0.2,
    color: colors['on-surface'],
  },
  topicCardDesc: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors['on-surface-variant'],
  },

  // Difficulty cards
  diffGrid: {
    gap: spacing[2],
    marginTop: spacing[1],
  },
  diffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors['surface-container-low'],
    borderRadius: radius.xl,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
  },
  diffCardActive: {
    backgroundColor: colors.primary,
  },
  diffName: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors['on-surface'],
  },
  diffNameActive: {
    color: colors['on-primary'],
  },

  // CTA
  ctaArea: {
    marginTop: spacing[6],
    gap: spacing[3],
    alignItems: 'center',
  },
  ctaPressable: {
    width: '100%',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 3,
  },
  ctaDisabled: {
    opacity: 0.4,
  },
  ctaGradient: {
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors['on-primary'],
    letterSpacing: 0.3,
  },
  ctaHint: {
    ...typography['label-sm'],
    color: colors['outline-variant'],
  },
  challengeFriendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
  },
  challengeFriendText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.primary,
  },
});
