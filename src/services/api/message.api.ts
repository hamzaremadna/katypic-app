import { apiClient } from "./client";

export interface Conversation {
  userId: string;
  username: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export const messageApi = {
  getConversations: () =>
    apiClient.get<Conversation[]>("/messages/conversations"),

  getMessages: (userId: string, page = 1) =>
    apiClient.get<{
      messages: DirectMessage[];
      partner: { id: string; username: string };
    }>(`/messages/conversations/${userId}?page=${page}`),

  sendMessage: (userId: string, content: string) =>
    apiClient.post<DirectMessage>(`/messages/${userId}`, { content }),
};
