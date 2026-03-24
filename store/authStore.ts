import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { AuthUser } from '@/services/api';

const TOKEN_KEY = 'contra_auth_token';
const USER_KEY = 'contra_user';

interface AuthState {
  isLogged: boolean;
  token: string | null;
  user: AuthUser | null;
  isHydrated: boolean;
  // actions
  hydrate: () => Promise<void>;
  login: (token: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  isLogged: false,
  token: null,
  user: null,
  isHydrated: false,

  hydrate: async () => {
    try {
      const [token, userJson] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);
      const user: AuthUser | null = userJson ? JSON.parse(userJson) : null;
      set({ isLogged: !!token, token, user, isHydrated: true });
    } catch {
      set({ isLogged: false, token: null, user: null, isHydrated: true });
    }
  },

  login: async (token: string, user: AuthUser) => {
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, token),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
    ]);
    set({ isLogged: true, token, user });
  },

  logout: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
    set({ isLogged: false, token: null, user: null });
  },
}));
