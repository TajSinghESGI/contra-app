import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';
import { getUserStats } from '@/services/api';

const storage = createMMKV();
const TOTAL_DEBATES_KEY = 'contra_total_debates';
const TOTAL_SCORE_KEY = 'contra_total_score';
const LEVEL_KEY = 'contra_level';

export interface DebaterLevel {
  id: string;
  label: string;
  minDebates: number;
  minAvgScore: number;
}

export const DEBATER_LEVELS: DebaterLevel[] = [
  { id: 'novice',        label: 'Novice',          minDebates: 0,  minAvgScore: 0 },
  { id: 'apprenti',      label: 'Apprenti',        minDebates: 5,  minAvgScore: 30 },
  { id: 'rheteur',       label: 'Rhéteur',         minDebates: 15, minAvgScore: 50 },
  { id: 'grand_rheteur', label: 'Grand Rhéteur',   minDebates: 30, minAvgScore: 65 },
  { id: 'maitre',        label: 'Maître',          minDebates: 50, minAvgScore: 75 },
];

function levelFromId(id: string): DebaterLevel {
  return DEBATER_LEVELS.find((l) => l.id === id) ?? DEBATER_LEVELS[0];
}

interface ProgressionState {
  totalDebates: number;
  totalScore: number;
  currentLevel: DebaterLevel;
  sync: () => Promise<void>;
  hydrate: () => void;
}

export const useProgressionStore = create<ProgressionState>((set) => ({
  totalDebates: 0,
  totalScore: 0,
  currentLevel: DEBATER_LEVELS[0],

  hydrate: () => {
    // Load cached values so the UI doesn't flash on startup
    const debates = storage.getNumber(TOTAL_DEBATES_KEY) ?? 0;
    const score = storage.getNumber(TOTAL_SCORE_KEY) ?? 0;
    const levelId = storage.getString(LEVEL_KEY) ?? 'novice';
    set({ totalDebates: debates, totalScore: score, currentLevel: levelFromId(levelId) });

    // Then sync from backend in the background
    useProgressionStore.getState().sync().catch(() => {});
  },

  sync: async () => {
    try {
      const stats = await getUserStats();

      const level = levelFromId(stats.level);

      // Update MMKV cache
      storage.set(TOTAL_DEBATES_KEY, stats.total_debates);
      storage.set(TOTAL_SCORE_KEY, stats.total_score);
      storage.set(LEVEL_KEY, stats.level);

      set({
        totalDebates: stats.total_debates,
        totalScore: stats.total_score,
        currentLevel: level,
      });
    } catch {
      // Offline — keep cached values
    }
  },
}));
