import { FileKind, Input, InputId, NodeId, OutputId } from 'web';
import { Instance, type XYPosition } from 'reactflow';
import { HandleType } from '@/enums/handle-type.enum';
import { getHandleName } from '@/components/Nodes/DynamicNode/HandlesUtils';
import { log } from '@/logger/logger';
import { ModelBaseNodeData } from '@/types/nodes/model';
import { getHandleId } from '../../Nodes/Utils';
import { FlowGraph } from '../FlowGraph';
import { UndoRedoEntry } from '../undoRedo';
import { getHandle } from '../utils';
import { NodeGroupingView } from './NodeGrouping/GroupsManagerView';
import type { BaseNodeData, Edge, EdgeId, Node } from '@/types/node';
import type { Connection } from '../FlowComponents/FlowTour/ConnectionContext';

enum NodeDragState {
  GROUPED_SAME_PARENT = 'GROUPED_SAME_PARENT',
  GROUPED_MIXED_PARENTS = 'GROUPED_MIXED_PARENTS',
  UNGROUPED = 'UNGROUPED',
}

const logger = log.getLogger('FlowView');

export class FlowView {
  private nodeGroupingView: NodeGroupingView;
  constructor(private graph: FlowGraph) {
    this.nodeGroupingView = new NodeGroupingView(graph);
  }

  /// NODES
  addNewNode(newNode: Node, connection?: Connection) {
    this.graph.edit(() => {
      const undoEntry = this.graph.addNodes([newNode]);
      if (connection?.handleType && connection.handleSide && connection.nodeId && connection.handleId) {
        // connect with edge if exists
        const handleKey = getHandle(
          newNode,
          connection.handleType,
          connection.handleSide === 'source' ? 'input' : 'output',
        );
        if (!handleKey) {
          return undoEntry;
        }

        const newHandleId = getHandleId(newNode.id, connection.handleSide === 'source' ? 'input' : 'output', handleKey);
        if (!newHandleId) {
          return undoEntry;
        }

        if (connection.handleSide === 'source') {
          undoEntry.add(this.connectEdgeToTarget(connection.nodeId, newNode.id, connection.handleId, newHandleId));
        } else if (connection.handleSide === 'target') {
          undoEntry.add(this.connectEdgeToTarget(newNode.id, connection.nodeId, newHandleId, connection.handleId));
        }
      }
      return undoEntry;
    });
    void this.graph.updateNodeOutputs(newNode.id, false);
  }

  /**
   * @deprecated
   */
  updateNodeData<T extends Record<string, any>>(nodeId: NodeId, newData: Partial<T>) {
    this.graph.updateNodeData(nodeId, newData);
  }

  // TODO: Remove
  updateInputBeforeRun(nodeId: NodeId, nodeData: ModelBaseNodeData) {
    if (this.graph.isSupportedNode(nodeId)) {
      const parameterIds = this.graph.wasm.call((wasm) => wasm.parameterIds(nodeId)) ?? [];
      nodeData.params = Object.fromEntries(
        parameterIds.map((parameterId) => {
          const parameterValue = this.graph.wasm.call((wasm) => wasm.evaluateParameter(nodeId, parameterId));
          return [parameterId, parameterValue?.value];
        }),
      );
      const inputIds = this.graph.wasm.call((wasm) => wasm.inputIds(nodeId)) ?? [];
      nodeData.input = Object.fromEntries(
        inputIds.map((inputId) => {
          if (parameterIds.includes(inputId)) {
            return [inputId, nodeData.params[inputId]];
          }

          const evaluatedInputValue = () => {
            const inputValue = this.graph.wasm.call((wasm) => wasm.evaluateInput(nodeId, inputId));

            // If the input is a computed image, we need to render it
            // Computed videos are rendered server side
            if (inputValue?.type === 'image' && inputValue.value === undefined) {
              const input = this.graph.wasm.call((wasm) => wasm.nodeInput(nodeId, inputId));
              const img = input ? this.graph.wasm.call((wasm) => wasm.exportNodeRender(input.nodeId)) : undefined;
              return img ? { type: 'image' as const, url: img.data, width: img.width, height: img.height } : undefined;
            }
            if (
              inputValue?.type &&
              inputValue?.value &&
              typeof inputValue?.value === 'object' &&
              !Array.isArray(inputValue?.value)
            ) {
              return { ...inputValue?.value, type: inputValue?.type };
            }
            return inputValue?.value;
          };
          return [inputId, evaluatedInputValue()];
        }),
      );
    }
  }

