// Centralized analytics service
// All tracking goes through here so we can swap providers easily

import { Mixpanel } from 'mixpanel-react-native';

const MIXPANEL_TOKEN = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN ?? '';

let mixpanel: Mixpanel | null = null;

export async function initAnalytics(): Promise<void> {
  if (!MIXPANEL_TOKEN) {
    console.warn('[Analytics] Missing Mixpanel token');
    return;
  }
  mixpanel = new Mixpanel(MIXPANEL_TOKEN, true); // true = trackAutomaticEvents
  await mixpanel.init();
}

export function identify(userId: string, properties?: Record<string, any>): void {
  mixpanel?.identify(userId);
  if (properties) {
    mixpanel?.getPeople().set(properties);
  }
}

export function track(event: string, properties?: Record<string, any>): void {
  mixpanel?.track(event, properties);
}

export function reset(): void {
  mixpanel?.reset();
}
