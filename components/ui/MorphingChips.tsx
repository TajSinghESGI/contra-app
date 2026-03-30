import Icon from '@/components/ui/Icon';
import { fonts } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import * as Haptics from 'expo-haptics';
import React, { memo, useCallback } from 'react';
import type { PressableProps, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ChipItem {
  key: string;
  label: string;
  badge?: number;
  icon?: string;
}

interface MorphingChipsProps {
  items: ChipItem[];
  activeIndex: number;
  onChange: (key: string, index: number) => void;
  borderRadius?: number;
  animationDuration?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const ANIMATION_EASING = Easing.bezier(0.4, 0, 0.2, 1);
const AnimatedPressable = Animated.createAnimatedComponent<PressableProps>(Pressable);


// ─── Tab ─────────────────────────────────────────────────────────────────────

const ChipTab = memo(function ChipTab({
  item,
  index,
  activeIndex,
  totalItems,
  onPress,
  animationProgress,
  previousIndex,
  activeColor,
  inactiveColor,
  tabBg,
  borderRadius,
  textStyle,
}: {
  item: ChipItem;
  index: number;
  activeIndex: number;
  totalItems: number;
  onPress: (index: number) => void;
  animationProgress: SharedValue<number>;
  previousIndex: SharedValue<number>;
  activeColor: string;
  inactiveColor: string;
  tabBg: string;
  borderRadius: number;
  textStyle?: StyleProp<TextStyle>;
}) {
  const isActive = index === activeIndex;
  const isFirst = index === 0;
  const isLast = index === totalItems - 1;

  const rCorners = useAnimatedStyle(() => {
    const progress = animationProgress.value;
    const prevIdx = previousIndex.value;
    const wasActive = prevIdx === index;
    const willBeActive = activeIndex === index;

    // Left radius
    let leftR: number;
    if (willBeActive) {
      const from = wasActive ? borderRadius : (prevIdx === index - 1 || isFirst) ? borderRadius : 0;
      leftR = interpolate(progress, [0, 1], [from, borderRadius]);
    } else if (wasActive) {
      const to = (activeIndex === index - 1 || isFirst) ? borderRadius : 0;
      leftR = interpolate(progress, [0, 1], [borderRadius, to]);
    } else {
      const should = activeIndex === index - 1 || isFirst;
      const was = prevIdx === index - 1 || isFirst;
      leftR = should !== was ? interpolate(progress, [0, 1], [was ? borderRadius : 0, should ? borderRadius : 0]) : (should ? borderRadius : 0);
    }

    // Right radius
    let rightR: number;
    if (willBeActive) {
      const from = wasActive ? borderRadius : (prevIdx === index + 1 || isLast) ? borderRadius : 0;
      rightR = interpolate(progress, [0, 1], [from, borderRadius]);
    } else if (wasActive) {
      const to = (activeIndex === index + 1 || isLast) ? borderRadius : 0;
      rightR = interpolate(progress, [0, 1], [borderRadius, to]);
    } else {
      const should = activeIndex === index + 1 || isLast;
      const was = prevIdx === index + 1 || isLast;
      rightR = should !== was ? interpolate(progress, [0, 1], [was ? borderRadius : 0, should ? borderRadius : 0]) : (should ? borderRadius : 0);
    }

    // Margin
    let mH: number;
    if (willBeActive && !wasActive) mH = interpolate(progress, [0, 1], [0, 6]);
    else if (wasActive && !willBeActive) mH = interpolate(progress, [0, 1], [6, 0]);
    else if (willBeActive && wasActive) mH = 6;
    else mH = 0;

    return {
      borderTopLeftRadius: leftR,
      borderBottomLeftRadius: leftR,
      borderTopRightRadius: rightR,
      borderBottomRightRadius: rightR,
      marginHorizontal: mH,
    };
  }, [activeIndex, borderRadius, isFirst, isLast]);

  const scale = useSharedValue(1);
  const rScale = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPress={() => onPress(index)}
      onPressIn={() => { scale.value = withTiming(0.95, { duration: 100 }); }}
      onPressOut={() => { scale.value = withTiming(1, { duration: 100 }); }}
      style={[styles.tab, { backgroundColor: tabBg }, rCorners, rScale]}
    >
      {item.icon && (
        <Icon name={item.icon} size={12} color={isActive ? activeColor : inactiveColor} style={{ marginRight: 4 }} />
      )}
      <Text
        style={[
          styles.tabText,
          {
            color: isActive ? activeColor : inactiveColor,
            fontFamily: isActive ? fonts.semibold : fonts.regular,
          },
          textStyle,
        ]}
      >
        {item.label}
      </Text>
      {item.badge !== undefined && item.badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.badge}</Text>
        </View>
      )}
    </AnimatedPressable>
  );
});

// ─── Main component ──────────────────────────────────────────────────────────

export const MorphingChips = memo(function MorphingChips({
  items,
  activeIndex,
  onChange,
  borderRadius = 12,
  animationDuration = 300,
  style,
  textStyle,
}: MorphingChipsProps) {
  const { colors, isDark } = useTheme();

  const tabBg = 'transparent';
  const activeBg = colors.primary;
  const activeColor = colors['on-primary'];
  const inactiveColor = colors['on-surface-variant'];

  const animationProgress = useSharedValue(1);
  const previousIndex = useSharedValue(activeIndex);

  const handleTabPress = useCallback((index: number) => {
    if (index === activeIndex) return;
    previousIndex.value = activeIndex;
    animationProgress.value = 0;
    animationProgress.value = withTiming(1, { duration: animationDuration, easing: ANIMATION_EASING });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(items[index].key, index);
  }, [activeIndex, animationProgress, previousIndex, animationDuration, items, onChange]);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.tabsRow}>
        {items.map((item, index) => (
          <ChipTab
            key={item.key}
            item={item}
            index={index}
            activeIndex={activeIndex}
            totalItems={items.length}
            onPress={handleTabPress}
            animationProgress={animationProgress}
            previousIndex={previousIndex}
            activeColor={activeColor}
            inactiveColor={inactiveColor}
            tabBg={index === activeIndex ? activeBg : tabBg}
            borderRadius={borderRadius}
            textStyle={textStyle}
          />
        ))}
      </View>
    </View>
  );
});

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tab: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
    borderRadius: 9999,
  },
  tabText: {
    fontSize: 13,
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: '#FFFFFF',
  },
});

export default MorphingChips;