  pasteNodesAndEdges(clipboardNodes: Node[], clipboardEdges: Edge[], centerPosition: { x: number; y: number }) {
    this.graph.edit(() => {
      const { undoEntry, newNodeIds } = this.graph.pasteNodesAndEdges(clipboardNodes, clipboardEdges, centerPosition);
      this.selectedNodes = newNodeIds;
      return undoEntry;
    });
  }

  duplicateNodes(nodeIds: NodeId[], centerPosition: XYPosition) {
    if (nodeIds.length === 0) return;
    this.graph.edit(() => {
      const duplicatedNodes = nodeIds.map((nodeId) => {
        const node = this.graph.store.getNode(nodeId);
        return {
          ...node,
          data: {
            ...node.data,
            // TODO: when save is split to single actions - move this generation to backend
            // when duplicating a node
            result: Array.isArray(node.data.result)
              ? node.data.result.map((r: any) => {
                  if (r !== null && r !== undefined && typeof r === 'object' && !Array.isArray(r)) {
                    return { ...r, id: crypto.randomUUID() };
                  }
                  return r;
                })
              : node.data.result,
          },
        };
      });
      const duplicatedEdges = this.graph.store
        .getEdges()
        .filter((e) => nodeIds.includes(e.source) && nodeIds.includes(e.target));

      const { undoEntry, newNodeIds } = this.graph.pasteNodesAndEdges(duplicatedNodes, duplicatedEdges, centerPosition);
      this.selectedNodes = newNodeIds;
      return undoEntry;
    });
  }

  setNodeDimensions(
    dimensions: { nodeId: NodeId; width: number; height: number; updateStyle?: boolean }[],
  ): UndoRedoEntry {
    const undoEntry = UndoRedoEntry.empty();
    for (const { nodeId, width, height } of dimensions) {
      undoEntry.add(
        this.graph.store.updateNode(nodeId, () => {
          return { width, height };
        }),
      );
    }
    return undoEntry;
  }

  setNodePositions(positions: { nodeId: NodeId; position: { x: number; y: number } }[]) {
    const undoEntry = UndoRedoEntry.empty();
    for (const { nodeId, position } of positions) {
      undoEntry.add(this.graph.store.updateNode(nodeId, (_) => ({ position })));
    }
    return undoEntry;
  }

  editNodePositions(positions: { nodeId: NodeId; position: { x: number; y: number } }[], ongoing: boolean) {
    this.graph.cancelOngoingAction();
    if (
      !positions.every(({ nodeId, position }) => {
        const current = this.graph.store.getNode(nodeId).position;
        return (current.x - position.x) ** 2 + (current.y - position.y) ** 2 < 4;
      })
    ) {
      this.graph.edit(() => this.setNodePositions(positions), ongoing);
    }
  }

  setNodePositionsAndDimensions(
    positions: {
      nodeId: NodeId;
      position: { x: number; y: number };
      width?: number;
      height?: number;
    }[],
  ) {
    const undoEntry = UndoRedoEntry.empty();
    for (const { nodeId, position, width, height } of positions) {
      undoEntry.add(this.setNodePositions([{ nodeId, position }]));
      if (width !== undefined && height !== undefined) {
        undoEntry.add(this.setNodeDimensions([{ nodeId, width, height }]));
      }
    }
    return undoEntry;
  }

  moveNodesBy(nodes: NodeId[], delta: { x: number; y: number }) {
    this.graph.edit(
      () =>
        this.setNodePositions(
          nodes.map((nodeId) => {
            const current = this.graph.store.getNode(nodeId).position;
            const newPosition = { x: current.x + delta.x, y: current.y + delta.y };
            return { nodeId, position: newPosition };
          }),
        ),
      false,
    );
  }

  toggleLockNode(nodeId: NodeId) {
    this.graph.edit(() => {
      const undoEntry = this.graph.store.updateNode(nodeId, (node) => {
        const updatedIsLocked = !node.data.isLocked;
        return {
          data: {
            ...node.data,
            isLocked: updatedIsLocked,
          },
          draggable: updatedIsLocked ? false : undefined,
        };
      });
      if (this.graph.isSupportedNode(nodeId)) {
        undoEntry.add(this.graph.wasmChange((wasm) => wasm.toggleNodeLocked(nodeId)));
      }
      return undoEntry;
    });
  }

