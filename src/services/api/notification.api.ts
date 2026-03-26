import { api } from "./client";

export interface AppNotification {
  id: string;
  type: "message" | "friend_request" | "friend_accept" | "quest_complete" | "like";
  title: string;
  body: string;
  data: Record<string, string>;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  total: number;
  unreadCount: number;
}

export const notificationApi = {
  getNotifications: (page = 1, limit = 30) =>
    api.get<NotificationsResponse>("/notifications", { params: { page, limit } }),

  getUnreadCount: () =>
    api.get<{ count: number }>("/notifications/unread-count"),

  markAllRead: () =>
    api.patch("/notifications/read-all"),

  markOneRead: (id: string) =>
    api.patch(`/notifications/${id}/read`),
};
