import { useTranslation } from 'react-i18next';
import { useMemo, useRef } from 'react';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { color } from '@/colors';
import { CaretIcon, WarningCircleIcon } from '@/UI/Icons';
import { LoadingCircle } from '@/UI/Animations/LoadingCircle';
import { I18N_KEYS } from '@/language/keys';
import { useWorkflowStore } from '@/state/workflow.state';
import { FlexCenVer } from '@/UI/styles.ts';
import { useBatchesByRecipeId, useBatchesStore, useRunningBatchesByRecipeId } from '../batches.store';
import { isAnyBatch } from '../batch.utils';
import { useFlowRunContext } from '../FlowRunContext';

export const BatchStatusButton = () => {
  const taskManagerButtonRef = useRef<HTMLButtonElement | null>(null);

  const isTaskManagerOpen = useBatchesStore((s) => s.isTaskManagerOpen);
  const setIsTaskManagerOpen = useBatchesStore((s) => s.setIsTaskManagerOpen);

  const { initializingBatchNodes } = useFlowRunContext();

  const recipeId = useWorkflowStore((state) => state.recipe.id);
  const batches = useBatchesByRecipeId(recipeId);

  const runningBatches = useRunningBatchesByRecipeId(recipeId);

  const { t } = useTranslation();

  const isError = useMemo(
    () =>
      isAnyBatch(
        batches.filter((b) => !b.isClearedInTaskManager),
        'FAILED',
      ),
    [batches],
  );

  const { text, startIcon } = useMemo(() => {
    if (isError) {
      return { text: t(I18N_KEYS.GENERAL.ERROR), startIcon: <WarningCircleIcon width={16} height={16} /> };
    }
    if (runningBatches.length > 0) {
      return {
        text: t(I18N_KEYS.TASK_MANAGER.RUNNING_TEXT, { count: runningBatches.length }),
        startIcon: <LoadingCircle color={color.White100} size={16} />,
      };
    } else if (Object.values(initializingBatchNodes).flat().length > 0) {
      return {
        text: t(I18N_KEYS.TASK_MANAGER.INITIALIZING),
        startIcon: <LoadingCircle color={color.White100} size={16} />,
      };
    } else {
      return { text: t(I18N_KEYS.TASK_MANAGER.NO_ACTIVE_RUNS), startIcon: undefined };
    }
  }, [initializingBatchNodes, isError, runningBatches.length, t]);

  return (
    <ButtonContained
      ref={taskManagerButtonRef}
      disableRipple
      mode="text"
      size="small"
      sx={{
        height: 20,
        bgcolor: isTaskManagerOpen ? color.White08_T : 'unset',
        color: isError ? color.Weavy_Error : 'unset',
        ...(isError
          ? {
              '& .MuiButton-endIcon svg': {
                color: color.White80_T,
              },
            }
          : {}),
        px: 0.75,
      }}
      startIcon={<FlexCenVer>{startIcon && <FlexCenVer>{startIcon}</FlexCenVer>}</FlexCenVer>}
      endIcon={<CaretIcon width={8} height={8} />}
      onClick={() => setIsTaskManagerOpen(!isTaskManagerOpen)}
    >
      {text}
    </ButtonContained>
  );
};
