import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { authApi } from "../services/api/auth.api";
import { apiClient } from "../services/api/client";

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isReady: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, displayName?: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithApple: (identityToken: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
  clearError: () => void;
}

const persistAuth = async (set: (state: Partial<AuthState>) => void, data: { accessToken: string; user: User }) => {
  await SecureStore.setItemAsync("accessToken", data.accessToken);
  apiClient.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
  set({ token: data.accessToken, user: data.user, isAuthenticated: true, error: null });
};

// Extract the real backend message from an Axios / unknown error
function parseApiError(err: unknown, fallback: string): string {
  if (err && typeof err === "object") {
    const e = err as {
      response?: { data?: { message?: unknown } };
      message?: string;
      code?: string;
    };
    // Backend returned a JSON error body
    const msg = e.response?.data?.message;
    if (typeof msg === "string" && msg) return msg;
    if (Array.isArray(msg) && msg.length > 0) return String(msg[0]);
    // Axios network error (no response from server)
    if (!e.response && e.message) return e.message;
  }
  return fallback;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isReady: false,
  error: null,

  loadToken: async () => {
    // Timeout guard: if loadToken takes > 10s (e.g. server unreachable), mark ready anyway
    const timeout = setTimeout(() => set({ isReady: true }), 10000);
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      if (token) {
        apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
        try {
          const { data: user } = await authApi.getMe();
          set({ token, user, isAuthenticated: true, isReady: true });
        } catch {
          await SecureStore.deleteItemAsync("accessToken");
          delete apiClient.defaults.headers.common.Authorization;
          set({ isReady: true });
        }
      } else {
        set({ isReady: true });
      }
    } catch {
      set({ isReady: true });
    } finally {
      clearTimeout(timeout);
    }
  },

  login: async (email, password) => {
    try {
      set({ error: null });
      const { data } = await authApi.login(email, password);
      await persistAuth(set, data);
    } catch (err: unknown) {
      set({ error: parseApiError(err, "Login failed") });
      throw err;
    }
  },

  register: async (email, username, password, displayName) => {
    try {
      set({ error: null });
      const { data } = await authApi.register(email, username, password, displayName);
      await persistAuth(set, data);
    } catch (err: unknown) {
      set({ error: parseApiError(err, "Registration failed") });
      throw err;
    }
  },

  loginWithGoogle: async (idToken) => {
    try {
      set({ error: null });
      const { data } = await authApi.googleOAuth(idToken);
      await persistAuth(set, data);
    } catch (err: unknown) {
      set({ error: parseApiError(err, "Google login failed") });
      throw err;
    }
  },

  loginWithApple: async (identityToken, fullName) => {
    try {
      set({ error: null });
      const { data } = await authApi.appleOAuth(identityToken, fullName);
      await persistAuth(set, data);
    } catch (err: unknown) {
      set({ error: parseApiError(err, "Apple login failed") });
      throw err;
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync("accessToken");
    delete apiClient.defaults.headers.common.Authorization;
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),
}));
