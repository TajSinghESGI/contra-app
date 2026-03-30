import { create } from 'zustand';

interface RegisterState {
  pseudo: string;
  email: string;
  password: string;
  selectedTopics: string[];
  selectedDifficulty: string;
  setPseudo: (v: string) => void;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  toggleTopic: (topic: string) => void;
  setDifficulty: (v: string) => void;
  reset: () => void;
}

const INITIAL: Pick<RegisterState,
  'pseudo' | 'email' | 'password' | 'selectedTopics' | 'selectedDifficulty'
> = {
  pseudo: '',
  email: '',
  password: '',
  selectedTopics: [],
  selectedDifficulty: 'medium',
};

export const useRegisterStore = create<RegisterState>()((set) => ({
  ...INITIAL,
  setPseudo: (v) => set({ pseudo: v }),
  setEmail: (v) => set({ email: v }),
  setPassword: (v) => set({ password: v }),
  toggleTopic: (topic) =>
    set((s) => ({
      selectedTopics: s.selectedTopics.includes(topic)
        ? s.selectedTopics.filter((t) => t !== topic)
        : [...s.selectedTopics, topic],
    })),
  setDifficulty: (v) => set({ selectedDifficulty: v }),
  reset: () => set(INITIAL),
}));
