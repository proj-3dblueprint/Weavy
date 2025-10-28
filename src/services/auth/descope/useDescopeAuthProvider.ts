import { useDescope, useSession, useUser } from '@descope/react-sdk';
import { useEffect, useState } from 'react';
import type { AuthProviderHook } from './../authProvider.types';
import type { AuthUser } from '@/types/auth.types';

// This is a hook-based implementation that wraps the Descope React SDK
export const useDescopeAuthProvider = (): AuthProviderHook => {
  const { isAuthenticated, isSessionLoading, sessionToken } = useSession();
  const { user, isUserLoading } = useUser();
  const sdk = useDescope();
  const [userAuthData, setUserAuthData] = useState<AuthUser | null>(null);
  // use an effect to map descope user to generic auth user
  useEffect(() => {
    if (isAuthenticated && user) {
      setUserAuthData({
        uid: user.userId,
        email: user.email || null,
        displayName: user.name || null,
        photoURL: user.picture || null,
        accessToken: sessionToken,
        getIdToken: () => Promise.resolve(sessionToken),
      });
    } else {
      setUserAuthData(null);
    }
  }, [isAuthenticated, user, sessionToken]);

  const signOut = async (): Promise<void> => {
    const result = await sdk.logout();
    if (!result.ok) {
      throw new Error(result.error?.errorMessage || 'Logout failed');
    }
  };

  const getCurrentUser = () => {
    if (!isAuthenticated || isUserLoading) {
      return null;
    }
    return userAuthData;
  };

  const getIdToken = async (forceRefresh: boolean = false) => {
    if (forceRefresh) {
      const result = await sdk.refresh();
      if (!result.ok) {
        throw new Error(result.error?.errorMessage || 'Refresh session failed');
      }
      return result.data?.sessionJwt || null;
    }
    return sessionToken;
  };

  return {
    signOut,
    getCurrentUser,
    getIdToken,
    user: isAuthenticated ? userAuthData : null,
    isLoading: isSessionLoading || isUserLoading || (isAuthenticated && !userAuthData),
    accessToken: sessionToken,
    getAdditionalUserInfo: (signInUserResult) => {
      return {
        isNewUser: signInUserResult.additionalUserInfo?.isNewUser || false,
      };
    },
  };
};
