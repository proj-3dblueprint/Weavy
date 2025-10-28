import { Button, Stack, Typography, Link, styled, ThemeProvider, CssBaseline } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { useCallback, useContext } from 'react';
import { usePostHog } from 'posthog-js/react';
import { useLocation, Navigate } from 'react-router-dom';
import { WeavyLogoFilled } from '@/UI/Icons/WeavyLogoFilled';
import { color } from '@/colors';
import { Copyrights } from '@/components/Common/Copyrights';
import { I18N_KEYS } from '@/language/keys';
import { CopyIcon } from '@/UI/Icons/CopyIcon';
import { YouTubeLogo } from '@/UI/Icons/YouTubeLogo';
import { darkTheme } from '@/UI/theme';
import { DiscordLogo } from '@/UI/Icons/DiscordLogo';
import { useWithLoader } from '@/hooks/useWithLoader';
import { EXTERNAL_LINKS } from '@/consts/externalLinks.consts';
import { AuthContext } from '@/contexts/AuthContext';

const StyledCopyLinkButton = styled(Button)(({ theme }) => ({
  alignItems: 'center',
  border: `1px solid ${color.White64_T}`,
  borderRadius: '4px',
  boxSizing: 'border-box',
  color: color.White100,
  display: 'flex',
  gap: theme.spacing(1),
  justifyContent: 'flex-start',
  pl: theme.spacing(1.5),
  pr: theme.spacing(2),
  py: theme.spacing(0.75),
  textTransform: 'none',
  width: 'fit-content',
  '&:hover': {
    backgroundColor: color.White04_T,
  },
}));

const StyledFooterButton = styled(Button)(({ theme }) => ({
  alignItems: 'center',
  border: `none`,
  borderRadius: '4px',
  backgroundColor: color.Yellow16,
  boxSizing: 'border-box',
  color: color.Black100,
  display: 'flex',
  gap: theme.spacing(1.5),
  justifyContent: 'center',
  maxWidth: '400px',
  pl: theme.spacing(2),
  pr: theme.spacing(2.5),
  py: theme.spacing(0.75),
  textTransform: 'none',
  '&:hover': {
    backgroundColor: color.Yellow40,
  },
}));

const WEAVY_LINK = 'https://app.weavy.ai';
const COPY_LINK_TIMEOUT = 300;

export const MobileUnsupportedPage = () => {
  const { t } = useTranslation();
  const posthog = usePostHog();

  const copyLink = useCallback(async () => {
    posthog.capture('copy_link_mobile_unsupported_page');
    await navigator.clipboard.writeText(WEAVY_LINK);
    // To give impression of loading and then success
    await new Promise((resolve) => setTimeout(resolve, COPY_LINK_TIMEOUT));
  }, [posthog]);

  const { execute: handleCopyLinkClick, isLoading } = useWithLoader(copyLink, { sync: true });

  const handleDiscordClick = useCallback(() => {
    window.open(EXTERNAL_LINKS.discordInvite);
  }, []);

  const handleYouTubeClick = useCallback(() => {
    window.open('https://www.youtube.com/watch?v=YGx90x8XaHI');
  }, []);

  const { currentUser, isSigningIn } = useContext(AuthContext);
  const location = useLocation();

  if (location.pathname === '/' && !currentUser && !isSigningIn) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Stack
        direction="column"
        justifyContent="space-between"
        sx={{
          py: 3,
          pl: 3,
          pr: 4,
          bgcolor: color.Black100,
          // Fill available height with fallbacks
          minHeight: ['100vh', '-webkit-fill-available', '100dvh'],
          width: '100%',
        }}
        gap={1}
      >
        <WeavyLogoFilled title="Weavy Logo" style={{ width: 35, height: 35, color: color.White100 }} />
        <Stack direction="column" gap={6.75} justifyContent="space-between">
          <Stack direction="column" gap={3}>
            <Typography variant="h1" sx={{ fontSize: '2rem', whiteSpace: 'pre-wrap' }}>
              {t(I18N_KEYS.MOBILE_UNSUPPORTED_PAGE.TITLE)}
            </Typography>
            <Stack direction="column" gap={1.5}>
              <Typography variant="body-lg-rg">
                <Trans
                  i18nKey={I18N_KEYS.MOBILE_UNSUPPORTED_PAGE.SUBTITLE}
                  components={{
                    url: (
                      <Link
                        component="a"
                        href={WEAVY_LINK}
                        sx={{
                          color: color.White100,
                          textDecoration: 'underline',
                          textDecorationColor: color.White100,
                          '&:hover': {
                            textDecoration: 'none',
                          },
                        }}
                      />
                    ),
                  }}
                />
              </Typography>
              <StyledCopyLinkButton variant="outlined" onClick={handleCopyLinkClick} loading={isLoading}>
                <CopyIcon title="Copy link" />
                <Typography variant="body-sm-md" color={isLoading ? 'transparent' : color.White100}>
                  {t(I18N_KEYS.GENERAL.COPY_LINK)}
                </Typography>
              </StyledCopyLinkButton>
            </Stack>
          </Stack>
          <Stack direction="column" gap={2}>
            <Typography variant="body-lg-rg">{t(I18N_KEYS.MOBILE_UNSUPPORTED_PAGE.FOOTER_TEXT)}</Typography>
            <Stack direction="column" gap={1.5}>
              <StyledFooterButton variant="contained">
                <YouTubeLogo title="YouTube" />
                <Typography variant="body-std-md" color={color.Black100} onClick={handleYouTubeClick}>
                  {t(I18N_KEYS.MOBILE_UNSUPPORTED_PAGE.YOUTUBE_INTRO_BUTTON)}
                </Typography>
              </StyledFooterButton>
              <StyledFooterButton variant="contained">
                <DiscordLogo title="Discord" />
                <Typography variant="body-std-md" color={color.Black100} onClick={handleDiscordClick}>
                  {t(I18N_KEYS.MOBILE_UNSUPPORTED_PAGE.DISCORD_BUTTON)}
                </Typography>
              </StyledFooterButton>
            </Stack>
          </Stack>
        </Stack>
        <Stack direction="row" alignItems="center" justifyContent="flex-end">
          <Copyrights textColor={color.White100} />
        </Stack>
      </Stack>
    </ThemeProvider>
  );
};
