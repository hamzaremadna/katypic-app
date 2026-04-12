import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { photoApi } from "../services/api/photo.api";

export function usePhotos(page = 1) {
  return useQuery({
    queryKey: ["photos", page],
    queryFn: () => photoApi.list(page).then((r) => r.data),
  });
}

export function usePhoto(photoId: string) {
  return useQuery({
    queryKey: ["photos", photoId],
    queryFn: () => photoApi.get(photoId).then((r) => r.data),
    enabled: !!photoId,
  });
}

export function useUpdatePhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      photoId,
      data,
    }: {
      photoId: string;
      data: { isPublic?: boolean; caption?: string };
    }) => photoApi.update(photoId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photos"] });
    },
  });
}

export function useDeletePhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) => photoApi.delete(photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photos"] });
    },
  });
}

export function useBatchDeletePhotos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photoIds: string[]) =>
      photoApi.batchDelete(photoIds).then((r) => r.data),
    onMutate: async (photoIds: string[]) => {
      // Cancel in-flight fetches to avoid race conditions
      await queryClient.cancelQueries({ queryKey: ["photos"] });
      // Snapshot current cache for rollback
      const previous = queryClient.getQueriesData({ queryKey: ["photos"] });
      // Optimistically remove deleted photos from all pages in cache
      queryClient.setQueriesData(
        { queryKey: ["photos"] },
        (old: { photos: { id: string }[]; total: number } | undefined) => {
          if (!old) return old;
          const ids = new Set(photoIds);
          const photos = old.photos.filter((p) => !ids.has(p.id));
          return { ...old, photos, total: old.total - (old.photos.length - photos.length) };
        },
      );
      return { previous };
    },
    onError: (_err, _ids, context) => {
      // Revert optimistic update on failure
      if (context?.previous) {
        for (const [queryKey, data] of context.previous) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["photos"] });
    },
  });
}
