import { useMemo, useEffect } from 'react';
import { Divider, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { color } from '@/colors';
import { useCompositorView, useNodeData, useFlowState } from '@/components/Recipe/FlowContext';
import { I18N_KEYS } from '@/language/keys';
import { FlexCenVer, FlexCol } from '@/UI/styles';
import { PANEL_WIDTH } from '@/components/Recipe/consts/ui';
import { LayerPanelRow } from './LayerPanelRow';
import { DnDWrapper } from './DnDWrapper';
import type { NodeId } from 'web';
import type { CompositorNodeV3 } from '@/types/nodes/compositor';

interface LayerPanelProps {
  nodeId: NodeId;
}

export function LayerPanel({ nodeId }: LayerPanelProps) {
  const {
    name,
    data: { layers, layerOrder },
  } = useNodeData<CompositorNodeV3>(nodeId);
  const selectedLayer = useFlowState((s) => s.compositor[nodeId]?.selectedLayer);

  const compositorView = useCompositorView(nodeId);
  const { t } = useTranslation();

  useEffect(() => {
    return monitorForElements({
      onDrop({ source, location }) {
        const destination = location.current.dropTargets[0];
        if (destination == null) return;
        const destinationIndex = destination.data.index;
        const sourceDragKey = source.data.dragKey;
        const sourceIndex = source.data.index;

        if (
          typeof destinationIndex !== 'number' ||
          typeof sourceDragKey !== 'number' ||
          typeof sourceIndex !== 'number'
        ) {
          return;
        }
        if (destinationIndex === sourceIndex) return;
        compositorView.setLayerOrder(sourceDragKey, destinationIndex);
      },
    });
  }, [compositorView]);

  const reversedLayerOrder = useMemo(() => [...layerOrder].reverse(), [layerOrder]);

  return (
    <FlexCol
      data-testid="compositor-layers-panel"
      className="compositor-panel"
      sx={{
        background: color.Black92,
        border: `1px solid ${color.White08_T}`,
        borderLeft: 'none',
        height: '100%',
        flexShrink: 0,
        gap: 2,
        overflow: 'hidden',
        py: 2,
        width: PANEL_WIDTH,
      }}
    >
      <>
        <Typography sx={{ px: 2, display: 'flex', alignItems: 'center', height: '40px' }} variant="body-std-md">
          <Typography variant="body-std-md">{name}</Typography>
        </Typography>
        <Divider sx={{ borderColor: color.White08_T }} />
      </>

      <FlexCol
        sx={{
          gap: 2,
          px: 2,
        }}
      >
        <FlexCenVer
          data-testid="compositor-layers-panel-header"
          sx={{
            width: '100%',
          }}
        >
          <Typography variant="body-sm-md">{t(I18N_KEYS.COMPOSITOR.LAYER_PANEL.TITLE)}</Typography>
        </FlexCenVer>
        <FlexCol>
          {/* canvas row */}
          <LayerPanelRow isSelected={selectedLayer === undefined} nodeId={nodeId} />
          {reversedLayerOrder.map((layerId, reversedIndex) =>
            layers[layerId] ? (
              <DnDWrapper key={layerId} dragKey={layerId} index={reversedLayerOrder.length - reversedIndex - 1}>
                <LayerPanelRow
                  isSelected={selectedLayer === layerId}
                  layer={layers[layerId]}
                  layerId={layerId}
                  nodeId={nodeId}
                />
              </DnDWrapper>
            ) : null,
          )}
        </FlexCol>
      </FlexCol>
    </FlexCol>
  );
}
