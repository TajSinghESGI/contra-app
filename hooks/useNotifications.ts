import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { registerForPushNotifications } from '@/services/notifications';
import { savePushToken } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

/**
 * Sets up push notification registration and listeners.
 *
 * Call this hook once in the root layout. Registration only happens
 * when the user is logged in.
 */
export function useNotifications() {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const isLogged = useAuthStore((s) => s.isLogged);
  const router = useRouter();

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!isLogged) return;

    // Register and obtain push token, then persist it on the backend
    registerForPushNotifications().then(async (token) => {
      if (token) {
        console.log('[Push Token]', token);
        setPushToken(token);
        try {
          await savePushToken(token);
        } catch (err) {
          console.warn('[Push Token] Failed to save to backend:', err);
        }
      }
    });

    // Listener: notification received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (_notification) => {
        // No-op for now; could update badge count or in-app state
      },
    );

    // Listener: user tapped a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as
          | { screen?: string; debateId?: string; challengeId?: string }
          | undefined;

        if (!data?.screen) return;

        switch (data.screen) {
          case 'debate_result':
            if (data.debateId) {
              router.push(`/debate/result/${data.debateId}` as never);
            }
            break;
          case 'debate':
            if (data.debateId) {
              router.push(`/debate/${data.debateId}` as never);
            }
            break;
          case 'challenge':
            if (data.challengeId) {
              router.push(`/challenge/${data.challengeId}` as never);
            }
            break;
          case 'rankings':
            router.push('/rankings' as never);
            break;
          case 'home':
          default:
            router.push('/(tabs)' as never);
            break;
        }
      },
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [isLogged]);

  return { pushToken };
}
