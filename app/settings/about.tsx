import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Image, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Icon from '@/components/ui/Icon';
import { fonts, radius, shadows, spacing, typography, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';

const APP_VERSION = '1.0.0';

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const LINKS = [
    { label: t('settings.about.privacyPolicy'), url: 'https://contra.app/privacy' },
    { label: t('settings.about.terms'),          url: 'https://contra.app/terms' },
    { label: t('settings.about.website'),        url: 'https://contra.app' },
  ];

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8} accessibilityRole="button">
          <Icon name="chevron-left" size={22} color={colors['on-surface']} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('settings.about.title')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[8] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand block */}
        <View style={styles.brandCard}>
          <View style={styles.logoBadge}>
            <Image
              source={require('@/assets/images/logo-contra.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.wordmark}>{t('common.appName')}</Text>
          <Text style={styles.tagline}>{t('settings.about.tagline')}</Text>
          <Text style={styles.version}>{t('settings.about.version', { version: APP_VERSION })}</Text>
        </View>

        {/* Description */}
        <Text style={styles.sectionLabel}>{t('settings.about.concept')}</Text>
        <View style={styles.textCard}>
          <Text style={styles.body}>
            {t('settings.about.conceptBody')}
          </Text>
        </View>

        {/* Links */}
        <Text style={styles.sectionLabel}>{t('settings.about.links')}</Text>
        <View style={styles.card}>
          {LINKS.map((link, i) => (
            <Pressable
              key={link.url}
              onPress={() => Linking.openURL(link.url)}
              style={[styles.linkRow, i < LINKS.length - 1 && styles.linkBorder]}
              accessibilityRole="link"
            >
              <Text style={styles.linkLabel}>{link.label}</Text>
              <Icon name="chevron-right" size={16} color={colors['outline-variant']} />
            </Pressable>
          ))}
        </View>

        <Text style={styles.copyright}>{t('settings.about.copyright')}</Text>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ColorTokens) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[5], paddingBottom: spacing[3],
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors['surface-container-lowest'],
    alignItems: 'center', justifyContent: 'center', ...shadows.ambient,
  },
  headerTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors['on-surface'], letterSpacing: -0.2 },
  content: { paddingHorizontal: spacing[5], paddingTop: spacing[2] },
  sectionLabel: { ...typography['label-sm'], color: colors.outline, marginBottom: spacing[3], marginTop: spacing[5] },

  brandCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['3xl'], padding: spacing[7],
    alignItems: 'center', ...shadows.ambient, marginBottom: spacing[5],
  },
  logoBadge: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: colors['inverse-surface'],
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing[3],
  },
  logoImage: { width: 40, height: 40 },
  wordmark: {
    fontFamily: fonts.bold, fontSize: 28, letterSpacing: -1,
    color: colors['on-surface'], marginBottom: spacing[1],
  },
  tagline: {
    fontFamily: fonts.regular, fontSize: 13,
    color: colors['on-surface-variant'], textAlign: 'center',
    marginBottom: spacing[3],
  },
  version: { fontFamily: fonts.regular, fontSize: 12, color: colors.outline },

  textCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['2xl'], padding: spacing[5],
    ...shadows.ambient,
  },
  body: {
    fontFamily: fonts.regular, fontSize: 15, lineHeight: 24,
    color: colors['on-surface'],
  },

  card: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['2xl'], ...shadows.ambient, overflow: 'hidden',
  },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[4], paddingVertical: 14,
  },
  linkBorder: { borderBottomWidth: 1, borderBottomColor: colors['surface-container-low'] },
  linkLabel: { fontFamily: fonts.regular, fontSize: 15, color: colors['on-surface'] },
  copyright: {
    fontFamily: fonts.regular, fontSize: 11, color: colors['outline-variant'],
    textAlign: 'center', marginTop: spacing[6],
  },
});

