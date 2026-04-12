import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storyApi, Story } from '../services/api/story.api';

export function useMyStories() {
  return useQuery({
    queryKey: ['stories', 'me'],
    queryFn: () => storyApi.getMyStories().then((r) => r.data),
  });
}

export function useUserStories(userId: string | undefined) {
  return useQuery({
    queryKey: ['stories', userId],
    queryFn: () => storyApi.getUserStories(userId!).then((r) => r.data),
    enabled: !!userId,
  });
}

export function useCreateStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; location?: string; photoIds: string[] }) =>
      storyApi.createStory(data).then((r) => r.data as Story),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories', 'me'] });
    },
  });
}

export function useDeleteStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => storyApi.deleteStory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories', 'me'] });
    },
  });
}
