import { useCallback, useContext, useMemo, useState } from 'react';
import { Divider, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Flex, FlexCenHorVer, FlexCol } from '@/UI/styles';
import { useUserWorkflowRole } from '@/state/workflow.state';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { CreditsContext } from '@/services/CreditsContext';
import { TrackTypeEnum, useAnalytics } from '@/hooks/useAnalytics';
import { useFlowRunContext } from '@/components/Recipe/RunFlow/FlowRunContext';
import { CaretIcon } from '@/UI/Icons/CaretIcon';
import { IteratorSection } from '@/components/Recipe/FlowComponents/Iterators/IteratorSection';
import { usePrecedingIterators, type PrecedingIteratorData } from '@/hooks/usePrecedingIterators';
import { useGetCost } from '@/hooks/useGetCost';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ExpensiveRunModal } from '@/components/Common/ExpensiveRunModal/ExpensiveRunModal';
import { PriceInfo } from '@/components/Common/PriceInfo/PriceInfo';
import { getIteratorValues } from '@/utils/iterator.utils';
import { useNodeNullable } from '@/components/Recipe/FlowContext';
import { hasEditingPermissions } from '../../Utils';
import { SaveCustomNode } from '../SaveCustomNode';
import { useRunModel } from '../useRunModel';
import { RunModelButton } from '../RunModelButton';
import { PricyModelModal } from '../PricyModelModal';
import { ErrorMessage } from '../../Shared/ErrorMessage/ErrorMessage';
import { CreditsMessage } from './CreditsMessage';
import { AddInputButton } from './AddInputButton';
import type { ModelBaseNodeData } from '@/types/nodes/model';

const RunwayAttribution = ({ modelName }: { modelName: string }) => {
  if (modelName !== 'rw_video' && modelName !== 'rw_4_video') return null;
  return <img src="/powered-by-runway.svg" alt="powered by Runway" height={14} />;
};

