import { api } from "./client";

export type EventLevel = "BEGINNER" | "ALL_LEVELS" | "INTERMEDIATE" | "ADVANCED";

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
  level: EventLevel;
  status: "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";
  createdBy: { id: string; username: string };
  members?: EventMember[];
  spot?: { id: string; name: string };
  _count?: { members: number };
}

export interface EventMember {
  id: string;
  role: "ORGANIZER" | "PARTICIPANT";
  user: { id: string; username: string };
}

export interface EventJoinRequest {
  id: string;
  eventId: string;
  userId: string;
  message: string;
  portfolioUrl?: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  createdAt: string;
  event: Event;
}

export const EVENT_LEVEL_LABELS: Record<EventLevel, string> = {
  BEGINNER: "Débutant",
  ALL_LEVELS: "Tous niveaux",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
};

export const eventApi = {
  listByLocation: (lat: number, lng: number, radius = 10) =>
    api.get<Event[]>(`/events?lat=${lat}&lng=${lng}&radius=${radius}`),

  get: (eventId: string) => api.get<Event>(`/events/${eventId}`),

  getMyEvents: () => api.get<{ upcoming: Event[]; past: Event[] }>("/events/me"),

  getCreatedEvents: () => api.get<Event[]>("/events/created"),

  getPendingRequests: () => api.get<EventJoinRequest[]>("/events/pending"),

  getCoverUploadUrl: () =>
    api.get<{ uploadUrl: string; coverUrl: string }>("/events/cover-upload-url"),

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
    level?: EventLevel;
    isPublic?: boolean;
    photoType?: string;
    hasModel?: boolean;
  }) => api.post<Event>("/events", data),

  join: (eventId: string) => api.post(`/events/${eventId}/join`),

  leave: (eventId: string) => api.post(`/events/${eventId}/leave`),

  requestJoin: (eventId: string, data: { message: string; portfolioUrl?: string }) =>
    api.post<EventJoinRequest>(`/events/${eventId}/request`, data),
};
