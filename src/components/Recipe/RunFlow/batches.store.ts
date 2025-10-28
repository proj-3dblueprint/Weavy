import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import merge from 'lodash/merge';
import { useMemo } from 'react';
import { getBatchesForNode, isAnyRun } from './batch.utils';
import type { BatchRun } from '@/types/batch.types';

export type BatchesState = {
  batches: Record<string, BatchRun>;
  updateBatches: (batches: Record<string, BatchRun>) => void;
  isTaskManagerOpen: boolean;
  setIsTaskManagerOpen: (isOpen: boolean) => void;
  clearBatch: (bid: string) => void;
  clearAllBatches: () => void;
};

export const useBatchesStore = create<BatchesState>()(
  devtools(
    (set, get) => ({
      isTaskManagerOpen: false,
      setIsTaskManagerOpen: (isOpen: boolean) => set({ isTaskManagerOpen: isOpen }),
      batches: {},
      updateBatches: (batches: Record<string, BatchRun>) => set({ batches: merge({}, get().batches, batches) }),
      clearBatch: (bid: string) =>
        set((state) => ({
          batches: { ...state.batches, [bid]: { ...state.batches[bid], isClearedInTaskManager: true } },
        })),
      clearAllBatches: () =>
        set((state) => ({
          batches: Object.fromEntries(
            Object.entries(state.batches).map(([bid, batch]) => [
              bid,
              {
                ...batch,
                isClearedInTaskManager: !isAnyRun(batch, 'RUNNING'),
              },
            ]),
          ),
        })),
    }),
    {
      name: 'Batches Store',
      enabled: import.meta.env.DEV,
    },
  ),
);

export const useBatches = (): Record<string, BatchRun> => {
  return useBatchesStore((state) => state.batches);
};

export const useUpdateBatches = (): ((batches: Record<string, BatchRun>) => void) => {
  return useBatchesStore((state) => state.updateBatches);
};

export const useBatchesByRecipeId = (recipeId: string): BatchRun[] => {
  const batches = useBatches();
  const recipeBatches = useMemo(
    () => Object.values(batches).filter((batch) => batch.recipeId === recipeId),
    [batches, recipeId],
  );
  return recipeBatches;
};

export const useGetActiveBatches = (recipeId: string): BatchRun[] => {
  const batches = useBatchesByRecipeId(recipeId);
  return useMemo(() => Object.values(batches).filter((batch) => isAnyRun(batch, 'RUNNING')), [batches]);
};

export const useGetActiveBatchesWithActiveNode = (nodeId: string): BatchRun[] => {
  const batches = useRunningBatchesByNodeId(nodeId);
  return useMemo(
    () =>
      batches.filter((batch) =>
        batch.recipeRuns.some((run) =>
          run.nodeRuns.some(
            (nodeRun) => nodeRun.nodeId === nodeId && (nodeRun.status === 'RUNNING' || nodeRun.status === 'PENDING'),
          ),
        ),
      ),
    [batches, nodeId],
  );
};

export const useBatchesByNodeId = (nodeId: string): BatchRun[] => {
  const batches = useBatches();
  return useMemo(() => getBatchesForNode(nodeId, Object.values(batches)), [batches, nodeId]);
};

export const useRunningBatchesByNodeId = (nodeId: string): BatchRun[] => {
  const batches = useBatchesByNodeId(nodeId);
  return useMemo(() => batches.filter((batch) => isAnyRun(batch, 'RUNNING')), [batches]);
};

export const useIsNodeInRunningBatch = (nid: string): boolean => {
  const batches = useRunningBatchesByNodeId(nid);
  return useMemo(() => batches.length > 0, [batches]);
};

export const useRunningBatchesByRecipeId = (recipeId: string): BatchRun[] => {
  const batches = useBatchesByRecipeId(recipeId);
  return useMemo(() => batches.filter((batch) => isAnyRun(batch, 'RUNNING')), [batches]);
};

export const useAnyBatchDone = (recipeId: string): BatchRun[] => {
  const batches = useBatchesByRecipeId(recipeId);
  return useMemo(
    () =>
      batches.filter((batch) =>
        batch.recipeRuns.every(
          (run) => run.status === 'COMPLETED' || run.status === 'FAILED' || run.status === 'CANCELED',
        ),
      ),
    [batches],
  );
};
