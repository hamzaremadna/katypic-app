import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { spotApi } from "@/services/api/spot.api";

export function useSpot(spotId: string) {
  return useQuery({
    queryKey: ["spot", spotId],
    queryFn: () => spotApi.get(spotId).then((r) => r.data),
    enabled: !!spotId,
  });
}

export function useSpotReviews(spotId: string) {
  return useQuery({
    queryKey: ["spot", spotId, "reviews"],
    queryFn: () => spotApi.getReviews(spotId).then((r) => r.data),
    enabled: !!spotId,
  });
}

export function useFavoriteSpots() {
  return useQuery({
    queryKey: ["spots", "favorites"],
    queryFn: () => spotApi.getFavorites().then((r) => r.data),
  });
}

export function useAddSpotReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ spotId, rating, comment }: { spotId: string; rating: number; comment?: string }) =>
      spotApi.addReview(spotId, { rating, comment }),
    onSuccess: (_data, { spotId }) => {
      queryClient.invalidateQueries({ queryKey: ["spot", spotId, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["spot", spotId] });
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (spotId: string) => spotApi.toggleFavorite(spotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spots", "favorites"] });
    },
  });
}
