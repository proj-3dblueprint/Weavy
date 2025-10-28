import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { log } from '@/logger/logger.ts';
import { I18N_KEYS } from '@/language/keys';
import { useGetNodes, useModelBaseView } from '@/components/Recipe/FlowContext';
import { useBatchesByNodeId, useGetActiveBatchesWithActiveNode } from '@/components/Recipe/RunFlow/batches.store';
import { useFlowRunContext } from '@/components/Recipe/RunFlow/FlowRunContext';
import { getNodeRunsInBatches } from '@/components/Recipe/RunFlow/batch.utils';
import type { ModelBaseNodeData } from '@/types/nodes/model';
import type { BatchRun, NodeRun, NodeRunStatus, RecipeRun } from '@/types/batch.types';
import type { RunModelButtonStatus } from './RunModelButton';
import type { UploadedAsset } from '@/types/api/assets';

const logger = log.getLogger('useRunModel');

interface UseRunModelOptions {
  id: string;
  setErrorMessage: (error: string | object | null) => void;
}

export const useRunModel = ({ id, setErrorMessage }: UseRunModelOptions) => {
  const modelBaseView = useModelBaseView(id);
  const { runNode, addNodeCallback, stopBatch, getBatchCost } = useFlowRunContext();
  const getNodes = useGetNodes();
  const { t } = useTranslation();
  const [status, setStatus] = useState<NodeRunStatus>();

  const onSuccess = useCallback(
    (nodeRun: NodeRun, recipeRun: RecipeRun) => {
      const { result: results, input } = nodeRun;
      const { runIndexInBatch, batchId: batchId, inputIndex } = recipeRun;
      if (results && results.length >= 1) {
        const incomingResults: UploadedAsset[] = results.map(
          (res) =>
            ({
              ...res,
              batchId,
              order: runIndexInBatch,
              secondaryOrder: inputIndex,
              input,
            }) as UploadedAsset,
        );
        const generations = modelBaseView.getGenerations();
        const index = findInsertionIndex(generations, runIndexInBatch, batchId, inputIndex);
        modelBaseView.appendResult(incomingResults, index);
      }
    },
    [modelBaseView],
  );

  const onError = useCallback(
    (error?: unknown) => {
      const message =
        typeof error === 'string'
          ? error
          : typeof error === 'object'
            ? error
              ? JSON.stringify(error)
              : null
            : t(I18N_KEYS.GENERAL.UNKNOWN_ERROR);
      setErrorMessage(message);
    },
    [setErrorMessage, t],
  );

  const batches = useBatchesByNodeId(id);
  const activeBatchesWithActiveNode = useGetActiveBatchesWithActiveNode(id);

  const isBatchRunning = status === 'PENDING' || status === 'RUNNING';

  const cancelBatchRun = useCallback(async () => {
    if (isBatchRunning) {
      // only stop the batch if it is the only one running for the node, and it is the only node running in the batch
      const batchIds = batches
        .filter((batch) =>
          batch.recipeRuns.some(
            (recipeRun) =>
              recipeRun.nodeRuns.every((nodeRun) => nodeRun.nodeId === id) && recipeRun.status !== 'CANCELED',
          ),
        )
        .filter((batch) =>
          batch.recipeRuns.some((recipeRun) =>
            recipeRun.nodeRuns.some((nodeRun) => nodeRun.status === 'RUNNING' || nodeRun.status === 'PENDING'),
          ),
        )
        .map((batch) => batch.batchId);
      const distinctBatchIds = new Set(batchIds);
      if (distinctBatchIds.size === 0) return;

      const batchId = Array.from(distinctBatchIds)[0];
      await stopBatch(batchId);
      setStatus('CANCELED');
    }
  }, [isBatchRunning, batches, stopBatch, id]);

  const processedNodeRuns = useRef<NodeRun[]>([]);

  const onBatchUpdate = useCallback(
    (batch: BatchRun, recipeRun: RecipeRun, nodeRun: NodeRun) => {
      if (nodeRun.nodeId !== id) {
        return;
      }
      if (recipeRun.status === 'CANCELED') {
        setStatus(recipeRun.status);
        return;
      }

      let processedNodeRunIndex = processedNodeRuns.current.findIndex(
        (processedNodeRun) => processedNodeRun.id === nodeRun.id,
      );
      let isFirstUpdate = false;
      if (processedNodeRunIndex === -1) {
        processedNodeRuns.current.push(nodeRun);
        processedNodeRunIndex = processedNodeRuns.current.length - 1;
        isFirstUpdate = true;
      }

      const processedNodeRun = processedNodeRuns.current[processedNodeRunIndex];
      if (!processedNodeRun || processedNodeRun.status === 'CANCELED') {
        return;
      }

      if (recipeRun.status === 'FAILED') {
        setStatus('FAILED');
        if (processedNodeRun.status === 'RUNNING' || processedNodeRun.status === 'PENDING' || isFirstUpdate) {
          onError(nodeRun.error);
          processedNodeRuns.current[processedNodeRunIndex] = nodeRun;
        }
        return;
      }

      switch (nodeRun.status) {
        case 'PENDING':
          setStatus('PENDING');
          break;
        case 'RUNNING':
          setStatus('RUNNING');
          if (processedNodeRun.status === 'PENDING' || isFirstUpdate) {
            processedNodeRuns.current[processedNodeRunIndex] = nodeRun;
          }
          break;
        case 'CANCELED':
          setStatus('CANCELED');
          processedNodeRuns.current[processedNodeRunIndex] = nodeRun;
          break;
        case 'COMPLETED':
          setStatus('COMPLETED');
          if (processedNodeRun.status === 'RUNNING' || processedNodeRun.status === 'PENDING' || isFirstUpdate) {
            onSuccess(nodeRun, recipeRun);
            processedNodeRuns.current[processedNodeRunIndex] = nodeRun;
          }
          break;
        case 'FAILED':
          setStatus('FAILED');
          if (processedNodeRun.status === 'RUNNING' || processedNodeRun.status === 'PENDING' || isFirstUpdate) {
            onError(nodeRun.error);
            processedNodeRuns.current[processedNodeRunIndex] = nodeRun;
          }
          break;
        default:
          break;
      }
    },
    [id, onError, onSuccess],
  );

  useEffect(() => {
    return addNodeCallback(id, onBatchUpdate);
  }, [addNodeCallback, id, onBatchUpdate]);

  const progress = useMemo<string | undefined>(() => {
    if (activeBatchesWithActiveNode.length === 0) {
      return undefined;
    }
    if (activeBatchesWithActiveNode.length > 1) {
      logger.warn('progress: Active node appears in multiple batches. This should not happen', {
        id,
        activeBatchesWithActiveNode,
      });
      return undefined;
    }

    const nodeRunsInBatches = getNodeRunsInBatches(id, activeBatchesWithActiveNode);
    if (!nodeRunsInBatches?.length) {
      return undefined;
    }
    if (nodeRunsInBatches.length === 1) {
      return `${nodeRunsInBatches[0].progress || 0}%`;
    }
    return `${nodeRunsInBatches.filter((nodeRun) => nodeRun.status === 'COMPLETED').length} / ${nodeRunsInBatches.length}`;
  }, [id, activeBatchesWithActiveNode]);

  const run = useCallback(async () => {
    setStatus('PENDING');
    onError(null);
    try {
      const batchId = await runNode(id);
      if (!batchId) {
        setStatus(undefined);
      }
      return batchId;
    } catch (error: any) {
      setStatus(undefined);
      onError(error?.message || error);
      return null;
    }
  }, [runNode, id, onError]);

  const calculateCost = useCallback(
    async (numberOfRuns = 1) => {
      const node = getNodes().find((node) => node.id === id);
      if (!node) {
        return -1;
      }
      const cost = await getBatchCost([node], numberOfRuns);
      return cost;
    },
    [getBatchCost, id, getNodes],
  );

  const multiNodeBatch = useMemo(() => {
    if (activeBatchesWithActiveNode.length === 0) return false;
    if (activeBatchesWithActiveNode.length > 1) {
      logger.warn('multiNodeBatch: Active node appears in multiple batches. This should not happen', {
        id,
        activeBatchesWithActiveNode,
      });
      return true;
    }
    return activeBatchesWithActiveNode[0].recipeRuns.some((recipeRun) =>
      recipeRun.nodeRuns.some((nodeRun) => nodeRun.nodeId !== id),
    );
  }, [activeBatchesWithActiveNode, id]);

  return useMemo(() => {
    let buttonStatus: RunModelButtonStatus = 'initial';
    if (status === 'PENDING') {
      buttonStatus = 'pending';
    } else if (status === 'RUNNING') {
      buttonStatus = 'node-running';
    }
    return {
      cancelRun: cancelBatchRun,
      multiNodeBatch,
      progress,
      run,
      buttonStatus,
      calculateCost,
    };
  }, [status, cancelBatchRun, multiNodeBatch, progress, run, calculateCost]);
};

