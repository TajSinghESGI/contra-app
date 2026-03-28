import React, { useEffect, useMemo } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { fonts, spacing, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { createDebate } from '@/services/api';
import { useDebateStore } from '@/store/debateStore';
import type { DifficultyLevel } from '@/store/debateStore';

export default function NewDebateScreen() {
  const { colors, typography, fs } = useTheme();
  const styles = useMemo(() => createStyles(colors, typography, fs), [colors, typography, fs]);
  const router = useRouter();
  const { t } = useTranslation();
  const setDebate = useDebateStore((s) => s.setDebate);
  const resetDebate = useDebateStore((s) => s.reset);
  const { topic = '', topicId = '', difficulty = 'easy' } = useLocalSearchParams<{
    topic: string;
    topicId: string;
    difficulty: string;
  }>();

  useEffect(() => {
    let cancelled = false;

    async function initDebate() {
      try {
        resetDebate();
        const res = await createDebate(topicId || topic, difficulty);

        if (!cancelled) {
          setDebate(res.id, topicId, res.topic, difficulty as DifficultyLevel);
          router.replace({
            pathname: '/debate/[id]',
            params: { id: res.id, topic: res.topic, difficulty },
          });
        }
      } catch (e: any) {
        console.error('Failed to create debate:', e.message);
        if (!cancelled) router.back();
      }
    }

    initDebate();
    return () => { cancelled = true; };
  }, []);

  return (
    <View style={styles.root}>
      <Animated.View entering={FadeIn.duration(400)} style={styles.content}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
        {topic ? (
          <Text style={styles.topic} numberOfLines={2}>{topic}</Text>
        ) : null}
        <Text style={styles.label}>{t('debate.preparing')}</Text>
      </Animated.View>
    </View>
  );
}

const createStyles = (colors: ColorTokens, typography: any, fs: (n: number) => number) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing[8],
    gap: spacing[4],
  },
  spinner: {
    marginBottom: spacing[2],
  },
  topic: {
    ...typography['headline-sm'],
    color: colors['on-surface'],
    textAlign: 'center',
  },
  label: {
    fontFamily: fonts.regular,
    fontSize: fs(14),
    color: colors['on-surface-variant'],
    textAlign: 'center',
  },
});
