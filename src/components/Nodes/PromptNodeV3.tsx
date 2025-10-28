import { ChangeEvent, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import JsonView from 'react18-json-view';
import { Box } from '@mui/material';
import { NodeTextField } from '@/UI/NodeTextField/NodeTextField';
import 'react18-json-view/src/style.css';
import 'react18-json-view/src/dark.css';
import '@/UI/JsonViewer/json-viewer.css';
import { I18N_KEYS } from '@/language/keys';
import { FlexCol, Flex } from '@/UI/styles';
import { color } from '@/colors';
import { AppToggleButtons } from '@/UI/AppToggleButtons/AppToggleButtons';
import { useUserWorkflowRole } from '@/state/workflow.state';
import { usePromptView } from '../Recipe/FlowContext';
import { DynamicNode2 } from './DynamicNode/DynamicNode2';
import { hasEditingPermissions } from './Utils';
import type { NodeId } from 'web';
import type { PromptData } from '@/types/node';

interface PromptNodeV3Props {
  id: NodeId;
  data: PromptData;
}

// Utility function to check if a string is valid JSON
function isValidJson(str: string): boolean {
  if (!str || typeof str !== 'string') {
    return false;
  }

  const trimmed = str.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return false;
  }

  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
}

export function PromptNodeV3({ id, data }: PromptNodeV3Props) {
  const { t } = useTranslation();
  const role = useUserWorkflowRole();
  const view = usePromptView(id);
  const { prompt } = data;

  const [hasFocus, setHasFocus] = useState(false);
  const [forceTextMode, setForceTextMode] = useState(false);
  const handleFocus = useCallback(() => setHasFocus(true), []);
  const handleBlur = useCallback(() => setHasFocus(false), []);

  const handleChange = useCallback(
    (evt: ChangeEvent<HTMLInputElement>) => void view.setPrompt(evt.target.value, false),
    [view],
  );

  const isJsonFormat = isValidJson(prompt) && !forceTextMode;

  return (
    <DynamicNode2 id={id} data={data} className="prompt">
      <FlexCol
        className="nodrag"
        sx={{
          alignItems: 'flex-end',
          width: '100%',
          cursor: !hasEditingPermissions(role, data) ? 'default' : '',
          pointerEvents: !hasEditingPermissions(role, data) ? 'none' : 'auto',
          position: 'relative',
        }}
      >
        {isValidJson(prompt) && hasEditingPermissions(role, data) && (
          <Flex
            data-testid="prompt-node-v3-format-toggle"
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              backgroundColor: color.Black92,
              p: 0.4,
              borderRadius: 1,
              zIndex: 2,
            }}
          >
            <AppToggleButtons
              value={isJsonFormat ? 'json' : 'text'}
              options={[
                { value: 'text', label: 'Text' },
                { value: 'json', label: 'JSON' },
              ]}
              onChange={(value) => setForceTextMode(value === 'text')}
              sx={{
                '& .MuiButtonBase-root.MuiToggleButton-root.Mui-selected': {
                  background: color.White64_T,
                  color: color.Black92,
                },
                '& .MuiButtonBase-root.MuiToggleButton-root.Mui-selected:hover': {
                  background: color.White80_T,
                  color: color.Black92,
                },
                '& .MuiButtonBase-root.MuiToggleButton-root:hover': {
                  background: color.White16_T,
                },
              }}
            />
          </Flex>
        )}
        {isJsonFormat ? (
          <Box
            sx={{
              width: '100%',
              overflow: 'auto',
              backgroundColor: color.Black84,
              border: `1px solid ${color.White08_T}`,
              borderRadius: 1,
              p: 1,
              pointerEvents: 'auto',
            }}
          >
            <JsonView
              src={JSON.parse(prompt)}
              dark
              theme="vscode"
              enableClipboard={false}
              displaySize="collapsed"
              displayArrayIndex={false}
              collapseStringsAfterLength={50}
              collapseObjectsAfterLength={5}
              editable={hasEditingPermissions(role, data)}
              onEdit={({ src }) => {
                // Convert the updated object back to a JSON string
                const updatedJsonString = JSON.stringify(src, null, 2);
                void view.setPrompt(updatedJsonString, false);
              }}
              onAdd={({ src }) => {
                const updatedJsonString = JSON.stringify(src, null, 2);
                void view.setPrompt(updatedJsonString, false);
              }}
              onDelete={({ src }) => {
                const updatedJsonString = JSON.stringify(src, null, 2);
                void view.setPrompt(updatedJsonString, false);
              }}
              onChange={({ src }) => {
                const updatedJsonString = JSON.stringify(src, null, 2);
                void view.setPrompt(updatedJsonString, false);
              }}
            />
          </Box>
        ) : (
          <NodeTextField
            id={`prompt1-${id}`}
            className={hasFocus ? 'nodrag nowheel' : ''}
            value={prompt}
            placeholder={t(I18N_KEYS.RECIPE_MAIN.NODES.PROMPT_NODE_V3.PLACEHOLDER)}
            multiline
            minRows={6}
            maxRows={20}
            fullWidth
            size="small"
            onMouseDown={(event) => event.stopPropagation()}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
          />
        )}
      </FlexCol>
    </DynamicNode2>
  );
}
