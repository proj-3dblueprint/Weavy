import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidV4 } from 'uuid';
import cloneDeep from 'lodash/cloneDeep';
import { AxiosError } from 'axios';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { log } from '@/logger/logger';
import { useSocket } from '@/hooks/useSocket';
import { useWorkflowStore } from '@/state/workflow.state';
import { useCreditsContext } from '@/services/CreditsContext';
import { I18N_KEYS } from '@/language/keys';
import { ModelBaseNodeData } from '@/types/nodes/model';
import { TrackTypeEnum, useAnalytics } from '@/hooks/useAnalytics';
import { getAxiosInstance } from '@/services/axiosConfig';
import { getPrecedingIterators } from '@/utils/flow';
import { useSaveRecipe } from '@/hooks/useSaveRecipe';
import { IGNORE_NODE_TYPES } from '@/consts/node-types.consts';
import { FF_SOCKET_RECONNECTION_ISSUE } from '@/consts/featureFlags';
import { getIteratorValues } from '@/utils/iterator.utils';
import { useFlowView, useGetEdges, useGetNodes } from '../FlowContext';
import { useBatches, useUpdateBatches } from './batches.store';
import type { Edge, IteratorInput, Node } from '@/types/node';
import type { BatchRun, NodeRun, RecipeRun } from '@/types/batch.types';

const logger = log.getLogger('FlowModelRunContext');
const axiosInstance = getAxiosInstance();

const POLL_INTERVAL = 10000;

const isIgnoreNodeType = (nodeType: string | undefined): nodeType is (typeof IGNORE_NODE_TYPES)[number] => {
  return !!nodeType && IGNORE_NODE_TYPES.includes(nodeType as (typeof IGNORE_NODE_TYPES)[number]);
};

interface FlowRunContextType {
  addNodeCallback: (nodeId: string, callback: NodeCallback) => () => void;
  getBatchCost: (nodesToRun: Node[], numberOfRuns?: number) => Promise<number>;
  initializingBatchNodes: Record<string, string[]>;
  runNextConnectedNodes: () => Promise<string | null>;
  runNode: (nodeId: string, numberOfRuns?: number) => Promise<string | null>;
  runSelected: (numberOfRuns?: number) => Promise<string | null>;
  stopBatch: (batchId: string) => Promise<void>;
}

type NodeCallback = (batch: BatchRun, recipeRun: RecipeRun, nodeRun: NodeRun) => void;

const FlowRunContext = React.createContext<FlowRunContextType | null>(null);

