import { BatchRun, BatchStatus, NodeRun, NodeRunStatus, RecipeRunStatus } from '@/types/batch.types';

export const isAnyBatch = (batches: BatchRun[], status: RecipeRunStatus) =>
  batches.some((batch) => isAnyRun(batch, status));

export const isAnyRun = (batch: BatchRun, status: RecipeRunStatus) =>
  batch.recipeRuns.some((run) => run.status === status);

export const getFailedRun = (batch: BatchRun) => batch.recipeRuns.find((run) => run.status === 'FAILED');

export const getBatchStatus = (batch: BatchRun): BatchStatus => {
  if (isAnyRun(batch, 'FAILED')) {
    return 'FAILED';
  }
  if (isAnyRun(batch, 'CANCELED')) {
    return 'CANCELED';
  }
  if (isAnyRun(batch, 'RUNNING')) {
    return 'RUNNING';
  }
  return 'COMPLETED';
};

export const getCountOf = (batch: BatchRun, nodeRunStatus: NodeRunStatus, filter?: (nodeId: string) => boolean) =>
  batch.recipeRuns.reduce((total, recipeRun) => {
    const completedNodeRuns = recipeRun.nodeRuns.filter(
      (nodeRun) => nodeRun.status === nodeRunStatus && (filter ? filter(nodeRun.nodeId) : true),
    ).length;
    return total + completedNodeRuns;
  }, 0);

export const getTotalNodeRuns = (batch: BatchRun, filter?: (nodeId: string) => boolean) =>
  batch.recipeRuns.reduce((total, recipeRun) => {
    const nodeRuns = filter ? recipeRun.nodeRuns.filter((nodeRun) => filter(nodeRun.nodeId)) : recipeRun.nodeRuns;
    return total + nodeRuns.length;
  }, 0);

export const getBatchesForNode = (nid: string, batches: BatchRun[]): BatchRun[] =>
  batches.filter((batch) => batch.recipeRuns.some((run) => run.nodeRuns.some((nodeRun) => nodeRun.nodeId === nid)));

export const isSomeNodesInRunningBatch = (nids: string[], batches: BatchRun[]): boolean => {
  for (const nid of nids) {
    const batchesForNode = getBatchesForNode(nid, batches);
    if (batchesForNode.some((batch) => isAnyRun(batch, 'RUNNING'))) {
      return true;
    }
  }
  return false;
};

export const getNodeRunsInBatches = (nodeId: string, batches: BatchRun[]): NodeRun[] =>
  batches.flatMap((batch) =>
    batch.recipeRuns.flatMap((run) => run.nodeRuns.filter((nodeRun) => nodeRun.nodeId === nodeId)),
  );
