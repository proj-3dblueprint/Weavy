import { useContext, useEffect, useState } from 'react';
import { Box, Button, styled, Typography } from '@mui/material';
import { useNavigate, useLocation, Location, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import GoogleLogo from '@/UI/Icons/GoogleLogo';
import MicrosoftLogo from '@/UI/Icons/MicrosoftLogo';
import { AuthContext } from '@/contexts/AuthContext';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { useAuthConfig } from '@/hooks/useAuthConfig';
import { DescopeSignInButtons } from '@/components/Common/Authentication/DescopeSignInButtons';
import { AUTH_PROVIDERS, DESCOPE_FLOW_IDS } from '@/consts/auth.consts';
import type { SignInOptions } from '@/contexts/AuthContext';

const StyledSignInButton = styled(Button)(() => ({
  alignItems: 'center',
  borderRadius: '8px',
  width: '240px',
  backgroundColor: 'transparent',
  border: `1px solid rgba(242, 240, 248, 0.5)`,
  color: color.White100,
  display: 'flex',
  height: '42px',
  gap: '8px',

  '&:hover': {
    backgroundColor: color.Black84,
  },
}));

const useWrappedLocation = () => {
  const location = useLocation();
  return location as Location<{ from?: string }>;
};

const FirebaseSignInButtons = ({
  signIn,
  from,
  promotion,
  teamInviteToken,
  hintEmail,
  microsoftTenantId,
}: {
  signIn: (options: SignInOptions) => Promise<void>;
  from: string;
  promotion: string | null;
  teamInviteToken?: string | null;
  hintEmail?: string | null;
  microsoftTenantId?: string;
}) => {
  const { t } = useTranslation();

  const googleSignIn = () =>
    void signIn({ route: from, providerType: 'google', teamInviteToken, hintEmail, promotion });
  const microsoftSignIn = () =>
    void signIn({ route: from, providerType: 'microsoft', teamInviteToken, hintEmail, microsoftTenantId, promotion });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <StyledSignInButton variant="contained" onClick={googleSignIn}>
        <GoogleLogo width={24} height={24} title="Google logo" />
        <Typography variant="body-std-rg" color={color.White100}>
          {t(I18N_KEYS.SIGN_IN_PAGE.GOOGLE_SIGN_IN_BUTTON)}
        </Typography>
      </StyledSignInButton>
      <StyledSignInButton variant="contained" onClick={microsoftSignIn}>
        <MicrosoftLogo width={24} height={24} title="Microsoft logo" />
        <Typography variant="body-std-rg" color={color.White100}>
          {t(I18N_KEYS.SIGN_IN_PAGE.MICROSOFT_SIGN_IN_BUTTON)}
        </Typography>
      </StyledSignInButton>
    </Box>
  );
};

// pass token and email and remove form url when enter this one
export function TempSignin({
  fullScreen = true,
  teamInviteToken,
  hintEmail,
  microsoftTenantId,
}: {
  fullScreen?: boolean;
  teamInviteToken?: string | null;
  hintEmail?: string | null;
  microsoftTenantId?: string;
}) {
  const navigate = useNavigate();
  const location = useWrappedLocation();
  const [searchParams] = useSearchParams();
  const promotion = searchParams.get('promotion');
  const { provider } = useAuthConfig();
  const isDescope = provider === AUTH_PROVIDERS.DESCOPE;

  const from: string = typeof location.state?.from === 'string' ? location.state.from : '/';
  const { currentUser, signIn, isSigningIn, onSignInSuccess, onSignInError } = useContext(AuthContext);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (currentUser && !isSigningIn) {
      // Get the redirect path from location state, default to '/' if not present
      navigate(from);
    } else if (!currentUser) {
      setAuthChecked(true);
    }
  }, [currentUser, isSigningIn, navigate, from]);

  if (!authChecked) {
    return null;
  }

  return (
    <Box
      sx={{
        width: fullScreen ? '100%' : 'auto',
        height: fullScreen ? '100%' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
      }}
    >
      {isDescope ? (
        <DescopeSignInButtons
          flowId={DESCOPE_FLOW_IDS.MEMBERS_INVITE_SCREEN}
          onSignInSuccess={onSignInSuccess}
          onSignInError={onSignInError}
          promotion={promotion}
          from={from}
          teamInviteToken={teamInviteToken}
        />
      ) : (
        <FirebaseSignInButtons
          signIn={signIn}
          from={from}
          promotion={promotion}
          teamInviteToken={teamInviteToken}
          hintEmail={hintEmail}
          microsoftTenantId={microsoftTenantId}
        />
      )}
    </Box>
  );
}
