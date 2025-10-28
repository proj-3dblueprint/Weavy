import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { colorMap } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { LockClosedIcon } from '@/UI/Icons';
import { FF_NODE_GRID_VIEW } from '@/consts/featureFlags';
import { NodeViewMode } from '@/enums/node-view-mode.enum';
import { useNodeViewModesMenuItems } from '@/hooks/nodes/useNodeViewModeMenu';
import ConfirmationDialogV2 from '../Common/ConfirmationDialogV2';
import { useModelBaseView } from '../Recipe/FlowContext';
import { useIsNodeInRunningBatch } from '../Recipe/RunFlow/batches.store';
import ModelBaseComponent from './ModelBaseComponent';
import { DynamicNode2 } from './DynamicNode/DynamicNode2';
import { downloadFile, downloadAllToZip, getModelPrice } from './Utils';
import { getNodeIcon } from './utils/NodeIcon';
import { ModelDetails } from './ModelComponents/ModelDetails';
import type { ModelBaseNodeData } from '@/types/nodes/model';
import type { ModelPricesMaps } from '@/state/workflow.state';
import type { MenuAction } from '../Menu/Actions';
import type { MediaAsset } from '@/types/api/assets';

interface ModelBaseNodeProps {
  data: ModelBaseNodeData;
  editable: boolean;
  id: string;
  isSelected: boolean;
  modelPricesMaps: ModelPricesMaps;
  recipeId: string;
  recipeVersion: number;
  updateNodeData: (id: string, data: Partial<ModelBaseNodeData>) => void;
}

const DIVIDER_MENU_ACTION: MenuAction = {
  type: 'divider',
};

