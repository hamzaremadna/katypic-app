import { api } from "./client";

export interface Photo {
  id: string;
  url: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  fileSizeBytes: number;
  cameraMode: "SIMPLE" | "PRO";
  isPublic: boolean;
  isFavorite: boolean;
  caption?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  analyses?: PhotoAnalysis[];
}

export interface PhotoAnalysis {
  id: string;
  overallScore: number;
  compositionScore: number;
  lightingScore: number;
  colorScore: number;
  technicalScore: number;
  feedbackSummary: string;
  compositionFeedback: string;
  lightingFeedback: string;
  colorFeedback: string;
  technicalFeedback: string;
  suggestions: string[];
  annotations: unknown[];
}

export const photoApi = {
  getUploadUrl: (mimeType?: string) =>
    api.post<{ uploadUrl: string; key: string; bucket: string; publicUrl: string }>(
      "/photos/upload-url",
      { mimeType }
    ),

  create: (data: {
    s3Key: string;
    url: string;
    width: number;
    height: number;
    fileSizeBytes: number;
    cameraMode?: string;
    caption?: string;
    latitude?: number;
    longitude?: number;
  }) => api.post<Photo>("/photos", data),

  list: (page = 1, limit = 20) =>
    api.get<{ photos: Photo[]; total: number; page: number; totalPages: number }>(
      `/photos?page=${page}&limit=${limit}`
    ),

  get: (photoId: string) => api.get<Photo>(`/photos/${photoId}`),

  update: (photoId: string, data: { isPublic?: boolean; caption?: string }) =>
    api.patch<Photo>(`/photos/${photoId}`, data),

  delete: (photoId: string) => api.delete(`/photos/${photoId}`),

  /** Multipart file upload for local dev mode */
  uploadFile: (formData: FormData) =>
    api.post<{ key: string; publicUrl: string }>("/photos/upload-file", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};
