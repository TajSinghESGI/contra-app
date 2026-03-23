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
  // Surfaces — deep navy, jamais gris neutre
  background: '#0B0F16',
  surface: '#0B0F16',
  'surface-bright': '#162030',
  'surface-container-lowest': '#070A10',
  'surface-container-low': '#111724',
  'surface-container': '#171E2C',
  'surface-container-high': '#1E2738',
  'surface-container-highest': '#263244',
  'surface-dim': '#0B0F16',
  'surface-tint': '#8FABC4',
  'surface-variant': '#263244',

  // Primary — bleu clair sur fond sombre
  primary: '#8FABC4',
  'primary-dim': '#7A9AB8',
  'primary-container': '#1A2D44',
  'on-primary': '#0B1520',
  'on-primary-container': '#C8DAE8',

  // Secondary
  secondary: '#9AAFBF',
  'secondary-container': '#182C40',
  'on-secondary': '#0B1520',

  // Tertiary
  tertiary: '#A3B8CC',
  'tertiary-container': '#1F3248',

  // On-surfaces — blanc chaud, pas gris
  'on-surface': '#E8EAEE',
  'on-surface-variant': '#8895A8',
  'on-background': '#E8EAEE',

  // Borders — navy-teinté
  outline: '#586578',
  'outline-variant': '#2A3548',

  // Error
  error: '#F2918E',
  'error-container': '#5C1A18',
  'on-error': '#2A0806',

  // Inverse
  'inverse-surface': '#E2E4E6',
  'inverse-on-surface': '#2d3336',
  'inverse-primary': '#2B3F52',

  // Dialectical accents — user vs AI
  'accent-user': '#E88A97',
  'accent-user-container': '#2E1C26',
  'accent-user-dim': '#C06878',
  'accent-ai': '#8AACC8',
  'accent-ai-container': '#1A2C3E',
  'accent-ai-dim': '#5E82A0',

  // Glassmorphism — quasi opaque pour masquer le blur gris natif
  glass: 'rgba(11,15,22,0.96)',
  'glass-border': 'rgba(140,170,200,0.08)',
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

export const typography = {
  'display-lg': { fontFamily: fonts.light,    fontSize: 64, letterSpacing: -1.5 },
  'display-md': { fontFamily: fonts.light,    fontSize: 48, letterSpacing: -1 },
  'display-sm': { fontFamily: fonts.light,    fontSize: 36, letterSpacing: -0.5 },
  'headline-lg': { fontFamily: fonts.bold,    fontSize: 32, letterSpacing: -0.5 },
  'headline-md': { fontFamily: fonts.bold,    fontSize: 28, letterSpacing: -0.3 },
  'headline-sm': { fontFamily: fonts.bold,    fontSize: 24, letterSpacing: -0.2 },
  'body-lg': { fontFamily: fonts.regular,     fontSize: 18, lineHeight: 28 },
  'body-md': { fontFamily: fonts.regular,     fontSize: 16, lineHeight: 26 },
  'body-sm': { fontFamily: fonts.regular,     fontSize: 14, lineHeight: 22 },
  'label-lg': { fontFamily: fonts.bold,       fontSize: 12, letterSpacing: 2,   textTransform: 'uppercase' as const },
  'label-md': { fontFamily: fonts.bold,       fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' as const },
  'label-sm': { fontFamily: fonts.semibold,   fontSize: 9,  letterSpacing: 1.2, textTransform: 'uppercase' as const },
} as const;

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
    durationDays: 14,
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
  fallbackBody: "14 jours. Des centaines d'arguments. Continue.",
} as const;

export const PAYWALL_TRIGGERS = [
  'trial_expired',
  'difficulty_brutal_tap',
  'rankings_tab_tap',
  'challenge_friend_tap',
] as const;
