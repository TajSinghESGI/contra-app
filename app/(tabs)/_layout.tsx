import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ContraTabBar } from '@/components/shared/MorphicTabBar';
import Icon from '@/components/ui/Icon';
import { fonts, spacing } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useBannerStore } from '@/store/bannerStore';
import { getUserStats } from '@/services/api';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function FreeBanner() {
  const { colors, fs } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const scrollY = useBannerStore((s) => s.scrollY);
  const dailyUsed = useBannerStore((s) => s.dailyUsed);
  const dailyLimit = useBannerStore((s) => s.dailyLimit);

  useEffect(() => {
    if (user?.subscription_tier !== 'free') return;
    getUserStats()
      .then((s) => { useBannerStore.getState().setDaily(s.daily_used, s.daily_limit); })
      .catch(() => {});
  }, [user?.subscription_tier]);

  const bannerHeight = insets.top + 28;
  const hidden = scrollY > 10;

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: withTiming(hidden ? -bannerHeight : 0, { duration: 250, easing: Easing.out(Easing.quad) }) }],
    opacity: withTiming(hidden ? 0 : 1, { duration: 200 }),
  }), [hidden, bannerHeight]);

  const isBannerVisible = user?.subscription_tier === 'free' && dailyLimit !== null;

  useEffect(() => {
    useBannerStore.getState().setVisible(isBannerVisible);
    return () => { useBannerStore.getState().setVisible(false); };
  }, [isBannerVisible]);

  if (!isBannerVisible) return null;

  const remaining = dailyLimit - dailyUsed;
  const exhausted = remaining <= 0;

  return (
    <AnimatedPressable
      style={[styles.banner, { paddingTop: insets.top, backgroundColor: exhausted ? colors['error-container'] : colors['surface-container'] }, rStyle]}
      onPress={() => router.push('/paywall')}
    >
      <Icon name="scale" size={14} color={exhausted ? colors['on-surface'] : colors['on-surface-variant']} />
      <Text style={[styles.bannerText, { color: exhausted ? colors['on-surface'] : colors['on-surface-variant'], fontSize: fs(12) }]}>
        {exhausted ? t('home.dailyLimitReached') : t('home.dailyRemaining', { count: remaining })}
      </Text>
      <Text style={[styles.bannerCta, { color: colors.primary, fontSize: fs(12) }]}>
        {t('home.goProCta')} →
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingBottom: spacing[3],
  },
  bannerText: {
    fontFamily: fonts.medium,
  },
  bannerCta: {
    fontFamily: fonts.semibold,
  },
});

export default function TabLayout() {
  const { t } = useTranslation();
  const pathname = usePathname();

  useEffect(() => {
    useBannerStore.getState().setScrollY(0);
  }, [pathname]);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => <ContraTabBar {...props} />}
        screenOptions={{ headerShown: false, lazy: true }}
      >
        <Tabs.Screen name="index" options={{ title: t('tabs.feed') }} />
        <Tabs.Screen name="arenas" options={{ title: t('tabs.arenas') }} />
        <Tabs.Screen name="friends" options={{ title: t('tabs.friends') }} />
        <Tabs.Screen name="analytics" options={{ title: t('tabs.stats') }} />
        <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
      </Tabs>
      <FreeBanner />
    </View>
  );
}
