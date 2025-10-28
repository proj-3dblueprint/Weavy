import { Box, TextField } from '@mui/material';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserWorkflowRole } from '@/state/workflow.state';
import { I18N_KEYS } from '../../language/keys';
import { DynamicNode2 } from './DynamicNode/DynamicNode2';
import type { BaseNodeData } from '@/types/node';

interface StickyNoteNodeData extends BaseNodeData {
  result: {
    note: string;
  };
}

interface StickyNoteNodeProps {
  id: string;
  data: StickyNoteNodeData;
  updateNodeData: (id: string, data: Partial<StickyNoteNodeData>) => void;
}

function StickyNoteNode({ id, data, updateNodeData }: StickyNoteNodeProps) {
  const { t } = useTranslation();
  const role = useUserWorkflowRole();

  const [isFocused, setIsFocused] = useState(false);

  const onNoteChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const updatedNote = event.target.value;
      updateNodeData(id, { result: { note: updatedNote } });
    },
    [id, updateNodeData],
  );

  return (
    <DynamicNode2
      id={id}
      data={data}
      hideTitle
      sx={{
        backgroundColor: 'var(--Purple_Lilac)',
        border: 'none',
        padding: 2,
        borderRadius: 0,
        width: '200px',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          width: '100%',
          pointerEvents: role === 'guest' ? 'none' : '',
        }}
      >
        <TextField
          className={isFocused ? 'nowheel nodrag nopan' : ''}
          onFocus={() => {
            setIsFocused(true);
          }}
          onBlur={() => {
            setIsFocused(false);
          }}
          value={data?.result?.note || ''}
          onChange={onNoteChange}
          multiline
          placeholder={t(I18N_KEYS.RECIPE_MAIN.NODES.STICKY_NOTE.PLACEHOLDER)}
          minRows={10}
          fullWidth
          size="small"
          onMouseDown={(event) => event.stopPropagation()}
          slotProps={{
            input: {
              sx: {
                p: 0,
                color: 'var(--Black100)',
                '&::placeholder': {
                  color: 'var(--Black40_T)',
                  opacity: 1,
                },
              },
            },
          }}
          sx={{
            p: 0,
            '& .MuiOutlinedInput-notchedOutline': {
              border: 'none', // Removes the border
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              border: 'none', // Removes the border on hover
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              border: 'none', // Removes the border on focus
            },
          }}
        />
      </Box>
    </DynamicNode2>
  );
}

export default StickyNoteNode;
