import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

const STORAGE_KEY = "kaytipic_onboarding_done_v1";

interface OnboardingState {
  hasSeenOnboarding: boolean;
  loaded: boolean;
  load: () => Promise<void>;
  markDone: () => Promise<void>;
  reset: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  hasSeenOnboarding: false,
  loaded: false,

  load: async () => {
    try {
      const val = await SecureStore.getItemAsync(STORAGE_KEY);
      set({ hasSeenOnboarding: val === "true", loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  markDone: async () => {
    set({ hasSeenOnboarding: true });
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, "true");
    } catch {
      /* ignore */
    }
  },

  reset: async () => {
    set({ hasSeenOnboarding: false });
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  },
}));
