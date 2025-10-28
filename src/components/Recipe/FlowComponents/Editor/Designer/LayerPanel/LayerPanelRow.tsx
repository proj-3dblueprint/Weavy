import { useCallback } from 'react';
import { color } from '@/colors';
import { useCompositorView } from '@/components/Recipe/FlowContext';
import { FlexCenVer } from '@/UI/styles';
import { CanvasLayerRow, LayerRow } from './LayerPanelRowTypes';
import type { UILayer } from '@/types/nodes/compositor';
import type { LayerId, NodeId } from 'web';

interface LayerPanelRowCanvasProps {
  isSelected: boolean;
  layer?: undefined;
  layerId?: LayerId;
  nodeId: NodeId;
}

interface LayerPanelRowImageTextProps {
  isSelected: boolean;
  layer: UILayer;
  layerId: LayerId;
  nodeId: NodeId;
}

type LayerPanelRowProps = LayerPanelRowCanvasProps | LayerPanelRowImageTextProps;

export function LayerPanelRow({ layerId, layer, nodeId, isSelected }: LayerPanelRowProps) {
  const compositorView = useCompositorView(nodeId);

  const handleClick = useCallback(() => {
    compositorView.setSelectedLayerId(layerId);
  }, [compositorView, layerId]);

  const isCanvasLayer = layer === undefined;

  return (
    <FlexCenVer
      id={`comp-layer-container-${layer?.name ?? 'canvas'}`}
      sx={{
        backgroundColor: isSelected ? color.Yellow16_T : 'inherit',
        borderRadius: '2px',
        cursor: 'pointer',
        pl: isCanvasLayer ? 0 : 3,
        transition: 'background-color 0.1s ease-in-out',
        '&:hover': {
          backgroundColor: color.Black84,
        },
      }}
      onClick={handleClick}
    >
      {isCanvasLayer ? <CanvasLayerRow /> : <LayerRow layer={layer} layerId={layerId} nodeId={nodeId} />}
    </FlexCenVer>
  );
}
