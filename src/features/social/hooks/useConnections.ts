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
import { useAuth } from '@/features/auth/AuthContext';

// Query keys for cache management
export const connectionKeys = {
  all: ['connections'] as const,
  myConnections: (userId?: string) => [...connectionKeys.all, 'my-connections', userId ?? 'anon'] as const,
  whoTrustsMe: (userId?: string) => [...connectionKeys.all, 'who-trusts-me', userId ?? 'anon'] as const,
};

/**
 * Hook to fetch user's connections (people they trust)
 */
export function useMyConnections() {
  const { user } = useAuth();

  return useQuery({
    queryKey: connectionKeys.myConnections(user?.id),
    queryFn: getMyConnections,
    enabled: Boolean(user?.id),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch users who trust the current user
 */
export function useWhoTrustsMe() {
  const { user } = useAuth();

  return useQuery({
    queryKey: connectionKeys.whoTrustsMe(user?.id),
    queryFn: getUsersWhoTrustMe,
    enabled: Boolean(user?.id),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to disconnect from a user with automatic cache invalidation
 */
export function useDisconnectUser() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const myConnectionsKey = connectionKeys.myConnections(user?.id);
  const whoTrustsMeKey = connectionKeys.whoTrustsMe(user?.id);

  return useMutation({
    mutationFn: (userId: string) => disconnectFromUser(userId),
    
    // Optimistic update: Remove user from cache immediately
    onMutate: async (userId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: myConnectionsKey });

      // Get current data
      const previousConnections = queryClient.getQueryData<UserConnection[]>(
        myConnectionsKey
      );

      // Optimistically update
      if (previousConnections) {
        queryClient.setQueryData<UserConnection[]>(
          myConnectionsKey,
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
          myConnectionsKey,
          context.previousConnections
        );
      }
    },

    // Refetch to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: myConnectionsKey });
      queryClient.invalidateQueries({ queryKey: whoTrustsMeKey });
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
