import { create } from 'zustand';
import type { Friend, Challenge, ChallengeStatus } from '@/services/api';
import * as api from '@/services/api';

interface FriendState {
  friends: Friend[];
  searchResults: Friend[];
  challenges: Challenge[];
  isLoading: boolean;

  fetchFriends: () => Promise<void>;
  searchUsers: (query: string) => Promise<void>;
  clearSearch: () => void;
  addFriend: (friend: Friend) => Promise<void>;
  removeFriend: (id: string) => Promise<void>;
  fetchChallenges: () => Promise<void>;
  sendChallenge: (to: Friend, topic: string, topicLabel: string, difficulty: string) => Promise<void>;
  acceptChallenge: (id: string) => Promise<void>;
  declineChallenge: (id: string) => Promise<void>;
}

export const useFriendStore = create<FriendState>((set) => ({
  friends: [],
  searchResults: [],
  challenges: [],
  isLoading: false,

  fetchFriends: async () => {
    set({ isLoading: true });
    try {
      const friends = await api.getFriends();
      set({ friends, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  searchUsers: async (query: string) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }
    try {
      const results = await api.searchUsers(query);
      set({ searchResults: results });
    } catch {
      set({ searchResults: [] });
    }
  },

  clearSearch: () => {
    set({ searchResults: [] });
  },

  addFriend: async (friend: Friend) => {
    try {
      await api.addFriend(friend.id);
      set((state) => ({
        friends: [...state.friends, friend],
        searchResults: state.searchResults.filter((u) => u.id !== friend.id),
      }));
    } catch (e: any) {
      console.error('Failed to add friend:', e.message);
    }
  },

  removeFriend: async (id: string) => {
    try {
      await api.removeFriend(id);
      set((state) => ({
        friends: state.friends.filter((f) => f.id !== id),
      }));
    } catch (e: any) {
      console.error('Failed to remove friend:', e.message);
    }
  },

  fetchChallenges: async () => {
    try {
      const challenges = await api.getChallenges();
      set({ challenges });
    } catch {
      // silent
    }
  },

  sendChallenge: async (to: Friend, topic: string, topicLabel: string, difficulty: string) => {
    try {
      const challenge = await api.createChallenge(to.id, topic, topicLabel, difficulty);
      set((state) => ({
        challenges: [challenge, ...state.challenges],
      }));
    } catch (e: any) {
      console.error('Failed to send challenge:', e.message);
    }
  },

  acceptChallenge: async (id: string) => {
    try {
      await api.acceptChallenge(id);
      set((state) => ({
        challenges: state.challenges.map((c) =>
          c.id === id ? { ...c, status: 'accepted' as ChallengeStatus } : c,
        ),
      }));
    } catch (e: any) {
      console.error('Failed to accept challenge:', e.message);
    }
  },

  declineChallenge: async (id: string) => {
    try {
      await api.declineChallenge(id);
      set((state) => ({
        challenges: state.challenges.map((c) =>
          c.id === id ? { ...c, status: 'declined' as ChallengeStatus } : c,
        ),
      }));
    } catch (e: any) {
      console.error('Failed to decline challenge:', e.message);
    }
  },
}));
