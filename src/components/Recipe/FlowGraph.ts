import uniq from 'lodash/uniq';
import { cloneDeep } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import posthog from 'posthog-js';
import {
  type BlurOptions,
  type Node as WasmNode,
  type NodeId,
  type Channel,
  type Input,
  type LayerId,
  type Edit,
  type Web,
  type InputId,
  type OutputId,
  DataType,
  VideoState,
  CompositorState,
  NodeKind,
  AiModelKind,
  ParameterValue,
  Parameter,
  Vec2,
  PainterState,
} from 'web';
import { validateFile, validateParameterValue, validateString, validateStringArray } from '@/utils/nodeInputValidation';
import { log } from '@/logger/logger';
import {
  FF_DALLE3_V2,
  FF_IMAGEN3_V2,
  FF_LUMA_PHOTON,
  FF_MINIMAX_V2,
  FF_PAINTER_NODE,
  FF_REVE_V2,
  FF_WAN_VIDEO_V2,
  FF_BR_BGREPLACE_V2,
  FF_SD_SKETCH_V2,
  FF_MINIMAX_VIDEO_DIRECTOR_V2,
  FF_MESHY,
  FF_HUNYUAN3D_V2,
} from '@/consts/featureFlags';
import { HandleType } from '@/enums/handle-type.enum';
import { ModelAssetToUploadedAsset, UploadedAsset, UploadedAssetToModelAsset } from '@/types/api/assets';
import { containFileDataWithoutId } from '@/utils/nodeDataValidator';
import { getHandleType } from '../Nodes/DynamicNode/HandlesUtils';
import { WasmAPI } from './WasmAPI';
import { loadResources } from './resourceLoading';
import { UndoRedo, UndoRedoEntry } from './undoRedo';
import { FlowState, FlowStore } from './FlowStore';
import { mergeSeedParam } from './Views/ModelBaseView';
import type {
  Node,
  Edge,
  Handle,
  EdgeId,
  TextData,
  NumberData,
  BaseNodeData,
  ExtractVideoFrameData,
  PreviewData,
  PromptData,
  PromptConcatenatorData,
  ListSelectorData,
  NumberSelectorData,
  StringArrayData,
  ImportData,
  ExportData,
  ToggleData,
  SeedData,
  RouterData,
  MediaIteratorData,
} from '@/types/node';
import type { CompositorNodeV3 } from '@/types/nodes/compositor';
import type { AiModelData, ModelBaseNodeData } from '@/types/nodes/model';

export type NodeType = NodeKind['type'];
export type ModelNodeType = AiModelKind['type'];

export interface FlowUIState {
  compositor: Record<NodeId, CompositorState>;
  video: Record<NodeId, VideoState>;
  painter: Record<NodeId, PainterState>;
}

const initialUIState: FlowUIState = {
  compositor: {},
  video: {},
  painter: {},
};

function isSupportedModelNodeType(modelData: ModelBaseNodeData): boolean {
  switch (modelData?.model?.name) {
    case 'Dalle3': {
      return posthog.isFeatureEnabled(FF_DALLE3_V2) ?? false;
    }
    case 'minimax/image-01': {
      return posthog.isFeatureEnabled(FF_MINIMAX_V2) ?? false;
    }
    case 'reve': {
      return posthog.isFeatureEnabled(FF_REVE_V2) ?? false;
    }
    case 'google/imagen-3': {
      return posthog.isFeatureEnabled(FF_IMAGEN3_V2) ?? false;
    }
    case 'wan-video/wan-2.1-1.3b': {
      return posthog.isFeatureEnabled(FF_WAN_VIDEO_V2) ?? false;
    }
    case 'br_bgreplace': {
      return posthog.isFeatureEnabled(FF_BR_BGREPLACE_V2) ?? false;
    }
    case 'sd_sketch': {
      return posthog.isFeatureEnabled(FF_SD_SKETCH_V2) ?? false;
    }
    case 'luma/photon': {
      return posthog.isFeatureEnabled(FF_LUMA_PHOTON) ?? false;
    }
    case 'minimax/video-01-director': {
      return posthog.isFeatureEnabled(FF_MINIMAX_VIDEO_DIRECTOR_V2) ?? false;
    }
    case 'meshy_image23d': {
      return posthog.isFeatureEnabled(FF_MESHY) ?? false;
    }
    case 'tencent/hunyuan3d-2mv': {
      return posthog.isFeatureEnabled(FF_HUNYUAN3D_V2) ?? false;
    }

    default: {
      return false;
    }
  }
}

function isSupportedNodeType(nodeType: unknown): nodeType is NodeType {
  const supportedNodeTypes = [
    'compv3',
    'channels',
    'blur',
    'invert',
    'merge_alpha',
    'levels',
    'dilation_erosion',
    'string',
    'integer',
    'promptV3',
    'prompt_concat',
    'array',
    'export',
    'boolean',
    'seed',
    'extract_video_frame',
    'preview',
    'router',
    'custommodelV2',
    'import',
    'media_iterator',
    'muxv2',
    'number_selector',
    'resize',
    'crop',
  ];
  if (posthog.isFeatureEnabled(FF_PAINTER_NODE)) {
    supportedNodeTypes.push('painterV2');
  }
  return supportedNodeTypes.includes(nodeType as NodeType);
}

let instance: FlowGraph | undefined;
const logger = log.getLogger('FlowGraph');

export class FlowGraph {
  private flowStore: FlowStore;
  private wasmAPI: WasmAPI;
  private eventHandler: EventHandler;

  private undoRedo = new UndoRedo();
  private ongoingUndoState: UndoRedoEntry | undefined;
  private errorListeners = new Set<(error: { message: string; recovered: boolean }) => void>();

  private uiState: FlowUIState = initialUIState;
  private uiStateListeners = new Set<() => void>();

  private updateQueue: string[] = [];
  private unsub = () => {};

  constructor(nodes: Node[], edges: Edge[], canvas: HTMLCanvasElement, editable: boolean) {
    if (instance) {
      logger.error('FlowGraph instance already exists');
      instance.dispose();
    }
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    instance = this;

    this.flowStore = new FlowStore({ nodes, edges });

    const unsubNodes = this.store.addNodesListener(() => this.onStateChange());
    const unsubEdges = this.store.addEdgesListener(() => this.onStateChange());
    this.unsub = () => {
      unsubNodes();
      unsubEdges();
    };

    this.wasmAPI = new WasmAPI(canvas, this.store, editable, {
      onError: (recovered) => {
        let message: string;
        if (recovered) {
          this.loadNodes();
          this.uiState = initialUIState;
          message = 'Recovered from unknown error';
        } else {
          message = 'Failed to recover from unknown error';
        }
        for (const listener of this.errorListeners) {
          listener({ recovered, message });
        }
      },
      updateUIState: (updater) => this.updateUIState(updater),
      pushUndoState: (undoState) => this.undoRedo.pushEntry(undoState),
      updateLegacy: (nodeId, isSeek) => {
        if (!isSeek || this.store.getNodeNullable(nodeId)?.type === 'extract_video_frame') {
          void this.updateNodeOutputs(nodeId);
        }
      },
    });

    this.eventHandler = new EventHandler(this, canvas);

    // load nodes
    this.loadNodes();
  }

  get store() {
    return this.flowStore;
  }

  get wasm() {
    return this.wasmAPI;
  }

  isSupportedNode(nodeId: NodeId): boolean {
    const type = this.getNodeType(nodeId);
    if (type === 'custommodelV2') {
      const modelData = this.store.getNodeData<ModelBaseNodeData>(nodeId);
      return isSupportedModelNodeType(modelData);
    }
    return isSupportedNodeType(type);
  }

  private logInvalidNodeData(nodes: { id: NodeId; node: Node }[]) {
    try {
      // iterate over all nodes and check if they contain file data object without id
      nodes.forEach((node) => {
        const invalidNode = containFileDataWithoutId(node.node.data, node.id);
        if (invalidNode) {
          logger.warn('AssetIdValidationError: during graph load, missing id in node', invalidNode);
        }
      });
    } catch (error) {
      logger.warn('Error logging invalid node data', error);
    }
  }

