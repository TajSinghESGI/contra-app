import { ToastProviderWithViewport } from '@/components/ui/Toast';
import '@/i18n';
import { useAuthStore } from '@/store/authStore';
import { useStreakStore } from '@/store/streakStore';
import { useProgressionStore } from '@/store/progressionStore';
import { useBadgeStore } from '@/store/badgeStore';
import { initializePurchases } from '@/services/revenuecat';
import { initAnalytics } from '@/services/analytics';
import { BottomSheetStackProvider } from '@/components/ui/BottomSheetStack';
import { useTheme } from '@/hooks/useTheme';
import { hasCompletedOnboarding } from '@/store/onboardingStore';
import { useNotifications } from '@/hooks/useNotifications';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/services/queryClient';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import { registerReferral } from '@/services/api';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://0b933526d35efc67bce1a46ce450a6ee@o4511128264704000.ingest.de.sentry.io/4511177690513488',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default Sentry.wrap(function RootLayout() {
  const [fontsLoaded] = useFonts({
    icons: require('../assets/fonts/icons.ttf'),
    'SFProRounded-Thin':     require('../assets/fonts/SF-Pro-Rounded-Thin.otf'),
    'SFProRounded-Light':    require('../assets/fonts/SF-Pro-Rounded-Light.otf'),
    'SFProRounded-Regular':  require('../assets/fonts/SF-Pro-Rounded-Regular.otf'),
    'SFProRounded-Medium':   require('../assets/fonts/SF-Pro-Rounded-Medium.otf'),
    'SFProRounded-Semibold': require('../assets/fonts/SF-Pro-Rounded-Semibold.otf'),
    'SFProRounded-Bold':     require('../assets/fonts/SF-Pro-Rounded-Bold.otf'),
  });

  const { isLogged, isHydrated, hydrate, user } = useAuthStore();
  const hydrateStreak = useStreakStore((s) => s.hydrate);
  const hydrateProgression = useProgressionStore((s) => s.hydrate);
  const hydrateBadges = useBadgeStore((s) => s.hydrate);
  const { colors: themeColors, isDark } = useTheme();
  const router = useRouter();
  const segments = useSegments();

  // Push notifications — registration only fires when isLogged is true (inside the hook)
  useNotifications();

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
    initializePurchases(user?.id ?? undefined);
    initAnalytics();
  }, []);

  // ─── Deeplink: capture invite referrer ────────────────────────────────────
  const referrerIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Check initial URL (cold start)
    Linking.getInitialURL().then((url) => {
      if (url) {
        const match = url.match(/\/invite\/([a-zA-Z0-9-]+)/);
        if (match) referrerIdRef.current = match[1];
      }
    });

    // Listen for URLs while app is open (warm start)
    const sub = Linking.addEventListener('url', ({ url }) => {
      const match = url.match(/\/invite\/([a-zA-Z0-9-]+)/);
      if (match) referrerIdRef.current = match[1];
    });

    return () => sub.remove();
  }, []);

  // Send referral to backend once user is logged in
  useEffect(() => {
    if (isLogged && referrerIdRef.current) {
      const rid = referrerIdRef.current;
      referrerIdRef.current = null;
      registerReferral(rid).catch(() => {});
    }
  }, [isLogged]);

  const ready = fontsLoaded && isHydrated;

  useEffect(() => {
    if (!ready) return;

    const inAuthGroup = segments[0] === 'auth';
    const inFirstLaunch = segments[0] === 'first-launch';
    if (!isLogged && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (isLogged && inAuthGroup) {
      router.replace(hasCompletedOnboarding() ? '/(tabs)' : '/first-launch');
    } else if (isLogged && !inFirstLaunch && !hasCompletedOnboarding()) {
      router.replace('/first-launch');
    }

    SplashScreen.hideAsync();
  }, [ready, isLogged, segments]);

  if (!ready) {
    return null;
  }

  return (
    <ErrorBoundary>
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
              options={{ headerShown: false, animation: 'fade' }}
            />
            <Stack.Screen
              name="debate/result/[id]"
              options={{ headerShown: false, animation: 'fade_from_bottom' }}
            />
            <Stack.Screen
              name="debate/replay/[id]"
              options={{ headerShown: false, animation: 'slide_from_right' }}
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
            <Stack.Screen name="first-launch" options={{ headerShown: false, animation: 'fade' }} />
            <Stack.Screen name="auth" options={{ headerShown: false, animation: 'fade' }} />
            <Stack.Screen name="debate/new" options={{ headerShown: false, animation: 'none' }} />
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
            <Stack.Screen name="challenge/coaching/[id]" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
            <Stack.Screen name="activity/index" options={{ headerShown: false, animation: 'slide_from_right' }} />
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
        </ToastProviderWithViewport>
        </BottomSheetStackProvider>
      </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
    </QueryClientProvider>
    </ErrorBoundary>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
