import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';
import { getProfile } from '@/services/api';

const storage = createMMKV();
const BADGES_KEY = 'contra_badges';

// ─── Badge definitions ───────────────────────────────────────────────────────

export interface Badge {
  id: string;
  label: string;
  description: string;
  icon: string;
  level?: 1 | 2 | 3;
}

export const BADGES: Badge[] = [
  // Milestones
  { id: 'first_debate',     label: 'Premier Pas',        description: 'Terminer ton premier débat',                icon: '🎯' },
  { id: '10_debates',       label: 'Habitué',             description: 'Terminer 10 débats',                        icon: '🔟' },
  { id: '25_debates',       label: 'Vétéran',             description: 'Terminer 25 débats',                        icon: '🏅' },
  { id: '50_debates',       label: 'Machine',             description: 'Terminer 50 débats',                        icon: '⚙️' },

  // Scoring
  { id: 'score_80',         label: 'Brillant',            description: 'Obtenir un score de 80+',                   icon: '✨' },
  { id: 'score_90',         label: 'Éloquent',            description: 'Obtenir un score de 90+',                   icon: '👑' },

  // Criteria mastery
  { id: 'logic_master',     label: 'Logicien',            description: 'Obtenir 90%+ en Logique',                   icon: '🧠' },
  { id: 'rhetoric_master',  label: 'Orateur',             description: 'Obtenir 90%+ en Rhétorique',                icon: '🎙️' },
  { id: 'evidence_master',  label: 'Enquêteur',           description: 'Obtenir 90%+ en Preuves',                   icon: '🔍' },
  { id: 'original_master',  label: 'Créatif',             description: 'Obtenir 90%+ en Originalité',               icon: '💡' },

  // Streaks
  { id: 'streak_3',         label: 'En Feu',              description: 'Streak de 3 jours',                         icon: '🔥' },
  { id: 'streak_7',         label: 'Semaine Parfaite',    description: 'Streak de 7 jours',                         icon: '📅' },
  { id: 'streak_30',        label: 'Inarrêtable',         description: 'Streak de 30 jours',                        icon: '💎' },

  // Special
  { id: 'brutal_survivor',  label: 'Survivant',           description: 'Terminer un débat en mode Brutal',          icon: '☠️' },
  { id: 'perfect_balance',  label: 'Équilibriste',        description: 'Obtenir 70%+ sur les 4 critères',           icon: '⚖️' },
];

export function getBadgeById(id: string): (Badge & { level?: number }) | undefined {
  const meta = BADGES.find((b) => b.id === id);
  if (!meta) return undefined;

  // Check if a level is available from the store
  const { unlockedBadges } = useBadgeStore.getState();
  const unlocked = unlockedBadges.find((b) => b.id === id);
  return { ...meta, level: unlocked?.level };
}

// ─── Score context (kept for backward compat) ───────────────────────────────

export interface DebateScoreContext {
  total: number;
  logic: number;
  rhetoric: number;
  evidence: number;
  originality: number;
  difficulty: string;
}

// ─── Store ───────────────────────────────────────────────────────────────────

interface BadgeState {
  unlockedBadges: { id: string; level: number }[];
  /** @deprecated kept for backward compatibility — use unlockedBadges */
  unlockedIds: string[];
  sync: () => Promise<void>;
  hydrate: () => void;
}

export const useBadgeStore = create<BadgeState>((set) => ({
  unlockedBadges: [],
  unlockedIds: [],

  hydrate: () => {
    // Load cached values so the UI doesn't flash on startup
    const stored = storage.getString(BADGES_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { id: string; level: number }[];
        set({
          unlockedBadges: parsed,
          unlockedIds: parsed.map((b) => b.id),
        });
      } catch {
        // Corrupted cache — ignore
      }
    }

    // Then sync from backend in the background
    useBadgeStore.getState().sync().catch(() => {});
  },

  sync: async () => {
    try {
      const profile = await getProfile();
      const badges = (profile.badges ?? []).map((b) => ({
        id: b.badge_id,
        level: b.level,
      }));

      // Update MMKV cache
      storage.set(BADGES_KEY, JSON.stringify(badges));

      set({
        unlockedBadges: badges,
        unlockedIds: badges.map((b) => b.id),
      });
    } catch {
      // Offline — keep cached values
    }
  },
}));
