export const lightColors = {
  // Surfaces — soft warm off-white hierarchy
  background: '#FCF8F8',
  surface: '#FCF8F8',
  'surface-bright': '#FFFFFF',
  'surface-container-lowest': '#FFFFFF',
  'surface-container-low': '#F6F2F2',
  'surface-container': '#F0ECEC',
  'surface-container-high': '#EAE6E6',
  'surface-container-highest': '#E3DFDF',
  'surface-dim': '#DAD6D6',
  'surface-tint': '#031B44',
  'surface-variant': '#EAE6E6',

  // Primary — deep navy
  primary: '#031B44',
  'primary-dim': '#021230',
  'primary-container': '#DDE4F0',
  'on-primary': '#FCF8F8',
  'on-primary-container': '#031B44',

  // Secondary — muted navy
  secondary: '#1A3055',
  'secondary-container': '#E5ECF4',
  'on-secondary': '#FCF8F8',

  // Tertiary — softer navy
  tertiary: '#2D4A6E',
  'tertiary-container': '#E8EDF5',

  // On-surfaces
  'on-surface': '#031B44',
  'on-surface-variant': '#3A4E6E',
  'on-background': '#031B44',

  // Borders
  outline: '#6B7A92',
  'outline-variant': '#A8B3C2',

  // Error
  error: '#9F403D',
  'error-container': '#F4D4D2',
  'on-error': '#FFF7F6',

  // Inverse
  'inverse-surface': '#02062F',
  'inverse-on-surface': '#C5CEE0',
  'inverse-primary': '#739DCF',

  // Dialectical accents — user (warm) vs AI (navy)
  'accent-user': '#8B1A2A',
  'accent-user-container': 'rgba(139,26,42,0.14)',
  'accent-user-dim': '#6B1420',
  'accent-ai': '#031B44',
  'accent-ai-container': 'rgba(3,27,68,0.12)',
  'accent-ai-dim': '#021230',

  // Glassmorphism
  glass: 'rgba(252,248,248,0.75)',
  'glass-border': 'rgba(107,122,146,0.12)',
} as const;

export type ColorTokens = { [K in keyof typeof lightColors]: string };

export const darkColors: ColorTokens = {
  // Surfaces — deep navy hierarchy
  background: '#02062F',
  surface: '#02062F',
  'surface-bright': '#1A2048',
  'surface-container-lowest': '#080D38',
  'surface-container-low': '#0E1340',
  'surface-container': '#141A48',
  'surface-container-high': '#1A2050',
  'surface-container-highest': '#212758',
  'surface-dim': '#010320',
  'surface-tint': '#739DCF',
  'surface-variant': '#1A2050',

  // Primary — soft sky blue
  primary: '#739DCF',
  'primary-dim': '#5A85BD',
  'primary-container': '#1A3052',
  'on-primary': '#02062F',
  'on-primary-container': '#C5D8F0',

  // Secondary — muted blue
  secondary: '#A0B8D8',
  'secondary-container': '#1E2E4A',
  'on-secondary': '#02062F',

  // Tertiary — lighter blue
  tertiary: '#B8C9E0',
  'tertiary-container': '#243550',

  // On-surfaces
  'on-surface': '#E8EEF7',
  'on-surface-variant': '#A0AFC8',
  'on-background': '#E8EEF7',

  // Borders
  outline: '#5A6B88',
  'outline-variant': '#3F4E68',

  // Error
  error: '#FF8A87',
  'error-container': '#5C1A18',
  'on-error': '#2A0806',

  // Inverse
  'inverse-surface': '#E8EEF7',
  'inverse-on-surface': '#02062F',
  'inverse-primary': '#031B44',

  // Dialectical accents — user (warm) vs AI (blue)
  'accent-user': '#FF8872',
  'accent-user-container': 'rgba(255,136,114,0.12)',
  'accent-user-dim': '#E56F5A',
  'accent-ai': '#739DCF',
  'accent-ai-container': 'rgba(115,157,207,0.12)',
  'accent-ai-dim': '#5A85BD',

  // Glassmorphism
  glass: 'rgba(2,6,47,0.92)',
  'glass-border': 'rgba(115,157,207,0.10)',
} as const;

// Default export for static usage (light mode) — prefer useTheme() for dynamic
export const colors = lightColors;

// Font family map — use these for fontFamily in StyleSheet
export const fonts = {
  thin: 'SFProRounded-Thin',
  light: 'SFProRounded-Light',
  regular: 'SFProRounded-Regular',
  medium: 'SFProRounded-Medium',
  semibold: 'SFProRounded-Semibold',
  bold: 'SFProRounded-Bold',
} as const;

// ─── Font size preference ────────────────────────────────────────────────────

import { createMMKV } from 'react-native-mmkv';

const _fontStorage = createMMKV();
const FONT_SIZE_KEY = 'contra_font_size';

export type FontSizeOption = 'small' | 'default' | 'large';

export const FONT_SIZE_OPTIONS: { id: FontSizeOption; delta: number }[] = [
  { id: 'small', delta: -2 },
  { id: 'default', delta: 0 },
  { id: 'large', delta: 2 },
];

function getStoredDelta(): number {
  const stored = _fontStorage.getString(FONT_SIZE_KEY) as FontSizeOption | undefined;
  const opt = FONT_SIZE_OPTIONS.find((o) => o.id === stored);
  return opt?.delta ?? 0;
}

