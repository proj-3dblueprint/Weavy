import { useMemo } from 'react';
import { useEdges, useNodes } from '@/components/Recipe/FlowContext';
import { getPrecedingIterators, type PrecedingIteratorData } from '@/utils/flow';
import type { NodeId } from 'web';

export const usePrecedingIterators = (nodeIds: NodeId[] | NodeId): PrecedingIteratorData[] | null => {
  const nodes = useNodes();
  const edges = useEdges();

  const precedingIterators = useMemo(() => {
    const iterators = (Array.isArray(nodeIds) ? nodeIds : [nodeIds])
      .map((nodeId) => getPrecedingIterators(nodeId, nodes, edges))
      .flat()
      .filter((iterator) => iterator !== null);
    if (iterators.length === 0) return null;
    return iterators;
  }, [edges, nodeIds, nodes]);

  return precedingIterators;
};

export type { PrecedingIteratorData };
