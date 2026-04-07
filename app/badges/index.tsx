import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Icon from '@/components/ui/Icon';
import { fonts, radius, shadows, spacing, typography as typo, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { useBadgeStore, BADGE_DEFS } from '@/store/badgeStore';

// ─── Constants ──────────────────────────────────────────────────────────────

const LEVEL_TINT: Record<number, string> = {
  1: '#CD7F32',
  2: '#A8A8A8',
  3: '#FFD700',
};

const LEVEL_TAG: Record<number, { fr: string; en: string }> = {
  1: { fr: 'Bronze', en: 'Bronze' },
  2: { fr: 'Argent', en: 'Silver' },
  3: { fr: 'Or', en: 'Gold' },
};

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function BadgesScreen() {
  const { colors, isDark, typography: typ, fs } = useTheme();
  const s = useMemo(() => make(colors, isDark, fs), [colors, isDark, fs]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'fr' | 'en';

  const unlocked = useBadgeStore((st) => st.unlockedBadges);
  const unlockedIds = useBadgeStore((st) => st.unlockedIds);
  const [openId, setOpenId] = useState<string | null>(null);

  const progress = Math.round((unlockedIds.length / BADGE_DEFS.length) * 100);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Header ── */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Icon name="chevron-left" size={22} color={colors['on-surface']} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero ── */}
        <Animated.View entering={FadeInDown.delay(80).duration(500)} style={s.hero}>
          <Text style={s.heroLabel}>{t('profile.badges').toUpperCase()}</Text>
          <View style={s.heroRow}>
            <Text style={s.heroNumber}>{unlockedIds.length}</Text>
            <Text style={s.heroTotal}>/{BADGE_DEFS.length}</Text>
          </View>
          <View style={s.bar}>
            <Animated.View
              entering={FadeIn.delay(400).duration(900)}
              style={[s.barFill, { width: `${progress}%` }]}
            />
          </View>
          <Text style={s.heroSub}>{progress}% {lang === 'fr' ? 'complété' : 'completed'}</Text>
        </Animated.View>

        {/* ── List ── */}
        {BADGE_DEFS.map((def, i) => {
          const u = unlocked.find((b) => b.id === def.id);
          const level = u?.level ?? 0;
          const isOpen = openId === def.id;
          const tint = LEVEL_TINT[level] ?? colors['outline-variant'];

          return (
            <Animated.View key={def.id} entering={FadeInDown.delay(120 + i * 40).duration(400)}>
              <Pressable
                style={({ pressed }) => [s.row, pressed && s.rowPressed]}
                onPress={() => setOpenId(isOpen ? null : def.id)}
              >
                {/* Icon */}
                <View style={[s.iconBox, level > 0 && { backgroundColor: `${tint}15` }]}>
                  <Ionicons
                    name={(level > 0 ? def.icon.replace('-outline', '') : def.icon) as any}
                    size={22}
                    color={level > 0 ? tint : colors['outline-variant']}
                  />
                </View>

                {/* Info */}
                <View style={s.rowInfo}>
                  <Text style={[s.rowName, level === 0 && s.dimmed]}>{t(def.labelKey)}</Text>
                  {level > 0 ? (
                    <View style={[s.tag, { backgroundColor: `${tint}18` }]}>
                      <Text style={[s.tagText, { color: tint }]}>{LEVEL_TAG[level]?.[lang]}</Text>
                    </View>
                  ) : (
                    <Text style={s.rowSub}>{lang === 'fr' ? 'Verrouillé' : 'Locked'}</Text>
                  )}
                </View>

                {/* Pips */}
                <View style={s.pips}>
                  {[1, 2, 3].map((l) => (
                    <View key={l} style={[s.pip, level >= l && { backgroundColor: LEVEL_TINT[l] }]} />
                  ))}
                </View>
              </Pressable>

              {/* Expanded */}
              {isOpen && (
                <Animated.View entering={FadeInDown.duration(200)} style={s.detail}>
                  {def.levels.map((lvl) => {
                    const done = level >= lvl.level;
                    const c = LEVEL_TINT[lvl.level];
                    return (
                      <View key={lvl.level} style={s.detailRow}>
                        <View style={[s.detailDot, done && { backgroundColor: c, borderColor: c }]}>
                          {done && <Ionicons name="checkmark" size={12} color="#fff" />}
                        </View>
                        <View style={s.detailText}>
                          <Text style={[s.detailTitle, done && { color: colors['on-surface'] }]}>
                            {LEVEL_TAG[lvl.level]?.[lang]}
                          </Text>
                          <Text style={s.detailDesc}>{t(lvl.descKey)}</Text>
                        </View>
                      </View>
                    );
                  })}
                </Animated.View>
              )}
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const make = (colors: ColorTokens, isDark: boolean, fs: (n: number) => number) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },

    header: {
      paddingHorizontal: spacing[5],
      paddingVertical: spacing[2],
    },

    scroll: {
      paddingHorizontal: spacing[5],
      paddingBottom: spacing[20],
      gap: spacing[2],
    },

    // ── Hero ──
    hero: {
      backgroundColor: colors['surface-container-lowest'],
      borderRadius: 28,
      padding: spacing[6],
      alignItems: 'center',
      marginBottom: spacing[3],
      ...shadows.ambient,
    },
    heroLabel: {
      ...typo['label-sm'],
      color: colors.outline,
      marginBottom: spacing[3],
    },
    heroRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    heroNumber: {
      fontFamily: fonts.thin,
      fontSize: fs(80),
      color: colors['on-surface'],
      lineHeight: fs(85),
    },
    heroTotal: {
      fontFamily: fonts.light,
      fontSize: fs(28),
      color: colors['outline-variant'],
      marginLeft: 4,
    },
    bar: {
      width: '100%',
      height: 4,
      backgroundColor: colors['surface-container-high'],
      borderRadius: 2,
      marginTop: spacing[4],
      overflow: 'hidden',
    },
    barFill: {
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.primary,
    },
    heroSub: {
      fontFamily: fonts.medium,
      fontSize: fs(12),
      color: colors['outline-variant'],
      marginTop: spacing[2],
    },

    // ── Row ──
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      backgroundColor: colors['surface-container-lowest'],
      borderRadius: radius['2xl'],
      padding: spacing[4],
      ...shadows.ambient,
    },
    rowPressed: {
      backgroundColor: colors['surface-container-low'],
    },
    iconBox: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: colors['surface-container-high'],
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowInfo: {
      flex: 1,
      gap: 3,
    },
    rowName: {
      fontFamily: fonts.semibold,
      fontSize: fs(15),
      color: colors['on-surface'],
    },
    dimmed: {
      color: colors['outline-variant'],
    },
    rowSub: {
      fontFamily: fonts.regular,
      fontSize: fs(12),
      color: colors['outline-variant'],
    },
    tag: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: radius.full,
    },
    tagText: {
      fontFamily: fonts.semibold,
      fontSize: fs(10),
      letterSpacing: 0.5,
    },
    pips: {
      flexDirection: 'row',
      gap: 4,
    },
    pip: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors['surface-container-high'],
    },

    // ── Detail ──
    detail: {
      backgroundColor: colors['surface-container-low'],
      marginTop: -spacing[2],
      borderBottomLeftRadius: radius['2xl'],
      borderBottomRightRadius: radius['2xl'],
      padding: spacing[4],
      paddingTop: spacing[5],
      gap: spacing[3],
    },
    detailRow: {
      flexDirection: 'row',
      gap: spacing[3],
      alignItems: 'flex-start',
    },
    detailDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors['surface-container-high'],
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    detailText: {
      flex: 1,
      gap: 2,
    },
    detailTitle: {
      fontFamily: fonts.semibold,
      fontSize: fs(13),
      color: colors['outline-variant'],
    },
    detailDesc: {
      fontFamily: fonts.regular,
      fontSize: fs(12),
      color: colors.outline,
      lineHeight: fs(18),
    },
  });
