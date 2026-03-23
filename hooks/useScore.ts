import { useEffect } from 'react';
import {
  useDerivedValue,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseScoreReturn {
  /** Raw Reanimated shared value (0 → score). Use in worklets / animatedStyle. */
  animatedValue: SharedValue<number>;
  /**
   * Derived shared value that reflects the animated integer for display.
   * Pass to `useAnimatedStyle` or read via `.value` inside a worklet.
   */
  displayValue: SharedValue<number>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Duration of the fill animation in milliseconds. */
const ANIMATION_DURATION_MS = 1200;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Animates a score from 0 to `score` (0–100) using Reanimated v4.
 *
 * @param score - Target score value, expected to be in the range [0, 100].
 * @returns     - `animatedValue` (raw float) and `displayValue` (rounded integer).
 *
 * @example
 * ```tsx
 * const { displayValue } = useScore(score.total);
 *
 * const textStyle = useAnimatedStyle(() => ({
 *   opacity: displayValue.value / 100,
 * }));
 *
 * // Display as integer in an Animated.Text:
 * // <AnimatedText>{Math.round(displayValue.value)}</AnimatedText>
 * ```
 */
export function useScore(score: number): UseScoreReturn {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(score, {
      duration: ANIMATION_DURATION_MS,
    });
    // `animatedValue` is a stable ref from Reanimated; we only need `score`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  /**
   * `displayValue` floors the animated float to an integer so that consuming
   * components can render the number directly without manual rounding.
   */
  const displayValue = useDerivedValue(
    () => Math.round(animatedValue.value),
  );

  return { animatedValue, displayValue };
}
