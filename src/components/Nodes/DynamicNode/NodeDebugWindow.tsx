import { Box } from '@mui/material';
import JsonView from 'react18-json-view';
import { color } from '@/colors';
import 'react18-json-view/src/style.css';
import 'react18-json-view/src/dark.css';

export const DynamicNodeDebugWindow = ({ data }) => {
  return (
    <Box
      className="nodrag nopan nowheel"
      sx={{
        position: 'absolute',
        top: '100%',
        mt: 1,
        width: 500,
        maxHeight: 500,
        backgroundColor: color.Black92,
        p: 2,
        borderRadius: 2,
        overflow: 'auto',
        '& .json-view': {
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          userSelect: 'text',
        },
      }}
    >
      node.data:
      <JsonView
        src={data}
        dark
        theme="vscode"
        enableClipboard={false}
        displaySize="collapsed"
        displayArrayIndex={false}
        collapseStringsAfterLength={150}
        collapseObjectsAfterLength={2}
        editable={false}
      />
    </Box>
  );
};
