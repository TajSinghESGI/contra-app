import { shadows, type ColorTokens } from '@/constants/tokens';
import type { AccordionTheme } from './types';

export const getAccordionThemes = (colors: ColorTokens): Record<string, AccordionTheme> => ({
  contra: {
    backgroundColor: colors['surface-container-lowest'],
    borderColor: 'transparent',
    headlineColor: colors['on-surface'],
    subtitleColor: colors['on-surface-variant'],
    iconColor: colors['on-surface-variant'],
    dividerColor: colors['surface-container-high'],
    borderRadius: 24,
    shadow: { ...shadows.ambient },
  },
  light: {
    backgroundColor: '#ffffff',
    borderColor: '#e4e4e7',
    headlineColor: '#09090b',
    subtitleColor: '#71717a',
    iconColor: '#71717a',
    dividerColor: '#e4e4e7',
    borderRadius: 8,
  },
  dark: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    headlineColor: '#fafafa',
    subtitleColor: '#a1a1aa',
    iconColor: '#a1a1aa',
    dividerColor: '#27272a',
    borderRadius: 8,
  },
  ocean: {
    backgroundColor: '#0c4a6e',
    borderColor: '#075985',
    headlineColor: '#e0f2fe',
    subtitleColor: '#7dd3fc',
    iconColor: '#7dd3fc',
    dividerColor: '#075985',
    borderRadius: 8,
  },
  sunset: {
    backgroundColor: '#7c2d12',
    borderColor: '#9a3412',
    headlineColor: '#fed7aa',
    subtitleColor: '#fdba74',
    iconColor: '#fdba74',
    dividerColor: '#9a3412',
    borderRadius: 8,
  },
});
