'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create QueryClient inside component to ensure it's only created once per client
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: How long data is considered fresh (5 minutes)
            staleTime: 1000 * 60 * 5,
            
            // Cache time: How long unused data stays in cache (30 minutes)
            gcTime: 1000 * 60 * 30, // Previously called 'cacheTime'
            
            // Don't refetch on window focus (annoying for dev)
            refetchOnWindowFocus: false,
            
            // Retry failed requests 1 time
            retry: 1,
            
            // Don't refetch on mount if data is still fresh
            refetchOnMount: false,
          },
          mutations: {
            // Retry failed mutations 1 time
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
