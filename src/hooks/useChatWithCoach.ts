import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { aiApi, ChatMessage } from "../services/api/ai.api";

export function useChatSessions() {
  return useQuery({
    queryKey: ["chatSessions"],
    queryFn: () => aiApi.listChatSessions().then((r) => r.data),
  });
}

export function useChatSession(sessionId: string) {
  return useQuery({
    queryKey: ["chatSession", sessionId],
    queryFn: () => aiApi.getChatSession(sessionId).then((r) => r.data),
    enabled: !!sessionId,
  });
}

export function useChatWithCoach(sessionId: string) {
  const queryClient = useQueryClient();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useMutation({
    mutationFn: ({ content, imageUrl }: { content: string; imageUrl?: string }) =>
      aiApi.sendMessage(sessionId, content, imageUrl).then((r) => r.data),
    onMutate: () => {
      setIsSending(true);
      setError(null);
    },
    onSettled: () => setIsSending(false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatSession", sessionId] });
    },
    onError: (err: Error) => {
      setError(err.message || "Impossible d'envoyer le message. Réessayez.");
    },
  });

  const createSession = useCallback(
    async (photoId?: string, title?: string) => {
      const { data } = await aiApi.createChatSession(photoId, title);
      return data;
    },
    []
  );

  const clearError = useCallback(() => setError(null), []);

  return { sendMessage, isSending, error, clearError, createSession };
}
