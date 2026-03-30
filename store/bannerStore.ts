import { create } from 'zustand';

interface BannerStore {
  scrollY: number;
  setScrollY: (y: number) => void;
  visible: boolean;
  setVisible: (v: boolean) => void;
  dailyUsed: number;
  dailyLimit: number | null;
  setDaily: (used: number, limit: number | null) => void;
}

export const useBannerStore = create<BannerStore>((set) => ({
  scrollY: 0,
  setScrollY: (y) => set({ scrollY: y }),
  visible: false,
  setVisible: (v) => set({ visible: v }),
  dailyUsed: 0,
  dailyLimit: null,
  setDaily: (used, limit) => set({ dailyUsed: used, dailyLimit: limit }),
}));
