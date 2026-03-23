import { create } from 'zustand';
import { getTopics, getCategories } from '@/services/api';
import type { Topic, Category } from '@/services/api';

interface TopicState {
  categories: Category[];
  topics: Topic[];
  isLoading: boolean;
  error: string | null;
  selectedCategory: string | null;
  lang: string;

  setLang: (lang: string) => void;
  fetchCategories: () => Promise<void>;
  fetchTopics: (category?: string) => Promise<void>;
  setSelectedCategory: (categoryId: string | null) => void;
}

export const useTopicStore = create<TopicState>()((set, get) => ({
  categories: [],
  topics: [],
  isLoading: false,
  error: null,
  selectedCategory: null,
  lang: 'fr',

  setLang: (lang: string) => {
    set({ lang });
    // Re-fetch everything in the new language
    get().fetchCategories();
    get().fetchTopics(get().selectedCategory ?? undefined);
  },

  fetchCategories: async () => {
    try {
      const categories = await getCategories(get().lang);
      set({ categories });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  fetchTopics: async (category?: string) => {
    set({ isLoading: true, error: null });
    try {
      const topics = await getTopics(category, get().lang);
      set({ topics, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  setSelectedCategory: (categoryId: string | null) => {
    set({ selectedCategory: categoryId });
    get().fetchTopics(categoryId ?? undefined);
  },
}));
