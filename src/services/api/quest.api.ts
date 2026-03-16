import { api } from "./client";

export type QuestStatus = "LOCKED" | "IN_PROGRESS" | "COMPLETED";

export interface QuestPathSummary {
  id: string;
  slug: string;
  title: string;
  tag: string;
  color: string;
  color2: string;
  icon: string;
  order: number;
  completedCount: number;
  totalCount: number;
}

export interface QuestDetail {
  id: string;
  pathId: string;
  title: string;
  subtitle: string;
  category: string;
  xp: number;
  order: number;
  requiredPhotos: number;
  isFinal: boolean;
  tips: string[];
  status: QuestStatus;
  photosTaken: number;
  startedAt: string | null;
}

export interface QuestPathDetail {
  path: QuestPathSummary;
  quests: QuestDetail[];
}

export interface Badge {
  id: string;
  label: string;
  icon: string;
  unlocked: boolean;
}

export interface QuestStats {
  xp: number;
  level: number;
  xpForCurrentLevel: number;
  xpToNextLevel: number;
  daysActive: number;
  badges: Badge[];
}

export const questApi = {
  getPaths: () => api.get<QuestPathSummary[]>("/quests/paths"),
  getPath: (slug: string) => api.get<QuestPathDetail>(`/quests/paths/${slug}`),
  getStats: () => api.get<QuestStats>("/quests/stats"),
  startQuest: (questId: string) =>
    api.post<{ status: QuestStatus }>(`/quests/progress/${questId}/start`, {}),
  syncProgress: (questId: string) =>
    api.post<{ photosTaken: number; status: QuestStatus }>(
      `/quests/progress/${questId}/sync`,
      {}
    ),
  completeQuest: (questId: string) =>
    api.post<{ xpEarned: number; alreadyCompleted: boolean }>(
      `/quests/progress/${questId}/complete`,
      {}
    ),
};
