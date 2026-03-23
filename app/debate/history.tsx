import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { fonts, radius, shadows, spacing, typography, type ColorTokens } from '@/constants/tokens';
import Icon from '@/components/ui/Icon';
import { useTheme } from '@/hooks/useTheme';
import { AnimatedHeaderScrollView } from '@/components/ui/AnimatedHeaderScrollView';
import { getDebateHistory } from '@/services/api';
import type { DebateHistoryEntry } from '@/services/api';

// ─── Debate card ─────────────────────────────────────────────────────────────

function DebateCard({
  debate,
  delay,
  onPress,
}: {
  debate: DebateHistoryEntry;
  delay: number;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const scoreColor =
    debate.score >= 70
      ? '#34C759'
      : debate.score >= 40
        ? colors['on-surface']
        : colors.error;

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(500).easing(Easing.out(Easing.cubic))}
    >
      <Pressable
        style={({ pressed }) => [styles.debateCard, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
        onPress={onPress}
        accessibilityRole="button"
      >
        <View style={styles.debateCardTop}>
          <Text style={styles.debateTopic} numberOfLines={2}>
            {debate.topic}
          </Text>
          <View style={[styles.debateScoreCircle, { borderColor: scoreColor }]}>
            <Text style={[styles.debateScoreValue, { color: scoreColor }]}>
              {debate.score}
            </Text>
          </View>
        </View>
        <View style={styles.debateCardBottom}>
          <Text style={styles.debateDate}>
            {new Date(debate.date).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
          <Text style={styles.debateDifficulty}>{debate.difficulty}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function DebateHistoryScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [debates, setDebates] = useState<DebateHistoryEntry[]>([]);

  useEffect(() => {
    getDebateHistory().then(setDebates).catch(() => {});
  }, []);

  return (
    <View style={styles.root}>
      {/* Floating close button */}
      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        accessibilityRole="button"
        style={[styles.closeButton, { top: insets.top + spacing[2] }]}
      >
        <Icon name="circle-x" size={16} color={colors['on-surface-variant']} />
      </Pressable>

      <AnimatedHeaderScrollView
        largeTitle="Historique"
        subtitle="Tous tes débats"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
        }}
      >
      <View style={styles.list}>
        {debates.length === 0 && (
          <Text style={styles.emptyText}>Aucun débat terminé pour le moment.</Text>
        )}
        {debates.map((debate, i) => (
          <DebateCard
            key={debate.id}
            debate={debate}
            delay={i * 60}
            onPress={() => router.push({ pathname: '/debate/result/[id]', params: { id: debate.id, topic: debate.topic } })}
          />
        ))}
      </View>
    </AnimatedHeaderScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (colors: ColorTokens) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  closeButton: {
    position: 'absolute',
    right: spacing[4],
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[2],
  },
  list: {
    gap: spacing[2],
  },

  debateCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['2xl'],
    padding: spacing[4],
    ...shadows.ambient,
  },
  debateCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  debateTopic: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors['on-surface'],
    lineHeight: 22,
  },
  debateScoreCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  debateScoreValue: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  debateCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[2],
  },
  debateDate: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors['on-surface-variant'],
  },
  debateDifficulty: {
    ...typography['label-sm'],
    color: colors['outline-variant'],
  },

  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors['on-surface-variant'],
    textAlign: 'center',
    paddingVertical: spacing[8],
  },
});
