import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';
import { getProfile, updateProfile } from '@/services/api';

const storage = createMMKV();
const STREAK_KEY = 'contra_streak';
const LONGEST_KEY = 'contra_longest_streak';
const MILESTONE_KEY = 'contra_last_milestone';

const STREAK_MILESTONES = [3, 7, 14, 30] as const;

interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastCelebratedMilestone: number;
  sync: () => Promise<void>;
  hydrate: () => void;
  checkMilestone: () => number | null;
  celebrateMilestone: (milestone: number) => void;
}

export const useStreakStore = create<StreakState>((set, get) => ({
  currentStreak: 0,
  longestStreak: 0,
  lastCelebratedMilestone: 0,

  hydrate: () => {
    // Load cached values so the UI doesn't flash on startup
    const streak = storage.getNumber(STREAK_KEY) ?? 0;
    const longest = storage.getNumber(LONGEST_KEY) ?? 0;
    const milestone = storage.getNumber(MILESTONE_KEY) ?? 0;
    set({ currentStreak: streak, longestStreak: longest, lastCelebratedMilestone: milestone });

    // Then sync from backend in the background
    useStreakStore.getState().sync().catch(() => {});
  },

  sync: async () => {
    try {
      const profile = await getProfile();
      const streak = profile.current_streak;
      const longest = profile.longest_streak;
      const milestone = profile.last_celebrated_milestone ?? 0;

      // Update MMKV cache
      storage.set(STREAK_KEY, streak);
      storage.set(LONGEST_KEY, longest);
      storage.set(MILESTONE_KEY, milestone);

      set({ currentStreak: streak, longestStreak: longest, lastCelebratedMilestone: milestone });
    } catch {
      // Offline — keep cached values
    }
  },

  checkMilestone: () => {
    const { currentStreak, lastCelebratedMilestone } = get();
    const milestone = STREAK_MILESTONES.find(
      (m) => currentStreak >= m && lastCelebratedMilestone < m,
    );
    return milestone ?? null;
  },

  celebrateMilestone: (milestone: number) => {
    set({ lastCelebratedMilestone: milestone });
    storage.set(MILESTONE_KEY, milestone);

    // Persist to backend (fire and forget)
    updateProfile({ last_celebrated_milestone: milestone }).catch(() => {});
  },
}));
