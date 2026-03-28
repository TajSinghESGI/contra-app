import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Icon from '@/components/ui/Icon';
import { Accordion } from '@/components/ui/Accordion';
import { fonts, radius, shadows, spacing, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';

export default function FAQScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);

  const FAQ = [
    { q: t('settings.faq.q1'), a: t('settings.faq.a1') },
    { q: t('settings.faq.q2'), a: t('settings.faq.a2') },
    { q: t('settings.faq.q3'), a: t('settings.faq.a3') },
    { q: t('settings.faq.q4'), a: t('settings.faq.a4') },
    { q: t('settings.faq.q5'), a: t('settings.faq.a5') },
    { q: t('settings.faq.q6'), a: t('settings.faq.a6') },
  ];

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8} accessibilityRole="button">
          <Icon name="chevron-left" size={22} color={colors['on-surface']} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('settings.faq.title')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[8] }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>{t('settings.faq.sectionLabel')}</Text>
        <View style={styles.card}>
          <Accordion type="single" spacing={0}>
            {FAQ.map((item) => (
              <Accordion.Item key={item.q} value={item.q}>
                <Accordion.Trigger>
                  <Text style={styles.question}>{item.q}</Text>
                </Accordion.Trigger>
                <Accordion.Content>
                  <Text style={styles.answer}>{item.a}</Text>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ColorTokens, typography: any, fs: (n: number) => number) => StyleSheet.create({
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
  headerTitle: { fontFamily: fonts.semibold, fontSize: fs(16), color: colors['on-surface'], letterSpacing: -0.2 },
  content: { paddingHorizontal: spacing[5], paddingTop: spacing[2] },
  sectionLabel: { ...typography['label-sm'], color: colors.outline, marginBottom: spacing[3] },
  card: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['2xl'], ...shadows.ambient, overflow: 'hidden',
  },
  question: { flex: 1, fontFamily: fonts.medium, fontSize: fs(15), color: colors['on-surface'], lineHeight: fs(22) },
  answer: {
    fontFamily: fonts.regular, fontSize: fs(14), color: colors['on-surface-variant'],
    lineHeight: fs(22), marginTop: spacing[3],
  },
});

