import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

export type TourId =
  | "discover"
  | "camera"
  | "analyse"
  | "edit";

const STORAGE_KEY = "kaytipic_tours_seen_v1";

interface TourState {
  seenTours: Set<TourId>;
  loaded: boolean;
  // Load persisted state from SecureStore
  load: () => Promise<void>;
  // Mark a tour as completed
  markSeen: (id: TourId) => Promise<void>;
  // Check if a tour has been seen
  hasSeen: (id: TourId) => boolean;
  // Reset all tours (for dev/testing)
  resetAll: () => Promise<void>;
}

export const useTourStore = create<TourState>((set, get) => ({
  seenTours: new Set(),
  loaded: false,

  load: async () => {
    try {
      const raw = await SecureStore.getItemAsync(STORAGE_KEY);
      const ids: TourId[] = raw ? JSON.parse(raw) : [];
      set({ seenTours: new Set(ids), loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  markSeen: async (id: TourId) => {
    const next = new Set(get().seenTours);
    next.add(id);
    set({ seenTours: next });
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify([...next]));
    } catch {
      /* ignore persistence errors */
    }
  },

  hasSeen: (id: TourId) => get().seenTours.has(id),

  resetAll: async () => {
    set({ seenTours: new Set() });
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  },
}));