  deleteNodes(nodeIds: NodeId[]) {
    this.graph.edit(() => {
      this.selectedNodes = this.selectedNodes.filter((id) => !nodeIds.includes(id));
      return this.graph.removeNodes(nodeIds);
    });
  }

  deleteSelected() {
    if (this.selectedNodes.length > 0) {
      // deleting nodes deletes the relevant edges
      this.deleteNodes(this.selectedNodes);
    } else if (this.selectedEdges.length > 0) {
      this.deleteEdges(this.selectedEdges);
    }
  }

  fileInput(input: Input | undefined): FileKind | undefined {
    return input ? this.graph.wasm.call((wasm) => wasm.nodeFileInput(input)) : undefined;
  }

  nodeInputDimensions(input: Input | undefined): { width: number; height: number } | undefined {
    return input ? this.graph.wasm.call((wasm) => wasm.nodeInputDimensions(input)) : undefined;
  }

  isInputValid(nodeId: NodeId, inputId: InputId, handleType: HandleType | undefined = undefined): boolean {
    return this.graph.isInputValid(nodeId, inputId, handleType);
  }

  nodeValidInputTypes(nodeId: NodeId, inputId: InputId): Array<HandleType> {
    return this.graph.nodeValidInputTypes(nodeId, inputId);
  }

  nodeInputType(nodeId: NodeId, inputId: InputId): HandleType | undefined {
    return this.graph.nodeInputType(nodeId, inputId);
  }

  nodeOutputType(nodeId: NodeId, outputId: OutputId): HandleType | undefined {
    return this.graph.nodeOutputType(nodeId, outputId);
  }

  nodeOutputTypeFromInput(input: Input): HandleType | undefined {
    return this.graph.nodeOutputTypeFromInput(input);
  }

  /// EDGES

  getEdge(edgeId: EdgeId): Edge {
    return this.graph.store.getEdge(edgeId);
  }

  getEdgeNullable(edgeId: EdgeId): Edge | undefined {
    return this.graph.store.getEdgeNullable(edgeId);
  }

  wouldConnectionResultInCycle(source: NodeId, target: NodeId): boolean {
    return this.graph.wouldConnectionResultInCycle(source, target);
  }

  connectEdge(source: NodeId, target: NodeId, sourceHandle: string, targetHandle: string) {
    this.graph.edit(() => {
      return this.connectEdgeToTarget(source, target, sourceHandle, targetHandle);
    });
  }

  reconnectEdge(source: NodeId, target: NodeId, sourceHandle: string, targetHandle: string, oldEdge: Edge) {
    if (
      source === oldEdge.source &&
      sourceHandle === oldEdge.sourceHandle &&
      target === oldEdge.target &&
      targetHandle === oldEdge.targetHandle
    ) {
      // reconnecting edge to same handle, do nothing
      return;
    }
    this.graph.edit(() => {
      const undoEntry = this.graph.removeEdges([oldEdge.id]);
      undoEntry.add(this.connectEdgeToTarget(source, target, sourceHandle, targetHandle));
      return undoEntry;
    });
  }

  /**
   * Handles continuous drag operations while nodes are being dragged.
   * Updates positions and expands groups as needed.
   */
  handleNodeDrag(
    nodes: Node[],
    isGroupModifierPressed: boolean,
    getIntersectingNodes: Instance.GetIntersectingNodes<BaseNodeData>,
    setHighlightedGroupId: (groupId: string) => void,
    clearHighlightedGroupId: () => void,
  ): void {
    // Early return for group modifier mode
    this.graph.edit(() => {
      const undoEntry = UndoRedoEntry.empty();

      if (isGroupModifierPressed) {
        undoEntry.add(this.setNodePositions(nodes.map((node) => ({ nodeId: node.id, position: node.position }))));
        return undoEntry;
      }

      const dragState = this.getDragState(nodes);
      switch (dragState) {
        case NodeDragState.GROUPED_SAME_PARENT:
          // Expand and rebase grouped nodes
          nodes.forEach((node) => undoEntry.add(this.nodeGroupingView.expandGroupAndRebaseChildrenIfNeeded(node)));
          break;

        case NodeDragState.GROUPED_MIXED_PARENTS:
          // Mixed parent nodes: update positions during drag
          undoEntry.add(this.setNodePositions(nodes.map((node) => ({ nodeId: node.id, position: node.position }))));
          break;

        case NodeDragState.UNGROUPED: {
          // Ungrouped nodes: handle group highlighting and update positions
          const intersectingGroupId = this.nodeGroupingView.findIntersectingGroup(nodes, getIntersectingNodes);
          if (intersectingGroupId) {
            setHighlightedGroupId(intersectingGroupId);
          } else {
            clearHighlightedGroupId();
          }
          undoEntry.add(this.setNodePositions(nodes.map((node) => ({ nodeId: node.id, position: node.position }))));
          break;
        }
      }
      return undoEntry;
    }, true);
  }

