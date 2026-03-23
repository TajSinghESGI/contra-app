import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';
import { Appearance } from 'react-native';

const storage = createMMKV();
const THEME_KEY = 'contra_theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  resolved: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
}

function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return Appearance.getColorScheme() ?? 'light';
  }
  return mode;
}

const initialMode = (storage.getString(THEME_KEY) as ThemeMode) || 'system';

export const useThemeStore = create<ThemeState>((set) => ({
  mode: initialMode,
  resolved: resolveTheme(initialMode),

  setMode: (mode: ThemeMode) => {
    storage.set(THEME_KEY, mode);
    set({ mode, resolved: resolveTheme(mode) });
  },
}));

// Listen for system theme changes
Appearance.addChangeListener(({ colorScheme }) => {
  const { mode } = useThemeStore.getState();
  if (mode === 'system') {
    useThemeStore.setState({ resolved: colorScheme ?? 'light' });
  }
});
