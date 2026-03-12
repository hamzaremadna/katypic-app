import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { aiApi } from "../services/api/ai.api";

export function usePhotoAnalysis(photoId: string) {
  return useQuery({
    queryKey: ["analyses", photoId],
    queryFn: () => aiApi.getAnalyses(photoId).then((r) => r.data),
    enabled: !!photoId,
  });
}

export function useAnalyzePhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ photoId, imageUrl }: { photoId: string; imageUrl: string }) =>
      aiApi.analyzePhoto(photoId, imageUrl).then((r) => r.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["analyses", variables.photoId] });
    },
  });
}

export function useAnalysisHistory(page = 1) {
  return useQuery({
    queryKey: ["analyses", "history", page],
    queryFn: () => aiApi.listAnalyses(page).then((r) => r.data),
  });
}
