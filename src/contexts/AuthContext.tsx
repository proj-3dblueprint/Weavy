import { createContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import noop from 'lodash/noop';
import { CircularProgress } from '@mui/material';
import axios from 'axios';
import { AuthProvider as DescopeAuthProvider } from '@descope/react-sdk';
import { log } from '@/logger/logger.ts';
import useWorkspacesStore from '@/state/workspaces.state';
import { useUserStore } from '@/state/user.state';
import { useGlobalStore } from '@/state/global.state';
import { useFoldersStore } from '@/state/folders.state';
import { FlexCenHorVer } from '@/UI/styles';
import { color } from '@/colors';
import { getAxiosInstance } from '@/services/axiosConfig';
import { useFirebaseAuthProvider } from '@/services/auth/firebase/useFirebaseAuthProvider';
import { useDescopeAuthProvider } from '@/services/auth/descope/useDescopeAuthProvider';
import { getAuthErrorMessage } from '@/services/auth/auth-errors';
import { useAuthConfig } from '@/hooks/useAuthConfig';
import { AUTH_PROVIDERS } from '@/consts/auth.consts';
import { getAppVersion, isVersionGreater as isMajorVersionChanged } from '@/utils/general';
import { INCOMING_HEADER_NAMES, OUTGOING_HEADER_NAMES } from '@/consts/headers';
import server_url from '../globals';
import { asyncNoop } from '../utils/functions';
import type { User, EnrichedUserFields, AuthUser } from '../types/auth.types';
import type { AuthProviderHook } from '@/services/auth/authProvider.types.ts';

const axiosInstance = getAxiosInstance();
const logger = log.getLogger('AuthContext');
export const EMAIL_MISMATCH_ERROR_CODE = 1015;

interface SignedInUser {
  uid: AuthUser['uid'];
  displayName: AuthUser['displayName'];
  photoURL: AuthUser['photoURL'];
  email: AuthUser['email'];
  accessToken?: AuthUser['accessToken'];
}

export interface SignInOptions {
  hintEmail?: string | null;
  microsoftTenantId?: string;
  providerType: 'google' | 'microsoft';
  route: string;
  teamInviteToken?: string | null;
  promotion?: string | null;
}

export interface OnSignInSuccessParams {
  promotion: SignInOptions['promotion'];
  teamInviteToken?: SignInOptions['teamInviteToken'];
  route: SignInOptions['route'];
  additionalUserInfo: {
    isNewUser: boolean;
  } | null;
  user: SignedInUser;
}

interface AuthContextStore {
  currentUser: User | null;
  isSigningIn: boolean;
  signIn: (options: SignInOptions) => Promise<void>;
  signOut: () => Promise<void>;
  authApi: {
    getCurrentUser: () => AuthUser | null;
  };
  teamInviteSuccess: boolean;
  setTeamInviteSuccess: (success: boolean) => void;
  enrichUser: () => Promise<void>;
  onSignInSuccess: (params: OnSignInSuccessParams) => Promise<void>;
  onSignInError: (error: any) => void;
}

export const AuthContext = createContext<AuthContextStore>({
  currentUser: null,
  isSigningIn: false,
  signIn: asyncNoop,
  signOut: asyncNoop,
  authApi: {
    getCurrentUser: () => null,
  },
  teamInviteSuccess: false,
  setTeamInviteSuccess: noop,
  enrichUser: asyncNoop,
  onSignInSuccess: asyncNoop,
  onSignInError: noop,
});

const setDefaultHeaders = (accessToken?: string) => {
  axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  axiosInstance.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
};

const unsetDefaultHeaders = () => {
  delete axios.defaults.headers.Authorization;
  delete axiosInstance.defaults.headers.Authorization;
};

const setProviderHeader = (provider: string) => {
  axios.defaults.headers.common['X-Weavy-Auth-Provider'] = provider;
  axiosInstance.defaults.headers.common['X-Weavy-Auth-Provider'] = provider;
  axios.defaults.headers.common[OUTGOING_HEADER_NAMES.APP_VERSION] = getAppVersion();
  axiosInstance.defaults.headers.common[OUTGOING_HEADER_NAMES.APP_VERSION] = getAppVersion();
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const authInfo = useAuthConfig();
  const isDescope = authInfo.provider === AUTH_PROVIDERS.DESCOPE;

  if (isDescope) {
    return (
      <DescopeAuthProvider
        projectId={authInfo.config!.projectId}
        persistTokens={true}
        autoRefresh={true}
        storeLastAuthenticatedUser={true}
        sessionTokenViaCookie={false}
      >
        <AuthProviderInner useAuthHook={useDescopeAuthProvider}>{children}</AuthProviderInner>
      </DescopeAuthProvider>
    );
  }

  return <AuthProviderInner useAuthHook={useFirebaseAuthProvider}>{children}</AuthProviderInner>;
};

const AuthProviderInner = ({
  children,
  useAuthHook,
}: {
  children: React.ReactNode;
  useAuthHook: () => AuthProviderHook;
}) => {
  const [enrichedUserFields, setEnrichedUserFields] = useState<EnrichedUserFields | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamInviteSuccess, setTeamInviteSuccess] = useState(false);
  const isEnrichingUser = useRef(false);
  const isSigningInRef = useRef(false);
  const { provider } = useAuthConfig();

  // Call the passed-in hook
  const authProvider = useAuthHook();
  const authUser = authProvider.user;
  const isAuthLoading = authProvider.isLoading;
  const accessToken = authProvider.accessToken;
  const authApi = useMemo(
    () => ({
      getCurrentUser: () => authProvider.getCurrentUser(),
    }),
    [authProvider],
  );
  const updateActiveWorkspace = useWorkspacesStore((state) => state.updateActiveWorkspace);
  const initWorkspaces = useWorkspacesStore((state) => state.initWorkspaces);
  const setUser = useUserStore((state) => state.setUser);
  const updateSnackbarData = useGlobalStore((state) => state.updateSnackbarData);

  const currentUser = useMemo(() => {
    if (!enrichedUserFields || !authUser) return null;
    return {
      ...enrichedUserFields,
      ...authUser,
      uid: enrichedUserFields.id, // This override is needed since for users migrated from Firebase to Descope, the authUser.uid won't match the DB saved id
    };
  }, [enrichedUserFields, authUser]);

  // handle identity provider user state changes
  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (authUser) {
      setDefaultHeaders(authUser.accessToken);
      void enrichUser();
    } else {
      setEnrichedUserFields(null);
      unsetDefaultHeaders();
    }
    setLoading(false);
  }, [authUser, isAuthLoading]);

  // handle enriched user state changes
  useEffect(() => {
    if (!currentUser) {
      return;
    }

    updateActiveWorkspace({
      ...currentUser?.activeWorkspace,
    });
    if (currentUser?.workspaces) {
      initWorkspaces(currentUser?.workspaces);
    }

    setUser(currentUser);
  }, [currentUser, initWorkspaces, updateActiveWorkspace, setUser]);

  // handle access token state changes
  useEffect(() => {
    if (accessToken) {
      setDefaultHeaders(accessToken);
    } else {
      setEnrichedUserFields(null);
      unsetDefaultHeaders();
    }
  }, [accessToken]);

  useEffect(() => {
    setProviderHeader(provider);
  }, [provider]);

  const navigate = useNavigate();

  const signOut = useCallback(async () => {
    try {
      await authProvider.signOut();
      // Reset all stores
      useWorkspacesStore.getState().reset();
      useUserStore.getState().reset();
      useGlobalStore.getState().reset();
      useFoldersStore.getState().reset();

      setEnrichedUserFields(null);
      setUser(null);
    } catch (error) {
      logger.error('Error signing out:', error);
      updateSnackbarData({ text: 'An error occurred while signing out.', isOpen: true, icon: null, severity: 'error' });
    }
  }, [setUser, authProvider]);

  const enrichUser = useCallback(async (fromSignIn = false) => {
    if (isEnrichingUser.current) return;
    if (isSigningInRef.current && !fromSignIn) return;
    isEnrichingUser.current = true;
    try {
      const response = await axiosInstance.get('/v1/users');

      // Check for app version updates (same mechanism as axios interceptor)
      const supportedAppVersion = response.headers[INCOMING_HEADER_NAMES.SUPPORTED_APP_VERSION] as string;
      const currentVersion = getAppVersion();
      if (supportedAppVersion && currentVersion) {
        if (isMajorVersionChanged(supportedAppVersion, currentVersion)) {
          logger.info(`New app version detected: ${supportedAppVersion} > ${currentVersion}. Setting refresh alert...`);
          useGlobalStore.getState().setIsShowRefreshAlert(true);
        }
      }

      setEnrichedUserFields(response.data as EnrichedUserFields);
    } catch (error) {
      logger.error('Error enriching user:', error);
    } finally {
      isEnrichingUser.current = false;
    }
  }, []);

  const sendDataToFirstPromoter = (email: string | null) => {
    if (email && window.fpr) {
      try {
        window.fpr('referral', { email });
      } catch (e) {
        logger.warn(`Failed to send data to FirstPromoter: ${String(e)}`);
      }
    }
  };

  const sendSignupEventToGTM = (userId: string, email: string) => {
    if (window.dataLayer) {
      try {
        window.dataLayer.push({
          event: 'sign_up',
          user_id: userId,
          email: email,
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        logger.warn(`Failed to send signup event to GTM: ${String(e)}`);
      }
    }
  };

  const onSignInSuccess = useCallback(
    async ({ user, promotion, teamInviteToken, route, additionalUserInfo }: OnSignInSuccessParams) => {
      if (!user?.uid) {
        logger.error("signIn: uid doesn't exist");
      }
      await axios.post(
        `${server_url}/v1/users/signin`,
        {
          ...user,
          promotion,
        },
        {
          headers: { Authorization: `Bearer ${user.accessToken}` },
        },
      );
      setDefaultHeaders(user.accessToken);

      if (teamInviteToken) {
        try {
          await axios.post(`${server_url}/v1/workspaces/members/invitation/${teamInviteToken}/accept`);
          setTeamInviteSuccess(true);
        } catch (error: any) {
          logger.error('Failed accepting team invitation during sign in', error, {
            errorMessage: error?.message || 'N/A',
            userId: user?.uid,
            teamInviteToken,
          });

          if (
            error?.response?.data?.internalErrorCode === EMAIL_MISMATCH_ERROR_CODE &&
            error?.response?.data?.message
          ) {
            throw new Error(error.response.data.message);
          }

          throw error;
        }
      }

      await enrichUser(true);
      if (additionalUserInfo?.isNewUser) {
        //sign up
        sendDataToFirstPromoter(user.email);
        sendSignupEventToGTM(user.uid, user.email!);
      }

      isSigningInRef.current = false;
      navigate(route);
    },
    [],
  );

  const onSignInError = useCallback((error: any) => {
    const errorMessage = getAuthErrorMessage(provider, error);
    logger.error(`error in signing in user: ${errorMessage}`);
    updateSnackbarData({ text: errorMessage, isOpen: true, icon: null, severity: 'error', duration: 10000 });
    setLoading(false);
    void authProvider.signOut();
  }, []);

  const signIn = useCallback(
    async ({ route, providerType, teamInviteToken, hintEmail, microsoftTenantId, promotion }: SignInOptions) => {
      if (!authProvider.signIn) {
        throw new Error('SignIn method is not supported for this provider');
      }
      isSigningInRef.current = true;
      try {
        const result = await authProvider.signIn(providerType, {
          hintEmail: hintEmail ?? undefined,
          microsoftTenantId,
        });

        const user = result.user;
        const additionalUserInfo = authProvider.getAdditionalUserInfo(result);
        await onSignInSuccess({ user, promotion, route, additionalUserInfo, teamInviteToken });
      } catch (error: any) {
        const errorMessage = getAuthErrorMessage(provider, error);
        logger.error(`error in signing in user: ${errorMessage}`, error, hintEmail, error?.customData);
        isSigningInRef.current = false;
        updateSnackbarData({ text: errorMessage, isOpen: true, icon: null, severity: 'error', duration: 10000 });
        setLoading(false);
        void authProvider.signOut();
      }
    },
    [enrichUser, navigate, authProvider.signOut, updateSnackbarData],
  );

  if (loading || isSigningInRef.current || (!currentUser && isEnrichingUser.current)) {
    return (
      <FlexCenHorVer className="App" sx={{ width: '100vw', height: '100vh', background: color.Black100 }}>
        <CircularProgress disableShrink sx={{ position: 'relative' }} color="inherit" />
      </FlexCenHorVer>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        authApi,
        signIn,
        signOut,
        isSigningIn: isSigningInRef.current,
        teamInviteSuccess,
        onSignInSuccess,
        onSignInError,
        setTeamInviteSuccess,
        enrichUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
