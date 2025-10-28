import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useCompositorView } from '@/components/Recipe/FlowContext';
import { FlipHorizontalIcon, FlipVerticalIcon } from '@/UI/Icons';
import type { MouseEvent } from 'react';
import type { NodeId, LayerId, Orientation } from '@/designer/designer';

export const FlipLayerButtons = ({ layerId, nodeId }: { layerId: LayerId; nodeId: NodeId }) => {
  const compositorView = useCompositorView(nodeId);
  const handleFlip = (_event: MouseEvent, value: Orientation | null) =>
    value && compositorView.flipLayer(layerId, value);

  return (
    <ToggleButtonGroup value={null} exclusive onChange={handleFlip} size="small">
      <LayerToggleButton value="horizontal">
        <FlipHorizontalIcon />
      </LayerToggleButton>
      <LayerToggleButton value="vertical">
        <FlipVerticalIcon />
      </LayerToggleButton>
    </ToggleButtonGroup>
  );
};

const LayerToggleButton = styled(ToggleButton)(() => ({
  height: '26px',
  padding: '6px',
}));
