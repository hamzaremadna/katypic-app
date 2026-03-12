import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

const STORAGE_KEY = "kaytipic_settings_v1";

interface SettingsState {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  loaded: boolean;
  /** Load persisted preferences from SecureStore */
  load: () => Promise<void>;
  setNotificationsEnabled: (value: boolean) => Promise<void>;
  setSoundEnabled: (value: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  notificationsEnabled: true,
  soundEnabled: false,
  loaded: false,

  load: async () => {
    try {
      const raw = await SecureStore.getItemAsync(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({
          notificationsEnabled: parsed.notificationsEnabled ?? true,
          soundEnabled: parsed.soundEnabled ?? false,
          loaded: true,
        });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  setNotificationsEnabled: async (value: boolean) => {
    set({ notificationsEnabled: value });
    await persist(get());
  },

  setSoundEnabled: async (value: boolean) => {
    set({ soundEnabled: value });
    await persist(get());
  },
}));

async function persist(state: SettingsState) {
  try {
    await SecureStore.setItemAsync(
      STORAGE_KEY,
      JSON.stringify({
        notificationsEnabled: state.notificationsEnabled,
        soundEnabled: state.soundEnabled,
      }),
    );
  } catch {
    /* ignore persistence errors */
  }
}
