import { ClipboardEvent, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useReactFlow, XYPosition } from 'reactflow';
import cloneDeep from 'lodash/cloneDeep';
import { log } from '@/logger/logger.ts';
import { Node, Edge, BaseNodeData } from '@/types/node';
import { useAnalytics, TrackTypeEnum } from '@/hooks/useAnalytics';
import { useReactFlowCenterPosition, getCenterScreenPosition } from '@/hooks/useReactFlowCenterPosition';
import { useWorkflowStore, useUserWorkflowRole } from '@/state/workflow.state';
import { AddNewNodeOptions, NodePlacement } from './flowTypes';
import { useEdges, useFlowView, useNodes } from './FlowContext';
import type { NodeDefinition } from '@/types/api/nodeDefinition';

const logger = log.getLogger('useGraph');

// TODO remove and use NodePlacement directly at call sites
function placementFromNewNodeArgs({
  dropX,
  dropY,
  fromCenter,
  absolutePosition,
}: Pick<AddNewNodeOptions, 'dropX' | 'dropY' | 'fromCenter' | 'absolutePosition'>): NodePlacement {
  if (typeof dropX === 'number' && typeof dropY === 'number') {
    if (fromCenter) {
      return { type: 'fromCenter', dx: dropX, dy: dropY };
    } else {
      return absolutePosition ? { type: 'absolute', x: dropX, y: dropY } : { type: 'drop', x: dropX, y: dropY };
    }
  } else {
    return { type: 'atCenter' };
  }
}

function getNewNodePosition(
  flowContainerRect: DOMRect,
  screenToFlowPosition: (p: XYPosition) => XYPosition,
  placement: NodePlacement,
): XYPosition {
  switch (placement.type) {
    case 'fromCenter': {
      const centerPosition = getCenterScreenPosition(flowContainerRect, screenToFlowPosition);
      return { x: centerPosition.x + placement.dx, y: centerPosition.y + placement.dy };
    }
    case 'absolute': {
      return { x: placement.x, y: placement.y };
    }
    case 'drop': {
      const flowPosition = screenToFlowPosition({
        x: placement.x,
        y: placement.y,
      });
      return { x: flowPosition.x - 60, y: flowPosition.y - 50 };
    }
    case 'atCenter': {
      return getCenterScreenPosition(flowContainerRect, screenToFlowPosition);
    }
    default: {
      const _exhaustiveCheck: never = placement;
      throw new Error('invalid node placement');
    }
  }
}

export function createNewNode(
  nodeTypeId: string,
  nodeTypes: NodeDefinition[],
  position: XYPosition,
  initialData?: any,
  pastedData?: any,
) {
  const selectedOption = nodeTypes.find((option) => option.id === nodeTypeId);
  if (selectedOption) {
    // Create a new node object with the selected option's data
    const newNode: Node = {
      ...selectedOption,
      locked: selectedOption.data.isLocked ?? false,
      id: uuidv4(),
      position,
      createdAt: new Date().toISOString(),
      data: {
        ...cloneDeep(selectedOption.data),
        ...initialData,
        ...(initialData ? { initialData } : {}),
        ...(pastedData ? { pastedData } : {}),
      } as BaseNodeData, // FIXME
    };
    return newNode;
  }
}

export function useGraph() {
  const role = useUserWorkflowRole();
  const { screenToFlowPosition } = useReactFlow();
  const { getCenterPosition } = useReactFlowCenterPosition();
  const flowView = useFlowView();
  const { track } = useAnalytics();
  const getReactFlowContainerRect = useWorkflowStore((s) => s.getReactFlowContainerRect);
  const nodeTypes = useWorkflowStore((state) => state.nodeTypes);

  const addNewNode = useCallback(
    ({ action, dropX, dropY, absolutePosition = false, fromCenter = false, connection }: AddNewNodeOptions) => {
      track(
        'added_new_node',
        {
          type: action.displayName,
          definitionType: action.type || nodeTypes.find((n) => n.id === action.id)?.type,
          nodeDefinitionId: action.id,
        },
        TrackTypeEnum.BI,
      );
      const reactFlowContainerRect = getReactFlowContainerRect();
      if (reactFlowContainerRect === undefined) throw new Error('Expected Flow container');

      const placement = placementFromNewNodeArgs({ dropX, dropY, absolutePosition, fromCenter });
      const position = getNewNodePosition(reactFlowContainerRect, screenToFlowPosition, placement);
      const newNode = createNewNode(action.id, nodeTypes, position, action.initialData, action.pastedData);
      if (newNode) {
        flowView.addNewNode(newNode, connection);
        flowView.selectedNodes = [newNode.id];
        return newNode;
      } else {
        logger.error(`Option for action "${action.name}" not found.`);
      }
    },
    [flowView, nodeTypes, getReactFlowContainerRect, screenToFlowPosition, track],
  );

  const pasteNodesOrImageFromClipboard = useCallback(
    (event: ClipboardEvent) => {
      if (role !== 'editor') return;

      const clipboardData = event.clipboardData;
      if (!clipboardData) throw new Error('Expected browser paste event to always have clipboardData');

      // Check for image files first (including macOS screen captures)
      for (const item of clipboardData.items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            logger.info('paste image from clipboard', { file });
            addNewNode({
              action: {
                type: 'import',
                pastedData: { imageFile: file },
                id: 'wkKkBSd0yrZGwbStnU6rClone',
              },
            });
          }
          return;
        }
      }

      const pastedText = clipboardData.getData('text/plain');
      if (!pastedText) return;
      // handle paste nodes and edges
      let parsedJson;
      try {
        parsedJson = JSON.parse(pastedText);
      } catch (_e) {
        return;
      }

      if (!parsedJson) return;

      const clipboardNodes: Node[] | undefined = parsedJson.nodes;
      const clipboardEdges: Edge[] | undefined = parsedJson.edges;

      if (clipboardNodes && clipboardNodes.length > 0) {
        flowView.pasteNodesAndEdges(clipboardNodes, clipboardEdges ?? [], getCenterPosition());
      }
    },
    [role, addNewNode, flowView, getCenterPosition],
  );

  const nodes = useNodes();
  const edges = useEdges();
  const copyNodesToClipboard = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected);
    if (selectedNodes.length > 0) {
      const nodesToCopy = selectedNodes.map((node) => ({ ...node }));

      // Copy edges that connect between selected nodes
      const edgesToCopy = edges.filter(
        (edge) =>
          selectedNodes.some((node) => node.id === edge.source) &&
          selectedNodes.some((node) => node.id === edge.target),
      );

      // setClipboardNodes(nodesToCopy);
      // setClipboardEdges(edgesToCopy); // Store copied edges as is
      const clipboardDataString = JSON.stringify({ nodes: nodesToCopy, edges: edgesToCopy });
      void navigator.clipboard.writeText(clipboardDataString);
    }
  }, [edges, nodes]);

  return {
    addNewNode,
    copyNodesToClipboard,
    pasteNodesOrImageFromClipboard,
  };
}
