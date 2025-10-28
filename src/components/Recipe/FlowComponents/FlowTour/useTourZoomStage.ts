import { useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import { TourKeys, StepKeys } from '@/components/ProductTours/tour-keys';
import { useTour } from '@/components/ProductTours/TourContext';
import { useRepeatedCheck } from './useRepeatedCheck';

const TIMEOUT_MS = 300;

export const useTourZoomStage = ({ isZoomCheckAllowed }: { isZoomCheckAllowed: boolean }) => {
  const { getCurrentStepConfig, activeTour, updateCanMoveToNextStep } = useTour();
  const { getViewport } = useReactFlow();

  const currentStepId = getCurrentStepConfig()?.stepId;

  // Zoom step - success condition check
  const zoomCheck = useCallback(() => {
    return currentStepId === StepKeys.NAVIGATION_TOUR.ZOOM && getViewport().zoom > 0.85 && isZoomCheckAllowed;
  }, [currentStepId, getViewport, isZoomCheckAllowed]);

  const zoomPreCondition = useCallback(() => {
    return !!activeTour && activeTour === TourKeys.NavigationTour && currentStepId === StepKeys.NAVIGATION_TOUR.ZOOM;
  }, [activeTour, currentStepId]);

  const onZoomSuccess = useCallback(() => {
    updateCanMoveToNextStep(true);
  }, [updateCanMoveToNextStep]);

  useRepeatedCheck({
    check: zoomCheck,
    preCondition: zoomPreCondition,
    interval: TIMEOUT_MS,
    onSuccess: onZoomSuccess,
  });
};
