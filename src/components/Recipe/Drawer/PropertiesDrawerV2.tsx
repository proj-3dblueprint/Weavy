import { Box, Grid2 as Grid } from '@mui/material';
import { useMemo } from 'react';
import { FlexCenVer } from '@/UI/styles';
import { color, EL_COLORS } from '@/colors';
import { CreditsInfo } from '../FlowComponents/CreditsInfo/CreditsInfo';
import { useNodes } from '../FlowContext';
import { NodeProperties } from './NodeProperties';
import { RunModelsSection } from './RunModelsSection';
import type { NodeDataWithParams } from '@/types/node';

interface PropertiesDrawerProps {
  updateNodeData: (nodeId: string, data: Partial<NodeDataWithParams>) => void;
}

function PropertiesDrawer({ updateNodeData }: PropertiesDrawerProps) {
  const nodes = useNodes();
  const selectedNodes = useMemo(() => nodes.filter((n) => n.selected), [nodes]);
  return (
    <Box
      sx={{
        height: '100%',
        overflowY: 'auto',
        backgroundColor: color.Black92,
        borderLeft: `1px solid ${EL_COLORS.BoxBorder}`,
      }}
    >
      {selectedNodes.length && (
        <Grid container direction="column" sx={{ height: '100%' }}>
          <Grid size="auto">
            <FlexCenVer
              data-testid="properties-title"
              sx={{
                borderBottom: `1px solid ${EL_COLORS.BoxBorder}`,
                pl: 1.5,
                pr: 2,
                height: '84px',
              }}
            >
              <CreditsInfo isPaperBg={false} />
            </FlexCenVer>
          </Grid>
          <Grid size="grow" sx={{ overflowY: 'auto' }}>
            <Box sx={{ p: selectedNodes.length > 1 ? 0 : 2 }}>
              {selectedNodes.map((node) => {
                return (
                  <NodeProperties
                    key={node.id}
                    node={node}
                    selectedNodes={selectedNodes}
                    updateNodeData={updateNodeData}
                  />
                );
              })}
            </Box>
          </Grid>

          {selectedNodes.some((node) => node.isModel) ? (
            <Grid
              size="auto"
              sx={{
                width: '100%',
                borderTop: `1px solid ${color.White40_T}`,
              }}
            >
              <RunModelsSection />
            </Grid>
          ) : null}
        </Grid>
      )}
    </Box>
  );
}

export default PropertiesDrawer;
