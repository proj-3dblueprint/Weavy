import { useCallback, useRef } from 'react';
import { useReactFlow } from 'reactflow';
import { useHotkeys } from 'react-hotkeys-hook';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useFlowView } from '@/components/Recipe/FlowContext';
import { getHandleId } from '@/components/Nodes/Utils';
import { FF_PROXIMITY_CONNECT } from '@/consts/featureFlags';
import type { NodeId } from 'web';

interface HandlePosition {
  nodeId: NodeId;
  handleId: string;
  x: number;
  y: number;
}

const PROXIMITY_THRESHOLD = 32; // pixels

/**
 * Hook that enables proximity-based connections in ReactFlow.
 *
 * When the user holds the Shift key and moves nodes around, this hook detects
 * when two handles (one input, one output) are within 32 pixels of each other
 * and automatically creates a connection between them.
 *
 * Features:
 * - Only works when Shift key is held down
 * - Detects handles within 5 pixels of each other
 * - Prevents cyclic connections
 * - Automatically stops checking after a connection is made
 * - Works with all node types in the flow
 *
 * @returns Object with shift key state and control functions
 */
export const useProximityConnect = () => {
  const { getNodes, getViewport } = useReactFlow();
  const flowView = useFlowView();
  const isShiftPressedRef = useRef(false);
  const proximityCheckRef = useRef<number | null>(null);
  const isFFProximityConnectEnabled = useFeatureFlagEnabled(FF_PROXIMITY_CONNECT);
  const getHandlePosition = useCallback(
    (nodeId: NodeId, handleId: string): HandlePosition | null => {
      // Find the handle DOM element by its ReactFlow handle ID
      const handleElement = document.querySelector(`[data-handleid="${handleId}"]`);
      if (!handleElement) return null;

      const rect = handleElement.getBoundingClientRect();
      const { zoom, x: viewportX, y: viewportY } = getViewport();

      // Convert DOM coordinates to ReactFlow coordinates
      const flowX = (rect.left + rect.width / 2 - viewportX) / zoom;
      const flowY = (rect.top + rect.height / 2 - viewportY) / zoom;

      return {
        nodeId,
        handleId,
        x: flowX,
        y: flowY,
      };
    },
    [getViewport],
  );

  const getAllHandlePositions = useCallback((): HandlePosition[] => {
    const nodes = getNodes();
    const handlePositions: HandlePosition[] = [];

    // Get all selected/moving nodes to use as reference points
    const movingNodes = nodes.filter((node) => node.selected || node.dragging);

    // If no nodes are moving, return empty array
    if (movingNodes.length === 0) {
      return handlePositions;
    }

    nodes.forEach((node) => {
      // Check if this node is within 500px of any moving node
      const isWithinRange = movingNodes.some((movingNode) => {
        const dx = node.position.x - movingNode.position.x;
        const dy = node.position.y - movingNode.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= 500; // 500px threshold
      });

      // Skip nodes that are too far away
      if (!isWithinRange) {
        return;
      }

      // Get input handles
      const inputHandles = node.data.handles?.input;
      if (inputHandles && typeof inputHandles === 'object') {
        Object.keys(inputHandles).forEach((handleKey) => {
          const handleId = getHandleId(node.id, 'input', handleKey);
          if (handleId) {
            const position = getHandlePosition(node.id, handleId);
            if (position) {
              handlePositions.push(position);
            }
          }
        });
      }

      // Get output handles
      const outputHandles = node.data.handles?.output;
      if (outputHandles && typeof outputHandles === 'object') {
        Object.keys(outputHandles).forEach((handleKey) => {
          const handleId = getHandleId(node.id, 'output', handleKey);
          if (handleId) {
            const position = getHandlePosition(node.id, handleId);
            if (position) {
              handlePositions.push(position);
            }
          }
        });
      }
    });

    return handlePositions;
  }, [getNodes, getHandlePosition]);

  const calculateDistance = useCallback((pos1: HandlePosition, pos2: HandlePosition): number => {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const findClosestHandles = useCallback((): { source: HandlePosition; target: HandlePosition } | null => {
    const handlePositions = getAllHandlePositions();
    let closestDistance = Infinity;
    let closestPair: { source: HandlePosition; target: HandlePosition } | null = null;

    for (let i = 0; i < handlePositions.length; i++) {
      for (let j = i + 1; j < handlePositions.length; j++) {
        const pos1 = handlePositions[i];
        const pos2 = handlePositions[j];

        // Skip if handles are from the same node
        if (pos1.nodeId === pos2.nodeId) continue;

        // Determine which is source and which is target based on handle ID
        const pos1IsOutput = pos1.handleId.includes('-output-');
        const pos2IsOutput = pos2.handleId.includes('-output-');

        // Skip if both are inputs or both are outputs
        if (pos1IsOutput === pos2IsOutput) continue;

        const distance = calculateDistance(pos1, pos2);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPair = pos1IsOutput ? { source: pos1, target: pos2 } : { source: pos2, target: pos1 };
        }
      }
    }

    return closestDistance <= PROXIMITY_THRESHOLD ? closestPair : null;
  }, [getAllHandlePositions, calculateDistance]);

  const checkProximityAndConnect = useCallback(() => {
    if (!isShiftPressedRef.current) return;
    const closestHandles = findClosestHandles();
    if (closestHandles) {
      const { source, target } = closestHandles;

      // Check if connection would result in a cycle
      if (flowView.wouldConnectionResultInCycle(source.nodeId, target.nodeId)) {
        return; // Don't connect if it would create a cycle
      }

      // Trigger the connection
      flowView.connectEdge(source.nodeId, target.nodeId, source.handleId, target.handleId);

      // Continue checking for more connections instead of stopping
      // The interval will continue running as long as shift is pressed
    }
  }, [findClosestHandles, flowView]);

  const startProximityCheck = useCallback(() => {
    if (!isShiftPressedRef.current || proximityCheckRef.current) return;
    // Start checking proximity every 100ms while shift is held
    proximityCheckRef.current = window.setInterval(checkProximityAndConnect, 100);
  }, [checkProximityAndConnect]);

  const stopProximityCheck = useCallback(() => {
    if (proximityCheckRef.current) {
      clearInterval(proximityCheckRef.current);
      proximityCheckRef.current = null;
    }
  }, []);

  // Track shift key state using useHotkeys (only if feature is isFFProximityConnectEnabled)
  useHotkeys(
    'shift',
    () => {
      if (!isFFProximityConnectEnabled) return;
      isShiftPressedRef.current = true;
      startProximityCheck();
    },
    { keydown: true, scopes: 'workflow' },
  );

  useHotkeys(
    'shift',
    () => {
      if (!isFFProximityConnectEnabled) return;
      isShiftPressedRef.current = false;
      // Clear any ongoing proximity check when shift is released
      if (proximityCheckRef.current) {
        clearInterval(proximityCheckRef.current);
        proximityCheckRef.current = null;
      }
    },
    { keyup: true, scopes: 'workflow' },
  );

  return {
    isShiftPressed: isShiftPressedRef.current,
    startProximityCheck,
    stopProximityCheck,
  };
};
