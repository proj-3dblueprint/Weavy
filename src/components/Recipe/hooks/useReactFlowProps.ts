import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type EdgeSelectionChange,
  type Connection,
  type OnEdgesChange,
  type OnEdgeUpdateFunc,
  type OnNodesChange,
  type NodeSelectionChange,
  type NodeDimensionChange,
  useReactFlow,
} from 'reactflow';
import { useHotkeys } from 'react-hotkeys-hook';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useWorkflowStore } from '@/state/workflow.state';
import { FF_NODE_GROUPING } from '@/consts/featureFlags';
import { useFlowView } from '../FlowContext';
import type { Edge, Node } from '@/types/node';

const useGroupInteractionContext = () => {
  const [isModifierPressed, setIsModifierPressed] = useState(false);

  useHotkeys(
    'meta,ctrl',
    (event) => {
      setIsModifierPressed(event.metaKey || event.ctrlKey);
    },
    {
      keydown: true,
      keyup: true,
    },
  );

  useEffect(() => {
    // Clear on focus loss (covers Cmd+Tab, window switches, etc.)
    window.addEventListener('blur', () => setIsModifierPressed(false));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') setIsModifierPressed(false);
    });

    return () => {
      window.removeEventListener('blur', () => setIsModifierPressed(false));
      document.removeEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible') setIsModifierPressed(false);
      });
    };
  }, [setIsModifierPressed]);

  return { isModifierPressed };
};

