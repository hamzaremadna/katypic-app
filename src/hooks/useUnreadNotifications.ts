import { useQuery } from "@tanstack/react-query";
import { notificationApi } from "../services/api/notification.api";

const REFETCH_INTERVAL_MS = 30_000;

export function useUnreadNotifications() {
  const { data } = useQuery({
    queryKey: ["notifUnread"],
    queryFn: () => notificationApi.getUnreadCount().then((r) => r.data),
    refetchInterval: REFETCH_INTERVAL_MS,
  });
  return data?.count ?? 0;
}
