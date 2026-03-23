import { create } from 'zustand';

interface RegisterState {
  fullName: string;
  email: string;
  password: string;
  selectedTopics: string[];
  selectedDifficulty: string;
  setFullName: (v: string) => void;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  toggleTopic: (topic: string) => void;
  setDifficulty: (v: string) => void;
  reset: () => void;
}

const INITIAL: Pick<RegisterState,
  'fullName' | 'email' | 'password' | 'selectedTopics' | 'selectedDifficulty'
> = {
  fullName: '',
  email: '',
  password: '',
  selectedTopics: [],
  selectedDifficulty: 'medium',
};

export const useRegisterStore = create<RegisterState>()((set) => ({
  ...INITIAL,
  setFullName: (v) => set({ fullName: v }),
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
