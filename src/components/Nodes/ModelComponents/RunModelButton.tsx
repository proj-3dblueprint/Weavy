import { forwardRef, useCallback, useMemo, useState, type ComponentProps, type Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, type SxProps } from '@mui/material';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { FlexCenVer } from '@/UI/styles';
import { ArrowIcon } from '@/UI/Icons/ArrowIcon';
import { LoadingCircle } from '@/UI/Animations/LoadingCircle';
import { darkTheme } from '@/UI/theme';
import { log } from '@/logger/logger';
import { AppXBtn } from '@/UI/AppXBtn/AppXBtn';

export type RunModelButtonStatus = 'initial' | 'pending' | 'node-running';

interface RunModelButtonProps
  extends Omit<ComponentProps<typeof ButtonContained>, 'children' | 'mode' | 'size' | 'onClick'> {
  status: RunModelButtonStatus;
  isInMultiNodeBatch?: boolean; // is part of a multi-node batch
  progress?: string; // what to show in the button when processing, could be percentage like '10%' or 'Processing' or '1/3' and so on
  onCancel?: () => Promise<void>;
  onClick?: () => Promise<string | null>;
  nodeId: string;
  initializingBatchNodeIds?: string[];
}

const BUTTON_STYLES: SxProps = {
  minWidth: '120px',
  width: 'fit-content',
  fontWeight: 500,
  textTransform: 'none',
  boxShadow: 'none',
  position: 'relative',
  textWrap: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  fontSize: darkTheme.typography['body-std-md'].fontSize,
  height: '36px',
  borderRadius: '8px',
  px: 1.5,
  py: 1,
};

const logger = log.getLogger('RunModelButton');

/**
 * RunModelButton - Button for running or re-running a model, following project and Figma standards.
 * Uses ButtonContained and ReRunIcon, supports loading/progress state and cancel action.
 */
export const RunModelButton = forwardRef<HTMLButtonElement, RunModelButtonProps>(function RunModelButton(
  {
    status,
    progress,
    onCancel,
    onClick,
    disabled: propDisabled,
    isInMultiNodeBatch = false,
    nodeId,
    initializingBatchNodeIds = [],
    ...props
  },
  ref,
) {
  const { t } = useTranslation();
  const [initializingRun, setInitializingRun] = useState(false);
  const [cancellingRun, setCancellingRun] = useState(false);

  const isInitializing = useMemo(() => {
    return initializingRun || initializingBatchNodeIds.includes(nodeId);
  }, [initializingBatchNodeIds, initializingRun, nodeId]);

  const progressText = useMemo(() => {
    if (cancellingRun) {
      return t(I18N_KEYS.RECIPE_MAIN.NODES.MODEL_BASE_NODE.RUN_MODEL_BUTTON.CANCELLING);
    }
    if (progress !== undefined) {
      return progress;
    }
    if (isInitializing) {
      return t(I18N_KEYS.RECIPE_MAIN.NODES.MODEL_BASE_NODE.RUN_MODEL_BUTTON.INITIALIZING);
    }
    return '0%';
  }, [cancellingRun, isInitializing, progress, t]);

  const handleCancelRun = useCallback(async () => {
    try {
      setCancellingRun(true);
      await onCancel?.();
      setCancellingRun(false);
    } catch (error) {
      logger.error('Error cancelling run', error);
      setCancellingRun(false);
    }
  }, [onCancel]);

  const handleRun = useCallback(async () => {
    try {
      setInitializingRun(true);
      await onClick?.();
      setInitializingRun(false);
    } catch (error) {
      logger.error('Error running model', error);
      setInitializingRun(false);
    }
  }, [onClick]);

  if (isInitializing || status === 'pending' || status === 'node-running') {
    const textColor = isInitializing ? color.White40_T : color.White100;
    return (
      <FlexCenVer
        aria-busy
        aria-label={progressText}
        sx={{
          ...BUTTON_STYLES,
          justifyContent: 'space-between',
          background: 'transparent',
          border: `1px solid ${color.White16_T}`,
          color: textColor,
          display: 'inline-flex',
          outline: 'none',
          margin: 0,
          pl: 1,
          pr: 0.5,
          py: 0.5,
          gap: 1,
          ...props.sx,
        }}
        ref={ref as Ref<HTMLDivElement>}
      >
        <FlexCenVer sx={{ gap: 0.75, flexGrow: 1 }}>
          {!cancellingRun ? <LoadingCircle color={textColor} size={20} /> : null}
          <Typography
            variant="body-std-md"
            color={textColor}
            sx={{ flexGrow: 1, textAlign: cancellingRun ? 'center' : 'inherit' }}
          >
            {progressText}
          </Typography>
        </FlexCenVer>
        {!cancellingRun && !isInMultiNodeBatch && !isInitializing && (
          <AppXBtn
            aria-label={t(I18N_KEYS.RECIPE_MAIN.NODES.MODEL_BASE_NODE.RUN_MODEL_BUTTON.CANCEL_RUN)}
            disabled={initializingRun}
            onClick={(e) => {
              e.stopPropagation();
              void handleCancelRun();
            }}
            size={20}
            mode="on-dark"
          />
        )}
      </FlexCenVer>
    );
  }
  return (
    <ButtonContained
      ref={ref}
      mode="outlined"
      disabled={propDisabled}
      startIcon={
        <ArrowIcon style={{ transform: 'rotate(90deg)', height: '16px', width: '16px', strokeWidth: '1.125' }} />
      }
      onClick={() => void handleRun()}
      {...props}
      sx={{ ...BUTTON_STYLES, ...props.sx }}
    >
      {t(I18N_KEYS.RECIPE_MAIN.NODES.MODEL_BASE_NODE.RUN_MODEL_BUTTON.RUN)}
    </ButtonContained>
  );
});
