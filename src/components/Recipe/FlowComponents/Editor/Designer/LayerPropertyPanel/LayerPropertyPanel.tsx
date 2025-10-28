import { Divider, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { color } from '@/colors';
import { I18N_KEYS } from '@/language/keys';
import { FlexCenVer, FlexCol } from '@/UI/styles';
import { TextIcon } from '@/UI/Icons/TextIcon';
import { ImageIcon } from '@/UI/Icons/ImageIcon';
import { PANEL_WIDTH } from '@/components/Recipe/consts/ui';
import { useFlowState, useNodeData } from '@/components/Recipe/FlowContext';
import { imageLayerPropertyLayout, textLayerPropertyLayout } from './layerProperties';
import { LayerPropertiesSection } from './LayerPropertySection';
import { CanvasLayerProperties } from './CanvasLayerProperties';
import type { NodeId } from 'web';
import type { CompositorNodeV3 } from '@/types/nodes/compositor';

interface LayerPropertiesPanelProps {
  nodeId: NodeId;
}

export function LayerPropertyPanel({ nodeId }: LayerPropertiesPanelProps) {
  const { t } = useTranslation();
  const { layers } = useNodeData<CompositorNodeV3>(nodeId).data;
  const layerId = useFlowState((s) => s.compositor[nodeId]?.selectedLayer);
  const layer = layerId !== undefined ? layers[layerId] : undefined;

  return (
    <FlexCol
      id="compositor-layers-panel"
      sx={{
        background: color.Black92,
        border: `1px solid ${color.White08_T}`,
        height: '100%',
        flexShrink: 0,
        overflow: 'hidden',
        width: PANEL_WIDTH,
      }}
    >
      <FlexCenVer
        sx={{
          width: '100%',
          px: 2,
          py: 2.5,
          gap: 1,
        }}
      >
        {layer?.kind.type === 'text' ? (
          <TextIcon style={{ width: 16, height: 16 }} />
        ) : layer?.kind.type === 'image' ? (
          <ImageIcon style={{ width: 16, height: 16 }} />
        ) : (
          <img src="/icons/canvas.svg" style={{ width: 16, height: 16 }} />
        )}
        <Typography variant="body-sm-md">
          {layer?.name ?? t(I18N_KEYS.COMPOSITOR.LAYER_PROPERTY_PANEL.CANVAS_LAYER_NAME)}
        </Typography>
      </FlexCenVer>
      <Divider sx={{ borderColor: color.White08_T }} />
      <FlexCol id="compositor-layers-panel-layers-container" sx={{ px: 2, gap: 2, overflow: 'auto', py: 2 }}>
        {layerId === undefined ? (
          <CanvasLayerProperties nodeId={nodeId} />
        ) : layer?.kind.type === 'text' ? (
          textLayerPropertyLayout.map((section, index) => {
            return (
              <LayerPropertiesSection key={index} index={index} section={section} nodeId={nodeId} layerId={layerId} />
            );
          })
        ) : (
          imageLayerPropertyLayout.map((section, index) => {
            return (
              <LayerPropertiesSection key={index} index={index} section={section} nodeId={nodeId} layerId={layerId} />
            );
          })
        )}
      </FlexCol>
    </FlexCol>
  );
}
