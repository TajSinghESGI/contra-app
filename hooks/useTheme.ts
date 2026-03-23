import { useMemo } from 'react';
import { useThemeStore } from '@/store/themeStore';
import { lightColors, darkColors, type ColorTokens } from '@/constants/tokens';

export function useTheme() {
  const resolved = useThemeStore((s) => s.resolved);
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  const colors: ColorTokens = useMemo(
    () => (resolved === 'dark' ? darkColors : lightColors),
    [resolved],
  );

  const isDark = resolved === 'dark';

  return { colors, isDark, mode, setMode };
}
