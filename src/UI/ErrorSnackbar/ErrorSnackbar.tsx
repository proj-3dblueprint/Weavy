import { Snackbar, Alert, Typography, type SxProps } from '@mui/material';
import { forwardRef, type ForwardedRef, type ReactNode } from 'react';
import { color } from '@/colors';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { WarningCircleIcon } from '../Icons';

interface ErrorSnackbarActionProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

const isActionObject = (
  action: ReactNode | ErrorSnackbarActionProps | undefined,
): action is ErrorSnackbarActionProps => {
  return !!action && typeof action === 'object' && 'label' in action && 'onClick' in action;
};

interface ErrorSnackbarProps {
  open: boolean;
  onClose?: () => void;
  errorMessage: string;
  action?: ReactNode | ErrorSnackbarActionProps;
}

type ErrorAlertProps = Omit<ErrorSnackbarProps, 'open' | 'onClose'> & { sx?: SxProps };

export const ErrorAlert = forwardRef(function ErrorAlert(
  { action, errorMessage, sx = {} }: ErrorAlertProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const actionElement = isActionObject(action) ? (
    <ButtonContained
      mode="filled-light-secondary"
      size="xs"
      onClick={action.onClick}
      disabled={action.disabled}
      loading={action.loading}
    >
      {action.label}
    </ButtonContained>
  ) : (
    action
  );
  return (
    <Alert
      ref={ref}
      severity="error"
      icon={<WarningCircleIcon style={{ height: 20, width: 20 }} color={color.Weavy_Error} />}
      sx={{
        backgroundColor: color.Weavy_Error_08,
        border: `1px solid ${color.Weavy_Error_64_T}`,
        borderRadius: '8px',
        color: color.Weavy_Error,
        display: 'flex',
        alignItems: 'center',
        ...sx,
      }}
      slots={{
        message: Message,
      }}
      slotProps={{
        action: {
          sx: {
            padding: '0 0 0 16px',
          },
        },
      }}
      action={actionElement}
    >
      {errorMessage}
    </Alert>
  );
});

function ErrorSnackbar({ open, onClose, action, errorMessage }: ErrorSnackbarProps) {
  return (
    <Snackbar open={open} onClose={onClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
      <ErrorAlert action={action} errorMessage={errorMessage} />
    </Snackbar>
  );
}

const Message = ({ children }: { children: ReactNode }) => {
  return (
    <Typography variant="body-sm-md" color={color.Weavy_Error} sx={{ whiteSpace: 'pre-line' }}>
      {children}
    </Typography>
  );
};

export default ErrorSnackbar;
