import { useCallback, useEffect } from 'react';
import { useReactFlow, Node as ReactFlowNode } from 'reactflow';
import { NodeType } from '@/enums/node-type.enum';
import { StepKeys, TourKeys } from '@/components/ProductTours/tour-keys';
import { useTour } from '@/components/ProductTours/TourContext';
import type { AddNewNodeOptions } from '../../flowTypes';

type TargetNode = ReactFlowNode<{ number: number; visited: boolean }, NodeType.Target>;
const isTargetNode = (node: ReactFlowNode<unknown>): node is TargetNode => node.type === NodeType.Target;

const TARGET_NODE_ID = 'WFixQpK4gPyu4TQEp7dK';
const MAX_TARGET_NODE_COUNT = 4;
const TARGET_NODE_SIZE = 28;

const CROSSHAIR_ID = 'flow-tour-crosshair';

const TIMEOUT_MS = 300;
const FIT_VIEW_DURATION = 1000;

const NODE_OFFSET = 200;
const CROSSHAIR_OFFSET = 96;

type TourPanStageParams = {
  addNewNode: (options: AddNewNodeOptions) => { id: string };
  deleteNode: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
};

export const useTourPanStage = ({ addNewNode, updateNodeData, deleteNode }: TourPanStageParams) => {
  const { getNodes, getViewport, zoomTo } = useReactFlow();
  const { activeTour, updateCanMoveToNextStep, getCurrentStepConfig, subscribeToTourQuit } = useTour();
  const currentStepId = getCurrentStepConfig()?.stepId;

  const getTargetNodes = useCallback(() => {
    const nodes = getNodes();
    const targetNodes = nodes.filter(isTargetNode);
    if (targetNodes.length === 0) return null;
    return targetNodes;
  }, [getNodes]);

  const isNodeAlignedWithOverlay = useCallback(
    (targetNode: TargetNode) => {
      if (!targetNode) return false;

      const overlay = document.getElementById(CROSSHAIR_ID);
      if (!overlay) return false;

      // Get DOM coordinates of the overlay
      const overlayRect = overlay.getBoundingClientRect();
      const overlayHalfWidth = overlayRect.width / 2;
      const overlayHalfHeight = overlayRect.height / 2;
      const overlayCenter = {
        x: overlayRect.left + overlayHalfWidth,
        y: overlayRect.top + overlayHalfHeight,
      };

      const { zoom, x: viewportX, y: viewportY } = getViewport();

      // Convert React Flow coordinates to DOM coordinates
      const nodeInDOMSpace = {
        x: targetNode.position.x * zoom + viewportX,
        y: targetNode.position.y * zoom + viewportY,
      };

      // Calculate node center in DOM space
      const nodeSide = TARGET_NODE_SIZE * zoom;
      const nodeCenterInDOMSpace = {
        x: nodeInDOMSpace.x + nodeSide / 2,
        y: nodeInDOMSpace.y + nodeSide / 2,
      };

      // Check alignment with tolerance
      return (
        Math.abs(nodeCenterInDOMSpace.x - overlayCenter.x) < overlayHalfWidth &&
        Math.abs(nodeCenterInDOMSpace.y - overlayCenter.y) < overlayHalfHeight
      );
    },
    [getViewport],
  );

  const addTargetNode = useCallback(
    (number: number) => {
      const { zoom } = getViewport();
      const offset = NODE_OFFSET / zoom;
      const relativeCrosshairOffset = CROSSHAIR_OFFSET / zoom;
      const halfCrosshairOffset = relativeCrosshairOffset / 2;
      const halfTargetNodeSize = TARGET_NODE_SIZE / 2 / zoom;
      let [x, y] = [-offset, halfCrosshairOffset - halfTargetNodeSize];
      switch (number) {
        case 1:
          [x, y] = [-offset, halfCrosshairOffset - halfTargetNodeSize];
          break;
        case 2:
          [x, y] = [relativeCrosshairOffset, -offset];
          break;
        case 3:
          [x, y] = [offset + relativeCrosshairOffset, halfCrosshairOffset];
          break;
        case 4:
          [x, y] = [relativeCrosshairOffset, offset];
          break;
      }
      addNewNode({
        action: { id: TARGET_NODE_ID, initialData: { number, visited: false } },
        dropX: x,
        dropY: y,
        fromCenter: true,
      });
    },
    [addNewNode, getViewport],
  );

  // Pan step - success condition check
  useEffect(() => {
    if (!activeTour || activeTour !== TourKeys.NavigationTour || currentStepId !== StepKeys.NAVIGATION_TOUR.PAN) {
      return;
    }
    let timeoutId: NodeJS.Timeout;
    const checkAlignment = () => {
      const targetNodes = getTargetNodes();
      const visitedNodes = targetNodes?.filter((node) => node.data.visited) || [];
      if (visitedNodes.length === MAX_TARGET_NODE_COUNT) {
        updateCanMoveToNextStep(true);
        return;
      } else if (targetNodes) {
        const nextTargetToHit = targetNodes
          .filter((node) => !node.data.visited)
          .sort((a, b) => a.data.number - b.data.number)[0];

        if (isNodeAlignedWithOverlay(nextTargetToHit)) {
          updateNodeData(nextTargetToHit.id, { visited: true });
          const nextTargetNumber = nextTargetToHit.data.number + 1;
          if (nextTargetNumber <= MAX_TARGET_NODE_COUNT) {
            setTimeout(() => {
              addTargetNode(nextTargetNumber);
            }, 300);
          }
        }
      }
      timeoutId = setTimeout(checkAlignment, TIMEOUT_MS);
    };
    checkAlignment();
    return () => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
  }, [
    activeTour,
    isNodeAlignedWithOverlay,
    currentStepId,
    updateCanMoveToNextStep,
    getTargetNodes,
    updateNodeData,
    addTargetNode,
  ]);

  const createTargetNodes = useCallback(() => {
    zoomTo(1.2, { duration: FIT_VIEW_DURATION });
    setTimeout(() => {
      const existingTargetNodes = getTargetNodes();
      if (Array.isArray(existingTargetNodes) && existingTargetNodes.length > 0) return;
      addTargetNode(1);
    }, FIT_VIEW_DURATION);
  }, [addTargetNode, getTargetNodes, zoomTo]);

  const clearTargetNodes = useCallback(() => {
    const targetNodes = getTargetNodes() || [];
    targetNodes.forEach((node) => deleteNode(node.id));
  }, [getTargetNodes, deleteNode]);

  useEffect(() => {
    subscribeToTourQuit(`${TourKeys.NavigationTour}-${StepKeys.NAVIGATION_TOUR.PAN}`, clearTargetNodes);
  }, [clearTargetNodes, subscribeToTourQuit]);

  return { preHook: createTargetNodes, postHook: clearTargetNodes };
};
