import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDebate, sendMessage, getDebateScore } from '@/services/api';
import type { ScoreResult } from '@/store/debateStore';

export function useCreateDebate() {
  return useMutation({
    mutationFn: (params: { topicId: string; difficulty: string }) =>
      createDebate(params.topicId, params.difficulty),
  });
}

export function useSendMessage() {
  return useMutation({
    mutationFn: (params: { debateId: string; content: string }) =>
      sendMessage(params.debateId, params.content),
  });
}

export function useDebateScore(debateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => getDebateScore(debateId),
    onSuccess: (score: ScoreResult) => {
      queryClient.setQueryData(['debates', debateId, 'score'], score);
    },
  });
}
