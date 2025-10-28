import { useState } from 'react';
import { Box, Typography, Snackbar, Alert, Slide, Menu, MenuItem, type AlertColor } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { log } from '@/logger/logger.ts';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { useWorkflowStore } from '@/state/workflow.state';
import { CaretIcon } from '@/UI/Icons/CaretIcon';
import { useIsHovered } from '@/hooks/useIsHovered';
import type { Version } from '@/types/api/recipe';

const logger = log.getLogger('DesignAppToolbar');

function SlideTransition(props) {
  return <Slide {...props} direction="down" />;
}

const formattedTime = (time?: Date | string) => {
  const date = time instanceof Date ? time : new Date(time || '');
  return format(date, 'MMMM d, h:mm a');
};

const HEADER_WIDTH = '400px';

const PublishedVersionMenuItem = ({
  version,
  handleViewVersion,
}: {
  version: Version;
  handleViewVersion: (version: Version) => void;
}) => {
  const { isHovered, onMouseEnter, onMouseLeave } = useIsHovered();
  const { t } = useTranslation();
  return (
    <MenuItem
      onClick={() => handleViewVersion(version)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      sx={{
        px: 1.5,
        py: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '240px',
        cursor: 'pointer',
      }}
    >
      <Typography variant="body-sm-rg">{formattedTime(version.publishedAt)}</Typography>
      <Typography
        variant="body-sm-rg"
        className="version-number"
        sx={{
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.15s ease-in-out',
        }}
        fontWeight="bold"
      >
        {t(I18N_KEYS.SHARED_DESIGN_APP.TOOLBAR.VIEW_VERSION)}
      </Typography>
    </MenuItem>
  );
};

function DesignAppToolbar({ height }) {
  const recipe = useWorkflowStore((state) => state.recipe);
  const publishDesignApp = useWorkflowStore((state) => state.publishDesignApp);
  const { latestPublishedVersion, publishedVersions } = recipe;
  const { t } = useTranslation();
  const [showSnackBar, setShowSnackBar] = useState(false);
  const [snackBarSeverity, setSnackBarSeverity] = useState<AlertColor>('success');
  const [snackBarText, setSnackBarText] = useState(t(I18N_KEYS.SHARED_DESIGN_APP.PUBLISH_DESIGN_APP_SUCCESS));
  const [isPublishLoading, setIsPublishLoading] = useState(false);

  const [versionsAnchorEl, setVersionsAnchorEl] = useState<null | HTMLButtonElement>(null);

  const publish = async () => {
    try {
      await publishDesignApp();
      //todo: do better
      setSnackBarText(t(I18N_KEYS.SHARED_DESIGN_APP.PUBLISH_DESIGN_APP_SUCCESS));
      setSnackBarSeverity('success');
      setShowSnackBar(true);
    } catch (e) {
      logger.error('Failed to publish design app', e);
      setSnackBarText(t(I18N_KEYS.SHARED_DESIGN_APP.PUBLISH_DESIGN_APP_FAILED));
      setSnackBarSeverity('error');
      setShowSnackBar(true);
    }
  };

  const handlePublishDesignApp = async () => {
    setIsPublishLoading(true);
    await publish();
    setIsPublishLoading(false);
  };

  const handleViewVersion = (version) => {
    setVersionsAnchorEl(null);
    window.location.href = `${window.location.pathname}?version=${version.version}`;
  };

  return (
    <>
      <Box
        id="design-app-header"
        sx={{
          width: HEADER_WIDTH,
          height: `${height}px`,
          mb: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            background: `${color.Black92}`,
            border: `1px solid`,
            borderColor: color.Dark_Grey,
            borderRadius: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 1,
          }}
        >
          <Box
            id="design-app-toolabr-versions-container"
            sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}
          >
            {latestPublishedVersion ? (
              <>
                <Typography variant="body-sm-rg">
                  {t(I18N_KEYS.SHARED_DESIGN_APP.TOOLBAR.LAST_PUBLISHED_AT)}:
                </Typography>
                {publishedVersions && publishedVersions.length > 0 ? (
                  <ButtonContained
                    endIcon={<CaretIcon style={{ height: '12px', width: '12px' }} />}
                    onClick={(event) => setVersionsAnchorEl(event.currentTarget)}
                    mode="text"
                    sx={{ ml: 0.5 }}
                    size="small"
                  >
                    {formattedTime(latestPublishedVersion?.publishedAt)}
                  </ButtonContained>
                ) : (
                  <Typography variant="body-sm-rg" sx={{ ml: 0.5 }} fontWeight="bold">
                    {formattedTime(latestPublishedVersion?.publishedAt)}
                  </Typography>
                )}
                <Menu
                  anchorEl={versionsAnchorEl}
                  open={Boolean(versionsAnchorEl)}
                  onClose={() => setVersionsAnchorEl(null)}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  sx={{
                    '.MuiList-root': {
                      padding: 0,
                    },
                  }}
                >
                  {publishedVersions &&
                    publishedVersions.length > 0 &&
                    publishedVersions
                      .sort((a, b) => Date.parse(b.publishedAt || '') - Date.parse(a.publishedAt || ''))
                      .map((version, index) => {
                        return (
                          <PublishedVersionMenuItem
                            key={index}
                            version={version}
                            handleViewVersion={handleViewVersion}
                          />
                        );
                      })}
                </Menu>
              </>
            ) : (
              <Typography variant="body-std-md">{t(I18N_KEYS.SHARED_DESIGN_APP.TOOLBAR.NO_VERSIONS)}</Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Box sx={{ ml: 1 }}>
              <ButtonContained
                size="small"
                onClick={() => void handlePublishDesignApp()}
                loading={isPublishLoading}
                startIcon={<i className="fa-light fa-paper-plane-top" style={{ fontSize: '14px' }} />}
              >
                {t(I18N_KEYS.SHARED_DESIGN_APP.PUBLISH_DESIGN_APP_BUTTON)}
              </ButtonContained>
            </Box>
          </Box>
        </Box>
      </Box>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={showSnackBar}
        onClose={() => setShowSnackBar(false)}
        autoHideDuration={1500}
        TransitionComponent={SlideTransition}
      >
        <Alert
          severity={snackBarSeverity}
          variant="filled"
          sx={{ width: '100%', color: color.Black100, backgroundColor: color.Light_Green }}
        >
          {snackBarText}
        </Alert>
      </Snackbar>
    </>
  );
}

export default DesignAppToolbar;
