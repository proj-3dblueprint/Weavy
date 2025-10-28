import { Divider, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useCallback, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useReactFlow } from 'reactflow';
import { color } from '@/colors';
import { AppPaper, FlexCenVerSpaceBetween, FlexCol } from '@/UI/styles';
import { I18N_KEYS } from '@/language/keys';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { BatchRun } from '@/types/batch.types';
import { useWorkflowStore } from '@/state/workflow.state';
import { log } from '@/logger/logger';
import { useAnyBatchDone, useBatches, useBatchesStore } from '../batches.store';
import { useFlowRunContext } from '../FlowRunContext';
import { TaskItem } from './TaskItem';

const logger = log.getLogger('TaskManager');

const getBatchName = (b: BatchRun) => {
  const startTime = b.recipeRuns[0]?.startTime;
  if (!startTime) return '';

  return format(new Date(startTime), 'MMM dd, hh:mm a');
};

const TaskManager = () => {
  const [cancellingBatchIdsInProgress, setCancellingBatchIdsInProgress] = useState<string[]>([]);
  const batches = useBatches();
  const recipeId = useWorkflowStore((state) => state.recipe.id);
  const doneBatches = useAnyBatchDone(recipeId);
  const { fitView, getNode } = useReactFlow();

  const doneBatchesStillShow = useMemo(() => {
    return doneBatches.filter((b) => !b.isClearedInTaskManager);
  }, [doneBatches]);

  const batchesArray = useMemo(() => Object.values(batches).filter((b) => !b.isClearedInTaskManager), [batches]);

  const { stopBatch } = useFlowRunContext();

  const { t } = useTranslation();
  const { clearBatch, clearAllBatches } = useBatchesStore();

  const handleCancelBatch = async (bid: string) => {
    setCancellingBatchIdsInProgress((prev) => [...prev, bid]);
    try {
      await stopBatch(bid);
    } catch (error) {
      logger.error('Failed to cancel batch', { error, batchId: bid });
    } finally {
      setCancellingBatchIdsInProgress((prev) => prev.filter((id) => id !== bid));
    }
  };

  const handleClearBatch = (bid: string) => clearBatch(bid);

  const handleTaskItemClick = useCallback(
    (batch: BatchRun) => {
      // Collect all node IDs from the batch
      const allNodeIds: string[] = [];

      for (const recipeRun of batch.recipeRuns) {
        for (const nodeRun of recipeRun.nodeRuns) {
          if (nodeRun.nodeId) {
            allNodeIds.push(nodeRun.nodeId);
          }
        }
      }

      if (allNodeIds.length > 0) {
        // Get all nodes that exist in the flow
        const targetNodes = allNodeIds
          .map((nodeId) => getNode(nodeId))
          .filter((node): node is NonNullable<typeof node> => node !== null);

        if (targetNodes.length > 0) {
          // Focus on all nodes in the batch with a smooth animation
          fitView({
            nodes: targetNodes,
            maxZoom: 0.8,
            duration: 800,
            padding: 0.2,
          });
        }
      }
    },
    [getNode, fitView],
  );

  return (
    <AppPaper sx={{ width: 360, pt: 1.75, pb: 1, px: 1 }}>
      <FlexCol sx={{ width: '100%' }}>
        <FlexCenVerSpaceBetween sx={{ mb: 1.25, height: 24 }}>
          <Typography variant="label-sm-rg" color={color.White80_T} pl={1}>
            {t(I18N_KEYS.TASK_MANAGER.TITLE)}
          </Typography>
          {doneBatchesStillShow.length > 0 && (
            <ButtonContained mode="text" size="small" sx={{ height: 24 }} onClick={clearAllBatches}>
              {t(I18N_KEYS.TASK_MANAGER.CLEAR_ALL)}
            </ButtonContained>
          )}
        </FlexCenVerSpaceBetween>
        <Divider sx={{ width: '100%', mb: 1 }} />
        <FlexCol
          className="wea-no-scrollbar"
          sx={{
            maxHeight: 300,
            overflowY: 'auto',
            scrollBehavior: 'smooth',
            pl: 1,
            justifyContent: 'flex-start',
          }}
        >
          {batchesArray.length > 0 ? (
            batchesArray
              .sort((a, b) => {
                const aStartTime = a.recipeRuns[0]?.startTime;
                const bStartTime = b.recipeRuns[0]?.startTime;
                if (!aStartTime || !bStartTime) return 0;

                return new Date(bStartTime).getTime() - new Date(aStartTime).getTime();
              })
              .map((b) => (
                <TaskItem
                  key={b.batchId}
                  name={getBatchName(b)}
                  batch={b}
                  onCancelBatch={() => void handleCancelBatch(b.batchId)}
                  onClearBatch={handleClearBatch}
                  onClick={() => handleTaskItemClick(b)}
                  isCancellingInProgress={cancellingBatchIdsInProgress.includes(b.batchId)}
                />
              ))
          ) : (
            <Typography variant="body-sm-rg" color={color.White64_T} py={1.5}>
              {t(I18N_KEYS.TASK_MANAGER.EMPTY_STATE)}
            </Typography>
          )}
        </FlexCol>
      </FlexCol>
    </AppPaper>
  );
};

export default TaskManager;
