import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { AuthUser } from '@/services/api';
import i18n from '@/i18n';
import { useTopicStore } from '@/store/topicStore';

const TOKEN_KEY = 'contra_auth_token';
const REFRESH_KEY = 'contra_refresh_token';
const USER_KEY = 'contra_user';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.contra-app.cloud';

function syncLanguage(user: AuthUser | null) {
  const lang = user?.language ?? 'fr';
  if (i18n.language !== lang) {
    i18n.changeLanguage(lang);
    useTopicStore.getState().setLang(lang);
  }
}

interface AuthState {
  isLogged: boolean;
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isHydrated: boolean;
  // actions
  hydrate: () => Promise<void>;
  login: (token: string, refresh: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  isLogged: false,
  token: null,
  refreshToken: null,
  user: null,
  isHydrated: false,

  hydrate: async () => {
    try {
      const [token, refreshToken, userJson] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(REFRESH_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);

      if (!token) {
        set({ isLogged: false, token: null, refreshToken: null, user: null, isHydrated: true });
        return;
      }

      // Validate token against server to catch stale tokens (e.g. simulator reinstalls)
      try {
        const res = await fetch(`${BASE_URL}/api/auth/profile/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401 || res.status === 403) {
          // Try refreshing the token before giving up
          if (refreshToken) {
            try {
              const refreshRes = await fetch(`${BASE_URL}/api/auth/token/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh: refreshToken }),
              });
              if (refreshRes.ok) {
                const { access } = await refreshRes.json();
                await SecureStore.setItemAsync(TOKEN_KEY, access);
                const user: AuthUser | null = userJson ? JSON.parse(userJson) : null;
                set({ isLogged: true, token: access, refreshToken, user, isHydrated: true });
                return;
              }
            } catch {
              // Refresh failed — clear auth
            }
          }
          await Promise.all([
            SecureStore.deleteItemAsync(TOKEN_KEY),
            SecureStore.deleteItemAsync(REFRESH_KEY),
            SecureStore.deleteItemAsync(USER_KEY),
          ]);
          set({ isLogged: false, token: null, refreshToken: null, user: null, isHydrated: true });
          return;
        }

        if (res.ok) {
          const freshUser: AuthUser = await res.json();
          await SecureStore.setItemAsync(USER_KEY, JSON.stringify(freshUser));
          syncLanguage(freshUser);
          set({ isLogged: true, token, refreshToken, user: freshUser, isHydrated: true });
          return;
        }
      } catch {
        // Network unavailable — keep cached state so offline mode works
      }

      const user: AuthUser | null = userJson ? JSON.parse(userJson) : null;
      syncLanguage(user);
      set({ isLogged: !!token, token, refreshToken, user, isHydrated: true });
    } catch {
      set({ isLogged: false, token: null, refreshToken: null, user: null, isHydrated: true });
    }
  },

  login: async (token: string, refresh: string, user: AuthUser) => {
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, token),
      SecureStore.setItemAsync(REFRESH_KEY, refresh),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
    ]);
    set({ isLogged: true, token, refreshToken: refresh, user });
  },

  logout: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
    set({ isLogged: false, token: null, refreshToken: null, user: null });
  },

  refreshAccessToken: async () => {
    const { refreshToken } = get();
    if (!refreshToken) return null;
    try {
      const res = await fetch(`${BASE_URL}/api/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      if (!res.ok) return null;
      const { access } = await res.json();
      await SecureStore.setItemAsync(TOKEN_KEY, access);
      set({ token: access });
      return access;
    } catch {
      return null;
    }
  },
}));
