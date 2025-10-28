import { useCallback, useEffect, useRef, useState } from 'react';
import { useReactFlow } from 'reactflow';
import { useQueryParamsContext } from '@/contexts/QueryParamsContext';
import { ComponentKeys } from '@/components/ProductTours/tour-keys';
import { useTour } from '@/components/ProductTours/TourContext';
import { NodeType } from '@/enums/node-type.enum';
import { useWorkflowStore } from '@/state/workflow.state';
import { useTourPanStage } from './useTourPanStage';
import { useTourZoomStage } from './useTourZoomStage';
import { useTourShowNodeStage } from './useTourShowNodeStage';
import { useTourAddNodesStage } from './useTourAddNodesStage';
import { useTourConnectNodesStage } from './useTourConnectNodesStage';
import { useTourRunModelStage } from './useTourRunModelStage';
import type { AddNewNodeOptions } from '../../flowTypes';

const TOUR_COMPONENT_ID = ComponentKeys.FLOW;

const TOUR_RECIPE_NAME = 'My First Weavy';

interface useFlowNavigationTourParams {
  addNewNode: (options: AddNewNodeOptions) => { id: string };
  closeToolboxDrawer: () => void;
  deleteNode: (nodeId: string) => void;
  openToolboxDrawer: () => void;
  reactFlowInitialized: boolean;
  recipeId: string;
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
}

export const useFlowNavigationTour = ({
  addNewNode,
  closeToolboxDrawer,
  deleteNode,
  openToolboxDrawer,
  reactFlowInitialized = false,
  recipeId,
  updateNodeData,
}: useFlowNavigationTourParams) => {
  const { queryParamNewRecipe, cleanQueryParams } = useQueryParamsContext();
  const tourStarted = useRef(false);
  const [isZoomCheckAllowed, setIsZoomCheckAllowed] = useState(false);
  const renameRecipe = useWorkflowStore((state) => state.renameRecipe);

  const {
    activeTour,
    checkForEligibleTour,
    registerPostHookFunction,
    registerPreHookFunction,
    runTour,
    setActiveComponentId,
    stopTour,
    updateCustomData,
  } = useTour();

  const { getNodes, getNode } = useReactFlow<{ result?: Array<unknown> }>();

  const getModelNode = useCallback(
    (modelNodeId?: string) => {
      const modelNode = getNode(modelNodeId || '');
      return modelNode || getNodes().find((node) => node.type === NodeType.CustomModelV2);
    },
    [getNodes, getNode],
  );

  const getPromptNode = useCallback(
    (promptNodeId?: string) => {
      const promptNode = getNode(promptNodeId || '');
      return promptNode || getNodes().find((node) => node.type === NodeType.PromptV3);
    },
    [getNodes, getNode],
  );

  // Initialization
  useEffect(() => {
    setActiveComponentId(TOUR_COMPONENT_ID);
    return () => {
      setActiveComponentId('');
    };
  }, [setActiveComponentId]);

  // init tour if exists and tour is ready
  useEffect(() => {
    if (!tourStarted.current && reactFlowInitialized) {
      const eligibleTour = checkForEligibleTour(TOUR_COMPONENT_ID);
      if (eligibleTour) {
        const hasRecipeId = eligibleTour.customData?.recipeId;
        const isSameRecipe = eligibleTour.customData?.recipeId === recipeId;
        if (hasRecipeId && !isSameRecipe) return;
        if (isSameRecipe || queryParamNewRecipe) {
          tourStarted.current = true;
          void runTour(eligibleTour.tourId, eligibleTour.currentStep, eligibleTour.customData);
        }
      } else {
        stopTour();
      }
    }
    if (queryParamNewRecipe) {
      cleanQueryParams('new');
    }
  }, [runTour, queryParamNewRecipe, checkForEligibleTour, reactFlowInitialized, stopTour, cleanQueryParams, recipeId]);

  useEffect(() => {
    return () => {
      if (tourStarted.current) {
        tourStarted.current = false;
        stopTour();
      }
    };
  }, [stopTour]);

  // Pan Stage
  const { preHook: tourPanStagePreHook, postHook: tourPanStagePostHook } = useTourPanStage({
    addNewNode,
    updateNodeData,
    deleteNode,
  });

  // Show Node stage
  const { preHook: showNodeStepPreHook } = useTourShowNodeStage({
    addNewNode,
    getPromptNode,
    setIsNextStageAllowed: setIsZoomCheckAllowed,
  });

  // Zoom stage
  useTourZoomStage({ isZoomCheckAllowed });

  // Add Nodes stage
  const { preHook: addNodesStepPreHook, postHook: addNodesStepPostHook } = useTourAddNodesStage({
    closeToolboxDrawer,
    openToolboxDrawer,
    getPromptNode,
    getModelNode,
  });

  // Connect Nodes stage
  const { preHook: connectNodesStepPreHook } = useTourConnectNodesStage({
    getPromptNode,
    getModelNode,
  });

  // Run Model stage
  const { preHook: runModelStepPreHook } = useTourRunModelStage({
    getModelNode,
  });

  // Set Recipe ID on tour start
  const setRecipeId = useCallback(() => {
    if (activeTour && recipeId) {
      updateCustomData({ recipeId });
      void renameRecipe(TOUR_RECIPE_NAME);
    }
  }, [activeTour, recipeId, updateCustomData, renameRecipe]);

  useEffect(() => {
    // Pre Hooks
    registerPreHookFunction('createTargetNodes', tourPanStagePreHook);
    registerPreHookFunction('openDrawer', addNodesStepPreHook);
    registerPreHookFunction('centerOnNodes', connectNodesStepPreHook);
    registerPreHookFunction('centerOnModelNode', runModelStepPreHook);
    registerPreHookFunction('createPromptNode', showNodeStepPreHook);

    // Post Hooks
    registerPostHookFunction('clearTargetNodes', tourPanStagePostHook);
    registerPostHookFunction('closeDrawer', addNodesStepPostHook);
    registerPostHookFunction('setRecipeId', setRecipeId);
  }, [
    addNodesStepPostHook,
    addNodesStepPreHook,
    connectNodesStepPreHook,
    registerPostHookFunction,
    registerPreHookFunction,
    runModelStepPreHook,
    setRecipeId,
    showNodeStepPreHook,
    tourPanStagePostHook,
    tourPanStagePreHook,
  ]);

  return {
    activeTour,
  };
};