  private loadNodes() {
    for (const node of this.store.getNodes()) {
      if (node.type === 'crop') {
        if (Array.isArray(node.data.handles.input) && node.data.handles.input.includes('image')) {
          for (const edge of this.store.getEdges()) {
            if (edge.target === node.id && edge.targetHandle) {
              edge.targetHandle = edge.targetHandle.replace('image', 'file');
            }
          }
          node.data.handles.input = ['file'];
        }
      }
    }

    const wasmNodeEntries = this.store
      .getNodes()
      .map((n) => {
        const wasmNode = this.toWasmNode(n);
        return wasmNode ? ([n.id, wasmNode] as const) : null;
      })
      .filter((n) => n != null);

    this.logInvalidNodeData(wasmNodeEntries.map(([id, _]) => ({ id, node: this.store.getNode(id) })));

    this.wasmChange((wasm) => {
      const edit = wasm.importGraph({ nodes: new Map(wasmNodeEntries) });
      void loadResources(wasm);
      return edit;
    });

    void this.updateNodeInputs(wasmNodeEntries.map(([id, _]) => id));
    this.redraw();
  }

  dispose() {
    this.eventHandler.dispose();
    this.wasmAPI.dispose();
    this.unsub();
    instance = undefined;
  }

  addErrorListener(f: (err: { message: string; recovered: boolean }) => void) {
    this.errorListeners.add(f);
    return () => {
      this.errorListeners.delete(f);
    };
  }

  getUIState() {
    return this.uiState;
  }

  addUIStateListener(f: () => void) {
    this.uiStateListeners.add(f);
    return () => {
      this.uiStateListeners.delete(f);
    };
  }

  private updateUIState(updater: (oldState: FlowUIState) => Partial<FlowUIState>) {
    this.uiState = {
      ...this.uiState,
      ...updater(this.uiState),
    };
    for (const listener of this.uiStateListeners) {
      listener();
    }
  }

  private onStateChange() {
    const nodeIdToUpdate = this.updateQueue.pop();
    if (nodeIdToUpdate == null) return;
    this.propagateOutput(nodeIdToUpdate);
  }

  private getState(): FlowState {
    return this.store.getState();
  }

  undo() {
    const undoEntry = this.undoRedo.undo();
    if (undoEntry) {
      const redoEntry: UndoRedoEntry = this.applyUndoRedoEntry(undoEntry);
      this.undoRedo.pushRedo(redoEntry);
    }
  }

  redo() {
    const redoEntry = this.undoRedo.redo();
    if (redoEntry) {
      const undoEntry: UndoRedoEntry = this.applyUndoRedoEntry(redoEntry);
      this.undoRedo.pushUndo(undoEntry);
    }
  }

  hasUndo() {
    return this.undoRedo.hasUndo();
  }

  hasRedo() {
    return this.undoRedo.hasRedo();
  }

  setUndoBarrier() {
    return this.undoRedo.setUndoBarrier();
  }

  disableUndoBarrier() {
    return this.undoRedo.disableBarrier();
  }

  cancelOngoingAction() {
    const undoState = this.ongoingUndoState;
    if (undoState !== undefined) {
      this.applyUndoRedoEntry(undoState, true);
      this.ongoingUndoState = undefined;
    }
  }

  edit(apply: () => UndoRedoEntry, ongoing: boolean = false) {
    this.cancelOngoingAction();
    const undoEntry = apply();
    if (ongoing) {
      this.ongoingUndoState = undoEntry;
    } else {
      this.undoRedo.pushEntry(undoEntry);
    }
  }

  wasmEdit(apply: (wasm: Web) => Edit, ongoing: boolean = false) {
    this.edit(() => this.wasmChange(apply), ongoing);
  }

  wasmChange(apply: (wasm: Web) => Edit): UndoRedoEntry {
    const undoState = this.wasm.edit(apply);
    return UndoRedoEntry.fromWasmEdit(undoState);
  }

  clearUndoRedoHistory() {
    this.undoRedo.clear();
  }

  private applyUndoRedoEntry(undoRedoEntry: UndoRedoEntry, ongoing: boolean = false): UndoRedoEntry {
    if (!undoRedoEntry.changes) return UndoRedoEntry.empty();

    const reverseEntry = UndoRedoEntry.empty();
    const nodeIdsToUpdate: NodeId[] = [];

    for (const change of undoRedoEntry.changes.toReversed()) {
      if (change.type === 'node') {
        const nodeEntry = change.entry;
        if (nodeEntry.type === 'remove') {
          reverseEntry.add(this.store.addNodes([nodeEntry.node]));
        } else if (nodeEntry.type === 'add') {
          reverseEntry.add(this.store.removeNodes([nodeEntry.nodeId]));
        } else if (nodeEntry.type === 'update') {
          reverseEntry.add(
            this.store.updateNode(nodeEntry.node.id, (_prevNode) => ({
              ...nodeEntry.node,
            })),
          );
          nodeIdsToUpdate.push(nodeEntry.node.id);
        } else if (nodeEntry.type === 'set') {
          reverseEntry.add(this.store.setNode(nodeEntry.node.id, nodeEntry.node));
          nodeIdsToUpdate.push(nodeEntry.node.id);
        }
      }

      if (change.type === 'edge') {
        const edgeEntry = change.entry;
        if (edgeEntry.type === 'remove') {
          reverseEntry.add(this.store.addEdges([edgeEntry.edge]));
          nodeIdsToUpdate.push(edgeEntry.edge.target);
        } else if (edgeEntry.type === 'add') {
          const edge = this.store.getEdge(edgeEntry.edgeId);
          reverseEntry.add(this.store.removeEdges([edgeEntry.edgeId]));
          nodeIdsToUpdate.push(edge.target);
        }
      }

      if (change.type === 'wasm') {
        const editState = change.entry;
        reverseEntry.add(this.wasmChange((wasm) => ({ editState, undoState: wasm.edit(editState) })));
        nodeIdsToUpdate.push(...editState.map((e) => e.nodeId));
      }
    }

    if (!ongoing) {
      const existingNodeIdsToUpdate = nodeIdsToUpdate.filter((id) => this.store.getNodeNullable(id) !== undefined);
      void this.updateNodeInputs(existingNodeIdsToUpdate);
      for (const nodeId of uniq(existingNodeIdsToUpdate).filter((nodeId) => !this.isSupportedNode(nodeId))) {
        this.propagateOutput(nodeId);
      }
      void this.loadResources();
      this.redraw();
    }

    return reverseEntry;
  }

  addNodes(newNodes: Node[]): UndoRedoEntry {
    const undoEntry = this.store.addNodes(newNodes);

    const nodeEntries = newNodes
      .map((n) => {
        const wasmNode = this.toWasmNode(n);
        return wasmNode ? { id: n.id, node: wasmNode } : null;
      })
      .filter((n) => n != null);
    if (nodeEntries.length === 0) return undoEntry;
    undoEntry.add(this.wasmChange((wasm) => wasm.insertNodes(nodeEntries)));

    void this.loadResources();

    return undoEntry;
  }

  // remove nodes and associated edges
  removeNodes(nodeIdsToRemove: NodeId[]): UndoRedoEntry {
    const { edges } = this.getState();

    const removedEdges = edges.filter((e) => nodeIdsToRemove.includes(e.source) || nodeIdsToRemove.includes(e.target));
    const undoEntry = this.removeEdges(removedEdges.map((e) => e.id));

    // remove only nodes loaded in wasm
    const wasmNodeIdsToRemove = nodeIdsToRemove.filter((id) => this.isSupportedNode(id));
    undoEntry.add(this.wasmChange((wasm) => wasm.removeNodes(wasmNodeIdsToRemove)));
    undoEntry.add(this.store.removeNodes(nodeIdsToRemove));

    void this.loadResources();

    return undoEntry;
  }

