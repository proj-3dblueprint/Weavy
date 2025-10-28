import { useEffect } from 'react';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { TourStepMediaType } from '@/enums/tour-step-media-type.enum';
import { log } from '@/logger/logger.ts';
import { LottieAnimation } from '../Common/LottieAnimation';
import { useTour } from './TourContext';
import { StartOfTourModal } from './Components/StartOfTourModal';
import { TourModal } from './Components/TourModal';
import { TourTooltip } from './Components/TourTooltip';
import './tour.css';

const logger = log.getLogger('Tour');

const SUCCESS_ANIMATION_SRC = '/tour-assets/animations/tour-circle-check-success.lottie';

const preloadMedia = (imageUrl: string) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = function () {
      resolve(img);
    };
    img.onerror = img.onabort = function () {
      reject(new Error(`could not load image: ${imageUrl}`));
    };
    img.src = imageUrl.startsWith('http') ? imageUrl : `${window.location.origin}${imageUrl}`;
  });
};

export const Tour = () => {
  const { steps } = useTour();

  useEffect(() => {
    if (!steps.length) return;

    steps.map((step) => {
      if (step.media) {
        const allMedia = [step.media.default, ...Object.values(step.media)];
        allMedia.forEach((media) => {
          if ([TourStepMediaType.IMAGE, TourStepMediaType.SVG].includes(media.type)) {
            void preloadMedia(media.path);
          }
        });
      }
      if (Array.isArray(step.cta) && step.cta.length > 0) {
        step.cta.forEach((cta) => {
          if (cta.media) {
            const allMedia = [cta.media.default, ...Object.values(cta.media)];
            allMedia.forEach((media) => {
              if ([TourStepMediaType.IMAGE, TourStepMediaType.SVG].includes(media.type)) {
                void preloadMedia(media.path);
              }
            });
          }
        });
      }
    });
  }, [steps]);

  return <TourComponent />;
};

const SuccessAnimation = () => {
  const { showAnimation, onSuccessAnimationEnd } = useTour();

  return createPortal(
    <Box
      className="success-animation"
      sx={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {showAnimation ? (
          <motion.div
            initial={{ opacity: 1, translateY: 0 }}
            animate={{ opacity: [1, 1, 1, 0], translateY: [0, 0, -20, -64] }}
            transition={{ duration: 1.3, ease: 'easeInOut', times: [0, 0.7, 0.8, 1] }}
            onAnimationComplete={onSuccessAnimationEnd}
          >
            <LottieAnimation width={64} height={64} loop={false} src={SUCCESS_ANIMATION_SRC} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Box>,
    document.body,
  );
};

const TourComponent = () => {
  const { steps, currentStep, endTour, goToNextStep, stopTour } = useTour();

  const { t } = useTranslation();

  if (!steps.length) return null;
  const step = steps[currentStep];

  const renderStepContent = () => {
    if (!step) {
      logger.error('No step found', { steps, currentStep });
      return null;
    }

    switch (step.type) {
      case 'tooltip': {
        const element = step.element ? document.getElementById(step.element) : null;

        return (
          <TourTooltip
            actions={step.cta}
            anchorEl={element}
            content={t(step.content)}
            media={step.media}
            placement={step.placement || 'bottom'}
            title={t(step.title)}
          />
        );
      }
      case 'start-of-tour':
        return (
          <StartOfTourModal
            content={t(step.content)}
            disallowClose={step.disallowClose}
            media={step.media}
            onClose={stopTour}
            onNextStep={goToNextStep}
            open
            title={t(step.title)}
          />
        );
      case 'modal':
        return (
          <TourModal
            actions={step.cta}
            content={t(step.content)}
            disallowClose={step.disallowClose}
            media={step.media}
            onClose={endTour}
            open
            title={t(step.title)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box id="tour-box" sx={{ position: 'fixed', zIndex: 1300 }}>
      {renderStepContent()}
      <SuccessAnimation />
    </Box>
  );
};
