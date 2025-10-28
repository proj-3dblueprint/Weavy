import { Typography, Button, styled, Box } from '@mui/material';
import { useLocation, Location, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useState, useContext } from 'react';
import { WeavyTextLogo } from '@/UI/Icons/WeavyTextLogo';
import { Copyrights } from '@/components/Common/Copyrights';
import { I18N_KEYS } from '@/language/keys';
import { color } from '@/colors';
import GoogleLogo from '@/UI/Icons/GoogleLogo';
import MicrosoftLogo from '@/UI/Icons/MicrosoftLogo';
import { AuthContext } from '@/contexts/AuthContext';
import { FlexColCenHorVer, Flex, FlexCol, FlexRow } from '@/UI/styles';
import { WeavyLogoFilled } from '@/UI/Icons/WeavyLogoFilled';
import { useAuthConfig } from '@/hooks/useAuthConfig';
import { DescopeSignInButtons } from '@/components/Common/Authentication/DescopeSignInButtons';
import { AUTH_PROVIDERS, DESCOPE_FLOW_IDS } from '@/consts/auth.consts';
import type { SignInOptions } from '@/contexts/AuthContext';

const StyledSignInButton = styled(Button)(() => ({
  alignItems: 'center',
  borderRadius: '4px',
  width: '276px',
  backgroundColor: color.Black92,
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
}: {
  signIn: (options: SignInOptions) => Promise<void>;
  from: string;
  promotion: string | null;
}) => {
  const { t } = useTranslation();
  const googleSignIn = useCallback(
    () =>
      void signIn({
        route: from,
        providerType: 'google',
        promotion,
      }),
    [signIn, from, promotion],
  );

  const microsoftSignIn = useCallback(
    () =>
      void signIn({
        route: from,
        providerType: 'microsoft',
        promotion,
      }),
    [signIn, from, promotion],
  );
  return (
    <FlexCol sx={{ gap: 1, mb: 6 }}>
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
    </FlexCol>
  );
};

export function SignInPage() {
  const { t } = useTranslation();
  const { provider } = useAuthConfig();
  const isDescope = provider === AUTH_PROVIDERS.DESCOPE;
  const navigate = useNavigate();
  const location = useWrappedLocation();
  const [searchParams] = useSearchParams();
  const promotion = searchParams.get('promotion');

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

  const goHome = useCallback(() => (window.location.href = 'https://weavy.ai'), []);

  if (!authChecked) {
    return null;
  }

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        justifyContent: 'flex-start',
        minHeight: '100vh',
        height: '100%',
        width: '100%',
        bgcolor: color.White100,
        position: 'relative',
        backgroundImage:
          'linear-gradient(0deg, #ffffff4d 34%, #c1cdd559 71%), url(https://cdn.prod.website-files.com/681b040781d5b5e278a69989/681ccdbeb607e939f7db68fa_BG%20NET%20Hero.avif)',
        backgroundPosition: '0 0, 50%',
        backgroundSize: 'auto, cover',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <FlexRow sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center' }}>
        <WeavyTextLogo style={{ color: color.White100, cursor: 'pointer' }} onClick={goHome} />
      </FlexRow>
      <Box sx={{ display: { xs: 'flex', sm: 'none', position: 'absolute', top: 12, left: 12 } }}>
        <WeavyLogoFilled
          title="Weavy Logo"
          width={36}
          height={36}
          style={{
            color: color.Black92,
            cursor: 'pointer',
          }}
          onClick={goHome}
        />
      </Box>

      {/* Main Content */}
      <Flex
        data-testid="signin-page-content"
        sx={{
          gap: 6,
          flexDirection: 'column',
          justifyContent: 'flex-start',
          width: { xs: '100%', sm: '360px' },
          height: { xs: '100%', sm: 'auto' },
          margin: { xs: '0', sm: 'auto' },
          borderRadius: { xs: 0, sm: 2 },
          bgcolor: color.White100,
          overflow: 'hidden',
          border: { xs: 'none', sm: `1px solid ${color.Black04}` },
        }}
      >
        <img src="/assets/signin-cover.avif" alt="Sign in cover" style={{ width: '100%', height: 'auto' }} />
        <FlexColCenHorVer sx={{}}>
          <Typography
            variant="h1"
            color={color.Black92}
            sx={{ fontSize: '2rem', fontWeight: 400, mb: 1.5, mt: { xs: 6, sm: 0 } }}
          >
            {t(I18N_KEYS.SIGN_IN_PAGE.TITLE)}
          </Typography>
          <Typography variant="body-lg-rg" color={color.Black64_T} sx={{ mb: 5 }}>
            {t(I18N_KEYS.SIGN_IN_PAGE.SUBTITLE)}
          </Typography>
          {isDescope ? (
            <Box sx={{ width: '276px', marginBottom: '48px' }}>
              <DescopeSignInButtons
                flowId={DESCOPE_FLOW_IDS.MAIN_SIGN_IN_SCREEN}
                onSignInSuccess={onSignInSuccess}
                onSignInError={onSignInError}
                promotion={promotion}
                from={from}
              />
            </Box>
          ) : (
            <FirebaseSignInButtons signIn={signIn} from={from} promotion={promotion} />
          )}
        </FlexColCenHorVer>
      </Flex>
      <FlexRow sx={{ py: 3, px: 3, alignItems: 'center', justifyContent: 'flex-end' }}>
        <Copyrights textColor={color.Black84_T} />
      </FlexRow>
    </Flex>
  );
}
