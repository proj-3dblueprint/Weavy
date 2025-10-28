import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useCallback, useState } from 'react';
import { I18N_KEYS } from '@/language/keys';
import { color } from '@/colors';
import { ButtonContained } from '@/UI/Buttons/AppButton';

type ConfirmationDialogProps = {
  open: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  withLoading?: boolean;
  onCancel?: () => void;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText,
  cancelText,
  withLoading = false,
}: ConfirmationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const handleConfirm = useCallback(() => {
    const handleConfirmAction = async () => {
      setIsLoading(true);
      await onConfirm();
      setIsLoading(false);
    };
    void handleConfirmAction();
  }, [onConfirm]);

  const onCloseInner = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose();
    },
    [onClose],
  );

  const onCancelInner = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onCancel?.();
      onClose();
    },
    [onCancel, onClose],
  );

  return (
    <Dialog
      onClose={onCloseInner}
      open={open}
      sx={{ zIndex: 1600 }}
      slotProps={{
        paper: {
          sx: { background: color.Black92, p: 1 },
        },
      }}
    >
      <DialogTitle variant="body-lg-sb">{title}</DialogTitle>
      {message && (
        <DialogContent sx={{ whiteSpace: 'pre-line' }}>
          <Typography variant="body-sm-rg">{message}</Typography>
        </DialogContent>
      )}
      <DialogActions>
        <ButtonContained size="small" mode="text" onClick={onCancelInner}>
          {cancelText || t(I18N_KEYS.GENERAL.CANCEL)}
        </ButtonContained>
        <ButtonContained
          size="small"
          onClick={handleConfirm}
          endIcon={withLoading && isLoading ? <CircularProgress size={16} color="inherit" /> : null}
          disabled={isLoading}
        >
          {confirmText || t(I18N_KEYS.GENERAL.CONFIRM)}
        </ButtonContained>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmationDialog;
