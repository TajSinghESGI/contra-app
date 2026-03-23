import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getChallenges,
  getChallenge,
  createChallenge,
  acceptChallenge,
  declineChallenge,
  type Challenge,
} from '@/services/api';

export function useChallenges() {
  return useQuery<Challenge[]>({
    queryKey: ['challenges'],
    queryFn: getChallenges,
  });
}

export function useChallenge(id: string) {
  return useQuery<Challenge>({
    queryKey: ['challenges', id],
    queryFn: () => getChallenge(id),
    enabled: !!id,
  });
}

export function useCreateChallenge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { toUserId: string; topic: string; topicLabel: string; difficulty: string }) =>
      createChallenge(params.toUserId, params.topic, params.topicLabel, params.difficulty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });
}

export function useAcceptChallenge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: acceptChallenge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });
}

export function useDeclineChallenge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: declineChallenge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });
}
