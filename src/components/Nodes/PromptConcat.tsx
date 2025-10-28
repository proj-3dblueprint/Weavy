import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { Box, TextFieldProps } from '@mui/material';
import { useUpdateNodeInternals } from 'reactflow';
import { useTranslation } from 'react-i18next';
import { NodeTextField } from '@/UI/NodeTextField/NodeTextField';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { ButtonContained } from '@/UI/Buttons/AppButton';
import { FlexCol } from '@/UI/styles';
import { PromptConcatenatorData } from '@/types/node';
import { useUserWorkflowRole } from '@/state/workflow.state';
import { usePromptConcatView } from '../Recipe/FlowContext';
import { hasEditingPermissions } from './Utils';
import { DynamicNode2 } from './DynamicNode/DynamicNode2';

interface PromptConcatProps {
  id: string;
  data: PromptConcatenatorData & { output?: { prompt: string } };
}

function PromptConcat({ id, data }: PromptConcatProps) {
  const { t } = useTranslation();
  const role = useUserWorkflowRole();
  const view = usePromptConcatView(id);
  const { handles, additionalPrompt, inputNodes } = data;

  const [hasFocus, setHasFocus] = useState(false);
  const handleFocus = useCallback(() => setHasFocus(true), []);
  const handleBlur = useCallback(() => setHasFocus(false), []);

  const handleChange = useCallback(
    (evt: ChangeEvent<HTMLInputElement>) => void view.setAdditionalPrompt(evt.target.value, false),
    [view],
  );

  const updateNodeInternals = useUpdateNodeInternals();
  useEffect(() => {
    // this is to update the node internals when the input handles are exposed
    updateNodeInternals(id);
  }, [handles.input, id, updateNodeInternals]);

  // use the output for now, only if there is some input to the node
  const combinedPrompt = inputNodes?.some(([_, value]) => value) ? data.output?.prompt || '' : '';

  return (
    <DynamicNode2 id={id} data={data} className="prompt">
      <Box sx={{ pointerEvents: 'auto' }}>
        <FlexCol
          sx={{
            alignItems: 'flex-end',
            width: '100%',
            cursor: !hasEditingPermissions(role, data) ? 'default' : '',
            pointerEvents: !hasEditingPermissions(role, data) ? 'none' : 'auto',
          }}
        >
          <Box sx={{ position: 'relative', width: '100%' }}>
            <NodeTextField
              expandable={true}
              value={combinedPrompt}
              placeholder={t(I18N_KEYS.RECIPE_MAIN.NODES.PROMPT_CONCAT.PLACEHOLDER)}
              multiline
              minRows={3}
              fullWidth
              size="small"
              color={color.White64_T as TextFieldProps['color']}
              slotProps={{
                input: {
                  readOnly: true,
                },
              }}
              id={`concat1-${id}`}
            />
          </Box>
          <NodeTextField
            className={hasFocus ? 'nodrag nowheel' : ''}
            value={additionalPrompt}
            placeholder={t(I18N_KEYS.RECIPE_MAIN.NODES.PROMPT_CONCAT.ADDITIONAL_TEXT_PLACEHOLDER)}
            multiline
            minRows={3}
            maxRows={20}
            fullWidth
            size="small"
            id={`concat2-${id}`}
            sx={{ mt: 1 }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
          />
        </FlexCol>
        <Box sx={{ mt: 2, transition: 'all 0.1s ease-in-out' }}>
          {/* TODO: add the old method of adding input handles */}
          {/* TODO2: What to do with the performance of the new node? */}
          <ButtonContained mode="text" size="small" onClick={() => view.addInputHandle()}>
            {t(I18N_KEYS.RECIPE_MAIN.NODES.PROMPT_CONCAT.ADD_ANOTHER_TEXT_INPUT)}
          </ButtonContained>
        </Box>
      </Box>
    </DynamicNode2>
  );
}

export default PromptConcat;
