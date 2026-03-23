import React, { useState, useMemo } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Icon from '@/components/ui/Icon';
import { fonts, radius, shadows, spacing, typography, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    new_debates: true,
    results: true,
    rankings: true,
    challenges: true,
    promotions: false,
  });

  const NOTIFICATIONS = [
    { id: 'new_debates',  label: t('settings.notifications.newDebates'),  subtitle: t('settings.notifications.newDebatesSub') },
    { id: 'results',      label: t('settings.notifications.results'),     subtitle: t('settings.notifications.resultsSub') },
    { id: 'rankings',     label: t('settings.notifications.rankings'),    subtitle: t('settings.notifications.rankingsSub') },
    { id: 'challenges',   label: t('settings.notifications.challenges'),  subtitle: t('settings.notifications.challengesSub') },
    { id: 'promotions',   label: t('settings.notifications.offers'),      subtitle: t('settings.notifications.offersSub') },
  ];

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8} accessibilityRole="button">
          <Icon name="chevron-left" size={22} color={colors['on-surface']} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('settings.notifications.title')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[8] }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>{t('settings.notifications.sectionLabel')}</Text>
        <View style={styles.card}>
          {NOTIFICATIONS.map((item, i) => (
            <View
              key={item.id}
              style={[styles.row, i < NOTIFICATIONS.length - 1 && styles.rowBorder]}
            >
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
              </View>
              <Switch
                value={enabled[item.id]}
                onValueChange={(v) => setEnabled((prev) => ({ ...prev, [item.id]: v }))}
                trackColor={{ false: colors['surface-container-high'], true: colors.primary }}
                thumbColor={colors['surface-container-lowest']}
              />
            </View>
          ))}
        </View>
        <Text style={styles.hint}>
          {t('settings.notifications.hint')}
        </Text>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ColorTokens) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors['surface-container-lowest'],
    alignItems: 'center', justifyContent: 'center',
    ...shadows.ambient,
  },
  headerTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors['on-surface'],
    letterSpacing: -0.2,
  },
  content: { paddingHorizontal: spacing[5], paddingTop: spacing[2] },
  sectionLabel: { ...typography['label-sm'], color: colors.outline, marginBottom: spacing[3] },
  card: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['2xl'],
    ...shadows.ambient,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: 14,
    gap: spacing[3],
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors['surface-container-low'] },
  rowText: { flex: 1 },
  rowLabel: { fontFamily: fonts.medium, fontSize: 15, color: colors['on-surface'] },
  rowSubtitle: { fontFamily: fonts.regular, fontSize: 12, color: colors['on-surface-variant'], marginTop: 2 },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors['outline-variant'],
    marginTop: spacing[4],
    lineHeight: 18,
  },
});

