import { useState, useCallback } from 'react';
import { Dialog, Typography, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { color, EL_COLORS } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { Input } from '@/UI/Input/Input';
import { FlexCenVer, FlexCol } from '@/UI/styles';
import { AppXBtn } from '@/UI/AppXBtn/AppXBtn';

interface CreateFolderModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (folderName: string) => void | Promise<void>;
}

export const CreateFolderModal = ({ open, onClose, onConfirm }: CreateFolderModalProps) => {
  const [folderName, setFolderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const handleConfirm = useCallback(async () => {
    if (!folderName.trim()) return;

    setIsLoading(true);
    try {
      await onConfirm(folderName.trim());
      setFolderName('');
      onClose();
    } catch (_error) {
      // Handle error silently
    } finally {
      setIsLoading(false);
    }
  }, [folderName, onConfirm, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleConfirm();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={{ zIndex: 1600 }}
      slotProps={{
        paper: {
          sx: {
            background: color.Black92,
            borderRadius: 1,
            border: `1px solid ${EL_COLORS.BoxBorder}`,
            width: '420px',
            m: 0,
          },
        },
      }}
    >
      <FlexCol
        sx={{
          gap: 4,
          p: 3,
          pt: 5.25,
          pb: 3,
          position: 'relative',
        }}
      >
        <AppXBtn onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }} />

        <FlexCol sx={{ gap: 1.5 }}>
          <Typography variant="body-lg-sb" sx={{ color: color.White100 }}>
            {t(I18N_KEYS.MAIN_DASHBOARD.CREATE_FOLDER_MODAL.TITLE)}
          </Typography>
        </FlexCol>

        <FlexCol sx={{ gap: 0.5 }}>
          <Typography variant="label-sm-rg" sx={{ color: color.White80_T }}>
            {t(I18N_KEYS.MAIN_DASHBOARD.CREATE_FOLDER_MODAL.NAME_LABEL)}
          </Typography>
          <Input
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </FlexCol>

        <FlexCenVer sx={{ gap: 1, justifyContent: 'flex-end' }}>
          <ButtonContained mode="text" onClick={onClose} size="medium" sx={{ px: 2 }}>
            {t(I18N_KEYS.MAIN_DASHBOARD.CREATE_FOLDER_MODAL.CANCEL)}
          </ButtonContained>
          <ButtonContained
            mode="filled-light"
            onClick={() => void handleConfirm()}
            disabled={isLoading || !folderName.trim()}
            size="medium"
            sx={{
              px: 2,
              bgcolor: color.Yellow100,
              color: color.Black100,
              '&:hover': {
                bgcolor: color.Yellow100,
                opacity: 0.9,
              },
            }}
            endIcon={isLoading ? <CircularProgress size={16} sx={{ color: color.White64_T }} /> : ''}
          >
            {t(I18N_KEYS.MAIN_DASHBOARD.CREATE_FOLDER_MODAL.CREATE)}
          </ButtonContained>
        </FlexCenVer>
      </FlexCol>
    </Dialog>
  );
};
