import React, { useEffect, useState } from 'react';
import { Box, FormControl, Select, MenuItem } from '@mui/material';
import { useUserWorkflowRole } from '@/state/workflow.state';
import { hasEditingPermissions } from './Utils';

function MuxCore({ id, data, updateNodeData }) {
  const role = useUserWorkflowRole();

  const [selected, setSelected] = useState(data.result || data.options?.[0] || '');
  const [options, _setOptions] = useState(data.options || []);

  useEffect(() => {
    updateNodeData(id, {
      result: selected,
      options: options,
      output: {
        type: 'text',
        [data.handles.output[0]]: selected,
      },
    });
  }, [selected]);

  return (
    <Box
      sx={{
        width: '100%',
        pointerEvents: !hasEditingPermissions(role, data) ? 'none' : '',
      }}
    >
      <FormControl fullWidth sx={{ mt: 1 }}>
        <Select
          labelId={`${id}-label`}
          id={id}
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          size="small"
        >
          {options.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}

export default MuxCore;
