import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';

export function useAuthGuard() {
  const { user, loading, error } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (error === 'NEEDS_ONBOARDING') {
        router.push('/onboarding');
      }
    }
  }, [user, loading, error, router]);
  
  return { user, loading };
}
