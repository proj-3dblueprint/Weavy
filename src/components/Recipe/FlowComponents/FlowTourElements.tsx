import { AnimatePresence, motion } from 'motion/react';
import { StepKeys } from '../../ProductTours/tour-keys';
import { useTour } from '../../ProductTours/TourContext';
import { FlowTourCrosshair } from './FlowTour/FlowTourCrosshair';
import { FlowTourZoomBox } from './FlowTour/FlowTourZoomBox';
import { FlowTourDropArea } from './FlowTour/FlowTourDropArea';

export function FlowTour() {
  const { activeTour, getCurrentStepConfig, canMoveToNextStep } = useTour();
  if (!activeTour) return null;
  const currentStepId = getCurrentStepConfig()?.stepId;
  if (!currentStepId) return null;
  return (
    <>
      <AnimatePresence>
        {currentStepId === StepKeys.NAVIGATION_TOUR.PAN ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <FlowTourCrosshair canMoveToNextStep={canMoveToNextStep} />
          </motion.div>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {currentStepId === StepKeys.NAVIGATION_TOUR.ZOOM ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <FlowTourZoomBox canMoveToNextStep={canMoveToNextStep} />
          </motion.div>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {currentStepId === StepKeys.NAVIGATION_TOUR.ADD_NODES ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <FlowTourDropArea canMoveToNextStep={canMoveToNextStep} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
