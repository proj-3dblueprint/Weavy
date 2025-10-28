import { Descope } from '@descope/react-sdk';
import { useCallback } from 'react';
import type { OnSignInSuccessParams } from '@/contexts/AuthContext';
import type { UserResponse } from '@descope/web-js-sdk';

// Shared utility function
export const toAuthUser = (user: UserResponse, sessionToken: string) => {
  return {
    uid: user.userId,
    displayName: user.name || null,
    photoURL: user.picture || null,
    email: user.email || null,
    accessToken: sessionToken,
  };
};

// Base interface for Descope sign-in button props
interface DescopeSignInButtonProps {
  flowId: string;
  onSignInSuccess: (params: OnSignInSuccessParams) => Promise<void>;
  onSignInError: (error: any) => void;
  promotion: OnSignInSuccessParams['promotion'];
  from: OnSignInSuccessParams['route'];
  teamInviteToken?: string | null;
}

// Shared Descope sign-in buttons component
export const DescopeSignInButtons = ({
  flowId,
  onSignInSuccess,
  onSignInError,
  promotion,
  from,
  teamInviteToken,
}: DescopeSignInButtonProps) => {
  const handleSignInSuccess = useCallback(
    (e) => {
      void onSignInSuccess({
        user: toAuthUser(e.detail.user, e.detail.sessionJwt),
        promotion,
        teamInviteToken,
        route: from,
        additionalUserInfo: {
          isNewUser: e.detail.firstSeen ?? false,
        },
      });
    },
    [onSignInSuccess, promotion, teamInviteToken, from],
  );
  return <Descope flowId={flowId} onSuccess={handleSignInSuccess} onError={onSignInError} />;
};
