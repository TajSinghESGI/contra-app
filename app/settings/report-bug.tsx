import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import Icon from '@/components/ui/Icon';
import { reportBug } from '@/services/api';
import { fonts, radius, shadows, spacing, type ColorTokens } from '@/constants/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';

const CATEGORIES = ['Crash', 'Interface', 'Débat / IA', 'Audio', 'Compte', 'Autre'];

export default function ReportBugScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, typography, fs } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const canSend = !!category && description.trim().length > 10;

  const handleSend = async () => {
    if (!canSend) return;
    setIsLoading(true);
    try {
      await reportBug(description);
      setSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8} accessibilityRole="button">
          <Icon name="chevron-left" size={22} color={colors['on-surface']} />
        </Pressable>
        <Text style={styles.headerTitle}>Signaler un bug</Text>
        <View style={{ width: 36 }} />
      </View>

      {!sent ? (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionLabel}>CATÉGORIE</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setCategory(cat)}
                style={[styles.catPill, category === cat && styles.catPillActive]}
                accessibilityRole="button"
              >
                <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionLabel}>DESCRIPTION</Text>
          <View style={styles.textAreaWrapper}>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder="Décris le problème rencontré, les étapes pour le reproduire…"
              placeholderTextColor={colors['outline-variant']}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text style={styles.charCount}>{description.length}/1000</Text>
          </View>
        </ScrollView>
      ) : (
        <Animated.View entering={FadeIn.duration(400)} style={styles.successContainer}>
          <Icon name="circle-check" size={40} color={colors.primary} />
          <Text style={styles.successTitle}>Merci !</Text>
          <Text style={styles.successBody}>
            Ton rapport a bien été envoyé. On analyse ça rapidement.
          </Text>
          <Pressable onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Retour au profil</Text>
          </Pressable>
        </Animated.View>
      )}

      {!sent && (
        <View style={[styles.ctaArea, { paddingBottom: Math.max(insets.bottom, spacing[5]) }]}>
          <Pressable
            onPress={handleSend}
            disabled={!canSend || isLoading}
            style={[styles.ctaWrapper, (!canSend || isLoading) && styles.ctaDisabled]}
            accessibilityRole="button"
          >
            <LinearGradient
              colors={[colors.primary, colors['primary-dim']]}
              start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
              style={styles.ctaGradient}
            >
              {isLoading
                ? <ActivityIndicator size="small" color={colors['on-primary']} />
                : <Text style={styles.ctaText}>Envoyer le rapport</Text>
              }
            </LinearGradient>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
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

  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[5] },
  catPill: {
    borderRadius: radius.full, paddingHorizontal: spacing[4], paddingVertical: spacing[2],
    backgroundColor: colors['surface-container-low'],
  },
  catPillActive: { backgroundColor: colors['on-surface'] },
  catText: { fontFamily: fonts.medium, fontSize: fs(13), color: colors['on-surface'] },
  catTextActive: { color: colors['surface-container-lowest'] },

  textAreaWrapper: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius.xl, padding: spacing[4], ...shadows.ambient,
    marginBottom: spacing[5],
  },
  textArea: {
    fontFamily: fonts.regular, fontSize: fs(15), color: colors['on-surface'],
    lineHeight: fs(22), minHeight: 120,
  },
  charCount: {
    fontFamily: fonts.regular, fontSize: fs(11),
    color: colors['outline-variant'], textAlign: 'right', marginTop: spacing[2],
  },

  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[8], gap: spacing[3] },
  successTitle: { ...typography['headline-sm'], color: colors['on-surface'] },
  successBody: { ...typography['body-sm'], color: colors['on-surface-variant'], textAlign: 'center' },
  backLink: { marginTop: spacing[4] },
  backLinkText: { fontFamily: fonts.semibold, fontSize: fs(14), color: colors.primary },

  ctaArea: {
    paddingHorizontal: spacing[5], paddingTop: spacing[4],
    backgroundColor: colors.background,
  },
  ctaWrapper: {
    borderRadius: radius.full,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10, shadowRadius: 24, elevation: 3,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaGradient: { height: 52, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: fonts.semibold, fontSize: fs(15), color: colors['on-primary'], letterSpacing: 0.5 },
});

