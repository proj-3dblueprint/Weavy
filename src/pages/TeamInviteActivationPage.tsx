import { useContext, useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { log } from '@/logger/logger.ts';
import { TempSignin } from '@/components/Homepage/TempSignin';
import { AuthContext, EMAIL_MISMATCH_ERROR_CODE } from '@/contexts/AuthContext';
import { I18N_KEYS } from '@/language/keys';
import { getAxiosInstance } from '@/services/axiosConfig';
import { TrackTypeEnum, useAnalytics } from '@/hooks/useAnalytics';
import { color } from '@/colors';
import { WeavyLogoFilled } from '@/UI/Icons/WeavyLogoFilled';
import { Copyrights } from '@/components/Common/Copyrights';

const logger = log.getLogger('TeamInviteActivationPage');
const axiosInstance = getAxiosInstance();

export function TeamInviteActivationPage() {
  const { t: translate } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser, enrichUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { track } = useAnalytics();
  const params = new URLSearchParams(window.location.search);
  const email = params.get('email');
  const token = params.get('token');
  const workspaceName = params.get('workspaceName');

  const validateToken = async () => {
    try {
      await axiosInstance.post(`/v1/workspaces/members/invitation/${token}/validate`);
      setIsTokenValid(true);
    } catch (error: any) {
      logger.error('Failed validating user token', error, {
        errorMessage: error.message || 'N/A',
        userId: currentUser?.uid,
      });
      setIsTokenValid(false);
      track('team_invite_activation_page_invalid_token', {}, TrackTypeEnum.BI);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      void validateToken();
    }
  }, [token]);

  // activation URL is not valid -> redirect to home
  useEffect(() => {
    if (!email || !token || !workspaceName) {
      track('team_invite_activation_page_invalid_url', {}, TrackTypeEnum.BI);
      navigate('/');
    }
  }, [email, token, workspaceName]);

  useEffect(() => {
    const acceptInvitation = async () => {
      try {
        setIsLoading(true);
        await axiosInstance.post(`/v1/workspaces/members/invitation/${token}/accept`);
        await enrichUser();
        track('team_invite_activation_page_accepted', {}, TrackTypeEnum.BI);
        navigate('/?acceptInvitation=true');
      } catch (error: any) {
        logger.error('Failed accepting user invitation', error, {
          errorMessage: error?.message || 'N/A',
          userId: currentUser?.uid,
        });

        if (error?.response?.data?.internalErrorCode === EMAIL_MISMATCH_ERROR_CODE && error?.response?.data?.message) {
          setErrorMessage(error.response.data.message);
        }

        setIsTokenValid(false);
        track('team_invite_activation_page_error', {}, TrackTypeEnum.BI);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser && !isLoading && isTokenValid) {
      void acceptInvitation();
    }
  }, [currentUser, isLoading, isTokenValid]);

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            py: 3,
            px: 3,
          }}
        >
          <WeavyLogoFilled title="Weavy Logo" style={{ width: 35, height: 35, color: color.White100 }} />
        </Box>
        {isLoading && <CircularProgress />}
        {isTokenValid && !currentUser && !isLoading && (
          <>
            <Typography variant="h2">
              {translate(I18N_KEYS.SETTINGS.TEAM.ACTIVATION_PAGE.TITLE, { workspace_placeholder: workspaceName })}
            </Typography>
            <Typography variant="body-std-rg" sx={{ mt: 2, mb: 3 }}>
              {translate(I18N_KEYS.SETTINGS.TEAM.ACTIVATION_PAGE.SUBTITLE, { email_placeholder: email })}
            </Typography>
            <TempSignin fullScreen={false} teamInviteToken={token} hintEmail={email} />
          </>
        )}
        {!isTokenValid && !isLoading && (
          <>
            <Typography variant="h3">{translate(I18N_KEYS.SETTINGS.TEAM.ACTIVATION_PAGE.ERROR_TITLE)}</Typography>
            <Typography variant="body-std-md">
              {errorMessage || translate(I18N_KEYS.SETTINGS.TEAM.ACTIVATION_PAGE.ERROR_SUBTITLE)}
            </Typography>
          </>
        )}
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          py: 3,
          px: 3,
        }}
      >
        <Copyrights textColor={color.White100} />
      </Box>
    </>
  );
}
