import { useCallback, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Typography, IconButton, Box, Paper, Popper, PopperProps } from '@mui/material';
import { I18N_KEYS } from '@/language/keys';
import { TourStepMediaType } from '@/enums/tour-step-media-type.enum';
import { AllowWheelEvents } from '@/components/Common/AllowWheelEvents';
import { color } from '@/colors';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { LottieAnimation } from '../../Common/LottieAnimation';
import { tourConfigs, useTour } from '../TourContext';
import { TourKeys } from '../tour-keys';
import type { TourAction, TourStepMedia } from '../tourTypes';

const MEDIA_HEIGHT = 100;
const MEDIA_WIDTH = 80;

const TourMedia = ({ media }: { media: TourStepMedia[keyof TourStepMedia] | null }) => {
  if (!media) return null;
  if (
    media.type !== TourStepMediaType.IMAGE &&
    media.type !== TourStepMediaType.SVG &&
    media.type !== TourStepMediaType.LOTTIE
  ) {
    return null;
  }
  return (
    <Box sx={{ display: 'flex' }}>
      {media.type === TourStepMediaType.IMAGE || media.type === TourStepMediaType.SVG ? (
        <img src={media.path} style={{ width: MEDIA_WIDTH, height: MEDIA_HEIGHT }} />
      ) : media.type === TourStepMediaType.LOTTIE ? (
        <LottieAnimation src={media.path} width={MEDIA_WIDTH} height={MEDIA_HEIGHT} fallback={media.fallback} />
      ) : null}
    </Box>
  );
};

interface TooltipAction {
  label: string;
  onClick: () => void;
  mode?: 'filled-light' | 'text';
  disabled?: boolean;
}

const HORIZONTAL_OFFSET = 'calc(50% - 400px)';
const VERTICAL_OFFSET = 'calc(50% - 150px)';

// Amount of steps that are not relevant to the tour (Welcome / Finish Tour)
const NON_RELEVANT_STEPS_AMOUNT = {
  [TourKeys.NavigationTour]: 2,
  [TourKeys.GetToKnowTheInterface]: 2,
  [TourKeys.LearnToShare]: 2,
};

const getPopperPosition = (placement: 'top' | 'bottom' | 'left' | 'right') => {
  if (placement === 'top') {
    return {
      top: '100px',
      left: HORIZONTAL_OFFSET,
      bottom: 'auto',
    };
  } else if (placement === 'bottom') {
    return {
      bottom: '75px',
      left: HORIZONTAL_OFFSET,
      top: 'auto',
    };
  } else if (placement === 'left') {
    return {
      top: VERTICAL_OFFSET,
      left: '100px',
      right: 'auto',
    };
  } else if (placement === 'right') {
    return {
      top: VERTICAL_OFFSET,
      left: 'auto',
      right: '100px',
    };
  }
};

interface TourTooltipProps {
  actions?: TourAction[];
  anchorEl?: HTMLElement | null;
  content: string;
  media?: TourStepMedia;
  onClose?: () => void;
  parentId?: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
  title: string;
}

