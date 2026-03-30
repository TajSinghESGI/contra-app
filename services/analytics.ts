// Centralized analytics service
// All tracking goes through here so we can swap providers easily

import { Mixpanel } from 'mixpanel-react-native';

const MIXPANEL_TOKEN = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN ?? '';

let mixpanel: Mixpanel | null = null;
let initPromise: Promise<void> | null = null;

export function initAnalytics(): void {
  if (!MIXPANEL_TOKEN) {
    console.warn('[Analytics] Missing Mixpanel token');
    return;
  }
  if (initPromise) return; // already initializing

  mixpanel = new Mixpanel(MIXPANEL_TOKEN, true);
  initPromise = mixpanel
    .init()
    .then(() => {
      console.log('[Analytics] Mixpanel initialized');
    })
    .catch((err) => {
      console.error('[Analytics] Mixpanel init failed:', err);
      mixpanel = null;
      initPromise = null;
    });
}

async function ensureReady(): Promise<Mixpanel | null> {
  if (initPromise) await initPromise;
  return mixpanel;
}

export async function identify(userId: string, properties?: Record<string, any>): Promise<void> {
  const mp = await ensureReady();
  if (!mp) return;
  mp.identify(userId);
  if (properties) {
    mp.getPeople().set(properties);
  }
}

export async function track(event: string, properties?: Record<string, any>): Promise<void> {
  const mp = await ensureReady();
  if (!mp) return;
  mp.track(event, properties);
}

export async function reset(): Promise<void> {
  const mp = await ensureReady();
  if (!mp) return;
  mp.reset();
}