  wouldConnectionResultInCycle(source: NodeId, target: NodeId): boolean {
    const edges = this.store.getEdges();
    const hasCycle = (nodeId: NodeId, visited = new Set<NodeId>()) => {
      if (nodeId === source || visited.has(nodeId)) {
        return true;
      }
      visited.add(nodeId); // To handle existing cycles

      for (const targetId of edges.filter((edge) => edge.source === nodeId).map((edge) => edge.target)) {
        if (hasCycle(targetId, new Set(visited))) {
          return true;
        }
      }

      return false;
    };

    return hasCycle(target);
  }

  isInputValid(targetNodeId: NodeId, targetInputId: InputId, handleType: HandleType | undefined): boolean {
    if (this.isSupportedNode(targetNodeId)) {
      return this.wasm.call((wasm) => wasm.isInputValid(targetNodeId, targetInputId)) ?? false;
    }

    const hasTypeMismatch = () => {
      if (!handleType || handleType === HandleType.Any) return false;
      const connectedEdge = this.store
        .getEdges()
        .find((edge) => edge.target === targetNodeId && this.inputKey(edge) === targetInputId);
      if (!connectedEdge?.data) return false;
      const sourceHandleType = connectedEdge.data.sourceHandleType as HandleType | undefined;

      // Return false if no source handle type or if it's 'any'
      if (!sourceHandleType || sourceHandleType === HandleType.Any) return false;

      // Special case: image and mask types are compatible
      if (
        (handleType === HandleType.Image && sourceHandleType === HandleType.Mask) ||
        (handleType === HandleType.Mask && sourceHandleType === HandleType.Image)
      ) {
        return false;
      }

      // Return true if the connected handle type is different
      return sourceHandleType !== handleType;
    };

    return !hasTypeMismatch();
  }

  getNodeInput(nodeId: NodeId, inputId: InputId): Input | any[] | Record<string, any> | undefined {
    if (this.isSupportedNode(nodeId)) {
      return this.wasm.call((wasm) => wasm.nodeInput(nodeId, inputId));
    }
    return this.store.getNodeData(nodeId).input?.[inputId];
  }

  nodeValidInputTypes(nodeId: NodeId, inputId: InputId): Array<HandleType> {
    if (this.isSupportedNode(nodeId)) {
      return this.wasm.call((wasm) => wasm.nodeValidInputTypes(nodeId, inputId))?.map(dataTypeToHandleType) ?? [];
    }
    const inputHandles = this.store.getNodeData(nodeId).handles.input;
    if (inputHandles && !Array.isArray(inputHandles)) {
      const type = inputHandles[inputId]?.type;
      if (type) {
        return [type];
      }
    }
    return [];
  }

  nodeInputType(nodeId: NodeId, inputId: InputId): HandleType | undefined {
    if (this.isSupportedNode(nodeId)) {
      const inputType = this.wasm.call((wasm) => wasm.nodeInputType(nodeId, inputId));
      return inputType ? dataTypeToHandleType(inputType) : undefined;
    }

    const validInputTypes = this.nodeValidInputTypes(nodeId, inputId);
    // TODO if we have a design how to display multiple possible input types, we should handle it here
    return validInputTypes.length > 1 ? HandleType.Any : validInputTypes.length > 0 ? validInputTypes[0] : undefined;
  }

  nodeOutputTypeFromInput(input: Input): HandleType | undefined {
    if (this.isSupportedNode(input.nodeId)) {
      const type = this.wasm.call((wasm) => wasm.nodeOutputType(input.nodeId, input.outputId));
      return type ? dataTypeToHandleType(type) : undefined;
    }

    if (input.file) {
      switch (input.file.type) {
        case 'image':
          return HandleType.Image;
        case 'video':
          return HandleType.Video;
        case 'audio':
          return HandleType.Audio;
        case '3D':
          return HandleType.ThreeDee;
      }
    }
    if (input.string) {
      return HandleType.Text;
    }
    if (input.stringArray) {
      return HandleType.Array;
    }

    return undefined;
  }

  nodeOutputType(nodeId: NodeId, outputId: OutputId): HandleType | undefined {
    const node = this.store.getNodeNullable(nodeId);
    if (!node) {
      logger.warn('Node not found in store when trying to get output type', { nodeId });
      return;
    }

    if (this.isSupportedNode(nodeId)) {
      const type = this.wasm.call((wasm) => wasm.nodeOutputType(nodeId, outputId));
      return type ? dataTypeToHandleType(type) : HandleType.Any;
    }

    const outputHandles = this.store.getNodeData(nodeId).handles.output;
    if (outputHandles && !Array.isArray(outputHandles)) {
      const type = outputHandles[outputId]?.type;
      if (type) {
        return type;
      }
    }

    return undefined;
  }

  addEdges(newEdges: Edge[]): UndoRedoEntry {
    const validEdges = newEdges.filter((edge) => !this.wouldConnectionResultInCycle(edge.source, edge.target));
    const inputs = validEdges.map((edge) => {
      let input: Input | undefined = undefined;
      const targetInputId: InputId = this.inputKey(edge);

      if (this.isSupportedNode(edge.target)) {
        const outputKey = this.outputKey(edge);
        input = {
          nodeId: edge.source,
          outputId: outputKey,
          file: undefined,
          string: undefined,
          stringArray: undefined,
        };

        if (!this.isSupportedNode(edge.source)) {
          const inputValue: unknown = this.getNodeOutput(edge.source, outputKey);
          input.file = validateFile(inputValue);
          input.string = validateString(inputValue);
          input.stringArray = validateStringArray(inputValue);
        }
      }

      return {
        targetNodeId: edge.target,
        targetInputId,
        input,
      };
    });

    const undoState: UndoRedoEntry = this.store.addEdges(validEdges);

    for (const { targetNodeId, targetInputId, input } of inputs) {
      if (input === undefined) {
        continue;
      }
      let newLayerId: LayerId | undefined = undefined;
      undoState.add(
        this.wasmChange((wasm) => {
          const { edit, layerId } = wasm.setNodeInput(targetNodeId, targetInputId, input);
          newLayerId = layerId;
          return edit;
        }),
      );

      if (newLayerId !== undefined) {
        let name = targetInputId[0].toUpperCase() + targetInputId.slice(1);
        name = name.replace('_', ' ');
        undoState.add(
          this.store.updateNodeData<CompositorNodeV3>(targetNodeId, (nodeData) => {
            return {
              data: {
                ...nodeData.data,
                layers: {
                  ...nodeData.data.layers,
                  // newLayerId is checked above, non-null assertions are safe
                  [newLayerId!]: { ...nodeData.data.layers[newLayerId!], name },
                },
              },
            };
          }),
        );
      }
    }

    void this.updateNodeInputs(newEdges.map((e) => e.target));
    this.redraw();

    void this.loadResources();

    return undoState;
  }

  removeEdges(edgeIds: EdgeId[]): UndoRedoEntry {
    const dependentNodeIds: NodeId[] = edgeIds.map((edgeId) => this.store.getEdge(edgeId).target);
    const undoState = UndoRedoEntry.empty();
    const inputs: { nodeId: NodeId; inputId: InputId }[] = edgeIds.map((edgeId) => {
      const edge = this.store.getEdge(edgeId);
      return {
        nodeId: edge.target,
        inputId: this.inputKey(edge),
      };
    });
    undoState.add(this.store.removeEdges(edgeIds));

    for (const { nodeId, inputId } of inputs) {
      if (this.isSupportedNode(nodeId)) {
        undoState.add(
          this.wasmChange((wasm) => {
            const { edit } = wasm.setNodeInput(nodeId, inputId, null);
            return edit;
          }),
        );
      }
    }

    void this.updateNodeInputs(dependentNodeIds);
    this.redraw();

    void this.loadResources();

    return undoState;
  }

  getSelectedNodes(): NodeId[] {
    return this.getState()
      .nodes.filter((n) => n.selected)
      .map((n) => n.id);
  }

  setSelectedNodes(selectedNodeIds: NodeId[]) {
    const selectedIdSet = new Set(selectedNodeIds);
    for (const node of this.store.getNodes()) {
      const selected = selectedIdSet.has(node.id);
      if (Boolean(node.selected) !== selected) {
        this.store.updateNode(node.id, () => ({ selected }));
      }
    }

    this.updateEdgeSelection();
  }

