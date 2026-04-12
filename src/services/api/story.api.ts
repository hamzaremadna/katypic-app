import { api } from './client';

export interface StoryPhoto {
  photoId: string;
  url: string;
  thumbnailUrl?: string;
  order: number;
}

export interface Story {
  id: string;
  title: string;
  location?: string;
  coverUrl: string | null;
  photos: StoryPhoto[];
  createdAt: string;
}

export const storyApi = {
  getMyStories: () => api.get<Story[]>('/stories/me'),
  getUserStories: (userId: string) =>
    api.get<Story[]>(`/stories/user/${userId}`),
  createStory: (data: { title: string; location?: string; photoIds: string[] }) =>
    api.post<Story>('/stories', data),
  deleteStory: (id: string) => api.delete(`/stories/${id}`),
};
