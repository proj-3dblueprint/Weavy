import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { useWorkflowStore } from '@/state/workflow.state';
import { sortNodesForRendering } from '../Nodes/utils/nodeUtils';
import { FlowGraph } from './FlowGraph';
import { CompositorView } from './Views/CompositorView';
import { BlurView } from './Views/BlurView';
import { DilationErosionView } from './Views/DilationErosionView';
import { ChannelsView } from './Views/ChannelsView';
import { FlowView } from './Views/FlowView';
import { ModelBaseView } from './Views/ModelBaseView';
import { LevelsView } from './Views/LevelsView';
import { TextView } from './Views/TextView';
import { PromptView } from './Views/PromptView';
import { NumberView } from './Views/NumberView';
import { ImportView } from './Views/ImportView';
import { ResizeView } from './Views/ResizeView';
import { PromptConcatView } from './Views/PromptConcatView';
import { ListSelectorView } from './Views/ListSelectorView';
import { NumberSelectorView } from './Views/NumberSelectorView';
import { StringArrayView } from './Views/StringArrayView';
import { ExportView } from './Views/ExportView';
import { ToggleView } from './Views/ToggleView';
import { SeedView } from './Views/SeedView';
import { CropView } from './Views/CropView';
import { VideoView } from './Views/VideoView';
import { ParameterView } from './Views/ParameterView/ParameterView';
import { PainterView } from './Views/PainterView';
import { MediaIteratorView } from './Views/MediaIteratorView';
import { CustomGroupView } from './Views/CustomGroupView';
import { NodeGroupingView } from './Views/NodeGrouping/GroupsManagerView';
import type { NodeId } from 'web';
import type { Node, Edge, BaseNodeData } from '@/types/node';
import type { FlowUIState } from './FlowGraph';

let canvasInst: HTMLCanvasElement | null;
function getCanvas() {
  if (canvasInst != null) return canvasInst;
  canvasInst = document.createElement('canvas');
  canvasInst.style.visibility = 'hidden';
  canvasInst.style.position = 'absolute';
  canvasInst.style.top = '100vh';
  canvasInst.style.width = '1024px';
  canvasInst.style.height = '1024px';
  return canvasInst;
}

export function useCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(getCanvas());
  const setParent = useCallback((parent: Element) => {
    const canvas = canvasRef.current;
    parent.appendChild(canvas);
    canvas.style.visibility = 'visible';
    canvas.style.position = '';
    canvas.style.top = '';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
  }, []);

  const unsetParent = useCallback((parent: Element) => {
    const canvas = parent.removeChild(canvasRef.current);
    canvas.style.visibility = 'hidden';
    canvas.style.position = 'absolute';
    canvas.style.top = '100vh';
    canvas.style.width = '1024px';
    canvas.style.height = '1024px';

    canvasRef.current = canvas;
  }, []);

  return { canvasRef, setParent, unsetParent };
}

const FlowContext = createContext<{ graph: FlowGraph } | null>(null);
function useFlowContext() {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error('Missing FlowContext.Provider in the tree');
  return ctx;
}

export function useFlowState<T>(selector: (state: FlowUIState) => T): T {
  const { graph } = useFlowContext();
  const subscribe = useCallback((f: () => void) => graph.addUIStateListener(f), [graph]);
  return useSyncExternalStore(subscribe, () => selector(graph.getUIState()));
}

export function useOnFlowError(onError: (error: { message: string; recovered: boolean }) => void) {
  const { graph } = useFlowContext();
  useEffect(() => graph.addErrorListener(onError), [graph, onError]);
}

/**
 * A *reactive* hook that returns the nodes of the flow graph.
 *
 * @example
 * ```tsx
 * const nodes = useNodes();
 * nodes.filter((node) => node.type === 'blurV2');
 * ```
 *
 * @returns The nodes of the flow graph
 */
export function useNodes(): Node[] {
  const { graph } = useFlowContext();
  const subscribe = useCallback((f: () => void) => graph.store.addNodesListener(f), [graph]);
  return useSyncExternalStore(subscribe, () => graph.store.getNodes());
}

/**
 * A *reactive* hook that returns the nodes of the flow graph sorted for rendering.
 * The sorting order is:
 * 1. Regular nodes (not in groups)
 * 2. Group nodes with their children immediately following
 *
 * @example
 * ```tsx
 * const nodes = useSortedNodesForRendering();
 * ```
 *
 * @returns The nodes sorted for proper z-ordering in rendering
 */
export function useSortedNodesForRendering(): Node[] {
  const nodes = useNodes();
  return useMemo(() => sortNodesForRendering(nodes), [nodes]);
}

export function useNode(id: NodeId): Node {
  const { graph } = useFlowContext();
  const subscribe = useCallback((f: () => void) => graph.store.addNodeListener(id, f), [graph, id]);
  return useSyncExternalStore(subscribe, () => graph.store.getNode(id));
}

