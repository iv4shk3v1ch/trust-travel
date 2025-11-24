/**
 * React Query hooks for social connections
 * 
 * These hooks provide automatic caching, background refetching,
 * and request deduplication for connection data.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getMyConnections, 
  getUsersWhoTrustMe, 
  disconnectFromUser,
  type UserConnection
} from '../connections';

// Query keys for cache management
export const connectionKeys = {
  all: ['connections'] as const,
  myConnections: () => [...connectionKeys.all, 'my-connections'] as const,
  whoTrustsMe: () => [...connectionKeys.all, 'who-trusts-me'] as const,
};

/**
 * Hook to fetch user's connections (people they trust)
 */
export function useMyConnections() {
  return useQuery({
    queryKey: connectionKeys.myConnections(),
    queryFn: getMyConnections,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch users who trust the current user
 */
export function useWhoTrustsMe() {
  return useQuery({
    queryKey: connectionKeys.whoTrustsMe(),
    queryFn: getUsersWhoTrustMe,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to disconnect from a user with automatic cache invalidation
 */
export function useDisconnectUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => disconnectFromUser(userId),
    
    // Optimistic update: Remove user from cache immediately
    onMutate: async (userId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: connectionKeys.myConnections() });

      // Get current data
      const previousConnections = queryClient.getQueryData<UserConnection[]>(
        connectionKeys.myConnections()
      );

      // Optimistically update
      if (previousConnections) {
        queryClient.setQueryData<UserConnection[]>(
          connectionKeys.myConnections(),
          previousConnections.filter(conn => conn.target_user !== userId)
        );
      }

      // Return context for rollback
      return { previousConnections };
    },

    // Rollback on error
    onError: (_err, _userId, context) => {
      if (context?.previousConnections) {
        queryClient.setQueryData(
          connectionKeys.myConnections(),
          context.previousConnections
        );
      }
    },

    // Refetch to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: connectionKeys.myConnections() });
      queryClient.invalidateQueries({ queryKey: connectionKeys.whoTrustsMe() });
    },
  });
}

/**
 * Hook to fetch both connections and trustees in parallel
 * 
 * This is more efficient than calling useMyConnections() and useWhoTrustsMe()
 * separately when you need both datasets.
 */
export function useAllConnections() {
  const myConnections = useMyConnections();
  const whoTrustsMe = useWhoTrustsMe();

  return {
    myConnections: myConnections.data ?? [],
    whoTrustsMe: whoTrustsMe.data ?? [],
    isLoading: myConnections.isLoading || whoTrustsMe.isLoading,
    isError: myConnections.isError || whoTrustsMe.isError,
    error: myConnections.error || whoTrustsMe.error,
    refetch: () => {
      myConnections.refetch();
      whoTrustsMe.refetch();
    },
  };
}
