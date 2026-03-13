import { api } from "./client";
import { PhotoAnalysis } from "./photo.api";

export interface ChatSession {
  id: string;
  photoId?: string;
  title?: string;
  updatedAt: string;
  messages?: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  imageUrl?: string;
  createdAt: string;
}

export interface Preset {
  id: string;
  name: string;
  description?: string;
  exposure: number;
  contrast: number;
  saturation: number;
  brightness: number;
  highlights: number;
  shadows: number;
  blackPoint: number;
  isAiGenerated: boolean;
  isSystem: boolean;
}

export interface DailyTip {
  tip: string;
  category: string;
}

export const aiApi = {
  getDailyTip: () => api.get<DailyTip>("/ai/daily-tip"),

  analyzePhoto: (photoId: string, imageUrl: string) =>
    api.post<PhotoAnalysis>("/ai/analyze", { photoId, imageUrl }),

  getAnalyses: (photoId: string) =>
    api.get<PhotoAnalysis[]>(`/ai/analyses/${photoId}`),

  listAnalyses: (page = 1) =>
    api.get<PhotoAnalysis[]>(`/ai/analyses?page=${page}`),

  generatePreset: (imageUrl: string) =>
    api.post<Preset>("/ai/generate-preset", { imageUrl }),

  createChatSession: (photoId?: string, title?: string) =>
    api.post<ChatSession>("/ai/chat/sessions", { photoId, title }),

  listChatSessions: () =>
    api.get<ChatSession[]>("/ai/chat/sessions"),

  getChatSession: (sessionId: string) =>
    api.get<ChatSession>(`/ai/chat/sessions/${sessionId}`),

  sendMessage: (sessionId: string, content: string, imageUrl?: string) =>
    api.post<ChatMessage>(
      `/ai/chat/sessions/${sessionId}/messages`,
      { content, imageUrl }
    ),
};