  private updateEdgeSelection() {
    const nodeIdSet = new Set(this.getSelectedNodes());
    for (const edge of this.store.getEdges()) {
      const selected = nodeIdSet.has(edge.source) || nodeIdSet.has(edge.target);
      if (Boolean(edge.selected) !== selected) {
        this.store.updateEdge(edge.id, () => ({ selected }));
      }
    }
  }

  getSelectedEdges(): EdgeId[] {
    return this.store
      .getEdges()
      .filter((e) => e.selected)
      .map((e) => e.id);
  }

  setSelectedEdges(edgeIds: EdgeId[]) {
    for (const edge of this.store.getEdges()) {
      const selected = edgeIds.includes(edge.id);
      if (Boolean(edge.selected) !== selected) {
        this.store.updateEdge(edge.id, () => ({ selected }));
      }
    }
  }

  addNodeInputHandle(nodeId: NodeId, key: string, handle: Handle) {
    return this.store.updateNodeData(nodeId, (nodeData) => ({
      handles: {
        ...nodeData.handles,
        input: { ...nodeData.handles.input, [key]: handle },
      },
    }));
  }

  updateNodeData<T extends BaseNodeData>(nodeId: NodeId, newData: Partial<T>): UndoRedoEntry {
    // schedule update for downstream nodes
    if ('output' in newData) {
      this.updateQueue.push(nodeId);
    }

    return this.store.updateNodeData(nodeId, () => ({ ...newData }));
  }

  updateModelNodeData<T extends ModelBaseNodeData>(nodeId: NodeId, newData: Partial<T>): UndoRedoEntry {
    // schedule update for downstream nodes
    if ('output' in newData) {
      this.updateQueue.push(nodeId);
    }

    return this.store.updateNodeData(nodeId, () => ({ ...newData }));
  }

  isNodeInGroup(nodeId: NodeId): boolean {
    const node = this.store.getNodeNullable(nodeId);
    if (!node) return false;
    return !!node.parentId;
  }

  getChildNodesOfGroup(groupId: string): Node[] {
    return this.store.getNodes().filter((node) => node.parentId === groupId);
  }

  // Deprecated
  private getNodeOutput(nodeId: NodeId, outputKey: string) {
    const sourceNode = this.store.getNodeNullable(nodeId);
    if (!sourceNode) return undefined;
    return sourceNode.data.output
      ? typeof sourceNode.data.output === 'object' && outputKey in sourceNode.data.output
        ? sourceNode.data.output[outputKey]
        : sourceNode.data.output
      : undefined;
  }

  private getNodeOutputValue(nodeId: NodeId, outputKey: OutputId): Omit<Input, 'nodeId' | 'outputId'> {
    const value: unknown = this.getNodeOutput(nodeId, outputKey);
    return {
      file: validateFile(value),
      string: validateString(value),
      stringArray: validateStringArray(value),
    };
  }

  // Can be removed when all nodes have been moved to the new architecture
  private async updateNodeInputs(nodeIds: NodeId[]) {
    for (const nodeId of uniq(nodeIds)) {
      const node = this.store.getNodeNullable(nodeId);
      if (!node) continue; // node might have been removed since this is function is async

      if (this.isSupportedNode(nodeId)) {
        const inputIds = this.wasm.call((wasm) => wasm.inputIds(nodeId)) ?? [];
        for (const inputId of inputIds) {
          const input: Input | undefined = this.wasm.call((wasm) => wasm.nodeInput(nodeId, inputId));
          if (input) {
            const inputValue = input ? this.getNodeOutputValue(input.nodeId, input.outputId) : undefined;
            this.wasm.edit((wasm) => {
              return wasm.updateNodeInput(
                nodeId,
                inputId,
                inputValue?.file,
                inputValue?.string,
                inputValue?.stringArray,
              );
            });
          }
        }
        await this.updateNodeOutputs(nodeId);
      } else {
        const inputEdges = this.getState().edges.filter((edge) => edge.target === nodeId);
        const input = Object.fromEntries(
          inputEdges.map((edge) => {
            const outputKey = this.outputKey(edge);
            const inputValue = this.getNodeOutput(edge.source, outputKey) ?? null;

            return [this.inputKey(edge), inputValue];
          }),
        );
        this.store.updateNodeData(nodeId, () => ({ input }));
      }
    }
  }

  async loadResources() {
    return this.wasmAPI.call((wasm) => {
      return loadResources(wasm);
    });
  }

  private redraw() {
    this.wasmAPI.call((wasm) => {
      wasm.redraw();
    });
  }

