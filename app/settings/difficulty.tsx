import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Icon from '@/components/ui/Icon';
import { fonts, radius, shadows, spacing, DIFFICULTY_LEVELS, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';

export default function DifficultyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const user = useAuthStore((s) => s.user);
  const isFree = user?.subscription_tier === 'free';
  const [selected, setSelected] = useState<string>('medium');

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8} accessibilityRole="button">
          <Icon name="chevron-left" size={22} color={colors['on-surface']} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('settings.difficulty.title')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[8] }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>{t('settings.difficulty.sectionLabel')}</Text>
        <View style={styles.levels}>
          {DIFFICULTY_LEVELS.map((level) => {
            const isActive = selected === level.id;
            const isLocked = level.premiumOnly || (isFree && (level.id === 'hard' || level.id === 'brutal'));
            return (
              <Pressable
                key={level.id}
                onPress={() => { isLocked ? router.push('/paywall') : setSelected(level.id); }}
                style={[styles.card, isActive && styles.cardActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive, disabled: isLocked }}
              >
                <View style={styles.cardLeft}>
                  <Text style={[styles.cardLabel, isActive && styles.cardLabelActive]}>
                    {level.label}
                  </Text>
                  {isLocked && (
                    <View style={styles.proBadge}>
                      <Icon name="scale" size={9} color="#fff" style={{ marginRight: 2 }} />
                      <Text style={styles.proBadgeText}>{t('common.pro')}</Text>
                    </View>
                  )}
                </View>
                {isActive && (
                  <Icon name="circle-check" size={18} color={colors['on-surface']} />
                )}
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.hint}>
          {t('settings.difficulty.hint')}
        </Text>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ColorTokens, typography: any, fs: (n: number) => number) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5], paddingBottom: spacing[3],
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors['surface-container-lowest'],
    alignItems: 'center', justifyContent: 'center',
    ...shadows.ambient,
  },
  headerTitle: { fontFamily: fonts.semibold, fontSize: fs(16), color: colors['on-surface'], letterSpacing: -0.2 },
  content: { paddingHorizontal: spacing[5], paddingTop: spacing[2] },
  sectionLabel: { ...typography['label-sm'], color: colors.outline, marginBottom: spacing[3] },
  levels: { gap: spacing[2] },
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius.xl, paddingHorizontal: spacing[4], paddingVertical: 14,
    ...shadows.ambient,
  },
  cardActive: { backgroundColor: colors['surface-container-low'] },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  cardLabel: { fontFamily: fonts.medium, fontSize: fs(15), color: colors['on-surface-variant'] },
  cardLabelActive: { fontFamily: fonts.semibold, color: colors['on-surface'] },
  proBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#AF52DE', borderRadius: radius.full,
    paddingHorizontal: spacing[2], paddingVertical: 2,
  },
  proBadgeText: { fontFamily: fonts.bold, fontSize: fs(9), color: '#ffffff', letterSpacing: 0.5 },
  hint: {
    fontFamily: fonts.regular, fontSize: fs(12), color: colors['outline-variant'],
    marginTop: spacing[4], lineHeight: fs(18),
  },
});