function buildTypography(bodyDelta: number) {
  return {
    'display-lg': { fontFamily: fonts.light, fontSize: 64, letterSpacing: -1.5 },
    'display-md': { fontFamily: fonts.light, fontSize: 48, letterSpacing: -1 },
    'display-sm': { fontFamily: fonts.light, fontSize: 36, letterSpacing: -0.5 },
    'headline-lg': { fontFamily: fonts.bold, fontSize: 32, letterSpacing: -0.5 },
    'headline-md': { fontFamily: fonts.bold, fontSize: 28, letterSpacing: -0.3 },
    'headline-sm': { fontFamily: fonts.bold, fontSize: 24, letterSpacing: -0.2 },
    'body-lg': { fontFamily: fonts.regular, fontSize: 20 + bodyDelta, lineHeight: 30 + bodyDelta },
    'body-md': { fontFamily: fonts.regular, fontSize: 18 + bodyDelta, lineHeight: 28 + bodyDelta },
    'body-sm': { fontFamily: fonts.regular, fontSize: 16 + bodyDelta, lineHeight: 24 + bodyDelta },
    'label-lg': { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' as const },
    'label-md': { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' as const },
    'label-sm': { fontFamily: fonts.semibold, fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase' as const },
  };
}

export type TypographyTokens = ReturnType<typeof buildTypography>;

export const typography: TypographyTokens = buildTypography(getStoredDelta());

export { buildTypography, getStoredDelta };

export const spacing = {
  1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32,
  9: 36, 10: 40, 12: 48, 16: 64, 20: 80, 22: 88, 24: 96, 28: 112, 32: 128, 40: 160, 48: 192, 64: 256,
} as const;

export const radius = {
  sm: 4, md: 8, lg: 12, xl: 16, '2xl': 20, '3xl': 24, full: 9999,
} as const;

export const shadows = {
  ambient: {
    shadowColor: '#2d3336',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 2,
  },
  float: {
    shadowColor: '#2d3336',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 48,
    elevation: 4,
  },
} as const;

export const DIFFICULTY_LEVELS = [
  { id: 'easy', label: 'Accommodante', systemPromptKey: 'easy' },
  { id: 'medium', label: 'Rigoureuse', systemPromptKey: 'medium' },
  { id: 'hard', label: 'Implacable', systemPromptKey: 'hard' },
  { id: 'brutal', label: 'Brutale', systemPromptKey: 'brutal', premiumOnly: true },
] as const;

export const SCORE_CRITERIA = [
  { key: 'logic', label: 'Logique', weight: 0.30 },
  { key: 'rhetoric', label: 'Rhétorique', weight: 0.25 },
  { key: 'evidence', label: 'Preuves', weight: 0.25 },
  { key: 'originality', label: 'Originalité', weight: 0.20 },
] as const;

// XP multipliers per difficulty
export const XP_MULTIPLIERS: Record<string, number> = {
  easy: 1.0,
  medium: 1.25,
  hard: 1.5,
  brutal: 2.0,
};

// XP thresholds for each level (must match backend CustomUser.XP_THRESHOLDS)
export const XP_THRESHOLDS = [
  { id: 'novice',        xp: 0,     label: 'Novice' },
  { id: 'apprenti',      xp: 500,   label: 'Apprenti' },
  { id: 'rheteur',       xp: 2000,  label: 'Rhéteur' },
  { id: 'grand_rheteur', xp: 5000,  label: 'Grand Rhéteur' },
  { id: 'maitre',        xp: 12000, label: 'Maître' },
] as const;

// League config with colors
export const LEAGUE_CONFIG = {
  bronze:  { color: '#CD7F32', icon: 'shield-outline' as const, label: { fr: 'Bronze', en: 'Bronze' } },
  silver:  { color: '#A8A8A8', icon: 'shield-outline' as const, label: { fr: 'Argent', en: 'Silver' } },
  gold:    { color: '#FFD700', icon: 'shield-outline' as const, label: { fr: 'Or', en: 'Gold' } },
  diamond: { color: '#B9F2FF', icon: 'diamond-outline' as const, label: { fr: 'Diamant', en: 'Diamond' } },
} as const;

export type LeagueId = keyof typeof LEAGUE_CONFIG;

export const PLANS = {
  trial: {
    id: 'trial',
    label: 'Essai gratuit',
    price: 0,
    durationDays: 7,
    requiresCreditCard: false,
    features: ['illimité', 'tous_niveaux', 'classements'] as string[],
  },
  pro_monthly: {
    id: 'pro_monthly',
    label: 'Pro',
    price: 5.99,
    interval: 'month' as const,
    revenueCatId: 'contra_pro_monthly',
    features: ['illimité', 'tous_niveaux', 'classements', 'defis', 'coaching_post_debat', '10_tours'] as string[],
  },
  pro_annual: {
    id: 'pro_annual',
    label: 'Pro Annuel',
    price: 44.99,
    interval: 'year' as const,
    revenueCatId: 'contra_pro_annual',
    savingsBadge: '-37%',
    features: ['illimité', 'tous_niveaux', 'classements', 'defis', 'coaching_post_debat', '10_tours'] as string[],
  },
} as const;

export const CONVERSION_TRIGGER = {
  scoreRange: { min: 60, max: 85 },
  pushTitle: (score: number) => `Tu étais à ${100 - score} points de la victoire`,
  pushBody: "Continue à t'entraîner. Ton essai expire demain.",
  triggerWindowHours: 48,
  noticeBeforeExpiryHours: 24,
  fallbackTitle: 'Ton essai Contra expire demain',
  fallbackBody: "7 jours. Des centaines d'arguments. Continue.",
} as const;

export const PAYWALL_TRIGGERS = [
  'trial_expired',
  'difficulty_brutal_tap',
  'rankings_tab_tap',
  'challenge_friend_tap',
] as const;
