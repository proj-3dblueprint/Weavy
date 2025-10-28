import { UndoRedoEntry } from './undoRedo';
import type { BaseNodeData, Edge, EdgeId, Node } from '@/types/node';
import type { NodeId } from 'web';

export type FlowState = {
  nodes: Node[];
  edges: Edge[];
};

export class FlowStore {
  private nodes: MapStore<NodeId, Node>;
  private edges: MapStore<EdgeId, Edge>;

  constructor({ nodes, edges }: FlowState) {
    this.nodes = new MapStore(nodes.map((node) => [node.id, node]));
    this.edges = new MapStore(edges.map((edge) => [edge.id, edge]));
  }

  getState(): FlowState {
    return { nodes: this.getNodes(), edges: this.getEdges() };
  }

  addNodeListener(nodeId: NodeId, callback: () => void) {
    return this.nodes.addKeyListener(nodeId, callback);
  }

  addNodesListener(callback: () => void) {
    return this.nodes.addListener(callback);
  }

  addEdgesListener(callback: () => void) {
    return this.edges.addListener(callback);
  }

  getNodes(): Node[] {
    return this.nodes.values();
  }

  getEdges(): Edge[] {
    return this.edges.values();
  }

  addNodes(newNodes: Node[]): UndoRedoEntry {
    for (const node of newNodes) {
      if (this.nodes.get(node.id)) {
        throw new Error(`Node with id ${node.id} already exists`);
      }
      this.nodes.set(node.id, node);
    }
    return UndoRedoEntry.fromNodes(newNodes.map((node) => ({ type: 'add', nodeId: node.id })));
  }

  removeNodes(nodeIds: NodeId[]): UndoRedoEntry {
    const removedNodes = nodeIds.map((nodeId) => this.getNode(nodeId));
    for (const nodeId of nodeIds) {
      this.nodes.delete(nodeId);
    }
    return UndoRedoEntry.fromNodes(removedNodes.map((node) => ({ type: 'remove', node })));
  }

  addEdges(newEdges: Edge[]): UndoRedoEntry {
    for (const edge of newEdges) {
      this.edges.set(edge.id, edge);
    }
    return UndoRedoEntry.fromEdges(newEdges.map((edge) => ({ type: 'add', edgeId: edge.id })));
  }

  removeEdges(edgeIds: EdgeId[]): UndoRedoEntry {
    const removedEdges = edgeIds.map((edgeId) => {
      const edge = this.edges.get(edgeId);
      if (!edge) throw new Error('edge not found');
      return edge;
    });

    for (const edgeId of edgeIds) {
      this.edges.delete(edgeId);
    }

    return UndoRedoEntry.fromEdges(removedEdges.map((edge) => ({ type: 'remove', edge })));
  }

  updateEdge(edgeId: EdgeId, update: (edge: Edge) => Partial<Edge>) {
    const prevEdge = this.getEdge(edgeId);
    this.edges.set(edgeId, { ...prevEdge, ...update(prevEdge) });
    //return { type: 'update', edge: prevEdge };
  }

  getEdge(edgeId: EdgeId): Edge {
    const edge = this.edges.get(edgeId);
    if (edge === undefined) throw new Error('edge not found');
    return edge;
  }

  getEdgeNullable(edgeId: EdgeId): Edge | undefined {
    return this.edges.get(edgeId);
  }

  getNode(nodeId: NodeId): Node {
    const node = this.getNodeNullable(nodeId);
    if (node === undefined) throw new Error('node not found');
    return node;
  }

  getNodeNullable(nodeId: NodeId): Node | undefined {
    return this.nodes.get(nodeId);
  }

  updateNode(nodeId: NodeId, update: (node: Node) => Partial<Node>): UndoRedoEntry {
    const prevNode = this.getNode(nodeId);
    this.nodes.set(nodeId, { ...prevNode, ...update(prevNode) });
    return UndoRedoEntry.fromNodes([{ type: 'update', node: prevNode }]);
  }

  setNode(nodeId: NodeId, node: Node): UndoRedoEntry {
    const prevNode = this.getNode(nodeId);
    this.nodes.set(nodeId, node);
    return UndoRedoEntry.fromNodes([{ type: 'set', node: prevNode }]);
  }

  getNodeData<T extends BaseNodeData>(nodeId: NodeId): T {
    const nodeData = this.getNodeDataNullable<T>(nodeId);
    if (nodeData === undefined) throw new Error('node data not found');
    return nodeData;
  }

  getNodeDataNullable<T extends BaseNodeData>(nodeId: NodeId): T | undefined {
    const node = this.getNodeNullable(nodeId);
    return node?.data as T;
  }

  updateNodeData<T extends BaseNodeData>(nodeId: NodeId, update: (nodeData: T) => Partial<T>): UndoRedoEntry {
    return this.updateNode(nodeId, (node) => {
      const nodeData = node.data as T;
      if (nodeData === undefined) throw new Error('node data not found');
      return { data: { ...nodeData, ...update(nodeData) } };
    });
  }
}

class MapStore<K, V> {
  private map: Map<K, V>;
  private keyListeners: Map<K, Set<() => void>> = new Map();
  private listeners: Set<() => void> = new Set();

  private cachedValuesArray: V[] = [];

  constructor(entries?: [K, V][]) {
    this.map = new Map(entries);
    this.cachedValuesArray = [...this.map.values()];
  }

  get(key: K): V | undefined {
    return this.map.get(key);
  }

  set(key: K, value: V): void {
    this.map.set(key, value);
    this.notifyKey(key);
    this.onChange();
  }

  delete(key: K): void {
    this.map.delete(key);
    this.notifyKey(key);
    this.onChange();
  }

  values() {
    return this.cachedValuesArray;
  }

  keys() {
    return this.map.keys();
  }

  entries() {
    return this.map.entries();
  }

  private notifyKey(key: K) {
    const keyListeners = this.keyListeners.get(key);
    if (keyListeners) {
      for (const listener of keyListeners) {
        listener();
      }
    }
  }

  private onChange() {
    this.cachedValuesArray = [...this.map.values()];
    this.notify();
  }

  private notify() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  addListener(callback: () => void): () => void {
    if (!this.listeners.has(callback)) {
      this.listeners.add(callback);
    }
    return () => {
      this.listeners.delete(callback);
    };
  }

  addKeyListener(key: K, callback: () => void): () => void {
    if (!this.keyListeners.has(key)) {
      this.keyListeners.set(key, new Set());
    }
    const keyListeners = this.keyListeners.get(key)!;
    keyListeners.add(callback);
    return () => {
      keyListeners.delete(callback);
      if (keyListeners.size === 0) {
        this.keyListeners.delete(key);
      }
    };
  }
}