  // Can be removed when all nodes have been moved to the new architecture
  async updateNodeOutputs(nodeId: NodeId, ongoing: boolean = false) {
    await this.loadResources();
    if (!this.store.getNodeNullable(nodeId)) return;

    if (ongoing) {
      // Don't propagate the result if ongoing
      return;
    }

    // This function should only be called for supported node types
    if (!this.isSupportedNode(nodeId)) return;
    const node = this.store.getNode(nodeId);
    // Save the result to the node data (can be removed when no node depends on this)
    const type = this.getNodeType(nodeId);
    switch (type) {
      case 'blur':
      case 'merge_alpha':
      case 'channels':
      case 'invert':
      case 'compv3':
      case 'levels':
      case 'dilation_erosion':
      case 'resize':
      case 'crop':
      case 'extract_video_frame': {
        let outputId;
        switch (type) {
          case 'blur': {
            outputId = 'result';
            break;
          }
          case 'merge_alpha': {
            outputId = 'image_with_alpha';
            break;
          }
          case 'channels': {
            outputId = 'matte';
            break;
          }
          case 'invert': {
            outputId = 'result';
            break;
          }
          case 'compv3': {
            outputId = 'image';
            break;
          }
          case 'levels': {
            outputId = 'result';
            break;
          }
          case 'dilation_erosion': {
            outputId = 'result';
            break;
          }
          case 'resize': {
            outputId = 'result';
            break;
          }
          case 'crop': {
            outputId =
              Array.isArray(node.data.handles.output) && node.data.handles.output.includes('result')
                ? 'result'
                : 'file';
            break;
          }
          case 'extract_video_frame': {
            outputId = 'result';
            break;
          }
          default: {
            const _exhaustiveCheck: never = type;
          }
        }
        const img = this.wasmAPI.call((wasm) => {
          return wasm.exportNodeRender(nodeId);
        });
        const result = img
          ? { type: 'image' as const, url: img.data, width: img.width, height: img.height }
          : undefined;
        this.store.updateNodeData(nodeId, (_) => {
          return {
            result,
            output: {
              [outputId]: result,
            },
          };
        });
        break;
      }
      case 'painterV2': {
        const img = this.wasmAPI.call((wasm) => {
          return wasm.exportNodeRender(nodeId);
        });
        const result = img
          ? { type: 'image' as const, url: img.data, width: img.width, height: img.height }
          : undefined;

        const maskImg = this.wasmAPI.call((wasm) => {
          return wasm.exportNodeRender(nodeId, 'mask');
        });
        const mask = maskImg
          ? { type: 'image' as const, url: maskImg.data, width: maskImg.width, height: maskImg.height }
          : undefined;
        this.store.updateNodeData(nodeId, (_) => {
          return {
            output: {
              result,
              mask,
            },
          };
        });
        break;
      }
      case 'string': {
        const string = this.store.getNodeData<TextData>(nodeId).value;
        this.store.updateNodeData(nodeId, (_) => {
          return {
            result: {
              string,
            },
            output: {
              type: 'text',
              text: string,
              string, // hotfix - some old nodes has a string output handle
            },
          };
        });
        break;
      }
      case 'promptV3': {
        const prompt = this.store.getNodeData<PromptData>(nodeId).prompt;
        this.store.updateNodeData<PromptData>(nodeId, (_) => {
          return {
            result: { prompt },
            output: { type: 'text', prompt },
          };
        });
        break;
      }
      case 'integer': {
        const number = this.store.getNodeData<NumberData>(nodeId);
        this.store.updateNodeData(nodeId, (_) => {
          return {
            result: number.value,
            output: {
              type: number.mode,
              number: number.value,
            },
          };
        });
        break;
      }
      case 'muxv2': {
        const { selected } = this.store.getNodeData<ListSelectorData>(nodeId);
        const parameterValue = this.wasmAPI.call((wasm) => {
          return wasm.evaluateParameter(nodeId, 'options');
        });
        const options = parameterValue?.type === 'string_array' ? parameterValue.value : [];
        this.store.updateNodeData<ListSelectorData>(nodeId, (_) => {
          return {
            result: selected,
            output: {
              type: 'text',
              option: options[selected],
            },
            params: { options: options },
          };
        });
        break;
      }
      case 'number_selector': {
        const { selected, params, inputNode } = this.store.getNodeData<NumberSelectorData>(nodeId);
        const options = inputNode?.stringArray?.map((s) => parseFloat(s)).filter((n) => !isNaN(n)) ?? params.options;
        this.store.updateNodeData<NumberSelectorData>(nodeId, (_) => {
          return {
            result: selected,
            output: {
              type: 'number',
              option: selected !== undefined ? options[selected] : undefined,
            },
          };
        });
        break;
      }
      case 'array': {
        this.store.updateNodeData<StringArrayData>(nodeId, ({ inputNode, array, delimiter }) => {
          const newArray = inputNode?.string ? inputNode.string.split(delimiter) : array;
          return {
            result: newArray,
            output: { type: 'array', array: newArray },
          };
        });
        break;
      }
      case 'boolean': {
        const boolean = this.store.getNodeData<ToggleData>(nodeId);
        this.store.updateNodeData(nodeId, (_) => {
          return {
            result: boolean.value,
            output: {
              type: 'boolean',
              option: boolean.value,
            },
          };
        });
        break;
      }
      case 'media_iterator': {
        const { selectedIndex } = this.store.getNodeData<MediaIteratorData>(nodeId);
        const files = this.wasmAPI.call((wasm) => {
          return wasm.evaluateParameter(nodeId, 'files');
        });

        const file = files?.value?.[selectedIndex];
        this.store.updateNodeData<MediaIteratorData>(nodeId, (_) => {
          return {
            result: file,
            output: {
              ['file']: file,
            },
          };
        });
        break;
      }
      case 'import': {
        const { files, selectedIndex } = this.store.getNodeData<ImportData>(nodeId);
        const file = files[selectedIndex];
        let image: { type: 'image'; url: string; width: number; height: number } | undefined = undefined;
        if (file?.type === '3D') {
          const img = this.wasmAPI.call((wasm) => {
            return wasm.exportNodeRender(nodeId);
          });
          image = img ? { type: 'image' as const, url: img.data, width: img.width, height: img.height } : undefined;
        }
        this.store.updateNodeData<ImportData>(nodeId, (_) => {
          return {
            result: file,
            output: {
              ['file']: file,
              ['image']: image,
            },
          };
        });
        break;
      }
      case 'seed': {
        const seedData = this.store.getNodeData<SeedData>(nodeId);
        this.store.updateNodeData(nodeId, (_) => {
          const result = {
            isRandom: seedData.isRandom,
            seed: seedData.seed,
          };
          return {
            result,
            ...result,
            output: {
              type: 'seed',
              seed: {
                ...result,
              },
            },
          };
        });
        break;
      }
      case 'router': {
        const { inputNode } = this.store.getNodeData<RouterData>(nodeId);
        const inputValue = inputNode ? this.getNodeOutputValue(inputNode.nodeId, inputNode.outputId) : undefined;
        const result = inputValue?.file ?? inputValue?.string ?? inputValue?.stringArray;
        this.store.updateNodeData<RouterData>(nodeId, (_) => {
          return {
            result,
            output: {
              out: result,
            },
          };
        });
        break;
      }
      case 'export':
      case 'preview': {
        return;
      }
      case 'prompt_concat': {
        const additionalPrompt = this.store.getNodeData<PromptConcatenatorData>(nodeId).additionalPrompt;
        const inputNodes = this.store.getNodeData<PromptConcatenatorData>(nodeId).inputNodes;
        this.store.updateNodeData<PromptConcatenatorData>(nodeId, (_) => {
          return {
            result: { additionalPrompt },
            output: {
              type: 'text',
              prompt:
                inputNodes
                  .map(([_, input]) => input?.string)
                  .filter((s) => s !== undefined)
                  .join(' ') + (additionalPrompt ? ' ' + additionalPrompt : ''),
            },
          };
        });
        break;
      }
      case 'custommodelV2': {
        const { generations, selectedIndex } = this.store.getNodeData<AiModelData>(nodeId);
        const result = generations.map(ModelAssetToUploadedAsset);
        this.store.updateNodeData<AiModelData>(nodeId, (_) => {
          return {
            result,
            output: result[selectedIndex],
            selectedOutput: selectedIndex,
          };
        });
        break;
      }
      default: {
        const _exhaustiveCheck: never = type;
      }
    }

    // Propagate the result to downstream nodes
    this.propagateOutput(nodeId);
  }

  private propagateOutput(nodeId: NodeId) {
    const dependentNodeIds = this.store
      .getEdges()
      .filter((edge) => edge.source === nodeId)
      .map((edge) => edge.target);
    void this.updateNodeInputs(dependentNodeIds);
  }

  pasteNodesAndEdges(
    clipboardNodes: Node[],
    clipboardEdges: Edge[],
    centerPosition: { x: number; y: number },
  ): { undoEntry: UndoRedoEntry; newNodeIds: NodeId[] } {
    // Find the top-leftmost node to use as a reference for positioning
    const referenceNode = clipboardNodes.reduce((ref, node) => {
      return node.position.x < ref.position.x || node.position.y < ref.position.y ? node : ref;
    }, clipboardNodes[0]);

    const idMapping: Record<string, string> = {};

    const newNodes: Node[] = cloneDeep(clipboardNodes).map((node) => {
      // Calculate the relative position to the reference node
      const relativeX = node.position.x - referenceNode.position.x;
      const relativeY = node.position.y - referenceNode.position.y;

      // Apply this relative position to the center position
      const newPosition = {
        x: centerPosition.x + relativeX,
        y: centerPosition.y + relativeY,
      };

      const newNodeId: string = uuidv4();
      idMapping[node.id] = newNodeId; // flowGraph mapping of old ID to new ID

      return { ...node, id: newNodeId, position: newPosition, createdAt: new Date().toISOString() };
    });

    // Create new edges with updated source and target IDs based on copied edges
    const newEdges: Edge[] = cloneDeep(clipboardEdges).reduce((acc: Edge[], edge) => {
      const newSource = idMapping[edge.source];
      const newTarget = idMapping[edge.target];

      if (newSource && newTarget) {
        // Both source and target are in the selection
        acc.push({
          ...edge,
          id: uuidv4(), // Generate a new ID for the edge
          source: newSource,
          target: newTarget,
          // Handle IDs are based on node IDs, adjust them to the new IDs
          sourceHandle: edge.sourceHandle?.replace(edge.source, newSource),
          targetHandle: edge.targetHandle?.replace(edge.target, newTarget),
        });
      }
      // Else, you could handle edges connected to nodes outside the selection differently

      return acc;
    }, []);

    const undoEntry = UndoRedoEntry.empty();
    // Add new nodes
    undoEntry.add(this.addNodes(newNodes));
    const newNodeIds = newNodes.map((n) => n.id);

    // Remove all connections from new nodes
    for (const nodeId of newNodeIds) {
      if (this.isSupportedNode(nodeId)) {
        for (const inputId of this.wasm.call((wasm) => wasm.inputIds(nodeId)) ?? []) {
          undoEntry.add(
            this.wasmChange((wasm) => {
              const { edit } = wasm.setNodeInput(nodeId, inputId, null);
              return edit;
            }),
          );
        }
      }
    }
    // Add new edges
    undoEntry.add(this.addEdges(newEdges));

    // Update legacy node inputs
    void this.updateNodeInputs(newNodeIds);

    return { undoEntry, newNodeIds };
  }

