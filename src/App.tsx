import { useContext, useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Snackbar, Alert, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Intercom from '@intercom/messenger-js-sdk';
import { HotkeysProvider } from 'react-hotkeys-hook';
import PaymentSuccessHandler from '@/components/SubscriptionsAndPayments/PaymentSuccessHandler';
import { AuthContext } from './contexts/AuthContext';
import { CreditsProvider } from './services/CreditsContext';
import { QueryParamsProvider } from './contexts/QueryParamsContext';
import { I18N_KEYS } from './language/keys';
import { TourProvider } from './components/ProductTours/TourContext';
import { DebugProvider } from './hooks/useDebugContext';
import { darkTheme } from './UI/theme';
import { SubscriptionPermissionsProvider } from './hooks/useSubscriptionPermissions';
import { Router } from './Router';
import { FlexCenHorVer, FlexCol } from './UI/styles';
import { SubscriptionType } from './types/shared';
import { AppSnackbar } from './UI/AppSnackbar/AppSnackbar';
import { identify } from './utils/analytics';

export function App() {
  const { currentUser, isSigningIn, teamInviteSuccess, setTeamInviteSuccess } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const [loggedInUserInviteSuccess, setLoggedInUserInviteSuccess] = useState(false);

  const isIdentifiedRef = useRef(false);

  /// identify user
  useEffect(() => {
    if (currentUser && !isIdentifiedRef.current) {
      const [firstName, ...lastNameParts] = currentUser.displayName?.split(' ') || [];
      identify(currentUser.uid, {
        email: currentUser.email || undefined,
        name: currentUser.displayName || undefined,
        firstName: firstName || undefined,
        lastName: lastNameParts.length ? lastNameParts.join(' ') : undefined,
        plan: currentUser.activeWorkspace?.subscription?.type || SubscriptionType.Free,
        credits: currentUser.activeWorkspace?.subscription?.credits,
      });
      Intercom({
        app_id: 'siifiun4',
        user_id: currentUser.uid,
        name: currentUser.displayName || '',
        email: currentUser.email || '',
        created_at: currentUser.createdAt,
      });
      isIdentifiedRef.current = true;
    }
  }, [currentUser]);

  // handle accept team invite for logged in user
  useEffect(() => {
    const acceptInvitation = searchParams.get('acceptInvitation');
    if (acceptInvitation) {
      setLoggedInUserInviteSuccess(true);
      window.history.replaceState(undefined, '', window.location.pathname);
    }
  }, [searchParams]);

  return (
    <DebugProvider>
      <ThemeProvider theme={darkTheme}>
        <TourProvider>
          <CssBaseline />
          <CreditsProvider>
            <QueryParamsProvider>
              <SubscriptionPermissionsProvider user={currentUser}>
                <HotkeysProvider>
                  {currentUser && <PaymentSuccessHandler />}
                  <FlexCol sx={{ height: '100vh' }} id="weavy-main">
                    <Box component="main" sx={{ flexGrow: 1, overflow: 'auto' }}>
                      <Suspense
                        fallback={
                          <FlexCenHorVer sx={{ height: '100%' }}>
                            <CircularProgress color="inherit" />
                          </FlexCenHorVer>
                        }
                      >
                        <Router currentUser={currentUser} isSigningIn={isSigningIn} />
                      </Suspense>
                    </Box>
                  </FlexCol>
                </HotkeysProvider>
              </SubscriptionPermissionsProvider>
            </QueryParamsProvider>
          </CreditsProvider>
        </TourProvider>
        <Snackbar
          open={teamInviteSuccess || loggedInUserInviteSuccess}
          autoHideDuration={3000}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          onClose={() => {
            setLoggedInUserInviteSuccess(false);
            setTeamInviteSuccess(false);
          }}
        >
          <Alert
            severity="success"
            variant="filled"
            icon={<i className="fa-light fa-users"></i>}
            sx={{ width: '100%', color: 'white' }}
          >
            {t(I18N_KEYS.SETTINGS.TEAM.JOIN_TEAM_SUCCESS)}
          </Alert>
        </Snackbar>
        <AppSnackbar />
      </ThemeProvider>
    </DebugProvider>
  );
}
