import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ModelType } from '@/enums/model-type.enum';
import { useModelBaseView } from '@/components/Recipe/FlowContext';
import { I18N_KEYS } from '@/language/keys';
import { HandleType } from '@/enums/handle-type.enum';
import { AddItemButton } from '../../../Common/AddItemButton/AddItemButton';
import { MODEL_INPUT_LIMITS } from '../consts/model-input-limits.const';
import type { ModelBaseNodeData } from '@/types/nodes/model';
import type { Handle } from '@/types/node';

interface AddInputButtonProps {
  canEdit: boolean;
  modelName: string;
  nodeId: string;
  data: ModelBaseNodeData;
}

const FAL_FLUX_MULTI_LORA = ModelType.FalFluxMultiLora.valueOf();
const FAL_FLUX_MULTI_LORA_INPAINT = ModelType.FalFluxMultiLoraInpaint.valueOf();
const FAL_FLUX_KONTEXT_LORA = ModelType.FalFluxKontextLora.valueOf();

const VIDEO_MERGE = 'lucataco/video-merge';

export const getInputImageName = (modelName: string) => {
  if (
    modelName === ModelType.GeminiEdit.valueOf() ||
    modelName === 'fal-ai/nano-banana/edit' ||
    modelName === 'fal-ai/bytedance/seedream/v4/edit' ||
    modelName === ModelType.GptImage1Edit.valueOf() ||
    modelName === ModelType.Hyper3dRodin.valueOf() ||
    modelName === 'fal-ai/qwen-image-edit-plus' ||
    modelName === ModelType.AnyLLM.valueOf()
  ) {
    return 'image';
  } else if (
    modelName === 'ideogram-ai/ideogram-v3-quality' ||
    modelName === ModelType.IdeogramV3.valueOf() ||
    modelName === ModelType.IdeogramV3ReplaceBackground.valueOf()
  ) {
    return 'style_reference_image';
  } else if (
    modelName === ModelType.Wan21Vace.valueOf() ||
    modelName === 'kwaivgi/kling-v1.6-pro' ||
    modelName === ModelType.Kling16.valueOf() ||
    modelName === ModelType.Reve.valueOf()
  ) {
    return 'reference_image';
  } else if (modelName === 'lucataco/video-merge') {
    return 'video';
  }
  return null;
};

/**
 * Checks if a model has input limitations and whether more inputs can be added
 */
type ModelInputLimits = {
  reachedLimit: boolean;
  maxInputs: number | null;
};

const checkModelInputLimits = (
  modelName: string,
  inputHandles: string[] | Record<string, Handle>,
  inputPrefix: string | null,
): ModelInputLimits => {
  const modelLimits = MODEL_INPUT_LIMITS[modelName];

  if (!modelLimits || !inputPrefix || Array.isArray(inputHandles)) {
    return { reachedLimit: false, maxInputs: null };
  }

  const currentCount = Object.keys(inputHandles).filter((key) => key.includes(inputPrefix)).length;
  const reachedLimit = currentCount >= modelLimits.maxInputs;

  return {
    reachedLimit,
    maxInputs: modelLimits.maxInputs,
  };
};

export const AddInputButton = ({ canEdit, modelName, nodeId, data }: AddInputButtonProps) => {
  const { t } = useTranslation();
  const modelBaseView = useModelBaseView(nodeId);

  const handleAddLoraInputHandle = useCallback(() => {
    modelBaseView.addLoraInputHandles();
  }, [modelBaseView]);

  const handleAddInputHandle = useCallback(
    (prefix: string | null, type: HandleType) => {
      if (prefix) {
        modelBaseView.addInputHandle(prefix, type);
      }
    },
    [modelBaseView],
  );

  const inputImageName = getInputImageName(modelName);

  const isFalFluxMultiLora =
    modelName === FAL_FLUX_MULTI_LORA ||
    modelName === FAL_FLUX_MULTI_LORA_INPAINT ||
    modelName === FAL_FLUX_KONTEXT_LORA;

  const shouldShowAddInputButton = useMemo(() => {
    return canEdit && (isFalFluxMultiLora || !!inputImageName);
  }, [canEdit, inputImageName, isFalFluxMultiLora]);

  // Check input limits using the utility function
  const { reachedLimit, maxInputs } = useMemo(() => {
    return checkModelInputLimits(modelName, data.handles.input, inputImageName);
  }, [modelName, data.handles.input, inputImageName]);

  return (
    <AddItemButton
      show={shouldShowAddInputButton}
      text={t(
        isFalFluxMultiLora
          ? I18N_KEYS.RECIPE_MAIN.NODES.MODEL_BASE_NODE.MODEL_NODE_FOOTER.ADD_ANOTHER_LORA
          : modelName === VIDEO_MERGE
            ? I18N_KEYS.RECIPE_MAIN.NODES.MODEL_BASE_NODE.MODEL_NODE_FOOTER.ADD_ANOTHER_VIDEO_INPUT
            : I18N_KEYS.RECIPE_MAIN.NODES.MODEL_BASE_NODE.MODEL_NODE_FOOTER.ADD_ANOTHER_IMAGE_INPUT,
      )}
      onClick={
        isFalFluxMultiLora
          ? handleAddLoraInputHandle
          : modelName === VIDEO_MERGE
            ? () => handleAddInputHandle(inputImageName, HandleType.Video)
            : () => handleAddInputHandle(inputImageName, HandleType.Image)
      }
      disabled={reachedLimit}
      disabledTooltipText={
        reachedLimit
          ? t(I18N_KEYS.RECIPE_MAIN.NODES.MODEL_BASE_NODE.MODEL_NODE_FOOTER.ADD_ANOTHER_IMAGE_INPUT_DISABLED, {
              maxInputs,
              inputType: inputImageName === 'reference_image' ? 'reference images' : 'inputs',
            })
          : undefined
      }
    />
  );
};
