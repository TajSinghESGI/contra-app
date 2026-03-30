import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@/components/ui/Icon';
import { Toast } from '@/components/ui/Toast';
import { fonts, radius, shadows, spacing, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { getProfile, updateProfile, type AuthUser } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

const TOPIC_KEYS = [
  'ai', 'politics', 'philosophy', 'science',
  'economy', 'environment', 'education', 'health',
  'technology', 'culture', 'sport', 'history',
  'society', 'law', 'ethics', 'religion',
] as const;

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, typography, fs } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);

  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    getProfile()
      .then((p) => {
        setPseudo(p.pseudo ?? '');
        setEmail(p.email ?? '');
        setSelectedTopics(p.selected_topics ?? []);
        setInitialLoading(false);
      })
      .catch(() => setInitialLoading(false));
  }, []);

  const toggleTopic = useCallback((key: string) => {
    setSelectedTopics((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }, []);

  const handleSave = async () => {
    if (isLoading || !pseudo.trim() || selectedTopics.length < 3) return;
    setIsLoading(true);
    try {
      const updated = await updateProfile({ pseudo: pseudo.trim(), selected_topics: selectedTopics });
      const authUser = useAuthStore.getState().user;
      if (authUser) {
        useAuthStore.setState({ user: { ...authUser, pseudo: updated.pseudo, selected_topics: updated.selected_topics } });
      }
      Toast.show(t('settings.editProfile.saved'), { type: 'success', duration: 2000 });
      router.back();
    } catch {
      Toast.show(t('auth.errors.generic'), { type: 'error', duration: 3000 });
    } finally {
      setIsLoading(false);
    }
  };

  const canSave = pseudo.trim().length > 0 && selectedTopics.length >= 3;

  if (initialLoading) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing[3] }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8} accessibilityRole="button">
          <Icon name="chevron-left" size={22} color={colors['on-surface']} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('settings.editProfile.title')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[8] }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Pseudo */}
        <Text style={styles.sectionLabel}>{t('settings.editProfile.pseudoLabel')}</Text>
        <TextInput
          style={styles.input}
          value={pseudo}
          onChangeText={setPseudo}
          placeholder={t('settings.editProfile.pseudoLabel')}
          placeholderTextColor={colors['outline-variant']}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Email */}
        <Text style={[styles.sectionLabel, { marginTop: spacing[6] }]}>{t('settings.editProfile.emailLabel')}</Text>
        <TextInput
          style={[styles.input, { opacity: 0.5 }]}
          value={email}
          editable={false}
        />

        {/* Thématiques */}
        <Text style={[styles.sectionLabel, { marginTop: spacing[6] }]}>{t('settings.editProfile.topicsLabel')}</Text>
        <View style={styles.chipGrid}>
          {TOPIC_KEYS.map((key) => {
            const selected = selectedTopics.includes(key);
            return (
              <Pressable
                key={key}
                onPress={() => toggleTopic(key)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                {selected && (
                  <Icon name="check" size={11} color={colors['surface-container-lowest']} style={{ marginRight: 4 }} />
                )}
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {t(`topics.${key}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.hint}>
          {selectedTopics.length >= 3
            ? t('settings.editProfile.topicsHint', { count: selectedTopics.length })
            : t('auth.register.topics.remaining', { count: 3 - selectedTopics.length })}
        </Text>

        {/* Save */}
        <Pressable
          style={[styles.ctaWrapper, !canSave && { opacity: 0.5 }]}
          onPress={canSave ? handleSave : undefined}
        >
          <LinearGradient
            colors={[colors.primary, colors['primary-dim']]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.ctaGradient}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors['on-primary']} />
            ) : (
              <Text style={styles.ctaText}>{t('profile.save')}</Text>
            )}
          </LinearGradient>
        </Pressable>
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
  sectionLabel: { ...typography['label-sm'], color: colors.outline, marginBottom: spacing[2] },
  input: {
    backgroundColor: colors['surface-container-low'],
    borderRadius: radius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: 14,
    fontFamily: fonts.regular,
    fontSize: fs(15),
    color: colors['on-surface'],
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: radius.full,
    backgroundColor: colors['surface-container-low'],
  },
  chipSelected: { backgroundColor: colors['on-surface'] },
  chipText: { fontFamily: fonts.medium, fontSize: fs(13), color: colors['on-surface'] },
  chipTextSelected: { color: colors['surface-container-lowest'] },
  hint: {
    fontFamily: fonts.regular, fontSize: fs(12), color: colors['outline-variant'],
    textAlign: 'center', marginTop: spacing[4],
  },
  ctaWrapper: {
    marginTop: spacing[6],
    borderRadius: radius.full,
    shadowColor: colors.primary,
    shadowOpacity: 0.10,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 24,
  },
  ctaGradient: {
    borderRadius: radius.full,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontFamily: fonts.semibold, fontSize: fs(15), color: colors['on-primary'], letterSpacing: 0.5 },
});