const AdvancedOptionsToggle = ({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) => {
  const { t } = useTranslation();
  return (
    <FlexCenHorVer sx={{ gap: 0.5, cursor: 'pointer' }} onClick={onToggle}>
      <Typography variant="body-sm-rg" color={color.White64_T}>
        {t(I18N_KEYS.RECIPE_MAIN.NODES.MODEL_BASE_NODE.MODEL_NODE_FOOTER.ADVANCED_OPTIONS)}
      </Typography>
      <CaretIcon
        style={{
          transform: isOpen ? 'rotate(180deg)' : 'none',
          color: color.White64_T,
        }}
      />
    </FlexCenHorVer>
  );
};

const WARNING_PRICE = 100;

const useWarningModals = ({
  modelPrice,
  modelName,
  getCost,
  precedingIterators,
}: {
  modelPrice: number;
  modelName: string;
  getCost?: () => Promise<number>;
  precedingIterators?: PrecedingIteratorData[] | null;
}) => {
  const { track } = useAnalytics();
  const [isPricyModelModalOpen, setIsPricyModelModalOpen] = useState(false);
  const [isExpensiveRunModalOpen, setIsExpensiveRunModalOpen] = useState(false);

  const { getItem: getAllowRunPricyModel } = useLocalStorage<Record<string, boolean>>('allowRunPricyModel');
  const { getItem: getAllowRunExpensiveRun } = useLocalStorage<boolean>('allowRunExpensiveRun');

  const shouldWarnAboutPricyModel = useCallback(() => {
    if (modelPrice && modelPrice >= WARNING_PRICE) {
      const allowRunPricyModel = getAllowRunPricyModel();
      const shouldWarn = allowRunPricyModel?.[modelName] === undefined || allowRunPricyModel?.[modelName] === false;

      if (shouldWarn) {
        track(
          'pricy_model_warning_modal_opened',
          {
            modelName: modelName || 'no model name',
            modelPrice: modelPrice,
          },
          TrackTypeEnum.Product,
        );
        setIsPricyModelModalOpen(true);
        return true;
      }
    }
    return false;
  }, [modelPrice, getAllowRunPricyModel, modelName, track]);

  const shouldWarnAboutExpensiveRun = useCallback(async () => {
    const cost = await getCost?.();
    if (cost && cost >= WARNING_PRICE) {
      const allowRunExpensiveRun = getAllowRunExpensiveRun();
      if (!allowRunExpensiveRun) {
        const iteratorOptionsAmount = precedingIterators?.reduce(
          (acc, { iteratorNode: { data } }) => acc + getIteratorValues(data).length,
          0,
        );
        track(
          'expensive_run_warning_modal_opened',
          {
            modelName: modelName || 'no model name',
            cost: cost,
            iteratorOptionsAmount,
          },
          TrackTypeEnum.Product,
        );
        setIsExpensiveRunModalOpen(true);
        return true;
      }
    }
    return false;
  }, [getAllowRunExpensiveRun, getCost, modelName, precedingIterators, track]);

  const closePricyModelModal = useCallback(() => {
    setIsPricyModelModalOpen(false);
  }, []);
  const closeExpensiveRunModal = useCallback(() => {
    setIsExpensiveRunModalOpen(false);
  }, []);

  return {
    isPricyModelModalOpen,
    isExpensiveRunModalOpen,
    shouldWarnAboutPricyModel,
    shouldWarnAboutExpensiveRun,
    closePricyModelModal,
    closeExpensiveRunModal,
  };
};

interface ModelNodeFooterProps {
  canSaveModel: boolean;
  data: ModelBaseNodeData;
  errorMessage?: string;
  setErrorMessage: (error: string | object | null) => void;
  id: string;
  modelName: string;
  modelPrice?: number;
}

export const ModelNodeFooter = ({
  canSaveModel,
  data,
  errorMessage,
  setErrorMessage,
  id,
  modelName,
  modelPrice,
}: ModelNodeFooterProps) => {
  const { credits } = useContext(CreditsContext);
  const workflowRole = useUserWorkflowRole();
  const { initializingBatchNodes } = useFlowRunContext();
  const canEdit = hasEditingPermissions(workflowRole, data);
  const { t } = useTranslation();
  const nodeData = useNodeNullable(id)?.data;

  const [isAdvancedOptionsOpen, setIsAdvancedOptionsOpen] = useState(false);
  const precedingIterators = usePrecedingIterators(id);

  const { cancelRun, buttonStatus, progress, multiNodeBatch, run, calculateCost } = useRunModel({
    id,
    setErrorMessage,
  });

  const { cost, isLoading, forceGetCost } = useGetCost({
    enabled: isAdvancedOptionsOpen,
    precedingIterators,
    calculateCost,
    selectedNodes: nodeData,
  });

  const {
    isPricyModelModalOpen,
    isExpensiveRunModalOpen,
    shouldWarnAboutPricyModel,
    shouldWarnAboutExpensiveRun,
    closePricyModelModal,
    closeExpensiveRunModal,
  } = useWarningModals({
    modelPrice: modelPrice || 0,
    modelName,
    getCost: forceGetCost,
    precedingIterators,
  });

  const notEnoughCredits = useMemo(() => {
    if (cost && cost > 0) {
      return typeof credits === 'number' && credits < cost;
    }
    return typeof modelPrice === 'number' && typeof credits === 'number' && credits < modelPrice;
  }, [credits, modelPrice, cost]);

  const handleRun = useCallback(async () => {
    // Check if warnings need to be shown
    if (shouldWarnAboutPricyModel()) {
      return null; // Stop execution if warning was shown
    }
    if (await shouldWarnAboutExpensiveRun()) {
      return null; // Stop execution if warning was shown
    }

    return run();
  }, [run, shouldWarnAboutExpensiveRun, shouldWarnAboutPricyModel]);

  const initializingBatchNodeIds = useMemo(() => {
    return Object.values(initializingBatchNodes).flat();
  }, [initializingBatchNodes]);

  return (
    <>
      <FlexCol sx={{ width: '100%', alignItems: 'flex-start' }}>
        <FlexCol sx={{ gap: 1.5, width: '100%', alignItems: 'flex-start' }}>
          <Flex
            sx={{ width: '100%', justifyContent: 'space-between', alignItems: 'stretch' }}
            data-testid="model-node-footer"
          >
            <FlexCol
              data-testid="model-node-footer-left"
              sx={{
                gap: 1.5,
                alignItems: 'flex-start',
                justifyContent: 'center',
                flexGrow: 1,
              }}
            >
              <AddInputButton canEdit={canEdit} modelName={modelName} nodeId={id} data={data} />
              {canSaveModel && canEdit ? <SaveCustomNode data={data} /> : null}
              {precedingIterators?.length ? (
                <AdvancedOptionsToggle
                  isOpen={isAdvancedOptionsOpen}
                  onToggle={() => setIsAdvancedOptionsOpen((prev) => !prev)}
                />
              ) : null}
            </FlexCol>
            <Flex data-testid="model-node-footer-right" sx={{ justifyContent: 'flex-end' }}>
              <RunModelButton
                data-tour-id={`run-model-button-${id}`}
                disabled={!canEdit || notEnoughCredits}
                onCancel={cancelRun}
                onClick={handleRun}
                status={buttonStatus}
                progress={progress}
                isInMultiNodeBatch={multiNodeBatch}
                nodeId={id}
                initializingBatchNodeIds={initializingBatchNodeIds}
              />
            </Flex>
          </Flex>
          <IteratorSection iteratorsData={precedingIterators} isOpen={isAdvancedOptionsOpen} itemWidth="120px" />
          {precedingIterators?.length && isAdvancedOptionsOpen ? (
            <>
              <Divider orientation="horizontal" flexItem sx={{ backgroundColor: color.White08_T }} />
              <PriceInfo cost={cost} isLoading={isLoading} />
            </>
          ) : null}
          <RunwayAttribution modelName={modelName} />
        </FlexCol>
        <Divider
          orientation="horizontal"
          flexItem
          sx={{ backgroundColor: color.White08_T, my: 1.5, '&:has(+ .bottom-section:empty)': { display: 'none' } }}
        />
        <FlexCol sx={{ width: '100%', gap: 1.5, alignItems: 'flex-start' }} className="bottom-section">
          <ErrorMessage errorMessage={errorMessage} />
          <CreditsMessage notEnoughCredits={notEnoughCredits} canEdit={canEdit} />
        </FlexCol>
      </FlexCol>
      <PricyModelModal
        open={isPricyModelModalOpen}
        onClose={closePricyModelModal}
        modelPrice={modelPrice || 0}
        modelName={modelName || ''}
        displayName={data.name || t(I18N_KEYS.RECIPE_MAIN.FLOW.PRICY_MODEL_MODAL.MODEL_NAME_PLACEHOLDER)}
        onConfirm={() => {
          closePricyModelModal();
          void run();
        }}
      />
      <ExpensiveRunModal
        open={isExpensiveRunModalOpen}
        onClose={closeExpensiveRunModal}
        onConfirm={() => {
          closeExpensiveRunModal();
          void run();
        }}
        cost={cost || 0}
      />
    </>
  );
};
