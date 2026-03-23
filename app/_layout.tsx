import { ToastProviderWithViewport } from '@/components/ui/Toast';
import '@/i18n';
import { useAuthStore } from '@/store/authStore';
import { useStreakStore } from '@/store/streakStore';
import { useProgressionStore } from '@/store/progressionStore';
import { useBadgeStore } from '@/store/badgeStore';
import { initializePurchases } from '@/services/revenuecat';
import { BottomSheetStackProvider } from '@/components/ui/BottomSheetStack';
import { useTheme } from '@/hooks/useTheme';
import { DebateTutorial, hasTutorialBeenSeen } from '@/components/debate/DebateTutorial';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/services/queryClient';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    icons: require('../assets/fonts/icons.ttf'),
    'SFProRounded-Thin':     require('../assets/fonts/SF-Pro-Rounded-Thin.otf'),
    'SFProRounded-Light':    require('../assets/fonts/SF-Pro-Rounded-Light.otf'),
    'SFProRounded-Regular':  require('../assets/fonts/SF-Pro-Rounded-Regular.otf'),
    'SFProRounded-Medium':   require('../assets/fonts/SF-Pro-Rounded-Medium.otf'),
    'SFProRounded-Semibold': require('../assets/fonts/SF-Pro-Rounded-Semibold.otf'),
    'SFProRounded-Bold':     require('../assets/fonts/SF-Pro-Rounded-Bold.otf'),
  });

  const { isLogged, isHydrated, hydrate } = useAuthStore();
  const hydrateStreak = useStreakStore((s) => s.hydrate);
  const hydrateProgression = useProgressionStore((s) => s.hydrate);
  const hydrateBadges = useBadgeStore((s) => s.hydrate);
  const { colors: themeColors, isDark } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const [showTutorial, setShowTutorial] = useState(() => !hasTutorialBeenSeen());

  // Theme transition overlay
  const overlayOpacity = useSharedValue(0);
  const isFirstRender = React.useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Quick flash: opaque → transparent to mask re-render
    overlayOpacity.value = withSequence(
      withTiming(1, { duration: 80, easing: Easing.out(Easing.ease) }),
      withTiming(0, { duration: 250, easing: Easing.in(Easing.ease) }),
    );
  }, [isDark]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    pointerEvents: 'none' as const,
  }));

  useEffect(() => {
    hydrate();
    hydrateStreak();
    hydrateProgression();
    hydrateBadges();
    initializePurchases();
  }, []);

  const ready = fontsLoaded && isHydrated;

  useEffect(() => {
    if (!ready) return;

    const inAuthGroup = segments[0] === 'auth';
    if (!isLogged && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (isLogged && inAuthGroup) {
      router.replace('/(tabs)');
    }

    SplashScreen.hideAsync();
  }, [ready, isLogged, segments]);

  if (!ready) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
    <GestureHandlerRootView style={styles.root}>
      <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
      <SafeAreaProvider>
        <BottomSheetStackProvider>
        <ToastProviderWithViewport>
          <Stack
            screenOptions={{
              animation: 'slide_from_right',
              contentStyle: { backgroundColor: themeColors.background },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />
            <Stack.Screen
              name="debate/[id]"
              options={{ headerShown: false, animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="debate/result/[id]"
              options={{ headerShown: false, animation: 'fade_from_bottom' }}
            />
            <Stack.Screen
              name="debate/analysis/[id]"
              options={{ headerShown: false, animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="debate/coach/[id]"
              options={{ headerShown: false, animation: 'slide_from_bottom' }}
            />
            <Stack.Screen name="rankings/index" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding/index" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
            <Stack.Screen name="auth" options={{ headerShown: false, animation: 'fade' }} />
            <Stack.Screen name="debate/new" options={{ headerShown: false, animation: 'fade' }} />
            <Stack.Screen name="debate/history" options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen
              name="paywall/index"
              options={{ headerShown: false, animation: 'slide_from_bottom' }}
            />
            <Stack.Screen name="arena/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="user/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="friends/index" options={{ headerShown: false }} />
            <Stack.Screen name="challenge/[id]" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
            <Stack.Screen name="challenge/debate/[id]" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
            <Stack.Screen name="challenge/result/[id]" options={{ headerShown: false, animation: 'fade_from_bottom' }} />
            <Stack.Screen name="auth/forgot-password" options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: themeColors.background, zIndex: 9999 },
              overlayStyle,
            ]}
          />
          {isLogged && showTutorial && (
            <DebateTutorial onComplete={() => setShowTutorial(false)} />
          )}
        </ToastProviderWithViewport>
        </BottomSheetStackProvider>
      </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
