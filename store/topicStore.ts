import { create } from 'zustand';
import i18n from '@/i18n';
import { getTopics, getCategories } from '@/services/api';
import type { Topic, Category, TopicFilters } from '@/services/api';

interface TopicState {
  categories: Category[];
  topics: Topic[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  selectedCategory: string | null;
  lang: string;
  totalCount: number;
  hasMore: boolean;

  setLang: (lang: string) => void;
  fetchCategories: () => Promise<void>;
  fetchTopics: (filters?: Omit<TopicFilters, 'lang' | 'limit' | 'offset'>) => Promise<void>;
  fetchNextPage: () => Promise<void>;
  setSelectedCategory: (categoryId: string | null) => void;
}

const PAGE_SIZE = 20;

export const useTopicStore = create<TopicState>()((set, get) => ({
  categories: [],
  topics: [],
  isLoading: false,
  isLoadingMore: false,
  error: null,
  selectedCategory: null,
  lang: i18n.language || 'fr',
  totalCount: 0,
  hasMore: false,

  setLang: (lang: string) => {
    set({ lang });
    get().fetchCategories();
    get().fetchTopics({ category: get().selectedCategory ?? undefined });
  },

  fetchCategories: async () => {
    try {
      const categories = await getCategories(get().lang);
      set({ categories });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  fetchTopics: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const res = await getTopics({
        ...filters,
        lang: get().lang,
        limit: PAGE_SIZE,
        offset: 0,
      });
      set({
        topics: res.results,
        totalCount: res.count,
        hasMore: res.next !== null,
        isLoading: false,
      });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  fetchNextPage: async () => {
    const { topics, hasMore, isLoadingMore, isLoading, selectedCategory, lang } = get();
    if (!hasMore || isLoadingMore || isLoading) return;

    set({ isLoadingMore: true });
    try {
      const res = await getTopics({
        category: selectedCategory ?? undefined,
        lang,
        limit: PAGE_SIZE,
        offset: topics.length,
      });
      set({
        topics: [...topics, ...res.results],
        totalCount: res.count,
        hasMore: res.next !== null,
        isLoadingMore: false,
      });
    } catch (e: any) {
      set({ error: e.message, isLoadingMore: false });
    }
  },

  setSelectedCategory: (categoryId: string | null) => {
    set({ selectedCategory: categoryId });
    get().fetchTopics({ category: categoryId ?? undefined });
  },
}));
