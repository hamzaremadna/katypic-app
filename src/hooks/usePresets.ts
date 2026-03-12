import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { presetApi } from "../services/api/preset.api";
import { aiApi } from "../services/api/ai.api";

export function usePresets() {
  return useQuery({
    queryKey: ["presets"],
    queryFn: () => presetApi.list().then((r) => r.data),
  });
}

export function useCreatePreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof presetApi.create>[0]) =>
      presetApi.create(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presets"] });
    },
  });
}

export function useGenerateAiPreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (imageUrl: string) =>
      aiApi.generatePreset(imageUrl).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presets"] });
    },
  });
}