  createEdge(source: NodeId, target: NodeId, sourceHandle: string, targetHandle: string): Edge {
    const sourceNode = this.store.getNode(source);
    const targetNode = this.store.getNode(target);
    return {
      id: uuidv4(),
      source,
      target,
      sourceHandle,
      targetHandle,
      type: 'custom',
      data: {
        sourceColor: sourceNode?.data?.color,
        targetColor: targetNode?.data?.color,
        sourceHandleType: getHandleType(sourceHandle, sourceNode),
        targetHandleType: getHandleType(targetHandle, targetNode),
      },
    };
  }

  private inputKey(edge: Edge): string {
    const inputKey = edge.targetHandle?.split('-input-')?.[1];
    if (!inputKey) throw new Error('Expected input key');
    return inputKey;
  }

  private outputKey(edge: Edge): string {
    const outputKey = edge.sourceHandle?.split('-output-')?.[1];
    if (!outputKey) throw new Error('Expected output key');
    return outputKey;
  }

  // Migration
  private toWasmNode(node: Node): WasmNode | null {
    const nodeId = node.id;
    if (!this.isSupportedNode(nodeId)) {
      return null;
    }

    const type = this.getNodeType(nodeId);
    const input: Map<InputId, Input | undefined> = new Map();
    const handles = node.data.handles.input || [];
    for (const inputId of Array.isArray(handles) ? handles : Object.keys(handles)) {
      const edge = this.store.getEdges().find((e) => e.target === nodeId && this.inputKey(e) === inputId);
      if (edge) {
        input.set(inputId, {
          nodeId: edge.source,
          outputId: this.outputKey(edge),
          file: undefined,
          string: undefined,
          stringArray: undefined,
        });
      } else {
        input.set(inputId, undefined);
      }
    }

    let data;
    switch (type) {
      case 'compv3': {
        const compositorData = this.store.getNodeData<CompositorNodeV3>(nodeId).data;
        data = {
          ...compositorData,
          layers: new Map(
            Object.entries(compositorData.layers).map(([key, layer]) => {
              if (layer.kind.inputId === undefined) {
                layer.kind.inputId = (layer.kind as unknown as { input_id: string }).input_id;
              }
              if (typeof layer.kind.inputId === 'number') {
                if (Array.isArray(handles)) {
                  throw new Error('Expected object handles');
                }
                const inputId = Object.entries(handles).find(
                  (v) => String(v[1].order) === String(layer.kind.inputId),
                )?.[0];
                if (!inputId) {
                  throw new Error('Expected valid input handle string key when migrating compositor node');
                }
                layer.kind.inputId = inputId;
              }
              return [Number(key), layer];
            }),
          ),
          input: Array.from(input.entries()),
        };
        break;
      }
      case 'channels': {
        const c = (node.data as { channel?: number | Channel }).channel;
        let channel: Channel;
        if (c === undefined || c === 1) {
          channel = 'red';
        } else if (c === 2) {
          channel = 'green';
        } else if (c === 3) {
          channel = 'blue';
        } else {
          channel = c as Channel;
        }
        data = { channel, inputNode: input.get('map') };
        break;
      }
      case 'blur': {
        let blurData = (node.data as any).options;
        if (blurData === undefined) {
          blurData = (node.data as any).blurData ?? { size: 3, type: 'Box' };
          if (blurData.type === 1) blurData.type = 'Box';
          if (blurData.type === 2) blurData.type = 'Gaussian';
          blurData.size = Number(blurData.size);
          blurData = blurData as BlurOptions;
        }
        data = { options: blurData, inputNode: input.get('file') };
        break;
      }
      case 'invert': {
        data = { inputNode: input.get('file') };
        break;
      }
      case 'merge_alpha': {
        data = { inputNode: input.get('image'), alphaInput: input.get('alpha_image') };
        break;
      }
      case 'levels': {
        const levelsOptions = (node.data as any).options;
        data = { options: levelsOptions, inputNode: input.get('file') };
        break;
      }
      case 'dilation_erosion': {
        data = node.data;
        break;
      }
      case 'resize': {
        const resize_properties = (node.data as any).resize_properties;
        data = {
          inputNode: input.get('image'),
          options:
            'options' in node.data
              ? node.data.options
              : resize_properties?.resize
                ? {
                    lockAspectRatio: resize_properties?.lockAspectRatio ?? true,
                    width: resize_properties.resize.width ?? 1024,
                    height: resize_properties.resize.height ?? 1024,
                  }
                : undefined,
        };

        if (data.options) {
          const MAX_DIMENSION = 8192;
          const { width, height } = data.options;
          const aspectRatio = width / height;
          if (width > height && width > MAX_DIMENSION) {
            data.options.width = MAX_DIMENSION;
            data.options.height = Math.round(MAX_DIMENSION / aspectRatio);
          } else if (height >= width && height > MAX_DIMENSION) {
            data.options.width = Math.round(MAX_DIMENSION * aspectRatio);
            data.options.height = MAX_DIMENSION;
          }
        }

        break;
      }
      case 'crop': {
        const { crop_data, lockAspectRatio } = node.data as any;
        const scaleFactor = crop_data?.scaleFactor ?? 1;
        const options = crop_data
          ? {
              x: Math.ceil((crop_data.x ?? 0) * scaleFactor),
              y: Math.ceil((crop_data.y ?? 0) * scaleFactor),
              width: Math.ceil((crop_data.width ?? 1) * scaleFactor),
              height: Math.ceil((crop_data.height ?? 1) * scaleFactor),
              lockAspectRatio: lockAspectRatio ?? true,
            }
          : undefined;

        data = {
          inputNode: input.get('file') ?? input.get('image'),
          options: 'options' in node.data ? node.data.options : options,
        };
        break;
      }
      case 'extract_video_frame': {
        data = node.data as ExtractVideoFrameData;
        if (data.time === undefined || data.time === null) {
          if (data.options?.time !== undefined && data.options.time !== null) {
            data.time = data.options.time;
          } else {
            const fps = Math.max(1, Math.round(data.input?.file?.fps ?? 30));
            const frame = Math.max(0, Math.round(data.frameNumber ?? 0));
            data.time = (frame + 0.5) / fps;
          }
        }
        data.inputNode = input.get('file');
        break;
      }
      case 'string': {
        data = node.data as TextData;
        if (data.value === undefined) {
          data = { value: data.result?.string ?? data.output?.['text'] ?? '', ...data };
        }
        break;
      }
      case 'promptV3': {
        data = node.data as PromptData;
        if (data.prompt === undefined) {
          data = { prompt: data.result?.prompt ?? data.output?.['prompt'] ?? '', ...data };
        }
        break;
      }
      case 'muxv2': {
        data = node.data as ListSelectorData;
        const isIterator = data.isIterator ?? false;
        const options = data.params?.options ?? [];
        let exposed = data.schema?.options?.exposed ?? false;
        if (data.parameter === undefined && data.schema?.options !== undefined) {
          // For old text iterator data, the exposed flag is not reliable
          if (this.store.getEdges().some((edge) => edge.target === nodeId)) {
            exposed = true;
          } else if (options.length > 0) {
            exposed = false;
          }
          data.schema.options.exposed = exposed;
        }
        if (!exposed) {
          data.handles.input = {};
        } else {
          data.handles.input = {
            options: {
              id: 'd83d338b-f6c1-4ff2-a160-e81d918995fc',
              type: HandleType.Array,
              label: 'Options',
              format: 'array',
              required: false,
              order: 0,
              description: 'Array of options to choose from',
            },
          };
        }
        data = {
          selected: isIterator ? 0 : (data.result ?? 0),
          isIterator,
          options: exposed
            ? { type: 'input', data: input.get('options') }
            : {
                type: 'value',
                data: { type: 'string_array', value: options.map((opt) => (opt != undefined ? opt.toString() : '')) },
              },
        };
        break;
      }
      case 'number_selector': {
        data = node.data as NumberSelectorData;
        data = {
          selected: data.result ?? 0,
          params: data.params && data.params.options ? { options: data.params.options } : { options: [] },
          inputNode: input.get('options'),
        };
        break;
      }
      case 'integer': {
        data = node.data as NumberData;
        data = {
          value: data.value ?? data.result ?? data.output?.number ?? 0,
          mode: data.mode ?? 'integer',
          min: typeof data.min === 'number' ? data.min : undefined,
          max: typeof data.max === 'number' ? data.max : undefined,
        };
        break;
      }
      case 'array': {
        data = node.data as StringArrayData;
        if (data.inputNode === undefined) {
          data = {
            array: Array.isArray(data?.array) ? data.array : Array.isArray(data?.result) ? data.result : [],
            delimiter: typeof data?.delimiter === 'string' ? data.delimiter : ',',
            inputNode: input.get('text'),
          };
        }

        break;
      }
      case 'preview': {
        data = node.data as PreviewData;
        if (data.inputNode === undefined) {
          data.inputNode = input.get('file');
        }
        break;
      }
      case 'media_iterator': {
        data = node.data as MediaIteratorData;
        break;
      }
      case 'import': {
        data = node.data as ImportData;
        if (data.files === undefined) {
          const validFile = validateFile(data.result) ?? validateFile(data.output?.file) ?? validateFile(data.value);
          data.files = validFile ? [validFile] : [];
        }
        if (data.cameraOptions === undefined && data.cameraPosition !== undefined) {
          // convert data from old import nodes
          data.cameraOptions = {
            position: data.cameraPosition,
            target: { x: 0, y: 1.5, z: 0 },
            locked: data.is3DLocked ?? false,
          };
        } else {
          // add default locked value if not present for new import nodes
          if (data.cameraOptions !== undefined) {
            data.cameraOptions = {
              locked: false,
              ...data.cameraOptions,
            };
          }
        }

        if (data.selectedIndex === undefined) {
          data.selectedIndex = data.files.length > 0 ? data.files.length - 1 : 0;
        }
        break;
      }
      case 'export': {
        data = node.data as ExportData;
        if (data.inputNode === undefined) {
          data.inputNode = input.get('file');
        }
        break;
      }
      case 'boolean': {
        data = node.data as ToggleData;
        if (data.value === undefined) {
          data.value = data.result ?? data.output?.option ?? false;
        }
        break;
      }
      case 'seed': {
        data = node.data as SeedData;
        if (data.seed === undefined || typeof data.seed === 'string' || data.isRandom === undefined) {
          const seed = parseInt(data.seed ?? data.result?.seed ?? data.output?.seed?.seed, 10);
          data.seed = Number.isFinite(seed) ? seed : 1;
          data.isRandom = data.isRandom ?? data.result?.isRandom ?? data.output?.seed?.isRandom ?? false;
        }
        break;
      }
      case 'router': {
        data = { inputNode: input.get('in') };
        break;
      }
      case 'prompt_concat': {
        data = node.data as PromptConcatenatorData;
        if (data.additionalPrompt === undefined) {
          data = {
            inputNodes: Array.from(input.entries()),
            additionalPrompt: data.result?.additionalPrompt ?? '',
            ...data,
          };
        }
        break;
      }
      case 'painterV2': {
        const DEFAULT_WIDTH = 426;
        const DEFAULT_HEIGHT = 426;

        data = node.data;
        const result = data.result as
          | {
              selectedSize: { width: number; height: number };
              scaleFactor: number;
              lockAspectRatio?: boolean;
              color: string;
              brushSize: number;
              backgroundColor: string;
              lines: { tool: 'brush' | 'eraser'; brushSize: number; color: string; points: number[] }[];
            }
          | undefined;

        if (data.inputNode === undefined) {
          data.inputNode = input.get('image');
        }

        function hexToRgba(hex: string): { r: number; g: number; b: number; a: number } {
          let r = 0,
            g = 0,
            b = 0,
            a = 1;
          // 6 digits
          if (hex.length === 7) {
            r = parseInt(hex[1] + hex[2], 16);
            g = parseInt(hex[3] + hex[4], 16);
            b = parseInt(hex[5] + hex[6], 16);
          }
          // 8 digits
          else if (hex.length === 9) {
            r = parseInt(hex[1] + hex[2], 16);
            g = parseInt(hex[3] + hex[4], 16);
            b = parseInt(hex[5] + hex[6], 16);
            a = parseInt(hex[7] + hex[8], 16) / 255;
          }
          return { r, g, b, a };
        }

        if (data.options === undefined && result !== undefined) {
          data.options = {
            width:
              result.selectedSize?.width && result.scaleFactor
                ? Math.round(result.selectedSize.width / result.scaleFactor)
                : DEFAULT_WIDTH,
            height:
              result.selectedSize?.height && result.scaleFactor
                ? Math.round(result.selectedSize.height / result.scaleFactor)
                : DEFAULT_HEIGHT,
            lockAspectRatio: result.lockAspectRatio ?? true,
            brushColor: result.color ? hexToRgba(result.color) : { r: 255, g: 255, b: 255, a: 1 },
            brushSize: result.brushSize ? result.brushSize : 50,
            backgroundColor: result.backgroundColor ? hexToRgba(result.backgroundColor) : { r: 0, g: 0, b: 0, a: 1 },
            lines: (result.lines ?? []).map((l) => {
              const points: Vec2[] = [];
              for (let i = 0; i < l.points.length; i += 2) {
                if (i + 1 >= l.points.length) break;
                points.push({ x: l.points[i], y: l.points[i + 1] });
              }
              return { ...l, color: hexToRgba(l.color), points };
            }),
          };
        }
        break;
      }
      case 'custommodelV2': {
        data = node.data as AiModelData;
        const modelData = node.data as ModelBaseNodeData;
        const migrateParameter = (key: string, defaultValue: ParameterValue): Parameter => {
          const property = modelData.schema[key];
          if (property.exposed) {
            return {
              type: 'input',
              data: input.get(key),
            };
          }
          return {
            type: 'value',
            data: validateParameterValue(modelData.params[key], property.default, property) ?? defaultValue,
          };
        };
        switch (modelData?.model?.name) {
          case 'Dalle3': {
            data.kind = {
              type: 'dalle3',
              text: input.get('text'),
            };
            break;
          }
          case 'minimax/image-01': {
            data.kind = {
              type: 'minimax_image01',
              prompt: input.get('prompt'),
              numberOfImages: migrateParameter('number_of_images', { type: 'integer', value: 1 }),
              aspectRatio: migrateParameter('aspect_ratio', { type: 'string', value: '1:1' }),
              promptOptimizer: migrateParameter('prompt_optimizer', { type: 'boolean', value: true }),
            };
            break;
          }
          case 'reve': {
            data.kind = {
              type: 'reve',
              prompt: input.get('prompt'),
              referenceImages: Array.from(input.entries()).filter(([key]) => key.startsWith('reference_image_')),
              aspectRatio: migrateParameter('aspect_ratio', { type: 'string', value: '1:1' }),
            };
            break;
          }
          case 'google/imagen-3': {
            data.kind = {
              type: 'imagen3',
              prompt: input.get('prompt'),
              negativePrompt: input.get('negative_prompt'),
              aspectRatio: migrateParameter('aspect_ratio', { type: 'string', value: '1:1' }),
              safetyFilterLevel: migrateParameter('safety_filter_level', { type: 'string', value: 'block_only_high' }),
            };
            break;
          }
          case 'wan-video/wan-2.1-1.3b': {
            data.kind = {
              type: 'wan_video',
              prompt: input.get('prompt'),
              aspectRatio: migrateParameter('aspect_ratio', { type: 'string', value: '16:9' }),
              frameNum: migrateParameter('frame_num', { type: 'integer', value: 81 }),
              resolution: migrateParameter('resolution', { type: 'string', value: '480p' }),
              sampleSteps: migrateParameter('sample_steps', { type: 'integer', value: 30 }),
              sampleGuideScale: migrateParameter('sample_guide_scale', { type: 'float', value: 6 }),
              sampleShift: migrateParameter('sample_shift', { type: 'float', value: 8 }),
              seed: migrateParameter('seed', { type: 'seed', value: { seed: 335386, isRandom: true } }),
            };
            break;
          }
          case 'br_bgreplace': {
            data.kind = {
              type: 'br_bgreplace',
              image: input.get('image'),
              referenceImage: input.get('reference_image'),
              backgroundPrompt: input.get('background_prompt'),
              fast: migrateParameter('fast', { type: 'boolean', value: true }),
              seed: migrateParameter('seed', { type: 'seed', value: { isRandom: true, seed: 42 } }),
              refinePrompt: migrateParameter('refine_prompt', { type: 'boolean', value: true }),
              originalQuality: migrateParameter('original_quality', { type: 'boolean', value: true }),
            };
            break;
          }
          case 'sd_sketch': {
            data.kind = {
              type: 'sd_sketch',
              image: input.get('image'),
              prompt: input.get('prompt'),
              controlType: migrateParameter('control_type', { type: 'string', value: 'Sketch' }),
              controlStrength: migrateParameter('control_strength', { type: 'float', value: 0.7 }),
            };
            break;
          }
          case 'luma/photon': {
            data.kind = {
              type: 'luma_photon',
              prompt: input.get('prompt'),
              imageReferenceUrl: input.get('image_reference_url'),
              styleReferenceUrl: input.get('style_reference_url'),
              characterReferenceUrl: input.get('character_reference_url'),
              aspectRatio: migrateParameter('aspect_ratio', { type: 'string', value: '16:9' }),
              imageReferenceWeight: migrateParameter('image_reference_weight', { type: 'float', value: 0.85 }),
              styleReferenceWeight: migrateParameter('style_reference_weight', { type: 'float', value: 0.85 }),
              seed: migrateParameter('seed', { type: 'seed', value: { seed: 335386, isRandom: true } }),
            };
            break;
          }
          case 'minimax/video-01-director': {
            data.kind = {
              type: 'minimax_video_director',
              prompt: input.get('prompt'),
              firstFrameImage: input.get('first_frame_image'),
              promptOptimizer: migrateParameter('prompt_optimizer', { type: 'boolean', value: true }),
            };
            break;
          }
          case 'meshy_image23d': {
            data.kind = {
              type: 'meshy',
              image: input.get('image'),
              surfaceMode: migrateParameter('surface_mode', { type: 'string', value: 'organic' }),
            };
            if (node.data.handles.output && !('image' in node.data.handles.output)) {
              node.data.handles.output['image'] = {
                description: 'Render of the 3d Model',
                label: 'Render',
                order: 1,
                type: 'image',
              };
            }
            break;
          }
          case 'tencent/hunyuan3d-2mv': {
            data.kind = {
              type: 'hunyuan3_d',
              frontImage: input.get('front_image'),
              backImage: input.get('back_image'),
              leftImage: input.get('left_image'),
              rightImage: input.get('right_image'),
              steps: migrateParameter('steps', { type: 'integer', value: 30 }),
              guidanceScale: migrateParameter('guidance_scale', { type: 'float', value: 5.0 }),
              seed: migrateParameter('seed', { type: 'seed', value: { seed: 1234, isRandom: true } }),
              randomizeSeed: migrateParameter('randomize_seed', { type: 'boolean', value: true }),
              octreeResolution: migrateParameter('octree_resolution', { type: 'integer', value: 256 }),
              removeBackground: migrateParameter('remove_background', { type: 'boolean', value: true }),
              numChunks: migrateParameter('num_chunks', { type: 'integer', value: 200000 }),
              targetFaceNum: migrateParameter('target_face_num', { type: 'integer', value: 10000 }),
            };
            break;
          }
          default: {
            return null;
          }
        }

        if (
          data.generations === undefined ||
          data.generations.length !== (node.data.result as UploadedAsset[])?.length
        ) {
          data.generations = ((node.data.result as UploadedAsset[]) ?? []).map(UploadedAssetToModelAsset);
        }
        const filter = (i: number | undefined) => (i !== undefined && i >= 0 ? i : undefined);
        if (filter(data.selectedIndex) === undefined) {
          const selected =
            filter(data.selectedOutput) ?? data.generations.findIndex((f) => f.kind?.url === data.output?.file?.url);
          data.selectedIndex = filter(selected) ?? 0;
        }
        const selectedGeneration = data.generations[data.selectedIndex];
        data.params = mergeSeedParam(
          data.params,
          selectedGeneration ? ModelAssetToUploadedAsset(selectedGeneration) : undefined,
        );

        if (data.cameraOptions === undefined && data.cameraPosition !== undefined) {
          data.cameraOptions = {
            position: data.cameraPosition,
            target: { x: 0, y: 1.5, z: 0 },
            locked: data.is3DLocked ?? false,
          };
        } else {
          if (data.cameraOptions !== undefined) {
            data.cameraOptions = {
              locked: false,
              ...data.cameraOptions,
            };
          }
        }
        break;
      }
      default: {
        const _exhaustiveCheck: never = type;
      }
    }
    return {
      kind: {
        type,
        data,
      } as NodeKind,
      locked: node.locked ?? node.data.isLocked ?? false,
    };
  }