export function FlowRunProvider({ children, recipeId }: { children: React.ReactNode; recipeId: string }) {
  const updateBatches = useUpdateBatches();
  const batches = useBatches();
  const { addListener, getIsConnected: getIsSocketConnected, recreateSocket } = useSocket();
  const { setUserCredits, setWorkspaceCredits } = useCreditsContext();
  const nodeCallbacks = useRef<Record<string, NodeCallback>>({});
  const batchPollIntervals = useRef<Record<string, number>>({});
  const getNodes = useGetNodes();
  const getEdges = useGetEdges();
  const { t } = useTranslation();
  const { track } = useAnalytics();
  const [initializingBatchNodes, setInitializingBatchNodes] = useState<Record<string, string[]>>({});
  const flowView = useFlowView();
  const saveRecipe = useSaveRecipe();
  const FF_isSocketReconnectionIssue = useFeatureFlagEnabled(FF_SOCKET_RECONNECTION_ISSUE);

  const setNodeValidation = useWorkflowStore((state) => state.setNodeValidation);
  const addNodeCallback = useCallback(
    (nodeId: string, callback: NodeCallback) => {
      nodeCallbacks.current[nodeId] = callback;
      // If the current batches are already running call
      const runningBatches = Object.values(batches).filter((batch) =>
        batch.recipeRuns.some((run) => run.status === 'RUNNING'),
      );
      runningBatches.forEach((batch) => {
        batch.recipeRuns.forEach((run) => {
          run.nodeRuns.forEach((nodeRun) => {
            if (nodeRun.nodeId === nodeId) {
              callback(batch, run, nodeRun);
            }
          });
        });
      });
      return () => {
        delete nodeCallbacks.current[nodeId];
      };
    },
    [batches],
  );

  const onBatchUpdate = useCallback(
    (data: BatchRun) => {
      let isAnyRunning = false;
      data.recipeRuns.forEach((recipeRun) => {
        if (recipeRun.nodeRuns.every((nodeRun) => nodeRun.status === 'COMPLETED') && recipeRun.status === 'RUNNING') {
          recipeRun.status = 'COMPLETED';
          recipeRun.endTime = new Date(Date.now());
        }
        if (recipeRun.status === 'RUNNING') {
          isAnyRunning = true;
        }
      });
      if (!isAnyRunning && data.batchId in batchPollIntervals.current) {
        clearInterval(batchPollIntervals.current[data.batchId]);
        delete batchPollIntervals.current[data.batchId];
      }
      updateBatches({ [data.batchId]: data });
      if (data.userRemainingCredits !== undefined) {
        setUserCredits(data.userRemainingCredits);
      }
      if (typeof data.remainingCredits === 'number') {
        setWorkspaceCredits(data.remainingCredits);
      }
      const callbackKeys = Object.keys(nodeCallbacks.current);
      data.recipeRuns.forEach((recipeRun) => {
        recipeRun.nodeRuns.forEach((nodeRun) => {
          if (!callbackKeys.includes(nodeRun.nodeId)) {
            return;
          }
          nodeCallbacks.current[nodeRun.nodeId]?.(data, recipeRun, nodeRun);
        });
      });
    },
    [updateBatches, setUserCredits, setWorkspaceCredits],
  );

  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return addListener('batch_run_status', (data) => {
      onBatchUpdate(data);
    });
  }, [addListener, onBatchUpdate]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Clear all intervals when the recipeId changes
    return () => {
      Object.values(batchPollIntervals.current).forEach((interval) => {
        clearInterval(interval);
      });
      batchPollIntervals.current = {};
    };
  }, [recipeId]);

  const batchPrep = useCallback(
    (nodesToRun: Node[]): { nodes: Node[]; edges: Edge[]; hasIterators: boolean } => {
      const nodesToRunClone = cloneDeep(nodesToRun);
      const nodes = getNodes();
      const edges = getEdges();

      const nodesToRunIds = nodesToRunClone.map((node) => node.id);
      const relevantEdges = edges.filter(
        (edge) => nodesToRunIds.includes(edge.source) || nodesToRunIds.includes(edge.target),
      );

      // Update the legacy input for model nodes on the new architecture to avoid changes to the server
      for (const node of nodesToRunClone.filter((node) => node.type === 'custommodelV2')) {
        flowView.updateInputBeforeRun(node.id, node.data as ModelBaseNodeData);
      }

      // Input Prep
      const precedingIterators = nodesToRunClone
        .map((node) => getPrecedingIterators(node.id, nodes, edges))
        .flat()
        .filter((item) => item !== null);
      const precedingIteratorsNotInSelection = precedingIterators.filter(
        (item) => !nodesToRunIds.includes(item.iteratorNode.id),
      );
      if (precedingIteratorsNotInSelection.length) {
        precedingIteratorsNotInSelection.forEach((iterator) => {
          const node = nodesToRunClone.find((node) => node.id === iterator.nodeId);
          if (node) {
            if (!node.data.iteratorInput) {
              node.data.iteratorInput = { runMode: 'parallel' } as IteratorInput;
            }
            const {
              iteratorNode: { data: iteratorData },
            } = iterator;
            const values = getIteratorValues(iteratorData);
            node.data.iteratorInput[iterator.inputKey] = { options: values };
          }
        });
      }
      return { nodes: nodesToRunClone, edges: relevantEdges, hasIterators: precedingIterators.length > 0 };
    },
    [getEdges, getNodes, flowView],
  );

  const runBatch = useCallback(
    async (nodesToRun: Node[], numberOfRuns = 1) => {
      if (!getIsSocketConnected()) {
        if (FF_isSocketReconnectionIssue) {
          logger.warn('Workflow socket is not connected when trying to run batch. Attempting to recreate socket...');
          // Temp fix to socket disconnection issue
          recreateSocket();
        }
      }

      // Validation
      let isValid = true;
      const initializingNodes = new Set<string>();
      nodesToRun.forEach((node) => {
        initializingNodes.add(node.id);
        const missingRequiredInputs = flowView.missingRequiredInputs(node.id);
        if (missingRequiredInputs.length > 0) {
          isValid = false;
          setNodeValidation(node.id, {
            type: 'missingRequiredInputs',
            extraInfo: { keys: missingRequiredInputs },
          });
        }
      });
      // We validate only when there is one node because the input could be created dynamically in the run
      // We check for isValid because we don't want to validate the inputs if the node is already invalid
      if (nodesToRun.length === 1 && isValid) {
        const node = nodesToRun[0];
        const invalidRequiredInputs = flowView.invalidRequiredInputs(node.id);
        if (invalidRequiredInputs.length > 0) {
          isValid = false;
          setNodeValidation(node.id, {
            type: 'emptyRequiredInputs',
            extraInfo: { keys: invalidRequiredInputs },
          });
        }
      }
      if (!isValid) {
        return null;
      }

      // Prepare the nodes
      const { nodes: updatedNodes, hasIterators, edges: updatedNodesEdges } = batchPrep(nodesToRun);

      // Analytics
      let modelName = '';
      const modelNodes = updatedNodes.filter((node) => node.isModel);
      if (modelNodes.length) {
        modelName = (modelNodes[0].data as ModelBaseNodeData).model?.name || '';
      }
      track(
        'run_model_start',
        { batchSize: modelNodes.length, numberOfRuns, model: modelName, hasIterators },
        TrackTypeEnum.BI,
      );

      // Run batch
      const batchTempId = uuidV4();
      try {
        setInitializingBatchNodes((prev) => ({ ...prev, [batchTempId]: Array.from(initializingNodes).sort() }));
        void saveRecipe({
          // For logging purposes
          saveFlowId: 'batch_run-' + batchTempId,
        });
        const response = await axiosInstance.post<BatchRun>(
          `/v1/batches/recipes/${recipeId}/execute`,
          { numberOfRuns, nodes: updatedNodes, edges: updatedNodesEdges },
          { 'axios-retry': { retries: 0 } },
        );
        onBatchUpdate(response.data);
        batchPollIntervals.current[response.data.batchId] = window.setInterval(() => {
          axiosInstance
            .get<BatchRun>(`/v1/batches/recipes/${recipeId}/batches/${response.data.batchId}/status`)
            .then((res) => {
              onBatchUpdate(res.data);
            })
            .catch((error) => {
              logger.error(`Could not poll batch ${response.data.batchId}`, error);
            });
        }, POLL_INTERVAL);
        setInitializingBatchNodes((prev) => {
          const { [batchTempId]: _, ...rest } = prev;
          return rest;
        });
        return response.data.batchId;
      } catch (error) {
        logger.error('Could not run batch', error);
        setInitializingBatchNodes((prev) => {
          const { [batchTempId]: _, ...rest } = prev;
          return rest;
        });
        if (error instanceof AxiosError) {
          throw new Error(error.response?.data?.message || t(I18N_KEYS.GENERAL.UNKNOWN_ERROR));
        }

        if (error instanceof Error) {
          throw error;
        }
        throw new Error(t(I18N_KEYS.GENERAL.UNKNOWN_ERROR));
      }
    },
    [
      getIsSocketConnected,
      batchPrep,
      track,
      FF_isSocketReconnectionIssue,
      recreateSocket,
      flowView,
      setNodeValidation,
      saveRecipe,
      recipeId,
      onBatchUpdate,
      t,
    ],
  );

  const stopBatch = useCallback(
    async (batchId: string) => {
      logger.info(`Stopping batch ${batchId}`);
      const batch = batches[batchId];
      if (!batch) {
        logger.error(`Batch ${batchId} not found`);
        return;
      }
      if (batch.recipeRuns.every((run) => run.status !== 'RUNNING')) {
        logger.error(`Batch ${batchId} is not running or pending`);
        return;
      }
      try {
        await axiosInstance.post(`/v1/batches/recipes/${batch.recipeId}/batches/${batchId}/cancel`);
        const canceledBatch: BatchRun = {
          ...batch,
          recipeRuns: batch.recipeRuns.map((run) => ({
            ...run,
            status: 'CANCELED',
            nodeRuns: run.nodeRuns.map((nodeRun) => ({ ...nodeRun, status: 'CANCELED' })),
          })),
        };
        onBatchUpdate(canceledBatch);
        if (batchId in batchPollIntervals.current) {
          clearInterval(batchPollIntervals.current[batchId]);
          delete batchPollIntervals.current[batchId];
        }
      } catch (error) {
        logger.error(`Could not cancel batch ${batchId}`, error);
      }
    },
    [batches, onBatchUpdate],
  );

  const getBatchCost = useCallback(
    async (nodesToRun: Node[], numberOfRuns = 1) => {
      const { nodes: updatedNodes, edges: updatedNodesEdges } = batchPrep(nodesToRun);

      try {
        const response = await axiosInstance.post<{ cost: number }>(
          `/v1/batches/recipes/${recipeId}/cost`,
          { numberOfRuns, nodes: updatedNodes, edges: updatedNodesEdges },
          { 'axios-retry': { retries: 0 } },
        );
        return response.data.cost;
      } catch (error) {
        logger.error('Could not get batch cost', error);
        if (error instanceof Error) {
          throw error;
        }
        throw new Error(t(I18N_KEYS.GENERAL.UNKNOWN_ERROR));
      }
    },
    [batchPrep, recipeId, t],
  );

  const runSelected = useCallback(
    async (numberOfRuns = 1) => {
      const selectedNodes = getNodes().filter((node) => node.selected && !isIgnoreNodeType(node.type));
      return await runBatch(selectedNodes, numberOfRuns);
    },
    [getNodes, runBatch],
  );

  const runNextConnectedNodes = useCallback(async () => {
    const nodes = getNodes();
    const edges = getEdges();
    const selectedNodes = nodes.filter((node) => node.selected);
    if (selectedNodes.length !== 1) {
      return null;
    }

    const selectedNode = selectedNodes[0];

    let nodesToRun: Node[];
    if (selectedNode.isModel) {
      nodesToRun = [selectedNode];
    } else {
      const connectingEdges = edges.filter((edge) => edge.source === selectedNode.id);
      nodesToRun = nodes.filter((node) => connectingEdges.some((edge) => edge.target === node.id));
    }

    return await runBatch(nodesToRun);
  }, [getEdges, getNodes, runBatch]);

  const runNode = useCallback(
    async (nodeId: string, numberOfRuns = 1) => {
      const node = getNodes().find((node) => node.id === nodeId);
      if (!node) {
        return null;
      }
      return await runBatch([node], numberOfRuns);
    },
    [getNodes, runBatch],
  );

  return (
    <FlowRunContext.Provider
      value={{
        addNodeCallback,
        getBatchCost,
        initializingBatchNodes,
        runNextConnectedNodes,
        runNode,
        runSelected,
        stopBatch,
      }}
    >
      {children}
    </FlowRunContext.Provider>
  );
}

export const useFlowRunContext = () => {
  const context = useContext(FlowRunContext);
  if (!context) {
    throw new Error('useFlowRunContext must be used within a FlowRunProvider');
  }
  return context;
};
