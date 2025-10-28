import { useCallback } from 'react';
import { useReactFlow, Node as ReactFlowNode } from 'reactflow';
import { TourKeys, StepKeys } from '@/components/ProductTours/tour-keys';
import { useTour } from '@/components/ProductTours/TourContext';
import { useRepeatedCheck } from './useRepeatedCheck';

const TIMEOUT_MS = 300;
const FIT_VIEW_DURATION = 1000;

interface useTourAddNodesStageParams {
  closeToolboxDrawer: () => void;
  openToolboxDrawer: () => void;
  getPromptNode: () => ReactFlowNode | undefined;
  getModelNode: () => ReactFlowNode | undefined;
}

export const useTourAddNodesStage = ({
  closeToolboxDrawer,
  openToolboxDrawer,
  getPromptNode,
  getModelNode,
}: useTourAddNodesStageParams) => {
  const { setCenter } = useReactFlow();
  const { getCurrentStepConfig, activeTour, updateCanMoveToNextStep } = useTour();
  const currentStepId = getCurrentStepConfig()?.stepId;

  const preHook = useCallback(() => {
    return new Promise<void>((resolve) => {
      openToolboxDrawer();
      const setNewCenter = () => {
        const promptNode = getPromptNode();
        if (promptNode) {
          const newZoom = 0.6;
          setCenter(
            promptNode.position.x + ((promptNode.width || 250) / newZoom) * 1.5,
            promptNode.position.y + (promptNode.height || 0) / 2,
            {
              duration: FIT_VIEW_DURATION,
              zoom: newZoom,
            },
          );
        } else {
          setTimeout(setNewCenter, 100);
        }
      };
      setNewCenter();
      setTimeout(resolve, FIT_VIEW_DURATION);
    });
  }, [getPromptNode, openToolboxDrawer, setCenter]);

  const postHook = useCallback(() => {
    return new Promise<void>((resolve) => {
      closeToolboxDrawer();
      setTimeout(resolve, TIMEOUT_MS);
    });
  }, [closeToolboxDrawer]);

  // Success condition check
  const addNodesCheck = useCallback(() => {
    return currentStepId === StepKeys.NAVIGATION_TOUR.ADD_NODES && !!getModelNode();
  }, [currentStepId, getModelNode]);

  const addNodesPreCondition = useCallback(() => {
    return (
      !!activeTour && activeTour === TourKeys.NavigationTour && currentStepId === StepKeys.NAVIGATION_TOUR.ADD_NODES
    );
  }, [activeTour, currentStepId]);

  const onAddNodesSuccess = useCallback(() => {
    updateCanMoveToNextStep(true);
  }, [updateCanMoveToNextStep]);

  useRepeatedCheck({
    check: addNodesCheck,
    preCondition: addNodesPreCondition,
    interval: TIMEOUT_MS,
    onSuccess: onAddNodesSuccess,
  });

  return { preHook, postHook };
};