  getNodeType(nodeId: NodeId): NodeType {
    const node = this.store.getNode(nodeId);
    const type = node.type as NodeType;
    if (!type) {
      throw new Error(`Node ${nodeId} has no valid type: ${node.type}`);
    }
    return type;
  }

  getModelNodeType(nodeId: NodeId): ModelNodeType {
    return this.store.getNodeData<AiModelData>(nodeId).kind.type;
  }
}

class EventHandler {
  constructor(
    private graph: FlowGraph,
    private canvas: HTMLCanvasElement,
  ) {
    document.body.addEventListener('pointermove', this.onPointerMove);
    document.body.addEventListener('pointerup', this.onPointerUp);
    document.body.addEventListener('pointerleave', this.onPointerLeave);
    document.body.addEventListener('pointerenter', this.onPointerEnter);
    document.body.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('wheel', this.onWheel);
  }

  onPointerMove = (e: PointerEvent) => {
    this.graph.wasm.call((wasm) => {
      wasm.onPointerMove(e);
    });
  };

  onPointerDown = (e: PointerEvent) => {
    this.graph.wasm.call((wasm) => {
      wasm.onPointerDown(e);
    });
  };

  onPointerUp = (e: PointerEvent) => {
    this.graph.wasm.call((wasm) => {
      wasm.onPointerUp(e);
    });
  };