export const useReactFlowProps = () => {
  const flowView = useFlowView();
  const { getIntersectingNodes } = useReactFlow();

  const { isModifierPressed } = useGroupInteractionContext();

  const newConnectionRef = useRef<{
    source: string;
    target: string;
    sourceHandle: string;
    targetHandle: string;
  }>();
  const setInvalidConnection = useWorkflowStore((state) => state.setInvalidConnection);

  const isValidConnection = useCallback(
    ({ source, target, sourceHandle, targetHandle }: Connection) => {
      if (!source || !target) return false;
      if (flowView.wouldConnectionResultInCycle(source, target)) {
        setInvalidConnection({
          errorId: source === target ? 'self-connection' : 'cyclic',
          source,
          target,
          sourceHandle,
          targetHandle,
        });
        return false;
      }
      return true;
    },
    [flowView, setInvalidConnection],
  );

  const onEdgeUpdateStart = useCallback((_, _edge: Edge) => {
    // TODO ongoing remove
  }, []);
  const onEdgeUpdate: OnEdgeUpdateFunc = useCallback((_oldEdge: Edge, newConnection: Connection) => {
    const { source, target, sourceHandle, targetHandle } = newConnection;
    if (source !== null && target !== null && sourceHandle !== null && targetHandle !== null) {
      newConnectionRef.current = {
        source,
        target,
        sourceHandle,
        targetHandle,
      };
    }
  }, []);

  const onEdgeUpdateEnd = useCallback(
    (_e: MouseEvent, oldEdge: Edge) => {
      const newConnection = newConnectionRef.current;
      if (newConnection) {
        flowView.reconnectEdge(
          newConnection.source,
          newConnection.target,
          newConnection.sourceHandle,
          newConnection.targetHandle,
          oldEdge,
        );
      } else {
        flowView.deleteEdges([oldEdge.id]);
      }

      newConnectionRef.current = undefined;
    },
    [flowView],
  );

  const onNodesChange = useCallback(
    (changes: Parameters<OnNodesChange>[0]) => {
      const selectionChanges: NodeSelectionChange[] = changes.filter((c) => c.type === 'select');
      if (selectionChanges.length > 0) {
        const selectedNodes = flowView.selectedNodes;
        for (const change of selectionChanges) {
          const { id, selected } = change;
          if (selected) {
            selectedNodes.push(id);
          } else {
            selectedNodes.splice(selectedNodes.indexOf(id), 1);
          }
        }
        flowView.selectedNodes = selectedNodes;
      }

      const dimensionChanges = changes.filter(
        (c): c is NodeDimensionChange => c.type === 'dimensions' && c.dimensions !== undefined,
      );

      if (dimensionChanges.length > 0) {
        flowView.setNodeDimensions(
          dimensionChanges.map((c) => ({
            nodeId: c.id,
            width: c.dimensions!.width,
            height: c.dimensions!.height,
          })),
        );
      }

      // Note: Other change types are not handled here
    },
    [flowView],
  );

  const onEdgesChange = useCallback(
    (changes: Parameters<OnEdgesChange>[0]) => {
      const selectionChanges: EdgeSelectionChange[] = changes.filter((c) => c.type === 'select');
      if (selectionChanges.length === 0) return;

      const selectedEdges = flowView.selectedEdges;
      for (const { id, selected } of selectionChanges) {
        if (selected) {
          selectedEdges.push(id);
        } else {
          selectedEdges.splice(selectedEdges.indexOf(id), 1);
        }
      }
      flowView.selectedEdges = selectedEdges;
    },
    [flowView],
  );

  const onConnect = useCallback(
    ({ source, target, sourceHandle, targetHandle }: Connection) => {
      if (!source || !target || !sourceHandle || !targetHandle) return;
      flowView.connectEdge(source, target, sourceHandle, targetHandle);
    },
    [flowView],
  );

  const onNodeDrag = useCallback(
    (_: unknown, node: Node) => {
      flowView.editNodePositions([{ nodeId: node.id, position: node.position }], true);
    },
    [flowView],
  );

  const onNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      flowView.editNodePositions([{ nodeId: node.id, position: node.position }], false);
    },
    [flowView],
  );

  const onSelectionDrag = useCallback(
    (_: unknown, nodes: Node[]) => {
      flowView.editNodePositions(
        nodes.map((node) => ({ nodeId: node.id, position: node.position })),
        true,
      );
    },
    [flowView],
  );

  const onSelectionDragStop = useCallback(
    (_: unknown, nodes: Node[]) => {
      flowView.editNodePositions(
        nodes.map((node) => ({ nodeId: node.id, position: node.position })),
        false,
      );
    },
    [flowView],
  );

  const isNodeGroupingEnabled = useFeatureFlagEnabled(FF_NODE_GROUPING);
  const setHighlightedGroupId = useWorkflowStore((state) => state.setHighlightedGroupId);
  const clearHighlightedGroupId = useWorkflowStore((state) => state.clearHighlightedGroupId);

  const onNodeDragNodeGrouping = useCallback(
    (_: unknown, node: Node) => {
      flowView.handleNodeDrag(
        [node],
        isModifierPressed,
        getIntersectingNodes,
        setHighlightedGroupId,
        clearHighlightedGroupId,
      );
    },
    [flowView, getIntersectingNodes, isModifierPressed, setHighlightedGroupId, clearHighlightedGroupId],
  );

  const onNodeDragStopNodeGrouping = useCallback(
    (_: unknown, node: Node) => {
      flowView.handleNodeDragStop([node], isModifierPressed, getIntersectingNodes, clearHighlightedGroupId);
    },
    [flowView, getIntersectingNodes, isModifierPressed, clearHighlightedGroupId],
  );

  const onSelectionDragNodeGrouping = useCallback(
    (_: unknown, nodes: Node[]) => {
      flowView.handleNodeDrag(
        nodes,
        isModifierPressed,
        getIntersectingNodes,
        setHighlightedGroupId,
        clearHighlightedGroupId,
      );
    },
    [flowView, getIntersectingNodes, isModifierPressed, setHighlightedGroupId, clearHighlightedGroupId],
  );

  const onSelectionDragStopNodeGrouping = useCallback(
    (_: unknown, nodes: Node[]) => {
      flowView.handleNodeDragStop(nodes, isModifierPressed, getIntersectingNodes, clearHighlightedGroupId);
    },
    [flowView, getIntersectingNodes, isModifierPressed, clearHighlightedGroupId],
  );

  return {
    onConnect,
    onEdgeUpdateStart,
    onEdgeUpdate,
    onEdgeUpdateEnd,
    onNodesChange,
    onEdgesChange,
    onNodeDragStart: isNodeGroupingEnabled ? onNodeDragNodeGrouping : onNodeDrag,
    onNodeDrag: isNodeGroupingEnabled ? onNodeDragNodeGrouping : onNodeDrag,
    onNodeDragStop: isNodeGroupingEnabled ? onNodeDragStopNodeGrouping : onNodeDragStop,
    onSelectionDragStart: isNodeGroupingEnabled ? onSelectionDragNodeGrouping : onSelectionDrag,
    onSelectionDrag: isNodeGroupingEnabled ? onSelectionDragNodeGrouping : onSelectionDrag,
    onSelectionDragStop: isNodeGroupingEnabled ? onSelectionDragStopNodeGrouping : onSelectionDragStop,
    isValidConnection,
  };
};
