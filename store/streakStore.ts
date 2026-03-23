import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';
import { getProfile } from '@/services/api';

const storage = createMMKV();
const STREAK_KEY = 'contra_streak';
const LONGEST_KEY = 'contra_longest_streak';

interface StreakState {
  currentStreak: number;
  longestStreak: number;
  sync: () => Promise<void>;
  hydrate: () => void;
}

export const useStreakStore = create<StreakState>((set) => ({
  currentStreak: 0,
  longestStreak: 0,

  hydrate: () => {
    // Load cached values so the UI doesn't flash on startup
    const streak = storage.getNumber(STREAK_KEY) ?? 0;
    const longest = storage.getNumber(LONGEST_KEY) ?? 0;
    set({ currentStreak: streak, longestStreak: longest });

    // Then sync from backend in the background
    useStreakStore.getState().sync().catch(() => {});
  },

  sync: async () => {
    try {
      const profile = await getProfile();
      const streak = profile.current_streak;
      const longest = profile.longest_streak;

      // Update MMKV cache
      storage.set(STREAK_KEY, streak);
      storage.set(LONGEST_KEY, longest);

      set({ currentStreak: streak, longestStreak: longest });
    } catch {
      // Offline — keep cached values
    }
  },
}));