  onPointerLeave = (e: PointerEvent) => {
    this.graph.wasm.call((wasm) => {
      wasm.onPointerLeave(e);
    });
  };

  onPointerEnter = (e: PointerEvent) => {
    this.graph.wasm.call((wasm) => {
      wasm.onPointerEnter(e);
    });
  };

  onWheel = (e: WheelEvent) => {
    this.graph.wasm.call((wasm) => {
      wasm.onWheel(e);
    });
  };

  dispose() {
    document.body.removeEventListener('pointermove', this.onPointerMove);
    document.body.removeEventListener('pointerup', this.onPointerUp);
    document.body.removeEventListener('pointerleave', this.onPointerLeave);
    document.body.removeEventListener('pointerenter', this.onPointerEnter);
    document.body.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('wheel', this.onWheel);
  }
}

export const dataTypeToHandleType = (dataType: DataType | HandleType): HandleType => {
  switch (dataType) {
    case HandleType.Text:
    case 'text':
      return HandleType.Text;
    case HandleType.Number:
    case 'number':
      return HandleType.Number;
    case HandleType.Boolean:
    case 'boolean':
      return HandleType.Boolean;
    case HandleType.Array:
    case 'array':
      return HandleType.Array;
    case HandleType.Image:
    case 'image':
      return HandleType.Image;
    case HandleType.Video:
    case 'video':
      return HandleType.Video;
    case HandleType.Audio:
    case 'audio':
      return HandleType.Audio;
    case HandleType.ThreeDee:
    case '3D':
      return HandleType.ThreeDee;
    case HandleType.Seed:
    case 'seed':
      return HandleType.Seed;
    case HandleType.Any:
      return HandleType.Any;
    case HandleType.Lora:
    case 'lora':
      return HandleType.Lora;
    case HandleType.Mask:
    case 'mask':
      return HandleType.Mask;
    default: {
      const _unreachable: never = dataType;
      throw new Error(`Invalid data type: ${String(_unreachable as unknown)}`);
    }
  }
};
