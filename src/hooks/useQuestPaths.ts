import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { questApi } from "../services/api/quest.api";

export function useQuestPaths() {
  return useQuery({
    queryKey: ["quest-paths"],
    queryFn: () => questApi.getPaths().then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useQuestPath(slug: string) {
  return useQuery({
    queryKey: ["quest-path", slug],
    queryFn: () => questApi.getPath(slug).then((r) => r.data),
    staleTime: 30_000,
    enabled: !!slug,
  });
}

export function useQuestStats() {
  return useQuery({
    queryKey: ["quest-stats"],
    queryFn: () => questApi.getStats().then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useStartQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questId: string) => questApi.startQuest(questId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quest-paths"] });
      queryClient.invalidateQueries({ queryKey: ["quest-path"] });
    },
  });
}

export function useSyncQuestProgress() {
  return useMutation({
    mutationFn: (questId: string) =>
      questApi.syncProgress(questId).then((r) => r.data),
  });
}

export function useCompleteQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questId: string) =>
      questApi.completeQuest(questId).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quest-paths"] });
      queryClient.invalidateQueries({ queryKey: ["quest-path"] });
      queryClient.invalidateQueries({ queryKey: ["quest-stats"] });
    },
  });
}
