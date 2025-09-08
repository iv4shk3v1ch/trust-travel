import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';

export function useAuthGuard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        setIsReady(true);
      }
    }
  }, [user, loading, router]);

  return {
    loading: loading || !isReady,
    user
  };
}
