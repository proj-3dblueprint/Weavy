import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { colorMap } from '@/colors';
import { log } from '@/logger/logger.ts';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { DownloadIcon } from '@/UI/Icons/DownloadIcon';
import { useUserWorkflowRole, useWorkflowStore } from '@/state/workflow.state';
import { HandleType } from '@/enums/handle-type.enum.ts';
import { useSaveRecipe } from '@/hooks/useSaveRecipe.tsx';
import { I18N_KEYS } from '@/language/keys';
import { DynamicNode2 } from '../DynamicNode/DynamicNode2';
import { useExportView, useFlowView } from '../../Recipe/FlowContext';
import { hasEditingPermissions } from '../Utils';
import { ErrorMessage } from '../Shared/ErrorMessage/ErrorMessage';
import type { ExportData } from '@/types/node';
import type { NodeId } from 'web';

const logger = log.getLogger('ExportCore');

const EXPORTABLE_TYPES = [HandleType.Image, HandleType.Video, HandleType.Audio, HandleType.ThreeDee];

interface ExportNodeProps {
  id: NodeId;
  data: ExportData;
}

function ExportNode({ id, data }: ExportNodeProps) {
  const role = useUserWorkflowRole();
  const recipeId = useWorkflowStore((state) => state.recipe?.id);

  const { inputNode } = data;
  const exportView = useExportView(id);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const flowView = useFlowView();
  const saveRecipe = useSaveRecipe();
  const { t } = useTranslation();

  const handleExport = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage(undefined); // Clear any previous error

      const fileType = data.inputNode?.nodeId
        ? flowView.nodeOutputType(data.inputNode.nodeId, data.inputNode.outputId)
        : undefined;

      if (data.inputNode && fileType === HandleType.Video) {
        await saveRecipe();
        const result = await exportView.exportVideo(recipeId, data.inputNode.nodeId, data.inputNode?.outputId);
        if (!result.success && result.error) {
          setErrorMessage(result.error);
        }
      } else {
        const inputNode = data.inputNode;
        if (!inputNode) {
          throw new Error('Input node not found');
        }

        const file = inputNode?.file || flowView.fileInput(inputNode);
        if (!file || !file.url) {
          throw new Error('File not found');
        }

        const result = await exportView.exportFile(file);
        if (!result.success && result.error) {
          setErrorMessage(result.error);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export file';
      setErrorMessage(errorMessage);
      logger.error('Error fetching or downloading the file', error);
    } finally {
      setIsProcessing(false);
    }
  };

  function shouldDisable(): boolean {
    if (isProcessing) {
      return true;
    }

    if (!hasEditingPermissions(role, data)) {
      return true;
    }

    if (inputNode?.file?.url) {
      return false;
    }

    // if it's video we can still export
    if (!data.inputNode) {
      return true;
    }

    const outputType = flowView.nodeOutputType(data.inputNode?.nodeId, data.inputNode?.outputId);

    return !outputType || !EXPORTABLE_TYPES.includes(outputType);
  }

  return (
    <DynamicNode2
      id={id}
      data={data}
      className="export"
      handleColor={colorMap.get(data.color)}
      size="small"
      overrideShowFullNode={true}
      inputHandleYPos="50px"
    >
      <>
        <ButtonContained
          mode="outlined"
          size="small"
          fullWidth
          disabled={shouldDisable()}
          loading={isProcessing}
          endIcon={<DownloadIcon />}
          loadingPosition="end"
          onClick={() => void handleExport()}
          sx={{ mb: 1 }}
        >
          {isProcessing && t(I18N_KEYS.RECIPE_MAIN.NODES.EXPORT.EXPORT_CTA_RENDERING)}
        </ButtonContained>
        <ErrorMessage errorMessage={errorMessage} />
      </>
    </DynamicNode2>
  );
}

export default ExportNode;