export function useNodeNullable(id: NodeId | undefined): Node | undefined {
  const { graph } = useFlowContext();
  return useSyncExternalStore(
    (f) => (id ? graph.store.addNodeListener(id, f) : () => {}),
    () => (id ? graph.store.getNodeNullable(id) : undefined),
  );
}

export function useNodeData<T extends BaseNodeData>(id: NodeId): T {
  const { graph } = useFlowContext();
  const subscribe = useCallback((f: () => void) => graph.store.addNodeListener(id, f), [graph, id]);
  return useSyncExternalStore(subscribe, () => graph.store.getNodeData<T>(id));
}

export function useNodeDataNullable<T extends BaseNodeData>(id: NodeId | undefined): T | undefined {
  const { graph } = useFlowContext();
  return useSyncExternalStore(
    (f) => (id ? graph.store.addNodeListener(id, f) : () => {}),
    () => (id ? graph.store.getNodeDataNullable<T>(id) : undefined),
  );
}

/**
 * A *reactive* hook that returns the edges of the flow graph.
 *
 * @example
 * ```tsx
 * const edges = useEdges();
 * edges.filter((edge) => edge.source === 'node-id');
 * ```
 *
 * @returns The edges of the flow graph
 */
export function useEdges(): Edge[] {
  const { graph } = useFlowContext();
  const subscribe = useCallback((f: () => void) => graph.store.addEdgesListener(f), [graph.store]);
  return useSyncExternalStore(subscribe, () => graph.store.getEdges());
}

/**
 * A *non-reactive* hook that returns a function that returns the nodes of the flow graph.
 *
 * @example
 * ```tsx
 * const getNodes = useGetNodes();
 * getNodes().filter((node) => node.type === 'blurV2');
 * ```
 *
 * @returns A function that returns the nodes of the flow graph
 */
export function useGetNodes() {
  const { graph } = useFlowContext();
  return useCallback(() => graph.store.getNodes(), [graph]);
}

/**
 * A *non-reactive* hook that returns a function that returns the edges of the flow graph.
 *
 * @example
 * ```tsx
 * const getEdges = useGetEdges();
 * getEdges().filter((edge) => edge.source === 'node-id');
 * ```
 *
 * @returns A function that returns the edges of the flow graph
 */
export function useGetEdges() {
  const { graph } = useFlowContext();
  return useCallback(() => graph.store.getEdges(), [graph]);
}

export function useNodeRenderTarget(id: NodeId, index: number = 0) {
  const { graph } = useFlowContext();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      graph.wasm.call((wasm) => {
        wasm.onWheel(e);
      });
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', onWheel);
    }
    graph.wasm.call((wasm) => {
      wasm.setNodeCanvas(id, index, canvas ?? undefined);
    });
    return () => {
      if (canvas) {
        canvas.removeEventListener('wheel', onWheel);
      }
      graph.wasm.call((wasm) => {
        wasm.setNodeCanvas(id, index, undefined);
      });
    };
  }, [graph, id, index]);

  return canvasRef;
}

export function useFlowView() {
  const { graph } = useFlowContext();

  return useMemo(() => new FlowView(graph), [graph]);
}

export function useCustomGroupView(groupNodeId: NodeId) {
  const { graph } = useFlowContext();
  return useMemo(() => new CustomGroupView(graph, groupNodeId), [graph, groupNodeId]);
}

function useNodeView<T>(nodeId: NodeId, makeView: () => T) {
  const { graph } = useFlowContext();
  const [view, setView] = useState(makeView);
  useEffect(() => graph.store.addNodeListener(nodeId, () => setView(makeView)), [graph, nodeId, makeView]);
  return view;
}

export function useVideoView(nodeId: NodeId) {
  const { graph } = useFlowContext();
  return useMemo(() => new VideoView(graph, nodeId), [graph, nodeId]);
}

export function useCompositorView(nodeId: NodeId) {
  const { graph } = useFlowContext();
  const makeView = useCallback(() => new CompositorView(graph, nodeId), [graph, nodeId]);
  return useNodeView(nodeId, makeView);
}

export function useBlurView(nodeId: NodeId) {
  const { graph } = useFlowContext();
  return useMemo(() => new BlurView(graph, nodeId), [graph, nodeId]);
}

export function useLevelsView(nodeId: NodeId) {
  const { graph } = useFlowContext();
  return useMemo(() => new LevelsView(graph, nodeId), [graph, nodeId]);
}

export function useDilationErosionView(nodeId: NodeId) {
  const { graph } = useFlowContext();
  const makeView = useCallback(() => new DilationErosionView(graph, nodeId), [graph, nodeId]);
  return useNodeView(nodeId, makeView);
}

export function useChannelsView(nodeId: NodeId) {
  const { graph } = useFlowContext();
  return useMemo(() => new ChannelsView(graph, nodeId), [graph, nodeId]);
}

