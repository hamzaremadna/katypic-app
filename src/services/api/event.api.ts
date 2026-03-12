import { api } from "./client";

export interface Event {
  id: string;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  address?: string;
  startsAt: string;
  endsAt: string;
  maxParticipants?: number;
  coverImageUrl?: string;
  isPublic: boolean;
  status: "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";
  createdBy: { id: string; username: string };
  spot?: { id: string; name: string };
  _count?: { members: number };
}

export interface EventMember {
  id: string;
  role: "ORGANIZER" | "PARTICIPANT";
  user: { id: string; username: string };
}

export const eventApi = {
  listByLocation: (lat: number, lng: number, radius = 10) =>
    api.get<Event[]>(`/events?lat=${lat}&lng=${lng}&radius=${radius}`),

  get: (eventId: string) => api.get<Event>(`/events/${eventId}`),

  create: (data: {
    title: string;
    description?: string;
    latitude: number;
    longitude: number;
    address?: string;
    startsAt: string;
    endsAt: string;
    maxParticipants?: number;
    spotId?: string;
    coverImageUrl?: string;
  }) => api.post<Event>("/events", data),

  join: (eventId: string) => api.post(`/events/${eventId}/join`),

  leave: (eventId: string) => api.post(`/events/${eventId}/leave`),
};
