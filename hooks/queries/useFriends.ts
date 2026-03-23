import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFriends, searchUsers, addFriend, removeFriend, type Friend } from '@/services/api';

export function useFriends() {
  return useQuery<Friend[]>({
    queryKey: ['friends'],
    queryFn: getFriends,
  });
}

export function useSearchUsers(query: string) {
  return useQuery<Friend[]>({
    queryKey: ['users', 'search', query],
    queryFn: () => searchUsers(query),
    enabled: query.length >= 2,
  });
}

export function useAddFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addFriend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}

export function useRemoveFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeFriend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['rankings', 'friends'] });
    },
  });
}