export function useTextView(nodeId: NodeId) {
  const { graph } = useFlowContext();
  return useMemo(() => new TextView(graph, nodeId), [graph, nodeId]);
}

export function usePromptView(nodeId: NodeId) {
  const { graph } = useFlowContext();
  return useMemo(() => new PromptView(graph, nodeId), [graph, nodeId]);
}

export function usePromptConcatView(nodeId: NodeId) {
  const { graph } = useFlowContext();
  return useMemo(() => new PromptConcatView(graph, nodeId), [graph, nodeId]);
}

export function useNumberView(nodeId: NodeId) {
  const { graph } = useFlowContext();
  return useMemo(() => new NumberView(graph, nodeId), [graph, nodeId]);
}

export function useStringArrayView(nodeId: NodeId) {
  const { graph } = useFlowContext();
  return useMemo(() => new StringArrayView(graph, nodeId), [graph, nodeId]);
}

export function useImportView(nodeId: NodeId) {
  const { graph } = useFlowContext();
  const makeView = useCallback(() => new ImportView(graph, nodeId), [graph, nodeId]);
  return useNodeView(nodeId, makeView);
}

export function useMediaIteratorView(nodeId: NodeId) {
  const { graph } = useFlowContext();
  const makeView = useCallback(() => new MediaIteratorView(graph, nodeId), [graph, nodeId]);
  return useNodeView(nodeId, makeView);
}

export function useModelBaseView(nodeId: NodeId) {
  const { graph } = useFlowContext();
  const makeView = useCallback(() => new ModelBaseView(graph, nodeId), [graph, nodeId]);
  return useNodeView(nodeId, makeView);
}

export function useParameterView(nodeId: NodeId) {
  const { graph } = useFlowContext();
  const makeView = useCallback(() => new ParameterView(graph, nodeId), [graph, nodeId]);
  return useNodeView(nodeId, makeView);
}

export function useCropView(nodeId: NodeId) {
  const { graph } = useFlowContext();
  return useMemo(() => new CropView(graph, nodeId), [graph, nodeId]);
}

export function useResizeView(nodeId: NodeId) {
  const { graph } = useFlowContext();
  return useMemo(() => new ResizeView(graph, nodeId), [graph, nodeId]);
}

export function useListSelectorView(nodeId: NodeId) {
  const { graph } = useFlowContext();
  const makeView = useCallback(() => new ListSelectorView(graph, nodeId), [graph, nodeId]);
  return useNodeView(nodeId, makeView);
}

export function usePainterView(id: NodeId) {
  const { graph } = useFlowContext();
  return useMemo(() => new PainterView(graph, id), [graph, id]);
}

export function useNumberSelectorView(nodeId: NodeId) {
  const { graph } = useFlowContext();
  const makeView = useCallback(() => new NumberSelectorView(graph, nodeId), [graph, nodeId]);
  return useNodeView(nodeId, makeView);
}

export function useExportView(nodeId: NodeId) {
  const { graph } = useFlowContext();
  return useMemo(() => new ExportView(graph, nodeId), [graph, nodeId]);
}

export function useToggleView(nodeId: NodeId) {
  const { graph } = useFlowContext();
  const makeView = useCallback(() => new ToggleView(graph, nodeId), [graph, nodeId]);
  return useNodeView(nodeId, makeView);
}

export function useSeedView(nodeId: NodeId) {
  const { graph } = useFlowContext();
  const makeView = useCallback(() => new SeedView(graph, nodeId), [graph, nodeId]);
  return useNodeView(nodeId, makeView);
}

export function useNodeGroupingView() {
  const { graph } = useFlowContext();
  return useMemo(() => new NodeGroupingView(graph), [graph]);
}

type FlowProviderProps = React.PropsWithChildren<{
  nodes: Node[];
  edges: Edge[];
}>;
export function FlowProvider({ nodes: initialNodes, edges: initialEdges, children }: FlowProviderProps) {
  const { canvasRef } = useCanvas();
  const setLoadingState = useWorkflowStore((state) => state.setLoadingState);
  const role = useWorkflowStore((state) => state.workflowRole);

  const [graph, setGraph] = useState<FlowGraph | undefined>();

  useEffect(() => {
    let newGraph: FlowGraph | undefined;
    const initGraph = () => {
      setLoadingState('flow-graph', 'loading');
      // FlowGraph constructor is a long and synchronous operation, so we need to set the loading state before and after
      newGraph = new FlowGraph(initialNodes, initialEdges, canvasRef.current, role === 'editor');
      setGraph(newGraph);
      setLoadingState('flow-graph', 'loaded');
    };
    void initGraph();
    return () => {
      newGraph?.dispose();
      setGraph(undefined);
    };
  }, [canvasRef, initialEdges, initialNodes, setLoadingState, role]);

  if (!graph) {
    return null;
  }

  return <FlowContext.Provider value={{ graph }}>{children}</FlowContext.Provider>;
}
