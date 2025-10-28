import { useCallback } from 'react';
import { useReactFlow, Node as ReactFlowNode } from 'reactflow';
import { StepKeys, TourKeys } from '@/components/ProductTours/tour-keys';
import { useTour } from '@/components/ProductTours/TourContext';
import { useRepeatedCheck } from './useRepeatedCheck';

const TIMEOUT_MS = 300;
const FIT_VIEW_DURATION = 1000;

interface UseTourRunModelStageParams {
  getModelNode: () => ReactFlowNode<{ result?: unknown[] }> | undefined;
}

const getZoomByScreenSize = () => {
  if (window.innerWidth >= 1980) return 0.7;
  if (window.innerWidth <= 1440) return 0.5;
  return 0.55;
};

const getRunModelButton = (modelNodeId: string) => {
  return document.querySelector<HTMLButtonElement>(`[data-tour-id="run-model-button-${modelNodeId}"]`);
};

export const useTourRunModelStage = ({ getModelNode }: UseTourRunModelStageParams) => {
  const { fitView } = useReactFlow();
  const { getCurrentStepConfig, activeTour, updateCanMoveToNextStep } = useTour();
  const currentStepId = getCurrentStepConfig()?.stepId;

  const preHook = useCallback(() => {
    return new Promise<void>((resolve) => {
      const modelNode = getModelNode();
      if (modelNode) {
        fitView({ nodes: [modelNode], duration: FIT_VIEW_DURATION, maxZoom: getZoomByScreenSize() });
        const runModelButton = getRunModelButton(modelNode.id);
        if (runModelButton) {
          runModelButton.classList.add('model-menu-item-glow');
          runModelButton.addEventListener('mousedown', () => {
            runModelButton.classList.remove('model-menu-item-glow');
          });
        }
      }
      setTimeout(resolve, FIT_VIEW_DURATION);
    });
  }, [fitView, getModelNode]);

  const runModelCheck = useCallback(() => {
    const modelNode = getModelNode();
    return (
      currentStepId === StepKeys.NAVIGATION_TOUR.RUN_MODEL &&
      Array.isArray(modelNode?.data.result) &&
      modelNode.data.result.length > 0
    );
  }, [currentStepId, getModelNode]);

  const runModelPreCondition = useCallback(() => {
    return (
      !!activeTour && activeTour === TourKeys.NavigationTour && currentStepId === StepKeys.NAVIGATION_TOUR.RUN_MODEL
    );
  }, [activeTour, currentStepId]);

  const onRunModelSuccess = useCallback(() => {
    setTimeout(() => {
      const modelNode = getModelNode();
      if (modelNode) {
        requestAnimationFrame(() => {
          fitView({ nodes: [modelNode], duration: FIT_VIEW_DURATION, maxZoom: getZoomByScreenSize() });
          updateCanMoveToNextStep(true);
        });
      }
    }, TIMEOUT_MS);
  }, [getModelNode, fitView, updateCanMoveToNextStep]);

  useRepeatedCheck({
    check: runModelCheck,
    preCondition: runModelPreCondition,
    interval: TIMEOUT_MS,
    onSuccess: onRunModelSuccess,
  });

  return {
    preHook,
  };
};
