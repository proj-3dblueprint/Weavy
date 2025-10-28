import { Box, CircularProgress, InputAdornment } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Input } from '@/UI/Input/Input';
import { I18N_KEYS } from '@/language/keys';
import { useUserWorkflowRole } from '@/state/workflow.state';
import { hasEditingPermissions } from '../Utils';
import { useImportModelInput } from './useImportModelInput';
import type { ModelBaseNodeData } from '@/types/nodes/model';

interface ImportModelInputProps {
  data: ModelBaseNodeData;
  id: string;
  updateNodeData: (id: string, data: Partial<ModelBaseNodeData>) => void;
}

export const ImportModelInput = ({ data, id, updateNodeData }: ImportModelInputProps) => {
  const { t } = useTranslation();
  const role = useUserWorkflowRole();
  const { handles, model, params, schema } = data;
  const [modelNotSupported, setModelNotSupported] = useState<string | null>(null);

  const { isFocused, setIsFocused, handleModelNameChange, handleModelNamePaste, cannotFindModel, modelLoading } =
    useImportModelInput({
      handles: handles,
      id,
      model: model,
      params: params,
      schema: schema,
      setModelNotSupported,
      updateNodeData,
    });

  return (
    <Box className={isFocused ? 'nowheel nodrag nopan' : ''} sx={{ width: '100%', position: 'relative' }}>
      <Input
        autoComplete="off" // prevent autocomplete
        className="nodrag"
        disabled={!hasEditingPermissions(role, data)}
        helperText={
          modelNotSupported
            ? t(I18N_KEYS.RECIPE_MAIN.NODES.MODEL_BASE_NODE.MODEL_NODE_FOOTER.MODEL_NOT_SUPPORTED, {
                modelType: modelNotSupported,
              })
            : cannotFindModel
              ? t(I18N_KEYS.RECIPE_MAIN.NODES.WILDCARD.INPUT_ERROR)
              : undefined
        }
        fullWidth
        error={cannotFindModel || !!modelNotSupported}
        onBlur={() => {
          setIsFocused(false);
        }}
        onFocus={() => {
          setIsFocused(true);
        }}
        onChange={handleModelNameChange}
        onPaste={(event: React.ClipboardEvent<HTMLInputElement>) => void handleModelNamePaste(event)}
        placeholder={t(I18N_KEYS.RECIPE_MAIN.NODES.WILDCARD.PLACEHOLDER_TEMP)}
        size="large"
        value={model?.name || ''}
        endAdornment={
          <InputAdornment position="end">
            {modelLoading && <CircularProgress size={14} color="weavy_cta_secondary" />}
          </InputAdornment>
        }
      />
    </Box>
  );
};
