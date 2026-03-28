import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV();
const ONBOARDING_KEY = 'contra_first_launch_completed';
const OLD_TUTORIAL_KEY = 'contra_tutorial_seen';

/** Synchronous check — safe to call outside React. */
export function hasCompletedOnboarding(): boolean {
  if (storage.getBoolean(ONBOARDING_KEY) === true) return true;
  // Migration: users who saw the old tutorial skip the new onboarding
  if (storage.getBoolean(OLD_TUTORIAL_KEY) === true) {
    storage.set(ONBOARDING_KEY, true);
    return true;
  }
  return false;
}

interface OnboardingState {
  isCompleted: boolean;
  markCompleted: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  isCompleted: hasCompletedOnboarding(),
  markCompleted: () => {
    storage.set(ONBOARDING_KEY, true);
    set({ isCompleted: true });
  },
}));
