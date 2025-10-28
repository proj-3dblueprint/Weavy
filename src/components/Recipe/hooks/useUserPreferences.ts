import { useCallback, useMemo } from 'react';
import { getAxiosInstance } from '@/services/axiosConfig';
import { log } from '@/logger/logger';
import { useUserStore } from '@/state/user.state';
import { UserPreferenceKey } from '@/types/auth.types';
import type { User, UserPreferenceValue } from '@/types/auth.types';

const logger = log.getLogger('useUserPreferences');
const axiosInstance = getAxiosInstance();

export const useUserPreferences = () => {
  // Subscribe to the full user object but only recalculate when preferences change
  const user: User | null = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  // Memoize reactive preference values - only recalculate when preferences object changes
  const userPrefOnScroll = useMemo(() => user?.preferences?.panOnScroll ?? true, [user?.preferences]);
  const userPrefShowFloatMenuOnRightClick = useMemo(
    () => user?.preferences?.showFloatMenuOnRightClick ?? true,
    [user?.preferences],
  );
  const userPrefRequireAltKeyForSuggestions = useMemo(
    () => user?.preferences?.requireAltKeyForSuggestions ?? false,
    [user?.preferences],
  );

  // Helper function to update user preferences in the store and API
  const updateUserPreference = useCallback(
    async (key: UserPreferenceKey, value: UserPreferenceValue) => {
      // Store original value for rollback
      const originalValue = user?.preferences?.[key];

      // Update Zustand store immediately (optimistic update)
      if (user) {
        setUser({
          ...user,
          preferences: {
            ...user.preferences,
            [key]: value,
          },
        });
      }

      try {
        await axiosInstance.put(`/v1/users/preferences`, {
          [key]: value,
        });
      } catch (error) {
        logger.error('Error updating user preferences', error);
        // Rollback on error - restore original value
        if (user) {
          setUser({
            ...user,
            preferences: {
              ...user.preferences,
              [key]: originalValue,
            },
          });
        }
      }
    },
    [user, setUser],
  );

  const handlePanOnScrollChange = useCallback(
    async (newValue: boolean) => {
      await updateUserPreference('panOnScroll', newValue);
    },
    [updateUserPreference],
  );

  const handleShowFloatMenuOnRightClickChange = useCallback(
    async (newValue: boolean) => {
      await updateUserPreference('showFloatMenuOnRightClick', newValue);
    },
    [updateUserPreference],
  );

  const handleRequireAltKeyForSuggestionsChange = useCallback(
    async (newValue: boolean) => {
      await updateUserPreference('requireAltKeyForSuggestions', newValue);
    },
    [updateUserPreference],
  );

  return {
    userPrefOnScroll,
    userPrefShowFloatMenuOnRightClick,
    userPrefRequireAltKeyForSuggestions,
    handlePanOnScrollChange,
    handleShowFloatMenuOnRightClickChange,
    handleRequireAltKeyForSuggestionsChange,
  };
};
