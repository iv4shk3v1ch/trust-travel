import { useEffect } from 'react';
import { useToast } from '@/components/ui/ToastManager';
import { profileUpdateService } from '@/services/profileUpdateService';

export function useProfileUpdateToasts() {
  const { showProfileBoostToast } = useToast();

  useEffect(() => {
    // Connect the profile update service to our toast system
    profileUpdateService.setToastCallback(showProfileBoostToast);
  }, [showProfileBoostToast]);

  return {
    saveProfileWithToasts: profileUpdateService.saveProfileWithToasts.bind(profileUpdateService)
  };
}
