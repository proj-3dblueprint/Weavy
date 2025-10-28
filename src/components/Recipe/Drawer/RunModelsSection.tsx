import { Box, Divider, Tooltip, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useCallback, useContext, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { I18N_KEYS } from '@/language/keys';
import { FlexCenHorVer, FlexCenVer, FlexCol } from '@/UI/styles';
import { color } from '@/colors';
import { useWorkflowStore } from '@/state/workflow.state';
import Counter from '@/UI/Counter/Counter';
import { CreditsContext } from '@/services/CreditsContext';
import { CaretIcon, WarningCircleIcon } from '@/UI/Icons';
import { usePrecedingIterators, type PrecedingIteratorData } from '@/hooks/usePrecedingIterators';
import { useGetCost } from '@/hooks/useGetCost';
import { PriceInfo } from '@/components/Common/PriceInfo/PriceInfo';
import { UNSUPPORTED_NODE_TYPES } from '@/consts/node-types.consts';
import { useGetNodes, useNodes } from '../FlowContext';
import { useFlowRunContext } from '../RunFlow/FlowRunContext';
import { useGetActiveBatches } from '../RunFlow/batches.store';
import { IteratorSection } from '../FlowComponents/Iterators/IteratorSection';
import { RunSelectedButton } from './RunSelectedButton';
import type { Node } from '@/types/node';

const getNodeName = (node: Node) => {
  const name = node.data.name;
  const displayName = 'menu' in node.data ? (node.data.menu as { displayName: string })?.displayName : undefined;
  const modelName = 'model' in node.data ? (node.data.model as { name: string })?.name : undefined;
  // Prefer display name, then node name, then model name
  return displayName || name || modelName;
};

const useRunModelsButton = ({ runs, selectedNodes }: { runs: number; selectedNodes: Node[] }) => {
  const { runSelected: batchRunSelected, initializingBatchNodes, getBatchCost } = useFlowRunContext();
  const recipeId = useWorkflowStore((state) => state.recipe.id);
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState<string>();
  const getNodes = useGetNodes();
  const activeBatches = useGetActiveBatches(recipeId);

  const { disabled, isProcessing, disabledInfo } = useMemo(() => {
    let disabled = false;

    const selectedUnsupportedNodes = selectedNodes.filter(
      (node) => !!node.type && UNSUPPORTED_NODE_TYPES.includes(node.type as (typeof UNSUPPORTED_NODE_TYPES)[number]),
    );

    const runningNodeIds = new Set<string>();
    activeBatches.forEach((batch) => {
      batch.recipeRuns.forEach((recipeRun) => {
        recipeRun.nodeRuns.forEach((nodeRun) => {
          if (nodeRun.status === 'RUNNING' || nodeRun.status === 'PENDING') {
            runningNodeIds.add(nodeRun.nodeId);
          }
        });
      });
    });
    const initializingNodeIds = Object.values(initializingBatchNodes).flat();
    initializingNodeIds.forEach((nodeId) => {
      runningNodeIds.add(nodeId);
    });

    const hasIntersectingNodes = selectedNodes.some((sn) => runningNodeIds.has(sn.id));

    let disabledInfo: string | undefined;

    if (selectedUnsupportedNodes.length > 0) {
      const nodeNamesSet = new Set(selectedUnsupportedNodes.map(getNodeName));
      disabledInfo = t(I18N_KEYS.RECIPE_MAIN.FLOW.DRAWER.RUN_MODELS_SECTION.UNSUPPORTED_NODES_INFO, {
        count: nodeNamesSet.size,
        nodes: Array.from(nodeNamesSet).join(', '),
      });
      disabled = true;
    }

    if (hasIntersectingNodes) {
      disabledInfo = t(I18N_KEYS.RECIPE_MAIN.FLOW.DRAWER.RUN_MODELS_SECTION.ALREADY_RUNNING_INFO);
      disabled = true;
    }

    return {
      disabled,
      isProcessing: hasIntersectingNodes,
      disabledInfo,
    };
  }, [activeBatches, initializingBatchNodes, selectedNodes, t]);

  const run = useCallback(async () => {
    setErrorMessage(undefined);
    try {
      await batchRunSelected(runs);
    } catch (error) {
      setErrorMessage(
        (error instanceof AxiosError && (error as AxiosError<{ message: string }>)?.response?.data.message) ||
          (error instanceof Error && error.message) ||
          t(I18N_KEYS.GENERAL.UNKNOWN_ERROR),
      );
    }
  }, [batchRunSelected, runs, t]);

  const calculateCost = useCallback(async () => {
    const nodes = getNodes();
    return await getBatchCost(
      nodes.filter((node) => node.selected),
      runs,
    );
  }, [getBatchCost, runs, getNodes]);

  return useMemo(
    () => ({
      disabled,
      isProcessing,
      run,
      disabledInfo,
      errorMessage,
      calculateCost,
    }),
    [disabled, isProcessing, run, disabledInfo, errorMessage, calculateCost],
  );
};
const MIN_RUNS = 1;
const MAX_RUNS = 10;

export const RunCounter = ({
  runs,
  setRuns,
  isProcessing,
}: {
  runs: number;
  setRuns: (runs: number) => void;
  isProcessing: boolean;
}) => {
  const { t } = useTranslation();
  return (
    <FlexCenVer sx={{ gap: 1, justifyContent: 'space-between' }}>
      <Typography variant="body-sm-rg" sx={{ color: color.White100 }}>
        {t(I18N_KEYS.RECIPE_MAIN.FLOW.DRAWER.RUN_MODELS_SECTION.RUNS)}
      </Typography>
      <Counter count={runs} onChange={setRuns} min={MIN_RUNS} max={MAX_RUNS} disabled={isProcessing} size="small" />
    </FlexCenVer>
  );
};

const IteratorsInfo = ({ precedingIterators }: { precedingIterators: PrecedingIteratorData[] }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <FlexCol sx={{ gap: 1 }}>
      <FlexCenVer sx={{ gap: 0.5, justifyContent: 'space-between' }} onClick={() => setIsOpen((current) => !current)}>
        <Typography variant="body-sm-rg" color={color.White100}>
          {t(I18N_KEYS.RECIPE_MAIN.FLOW.DRAWER.RUN_MODELS_SECTION.ITERATORS_INFO.TITLE)}
        </Typography>
        <CaretIcon
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'none',
            color: color.White64_T,
          }}
        />
      </FlexCenVer>

      <IteratorSection iteratorsData={precedingIterators} isOpen={isOpen} />
    </FlexCol>
  );
};

