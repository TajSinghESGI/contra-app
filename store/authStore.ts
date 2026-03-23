import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'contra_auth_token';

interface AuthState {
  isLogged: boolean;
  token: string | null;
  isHydrated: boolean;
  // actions
  hydrate: () => Promise<void>;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  isLogged: false,
  token: null,
  isHydrated: false,

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      set({ isLogged: !!token, token, isHydrated: true });
    } catch {
      set({ isLogged: false, token: null, isHydrated: true });
    }
  },

  login: async (token: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    set({ isLogged: true, token });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    set({ isLogged: false, token: null });
  },
}));
