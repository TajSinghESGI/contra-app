import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';
import { getUserStats } from '@/services/api';
import { XP_THRESHOLDS, type LeagueId } from '@/constants/tokens';

const storage = createMMKV();
const TOTAL_DEBATES_KEY = 'contra_total_debates';
const TOTAL_SCORE_KEY = 'contra_total_score';
const LEVEL_KEY = 'contra_level';
const XP_KEY = 'contra_xp';
const BEST_SCORE_KEY = 'contra_best_score';
const LEAGUE_KEY = 'contra_league';

export interface DebaterLevel {
  id: string;
  label: string;
  xp: number;
}

export const DEBATER_LEVELS: DebaterLevel[] = XP_THRESHOLDS.map((t) => ({
  id: t.id,
  label: t.label,
  xp: t.xp,
}));

function levelFromXp(xp: number): DebaterLevel {
  for (let i = DEBATER_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= DEBATER_LEVELS[i].xp) return DEBATER_LEVELS[i];
  }
  return DEBATER_LEVELS[0];
}

function levelFromId(id: string): DebaterLevel {
  return DEBATER_LEVELS.find((l) => l.id === id) ?? DEBATER_LEVELS[0];
}

interface ProgressionState {
  totalDebates: number;
  totalScore: number;
  xp: number;
  bestScore: number;
  league: LeagueId;
  currentLevel: DebaterLevel;
  /** XP progress within current level (0-1) */
  xpProgress: number;
  /** XP needed to reach next level */
  xpForNextLevel: number;
  sync: () => Promise<void>;
  hydrate: () => void;
}

function computeXpProgress(xp: number, level: DebaterLevel) {
  const idx = DEBATER_LEVELS.findIndex((l) => l.id === level.id);
  const nextLevel = DEBATER_LEVELS[idx + 1];
  if (!nextLevel) return { progress: 1, nextXp: level.xp }; // max level

  const levelXp = xp - level.xp;
  const levelRange = nextLevel.xp - level.xp;
  return {
    progress: Math.min(1, levelXp / levelRange),
    nextXp: nextLevel.xp,
  };
}

export const useProgressionStore = create<ProgressionState>((set) => ({
  totalDebates: 0,
  totalScore: 0,
  xp: 0,
  bestScore: 0,
  league: 'bronze',
  currentLevel: DEBATER_LEVELS[0],
  xpProgress: 0,
  xpForNextLevel: 500,

  hydrate: () => {
    const debates = storage.getNumber(TOTAL_DEBATES_KEY) ?? 0;
    const score = storage.getNumber(TOTAL_SCORE_KEY) ?? 0;
    const xp = storage.getNumber(XP_KEY) ?? 0;
    const bestScore = storage.getNumber(BEST_SCORE_KEY) ?? 0;
    const league = (storage.getString(LEAGUE_KEY) ?? 'bronze') as LeagueId;
    const level = levelFromXp(xp);
    const { progress, nextXp } = computeXpProgress(xp, level);

    set({
      totalDebates: debates,
      totalScore: score,
      xp,
      bestScore,
      league,
      currentLevel: level,
      xpProgress: progress,
      xpForNextLevel: nextXp,
    });

    useProgressionStore.getState().sync().catch(() => {});
  },

  sync: async () => {
    try {
      const stats = await getUserStats();
      const xp = stats.xp ?? 0;
      const bestScore = stats.best_score ?? 0;
      const league = (stats.league ?? 'bronze') as LeagueId;
      const level = levelFromXp(xp);
      const { progress, nextXp } = computeXpProgress(xp, level);

      storage.set(TOTAL_DEBATES_KEY, stats.total_debates);
      storage.set(TOTAL_SCORE_KEY, stats.total_score);
      storage.set(XP_KEY, xp);
      storage.set(BEST_SCORE_KEY, bestScore);
      storage.set(LEAGUE_KEY, league);
      storage.set(LEVEL_KEY, level.id);

      set({
        totalDebates: stats.total_debates,
        totalScore: stats.total_score,
        xp,
        bestScore,
        league,
        currentLevel: level,
        xpProgress: progress,
        xpForNextLevel: nextXp,
      });
    } catch {
      // Offline — keep cached values
    }
  },
}));