  /**
   * Handles drag stop operations when nodes finish being dragged.
   * Performs final positioning, group attachment, or removal from groups.
   */
  handleNodeDragStop(
    nodes: Node[],
    isGroupModifierPressed: boolean,
    getIntersectingNodes: Instance.GetIntersectingNodes<BaseNodeData>,
    clearHighlightedGroupId: () => void,
  ): void {
    this.graph.edit(() => {
      const undoEntry = UndoRedoEntry.empty();
      const dragState = this.getDragState(nodes);

      // Handle group modifier removal first
      if (isGroupModifierPressed && dragState === NodeDragState.GROUPED_SAME_PARENT) {
        undoEntry.add(this.nodeGroupingView.removeNodesFromGroup(nodes));
        clearHighlightedGroupId();
        return undoEntry;
      }

      switch (dragState) {
        case NodeDragState.GROUPED_SAME_PARENT:
          // Expand and rebase grouped nodes
          nodes.forEach((node) => undoEntry.add(this.nodeGroupingView.expandGroupAndRebaseChildrenIfNeeded(node)));
          break;

        case NodeDragState.GROUPED_MIXED_PARENTS:
          // Mixed parent nodes: update positions
          undoEntry.add(this.setNodePositions(nodes.map((node) => ({ nodeId: node.id, position: node.position }))));
          break;

        case NodeDragState.UNGROUPED: {
          // Ungrouped nodes: handle group attachment or position update
          const intersectingGroupId = this.nodeGroupingView.findIntersectingGroup(nodes, getIntersectingNodes);
          if (intersectingGroupId) {
            undoEntry.add(this.nodeGroupingView.attachNodesToGroup(nodes, intersectingGroupId));
          } else {
            undoEntry.add(this.setNodePositions(nodes.map((node) => ({ nodeId: node.id, position: node.position }))));
          }
          break;
        }
      }
      return undoEntry;
    }, false);

    clearHighlightedGroupId();
  }

  /**
   * Determines the drag state of the given nodes
   */
  private getDragState(nodes: Node[]): NodeDragState {
    const hasParents = nodes.some((node) => this.graph.isNodeInGroup(node.id));
    const allInSameGroup = this.nodeGroupingView.areAllNodesInSameGroup(nodes);

    if (allInSameGroup) {
      return NodeDragState.GROUPED_SAME_PARENT;
    } else if (hasParents) {
      return NodeDragState.GROUPED_MIXED_PARENTS;
    } else {
      return NodeDragState.UNGROUPED;
    }
  }

  private connectEdgeToTarget(
    source: NodeId,
    target: NodeId,
    sourceHandle: string,
    targetHandle: string,
  ): UndoRedoEntry {
    const newEdge = this.graph.createEdge(source, target, sourceHandle, targetHandle);
    const existingEdge = this.graph.store
      .getEdges()
      .find((edge) => edge.target === newEdge.target && edge.targetHandle === newEdge.targetHandle);
    if (existingEdge) {
      const undoEntry = UndoRedoEntry.empty();
      undoEntry.add(this.graph.removeEdges([existingEdge.id]));
      undoEntry.add(this.graph.addEdges([newEdge]));
      return undoEntry;
    } else {
      return this.graph.addEdges([newEdge]);
    }
  }

