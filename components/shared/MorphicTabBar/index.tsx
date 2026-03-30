import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@/components/ui/Icon';
import { fonts, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';

// ─── Config ──────────────────────────────────────────────────────────────────

const TAB_CONFIG: Record<string, { label: string; icon: string; isPng?: boolean }> = {
  index:     { label: 'Feed',   icon: 'home' },
  arenas:    { label: 'Arenas', icon: 'swords', isPng: true },
  friends:   { label: 'Amis',   icon: 'friends' },
  analytics: { label: 'Stats',  icon: 'chart-line' },
  profile:   { label: 'Profil', icon: 'settings-gear-filled' },
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const swordsIcon = require('@/assets/illustration/swords.png');

const TIMING = { duration: 280, easing: Easing.bezier(0.4, 0, 0.2, 1) };

// ─── Tab button ──────────────────────────────────────────────────────────────

function TabButton({
  config,
  isActive,
  onPress,
  onLayout,
  styles,
  activeColor,
  inactiveColor,
}: {
  config: { label: string; icon: string; isPng?: boolean };
  isActive: boolean;
  onPress: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
  styles: ReturnType<typeof createStyles>;
  activeColor: string;
  inactiveColor: string;
}) {
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconColor = isActive ? activeColor : inactiveColor;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withTiming(0.92, { duration: 80 }); }}
      onPressOut={() => { scale.value = withTiming(1, { duration: 150 }); }}
      onLayout={onLayout}
      hitSlop={4}
    >
      <Animated.View style={[styles.tabInner, scaleStyle]}>
        {config.isPng ? (
          <Image
            source={swordsIcon}
            style={[styles.pngIcon, { tintColor: iconColor }]}
            resizeMode="contain"
          />
        ) : (
          <Icon name={config.icon as any} size={18} color={iconColor} />
        )}
        {isActive && (
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>
            {config.label}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

// ─── ContraTabBar ────────────────────────────────────────────────────────────

export function ContraTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const activeIndex = state.index;

  // Pill animated values
  const pillX = useSharedValue(0);
  const pillWidth = useSharedValue(0);
  const ready = useRef(false);
  const tabMeasurements = useRef<Record<number, { x: number; width: number }>>({});

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    width: pillWidth.value,
  }));

  const handleTabLayout = useCallback((index: number, e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    tabMeasurements.current[index] = { x, width };

    if (!ready.current && index === activeIndex) {
      ready.current = true;
      pillX.value = x;
      pillWidth.value = width;
    } else if (ready.current && index === activeIndex) {
      // Re-measure after label appears/disappears
      pillX.value = withTiming(x, TIMING);
      pillWidth.value = withTiming(width, TIMING);
    }
  }, [activeIndex, pillX, pillWidth]);

  useEffect(() => {
    if (!ready.current) return;
    const m = tabMeasurements.current[activeIndex];
    if (!m) return;
    pillX.value = withTiming(m.x, TIMING);
    pillWidth.value = withTiming(m.width, TIMING);
  }, [activeIndex, pillX, pillWidth]);

  const handlePress = useCallback((index: number) => {
    if (activeIndex === index) return;
    const route = state.routes[index];
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) {
      navigation.navigate(route.name);
    }
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    }
  }, [activeIndex, state.routes, navigation]);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 8 }]}>
      <View style={styles.bar}>
        <Animated.View style={[styles.pill, pillStyle]} />

        {state.routes.map((route, i) => {
          const config = TAB_CONFIG[route.name] ?? { label: route.name, icon: 'home' };
          return (
            <TabButton
              key={route.key}
              config={config}
              isActive={activeIndex === i}
              onPress={() => handlePress(i)}
              onLayout={(e) => handleTabLayout(i, e)}
              styles={styles}
              activeColor={colors.primary}
              inactiveColor="rgba(255,255,255,0.55)"
            />
          );
        })}
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (colors: ColorTokens) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 24,
    elevation: 12,
  },
  pill: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 0,
    backgroundColor: '#ffffff',
    borderRadius: 999,
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pngIcon: {
    width: 18,
    height: 18,
  },
  tabLabel: {
    fontSize: 13,
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    fontFamily: fonts.semibold,
    color: colors.primary,
  },
});
