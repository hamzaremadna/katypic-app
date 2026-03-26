import { api } from "./client";

export interface BlockStatus {
  blocked: boolean;
  muted: boolean;
}

export const blockApi = {
  blockUser: (userId: string) =>
    api.post(`/users/${userId}/block`),

  unblockUser: (userId: string) =>
    api.delete(`/users/${userId}/block`),

  muteUser: (userId: string) =>
    api.post(`/users/${userId}/mute`),

  unmuteUser: (userId: string) =>
    api.delete(`/users/${userId}/mute`),

  getBlockStatus: (userId: string) =>
    api.get<BlockStatus>(`/users/${userId}/block-status`),
};
