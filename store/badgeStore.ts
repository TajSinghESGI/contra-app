import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';
import { getProfile } from '@/services/api';
import i18n from '@/i18n';

const storage = createMMKV();
const BADGES_KEY = 'contra_badges';

// ─── Badge definitions (aligned with backend apps/users/badges.py) ──────────

export interface BadgeLevel {
  level: 1 | 2 | 3;
  labelKey: string;
  descKey: string;
}

export interface BadgeDef {
  id: string;
  icon: string;
  labelKey: string;
  levels: BadgeLevel[];
}

export const BADGE_DEFS: BadgeDef[] = [
  {
    id: 'debatteur',
    icon: 'chatbubbles-outline',
    labelKey: 'badges.debatteur',
    levels: [
      { level: 1, labelKey: 'badges.debatteur', descKey: 'badges.debatteur_1' },
      { level: 2, labelKey: 'badges.debatteur', descKey: 'badges.debatteur_2' },
      { level: 3, labelKey: 'badges.debatteur', descKey: 'badges.debatteur_3' },
    ],
  },
  {
    id: 'score',
    icon: 'star-outline',
    labelKey: 'badges.score',
    levels: [
      { level: 1, labelKey: 'badges.score', descKey: 'badges.score_1' },
      { level: 2, labelKey: 'badges.score', descKey: 'badges.score_2' },
      { level: 3, labelKey: 'badges.score', descKey: 'badges.score_3' },
    ],
  },
  {
    id: 'streak',
    icon: 'flame-outline',
    labelKey: 'badges.streak',
    levels: [
      { level: 1, labelKey: 'badges.streak', descKey: 'badges.streak_1' },
      { level: 2, labelKey: 'badges.streak', descKey: 'badges.streak_2' },
      { level: 3, labelKey: 'badges.streak', descKey: 'badges.streak_3' },
    ],
  },
  {
    id: 'logicien',
    icon: 'git-merge-outline',
    labelKey: 'badges.logicien',
    levels: [
      { level: 1, labelKey: 'badges.logicien', descKey: 'badges.logicien_1' },
      { level: 2, labelKey: 'badges.logicien', descKey: 'badges.logicien_2' },
      { level: 3, labelKey: 'badges.logicien', descKey: 'badges.logicien_3' },
    ],
  },
  {
    id: 'orateur',
    icon: 'megaphone-outline',
    labelKey: 'badges.orateur',
    levels: [
      { level: 1, labelKey: 'badges.orateur', descKey: 'badges.orateur_1' },
      { level: 2, labelKey: 'badges.orateur', descKey: 'badges.orateur_2' },
      { level: 3, labelKey: 'badges.orateur', descKey: 'badges.orateur_3' },
    ],
  },
  {
    id: 'enqueteur',
    icon: 'search-outline',
    labelKey: 'badges.enqueteur',
    levels: [
      { level: 1, labelKey: 'badges.enqueteur', descKey: 'badges.enqueteur_1' },
      { level: 2, labelKey: 'badges.enqueteur', descKey: 'badges.enqueteur_2' },
      { level: 3, labelKey: 'badges.enqueteur', descKey: 'badges.enqueteur_3' },
    ],
  },
  {
    id: 'creatif',
    icon: 'bulb-outline',
    labelKey: 'badges.creatif',
    levels: [
      { level: 1, labelKey: 'badges.creatif', descKey: 'badges.creatif_1' },
      { level: 2, labelKey: 'badges.creatif', descKey: 'badges.creatif_2' },
      { level: 3, labelKey: 'badges.creatif', descKey: 'badges.creatif_3' },
    ],
  },
  {
    id: 'equilibriste',
    icon: 'options-outline',
    labelKey: 'badges.equilibriste',
    levels: [
      { level: 1, labelKey: 'badges.equilibriste', descKey: 'badges.equilibriste_1' },
      { level: 2, labelKey: 'badges.equilibriste', descKey: 'badges.equilibriste_2' },
      { level: 3, labelKey: 'badges.equilibriste', descKey: 'badges.equilibriste_3' },
    ],
  },
  {
    id: 'brutal',
    icon: 'skull-outline',
    labelKey: 'badges.brutal',
    levels: [
      { level: 1, labelKey: 'badges.brutal', descKey: 'badges.brutal_1' },
      { level: 2, labelKey: 'badges.brutal', descKey: 'badges.brutal_2' },
      { level: 3, labelKey: 'badges.brutal', descKey: 'badges.brutal_3' },
    ],
  },
];

const LEVEL_LABELS: Record<1 | 2 | 3, string> = { 1: '🥉', 2: '🥈', 3: '🥇' };

/** Get a badge def + unlocked level info */
export function getBadgeById(id: string) {
  const def = BADGE_DEFS.find((b) => b.id === id);
  if (!def) return undefined;
  const { unlockedBadges } = useBadgeStore.getState();
  const unlocked = unlockedBadges.find((b) => b.id === id);
  return {
    ...def,
    label: i18n.t(def.labelKey),
    unlockedLevel: unlocked?.level ?? 0,
    levelEmoji: unlocked ? LEVEL_LABELS[unlocked.level as 1 | 2 | 3] : undefined,
  };
}

// ─── Store ───────────────────────────────────────────────────────────────────

interface BadgeState {
  unlockedBadges: { id: string; level: number }[];
  unlockedIds: string[];
  sync: () => Promise<void>;
  hydrate: () => void;
}

export const useBadgeStore = create<BadgeState>((set) => ({
  unlockedBadges: [],
  unlockedIds: [],

  hydrate: () => {
    const stored = storage.getString(BADGES_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { id: string; level: number }[];
        set({
          unlockedBadges: parsed,
          unlockedIds: parsed.map((b) => b.id),
        });
      } catch {
        // Corrupted cache
      }
    }
    useBadgeStore.getState().sync().catch(() => {});
  },

  sync: async () => {
    try {
      const profile = await getProfile();
      const badges = (profile.badges ?? []).map((b) => ({
        id: b.badge_id,
        level: b.level,
      }));
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
