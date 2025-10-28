// Auth provider configuration
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { FF_DESCOPE_AUTH } from '@/consts/featureFlags';
import { DESCOPE_PROJECT_ID } from '@/consts/auth.consts';
import { AUTH_PROVIDERS } from '@/consts/auth.consts';
import type { AuthProvider } from '@/services/auth/authProvider.types';

interface DescopeConfig {
  projectId: string;
}

interface AuthConfig {
  config?: DescopeConfig;
  provider: AuthProvider;
}

export const useAuthConfig = (): AuthConfig => {
  const isDescope = useFeatureFlagEnabled(FF_DESCOPE_AUTH);
  return isDescope
    ? {
        config: {
          projectId: DESCOPE_PROJECT_ID,
        },
        provider: AUTH_PROVIDERS.DESCOPE,
      }
    : {
        provider: AUTH_PROVIDERS.FIREBASE,
      };
};
