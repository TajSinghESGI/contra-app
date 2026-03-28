import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';
import type { FontSizeOption } from '@/constants/tokens';

const storage = createMMKV();
const FONT_SIZE_KEY = 'contra_font_size';

interface FontSizeState {
  size: FontSizeOption;
  setSize: (size: FontSizeOption) => void;
}

const initialSize = (storage.getString(FONT_SIZE_KEY) as FontSizeOption) || 'default';

export const useFontSizeStore = create<FontSizeState>((set) => ({
  size: initialSize,

  setSize: (size: FontSizeOption) => {
    storage.set(FONT_SIZE_KEY, size);
    set({ size });
  },
}));
