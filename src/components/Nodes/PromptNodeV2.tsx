import { Typography } from '@mui/material';
import { useEffect, useState, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { I18N_KEYS } from '@/language/keys';
import { colorMap, color } from '@/colors';
import { NodeTextField } from '@/UI/NodeTextField/NodeTextField';
import { FlexCol } from '@/UI/styles';
import { useUserWorkflowRole } from '@/state/workflow.state';
import { DynamicNode2 } from './DynamicNode/DynamicNode2';
import { hasEditingPermissions } from './Utils';
import type { NodeId } from 'web';
import type { PromptData, BaseNodeData } from '@/types/node';

interface PromptNodeV2Props {
  id: NodeId;
  data: PromptData;
  updateNodeData: (nodeId: string, data: Partial<BaseNodeData>) => void;
}

function PromptNodeV2({ id, data, updateNodeData }: PromptNodeV2Props) {
  const { t } = useTranslation();
  const role = useUserWorkflowRole();
  const [prompt, setPrompt] = useState<string>((data.result as any)?.prompt || '');
  const [negativePrompt, setNegativePrompt] = useState<string>((data.result as any)?.negative_prompt || '');
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const onPromptChange = (event: ChangeEvent<HTMLInputElement>) => {
    const updatedPrompt = event.target.value;
    setPrompt(updatedPrompt);
  };
  const onNegativePromptChange = (event: ChangeEvent<HTMLInputElement>) => {
    const updatedNegativePrompt = event.target.value;
    setNegativePrompt(updatedNegativePrompt);
  };

  useEffect(() => {
    updateNodeData(id, {
      result: {
        prompt,
        negative_prompt: negativePrompt,
      },
      output: {
        type: 'text',
        prompt,
        negative_prompt: negativePrompt,
      },
    });
  }, [prompt, negativePrompt]);

  return (
    <DynamicNode2 id={id} data={data} className="prompt" handleColor={colorMap.get(data.color)}>
      <FlexCol
        className="nodrag"
        sx={{
          alignItems: 'flex-end',
          gap: 1,
          width: '100%',
          cursor: !hasEditingPermissions(role, data) ? 'default' : '',
          pointerEvents: !hasEditingPermissions(role, data) ? 'none' : '',
        }}
      >
        <Typography variant="label-sm-rg" sx={{ width: '100%', color: color.White64_T }}>
          {t(I18N_KEYS.RECIPE_MAIN.NODES.PROMPT_NODE_V2.PROMPT_LABEL)}
        </Typography>
        <NodeTextField
          id={`prompt1-${id}`}
          className={isFocused ? 'nowheel nodrag nopan' : ''}
          value={prompt}
          onChange={onPromptChange}
          placeholder={t(I18N_KEYS.RECIPE_MAIN.NODES.PROMPT_NODE_V3.PLACEHOLDER)}
          multiline
          minRows={3}
          maxRows={10}
          fullWidth
          size="small"
          onMouseDown={(event) => event.stopPropagation()}
          onFocus={() => {
            setIsFocused(true);
          }}
          onBlur={() => {
            setIsFocused(false);
          }}
        />
        <Typography variant="label-sm-rg" sx={{ width: '100%', color: color.White64_T, mt: 1 }}>
          {t(I18N_KEYS.RECIPE_MAIN.NODES.PROMPT_NODE_V2.NEGATIVE_PROMPT_LABEL)}
        </Typography>
        <NodeTextField
          id={`negative-prompt1-${id}`}
          className={isFocused ? 'nowheel nodrag nopan' : ''}
          value={negativePrompt}
          onChange={onNegativePromptChange}
          placeholder={t(I18N_KEYS.RECIPE_MAIN.NODES.PROMPT_NODE_V2.NEGATIVE_PROMPT_PLACEHOLDER)}
          multiline
          minRows={3}
          maxRows={10}
          fullWidth
          size="small"
          onMouseDown={(event) => event.stopPropagation()}
          onFocus={() => {
            setIsFocused(true);
          }}
          onBlur={() => {
            setIsFocused(false);
          }}
        />
      </FlexCol>
    </DynamicNode2>
  );
}

export default PromptNodeV2;
