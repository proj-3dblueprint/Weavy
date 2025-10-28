import { Box, Dialog, DialogContent, Fade, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { usePostHog } from 'posthog-js/react';
import { I18N_KEYS } from '@/language/keys';
import { useWithLoader } from '@/hooks/useWithLoader';
import { color } from '@/colors';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { Flex, FlexColCenHor } from '@/UI/styles';
import { useTour } from '../TourContext';
import type { TourStepMedia } from '../tourTypes';

interface StartOfTourModalProps {
  content: string;
  disallowClose?: boolean;
  media?: TourStepMedia;
  onClose?: () => void;
  onNextStep: () => Promise<void>;
  open: boolean;
  title: string;
}

const HEIGHT = 433;
const IMG_WIDTH = 288;

export const StartOfTourModal = ({
  content,
  disallowClose = false,
  media,
  onClose,
  onNextStep,
  open,
  title,
}: StartOfTourModalProps) => {
  const { t } = useTranslation();
  const posthog = usePostHog();
  const { activeTour } = useTour();
  const { isLoading, execute: handleNextStep } = useWithLoader(onNextStep, { sync: true });

  const startTour = useCallback(() => {
    posthog.capture('product_tour_start', {
      tour: activeTour,
    });
    handleNextStep();
  }, [posthog, handleNextStep, activeTour]);

  const closeTour = useCallback(() => {
    posthog.capture('product_tour_skip', {
      tour: activeTour,
    });
    onClose?.();
  }, [posthog, onClose, activeTour]);

  const handleClose = useCallback(() => {
    if (disallowClose) {
      return;
    }

    closeTour();
  }, [disallowClose, closeTour]);

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
            background: color.Black92,
            borderRadius: '8px',
            border: '1px solid rgba(240, 240, 229, 0.08)',
            height: HEIGHT,
            maxWidth: '648px',
            width: '100%',
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
      <DialogContent sx={{ padding: 0, overflow: 'hidden' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            maxHeight: '100%',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              px: 5.25,
              width: '360px',
              gap: 4,
            }}
          >
            <FlexColCenHor sx={{ gap: 2, alignItems: 'flex-start' }}>
              <Typography variant="h1">{title}</Typography>
              <Typography variant="body-lg-rg">{content}</Typography>
            </FlexColCenHor>
            <Flex sx={{ gap: 2 }}>
              <ButtonContained size="small" loading={isLoading} onClick={startTour}>
                {t(I18N_KEYS.PRODUCT_TOURS.START_OF_TOUR.START_NOW)}
              </ButtonContained>
              <ButtonContained size="small" mode="text" disabled={isLoading} onClick={closeTour}>
                {t(I18N_KEYS.PRODUCT_TOURS.START_OF_TOUR.SKIP)}
              </ButtonContained>
            </Flex>
          </Box>
          <Box
            sx={{
              display: 'flex',
              width: IMG_WIDTH,
              height: HEIGHT,
            }}
          >
            <img
              src={
                media?.default?.path
                  ? `${media.default.path.replace('/upload/', `/upload/c_fill,g_auto,h_${HEIGHT},w_${IMG_WIDTH}/`)}`
                  : ''
              }
              alt="Flow Tour"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
