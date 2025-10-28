import { Grid2, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useCallback, useMemo } from 'react';
import { color } from '@/colors';
import { LoadingCircle } from '@/UI/Animations/LoadingCircle';
import { BatchRun, BatchStatus } from '@/types/batch.types';
import { WarningCircleIcon } from '@/UI/Icons/WarningCircleIcon';
import { EllipsisText } from '@/UI/EllipsisText/EllipsisText';
import { CheckMarkOutlineIcon } from '@/UI/Icons/CheckMarkOutlineIcon';
import { I18N_KEYS } from '@/language/keys';
import { XCircleOutlineIcon } from '@/UI/Icons/XCircleOutlineIcon';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { useIsHovered } from '@/hooks/useIsHovered';
import { getBatchStatus, getCountOf, getFailedRun, getTotalNodeRuns } from '../batch.utils';
import { useGetNodes } from '../../FlowContext';

const TaskIcon = (status: BatchStatus) => {
  switch (status) {
    case 'RUNNING':
      return <LoadingCircle size={20} />;
    case 'COMPLETED':
      return <CheckMarkOutlineIcon width={20} height={20} />;
    case 'FAILED':
      return <WarningCircleIcon width={20} height={20} color={color.Weavy_Error} />;
    case 'CANCELED':
      return <XCircleOutlineIcon width={20} height={20} />;
    default:
      return null;
  }
};

const TaskText = (status: BatchStatus, batch: BatchRun, text: string) => {
  const { t } = useTranslation();

  switch (status) {
    case 'RUNNING':
    case 'COMPLETED':
      return text;
    case 'CANCELED':
      return t(I18N_KEYS.TASK_MANAGER.CANCELLED_TEXT);
    case 'FAILED':
      return getFailedRun(batch)?.error || 'Unknown error';
  }
};

interface TaskItemProps {
  name: string;
  batch: BatchRun;
  isCancellingInProgress: boolean;
  onCancelBatch: (bid: string) => void;
  onClearBatch: (bid: string) => void;
  onClick: () => void;
}

export const TaskItem = ({
  name,
  batch,
  isCancellingInProgress,
  onCancelBatch,
  onClearBatch,
  onClick,
}: TaskItemProps) => {
  const { isHovered, ...elementProps } = useIsHovered();
  const getNodes = useGetNodes();
  const isModel = useCallback(
    (nodeId: string) => getNodes().find((node) => node.id === nodeId)?.isModel ?? false,
    [getNodes],
  );
  const completed = useMemo(() => getCountOf(batch, 'COMPLETED', isModel), [batch, isModel]);
  const total = useMemo(() => getTotalNodeRuns(batch, isModel), [batch, isModel]);

  const { t } = useTranslation();

  const batchStatus = getBatchStatus(batch);

  const itemFlexStyles = {
    display: 'flex',
    alignItems: 'center',
  };

  const handleClearBatch = () => onClearBatch(batch.batchId);

  const handleCancelBatch = () => onCancelBatch(batch.batchId);

  const getActionButton = (isCancellingInProgress: boolean) => {
    const text = batchStatus === 'RUNNING' ? t(I18N_KEYS.GENERAL.CANCEL) : t(I18N_KEYS.GENERAL.CLEAR);
    const action = batchStatus === 'RUNNING' ? handleCancelBatch : handleClearBatch;

    return (
      <ButtonContained
        size="small"
        mode="text"
        onClick={(e) => {
          e.stopPropagation();
          action();
        }}
        sx={{ height: 24, minWidth: 0 }}
        disabled={isCancellingInProgress}
      >
        {text}
      </ButtonContained>
    );
  };

  return (
    <Grid2 container onClick={onClick} {...elementProps}>
      <Grid2 height={24} mr={1.5} {...itemFlexStyles}>
        {TaskIcon(batchStatus)}
      </Grid2>
      <Grid2 mr={2} {...itemFlexStyles} width={120}>
        <Typography variant="body-sm-rg" sx={{ color: batchStatus === 'FAILED' ? color.Weavy_Error : color.White100 }}>
          {name}
        </Typography>
      </Grid2>
      <Grid2 size="grow" {...itemFlexStyles} justifyContent="space-between">
        <EllipsisText
          variant="body-sm-rg"
          color={color.White80_T}
          sx={{
            color: batchStatus === 'FAILED' ? color.Weavy_Error_80_T : color.White80_T,
            maxWidth: isHovered ? 120 : 'unset',
          }}
          component="div"
        >
          {TaskText(batchStatus, batch, `${completed} / ${total}`)}
        </EllipsisText>
        {isHovered && getActionButton(isCancellingInProgress)}
      </Grid2>
    </Grid2>
  );
};
