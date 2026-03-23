import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { typography, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';

type TabName = 'index' | 'arenas' | 'analytics' | 'profile';

interface BottomNavProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
}

interface TabConfig {
  name: TabName;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
}

const TABS: TabConfig[] = [
  { name: 'index',     label: 'Feed',      icon: 'home-outline',      iconActive: 'home' },
  { name: 'arenas',   label: 'Arenas',    icon: 'flame-outline',     iconActive: 'flame' },
  { name: 'analytics',label: 'Analytics', icon: 'bar-chart-outline', iconActive: 'bar-chart' },
  { name: 'profile',  label: 'Profile',   icon: 'person-outline',    iconActive: 'person' },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TabItem({
  tab,
  isActive,
  onPress,
}: {
  tab: TabConfig;
  isActive: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.88, { damping: 12, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };

  const iconColor = isActive ? colors.primary : colors['outline-variant'];

  return (
    <AnimatedPressable
      style={[styles.tab, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={tab.label}
    >
      <Ionicons
        name={isActive ? tab.iconActive : tab.icon}
        size={22}
        color={iconColor}
      />
      <Text style={[styles.label, { color: iconColor }]}>
        {tab.label}
      </Text>
    </AnimatedPressable>
  );
}

export default function BottomNav({ activeTab, onTabPress }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.blurBase}>
      <View style={[styles.glassOverlay, StyleSheet.absoluteFillObject]} />
      <View style={[styles.inner, { paddingBottom: insets.bottom }]}>
        {TABS.map((tab) => (
          <TabItem
            key={tab.name}
            tab={tab}
            isActive={activeTab === tab.name}
            onPress={() => onTabPress(tab.name)}
          />
        ))}
      </View>
    </BlurView>
  );
}

const createStyles = (colors: ColorTokens) => StyleSheet.create({
  blurBase: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderTopWidth: 1,
    borderTopColor: colors['glass-border'],
  },
  glassOverlay: {
    backgroundColor: colors.glass,
  },
  inner: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 8,
  },
  label: {
    ...typography['label-sm'],
  },
});
