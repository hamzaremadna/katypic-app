import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventApi } from "@/services/api/event.api";

export function useEvent(eventId: string) {
  return useQuery({
    queryKey: ["event", eventId],
    queryFn: () => eventApi.get(eventId).then((r) => r.data),
    enabled: !!eventId,
  });
}

export function useMyEvents() {
  return useQuery({
    queryKey: ["events", "my"],
    queryFn: () => eventApi.getMyEvents().then((r) => r.data),
  });
}

export function useCreatedEvents() {
  return useQuery({
    queryKey: ["events", "created"],
    queryFn: () => eventApi.getCreatedEvents().then((r) => r.data),
  });
}

export function usePendingRequests() {
  return useQuery({
    queryKey: ["events", "pending"],
    queryFn: () => eventApi.getPendingRequests().then((r) => r.data),
  });
}

export function useJoinEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => eventApi.join(eventId),
    onSuccess: (_data, eventId) => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events", "my"] });
    },
  });
}

export function useLeaveEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => eventApi.leave(eventId),
    onSuccess: (_data, eventId) => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events", "my"] });
    },
  });
}

export function useRequestJoin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, message, portfolioUrl }: { eventId: string; message: string; portfolioUrl?: string }) =>
      eventApi.requestJoin(eventId, { message, portfolioUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", "pending"] });
    },
  });
}
