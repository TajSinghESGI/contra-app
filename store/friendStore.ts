import { create } from 'zustand';
import type { Friend, FriendRequest, Challenge, ChallengeStatus } from '@/services/api';
import * as api from '@/services/api';

interface FriendState {
  friends: Friend[];
  searchResults: Friend[];
  friendRequests: FriendRequest[];
  sentRequestUserIds: string[];
  challenges: Challenge[];
  isLoading: boolean;

  fetchFriends: () => Promise<void>;
  searchUsers: (query: string) => Promise<void>;
  clearSearch: () => void;
  removeFriend: (id: string) => Promise<void>;

  // Friend requests
  fetchFriendRequests: () => Promise<void>;
  sendFriendRequest: (friend: Friend) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;

  // Challenges
  fetchChallenges: () => Promise<void>;
  sendChallenge: (to: Friend, topic: string, topicLabel: string, maxTurns: string) => Promise<void>;
  acceptChallenge: (id: string) => Promise<void>;
  declineChallenge: (id: string) => Promise<void>;
}

export const useFriendStore = create<FriendState>((set, get) => ({
  friends: [],
  searchResults: [],
  friendRequests: [],
  sentRequestUserIds: [],
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

  clearSearch: () => set({ searchResults: [] }),

  removeFriend: async (id: string) => {
    try {
      await api.removeFriend(id);
      set((state) => ({
        friends: state.friends.filter((f) => f.id !== id),
      }));
    } catch (e: any) {
      console.error('Failed to remove friend:', e.message);
      throw e;
    }
  },

  // ─── Friend Requests ────────────────────────────────────────────────────

  fetchFriendRequests: async () => {
    try {
      const requests = await api.getFriendRequests();
      const sentIds = requests
        .filter((r) => r.direction === 'outgoing' && r.status === 'pending')
        .map((r) => r.to.id);
      set({ friendRequests: requests, sentRequestUserIds: sentIds });
    } catch {
      // silent
    }
  },

  sendFriendRequest: async (friend: Friend) => {
    // Optimistic: mark as sent immediately
    set((state) => ({
      sentRequestUserIds: [...state.sentRequestUserIds, friend.id],
      searchResults: state.searchResults.filter((u) => u.id !== friend.id),
    }));
    try {
      const request = await api.sendFriendRequest(friend.id);
      set((state) => ({
        friendRequests: [...state.friendRequests, request],
      }));
    } catch (e: any) {
      // Rollback on error
      set((state) => ({
        sentRequestUserIds: state.sentRequestUserIds.filter((id) => id !== friend.id),
      }));
      console.error('Failed to send friend request:', e.message);
      throw e;
    }
  },

  acceptFriendRequest: async (requestId: string) => {
    const request = get().friendRequests.find((r) => r.id === requestId);
    try {
      await api.acceptFriendRequest(requestId);
      set((state) => ({
        friendRequests: state.friendRequests.filter((r) => r.id !== requestId),
        friends: request ? [...state.friends, request.from] : state.friends,
      }));
    } catch (e: any) {
      console.error('Failed to accept friend request:', e.message);
      throw e;
    }
  },

  declineFriendRequest: async (requestId: string) => {
    try {
      await api.declineFriendRequest(requestId);
      set((state) => ({
        friendRequests: state.friendRequests.filter((r) => r.id !== requestId),
      }));
    } catch (e: any) {
      console.error('Failed to decline friend request:', e.message);
      throw e;
    }
  },

  // ─── Challenges ─────────────────────────────────────────────────────────

  fetchChallenges: async () => {
    try {
      const challenges = await api.getChallenges();
      set({ challenges });
    } catch {
      // silent
    }
  },

  sendChallenge: async (to: Friend, topic: string, topicLabel: string, maxTurns: string) => {
    try {
      const challenge = await api.createChallenge(to.id, topic, topicLabel, maxTurns);
      set((state) => ({
        challenges: [challenge, ...state.challenges],
      }));
    } catch (e: any) {
      console.error('Failed to send challenge:', e.message);
      throw e;
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
      throw e;
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
      throw e;
    }
  },
}));
