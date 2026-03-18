import { api } from "./client";

export interface Profile {
  id: string;
  userId: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  isPublic: boolean;
  coachAvatar: string;
  city?: string;
  country?: string;
  user?: { username: string; email: string };
}

export interface CreativeProfile {
  id: string;
  musicPreferences: string[];
  filmPreferences: string[];
  artistPreferences: string[];
  visualPreferences: string[];
  styleTags: string[];
  personalitySummary?: string;
}

export const profileApi = {
  getMyProfile: () => api.get<Profile>("/profiles/me"),

  updateProfile: (data: {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    isPublic?: boolean;
    coachAvatar?: string;
    city?: string;
    country?: string;
  }) => api.patch<Profile>("/profiles/me", data),

  getPublicProfile: (userId: string) =>
    api.get<{ profile: Profile; photos: any[]; creativeProfile: CreativeProfile | null }>(`/profiles/${userId}`),

  saveCreativeProfile: (data: {
    musicPreferences: string[];
    filmPreferences: string[];
    artistPreferences: string[];
    visualPreferences: string[];
  }) => api.post<CreativeProfile>("/onboarding/creative-profile", data),

  getCreativeProfile: () =>
    api.get<CreativeProfile>("/onboarding/creative-profile"),

  getAvatarUploadUrl: () =>
    api.post<{ uploadUrl: string; avatarUrl: string }>(
      "/profiles/me/avatar-upload-url"
    ),

  requestPasswordReset: (email: string) =>
    api.post<{ message: string }>("/auth/request-password-reset", { email }),
};
