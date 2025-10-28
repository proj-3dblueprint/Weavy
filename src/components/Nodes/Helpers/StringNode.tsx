import { NodeId } from 'web';
import { ChangeEvent, useCallback, useState } from 'react';
import { Flex } from '@/UI/styles';
import { NodeTextField } from '@/UI/NodeTextField/NodeTextField';
import { useUserWorkflowRole } from '@/state/workflow.state';
import { DynamicNode2 } from '@/components/Nodes/DynamicNode/DynamicNode2';
import { colorMap } from '@/colors';
import { TextData } from '@/types/node';
import { useTextView } from '@/components/Recipe/FlowContext';

export function StringNode({ id, data }: { id: NodeId; data: TextData }) {
  const role = useUserWorkflowRole();
  const editable = data.isLocked !== true && role === 'editor';
  const view = useTextView(id);
  const { value } = data;

  const [hasFocus, setHasFocus] = useState(false);
  const handleFocus = useCallback(() => setHasFocus(true), []);
  const handleBlur = useCallback(() => setHasFocus(false), []);

  const handleChange = useCallback(
    (evt: ChangeEvent<HTMLInputElement>) => void view.setText(evt.target.value, false),
    [view],
  );

  return (
    <DynamicNode2 id={id} data={data} className="prompt" handleColor={colorMap.get('Yambo_Green')}>
      <Flex className="nodrag">
        <NodeTextField
          className={hasFocus ? 'nodrag nowheel' : ''}
          disabled={!editable}
          value={value}
          placeholder="Text here..."
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
      </Flex>
    </DynamicNode2>
  );
}
