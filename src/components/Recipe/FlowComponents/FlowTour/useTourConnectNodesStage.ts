import { useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import { useTour } from '@/components/ProductTours/TourContext';
import { TourKeys, StepKeys } from '@/components/ProductTours/tour-keys';
import { useRepeatedCheck } from './useRepeatedCheck';

const TIMEOUT_MS = 300;
const FIT_VIEW_DURATION = 1000;

interface UseConnectNodesStageParams {
  getPromptNode: () => { id: string } | undefined;
  getModelNode: () => { id: string } | undefined;
}

export const useTourConnectNodesStage = ({ getPromptNode, getModelNode }: UseConnectNodesStageParams) => {
  const { fitView, getEdges } = useReactFlow();
  const { activeTour, getCurrentStepConfig, updateCanMoveToNextStep } = useTour();
  const currentStepId = getCurrentStepConfig()?.stepId;

  const preHook = useCallback(() => {
    return new Promise<void>((resolve) => {
      const promptNode = getPromptNode();
      const modelNode = getModelNode();
      if (promptNode && modelNode) {
        fitView({ nodes: [promptNode, modelNode], duration: FIT_VIEW_DURATION, maxZoom: 0.6 });
      }
      setTimeout(resolve, FIT_VIEW_DURATION);
    });
  }, [fitView, getModelNode, getPromptNode]);

  const connectNodesCheck = useCallback(() => {
    if (currentStepId !== StepKeys.NAVIGATION_TOUR.CONNECT_NODES) return false;
    const promptNode = getPromptNode();
    const modelNode = getModelNode();
    return getEdges().some((edge) => edge.source === promptNode?.id && edge.target === modelNode?.id);
  }, [currentStepId, getEdges, getModelNode, getPromptNode]);

  const connectNodesPreCondition = useCallback(() => {
    return (
      !!activeTour && activeTour === TourKeys.NavigationTour && currentStepId === StepKeys.NAVIGATION_TOUR.CONNECT_NODES
    );
  }, [activeTour, currentStepId]);

  const onConnectNodesSuccess = useCallback(() => {
    updateCanMoveToNextStep(true);
  }, [updateCanMoveToNextStep]);

  useRepeatedCheck({
    check: connectNodesCheck,
    preCondition: connectNodesPreCondition,
    interval: TIMEOUT_MS,
    onSuccess: onConnectNodesSuccess,
  });

  return {
    preHook,
  };
};
