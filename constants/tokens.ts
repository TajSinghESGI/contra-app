export const lightColors = {
  // Surfaces
  background: '#f9f9fa',
  surface: '#f9f9fa',
  'surface-bright': '#f9f9fa',
  'surface-container-lowest': '#ffffff',
  'surface-container-low': '#f2f4f5',
  'surface-container': '#ebeef0',
  'surface-container-high': '#e4e9ec',
  'surface-container-highest': '#dde3e7',
  'surface-dim': '#d3dbdf',
  'surface-tint': '#2B3F52',
  'surface-variant': '#dde3e7',

  // Primary
  primary: '#2B3F52',
  'primary-dim': '#1F3042',
  'primary-container': '#dfe5ea',
  'on-primary': '#f5f8fa',
  'on-primary-container': '#2B3F52',

  // Secondary
  secondary: '#364B60',
  'secondary-container': '#dde4eb',
  'on-secondary': '#f5f8fa',

  // Tertiary
  tertiary: '#3D5268',
  'tertiary-container': '#e0e7ee',

  // On-surfaces
  'on-surface': '#2d3336',
  'on-surface-variant': '#5a6063',
  'on-background': '#2d3336',

  // Borders
  outline: '#757c7f',
  'outline-variant': '#adb3b6',

  // Error
  error: '#9f403d',
  'error-container': '#fe8983',
  'on-error': '#fff7f6',

  // Inverse
  'inverse-surface': '#0E1926',
  'inverse-on-surface': '#9c9d9e',
  'inverse-primary': '#ffffff',

  // Dialectical accents — user vs AI
  'accent-user': '#6B1D2A',
  'accent-user-container': 'rgba(107,29,42,0.14)',
  'accent-user-dim': '#541724',
  'accent-ai': '#2A3A50',
  'accent-ai-container': 'rgba(42,58,80,0.12)',
  'accent-ai-dim': '#1E2C3E',

  // Glassmorphism
  glass: 'rgba(249,249,250,0.75)',
  'glass-border': 'rgba(173,179,182,0.12)',
} as const;

export type ColorTokens = { [K in keyof typeof lightColors]: string };

export const darkColors: ColorTokens = {
  // Surfaces — neutral dark gray, hiérarchie ascendante
  background: '#181818',
  surface: '#181818',
  'surface-bright': '#2A2A2A',
  'surface-container-lowest': '#1F1F1F',
  'surface-container-low': '#262626',
  'surface-container': '#2D2D2D',
  'surface-container-high': '#353535',
  'surface-container-highest': '#3D3D3D',
  'surface-dim': '#111111',
  'surface-tint': '#FF5722',
  'surface-variant': '#353535',

  // Primary — vibrant orange
  primary: '#FF5722',
  'primary-dim': '#E64A19',
  'primary-container': '#3D1A0E',
  'on-primary': '#FFFFFF',
  'on-primary-container': '#FFCCBC',

  // Secondary — deep purple
  secondary: '#9575CD',
  'secondary-container': '#2A1650',
  'on-secondary': '#FFFFFF',

  // Tertiary — bright yellow
  tertiary: '#FFEB3B',
  'tertiary-container': '#3D3510',

  // On-surfaces
  'on-surface': '#F7F7F7',
  'on-surface-variant': '#A0A0A0',
  'on-background': '#F7F7F7',

  // Borders
  outline: '#6E6E6E',
  'outline-variant': '#626262',

  // Error
  error: '#FF6B68',
  'error-container': '#5C1A18',
  'on-error': '#2A0806',

  // Inverse
  'inverse-surface': '#F7F7F7',
  'inverse-on-surface': '#181818',
  'inverse-primary': '#E64A19',

  // Dialectical accents — orange user vs purple AI
  'accent-user': '#FF5722',
  'accent-user-container': 'rgba(255,87,34,0.12)',
  'accent-user-dim': '#E64A19',
  'accent-ai': '#9575CD',
  'accent-ai-container': 'rgba(103,58,183,0.12)',
  'accent-ai-dim': '#7E57C2',

  // Glassmorphism
  glass: 'rgba(24,24,24,0.92)',
  'glass-border': 'rgba(255,87,34,0.08)',
} as const;

// Default export for static usage (light mode) — prefer useTheme() for dynamic
export const colors = lightColors;

// Font family map — use these for fontFamily in StyleSheet
export const fonts = {
  thin:     'SFProRounded-Thin',
  light:    'SFProRounded-Light',
  regular:  'SFProRounded-Regular',
  medium:   'SFProRounded-Medium',
  semibold: 'SFProRounded-Semibold',
  bold:     'SFProRounded-Bold',
} as const;

// ─── Font size preference ────────────────────────────────────────────────────

import { createMMKV } from 'react-native-mmkv';

const _fontStorage = createMMKV();
const FONT_SIZE_KEY = 'contra_font_size';

export type FontSizeOption = 'small' | 'default' | 'large';

export const FONT_SIZE_OPTIONS: { id: FontSizeOption; delta: number }[] = [
  { id: 'small',   delta: -2 },
  { id: 'default', delta: 0 },
  { id: 'large',   delta: 2 },
];

function getStoredDelta(): number {
  const stored = _fontStorage.getString(FONT_SIZE_KEY) as FontSizeOption | undefined;
  const opt = FONT_SIZE_OPTIONS.find((o) => o.id === stored);
  return opt?.delta ?? 0;
}

function buildTypography(bodyDelta: number) {
  return {
    'display-lg': { fontFamily: fonts.light,    fontSize: 64, letterSpacing: -1.5 },
    'display-md': { fontFamily: fonts.light,    fontSize: 48, letterSpacing: -1 },
    'display-sm': { fontFamily: fonts.light,    fontSize: 36, letterSpacing: -0.5 },
    'headline-lg': { fontFamily: fonts.bold,    fontSize: 32, letterSpacing: -0.5 },
    'headline-md': { fontFamily: fonts.bold,    fontSize: 28, letterSpacing: -0.3 },
    'headline-sm': { fontFamily: fonts.bold,    fontSize: 24, letterSpacing: -0.2 },
    'body-lg': { fontFamily: fonts.regular,     fontSize: 20 + bodyDelta, lineHeight: 30 + bodyDelta },
    'body-md': { fontFamily: fonts.regular,     fontSize: 18 + bodyDelta, lineHeight: 28 + bodyDelta },
    'body-sm': { fontFamily: fonts.regular,     fontSize: 16 + bodyDelta, lineHeight: 24 + bodyDelta },
    'label-lg': { fontFamily: fonts.bold,       fontSize: 12, letterSpacing: 2,   textTransform: 'uppercase' as const },
    'label-md': { fontFamily: fonts.bold,       fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' as const },
    'label-sm': { fontFamily: fonts.semibold,   fontSize: 9,  letterSpacing: 1.2, textTransform: 'uppercase' as const },
  };
}

export type TypographyTokens = ReturnType<typeof buildTypography>;

export const typography: TypographyTokens = buildTypography(getStoredDelta());

export { buildTypography, getStoredDelta };

export const spacing = {
  1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32,
  9: 36, 10: 40, 12: 48, 16: 64, 20: 80,
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
