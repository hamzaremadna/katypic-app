import { api } from "./client";

export interface Spot {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  address?: string;
  category: string;
  tags: string[];
  photoCount: number;
  visitCount: number;
  averageRating?: number;
  isVerified: boolean;
  thumbnailUrl?: string;
  isFavorited?: boolean;
  photos?: Array<{ id: string; photo: { id: string; url: string; thumbnailUrl?: string } }>;
}

export interface SpotReview {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    profile?: { avatarUrl?: string; displayName?: string } | null;
  };
}

export interface SpotReviewsResponse {
  reviews: SpotReview[];
  stats: {
    average: number;
    total: number;
    histogram: Record<number, number>;
  };
}

export const spotApi = {
  listByBounds: (minLat: number, maxLat: number, minLng: number, maxLng: number) =>
    api.get<Spot[]>(
      `/spots?minLat=${minLat}&maxLat=${maxLat}&minLng=${minLng}&maxLng=${maxLng}`
    ),

  get: (spotId: string) => api.get<Spot>(`/spots/${spotId}`),

  getReviews: (spotId: string) => api.get<SpotReviewsResponse>(`/spots/${spotId}/reviews`),

  addReview: (spotId: string, data: { rating: number; comment?: string }) =>
    api.post<SpotReview>(`/spots/${spotId}/reviews`, data),

  getFavorites: () => api.get<Spot[]>("/spots/favorites"),

  toggleFavorite: (spotId: string) =>
    api.post<{ favorited: boolean }>(`/spots/${spotId}/favorite`),

  create: (data: {
    name: string;
    description?: string;
    latitude: number;
    longitude: number;
    address?: string;
    category?: string;
    tags?: string[];
  }) => api.post<Spot>("/spots", data),

  addPhoto: (spotId: string, photoId: string) =>
    api.post(`/spots/${spotId}/photos`, { photoId }),
};
