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