function compareSecondaryOrder(existingSecondary: number | undefined, newSecondary: number | undefined): boolean {
  // Both undefined: maintain current behavior (insert after)
  if (existingSecondary === undefined && newSecondary === undefined) {
    return true;
  }
  // Only existing is undefined: new item (with secondary order) comes first
  if (existingSecondary === undefined) {
    return false;
  }
  // Only new is undefined: insert after existing item
  if (newSecondary === undefined) {
    return true;
  }
  // Both defined: normal ascending comparison
  return existingSecondary <= newSecondary;
}

function findInsertionIndex(
  array: ModelBaseNodeData['result'],
  order: number,
  batchId: string,
  secondaryOrder?: number,
): number {
  if (!array?.length) {
    return 0;
  }

  // Find all items in the same batch (they will all have order too)
  type BatchItem = {
    item: ModelBaseNodeData['result'][number];
    index: number;
    order: number;
    secondaryOrder?: number;
  };
  const sameBatchItems: BatchItem[] = [];

  for (let i = 0; i < array.length; i++) {
    const currentItem = array[i];

    // Since batch items always have order, we can check batchId directly
    if (currentItem.batchId === batchId) {
      const order = currentItem.order as number;
      const secondaryOrder = currentItem.secondaryOrder as number | undefined;
      sameBatchItems.push({
        item: currentItem,
        index: i,
        order,
        secondaryOrder,
      });
    }
  }

  // If no items in the same batch exist, insert at the end
  if (sameBatchItems.length === 0) {
    return array.length;
  }

  // Binary search within the same batch's items
  let left = 0;
  let right = sameBatchItems.length;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    const midItem = sameBatchItems[mid];

    const shouldInsertAfter =
      midItem.order < order ||
      (midItem.order === order && compareSecondaryOrder(midItem.secondaryOrder, secondaryOrder));

    if (shouldInsertAfter) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  // Determine the actual array index for insertion within the batch
  if (left === 0) {
    // Insert before the first item in the batch
    return sameBatchItems[0].index;
  } else if (left === sameBatchItems.length) {
    // Insert after the last item in the batch
    return sameBatchItems[sameBatchItems.length - 1].index + 1;
  } else {
    // Insert between two items in the same batch
    return sameBatchItems[left].index;
  }
}
