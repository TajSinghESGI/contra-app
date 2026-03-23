import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { createMMKV } from 'react-native-mmkv';
import { fonts, radius, spacing, typography, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';

const storage = createMMKV();
const TUTORIAL_SEEN_KEY = 'contra_tutorial_seen';

/** Returns true if tutorial has already been shown */
export function hasTutorialBeenSeen(): boolean {
  return storage.getBoolean(TUTORIAL_SEEN_KEY) === true;
}

/** Marks tutorial as seen */
function markTutorialSeen() {
  storage.set(TUTORIAL_SEEN_KEY, true);
}

const STEPS = [
  {
    emoji: '👋',
    title: 'Bienvenue sur Contra !',
    body: "Débats un sujet, l'IA prend le camp opposé. À toi de convaincre.",
  },
  {
    emoji: '🤖',
    title: "L'IA s'adapte",
    body: "Quelle que soit ta position, l'IA défendra le contraire avec des arguments solides.",
  },
  {
    emoji: '⚡',
    title: 'Arguments rapides',
    body: 'Utilise les suggestions (Contredire, Citer une source…) pour structurer tes arguments.',
  },
  {
    emoji: '📊',
    title: 'Scoring sur 4 critères',
    body: 'Logique (30%), Rhétorique (25%), Preuves (25%), Originalité (20%). Vise l\'équilibre.',
  },
];

interface DebateTutorialProps {
  onComplete: () => void;
}

export function DebateTutorial({ onComplete }: DebateTutorialProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [step, setStep] = useState(0);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLast) {
      markTutorialSeen();
      onComplete();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleSkip = () => {
    markTutorialSeen();
    onComplete();
  };

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={styles.overlay}
    >
      <Pressable style={styles.backdrop} onPress={handleNext} />

      {/* Skip button */}
      <Pressable style={styles.skipBtn} onPress={handleSkip}>
        <Text style={styles.skipText}>Passer</Text>
      </Pressable>

      <Animated.View
        key={step}
        entering={FadeInDown.duration(400)}
        style={styles.card}
      >
        <Text style={styles.emoji}>{current.emoji}</Text>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.body}>{current.body}</Text>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>

          <Pressable style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextText}>
              {isLast ? 'Commencer' : 'Suivant'}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const createStyles = (colors: ColorTokens) => StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  skipBtn: {
    position: 'absolute',
    top: 60,
    right: spacing[6],
    zIndex: 1,
  },
  skipText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
  },
  card: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: radius['3xl'],
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[6],
    alignItems: 'center',
    width: '100%',
    gap: spacing[3],
  },
  emoji: {
    fontSize: 40,
    marginBottom: spacing[1],
  },
  title: {
    ...typography['headline-sm'],
    color: colors['on-surface'],
    textAlign: 'center',
  },
  body: {
    ...typography['body-md'],
    color: colors['on-surface-variant'],
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing[4],
  },
  dots: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors['surface-container-high'],
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 18,
  },
  nextBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
  },
  nextText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors['on-primary'],
  },
});
