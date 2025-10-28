import { Box, Dialog, DialogContent, Fade, styled, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useCallback, useMemo } from 'react';
import { useWithLoader } from '@/hooks/useWithLoader';
import { TourStepMediaType } from '@/enums/tour-step-media-type.enum';
import { color as colors } from '@/colors';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { useTour } from '../TourContext';
import type { TourAction, TourStepMedia } from '../tourTypes';

interface TourActionButtonProps {
  action: TourAction;
  onClick: () => void;
  isLoading: boolean;
}

const SquareButton = styled('button')({
  backgroundColor: 'transparent',
  border: '1px solid rgba(240, 240, 229, 0.2)',
  cursor: 'pointer',
  width: '120px',
  height: '120px',
  padding: '24px 36px',
  borderRadius: '8px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'column',
  gap: '8px',
  '&:hover': {
    backgroundColor: 'rgba(240, 240, 229, 0.1)',
  },
});

export const TourActionButton = ({ action, onClick, isLoading }: TourActionButtonProps) => {
  const { t } = useTranslation();

  const media = useMemo(() => {
    const defaultMedia = action.media?.default;
    if (defaultMedia?.type === TourStepMediaType.IMAGE || defaultMedia?.type === TourStepMediaType.SVG) {
      return defaultMedia.path;
    }

    return null;
  }, [action.media]);

  if (action.type === 'button') {
    let mode: 'filled-light' | 'text' = 'filled-light';
    if (action.variant === 'secondary') {
      mode = 'text';
    }

    return (
      <ButtonContained size="small" loading={isLoading} mode={mode} onClick={onClick}>
        {t(action.label)}
      </ButtonContained>
    );
  }

  return (
    <SquareButton disabled={isLoading} onClick={onClick}>
      {media ? <img src={media} alt={action.label} /> : null}
      <Typography variant="body-sm-md">{t(action.label)}</Typography>
    </SquareButton>
  );
};

interface TourModalProps {
  actions?: TourAction[];
  disallowClose?: boolean;
  content: string;
  media?: TourStepMedia;
  onClose: () => void;
  open: boolean;
  title: string;
}

export const TourModal = ({
  open,
  onClose,
  media: _,
  title,
  content,
  actions,
  disallowClose = false,
}: TourModalProps) => {
  const { callAction } = useTour();
  const { t } = useTranslation();

  const { isLoading, execute: runAction } = useWithLoader(callAction, { sync: true });

  const handleClose = useCallback(() => {
    if (disallowClose) {
      return;
    }

    onClose();
  }, [disallowClose, onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      slots={{
        transition: Fade,
      }}
      slotProps={{
        paper: {
          sx: {
            background: colors.Black92,
            borderRadius: '8px',
            border: '1px solid rgba(240, 240, 229, 0.08)',
            width: '340px',
          },
        },
        transition: {
          timeout: 0,
        },
        backdrop: {
          slotProps: {
            transition: {
              timeout: 0,
            },
          },
        },
      }}
    >
      <DialogContent sx={{ padding: 0 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            p: 5.25,
            gap: 3,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              gap: 1.5,
            }}
          >
            <Typography variant="h3">{t(title)}</Typography>
            <Typography
              variant="body-std-rg"
              sx={{
                whiteSpace: 'pre-line',
              }}
            >
              {t(content)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: 1.5, alignItems: 'center' }}>
            {actions?.map((action) => (
              <TourActionButton
                key={action.label}
                action={action}
                onClick={() => runAction(action)}
                isLoading={isLoading}
              />
            ))}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
