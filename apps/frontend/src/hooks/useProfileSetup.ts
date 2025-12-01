import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

interface UseProfileSetupReturn {
  showInterestsSetup: boolean;
  closeInterestsSetup: () => void;
  userInterests: string[];
}

/**
 * Hook to check if user needs to complete profile setup
 * Shows interests modal if user has no interests set
 */
export function useProfileSetup(): UseProfileSetupReturn {
  const [showInterestsSetup, setShowInterestsSetup] = useState(false);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    // Check if user should see interests setup
    if (isAuthenticated && user) {
      // Show if user has no interests (empty array or undefined)
      const hasInterests = user.interests && user.interests.length > 0;
      
      // Check if this is first login (you can add a flag to user if needed)
      // For now, always show if no interests
      if (!hasInterests) {
        setShowInterestsSetup(true);
      }
    }
  }, [isAuthenticated, user]);

  return {
    showInterestsSetup,
    closeInterestsSetup: () => setShowInterestsSetup(false),
    userInterests: user?.interests || [],
  };
}
