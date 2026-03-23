import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';

interface TopBarProps {
  showLogo?: boolean;
  title?: string;
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
  transparent?: boolean;
}

const BAR_HEIGHT = 56;

export default function TopBar({
  showLogo = true,
  title,
  rightElement,
  leftElement,
  transparent = false,
}: TopBarProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const Content = (
    <>
      {/* Consumes safe-area top so content sits below status bar */}
      <View style={{ height: insets.top }} />

      <View style={styles.row}>
        <View style={styles.slot}>
          {leftElement ?? null}
        </View>

        <View style={styles.center}>
          {showLogo && !title ? (
            <Text style={styles.logo}>CONTRA</Text>
          ) : title ? (
            <Text style={styles.titleText} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
        </View>

        <View style={[styles.slot, styles.slotRight]}>
          {rightElement ?? null}
        </View>
      </View>
    </>
  );

  if (transparent) {
    return (
      <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={styles.blurBase}>
        {/* Semi-transparent tint layer on top of blur */}
        <View style={[StyleSheet.absoluteFillObject, styles.glassOverlay]} />
        {Content}
      </BlurView>
    );
  }

  return (
    <View style={styles.solidBase}>
      {Content}
    </View>
  );
}

const createStyles = (colors: ColorTokens) => StyleSheet.create({
  blurBase: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  glassOverlay: {
    backgroundColor: colors.glass,
  },
  solidBase: {
    backgroundColor: colors.background,
  },
  row: {
    height: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  slot: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  slotRight: {
    alignItems: 'flex-end',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: colors['on-surface'],
  },
  titleText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: colors['on-surface'],
  },
});
