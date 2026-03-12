import { api } from "./client";
import { Preset } from "./ai.api";

export const presetApi = {
  list: () => api.get<Preset[]>("/presets"),

  create: (data: {
    name: string;
    description?: string;
    exposure?: number;
    contrast?: number;
    saturation?: number;
    brightness?: number;
    highlights?: number;
    shadows?: number;
    blackPoint?: number;
  }) => api.post<Preset>("/presets", data),

  update: (presetId: string, data: Partial<Preset>) =>
    api.patch<Preset>(`/presets/${presetId}`, data),

  delete: (presetId: string) => api.delete(`/presets/${presetId}`),
};
