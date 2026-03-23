import { useQuery } from '@tanstack/react-query';
import { getTopics, type Topic } from '@/services/api';

export function useTopics() {
  return useQuery<Topic[]>({
    queryKey: ['topics'],
    queryFn: getTopics,
  });
}
