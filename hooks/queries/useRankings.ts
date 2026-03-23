import { useQuery } from '@tanstack/react-query';
import { getGlobalRankings, getFriendsRankings, type RankingEntry } from '@/services/api';

export function useGlobalRankings() {
  return useQuery<RankingEntry[]>({
    queryKey: ['rankings', 'global'],
    queryFn: getGlobalRankings,
  });
}

export function useFriendsRankings() {
  return useQuery<RankingEntry[]>({
    queryKey: ['rankings', 'friends'],
    queryFn: getFriendsRankings,
  });
}
