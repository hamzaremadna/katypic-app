import { apiClient } from "./client";

type AuthResponse = { accessToken: string; user: { id: string; email: string; username: string } };

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>("/auth/login", { email, password }),

  register: (email: string, username: string, password: string, displayName?: string) =>
    apiClient.post<AuthResponse>("/auth/register", { email, username, password, displayName }),

  googleOAuth: (idToken: string) =>
    apiClient.post<AuthResponse>("/auth/google", { idToken }),

  appleOAuth: (identityToken: string, fullName?: string) =>
    apiClient.post<AuthResponse>("/auth/apple", { identityToken, fullName }),

  getMe: () =>
    apiClient.get<{ id: string; email: string; username: string }>("/auth/me"),

  requestPasswordReset: (email: string) =>
    apiClient.post<{ message: string }>("/auth/request-password-reset", { email }),
};