function ModelBaseNode({ data, editable, id, isSelected, modelPricesMaps, updateNodeData }: ModelBaseNodeProps) {
  const { t } = useTranslation();

  const [isShowDeletingAllConfirmation, setIsShowDeletingAllConfirmation] = useState(false);
  const nodeGridViewEnabled = useFeatureFlagEnabled(FF_NODE_GRID_VIEW);
  const [viewMode, setViewMode] = useState<NodeViewMode>(NodeViewMode.Single);
  const modelBaseView = useModelBaseView(id);
  const selectedIndex = modelBaseView.getSelectedIndex();
  const generations = modelBaseView.getGenerations();
  const selectedGeneration = generations[selectedIndex];

  const isNodeInRunningBatch = useIsNodeInRunningBatch(id);

  const openDeleteAllResultsModal = useCallback(() => {
    setIsShowDeletingAllConfirmation(true);
  }, []);

  const closeDeleteAllResultsModal = useCallback(() => {
    setIsShowDeletingAllConfirmation(false);
  }, []);

  const goToSource = useCallback(() => {
    if (data.source) {
      window.open(data.source, '_blank');
    }
  }, [data.source]);

  const setSelectedOutput = useCallback(
    (selectedOrUpdater: number | ((selected: number) => number)) => {
      const newSelectedOutput =
        typeof selectedOrUpdater === 'function' ? selectedOrUpdater(selectedIndex) : selectedOrUpdater;

      modelBaseView.setSelectedIndex(newSelectedOutput);
    },
    [modelBaseView, selectedIndex],
  );

  const downloadCurrentResult = useCallback(async () => {
    const selectedIndex = modelBaseView.getSelectedIndex();
    const generations = modelBaseView.getGenerations();
    const selectedGeneration = generations[selectedIndex];
    if (!selectedGeneration || selectedGeneration.type === 'text' || selectedGeneration.type === 'rendering') {
      return;
    }
    const url = selectedGeneration.url;
    const now = new Date();
    const timestamp = format(now, "yyyy-MM-dd 'at' HH.mm.ss");
    await downloadFile(url, `weavy-${data.name || ''}-${timestamp}.${url.split('.').pop()}`, selectedGeneration.type);
  }, [data.name, modelBaseView]);

  const downloadAllResults = useCallback(
    async () =>
      await downloadAllToZip(
        modelBaseView
          .getGenerations()
          .filter((generation) => generation.type !== 'text' && generation.type !== 'rendering') as MediaAsset[],
        data.name,
      ),
    [data.name, modelBaseView],
  );

  const downloadMenuActions = useMemo<MenuAction[]>(
    () =>
      [
        ...(generations?.length > 1 && generations.at(0)?.type === 'text'
          ? []
          : ([
              DIVIDER_MENU_ACTION,
              {
                name: t(I18N_KEYS.RECIPE_MAIN.FLOW.GALLERY.DOWNLOAD_CURRENT),
                action: downloadCurrentResult,
                disabled: !selectedGeneration,
              },
              {
                name: t(I18N_KEYS.RECIPE_MAIN.FLOW.GALLERY.DOWNLOAD_ALL),
                action: downloadAllResults,
                disabled: !generations || generations.length === 0,
              },
            ] as const)),
      ].filter((item) => !!item),
    [generations, downloadAllResults, downloadCurrentResult, t, selectedGeneration],
  );

  const isDeleteDisabled = useMemo(() => {
    return !generations || generations.length === 0 || data.isLocked || isNodeInRunningBatch;
  }, [generations, data.isLocked, isNodeInRunningBatch]);

  const viewModeMenuItems = useNodeViewModesMenuItems(viewMode, setViewMode);

  const nodeMenu = useMemo<MenuAction[]>(
    () =>
      [
        ...downloadMenuActions,
        DIVIDER_MENU_ACTION,
        {
          name: t(I18N_KEYS.RECIPE_MAIN.FLOW.GALLERY.DELETE_CURRENT_GENERATION),
          action: () => modelBaseView.deleteResult(),
          disabled: isDeleteDisabled,
          shortcut: data.isLocked ? <LockClosedIcon width={16} height={16} /> : '',
        },
        {
          name: t(I18N_KEYS.RECIPE_MAIN.FLOW.GALLERY.DELETE_ALL_OTHERS_GENERATIONS),
          action: () => modelBaseView.deleteAllOtherResults(),
          disabled: isDeleteDisabled || generations.length === 1,
          shortcut: data.isLocked ? <LockClosedIcon width={16} height={16} /> : '',
        },
        DIVIDER_MENU_ACTION,
        {
          name: t(I18N_KEYS.RECIPE_MAIN.FLOW.GALLERY.DELETE_ALL_GENERATIONS),
          action: openDeleteAllResultsModal,
          disabled: isDeleteDisabled,
          shortcut: data.isLocked ? <LockClosedIcon width={16} height={16} /> : '',
        },
        data.source ? DIVIDER_MENU_ACTION : undefined,
        data.source
          ? {
              name: t(I18N_KEYS.RECIPE_MAIN.NODES.MODEL_BASE_NODE.LEARN_MORE_ABOUT_THIS_MODEL),
              action: goToSource,
            }
          : undefined,
      ].filter((item) => item !== undefined),
    [
      downloadMenuActions,
      t,
      generations,
      isDeleteDisabled,
      data.isLocked,
      data.source,
      openDeleteAllResultsModal,
      goToSource,
      modelBaseView,
    ],
  );

  const onDeleteAllResults = () => {
    modelBaseView.deleteAllResults();
    setIsShowDeletingAllConfirmation(false);
  };

  const hasValidModel = useMemo(() => {
    // used for hide UI when there is no model yet in import model node (editable === true)
    return Boolean(data.model?.name && data.model?.version && data.model?.service) || !editable;
  }, [data.model, editable]);

  const modelPrice = useMemo(() => {
    if (!data.model) {
      return undefined;
    }
    return getModelPrice(data.model, modelPricesMaps, data.params);
  }, [data.model, data.params, modelPricesMaps]);

  return (
    <>
      <DynamicNode2
        id={id}
        data={data}
        className="model"
        handleColor={colorMap.get(data.color)}
        additionalMenu={nodeGridViewEnabled ? [...nodeMenu, ...viewModeMenuItems] : nodeMenu}
        overrideShowFullNode={!hasValidModel}
        hideHandles={!hasValidModel}
        icon={getNodeIcon(data.model)}
        menuHeader={
          data.model?.name ? (
            <ModelDetails description={data.description} modelName={data.name || data.model.name} price={modelPrice} />
          ) : null
        }
      >
        <ModelBaseComponent
          data={data}
          editable={editable}
          hasValidModel={hasValidModel}
          id={id}
          isSelected={isSelected}
          modelPrice={modelPrice}
          selectedOutput={selectedIndex}
          setSelectedOutput={setSelectedOutput}
          updateNodeData={updateNodeData}
          viewMode={viewMode}
        />
      </DynamicNode2>
      <ConfirmationDialogV2
        open={isShowDeletingAllConfirmation}
        title={t(I18N_KEYS.RECIPE_MAIN.NODES.NODE_MENU_CONFIRMATION_DIALOG.MESSAGE)}
        onConfirm={onDeleteAllResults}
        onClose={closeDeleteAllResultsModal}
      />
    </>
  );
}

export default ModelBaseNode;