  deleteEdges(edgeIds: EdgeId[]) {
    this.graph.edit(() => {
      this.selectedEdges = this.selectedEdges.filter((id) => !edgeIds.includes(id));
      return this.graph.removeEdges(edgeIds);
    });
  }

  /// UNDO REDO
  undo() {
    this.graph.undo();
  }

  redo() {
    this.graph.redo();
  }

  hasUndo() {
    return this.graph.hasUndo();
  }

  hasRedo() {
    return this.graph.hasRedo();
  }

  /// SELECTION
  get selectedNodes(): NodeId[] {
    return this.graph.getSelectedNodes();
  }

  set selectedNodes(nodeIds: NodeId[]) {
    this.graph.setSelectedNodes(nodeIds);
  }

  get selectedEdges(): EdgeId[] {
    return this.graph.getSelectedEdges();
  }

  set selectedEdges(edgeIds: EdgeId[]) {
    this.graph.setSelectedEdges(edgeIds);
  }

  /// Validation
  missingRequiredInputs(nodeId: NodeId): string[] {
    if (this.graph.isSupportedNode(nodeId)) {
      return (
        this.graph.wasm.call((wasm) => {
          return wasm.inputIds(nodeId).filter((inputId) => {
            return wasm.isInputRequired(nodeId, inputId) && wasm.nodeInput(nodeId, inputId) === undefined;
          });
        }) ?? []
      );
    }
    const node = this.graph.store.getNodeNullable(nodeId);
    if (!node) return [];

    const requiredHandles = validateAndGetRequiredHandles(node);
    if (requiredHandles === null || requiredHandles.length === 0) return [];

    const edges = this.graph.store.getEdges();

    const nodeInputEdges = edges.filter((edge) => edge.target === nodeId);
    const missingRequiredHandles = requiredHandles.filter(
      (handle) => !nodeInputEdges.some((edge) => getHandleName(edge.targetHandle) === handle),
    );

    if (missingRequiredHandles.length === 0) return [];

    logger.info('Missing required handles', { missingRequiredHandles, nodeId, nodeInputEdges });

    return missingRequiredHandles;
  }

  invalidRequiredInputs(nodeId: NodeId): string[] {
    if (this.graph.isSupportedNode(nodeId)) {
      return (
        this.graph.wasm.call((wasm) => {
          return wasm.inputIds(nodeId).filter((inputId) => {
            return wasm.isInputRequired(nodeId, inputId) && !wasm.isInputValid(nodeId, inputId);
          });
        }) ?? []
      );
    }
    const node = this.graph.store.getNodeNullable(nodeId);
    if (!node) return [];
    const requiredHandles = validateAndGetRequiredHandles(node);
    if (requiredHandles === null || requiredHandles.length === 0) return [];

    const emptyRequiredHandles = requiredHandles
      .map<[string, unknown]>((handle) => [handle, this.graph.getNodeInput(nodeId, handle)])
      .filter(([_, input]) => {
        if (input === undefined || input === null) return true;
        if (Array.isArray(input)) return input.length === 0;
        if (typeof input === 'object') {
          if (isWasmInput(input)) {
            return (
              input.file === undefined &&
              (input.string === undefined || input.string === '') &&
              (input.stringArray === undefined || input.stringArray.length === 0)
            );
          }
          return Object.keys(input).length === 0;
        }
        return input === '';
      });

    if (emptyRequiredHandles.length === 0) return [];

    logger.info('Empty required handles', { emptyRequiredHandles, nodeId });

    return emptyRequiredHandles.map(([handle]) => handle);
  }
}

export type InvalidConnectionOptions = {
  errorId: 'self-connection' | 'cyclic';
  source: NodeId;
  sourceHandle: string | null;
  target: NodeId;
  targetHandle: string | null;
  additionalParams?: Record<string, unknown>;
};

const validateAndGetRequiredHandles = (node: Node | null | undefined): string[] | null => {
  if (!node) return null;
  const { handles, version } = node.data;

  if (version !== 2 && version !== 3) return null;

  if (!handles.input || typeof handles.input !== 'object' || Array.isArray(handles.input)) {
    return null;
  }

  return Object.entries(handles.input)
    .filter(([, handle]) => handle.required)
    .map(([key]) => key);
};

const isWasmInput = (input: Input | Record<string, any>): input is Input => {
  return 'nodeId' in input && 'outputId' in input;
};
