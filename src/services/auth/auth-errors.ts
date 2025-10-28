import { getFirebaseAuthErrorMessage } from '@/services/auth/firebase/firebase-errors';
import { getDescopeAuthErrorMessage } from '@/services/auth/descope/descope-errors';
import { AUTH_PROVIDERS } from '@/consts/auth.consts';
import type { AuthProvider } from '@/services/auth/authProvider.types';

/**
 * Generic auth error handler that routes to the appropriate error handler
 * based on the current auth configuration
 */
export const getAuthErrorMessage = (provider: AuthProvider, error: any): string => {
  switch (provider) {
    case AUTH_PROVIDERS.DESCOPE:
      return getDescopeAuthErrorMessage(error);
    case AUTH_PROVIDERS.FIREBASE:
    default:
      return getFirebaseAuthErrorMessage(error);
  }
};
