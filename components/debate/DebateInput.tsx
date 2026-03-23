import Icon from '@/components/ui/Icon';
import { fonts, radius, spacing, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useMemo, useRef } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

// ─── Constants ───────────────────────────────────────────────────────────────

// Base geometry — collapsed height, also used for border radius and send button sizing
const MIN_HEIGHT = 52;
// Expanded height on focus (reveals quick-action chips in lower half)
const MAX_HEIGHT = 2 * MIN_HEIGHT;
// Send button matches collapsed input height for visual rhythm
const SEND_BTN_SIZE = 44;
// Gap between input pill and send button — used in width interpolation
const INPUT_SEND_GAP = 10;

const QUICK_ACTION_KEYS = ['contradict', 'example', 'source', 'rephrase'] as const;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Props ───────────────────────────────────────────────────────────────────

interface DebateInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onQuickAction: (action: string) => void;
  disabled?: boolean;
  paddingBottom: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const DebateInput = memo(function DebateInput({
  value,
  onChangeText,
  onSend,
  onQuickAction,
  disabled = false,
  paddingBottom,
}: DebateInputProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const textInputRef = useRef<TextInput>(null);
  const { t } = useTranslation();

  // Single source of truth for focus progress (0 = idle, 1 = focused)
  const focusProgress = useSharedValue(0);
  // Measured max row width (captured once)
  const maxRowWidth = useSharedValue(0);

  const canSend = value.trim().length > 0 && !disabled;

  const handleSend = () => {
    if (!canSend) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Keyboard.dismiss();
    onSend();
  };

  const handleChipPress = (action: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onQuickAction(action);
  };

  // ─── Animated styles ─────────────────────────────────────────────────────

  // Root container: collapse safe-area padding when focused (keyboard pushes it up)
  const rRootStyle = useAnimatedStyle(() => ({
    paddingBottom: interpolate(focusProgress.value, [0, 1], [paddingBottom, 12]),
  }));

  // Input pill: grows width (takes send button space) + height (reveals chips)
  const rPillStyle = useAnimatedStyle(() => {
    const width = interpolate(
      focusProgress.value,
      [0, 1],
      [
        maxRowWidth.value - SEND_BTN_SIZE - INPUT_SEND_GAP, // collapsed: leave room for send btn
        maxRowWidth.value, // focused: full width
      ],
    );
    const height = interpolate(
      focusProgress.value,
      [0, 1],
      [MIN_HEIGHT, MAX_HEIGHT],
    );
    return {
      width,
      height,
      overflow: focusProgress.value > 0.5 ? 'visible' as const : 'hidden' as const,
    };
  });

  // Send button slides out to the right on focus
  const rSendStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(focusProgress.value, [0, 1], [0, SEND_BTN_SIZE + INPUT_SEND_GAP]) },
    ],
    opacity: interpolate(focusProgress.value, [0, 0.4], [1, 0]),
  }));

  // Quick action chips: only visible when focused (appear in expanded lower half)
  const rChipsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(focusProgress.value, [0.5, 1], [0, 1]),
    pointerEvents: focusProgress.value > 0.5 ? 'auto' as const : 'none' as const,
  }));

  // TextInput overlay: only receives touches when focused
  const rInputOverlayStyle = useAnimatedStyle(() => ({
    pointerEvents: focusProgress.value > 0.5 ? 'auto' as const : 'none' as const,
  }));

  // Send button inside expanded pill (visible only when focused, replaces the outer one)
  const rInnerSendStyle = useAnimatedStyle(() => ({
    opacity: interpolate(focusProgress.value, [0.5, 1], [0, 1]),
    pointerEvents: focusProgress.value > 0.5 ? 'auto' as const : 'none' as const,
  }));

  return (
    <Animated.View style={[styles.root, rRootStyle]}>
      <View
        style={styles.row}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (maxRowWidth.value === 0 && w > 0) {
            maxRowWidth.value = w;
          }
        }}
      >
        {/* ── Input pill ── */}
        <Animated.View style={[styles.pill, rPillStyle]}>
          {/* Top half: tap target + absolutely positioned TextInput */}
          <View style={styles.topHalf}>
            {/* Pressable tap target — focuses the input on press */}
            <Pressable
              style={styles.tapTarget}
              onPress={() => {
                focusProgress.value = withSpring(1, { damping: 40, stiffness: 500 });
                textInputRef.current?.focus();
              }}
            />

            {/* Absolutely positioned TextInput — multiline expands naturally */}
            <Animated.View
              style={[styles.inputOverlay, rInputOverlayStyle]}
            >
              <TextInput
                ref={textInputRef}
                style={[styles.textInput, { color: colors['on-surface'] }]}
                value={value}
                onChangeText={onChangeText}
                placeholder={t('debate.inputPlaceholder')}
                placeholderTextColor={colors['outline-variant']}
                selectionColor={colors.primary}
                multiline
                numberOfLines={5}
                onBlur={() => {
                  focusProgress.value = withSpring(0, { damping: 40, stiffness: 500 });
                }}
              />
            </Animated.View>
          </View>

          {/* Bottom half: quick action chips (visible only when expanded) */}
          <Animated.View style={[styles.bottomHalf, rChipsStyle]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsContent}
              keyboardShouldPersistTaps="always"
            >
              {QUICK_ACTION_KEYS.map((key) => (
                <Pressable
                  key={key}
                  style={styles.chip}
                  onPress={() => handleChipPress(t(`debate.quickActions.${key}`))}
                >
                  <Text style={styles.chipText}>{t(`debate.quickActions.${key}`)}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Inner send button — appears when expanded */}
            <Animated.View style={rInnerSendStyle}>
              <Pressable onPress={handleSend} disabled={!canSend}>
                <LinearGradient
                  colors={[colors.primary, colors['primary-dim']]}
                  style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
                >
                  <Icon
                    name="arrow-right"
                    size={16}
                    color={colors['on-primary']}
                    style={{ transform: [{ rotate: '-90deg' }] }}
                  />
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </Animated.View>

        {/* ── Outer send button (slides out on focus) ── */}
        <AnimatedPressable
          style={[styles.outerSendBtn, rSendStyle]}
          onPress={handleSend}
          disabled={!canSend}
        >
          <LinearGradient
            colors={[colors.primary, colors['primary-dim']]}
            style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
          >
            <Icon
              name="arrow-right"
              size={16}
              color={colors['on-primary']}
              style={{ transform: [{ rotate: '-90deg' }] }}
            />
          </LinearGradient>
        </AnimatedPressable>
      </View>
    </Animated.View>
  );
});

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (colors: ColorTokens) => StyleSheet.create({
  root: {
    paddingHorizontal: spacing[3],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: INPUT_SEND_GAP,
  },

  // Input pill
  pill: {
    backgroundColor: colors['surface-container'],
    borderRadius: MIN_HEIGHT / 2,
    borderWidth: 1,
    borderColor: colors['glass-border'],
    borderCurve: 'continuous',
  },
  topHalf: {
    height: MIN_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tapTarget: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    paddingLeft: spacing[5],
  },
  inputOverlay: {
    position: 'absolute',
    left: -1,
    right: -1,
    bottom: -1,
    minHeight: MIN_HEIGHT,
    justifyContent: 'center',
    backgroundColor: colors['surface-container'],
    borderTopLeftRadius: MIN_HEIGHT / 2,
    borderTopRightRadius: MIN_HEIGHT / 2,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors['glass-border'],
    ...(Platform.OS === 'ios' ? { paddingBottom: 12 } : {}),
    paddingTop: 8,
  },
  textInput: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 22,
    paddingHorizontal: spacing[5],
    paddingTop: 4,
  },

  // Bottom half — chips row
  bottomHalf: {
    height: MIN_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    gap: spacing[2],
  },
  chipsContent: {
    gap: spacing[2],
    alignItems: 'center',
    flexGrow: 1,
  },
  chip: {
    backgroundColor: colors['surface-container-high'],
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  chipText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors['on-surface-variant'],
  },

  // Send buttons
  sendBtn: {
    width: SEND_BTN_SIZE,
    height: SEND_BTN_SIZE,
    borderRadius: SEND_BTN_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.35,
  },
  outerSendBtn: {
    // positioned in the row next to the pill
  },
});

export default DebateInput;
