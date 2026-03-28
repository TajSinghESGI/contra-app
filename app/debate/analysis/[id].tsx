import { AnimatedScrollProgress } from '@/components/ui/AnimatedScrollProgress';
import Icon from '@/components/ui/Icon';
import { fonts, radius, shadows, spacing, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDebateAnalysis } from '@/services/api';
import type { AnalysisSection } from '@/services/api';

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function AnalysisScreen() {
  const { colors, isDark, typography, fs } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, topic } = useLocalSearchParams<{ id: string; topic?: string }>();
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);
  const [sections, setSections] = useState<AnalysisSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await getDebateAnalysis(id);
        setSections(res.sections);
      } catch {
        setSections([{ title: t('common.error'), body: t('analysis.error') }]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  const handleProgress = useCallback((p: number) => {
    setProgress(Math.round(p));
  }, []);

  return (
    <View style={styles.root}>
      {/* ── Header blur background (masked fade) ── */}
      {Platform.OS !== 'web' && (
        <MaskedView
          style={[styles.headerBlur, { height: insets.top + 80 }]}
          maskElement={
            <LinearGradient
              colors={['black', 'black', 'transparent']}
              locations={[0, 0.6, 1]}
              style={StyleSheet.absoluteFill}
            />
          }
        >
          <BlurView
            intensity={80}
            tint={isDark ? 'systemThickMaterialDark' : 'systemThickMaterialLight'}
            style={StyleSheet.absoluteFill}
          />
        </MaskedView>
      )}

      {/* ── Fixed back button ── */}
      <Pressable
        onPress={() => router.back()}
        style={[styles.backButton, { top: insets.top + 12 }]}
        hitSlop={8}
        accessibilityRole="button"
      >
        <Icon name="chevron-left" size={22} color={colors['on-surface']} />
      </Pressable>

      <AnimatedScrollProgress
        showsVerticalScrollIndicator={false}
        fabWidth={80}
        fabHeight={42}
        fabBottomOffset={20}
        onScrollProgressChange={handleProgress}
        renderInitialContent={() => (
          <Text style={styles.fabText}>{progress}%</Text>
        )}
        renderEndContent={() => (
          <Icon name="circle-check" size={18} color={colors['on-primary']} />
        )}
      >
        <View style={[styles.scrollContent, { paddingTop: insets.top + spacing[16], paddingBottom: insets.bottom + spacing[10] }]}>
          {/* Header */}
          <Text style={styles.label}>{t('analysis.title')}</Text>
          <Text style={styles.title}>{topic || t('analysis.debateNumber', { id })}</Text>
          <Text style={styles.subtitle}>
            {t('analysis.subtitle')}
          </Text>

          {/* Sections */}
          {isLoading ? (
            <View style={{ marginTop: spacing[8], alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.subtitle, { marginTop: spacing[4] }]}>{t('analysis.loading')}</Text>
            </View>
          ) : (
            sections.map((section, i) => (
              <View key={section.title} style={[styles.section, i === 0 && { marginTop: spacing[6] }]}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionBody}>{section.body}</Text>
              </View>
            ))
          )}
        </View>
      </AnimatedScrollProgress>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (colors: ColorTokens, typography: any, fs: (n: number) => number) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9,
  },
  backButton: {
    position: 'absolute',
    left: spacing[5],
    zIndex: 10,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: 18,
    ...shadows.ambient,
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
  },
  label: {
    ...typography['label-sm'],
    color: colors.outline,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fs(28),
    letterSpacing: -0.3,
    color: colors['on-surface'],
    marginTop: spacing[2],
  },
  subtitle: {
    ...typography['body-sm'],
    color: colors['on-surface-variant'],
    marginTop: spacing[2],
  },
  section: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['2xl'],
    padding: spacing[5],
    marginBottom: spacing[4],
    ...shadows.ambient,
  },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: fs(16),
    color: colors['on-surface'],
    letterSpacing: -0.2,
    marginBottom: spacing[3],
  },
  fabText: {
    fontFamily: fonts.semibold,
    fontSize: fs(13),
    textAlign: 'center',
    color: colors['on-primary'],
  },
  sectionBody: {
    fontFamily: fonts.regular,
    fontSize: fs(15),
    lineHeight: fs(24),
    color: colors['on-surface-variant'],
  },
});
