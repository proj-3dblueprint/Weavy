import { t } from 'i18next';
import { ModelNodeType, NodeType } from '../../FlowGraph';
import { PARAMETER_TRANSLATIONS_CONFIG } from './parameters.consts';
import { ParameterTranslationConfig } from './parameters.types';

const tModelParameters = (key: string) => t(key, { ns: 'nodeParameters' });

export const getParameterTranslation = (
  nodeType: NodeType,
  parameterKey: string,
  modelType?: ModelNodeType,
): { title: string; description: string } => {
  const nodeConfig = PARAMETER_TRANSLATIONS_CONFIG[nodeType];
  if (nodeConfig) {
    const paramTexts = modelType
      ? (nodeConfig[modelType]?.[parameterKey] as ParameterTranslationConfig)
      : (nodeConfig[parameterKey] as ParameterTranslationConfig);
    if (paramTexts) {
      return {
        title: tModelParameters(paramTexts.titleKey ?? ''),
        description: tModelParameters(paramTexts.descriptionKey ?? ''),
      };
    }
  }
  const sharedText = PARAMETER_TRANSLATIONS_CONFIG.shared[parameterKey];
  return {
    title: tModelParameters(sharedText?.titleKey ?? ''),
    description: tModelParameters(sharedText?.descriptionKey ?? ''),
  };
};