export const TourTooltip = ({
  actions: propActions,
  anchorEl,
  content,
  media,
  onClose,
  placement,
  title,
}: TourTooltipProps) => {
  const {
    activeTour,
    allowBack,
    callAction,
    canMoveToNextStep,
    context,
    currentStep,
    endTour,
    getCurrentStepConfig,
    goToNextStep,
    goToPreviousStep,
  } = useTour();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const tourContext = useMemo(() => {
    if (!activeTour) return '';
    if (!context) return '';
    return context[activeTour];
  }, [context, activeTour]);

  const runAction = useCallback(async (fn: () => Promise<void>) => {
    setIsLoading(true);
    await fn();
    setIsLoading(false);
  }, []);

  const resolvedMedia = useMemo(() => {
    if (!media) return null;
    if (tourContext && Object.keys(media).includes(tourContext)) {
      return media[tourContext];
    }
    return media.default;
  }, [media, tourContext]);

  const actions = useMemo<TooltipAction[]>(() => {
    if (propActions) {
      return propActions.map((action) => ({
        label: t(action.label),
        onClick: () => void runAction(() => callAction(action)),
        mode: action.variant === 'primary' ? 'filled-light' : 'text',
      }));
    }

    const currentStepConfig = getCurrentStepConfig();
    if (!currentStepConfig) return [];

    const backButton: TooltipAction = {
      label: t(I18N_KEYS.PRODUCT_TOURS.PREVIOUS_STEP),
      onClick: goToPreviousStep,
      mode: 'text',
    };
    const nextButton: TooltipAction = {
      label: t(I18N_KEYS.PRODUCT_TOURS.NEXT_STEP),
      onClick: () => void runAction(goToNextStep),
      mode: 'filled-light',
      disabled: !canMoveToNextStep,
    };
    return [...(allowBack ? [backButton] : []), ...(currentStepConfig.autoPass ? [] : [nextButton])];
  }, [
    allowBack,
    callAction,
    canMoveToNextStep,
    getCurrentStepConfig,
    goToNextStep,
    goToPreviousStep,
    propActions,
    runAction,
    t,
  ]);

  const handleEndTour = useCallback(() => {
    endTour();
    onClose?.();
  }, [endTour, onClose]);

  const isLastStep = useMemo(() => {
    if (!activeTour) return false;
    return currentStep === tourConfigs[activeTour].steps.length - 1;
  }, [activeTour, currentStep]);

  const popperProps = useMemo<Partial<PopperProps>>(() => {
    if (anchorEl) {
      return {
        placement,
        anchorEl,
      };
    }

    return {
      anchorEl: document.body,
      modifiers: [
        {
          name: 'customPositioning',
          enabled: true,
          phase: 'beforeWrite',
          requires: ['computeStyles'],
          fn: ({ state }) => {
            state.styles.popper = {
              ...state.styles.popper,
              ...getPopperPosition(placement),
              transform: 'none',
            };
          },
        },
      ],
    };
  }, [placement, anchorEl]);

  return (
    <Popper open {...popperProps}>
      <AllowWheelEvents targetElementId="react-flow-background">
        <Paper
          sx={{
            padding: 0,
            position: 'relative',
            background: color.Black92,
            borderRadius: '8px',
            border: '1px solid rgba(240, 240, 229, 0.08)',
            width: '800px',
            maxWidth: '800px',
          }}
        >
          {isLastStep ? null : (
            <IconButton
              sx={{ position: 'absolute', top: '12px', right: '12px', fontSize: '1.5rem', p: 0.5 }}
              onClick={handleEndTour}
            >
              <i style={{ width: '1.5rem', height: '1.5rem' }} className="fa-sharp fa-light fa-xmark"></i>
            </IconButton>
          )}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: 4,
              alignItems: 'center',
              justifyContent: 'center',
              pt: 3,
              pb: 2,
              pr: 2,
              pl: 3,
            }}
          >
            <TourMedia media={resolvedMedia} />
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                justifyContent: 'space-between',
                minHeight: MEDIA_HEIGHT,
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '90%' }}>
                <Typography variant="label-sm-rg" sx={{ opacity: 0.8 }}>
                  {title}
                </Typography>
                <Typography variant="body-lg-md" sx={{ whiteSpace: 'pre-wrap', lineHeight: '1.3' }}>
                  <Trans t={t} i18nKey={content} context={tourContext} />
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 2,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                  {activeTour && !isLastStep ? (
                    <Typography variant="body-sm-rg" sx={{ opacity: 0.4 }}>
                      {t(I18N_KEYS.PRODUCT_TOURS.TOUR_STEP_INDICATION, {
                        step: currentStep + 1 - NON_RELEVANT_STEPS_AMOUNT[activeTour],
                        total: tourConfigs[activeTour].steps.length - NON_RELEVANT_STEPS_AMOUNT[activeTour],
                      })}
                    </Typography>
                  ) : null}
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
                  {actions.map((action) => (
                    <ButtonContained
                      key={action.label}
                      loading={isLoading}
                      mode={action.mode}
                      onClick={action.onClick}
                      disabled={action.disabled}
                    >
                      {action.label}
                    </ButtonContained>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        </Paper>
      </AllowWheelEvents>
    </Popper>
  );
};