export const RunModelsSection = () => {
  const { t } = useTranslation();
  const [runs, setRuns] = useState(1);
  const nodes = useNodes();
  const selectedNodes = useMemo(() => nodes.filter((node) => node.selected), [nodes]);
  const selectedNodeData = useMemo(() => selectedNodes.map((node) => node.data), [selectedNodes]);
  const precedingIterators = usePrecedingIterators(selectedNodes.map((node) => node.id));

  const { isProcessing, run, disabled, disabledInfo, errorMessage, calculateCost } = useRunModelsButton({
    runs,
    selectedNodes,
  });
  const { credits } = useContext(CreditsContext);

  const { cost, isLoading } = useGetCost({
    precedingIterators,
    calculateCost,
    selectedNodes: selectedNodeData,
    runs,
  });

  const notEnoughCredits = typeof credits === 'number' && typeof cost === 'number' && credits < cost;

  return (
    <FlexCol sx={{ p: 2, gap: 2 }}>
      <Typography variant="label-xs-rg" sx={{ color: color.White64_T }}>
        {t(I18N_KEYS.RECIPE_MAIN.FLOW.DRAWER.RUN_MODELS_SECTION.TITLE)}
      </Typography>
      <FlexCol sx={{ gap: 1.5 }}>
        <RunCounter runs={runs} setRuns={setRuns} isProcessing={isProcessing} />
        {precedingIterators?.length ? (
          <>
            <IteratorsInfo precedingIterators={precedingIterators} />
            <Divider orientation="horizontal" flexItem sx={{ backgroundColor: color.White08_T }} />
          </>
        ) : null}
        <PriceInfo longTitle cost={cost} isLoading={isLoading} />
        <Tooltip title={disabledInfo}>
          <Box sx={{ width: '100%', height: '24px' }}>
            <RunSelectedButton onClick={run} disabled={disabled || notEnoughCredits} sx={{ width: '100%' }} />
          </Box>
        </Tooltip>
        {errorMessage || notEnoughCredits ? (
          <FlexCenHorVer sx={{ gap: 1, pr: 1, maxWidth: '100%' }}>
            <WarningCircleIcon color={color.Weavy_Error} style={{ flexShrink: 0 }} />
            <Typography
              variant="body-xs-rg"
              color={color.Weavy_Error}
              sx={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              {errorMessage || t(I18N_KEYS.RECIPE_MAIN.FLOW.DRAWER.RUN_MODELS_SECTION.NOT_ENOUGH_CREDITS)}
            </Typography>
          </FlexCenHorVer>
        ) : null}
      </FlexCol>
    </FlexCol>
  );
};
