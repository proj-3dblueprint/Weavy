import { ForwardedRef, forwardRef, useCallback } from 'react';
import { Snackbar, Alert, Slide, CircularProgress } from '@mui/material';
import { color } from '@/colors';
import { useGlobalStore } from '@/state/global.state';
import { useWithLoader } from '@/hooks/useWithLoader';
import { FlexCenVer } from '../styles';
import { ButtonContained } from '../Buttons/AppButton';
import { ErrorAlert } from '../ErrorSnackbar/ErrorSnackbar';
import type { AlertData, SnackbarData } from '@/state/global.state';

interface AppSnackbarContentProps {
  alertData: AlertData;
  onClose: () => void;
}
const AppSnackbarContent = forwardRef(
  (
    { alertData: { text, icon, action, severity = 'success' } }: AppSnackbarContentProps,
    ref: ForwardedRef<HTMLDivElement>,
  ) => {
    const onAction = async () => await action?.onClick();

    const { isLoading, execute: handleAction } = useWithLoader(onAction, { sync: true });

    const hideIcon = icon === null;

    if (severity === 'error') {
      return (
        <ErrorAlert
          ref={ref}
          errorMessage={text}
          action={
            action
              ? {
                  label: action.text,
                  onClick: handleAction,
                  disabled: isLoading,
                  loading: isLoading,
                }
              : undefined
          }
          sx={{
            height: '40px',
          }}
        />
      );
    }

    return (
      <Alert
        ref={ref}
        severity={severity}
        variant="filled"
        icon={hideIcon ? false : icon}
        sx={{
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: color.Yellow64,
          py: 1.5,
          pl: 2,
          pr: action ? 1 : 2,
          borderRadius: 2,
          border: `1px solid ${color.White04_T}`,
          color: color.Black100,
          fontSize: '0.75rem',
          fontWeight: 400,
          whiteSpace: 'nowrap',
        }}
        slotProps={{ icon: { sx: { mr: !hideIcon ? 1 : 0 } } }}
      >
        <FlexCenVer sx={{ gap: 2 }}>
          {text}
          {action && (
            <ButtonContained
              mode="filled-dark"
              size="small"
              onClick={handleAction}
              endIcon={isLoading ? <CircularProgress size={12} color="inherit" sx={{ mr: 0.5 }} /> : null}
              disabled={isLoading}
            >
              {action.text}
            </ButtonContained>
          )}
        </FlexCenVer>
      </Alert>
    );
  },
);
AppSnackbarContent.displayName = 'AppSnackbarContent';

/**
 * This is a standalone component. If you need to show it without using the global state for some reason, use this.
 */
interface AppSnackbarStandaloneProps {
  snackbarData: SnackbarData;
  onClose: () => void;
}

const DEFAULT_AUTO_HIDE_DURATION = 5000;

export const AppSnackbarStandalone = ({ snackbarData, onClose }: AppSnackbarStandaloneProps) => (
  <Snackbar
    open={snackbarData.isOpen}
    onClose={onClose}
    autoHideDuration={snackbarData.duration || DEFAULT_AUTO_HIDE_DURATION}
    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    // to disable transition - use: {transition ? <>{props.children}</> : <Slide>...}
    TransitionComponent={(props) => <Slide {...props} direction="down" />}
    sx={{ top: '15px !important' }} // Match to .react-flow__panel
    ClickAwayListenerProps={{ onClickAway: () => {} }} // disable click away
  >
    <AppSnackbarContent alertData={snackbarData} onClose={onClose} />
  </Snackbar>
);

export const AppSnackbar = () => {
  const { snackbarData, updateSnackbarData } = useGlobalStore();

  const handleClose = useCallback(
    () => updateSnackbarData({ text: '', isOpen: false, icon: null }),
    [updateSnackbarData],
  );

  return <AppSnackbarStandalone snackbarData={snackbarData} onClose={handleClose} />;
};
