import { ITERATOR_NODE_TYPES } from '@/consts/node-types.consts';
import { isIterator } from './iterator.utils';
import type { NodeId } from 'web';
import type { BaseNodeData, Edge, ListSelectorData, MediaIteratorData, Node } from '../types/node';

type IteratorNodeData = BaseNodeData & (ListSelectorData | MediaIteratorData);
export type PrecedingIteratorData = {
  iteratorNode: Node & { data: IteratorNodeData };
  inputKey: string;
  nodeId: NodeId;
};

/**
 * Finds all preceding iterator nodes that feed into the specified node.
 *
 * This function traverses the flow graph backwards from the given node to find
 * all iterator nodes that are connected to its input handles. It recursively
 * follows edges through router nodes to find the actual iterator sources.
 *
 * @param nodeId - The ID of the target node to find preceding iterators for
 * @param nodes - Array of all nodes in the flow graph
 * @param edges - Array of all edges in the flow graph
 * @returns An array of objects containing the preceding iterator node and its corresponding input key, and the given node id,
 *          or null if no preceding iterators are found or if the nodeId is invalid
 *
 * @remarks
 * - If the nodeId itself is an iterator node or a router node, it is ignored.
 * - The function handles router nodes by recursively traversing through them to find the actual source
 * - Currently supports 'muxv2' as an iterator type, with a TODO for adding other iterator types
 * - Input keys are extracted from edge target handles using the pattern '-input-{key}'
 */
export const getPrecedingIterators = (nodeId: NodeId, nodes: Node[], edges: Edge[]): PrecedingIteratorData[] | null => {
  if (!nodeId) return null;
  const node = nodes.find((node) => node.id === nodeId);

  if (!node || node.type === 'router') return null;

  const incomingEdges = edges.filter((edge) => edge.target === nodeId);
  if (incomingEdges.length === 0) return null;

  const precedingIterators: PrecedingIteratorData[] = [];
  // Repeat for all incoming edges (all input handles)
  for (const edge of incomingEdges) {
    // Recursively find preceding iterator node
    const getPrecedingNode = (edge: Edge) => {
      const sourceNode = nodes.find((node) => node.id === edge.source);
      if (!sourceNode) return null;
      if (sourceNode.type === 'router') {
        const routerSourceEdge = edges.find((e) => e.target === sourceNode.id);
        if (!routerSourceEdge) return null;
        return getPrecedingNode(routerSourceEdge);
      }
      if (ITERATOR_NODE_TYPES.includes(sourceNode.type as (typeof ITERATOR_NODE_TYPES)[number])) {
        return sourceNode as Node & { data: IteratorNodeData };
      }
      return null;
    };
    // Get the input key from the edge
    const inputKey = edge.targetHandle?.split('-input-')?.[1];
    if (!inputKey) continue;

    const precedingNode = getPrecedingNode(edge);
    if (precedingNode && isIterator(precedingNode.data)) {
      precedingIterators.push({ iteratorNode: precedingNode, inputKey, nodeId });
    }
  }
  return precedingIterators.length > 0 ? precedingIterators : null;
};
