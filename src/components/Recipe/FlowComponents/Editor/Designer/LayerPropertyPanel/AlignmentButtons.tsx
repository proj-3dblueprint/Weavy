import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useCompositorView } from '@/components/Recipe/FlowContext';
import {
  AlignBottomIcon,
  AlignCenterHorizontalIcon,
  AlignCenterVerticalIcon,
  AlignLeftIcon,
  AlignRightIcon,
  AlignTopIcon,
} from '@/UI/Icons';
import type { MouseEvent } from 'react';
import type { NodeId, LayerId, Alignment } from 'web';

export const AlignmentButtons = ({ layerId, nodeId }: { layerId: LayerId; nodeId: NodeId }) => {
  const compositorView = useCompositorView(nodeId);
  const handleAlign = (_event: MouseEvent, value: Alignment | null) =>
    value && compositorView.alignLayer(layerId, value);

  return (
    <>
      <ToggleButtonGroup value={null} exclusive onChange={handleAlign} size="small">
        <LayerToggleButton value="left">
          <AlignLeftIcon width="16" height="16" />
        </LayerToggleButton>
        <LayerToggleButton value="center-horizontal">
          <AlignCenterHorizontalIcon width="16" height="16" />
        </LayerToggleButton>
        <LayerToggleButton value="right">
          <AlignRightIcon width="16" height="16" />
        </LayerToggleButton>
      </ToggleButtonGroup>

      <ToggleButtonGroup value={null} exclusive onChange={handleAlign} size="small">
        <LayerToggleButton value="top">
          <AlignTopIcon width="16" height="16" />
        </LayerToggleButton>
        <LayerToggleButton value="center-vertical">
          <AlignCenterVerticalIcon width="16" height="16" />
        </LayerToggleButton>
        <LayerToggleButton value="bottom">
          <AlignBottomIcon width="16" height="16" />
        </LayerToggleButton>
      </ToggleButtonGroup>
    </>
  );
};

const LayerToggleButton = styled(ToggleButton)(() => ({
  height: '26px',
  padding: '6px',
}));
