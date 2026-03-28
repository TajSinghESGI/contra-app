import { useCallback, useMemo } from 'react';
import { useThemeStore } from '@/store/themeStore';
import { useFontSizeStore } from '@/store/fontSizeStore';
import {
  lightColors,
  darkColors,
  buildTypography,
  FONT_SIZE_OPTIONS,
  type ColorTokens,
  type TypographyTokens,
} from '@/constants/tokens';

const SCALE_MAP = { small: 0.9, default: 1, large: 1.1 } as const;

export function useTheme() {
  const resolved = useThemeStore((s) => s.resolved);
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const fontSize = useFontSizeStore((s) => s.size);

  const colors: ColorTokens = useMemo(
    () => (resolved === 'dark' ? darkColors : lightColors),
    [resolved],
  );

  const typography: TypographyTokens = useMemo(() => {
    const delta = FONT_SIZE_OPTIONS.find((o) => o.id === fontSize)?.delta ?? 0;
    return buildTypography(delta);
  }, [fontSize]);

  const scale = SCALE_MAP[fontSize];

  /** Scale any font size by the user's font-size preference. */
  const fs = useCallback(
    (size: number) => Math.round(size * scale),
    [scale],
  );

  const isDark = resolved === 'dark';

  return { colors, isDark, mode, setMode, typography, fs };
}
