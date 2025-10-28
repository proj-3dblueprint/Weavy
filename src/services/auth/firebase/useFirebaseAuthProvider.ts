import { useState, useEffect, useCallback } from 'react';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider,
  getAdditionalUserInfo as firebaseGetAdditionalUserInfo,
  onIdTokenChanged as firebaseOnIdTokenChanged,
  UserCredential,
} from 'firebase/auth';
import { User } from 'firebase/auth';
import { log } from '@/logger/logger.ts';
import { auth } from '../../firebase';
import type { AuthUser } from '@/types/auth.types';
import type { AuthProviderHook, SignInResult } from './../authProvider.types';

const logger = log.getLogger('useFirebaseAuthProvider');

type UserFromCallback = User | null;

export const useFirebaseAuthProvider = (): AuthProviderHook => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const updateSessionToken = useCallback(async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const token = await firebaseUser.getIdToken();
        setSessionToken(token);
      } catch (error) {
        logger.error('Error getting ID token:', error);
        setSessionToken(null);
      }
    } else {
      setSessionToken(null);
    }
  }, []);

  // handle user state changes
  useEffect(() => {
    const unsubscribe = firebaseOnAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser as UserFromCallback);
      void updateSessionToken(firebaseUser);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // handle id token changes
  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribe = firebaseOnIdTokenChanged(auth, (firebaseUser) => {
      void updateSessionToken(firebaseUser);
    });

    return unsubscribe;
  }, [user]);

  const signIn = useCallback(
    async (
      provider: 'google' | 'microsoft',
      options?: {
        hintEmail?: string;
        microsoftTenantId?: string;
      },
    ) => {
      let firebaseProvider: OAuthProvider | GoogleAuthProvider;
      const customParams: { tenant?: string; login_hint?: string } = {};

      if (provider === 'google') {
        firebaseProvider = new GoogleAuthProvider();
      } else if (provider === 'microsoft') {
        firebaseProvider = new OAuthProvider('microsoft.com');

        if (options?.microsoftTenantId) {
          customParams.tenant = options.microsoftTenantId;
        }
      } else {
        throw new Error('Unsupported provider');
      }

      if (options?.hintEmail) {
        customParams.login_hint = options.hintEmail;
      }
      firebaseProvider.setCustomParameters(customParams);

      const result = await signInWithPopup(auth, firebaseProvider);

      // Return the result directly like the original FirebaseAuthProvider
      return result as SignInResult;
    },
    [],
  );

  const signOut = useCallback(async (): Promise<void> => {
    const result = await firebaseSignOut(auth);
    return result;
  }, []);

  const getCurrentUser = useCallback(() => {
    return auth.currentUser;
  }, []);

  const getAdditionalUserInfo = useCallback((result: SignInResult) => {
    return firebaseGetAdditionalUserInfo(result as UserCredential);
  }, []);

  const getIdToken = useCallback(async () => {
    return auth.currentUser?.getIdToken() || null;
  }, []);

  return {
    signIn,
    signOut,
    getIdToken,
    getCurrentUser,
    getAdditionalUserInfo,
    user,
    isLoading,
    accessToken: sessionToken,
  };
};
