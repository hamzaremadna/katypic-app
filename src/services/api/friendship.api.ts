import { api } from "./client";

export interface FriendItem {
  friendshipId: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isPublic: boolean;
  since: string;
}

export interface FriendRequestItem {
  friendshipId: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface SearchUserItem {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  friendshipStatus: "PENDING" | "ACCEPTED" | "DECLINED" | null;
  friendshipId: string | null;
  direction: "sent" | "received" | null;
}

export const friendshipApi = {
  /** Search users by username or display name */
  searchUsers: (query: string) =>
    api.get<SearchUserItem[]>(`/friendships/search?q=${encodeURIComponent(query)}`),

  /** List accepted friends */
  getFriends: () => api.get<FriendItem[]>("/friendships"),

  /** List received pending requests */
  getReceivedRequests: () =>
    api.get<FriendRequestItem[]>("/friendships/requests/received"),

  /** List sent pending requests */
  getSentRequests: () =>
    api.get<FriendRequestItem[]>("/friendships/requests/sent"),

  /** Send a friend request */
  sendRequest: (receiverId: string) =>
    api.post("/friendships/request", { receiverId }),

  /** Accept a pending request */
  acceptRequest: (friendshipId: string) =>
    api.post(`/friendships/${friendshipId}/accept`),

  /** Decline a pending request */
  declineRequest: (friendshipId: string) =>
    api.post(`/friendships/${friendshipId}/decline`),

  /** Cancel a sent request */
  cancelRequest: (friendshipId: string) =>
    api.delete(`/friendships/${friendshipId}/cancel`),

  /** Remove an accepted friend */
  removeFriend: (friendshipId: string) =>
    api.delete(`/friendships/${friendshipId}`),
};
