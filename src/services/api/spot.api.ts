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
}

export const spotApi = {
  listByBounds: (minLat: number, maxLat: number, minLng: number, maxLng: number) =>
    api.get<Spot[]>(
      `/spots?minLat=${minLat}&maxLat=${maxLat}&minLng=${minLng}&maxLng=${maxLng}`
    ),

  get: (spotId: string) => api.get<Spot>(`/spots/${spotId}`),

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
